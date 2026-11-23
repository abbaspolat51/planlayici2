// Birden çok ekranda kullanılan parçalar ve formlar
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from './store';
import { useTheme, alpha, priColor, priText } from './theme';
import {
  T, Mute, H2, H3, Card, Btn, Chip, Row, Field, TimeField, DateField, Seg, ColorPick, DayPick, Check,
  Sheet, FormFooter, Empty, ListRow, Bar, Switch, IconBtn, useUI,
} from './ui';
import {
  PRI, RC, BST, DN, today, fmtD, rid, isTime, isDate, toMin, dowOf, pad, leftInfo, tmState, tmDur, mmss,
  notifPlan, whenTxt,
} from './logic';
import { nativeNotifications, permission, testNotification } from './notifications';
import { useGroups } from './groups';

// Belirli aralıkla yeniden çizim
export function useNow(ms = 500) {
  const [, set] = useState(0);
  useEffect(() => {
    const i = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
  return Date.now();
}

// ---------- görev satırları ----------
const catName = (st, id) => (st.tasks.cats.find((c) => c.id === id) || { name: 'Genel' }).name;

// Satır: solda öncelik rengi şeridi, ortada başlık, sağda switch
function RowShell({ color, done, children, sw }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 2, borderRadius: t.rm, backgroundColor: t.card2, borderWidth: t.bw ? 1 : 0, borderColor: t.line, overflow: 'hidden', minHeight: 60 }}>
      <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: color, opacity: done ? 0.45 : 1 }} />
      {children}
      {sw}
    </View>
  );
}
function Meta({ items }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 2 }}>{items.filter(Boolean)}</View>;
}

export function TaskRow({ x, rank, inFolder }) {
  const t = useTheme();
  const { st, update } = useStore();
  const forms = useForms();
  const G = useGroups();
  const c = priColor(t, x.p), ct = priText(t, x.p), left = leftInfo(x);
  const cal = x.ext === 'cal';
  const rem = cal
    ? 'Telefon takvimi' + (isTime(x.rTime) ? ' · ' + x.rTime : '') + (x.alarms && x.alarms.length ? ' · ' + x.alarms.length + ' hatırlatıcı' : '')
    : isTime(x.rTime) ? 'Bildirim ' + (isDate(x.rDate) ? fmtD(x.rDate) + ' ' : '') + x.rTime : null;
  const toggle = () => {
    update('tasks', (d) => { const y = d.items.find((i) => i.id === x.id); if (y) { y.done = !y.done; y.doneAt = y.done ? today() : null; } });
    if (x.ext === 'grp' && G) G.markAssign(x.extKey, !x.done);
  };
  return (
    <RowShell color={c} done={x.done} sw={<Switch value={!!x.done} onChange={toggle} label={x.done ? 'Tamamlandı, geri al' : 'Tamamlandı olarak işaretle'} />}>
      <Pressable style={{ flex: 1, minHeight: 52, justifyContent: 'center', gap: 2, paddingVertical: 6 }} onPress={() => forms.open('task', x)}>
        <T s={15.5} w="600" c={x.done ? t.mute : t.ink} style={{ textDecorationLine: x.done ? 'line-through' : 'none' }}>{x.title}</T>
        <Meta items={[
          <Text key="p" style={{ fontSize: 13, fontWeight: '800', color: ct }}>{cal ? 'Etkinlik' : PRI[x.p]}</Text>,
          !inFolder && <Text key="c" style={{ fontSize: 13, color: t.mute }}>{catName(st, x.cat)}</Text>,
          (x.start || x.end) && <Text key="r" style={{ fontSize: 13, color: t.mute }}>{x.start && x.end && x.start === x.end ? fmtD(x.end) : (x.start ? fmtD(x.start) : '…') + ' → ' + (x.end ? fmtD(x.end) : '…')}</Text>,
          left && !cal && <Text key="l" style={{ fontSize: 13, fontWeight: left.n <= 2 ? '800' : '400', color: left.n < 0 ? t.red : left.n <= 2 ? t.yelT : t.mute }}>{left.text}</Text>,
          rem && <Text key="b" style={{ fontSize: 13, color: t.mute }}>{rem}</Text>,
          x.ext === 'grp' && <Text key="g" style={{ fontSize: 13, color: t.accT, fontWeight: '700' }}>{x.gtype === 'ekip' ? (x.byName ? x.byName + ' verdi' : 'Ekipten') : 'Öğretmen atadı'}</Text>,
        ]} />
      </Pressable>
    </RowShell>
  );
}

