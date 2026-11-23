// Uygulama verisi: cihazda (AsyncStorage) önbellek + Firebase ile telefon–bilgisayar eşitlemesi.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, configured } from './firebase';
import { KEYS, norm, emptyState, rid, pruneFood } from './logic';
import { THEMES } from './theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch (e) { /* yeni mimaride gerekmez */ }
}
const softAnim = (st) => {
  const th = THEMES[(st.prefs || {}).theme];
  if (!th || !th.shape.soft || Platform.OS === 'web') return;
  try { LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity')); } catch (e) { /* yok say */ }
};

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const authError = (e) => {
  const c = (e && e.code) || '';
  if (c.includes('invalid-email')) return 'E-posta adresi geçersiz.';
  if (c.includes('weak-password')) return 'Şifre en az 6 karakter olmalı.';
  if (c.includes('email-already-in-use')) return 'Bu e-posta ile zaten hesap var; giriş yap.';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found'))
    return 'E-posta ya da şifre yanlış.';
  if (c.includes('network')) return 'İnternet bağlantısı yok.';
  if (c.includes('too-many-requests')) return 'Çok fazla deneme yapıldı; biraz sonra tekrar dene.';
  if (c.includes('operation-not-allowed')) return 'Firebase\'de E-posta/Şifre girişi açık değil (README 2. adım).';
  return 'Bir sorun oluştu: ' + (c || (e && e.message) || 'bilinmiyor');
};

export function StoreProvider({ children }) {
  const [st, setSt] = useState(emptyState);
  const stRef = useRef(st);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(configured ? undefined : null); // undefined: bekleniyor
  const [status, setStatus] = useState(configured ? 'wait' : 'local');
  const [dev, setDev] = useState('');
  const dirty = useRef({}), busy = useRef({}), again = useRef({}), timers = useRef({});
  const uidRef = useRef(null);

  // 1) Cihazdaki önbelleği yükle
  useEffect(() => {
    (async () => {
      try {
        const pairs = await AsyncStorage.multiGet(KEYS.map((k) => 'pl-' + k).concat(['pl-mode', 'pl-dev']));
        const m = Object.fromEntries(pairs);
        const s = {};
        for (const k of KEYS) {
          let v = null;
          try { v = m['pl-' + k] ? JSON.parse(m['pl-' + k]) : null; } catch (e) { v = null; }
          s[k] = norm(k, v);
        }
        stRef.current = s;
        setSt(s);
        if (m['pl-mode'] && !m['pl-prefs']) s.prefs.mode = m['pl-mode'];
        let d = m['pl-dev'];
        if (!d) { d = rid(); AsyncStorage.setItem('pl-dev', d).catch(() => {}); }
        setDev(d);
      } catch (e) { /* önbellek yoksa boş başla */ }
      setReady(true);
    })();
  }, []);

  // 2) Oturum
  useEffect(() => {
    if (!configured) return undefined;
    return onAuthStateChanged(auth, (u) => setUser(u || null));
  }, []);

  // 3) Buluta yazma (her bölüm ayrı belge, aynı anda tek yazma)
  const flush = useCallback(async (k) => {
    if (!configured || !uidRef.current) { dirty.current[k] = false; return; }
    if (busy.current[k]) { again.current[k] = true; return; }
    busy.current[k] = true;
    dirty.current[k] = false;
    try {
      await setDoc(doc(db, 'users', uidRef.current, 'data', k), { v: JSON.stringify(stRef.current[k]), t: Date.now() });
    } catch (e) {
      setStatus('err');
    }
    busy.current[k] = false;
    if (again.current[k] || dirty.current[k]) { again.current[k] = false; flush(k); }
  }, []);

  // 4) Buluttan dinle
  useEffect(() => {
    if (!configured || !user || !ready) return undefined;
    uidRef.current = user.uid;
    setStatus('wait');
    const got = {};
    const t = setTimeout(() => setStatus((s) => (s === 'wait' ? 'slow' : s)), 10000);
    const unsubs = KEYS.map((k) =>
      onSnapshot(
        doc(db, 'users', user.uid, 'data', k),
        (snap) => {
          if (!snap.metadata.fromCache && !got[k]) {
            got[k] = true;
            if (KEYS.every((x) => got[x])) { clearTimeout(t); setStatus('on'); }
          }
          if (snap.exists()) {
            if (dirty.current[k] || busy.current[k] || snap.metadata.hasPendingWrites) return;
            let v = null;
            try { v = JSON.parse(snap.data().v); } catch (e) { return; }
            const val = norm(k, v);
            const next = { ...stRef.current, [k]: val };
            stRef.current = next;
            setSt(next);
            AsyncStorage.setItem('pl-' + k, JSON.stringify(val)).catch(() => {});
          } else if (!snap.metadata.fromCache) {
            // Bulutta henüz yok: bu cihazdaki veriyi yükle
            if (JSON.stringify(stRef.current[k]) !== JSON.stringify(norm(k, null))) {
              dirty.current[k] = true;
              flush(k);
            }
          }
        },
        () => { clearTimeout(t); setStatus('err'); },
      ),
    );
    return () => { clearTimeout(t); unsubs.forEach((u) => u()); };
  }, [user, ready, flush]);

  // Bir bölümü değiştir: update('tasks', d => { d.items.push(...) })
  const update = useCallback((k, fn) => {
    const cur = stRef.current;
    const draft = JSON.parse(JSON.stringify(cur[k]));
    const r = fn(draft);
    const val = norm(k, r === undefined ? draft : r);
    if (k === 'food') pruneFood(val);
    if (JSON.stringify(val) === JSON.stringify(cur[k])) return; // değişiklik yok
    const next = { ...cur, [k]: val };
    softAnim(next);
    stRef.current = next;
    setSt(next);
    AsyncStorage.setItem('pl-' + k, JSON.stringify(val)).catch(() => {});
    dirty.current[k] = true;
    clearTimeout(timers.current[k]);
    timers.current[k] = setTimeout(() => flush(k), 500);
  }, [flush]);

  const setThemeMode = useCallback((m) => update('prefs', (d) => { d.mode = m; }), [update]);
  const setTheme = useCallback((id) => update('prefs', (d) => { d.theme = id; }), [update]);

  const signIn = useCallback(async (email, pw) => {
    try { await signInWithEmailAndPassword(auth, email.trim(), pw); return null; } catch (e) { return authError(e); }
  }, []);
  const signUp = useCallback(async (email, pw) => {
    try { await createUserWithEmailAndPassword(auth, email.trim(), pw); return null; } catch (e) { return authError(e); }
  }, []);
  const resetPw = useCallback(async (email) => {
    try { await sendPasswordResetEmail(auth, email.trim()); return null; } catch (e) { return authError(e); }
  }, []);
  const signOut = useCallback(async () => {
    try { await fbSignOut(auth); } catch (e) { /* yok say */ }
    uidRef.current = null;
    await AsyncStorage.multiRemove(KEYS.map((k) => 'pl-' + k)).catch(() => {});
    const s = emptyState();
    stRef.current = s;
    setSt(s);
  }, []);

  // Eski planlayıcıdan dışa aktarılan JSON'u içe al
  const importData = useCallback((obj) => {
    let n = 0;
    for (const k of KEYS) {
      if (obj && obj[k] && typeof obj[k] === 'object') { update(k, () => obj[k]); n++; }
    }
    return n;
  }, [update]);

  const value = {
    st, ready, user, status, update, mode: st.prefs.mode, setThemeMode, setTheme, dev, configured,
    signIn, signUp, resetPw, signOut, importData,
  };
  return React.createElement(Ctx.Provider, { value }, children);
}
