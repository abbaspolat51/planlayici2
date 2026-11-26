// Saf hesaplamalar: tarih, seri, kalori, bildirim planı. React'e bağımlı değil.

export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const today = () => ymd(new Date());
export const parse = (s) => {
  const [a, b, c] = String(s).split('-').map(Number);
  return new Date(a, b - 1, c);
};
export const addDays = (s, n) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
export const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

export const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const GK = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
export const DN = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']; // pazartesi başlangıçlı

export const fmtD = (s) => {
  if (!isDate(s)) return '';
  const d = parse(s);
  return d.getDate() + ' ' + AY[d.getMonth()].slice(0, 3);
};
export const dShort = (s) => GK[parse(s).getDay()];
export const dayLabel = (s) => {
  const t = today();
  if (s === t) return 'Bugün';
  if (s === addDays(t, -1)) return 'Dün';
  if (s === addDays(t, 1)) return 'Yarın';
  const d = parse(s);
  return d.getDate() + ' ' + AY[d.getMonth()] + ' ' + GUN[d.getDay()];
};
export const dowOf = (s) => (parse(s).getDay() + 6) % 7;
export const weekStart = (s) => addDays(s, -dowOf(s));

export const num = (n) => {
  const v = Math.round(+n || 0);
  const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (v < 0 ? '-' : '') + s;
};
export const tl = (n) => {
  const v = Math.round((+n || 0) * 100) / 100;
  const abs = Math.abs(v);
  const int = Math.floor(abs);
  const dec = Math.round((abs - int) * 100);
  return (v < 0 ? '-' : '') + '₺' + num(int) + ',' + pad(dec);
};
export const hm = (m) => (m >= 60 ? Math.floor(m / 60) + ' sa' + (m % 60 ? ' ' + (m % 60) + ' dk' : '') : m + ' dk');
export const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const parseAmt = (v) => {
  let s = String(v || '').trim().replace(/\s|₺/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return parseFloat(s);
};
export const toMin = (t) => {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const isTime = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(t || ''));
export const fmtTimeInput = (raw) => {
  const d = String(raw || '').replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + ':' + d.slice(2) : d;
};
export const mmss = (ms) => {
  ms = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(ms / 3600), m = Math.floor((ms % 3600) / 60), s = ms % 60;
  return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s);
};

export const PRI = { 1: 'Acil', 2: 'Öncelikli', 3: 'Öncelikli değil' };
export const LV = { n: 'Henüz giriş yok', g: 'Çok iyi', y: 'Ortalama', r: 'Aşırı yenmiş' };
export const MEALS = [['sabah', 'Sabah'], ['ogle', 'Öğle'], ['aksam', 'Akşam'], ['ara', 'Ara öğün']];
export const PRE = [[25, 5], [25, 15], [40, 10], [50, 10], [90, 20]];
export const RC = ['#2f5bea', '#e8590c', '#0ca678', '#ae3ec9', '#1098ad', '#d6336c', '#5c940d', '#f08c00'];
export const BST = { oku: 'Okuyorum', sira: 'Okunacak', bitti: 'Bitti' };

