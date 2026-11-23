// Telefon takvimi bağlantısı (yalnızca Android uygulamasında)
//  - İçe alma: seçili takvimlerdeki etkinlikler "Telefon Takvimi" başlığı altında görev olur;
//    etkinliğin hatırlatıcıları (alarmları) görevde saklanır.
//  - Dışa yazma: görevlerin son günleri ve haftalık program telefondaki "Planlayıcı" takvimine yazılır.
import { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from './store';
import { addDays, today, ymd, pad, parse, isDate, isTime, toMin, dowOf, PRI, rid } from './logic';

const Cal = Platform.OS === 'android' ? require('expo-calendar') : null;
export const calendarSupported = !!Cal;
const MAP_KEY = 'pl-cal-map';
const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul'; } catch (e) { return 'Europe/Istanbul'; } })();

export async function calPermission(ask) {
  if (!Cal) return false;
  try {
    let s = await Cal.getCalendarPermissionsAsync();
    if (!s.granted && ask && s.canAskAgain !== false) s = await Cal.requestCalendarPermissionsAsync();
    return !!s.granted;
  } catch (e) {
    return false;
  }
}

async function loadMap() {
  try { const m = JSON.parse(await AsyncStorage.getItem(MAP_KEY)); return m && m.ev ? m : { ev: {} }; } catch (e) { return { ev: {} }; }
}
async function saveMap(m) {
  try { await AsyncStorage.setItem(MAP_KEY, JSON.stringify(m)); } catch (e) { /* yok say */ }
}

export async function listCalendars() {
  if (!Cal || !(await calPermission(false))) return [];
  try {
    const m = await loadMap();
    const cs = await Cal.getCalendarsAsync(Cal.EntityTypes.EVENT);
    return cs.filter((c) => c.id !== m.own && !(c.title === 'Planlayıcı' && c.source && c.source.name === 'Planlayıcı'))
      .map((c) => ({ id: c.id, title: c.title || 'Takvim', color: c.color || '#888888', account: (c.source && c.source.name) || '' }));
  } catch (e) {
    return [];
  }
}

async function ownCalendarId(m) {
  const cs = await Cal.getCalendarsAsync(Cal.EntityTypes.EVENT);
  if (m.own && cs.find((c) => c.id === m.own)) return m.own;
  // Önceki kurulumdan kalan Planlayıcı takvimini sil, temiz başla
  for (const c of cs) {
    if (c.title === 'Planlayıcı' && c.source && c.source.name === 'Planlayıcı') {
      try { await Cal.deleteCalendarAsync(c.id); } catch (e) { /* yok say */ }
    }
  }
  const id = await Cal.createCalendarAsync({
    title: 'Planlayıcı', color: '#2950E0', entityType: Cal.EntityTypes.EVENT, name: 'planlayici',
    source: { isLocalAccount: true, name: 'Planlayıcı' }, ownerAccount: 'planlayici',
    accessLevel: Cal.CalendarAccessLevel.OWNER,
  });
  m.own = id;
  m.ev = {};
  return id;
}

const atTime = (d, t) => { const x = parse(d), mm = toMin(t); x.setHours(Math.floor(mm / 60), mm % 60, 0, 0); return x; };
const utcDay = (d) => { const [y, mo, da] = d.split('-').map(Number); return new Date(Date.UTC(y, mo - 1, da)); };
const utcYmd = (x) => x.getUTCFullYear() + '-' + pad(x.getUTCMonth() + 1) + '-' + pad(x.getUTCDate());

// Telefona yazılacak etkinlikler: { anahtar: {..., h: içerik özeti} }
export function desiredEvents(st) {
  const out = {}, td = today();
  for (const x of st.tasks.items) {
    if (x.ext === 'cal' || x.cat === 'daily' || x.done || !isDate(x.end) || x.end < addDays(td, -1)) continue;
    const note = 'Planlayıcı · ' + PRI[x.p] + (x.note ? '\n' + x.note : '');
    if (isTime(x.rTime)) {
      const day = isDate(x.rDate) ? x.rDate : x.end, s = atTime(day, x.rTime);
      out['t' + x.id] = { title: x.title, startDate: s, endDate: new Date(s.getTime() + 30 * 60000), allDay: false, timeZone: TZ, notes: note, h: [x.title, day, x.rTime, note].join('|') };
    } else {
      out['t' + x.id] = { title: x.title, startDate: utcDay(x.end), endDate: utcDay(addDays(x.end, 1)), allDay: true, timeZone: 'UTC', notes: note, h: [x.title, x.end, note].join('|') };
    }
  }
  for (const w of st.week.items) {
    if (!isTime(w.start) || !isTime(w.end)) continue;
    for (const d of w.days) {
      let first = td;
      for (let i = 0; i < 7; i++) { const c = addDays(td, i); if (dowOf(c) === d) { first = c; break; } }
      out['w' + w.id + '-' + d] = {
        title: w.title, startDate: atTime(first, w.start), endDate: atTime(first, w.end), allDay: false, timeZone: TZ,
        notes: 'Planlayıcı · haftalık program', recurrenceRule: { frequency: Cal ? Cal.Frequency.WEEKLY : 'weekly' },
        h: [w.title, d, w.start, w.end].join('|'),
      };
    }
  }
  return out;
}

let exporting = false, exportAgain = null;
export async function exportToPhone(st) {
  if (!Cal) return;
  if (exporting) { exportAgain = st; return; }
  exporting = true;
  try {
    if (!(await calPermission(false))) return;
    const m = await loadMap();
    if (!st.prefs.calExport) {
      for (const k of Object.keys(m.ev)) { try { await Cal.deleteEventAsync(m.ev[k].id); } catch (e) { /* yok say */ } }
      m.ev = {};
      await saveMap(m);
      return;
    }
    const cal = await ownCalendarId(m);
    const want = desiredEvents(st);
    for (const k of Object.keys(m.ev)) {
      if (!want[k]) { try { await Cal.deleteEventAsync(m.ev[k].id); } catch (e) { /* yok say */ } delete m.ev[k]; }
    }
    for (const [k, ev] of Object.entries(want)) {
      const cur = m.ev[k];
      if (cur && cur.h === ev.h) continue;
      if (cur) { try { await Cal.deleteEventAsync(cur.id); } catch (e) { /* yok say */ } delete m.ev[k]; }
      const { h, ...details } = ev;
      try { const id = await Cal.createEventAsync(cal, details); m.ev[k] = { id, h }; } catch (e) { /* yok say */ }
    }
    await saveMap(m);
  } catch (e) {
    /* takvim kullanılamıyor */
  } finally {
    exporting = false;
    if (exportAgain) { const s = exportAgain; exportAgain = null; exportToPhone(s); }
  }
}

// Telefondaki etkinlikleri oku (dünden 60 gün sonrasına)
async function readPhoneEvents(st) {
  const m = await loadMap();
  const all = (await Cal.getCalendarsAsync(Cal.EntityTypes.EVENT))
    .filter((c) => c.id !== m.own && !(c.title === 'Planlayıcı' && c.source && c.source.name === 'Planlayıcı'));
  const ids = (st.prefs.calIds.length ? all.filter((c) => st.prefs.calIds.includes(c.id)) : all).map((c) => c.id);
  if (!ids.length) return [];
  const evs = await Cal.getEventsAsync(ids, parse(addDays(today(), -1)), parse(addDays(today(), 61)));
  return evs.map((e) => {
    const s = new Date(e.startDate), en = new Date(e.endDate), allDay = !!e.allDay;
    const sd = allDay ? utcYmd(s) : ymd(s);
    let ed = allDay ? utcYmd(new Date(en.getTime() - 1)) : ymd(en);
    if (ed < sd) ed = sd;
    return {
      key: String(e.id) + '@' + sd,
      title: e.title || '(Başlıksız etkinlik)', start: sd, end: ed,
      rDate: allDay ? '' : sd, rTime: allDay ? '' : pad(s.getHours()) + ':' + pad(s.getMinutes()),
      startAt: allDay ? null : s.getTime(),
      alarms: (e.alarms || []).map((a) => a.relativeOffset).filter((n) => typeof n === 'number').map((n) => (n > 0 ? -n : n)),
      note: [e.location, e.notes].filter(Boolean).join(' · ').slice(0, 300),
    };
  });
}

// Okunan etkinlikleri görevlerle karşılaştırıp ekle / güncelle / kaldır
export function mergeImported(d, rows, prefs) {
  const skip = new Set(prefs.calSkip || []);
  const want = new Map(rows.filter((r) => !skip.has(r.key)).map((r) => [r.key, r]));
  const winStart = addDays(today(), -1), old = addDays(today(), -30);
  if (!d.cats.find((c) => c.id === 'takvim')) d.cats.push({ id: 'takvim', name: 'Telefon Takvimi' });
  const keep = [];
  for (const x of d.items) {
    if (x.ext !== 'cal') { keep.push(x); continue; }
    const r = want.get(x.extKey);
    if (r) {
      Object.assign(x, { title: r.title, start: r.start, end: r.end, rDate: r.rDate, rTime: r.rTime, startAt: r.startAt, alarms: r.alarms, note: r.note });
      want.delete(x.extKey);
      keep.push(x);
    } else if (x.end < winStart && x.end >= old) {
      keep.push(x); // geçmiş etkinlik: dokunma
    }
    // aksi halde telefonda silinmiş -> kaldır
  }
  for (const r of want.values()) {
    keep.push({ id: rid(), ext: 'cal', extKey: r.key, cat: 'takvim', p: 2, done: false, doneOn: [], title: r.title, start: r.start, end: r.end, rDate: r.rDate, rTime: r.rTime, startAt: r.startAt, alarms: r.alarms, note: r.note });
  }
  d.items = keep;
}

// App içinde bir kez kullanılır: içe alma + dışa yazmayı yönetir
export function useCalendarSync() {
  const { st, update, ready } = useStore();
  const ref = useRef(st);
  ref.current = st;
  const P = st.prefs;

  // İçe alma: açılışta, uygulamaya her dönüşte ve 15 dakikada bir
  useEffect(() => {
    if (!Cal || !ready) return undefined;
    let alive = true;
    const run = async (ask) => {
      const s = ref.current;
      if (!s.prefs.calImport && !s.prefs.calExport) return;
      if (!(await calPermission(ask))) return;
      if (!alive) return;
      if (s.prefs.calImport) {
        try {
          const rows = await readPhoneEvents(s);
          update('tasks', (d) => { mergeImported(d, rows, ref.current.prefs); });
        } catch (e) { /* yok say */ }
      } else if (s.tasks.items.some((x) => x.ext === 'cal')) {
        update('tasks', (d) => { d.items = d.items.filter((x) => x.ext !== 'cal'); });
      }
    };
    run(true);
    const sub = AppState.addEventListener('change', (a) => { if (a === 'active') run(false); });
    const iv = setInterval(() => run(false), 15 * 60000);
    return () => { alive = false; sub.remove(); clearInterval(iv); };
  }, [ready, update, P.calImport, P.calIds.join(',')]);

  // Dışa yazma: görev / program değişince (3 sn bekleyip)
  useEffect(() => {
    if (!Cal || !ready) return undefined;
    const id = setTimeout(() => exportToPhone(ref.current), 3000);
    return () => clearTimeout(id);
  }, [ready, st.tasks, st.week, P.calExport]);
}

// Elle "şimdi eşitle"
export async function syncNow(st, update) {
  if (!Cal) return false;
  if (!(await calPermission(true))) return false;
  if (st.prefs.calImport) {
    try { const rows = await readPhoneEvents(st); update('tasks', (d) => { mergeImported(d, rows, st.prefs); }); } catch (e) { /* yok say */ }
  }
  await exportToPhone(st);
  return true;
}