export function DailyRow({ x }) {
  const t = useTheme();
  const { update } = useStore();
  const forms = useForms();
  const td = today(), on = (x.doneOn || []).includes(td), c = priColor(t, x.p);
  return (
    <RowShell color={c} done={on} sw={<Switch value={on} label="Bugün yapıldı" onChange={() => update('tasks', (d) => {
        const y = d.items.find((i) => i.id === x.id); if (!y) return;
        const a = y.doneOn || []; const k = a.indexOf(td);
        if (k >= 0) a.splice(k, 1); else a.push(td);
        y.doneOn = a.slice(-120);
      })} />}>
      <Pressable style={{ flex: 1, minHeight: 52, justifyContent: 'center', gap: 2, paddingVertical: 6 }} onPress={() => forms.open('task', x)}>
        <T s={15.5} w="600" c={on ? t.mute : t.ink} style={{ textDecorationLine: on ? 'line-through' : 'none' }}>{x.title}</T>
        <Meta items={[
          <Text key="p" style={{ fontSize: 13, fontWeight: '800', color: priText(t, x.p) }}>{PRI[x.p]}</Text>,
          <Text key="h" style={{ fontSize: 13, color: t.mute }}>Her gün</Text>,
          isTime(x.rTime) && <Text key="b" style={{ fontSize: 13, color: t.mute }}>{'Bildirim ' + x.rTime}</Text>,
        ]} />
      </Pressable>
    </RowShell>
  );
}

// ---------- pomodoro ----------
export function usePomo() {
  const { update, dev } = useStore();
  const toggle = () => update('study', (S) => {
    const T0 = S.timer, now = Date.now();
    if (!T0) { const dur = tmDur(S, 'w'); S.timer = { phase: 'w', run: true, end: now + dur, dur, cyc: 0, dev, subj: S.subj || '' }; }
    else if (T0.run) { T0.left = Math.max(0, T0.end - now); T0.run = false; }
    else { T0.end = now + (T0.left || 0); T0.run = true; T0.dev = dev; }
  });
  const reset = () => update('study', (S) => { S.timer = null; });
  const phaseDone = (log) => update('study', (S) => {
    if (!S.timer) { const dur = tmDur(S, 'w'); S.timer = { phase: 'w', run: false, left: dur, dur, cyc: 0, dev, subj: S.subj || '' }; }
    const T0 = S.timer;
    if (T0.phase === 'w' && log) {
      const d = today(), L = S.log[d] || (S.log[d] = { m: 0, n: 0, by: {} }), mins = Math.round((T0.dur || tmDur(S, 'w')) / 60000);
      L.m += mins; L.n += 1; L.by = L.by || {};
      if (T0.subj) L.by[T0.subj] = (L.by[T0.subj] || 0) + mins;
    }
    const next = T0.phase === 'w' ? 'b' : 'w', dur = tmDur(S, next);
    S.timer = { phase: next, run: true, end: Date.now() + dur, dur, cyc: (T0.cyc || 0) + (T0.phase === 'w' && log ? 1 : 0), dev, subj: S.subj || '' };
  });
  const setDur = (w, b) => update('study', (S) => { S.work = Math.min(240, Math.max(1, Math.round(w))); S.brk = Math.min(120, Math.max(1, Math.round(b))); });
  return { toggle, reset, skip: () => phaseDone(false), phaseDone, setDur };
}