// ---------- veri şekli ----------
export const KEYS = ['tasks', 'routines', 'food', 'study', 'library', 'money', 'books', 'week', 'goals', 'eng', 'prefs'];
export const DEF = {
  tasks: () => ({ items: [], cats: [{ id: 'daily', name: 'Günlük İşler' }, { id: 'genel', name: 'Genel' }] }),
  routines: () => ({ items: [] }),
  food: () => ({ days: {}, good: 1800, avg: 2300 }),
  study: () => ({ work: 25, brk: 5, timer: null, log: {}, subj: '' }),
  library: () => ({ folders: [] }),
  money: () => ({ items: [], start: 0 }),
  books: () => ({ items: [] }),
  week: () => ({ items: [], from: 7, to: 23 }),
  goals: () => ({ items: [] }),
  // İngilizce: on = günlük görev (rutin zinciri) açık mı, cur = sıradaki ders, cards = { kelime: [kutu, tekrar günü] }
  eng: () => ({ on: false, cur: 0, done: {}, day: '', cards: {}, time: '', chain: [] }),
  prefs: () => ({
    theme: 'nisan', palette: 'tema', mode: 'system', name: '',
    home: { ...HOME_DEF }, hidden: [],
    calImport: true, calExport: true, calNotify: false, calIds: [], calSkip: [],
    groups: [],
  }),
};
// Ana ekrandaki bölümler (Profil > Ana ekran'dan açılıp kapatılır)
export const HOME_SECTIONS = [
  ['ilham', 'Günün ayeti ve hadisi'], ['today', 'Bugün yapılacaklar'], ['gtasks', 'Grup görevleri'], ['goals', 'Hedeflerim (piller)'], ['eng', 'Günün İngilizce dersi'],
  ['timer', 'Pomodoro sayacı'], ['cal', 'Kalori kartı'], ['tiles', 'Bölüm düğmeleri'], ['week', 'Haftalık program'],
  ['phone', 'Telefon takvimi (bugün)'], ['due', 'Yaklaşan son günler'],
  ['groups', 'Gruplarım'], ['notif', 'Bildirimler'],
];
const HOME_DEF = Object.fromEntries(HOME_SECTIONS.map(([k]) => [k, true]));
export function norm(k, v) {
  const o = Object.assign(DEF[k](), v && typeof v === 'object' ? v : {});
  if (k === 'tasks') {
    o.items = Array.isArray(o.items) ? o.items : [];
    o.cats = Array.isArray(o.cats) ? o.cats : [];
    if (!o.cats.find((c) => c.id === 'genel')) o.cats.unshift({ id: 'genel', name: 'Genel' });
    if (!o.cats.find((c) => c.id === 'daily')) o.cats.unshift({ id: 'daily', name: 'Günlük İşler' });
  }
  if (k === 'routines') o.items.forEach((r) => { r.done = r.done || []; });
  if (k === 'books') o.items.forEach((b) => { b.logs = b.logs || []; });
  if (k === 'library') o.folders.forEach((f) => { f.files = f.files || []; });
  if (k === 'study') o.log = o.log || {};
  if (k === 'food') o.days = o.days || {};
  if (k === 'prefs') {
    // 2.2: yeni sade arayüz bir kez varsayılan olur; sonra kullanıcı istediği temayı seçer
    if (!o.v22) { o.theme = 'nisan'; o.v22 = true; }
    // 2.3: yeni "Nişan" konsepti bir kez varsayılan olur
    if (!o.v23) { o.theme = 'nisan'; o.v23 = true; }
    o.home = { ...HOME_DEF, ...(o.home || {}) };
    for (const a of ['hidden', 'calIds', 'calSkip', 'groups']) o[a] = Array.isArray(o[a]) ? o[a] : [];
    o.calSkip = o.calSkip.slice(-500);
  }
  if (k === 'goals') {
    o.items = (Array.isArray(o.items) ? o.items : []).filter((g) => g && g.id);
    o.items.forEach((g) => { g.logs = Array.isArray(g.logs) ? g.logs : []; g.target = +g.target || 1; });
  }
  if (k === 'eng') {
    o.cur = Math.max(0, Math.round(+o.cur || 0));
    for (const a of ['done', 'cards']) o[a] = o[a] && typeof o[a] === 'object' && !Array.isArray(o[a]) ? o[a] : {};
    o.chain = Array.isArray(o.chain) ? o.chain : [];
    o.on = !!o.on;
  }
  if (k === 'week') {
    o.items = (o.items || []).filter((w) => w && Array.isArray(w.days));
    o.from = Math.min(23, Math.max(0, +o.from || 0));
    o.to = Math.min(24, Math.max(o.from + 1, +o.to || 24));
  }
  return o;
}
export const emptyState = () => Object.fromEntries(KEYS.map((k) => [k, norm(k, null)]));

