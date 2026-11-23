// Gruplar: arkadaşlarla yarış, öğretmen–öğrenci görev atama, birlikte pomodoro
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc, collection, onSnapshot, getDoc, setDoc, updateDoc, addDoc, deleteDoc, arrayUnion, arrayRemove, deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { useStore } from './store';
import { useUI } from './ui';
import { myStats, groupCode, rid, today, fmtD } from './logic';
import { getPushToken, sendPush, notifyNow, ring, scheduleOne, cancelOne } from './notifications';

const Ctx = createContext(null);
export const useGroups = () => useContext(Ctx);

export const GROUP_TYPES = { yaris: 'Arkadaşlarla yarış', ogretmen: 'Öğretmen – öğrenci' };

export function GroupsProvider({ children }) {
  const { st, update, user, configured } = useStore();
  const { toast } = useUI();
  const uid = user && user.uid;
  const codes = st.prefs.groups || [];
  const codesKey = codes.join(',');
  const name = (st.prefs.name || '').trim() || (user && user.email ? user.email.split('@')[0] : 'Ben');
  const [data, setData] = useState({});
  const [joined, setJoined] = useState({});
  const [token, setToken] = useState(null);
  const ref = useRef({ data, joined, uid, name, st });
  ref.current = { data, joined, uid, name, st };

  useEffect(() => { getPushToken().then(setToken); }, []);

  // ---- Firestore'dan dinle ----
  useEffect(() => {
    if (!configured || !uid || !codes.length) return undefined;
    const unsubs = [];
    for (const code of codes) {
      const set = (k, v) => setData((p) => ({ ...p, [code]: { ...(p[code] || {}), [k]: v } }));
      unsubs.push(onSnapshot(doc(db, 'groups', code), (s) => {
        if (!s.exists()) { set('missing', true); return; }
        const g = s.data();
        set('g', g);
        set('missing', !(g.members || []).includes(uid));
      }, () => set('missing', true)));
      unsubs.push(onSnapshot(collection(db, 'groups', code, 'members'),
        (q) => set('members', Object.fromEntries(q.docs.map((d) => [d.id, d.data()]))), () => {}));
      unsubs.push(onSnapshot(collection(db, 'groups', code, 'assign'),
        (q) => set('assign', q.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}));
    }
    return () => unsubs.forEach((u) => u());
  }, [configured, uid, codesKey]);

  // ---- kendi istatistiklerimi gruplara yayınla ----
  const stats = myStats(st);
  const statsKey = JSON.stringify([stats, name, token]);
  const published = useRef({});
  useEffect(() => {
    if (!configured || !uid || !codes.length) return undefined;
    const id = setTimeout(async () => {
      for (const code of codes) {
        if (published.current[code] === statsKey) continue;
        try {
          await setDoc(doc(db, 'groups', code, 'members', uid), { ...stats, name, token: token || null, t: Date.now() }, { merge: true });
          published.current[code] = statsKey;
        } catch (e) { /* üyelik henüz onaylanmadı olabilir */ }
      }
    }, 2500);
    return () => clearTimeout(id);
  }, [statsKey, codesKey, configured, uid]);

  // ---- öğretmenin atadığı görevleri kendi görevlerime yansıt ----
  const mine = [];
  for (const code of codes) {
    const D = data[code];
    if (!D || !D.g || D.missing || D.g.type !== 'ogretmen' || D.g.owner === uid || !D.assign) continue;
    for (const a of D.assign) if (a.to === 'all' || a.to === uid) mine.push({ code, gname: D.g.name, a });
  }
  const loadedCodes = codes.filter((c) => data[c] && data[c].assign && data[c].g);
  const mirrorKey = JSON.stringify([mine.map((m) => [m.code, m.a.id, m.a.title, m.a.p, m.a.end, m.a.rTime, m.a.note, !!(m.a.done && m.a.done[uid])]), loadedCodes, codesKey]);
  useEffect(() => {
    if (!uid) return;
    update('tasks', (d) => {
      const wantKeys = new Set(mine.map((m) => m.code + '/' + m.a.id));
      // grubu bıraktıysam ya da görev silindiyse kaldır
      d.items = d.items.filter((x) => {
        if (x.ext !== 'grp') return true;
        const code = String(x.extKey).split('/')[0];
        if (!codes.includes(code)) return false;
        if (!loadedCodes.includes(code)) return true;
        return wantKeys.has(x.extKey);
      });
      d.cats = d.cats.filter((c) => !c.id.startsWith('g-') || codes.includes(c.id.slice(2)));
      for (const m of mine) {
        const key = m.code + '/' + m.a.id, catId = 'g-' + m.code;
        const cat = d.cats.find((c) => c.id === catId);
        if (!cat) d.cats.push({ id: catId, name: m.gname });
        else if (cat.name !== m.gname) cat.name = m.gname;
        const v = {
          title: m.a.title, p: m.a.p || 2, end: m.a.end || '', rDate: '', rTime: m.a.rTime || '',
          note: 'Öğretmen: ' + (m.a.byName || '') + (m.a.note ? ' · ' + m.a.note : ''),
        };
        const x = d.items.find((y) => y.ext === 'grp' && y.extKey === key);
        if (x) Object.assign(x, v);
        else d.items.push({ id: rid(), ext: 'grp', extKey: key, cat: catId, done: !!(m.a.done && m.a.done[uid]), doneOn: [], start: today(), ...v });
      }
    });
    // Anlık bildirim kurulu değilse yeni görevi burada haber ver
    (async () => {
      try {
        const seen = new Set(JSON.parse((await AsyncStorage.getItem('pl-seen-assign')) || '[]'));
        let changed = false;
        for (const m of mine) {
          const key = m.code + '/' + m.a.id;
          if (seen.has(key)) continue;
          seen.add(key);
          changed = true;
          if (!token && m.a.created && Date.now() - m.a.created < 3 * 864e5) notifyNow('Yeni görev: ' + m.a.title, m.gname + (m.a.end ? ' · son gün ' + fmtD(m.a.end) : ''));
        }
        if (changed) await AsyncStorage.setItem('pl-seen-assign', JSON.stringify([...seen].slice(-500)));
      } catch (e) { /* yok say */ }
    })();
  }, [mirrorKey, uid]);

  // ---- grup işlemleri ----
  const addCode = (code) => update('prefs', (d) => { if (!d.groups.includes(code)) d.groups.push(code); });
  const dropCode = (code) => update('prefs', (d) => { d.groups = d.groups.filter((c) => c !== code); });

  const create = useCallback(async ({ name: gname, type, modules, pomo }) => {
    if (!configured || !uid) return 'Grup için eşitleme ve giriş gerekli.';
    try {
      let code = groupCode();
      for (let i = 0; i < 5; i++) { const s = await getDoc(doc(db, 'groups', code)); if (!s.exists()) break; code = groupCode(); }
      await setDoc(doc(db, 'groups', code), {
        name: gname, type, modules, pomo: !!pomo, owner: uid, members: [uid],
        names: { [uid]: ref.current.name }, roles: { [uid]: type === 'ogretmen' ? 'teacher' : 'member' },
        created: Date.now(), timer: null, work: 25, brk: 5,
      });
      addCode(code);
      return { code };
    } catch (e) {
      return 'Grup kurulamadı. Firebase kurallarını güncellediğinden emin ol (README).';
    }
  }, [configured, uid]);

  const join = useCallback(async (raw) => {
    if (!configured || !uid) return 'Gruba katılmak için eşitleme ve giriş gerekli.';
    const code = String(raw || '').trim().toUpperCase();
    if (code.length < 5) return 'Grup kodunu yaz.';
    try {
      const s = await getDoc(doc(db, 'groups', code));
      if (!s.exists()) return 'Bu kodla bir grup bulunamadı.';
      const g = s.data();
      if (!(g.members || []).includes(uid)) {
        await updateDoc(doc(db, 'groups', code), {
          members: arrayUnion(uid),
          ['names.' + uid]: ref.current.name,
          ['roles.' + uid]: g.type === 'ogretmen' ? 'student' : 'member',
        });
      }
      addCode(code);
      return { code, name: g.name };
    } catch (e) {
      return 'Gruba katılınamadı. Firebase kurallarını güncellediğinden emin ol (README).';
    }
  }, [configured, uid]);

  const leave = useCallback(async (code) => {
    try {
      await deleteDoc(doc(db, 'groups', code, 'members', uid)).catch(() => {});
      await updateDoc(doc(db, 'groups', code), { members: arrayRemove(uid), ['names.' + uid]: deleteField(), ['roles.' + uid]: deleteField() });
    } catch (e) { /* grup silinmiş olabilir */ }
    cancelOne('gpomo' + code);
    dropCode(code);
  }, [uid]);

  const remove = useCallback(async (code) => {
    try { await deleteDoc(doc(db, 'groups', code)); } catch (e) { /* yok say */ }
    cancelOne('gpomo' + code);
    dropCode(code);
  }, []);

  const kick = useCallback(async (code, who) => {
    try {
      await deleteDoc(doc(db, 'groups', code, 'members', who)).catch(() => {});
      await updateDoc(doc(db, 'groups', code), { members: arrayRemove(who), ['names.' + who]: deleteField(), ['roles.' + who]: deleteField() });
    } catch (e) { toast('Çıkarılamadı'); }
  }, [toast]);

  const tokensOf = (code, filter) => {
    const D = ref.current.data[code] || {};
    return Object.entries(D.members || {}).filter(([id, m]) => id !== ref.current.uid && filter(id, m)).map(([, m]) => m.token).filter(Boolean);
  };

  const assign = useCallback(async (code, v) => {
    const D = ref.current.data[code] || {};
    try {
      await addDoc(collection(db, 'groups', code, 'assign'), { ...v, by: uid, byName: ref.current.name, created: Date.now(), done: {} });
      const toks = tokensOf(code, (id) => v.to === 'all' || v.to === id);
      const ok = await sendPush(toks, 'Yeni görev: ' + v.title, ((D.g && D.g.name) || 'Grup') + (v.end ? ' · son gün ' + fmtD(v.end) : ''), { kind: 'assign', code });
      return { pushed: ok && toks.length };
    } catch (e) {
      return 'Görev atanamadı.';
    }
  }, [uid]);

  const delAssign = useCallback(async (code, id) => {
    try { await deleteDoc(doc(db, 'groups', code, 'assign', id)); } catch (e) { toast('Silinemedi'); }
  }, [toast]);

  const markAssign = useCallback(async (extKey, done) => {
    const [code, id] = String(extKey).split('/');
    try { await updateDoc(doc(db, 'groups', code, 'assign', id), { ['done.' + uid]: !!done }); } catch (e) { /* yok say */ }
  }, [uid]);

  // ---- birlikte pomodoro ----
  const setTimer = (code, timer, extra) => updateDoc(doc(db, 'groups', code), { timer, ...(extra || {}) }).catch(() => toast('Sayaç güncellenemedi'));
  const pomo = {
    toggle: (code) => {
      const D = ref.current.data[code]; if (!D || !D.g) return;
      const g = D.g, T = g.timer, now = Date.now(), w = (g.work || 25) * 60000;
      setJoined((p) => ({ ...p, [code]: true }));
      if (!T) {
        setTimer(code, { phase: 'w', run: true, end: now + w, dur: w, cyc: 0, by: uid });
        sendPush(tokensOf(code, () => true), g.name + ': birlikte çalışma başladı', ref.current.name + ' sayacı başlattı. Katılmak için gruba gir.', { kind: 'gpomo', code });
      } else if (T.run) setTimer(code, { ...T, run: false, left: Math.max(0, T.end - now), by: uid });
      else setTimer(code, { ...T, run: true, end: now + (T.left || 0), by: uid });
    },
    reset: (code) => setTimer(code, null),
    skip: (code) => {
      const D = ref.current.data[code]; if (!D || !D.g || !D.g.timer) return;
      advance(code, D.g, false);
    },
    setDur: (code, work, brk) => updateDoc(doc(db, 'groups', code), { work, brk }).catch(() => {}),
  };
  const setJoin = (code, v) => setJoined((p) => ({ ...p, [code]: v }));

  function advance(code, g, counted) {
    const T = g.timer, next = T.phase === 'w' ? 'b' : 'w';
    const dur = (next === 'w' ? g.work || 25 : g.brk || 5) * 60000;
    setTimer(code, { phase: next, run: true, end: Date.now() + dur, dur, cyc: (T.cyc || 0) + (T.phase === 'w' && counted ? 1 : 0), by: uid });
  }

  // Süre dolunca: zil + çalışma süresini kaydet; sayacı başlatan telefon sonraki tura geçirir
  const rung = useRef({}), moved = useRef({});
  useEffect(() => {
    const iv = setInterval(() => {
      const { data: DD, joined: J, uid: me } = ref.current;
      for (const code of Object.keys(DD)) {
        const g = DD[code] && DD[code].g, T = g && g.timer;
        if (!T || !T.run || !T.end || Date.now() < T.end) continue;
        if (J[code] && rung.current[code] !== T.end) {
          rung.current[code] = T.end;
          ring();
          toast(g.name + ': ' + (T.phase === 'w' ? 'çalışma bitti, mola!' : 'mola bitti, çalışmaya dön!'));
          if (T.phase === 'w') {
            const mins = Math.round((T.dur || 25 * 60000) / 60000);
            update('study', (S) => {
              const d = today(), L = S.log[d] || (S.log[d] = { m: 0, n: 0, by: {} });
              L.m += mins; L.n += 1; L.by = L.by || {};
              const k = 'Grup: ' + g.name; L.by[k] = (L.by[k] || 0) + mins;
            });
          }
        }
        if (moved.current[code] !== T.end && (T.by === me || Date.now() - T.end > 5000)) {
          moved.current[code] = T.end;
          advance(code, g, true);
        }
      }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Katıldığım grup sayacı için arka planda da zil çalsın
  const timersKey = JSON.stringify(codes.map((c) => [c, !!joined[c], data[c] && data[c].g && data[c].g.timer]));
  useEffect(() => {
    for (const code of codes) {
      const g = data[code] && data[code].g, T = g && g.timer;
      if (joined[code] && T && T.run) scheduleOne('gpomo' + code, T.end, g.name + (T.phase === 'w' ? ': çalışma bitti' : ': mola bitti'), T.phase === 'w' ? 'Mola zamanı!' : 'Çalışmaya dön!');
      else cancelOne('gpomo' + code);
    }
  }, [timersKey]);

  const list = useMemo(() => codes.map((code) => ({ code, ...(data[code] || {}) })), [codesKey, data]);
  const value = { list, uid, name, token, create, join, leave, remove, kick, assign, delAssign, markAssign, pomo, joined, setJoin };
  return React.createElement(Ctx.Provider, { value }, children);
}