export function TimerCard({ big }) {
  const t = useTheme();
  const { st } = useStore();
  const go = useGo();
  const p = usePomo();
  const now = useNow(500);
  const S = st.study, s = tmState(S, now);
  const pct = s.dur ? Math.min(100, Math.max(0, (1 - s.rem / s.dur) * 100)) : 0;
  const ph = (s.ph === 'b' ? 'Mola' : 'Çalışma') + (s.idle ? ' · hazır' : !s.run ? ' · duraklatıldı' : '');
  const col = s.ph === 'b' ? t.grn : t.acc;
  return (
    <Card style={{ alignItems: big ? 'center' : 'stretch', gap: 8 }}>
      <Row wrap={false} style={{ justifyContent: big ? 'center' : 'space-between' }}>
        <View style={{ alignItems: big ? 'center' : 'flex-start', flexShrink: 1 }}>
          <Text style={{ color: s.run ? (s.ph === 'b' ? t.grn : t.accT) : t.mute, fontWeight: '700', fontSize: 13.5 }}>{ph + (S.subj ? ' · ' + S.subj : '')}</Text>
          <Text style={{ color: t.ink, fontSize: big ? 84 : 50, fontWeight: '800', letterSpacing: -1.5, fontVariant: ['tabular-nums'], lineHeight: big ? 92 : 56 }}>{mmss(s.rem)}</Text>
        </View>
        {!big ? (
          <Row wrap={false} style={{ gap: 2 }}>
            <Btn kind="pri" title={s.run ? 'Duraklat' : s.idle ? 'Başlat' : 'Devam'} onPress={p.toggle} style={{ minWidth: 96 }} />
          </Row>
        ) : null}
      </Row>
      <View style={{ height: 6, borderRadius: 6, backgroundColor: t.card2, overflow: 'hidden', alignSelf: 'stretch' }}>
        <View style={{ width: pct + '%', height: '100%', backgroundColor: col, borderRadius: 6 }} />
      </View>
      {big ? (
        <>
          <Row wrap={false} style={{ justifyContent: 'center', gap: 12, marginTop: 4 }}>
            <IconBtn name="refresh-outline" label="Sıfırla" color={t.mute} onPress={p.reset} />
            <Btn kind="pri" title={s.run ? 'Duraklat' : s.idle ? 'Başlat' : 'Devam'} onPress={p.toggle} style={{ minWidth: 150, minHeight: 52, borderRadius: 999 }} />
            <IconBtn name="play-skip-forward-outline" label="Atla" color={t.mute} onPress={p.skip} />
          </Row>
          <Text style={{ color: t.mute, fontSize: 13, textAlign: 'center' }}>{S.work + ' dk çalışma + ' + S.brk + ' dk mola · ' + s.cyc + ' tur tamam'}</Text>
        </>
      ) : (
        <Row wrap={false} style={{ justifyContent: 'space-between' }}>
          <Text style={{ color: t.mute, fontSize: 13, flexShrink: 1 }}>{S.work + ' + ' + S.brk + ' dk · ' + s.cyc + ' tur tamam'}</Text>
          <Row wrap={false} style={{ gap: 0 }}>
            <IconBtn name="refresh-outline" label="Sıfırla" color={t.mute} onPress={p.reset} />
            <IconBtn name="play-skip-forward-outline" label="Atla" color={t.mute} onPress={p.skip} />
            <IconBtn name="options-outline" label="Pomodoro ayarları" color={t.mute} onPress={() => go('calisma')} />
          </Row>
        </Row>
      )}
    </Card>
  );
}