// ---------- görevler ----------
export const byPri = (a, b) => {
  const d = (!!a.done ? 1 : 0) - (!!b.done ? 1 : 0);
  if (d) return d;
  if (a.p !== b.p) return a.p - b.p;
  const ea = a.end || '9999', eb = b.end || '9999';
  return ea < eb ? -1 : ea > eb ? 1 : 0;
};
export function leftInfo(x) {
  if (!x.end || x.done) return null;
  const n = diffDays(today(), x.end);
  return { n, text: n < 0 ? -n + ' gün gecikti' : n === 0 ? 'Bugün son gün' : n + ' gün kaldı' };
}

// ---------- rutinler ----------
export function streak(dates) {
  const s = new Set(dates);
  let d = today();
  if (!s.has(d)) d = addDays(d, -1);
  let n = 0;
  while (s.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
export function runs(dates) {
  const a = [...new Set(dates)].sort(), r = [];
  for (const d of a) {
    const l = r[r.length - 1];
    if (l && addDays(l.e, 1) === d) { l.e = d; l.n++; } else r.push({ s: d, e: d, n: 1 });
  }
  return r;
}
export function monthCells(y, m) {
  const off = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(), c = [];
  for (let i = 0; i < off; i++) c.push(null);
  for (let d = 1; d <= n; d++) c.push(ymd(new Date(y, m, d)));
  while (c.length % 7) c.push(null);
  return c;
}
export const nowYM = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; };
export const shiftM = (o, dir) => {
  let m = o.m + dir, y = o.y;
  if (m < 0) { m = 11; y--; }
  if (m > 11) { m = 0; y++; }
  return { y, m };
};

// ---------- yemek ----------
export const fday = (food, d) => food.days[d] || { items: [], steps: 0, burn: 0 };
export const ftot = (D) => D.items.reduce((s, x) => s + (+x.kcal || 0), 0);
export const lvl = (food, t) => (!t ? 'n' : t <= food.good ? 'g' : t <= food.avg ? 'y' : 'r');
export function pruneFood(food) {
  const keys = Object.keys(food.days).sort();
  while (keys.length > 400) delete food.days[keys.shift()];
}

// ---------- para ve kitap ----------
export const balance = (money) =>
  money.items.reduce((s, x) => s + (x.t === 'gelir' ? x.amt : -x.amt), +money.start || 0);
export const bRead = (b) => b.logs.reduce((s, l) => s + (+l.p || 0), 0);

// ---------- pomodoro ----------
export const tmDur = (study, ph) => (ph === 'b' ? study.brk : study.work) * 60000;
export function tmState(study, now = Date.now()) {
  const T = study.timer;
  if (!T) { const d = tmDur(study, 'w'); return { ph: 'w', run: false, rem: d, dur: d, cyc: 0, idle: true }; }
  const rem = T.run ? T.end - now : T.left;
  return { ph: T.phase, run: T.run, rem, dur: T.dur || tmDur(study, T.phase), cyc: T.cyc || 0, idle: false };
}

// ---------- bildirim planı ----------
// Önümüzdeki 14 günün hatırlatmaları: {id, at (ms), title, text}
export function notifPlan(st, minAt) {
  const out = [], td = today(), H = 14, lim = minAt ?? Date.now() - 1000;
  const at = (d, t) => { const x = parse(d), m = toMin(t); x.setHours(Math.floor(m / 60), m % 60, 0, 0); return x.getTime(); };
  const P = st.prefs || {};
  for (const x of st.tasks.items) {
    if (x.ext === 'cal') {
      // Telefon takviminden gelenler: telefon zaten hatırlatır; istenirse Planlayıcı da hatırlatır
      if (!P.calNotify || x.done || !x.startAt) continue;
      const offs = (x.alarms && x.alarms.length ? x.alarms : [0]);
      offs.forEach((m, i) => out.push({ id: 'c' + x.id + i, at: x.startAt + m * 60000, title: x.title, text: 'Takvim' + (m ? ' · ' + -m + ' dk sonra' : ' · şimdi') }));
      continue;
    }
    if (!isTime(x.rTime)) continue;
    if (x.cat === 'daily') {
      for (let i = 0; i < H; i++) {
        const d = addDays(td, i);
        if (x.start && d < x.start) continue;
        if (x.end && d > x.end) break;
        if ((x.doneOn || []).includes(d)) continue;
        out.push({ id: 't' + x.id + d, at: at(d, x.rTime), title: x.title, text: 'Günlük iş · ' + PRI[x.p] });
      }
    } else if (!x.done) {
      const d = [x.rDate, x.end, x.start].find(isDate) || td;
      out.push({ id: 't' + x.id, at: at(d, x.rTime), title: x.title, text: PRI[x.p] + (x.end ? ' · son gün ' + fmtD(x.end) : '') });
    }
  }
  for (const r of st.routines.items) {
    if (!isTime(r.rTime)) continue;
    const n = streak(r.done);
    for (let i = 0; i < H; i++) {
      const d = addDays(td, i);
      if (r.done.includes(d)) continue;
      out.push({ id: 'r' + r.id + d, at: at(d, r.rTime), title: r.name, text: i === 0 && n ? n + ' günlük serini bozma!' : 'Rutin zamanı' });
    }
  }
  for (const w of st.week.items) {
    if (!w.notify || !isTime(w.start)) continue;
    for (let i = 0; i < H; i++) {
      const d = addDays(td, i);
      if (!w.days.includes(dowOf(d))) continue;
      out.push({ id: 'w' + w.id + d, at: at(d, w.start), title: w.title, text: 'Haftalık program · ' + w.start + '–' + w.end });
    }
  }
  const T = st.study.timer;
  if (T && T.run && T.end) {
    out.push({ id: 'pomodoro', at: T.end, title: T.phase === 'w' ? 'Çalışma bitti' : 'Mola bitti', text: T.phase === 'w' ? 'Mola zamanı!' : 'Çalışmaya dön!' });
  }
  return out.filter((o) => o.at > lim).sort((a, b) => a.at - b.at);
}
export const whenTxt = (ms) => {
  const d = new Date(ms), ds = ymd(d), t = today();
  return (ds === t ? 'Bugün' : ds === addDays(t, 1) ? 'Yarın' : fmtD(ds)) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
};

// ---------- hedefler ----------
export const PERIODS = { week: 'Haftalık', month: 'Aylık', year: 'Yıllık' };
// [anahtar, ad, kısa ad, hızlı ekleme düğmeleri]
export const UNITS = {
  saat: ['Saat', 'sa', [[60, '+1 saat'], [30, '+30 dk']]],
  sayfa: ['Sayfa', 'sayfa', [[10, '+10'], [1, '+1']]],
  adet: ['Adet', 'adet', [[1, '+1'], [5, '+5']]],
  km: ['Kilometre', 'km', [[1, '+1 km'], [5, '+5 km']]],
};
// Dönemin ilk ve son günü
export function periodRange(period, d = today()) {
  const x = parse(d);
  if (period === 'week') return [weekStart(d), addDays(weekStart(d), 6)];
  if (period === 'month') return [ymd(new Date(x.getFullYear(), x.getMonth(), 1)), ymd(new Date(x.getFullYear(), x.getMonth() + 1, 0))];
  return [x.getFullYear() + '-01-01', x.getFullYear() + '-12-31'];
}
// Hedefin bu dönemdeki ilerlemesi. Saat hedeflerinde değerler dakika olarak tutulur.
export function goalProgress(st, g) {
  const [a, b] = periodRange(g.period);
  let v = 0;
  for (const l of g.logs || []) if (l.d >= a && l.d <= b) v += +l.v || 0;
  // Pomodoro ile bağlıysa çalışma süresi de sayılır
  if (g.unit === 'saat' && g.subj) {
    const L = (st.study && st.study.log) || {};
    for (const d of Object.keys(L)) {
      if (d < a || d > b) continue;
      v += g.subj === '*' ? +L[d].m || 0 : +((L[d].by || {})[g.subj]) || 0;
    }
  }
  const done = g.unit === 'saat' ? v / 60 : v;
  const pct = g.target ? (done / g.target) * 100 : 0;
  const left = diffDays(today(), b) + 1;
  const need = Math.max(0, g.target - done);
  return { done, pct, left, need, perDay: left > 0 ? need / left : need, from: a, to: b };
}
export const fmtAmount = (unit, v) => {
  if (unit === 'saat') {
    const m = Math.round(v * 60);
    return m >= 60 ? (Math.round(v * 10) / 10).toString().replace('.', ',') + ' sa' : m + ' dk';
  }
  return num(v) + ' ' + (UNITS[unit] || UNITS.adet)[1];
};

// ---------- grup istatistikleri ----------
// [anahtar, ad, bugün alanı, hafta alanı, birim]
export const MODULES = [
  ['ders', 'Ders çalışma', 'studyToday', 'studyWeek', 'dk'],
  ['kitap', 'Kitap okuma', 'pagesToday', 'pagesWeek', 'sayfa'],
  ['rutin', 'Rutinler', 'routinesToday', 'streak', 'rutin'],
  ['gorev', 'Görevler', 'tasksToday', 'tasksWeek', 'görev'],
];
export function myStats(st) {
  const td = today(), ws = weekStart(td), L = st.study.log || {};
  let studyWeek = 0;
  for (let i = 0; i < 7; i++) studyWeek += (L[addDays(ws, i)] || {}).m || 0;
  let pagesToday = 0, pagesWeek = 0;
  for (const b of st.books.items) for (const l of b.logs) { if (l.d === td) pagesToday += +l.p || 0; if (l.d >= ws) pagesWeek += +l.p || 0; }
  let streakBest = 0, routinesToday = 0;
  for (const r of st.routines.items) { streakBest = Math.max(streakBest, streak(r.done)); if (r.done.includes(td)) routinesToday++; }
  let tasksToday = 0, tasksWeek = 0;
  for (const x of st.tasks.items) {
    if (x.cat === 'daily') {
      for (const d of x.doneOn || []) { if (d === td) tasksToday++; if (d >= ws) tasksWeek++; }
    } else if (x.done && x.doneAt) {
      if (x.doneAt === td) tasksToday++;
      if (x.doneAt >= ws) tasksWeek++;
    }
  }
  // Bu haftanın günlük çalışma dakikaları (Pzt → Paz) ve şu an çalışıp çalışmadığım
  const study7 = Array.from({ length: 7 }, (_, i) => (L[addDays(ws, i)] || {}).m || 0);
  const T = st.study.timer;
  const live = T && T.run && T.end ? { ph: T.phase, end: T.end, subj: T.subj || '' } : null;
  return { day: td, week: ws, studyToday: (L[td] || {}).m || 0, studyWeek, study7, live, pagesToday, pagesWeek, streak: streakBest, routinesToday, tasksToday, tasksWeek };
}
// Başka günden kalan "bugün" değerlerini sıfırla
export function freshStats(m) {
  const td = today(), ws = weekStart(td), s = { ...(m || {}) };
  if (s.day !== td) { s.studyToday = 0; s.pagesToday = 0; s.routinesToday = 0; s.tasksToday = 0; }
  if (s.week !== ws) { s.studyWeek = 0; s.pagesWeek = 0; s.tasksWeek = 0; s.study7 = []; }
  if (s.live && s.live.end < Date.now()) s.live = null;
  if (!Array.isArray(s.study7)) s.study7 = [];
  return s;
}
export const groupCode = () => {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 7; i++) c += A[Math.floor(Math.random() * A.length)];
  return c;
};