// ---------- haftalık program ----------
const HH = 48; // bir saatin yüksekliği
export function WeekProgram() {
  const t = useTheme();
  const { st, update } = useStore();
  const forms = useForms();
  const { width } = useWindowDimensions();
  useNow(60000);
  const W = st.week, wide = width >= 760, tdw = dowOf(today());
  const [sel, setSel] = useState(tdw);
  const scroll = useRef(null);
  const n = new Date(), nowM = n.getHours() * 60 + n.getMinutes();
  useEffect(() => {
    const y = Math.max(0, (new Date().getHours() - W.from - 1) * HH);
    const id = setTimeout(() => scroll.current && scroll.current.scrollTo({ y, animated: false }), 50);
    return () => clearTimeout(id);
  }, [W.from]);
  const todays = W.items.filter((w) => w.days.includes(tdw)).sort((a, b) => toMin(a.start) - toMin(b.start));
  const cur = todays.find((w) => toMin(w.start) <= nowM && toMin(w.end) > nowM);
  const next = todays.find((w) => toMin(w.start) > nowM);
  const days = wide ? [0, 1, 2, 3, 4, 5, 6] : [sel];
  const hours = W.to - W.from;
  const setRange = (f, to) => update('week', (d) => { if (to > f && f >= 0 && to <= 24) { d.from = f; d.to = to; } });
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <H2>Haftalık program</H2>
          <Mute>{cur ? 'Şimdi: ' + cur.title + ' · ' + cur.start + '–' + cur.end : next ? 'Sıradaki: ' + next.title + ' · ' + next.start : 'Boş bir saate dokunarak ekleyebilirsin'}</Mute>
        </View>
        <Btn title="+ Ekle" kind="pri" onPress={() => forms.open('week', { days: [sel] })} />
      </Row>
      {!wide ? (
        <Row>{DN.map((d, i) => <Chip key={d} label={d} on={i === sel} onPress={() => setSel(i)} />)}</Row>
      ) : null}
      <View style={{ borderWidth: 1, borderColor: t.line, borderRadius: t.rm, overflow: 'hidden' }}>
        {wide ? (
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: t.line }}>
            <View style={{ width: 50 }} />
            {days.map((i) => <Text key={i} style={{ flex: 1, textAlign: 'center', paddingVertical: 8, fontWeight: '800', fontSize: 13, color: i === tdw ? t.accT : t.ink }}>{DN[i]}</Text>)}
          </View>
        ) : null}
        <ScrollView ref={scroll} style={{ maxHeight: 520 }} nestedScrollEnabled>
          <View style={{ flexDirection: 'row', height: hours * HH }}>
            <View style={{ width: 50 }}>
              {Array.from({ length: hours }, (_, k) => (
                <Text key={k} style={{ position: 'absolute', top: k * HH + 2, right: 8, fontSize: 12, color: t.mute }}>{pad(W.from + k) + ':00'}</Text>
              ))}
            </View>
            {days.map((i) => (
              <View key={i} style={{ flex: 1, borderLeftWidth: 1, borderColor: t.line }}>
                {Array.from({ length: hours }, (_, k) => (
                  <Pressable key={k} accessibilityLabel={DN[i] + ' ' + pad(W.from + k) + ':00, ekle'}
                    onPress={() => forms.open('week', { days: [i], start: pad(W.from + k) + ':00', end: W.from + k >= 23 ? '23:59' : pad(W.from + k + 1) + ':00' })}
                    style={({ pressed }) => ({ position: 'absolute', top: k * HH, height: HH, left: 0, right: 0, borderTopWidth: 1, borderColor: t.line, backgroundColor: pressed ? alpha(t.acc, 0.08) : 'transparent' })} />
                ))}
                {W.items.filter((w) => w.days.includes(i)).map((w) => {
                  const s0 = Math.max(toMin(w.start), W.from * 60), e0 = Math.min(toMin(w.end), W.to * 60);
                  if (e0 <= s0) return null;
                  const col = w.color || RC[0];
                  return (
                    <Pressable key={w.id} onPress={() => forms.open('week', w)}
                      style={{ position: 'absolute', top: ((s0 - W.from * 60) / 60) * HH + 1, height: Math.max(20, ((e0 - s0) / 60) * HH - 2), left: 2, right: 2, borderRadius: 8, padding: 4, overflow: 'hidden', backgroundColor: alpha(col, 0.24), borderWidth: 1, borderColor: alpha(col, 0.55) }}>
                      <Text numberOfLines={1} style={{ fontWeight: '800', fontSize: 12.5, color: t.ink }}>{w.title}</Text>
                      <Text numberOfLines={1} style={{ fontSize: 11.5, color: t.mute }}>{w.start + '–' + w.end + (w.notify ? ' · bildirim' : '')}</Text>
                    </Pressable>
                  );
                })}
                {i === tdw && nowM >= W.from * 60 && nowM < W.to * 60 ? (
                  <View pointerEvents="none" style={{ position: 'absolute', top: ((nowM - W.from * 60) / 60) * HH, left: 0, right: 0, height: 2, backgroundColor: t.red }} />
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      <Row>
        <Mute>Saat aralığı</Mute>
        <Btn sm title="−" onPress={() => setRange(W.from - 1, W.to)} />
        <T w="700">{pad(W.from) + ':00'}</T>
        <Btn sm title="+" onPress={() => setRange(W.from + 1, W.to)} />
        <Mute>–</Mute>
        <Btn sm title="−" onPress={() => setRange(W.from, W.to - 1)} />
        <T w="700">{pad(W.to) + ':00'}</T>
        <Btn sm title="+" onPress={() => setRange(W.from, W.to + 1)} />
      </Row>
    </Card>
  );
}

// ---------- bildirim kartı ----------
export function NotifCard() {
  const t = useTheme();
  const { st } = useStore();
  const { toast } = useUI();
  const [perm, setPerm] = useState(null);
  useEffect(() => { permission(false).then(setPerm); }, []);
  const list = notifPlan(st).slice(0, 5);
  return (
    <Card>
      <H3>Bildirimler</H3>
      {!nativeNotifications ? (
        <Mute>Telefona bildirim Android uygulamasından gelir. Bu sayfa açıkken zamanı gelen hatırlatmalar ekranda çıkar.</Mute>
      ) : perm ? (
        <>
          <Mute>Bildirimler açık. Görev, rutin ve haftalık programdaki saatlerde telefonuna hatırlatma gelir.</Mute>
          <Row><Btn sm title="Deneme bildirimi gönder" onPress={async () => { const ok = await testNotification(); toast(ok ? '2 saniye içinde bildirim gelecek' : 'Bildirim gönderilemedi'); }} /></Row>
        </>
      ) : (
        <>
          <Mute>Bildirim izni kapalı; hatırlatmalar gelemiyor.</Mute>
          <Row>
            <Btn sm kind="pri" title="Bildirimlere izin ver" onPress={async () => { const ok = await permission(true); setPerm(ok); if (!ok) Linking.openSettings(); }} />
          </Row>
        </>
      )}
      <T s={15} w="800" style={{ marginTop: 6 }}>Sıradaki hatırlatmalar</T>
      {list.length ? list.map((o, i) => (
        <ListRow key={o.id} last={i === list.length - 1}>
          <View style={{ flex: 1 }}>
            <T w="700">{o.title}</T>
            <Mute>{o.text}</Mute>
          </View>
          <T w="800">{whenTxt(o.at)}</T>
        </ListRow>
      )) : <Empty text="Göreve, rutine ya da haftalık programa saat eklediğinde burada görünür." />}
    </Card>
  );
}

// ---------- sayfa geçişi ----------
export const GoCtx = createContext(() => {});
export const useGo = () => useContext(GoCtx);

// ---------- formlar ----------
const FormCtx = createContext(null);
export const useForms = () => useContext(FormCtx);

export function FormsProvider({ children }) {
  const [f, setF] = useState(null); // {kind, data, n}
  const open = (kind, data) => setF({ kind, data: data || {}, n: Date.now() });
  const close = () => setF(null);
  const props = f ? { key: f.n, data: f.data, close } : null;
  return (
    <FormCtx.Provider value={{ open, close }}>
      {children}
      {f && f.kind === 'task' ? <TaskForm {...props} /> : null}
      {f && f.kind === 'cat' ? <NameForm {...props} kind="cat" /> : null}
      {f && f.kind === 'folder' ? <NameForm {...props} kind="folder" /> : null}
      {f && f.kind === 'routine' ? <RoutineForm {...props} /> : null}
      {f && f.kind === 'week' ? <WeekForm {...props} /> : null}
      {f && f.kind === 'book' ? <BookForm {...props} /> : null}
      {f && f.kind === 'link' ? <LinkForm {...props} /> : null}
    </FormCtx.Provider>
  );
}

function ExtTaskSheet({ data, close }) {
  const { update } = useStore();
  const { confirm } = useUI();
  const G = useGroups();
  const cal = data.ext === 'cal';
  const when = (data.start && data.end && data.start !== data.end ? fmtD(data.start) + ' → ' + fmtD(data.end) : fmtD(data.end || data.start)) + (isTime(data.rTime) ? ' · ' + data.rTime : '');
  return (
    <Sheet visible title={cal ? 'Telefon takviminden' : data.gtype === 'ekip' ? 'Ekipten gelen görev' : 'Öğretmenin atadığı görev'} onClose={close}>
      <T s={20} w="800">{data.title}</T>
      <Mute>{when}</Mute>
      {cal && data.alarms && data.alarms.length ? <Mute>{'Hatırlatıcılar: ' + data.alarms.map((m) => (m ? -m + ' dk önce' : 'başlarken')).join(', ')}</Mute> : null}
      {data.note ? <T>{data.note}</T> : null}
      <Mute>{cal ? 'Bu etkinlik telefonunun takviminden geliyor; değiştirmek için takvim uygulamasını kullan, burada da güncellenir.' : data.gtype === 'ekip' ? 'Bu görevi ' + (data.byName || 'ekipten biri') + ' verdi. Tamamlayınca işaretle; ekip görür.' : 'Bu görevi öğretmenin atadı. Tamamlayınca işaretle; öğretmenin görür.'}</Mute>
      <Row>
        <Btn kind="pri" icon={data.done ? 'arrow-undo-outline' : 'checkmark'} title={data.done ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı'} onPress={() => {
          update('tasks', (d) => { const y = d.items.find((i) => i.id === data.id); if (y) { y.done = !y.done; y.doneAt = y.done ? today() : null; } });
          if (!cal && G) G.markAssign(data.extKey, !data.done);
          close();
        }} />
        {cal ? <Btn kind="danger" title="Planlayıcı'da gizle" onPress={() => confirm('Bu etkinlik Planlayıcı\'dan kaldırılsın mı? Telefon takviminde kalır.', () => {
          update('prefs', (d) => { d.calSkip = [...d.calSkip, data.extKey]; });
          update('tasks', (d) => { d.items = d.items.filter((i) => i.id !== data.id); });
          close();
        }, 'Gizle')} /> : null}
      </Row>
    </Sheet>
  );
}

function TaskForm({ data, close }) {
  if (data.ext) return <ExtTaskSheet data={data} close={close} />;
  return <TaskFormInner data={data} close={close} />;
}

function TaskFormInner({ data, close }) {
  const t = useTheme();
  const { st, update } = useStore();
  const { toast, confirm } = useUI();
  const [v, setV] = useState({
    title: data.title || '', cat: data.cat || 'genel', p: data.p || 2,
    start: data.start ?? (data.cat === 'daily' ? '' : today()), end: data.end || '',
    rDate: data.rDate || '', rTime: data.rTime || '', note: data.note || '',
  });
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const save = () => {
    const title = v.title.trim();
    if (!title) return toast('Görev adını yaz');
    if (v.start && v.end && v.end < v.start) return toast('Bitiş tarihi başlangıçtan önce olamaz');
    if (v.rTime && !isTime(v.rTime)) return toast('Bildirim saatini SS:DD olarak yaz (ör. 14:30)');
    const val = { ...v, title, note: v.note.trim() };
    update('tasks', (d) => {
      if (data.id) { const y = d.items.find((i) => i.id === data.id); if (y) Object.assign(y, val); }
      else d.items.push({ id: rid(), done: false, doneOn: [], ...val });
    });
    close();
  };
  const daily = v.cat === 'daily';
  return (
    <Sheet visible title={data.id ? 'Görevi düzenle' : daily ? 'Yeni günlük iş' : 'Yeni görev'} onClose={close} footer={<FormFooter onCancel={close} onSave={save} />}>
      <Field label="Görev" value={v.title} onChangeText={set('title')} placeholder="Örn. Ödev teslimi" autoFocus={!data.id} />
      <View style={{ gap: 6 }}>
        <Mute style={{ fontWeight: '700' }}>Başlık (klasör)</Mute>
        <Row>{st.tasks.cats.map((c) => <Chip key={c.id} label={c.name} on={v.cat === c.id} onPress={() => set('cat')(c.id)} />)}</Row>
      </View>
      <Seg label="Öncelik" value={v.p} onChange={set('p')} options={[[1, 'Acil', t.red], [2, 'Öncelikli', t.yel], [3, 'Öncelikli değil', t.grn]]} />
      <Row style={{ alignItems: 'flex-start' }}>
        <DateField label="Başlangıç" value={v.start} onChange={set('start')} />
        <DateField label="Bitiş (son gün)" value={v.end} onChange={set('end')} />
      </Row>
      <Row style={{ alignItems: 'flex-start' }}>
        {!daily ? <DateField label="Bildirim günü" value={v.rDate} onChange={set('rDate')} /> : null}
        <TimeField label="Bildirim saati" value={v.rTime} onChange={set('rTime')} />
      </Row>
      <Mute>{daily ? 'Saat yazarsan her gün o saatte bildirim gelir; o gün işaretlediysen gelmez.' : 'Saat yazarsan o saatte bildirim gelir. Gün boşsa bitiş günü kullanılır.'}</Mute>
      <Field label="Not" value={v.note} onChangeText={set('note')} />
      {data.id ? <Btn kind="danger" icon="trash-outline" title="Görevi sil" onPress={() => confirm('Bu görev silinsin mi?', () => { update('tasks', (d) => { d.items = d.items.filter((i) => i.id !== data.id); }); close(); })} /> : null}
    </Sheet>
  );
}

function NameForm({ data, close, kind }) {
  const { update } = useStore();
  const { toast } = useUI();
  const [name, setName] = useState(data.name || '');
  const save = () => {
    const n = name.trim();
    if (!n) return toast('Bir ad yaz');
    if (kind === 'cat') update('tasks', (d) => { d.cats.push({ id: rid(), name: n }); });
    else update('library', (d) => {
      if (data.id) { const f = d.folders.find((x) => x.id === data.id); if (f) f.name = n; }
      else d.folders.push({ id: rid(), name: n, files: [] });
    });
    close();
  };
  const title = kind === 'cat' ? 'Yeni başlık' : data.id ? 'Klasörü yeniden adlandır' : 'Yeni klasör';
  return (
    <Sheet visible title={title} onClose={close} footer={<FormFooter onCancel={close} onSave={save} />}>
      <Field label={kind === 'cat' ? 'Başlık adı' : 'Ders / klasör adı'} value={name} onChangeText={setName} autoFocus placeholder={kind === 'cat' ? 'Örn. Okul, Ev, Proje' : 'Örn. Termodinamik'} onSubmitEditing={save} />
    </Sheet>
  );
}

function RoutineForm({ data, close }) {
  const { st, update } = useStore();
  const { toast, confirm } = useUI();
  const [v, setV] = useState({ name: data.name || '', rTime: data.rTime || '', color: data.color || RC[st.routines.items.length % RC.length] });
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const save = () => {
    const name = v.name.trim();
    if (!name) return toast('Rutin adını yaz');
    if (v.rTime && !isTime(v.rTime)) return toast('Saati SS:DD olarak yaz (ör. 07:30)');
    update('routines', (d) => {
      if (data.id) { const r = d.items.find((i) => i.id === data.id); if (r) Object.assign(r, { ...v, name }); }
      else d.items.push({ id: rid(), done: [], ...v, name });
    });
    close();
  };
  return (
    <Sheet visible title={data.id ? 'Rutini düzenle' : 'Yeni rutin'} onClose={close} footer={<FormFooter onCancel={close} onSave={save} />}>
      <Field label="Rutin adı" value={v.name} onChangeText={set('name')} placeholder="Örn. Sabah sporu" autoFocus={!data.id} />
      <TimeField label="Hatırlatma saati (isteğe bağlı)" value={v.rTime} onChange={set('rTime')} />
      <Mute>Saat yazarsan her gün o saatte bildirim gelir; o gün işaretlediysen gelmez.</Mute>
      <ColorPick label="Zincir rengi" colors={RC} value={v.color} onChange={set('color')} />
      {data.id ? <Btn kind="danger" icon="trash-outline" title="Rutini sil" onPress={() => confirm('Bu rutin ve tüm zinciri silinsin mi?', () => { update('routines', (d) => { d.items = d.items.filter((i) => i.id !== data.id); }); close(); })} /> : null}
    </Sheet>
  );
}

function WeekForm({ data, close }) {
  const { st, update } = useStore();
  const { toast, confirm } = useUI();
  const [v, setV] = useState({
    title: data.title || '', days: data.days || [dowOf(today())], start: data.start || '', end: data.end || '',
    color: data.color || RC[st.week.items.length % RC.length], notify: !!data.notify,
  });
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const save = () => {
    const title = v.title.trim();
    if (!title) return toast('Ne yapacağını yaz');
    if (!v.days.length) return toast('En az bir gün seç');
    if (!isTime(v.start) || !isTime(v.end)) return toast('Saatleri SS:DD olarak yaz (ör. 14:00)');
    if (toMin(v.end) <= toMin(v.start)) return toast('Bitiş saati başlangıçtan sonra olmalı');
    update('week', (d) => {
      const val = { ...v, title };
      if (data.id) { const w = d.items.find((i) => i.id === data.id); if (w) Object.assign(w, val); }
      else d.items.push({ id: rid(), ...val });
      const s = Math.floor(toMin(v.start) / 60), e = Math.ceil(toMin(v.end) / 60);
      if (s < d.from) d.from = s;
      if (e > d.to) d.to = Math.min(24, e);
    });
    close();
  };
  return (
    <Sheet visible title={data.id ? 'Programı düzenle' : 'Programa ekle'} onClose={close} footer={<FormFooter onCancel={close} onSave={save} />}>
      <Field label="Ne yapacaksın?" value={v.title} onChangeText={set('title')} placeholder="Örn. Ders çalışma, spor, okul" autoFocus={!data.id} />
      <DayPick value={v.days} onChange={set('days')} />
      <Row style={{ alignItems: 'flex-start' }}>
        <TimeField label="Başlangıç" value={v.start} onChange={set('start')} />
        <TimeField label="Bitiş" value={v.end} onChange={set('end')} />
      </Row>
      <ColorPick colors={RC} value={v.color} onChange={set('color')} />
      <Check label="Başlarken bildirim gönder" value={v.notify} onChange={set('notify')} />
      {data.id ? <Btn kind="danger" icon="trash-outline" title="Programdan sil" onPress={() => confirm('Bu öğe tüm günlerden silinsin mi?', () => { update('week', (d) => { d.items = d.items.filter((i) => i.id !== data.id); }); close(); })} /> : null}
    </Sheet>
  );
}

function BookForm({ data, close }) {
  const { st, update } = useStore();
  const { toast, confirm } = useUI();
  const [v, setV] = useState({ title: data.title || '', author: data.author || '', genre: data.genre || '', total: data.total ? String(data.total) : '', st: data.st || 'oku' });
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const genres = [...new Set(['Roman', 'Bilim', 'Tarih', 'Felsefe', 'Kişisel gelişim', 'Ders kitabı', ...st.books.items.map((b) => b.genre).filter(Boolean)])];
  const save = () => {
    const title = v.title.trim(), total = Math.round(+v.total);
    if (!title) return toast('Kitap adını yaz');
    if (!(total > 0)) return toast('Toplam sayfa sayısını yaz');
    const val = { title, author: v.author.trim(), genre: v.genre.trim(), total, st: v.st };
    update('books', (d) => {
      if (data.id) { const b = d.items.find((i) => i.id === data.id); if (b) Object.assign(b, val); }
      else d.items.push({ id: rid(), logs: [], added: today(), ...val });
    });
    close();
  };
  return (
    <Sheet visible title={data.id ? 'Kitabı düzenle' : 'Yeni kitap'} onClose={close} footer={<FormFooter onCancel={close} onSave={save} />}>
      <Field label="Kitap adı" value={v.title} onChangeText={set('title')} autoFocus={!data.id} />
      <Field label="Yazar" value={v.author} onChangeText={set('author')} />
      <Field label="Tür / sınıf" value={v.genre} onChangeText={set('genre')} placeholder="Roman, Bilim…" />
      <Row>{genres.map((g) => <Chip key={g} label={g} on={v.genre === g} onPress={() => set('genre')(g)} />)}</Row>
      <Field label="Toplam sayfa" value={v.total} onChangeText={set('total')} keyboardType="number-pad" />
      <Seg label="Durum" value={v.st} onChange={set('st')} options={Object.entries(BST)} />
      {data.id ? <Btn kind="danger" icon="trash-outline" title="Kitabı sil" onPress={() => confirm('Bu kitap ve okuma kayıtları silinsin mi?', () => { update('books', (d) => { d.items = d.items.filter((i) => i.id !== data.id); }); close(); })} /> : null}
    </Sheet>
  );
}

function LinkForm({ data, close }) {
  const { update } = useStore();
  const { toast } = useUI();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const save = () => {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) return toast('Bağlantı http:// ya da https:// ile başlamalı');
    update('library', (d) => {
      const f = d.folders.find((x) => x.id === data.folder);
      if (f) f.files.push({ id: rid(), kind: 'link', name: name.trim() || u, url: u, d: today() });
    });
    close();
  };
  return (
    <Sheet visible title="Bağlantı ekle" onClose={close} footer={<FormFooter onCancel={close} onSave={save} />}>
      <Mute>Google Drive gibi bir yerdeki PDF'in bağlantısını eklersen telefonda ve bilgisayarda açılır.</Mute>
      <Field label="Ad" value={name} onChangeText={setName} placeholder="Örn. 5. hafta ders notu" />
      <Field label="Bağlantı" value={url} onChangeText={setUrl} placeholder="https://…" autoCapitalize="none" keyboardType="url" />
    </Sheet>
  );
}
