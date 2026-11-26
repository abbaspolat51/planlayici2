// İngilizce bölümü: ders ilerleyişi, tekrar kartları, kelime arama. React'e bağımlı değil.
import { LESSONS, DICT, FORMS, NAMES } from './data';
import { today, addDays } from '../logic';

export { LESSONS, DICT };
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const LEVEL_TR = {
  A1: 'Başlangıç', A2: 'Temel', B1: 'Orta', B2: 'Orta üstü', C1: 'İleri', C2: 'Ustalık',
};
export const ENG_COLOR = '#2F63D9';
export const ROUTINE_NAME = 'İngilizce: günün dersi';

// Kart kutuları (aralıklı tekrar): kutu numarası → bir sonraki tekrara kalan gün
export const INTERVAL = [0, 1, 2, 4, 8, 16, 32];
export const MAX_BOX = INTERVAL.length - 1;

const NAME_SET = new Set(NAMES);
const WORD_RE = /[A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÇçÜüÖö]+(?:[-'’][A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÇçÜüÖö]+)*/g;
export const clean = (w) => String(w).toLowerCase().replace(/’/g, "'").replace(/'s$/, '').replace(/s'$/, 's');
export const isName = (raw) => /^[A-ZÇĞİÖŞÜ]/.test(raw) && NAME_SET.has(String(raw).replace(/['’]s$/, '').toLowerCase());

// Varsayılan durum (store/logic DEF.eng ile aynı)
export const engDefault = () => ({ on: false, cur: 0, done: {}, day: '', cards: {}, time: '', chain: [] });

// Bir kelimenin anlamı: { lm (kök), tr (anlam), form (metindeki biçim) } ya da { name: true }
export function lookup(raw) {
  if (isName(raw)) return { name: true, word: raw.replace(/['’]s$/, '') };
  const w = clean(raw);
  const lm = DICT[w] ? w : FORMS[w];
  if (lm && DICT[lm]) return { lm, tr: DICT[lm], form: w !== lm ? w : null };
  if (w.includes('-')) {
    const parts = w.split('-').filter(Boolean).map((p) => {
      const l = DICT[p] ? p : FORMS[p];
      return l && DICT[l] ? { lm: l, tr: DICT[l] } : null;
    }).filter(Boolean);
    if (parts.length) return { lm: w, tr: parts.map((p) => p.lm + ': ' + p.tr).join(' · '), parts };
  }
  return null;
}

// Metni dokunulabilir parçalara böl: [{ pre, word, post }]
export function segments(text) {
  const out = [];
  let last = 0;
  let m;
  WORD_RE.lastIndex = 0;
  while ((m = WORD_RE.exec(text))) {
    const between = text.slice(last, m.index);
    if (out.length) out[out.length - 1].post += between;
    out.push({ pre: out.length ? '' : between, word: m[0], post: '' });
    last = m.index + m[0].length;
  }
  if (out.length) out[out.length - 1].post += text.slice(last);
  return out;
}

// Kısa anlam (sınav seçenekleri için): ilk ";" öncesi, parantezsiz
export const shortTr = (tr) => String(tr || '').split(';')[0].replace(/\s*\(.*?\)\s*/g, ' ').trim() || String(tr || '');

// ---------- ilerleme ----------
export const lessonCount = () => LESSONS.length;
export const levelOf = (i) => (LESSONS[i] ? LESSONS[i].lv : 'C2');
export function levelProgress(cur) {
  const L = LESSONS[Math.min(cur, LESSONS.length - 1)];
  const inLevel = LESSONS.filter((x) => x.lv === L.lv).length;
  return { lv: L.lv, n: Math.min(cur, LESSONS.length - 1) - LESSONS.findIndex((x) => x.lv === L.lv) + 1, of: inLevel };
}
export const doneToday = (eng, td = today()) => eng.day === td;
// Bugün açılacak ders: tamamlanmamış ilk ders
export const currentIndex = (eng) => Math.min(eng.cur || 0, LESSONS.length);
export const finishedAll = (eng) => (eng.cur || 0) >= LESSONS.length;

// Ders bitti: ilerle, yeni kelimeleri kart kutusuna koy
export function completeLesson(d, idx, td = today()) {
  const L = LESSONS[idx];
  if (!L) return d;
  d.done = d.done || {};
  d.cards = d.cards || {};
  if (!d.done[idx]) d.done[idx] = td;
  d.cur = Math.max(d.cur || 0, idx + 1);
  d.day = td;
  for (const w of L.words) if (!d.cards[w]) d.cards[w] = [1, addDays(td, INTERVAL[1])];
  return d;
}

// Kart cevabı: bildim → bir üst kutu, bilemedim → 1. kutu ve bugün tekrar
export function gradeCard(d, w, knew, td = today()) {
  d.cards = d.cards || {};
  const c = d.cards[w] || [0, td];
  const box = knew ? Math.min(MAX_BOX, (c[0] || 0) + 1) : 1;
  d.cards[w] = [box, knew ? addDays(td, INTERVAL[box]) : td];
  return d;
}

export function dueCards(eng, td = today()) {
  const C = eng.cards || {};
  return Object.keys(C).filter((w) => C[w][1] <= td && DICT[w]).sort((a, b) => (C[a][1] < C[b][1] ? -1 : C[a][1] > C[b][1] ? 1 : C[a][0] - C[b][0]));
}
export const learnedCount = (eng) => Object.keys(eng.cards || {}).length;
export const masteredCount = (eng) => Object.values(eng.cards || {}).filter((c) => c[0] >= 4).length;

// Kelimenin ilk geçtiği ders (seviye etiketi için)
let FIRST = null;
export function firstLesson(w) {
  if (!FIRST) {
    FIRST = {};
    LESSONS.forEach((L, i) => L.words.forEach((x) => { if (FIRST[x] === undefined) FIRST[x] = i; }));
  }
  return FIRST[w];
}
export function exampleOf(w) {
  const i = firstLesson(w);
  return i === undefined ? '' : (LESSONS[i].ex || {})[w] || '';
}

// Sınav: her kelime için 4 seçenek (aynı seviyeden çeldiriciler)
export function quizFor(idx, rnd = Math.random) {
  const L = LESSONS[idx];
  const pool = [];
  for (let i = Math.max(0, idx - 12); i < Math.min(LESSONS.length, idx + 12); i++) pool.push(...LESSONS[i].words);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return L.words.map((w) => {
    const right = shortTr(DICT[w]);
    const opts = [right];
    for (const o of shuffle(pool.slice())) {
      if (opts.length >= 4) break;
      const s = shortTr(DICT[o]);
      if (o !== w && s && !opts.includes(s)) opts.push(s);
    }
    return { w, right, opts: shuffle(opts) };
  });
}

// ---------- rutin zinciri ----------
export const findRoutine = (routines) => (routines.items || []).find((r) => r.sys === 'eng');
// Aç: rutini (eski zinciriyle) geri ekle. Kapat: zinciri sakla, rutini kaldır.
export function setOn(update, st, on, rid) {
  const r = findRoutine(st.routines);
  if (on) {
    update('eng', (d) => { d.on = true; });
    if (!r) {
      const chain = (st.eng && st.eng.chain) || [];
      update('routines', (d) => {
        d.items.push({ id: rid(), sys: 'eng', name: ROUTINE_NAME, done: chain.slice(), color: ENG_COLOR, rTime: (st.eng && st.eng.time) || '' });
      });
    }
  } else {
    update('eng', (d) => { d.on = false; if (r) d.chain = (r.done || []).slice(-1000); });
    if (r) update('routines', (d) => { d.items = d.items.filter((x) => x.sys !== 'eng'); });
  }
}
// Bugünkü dersi bitirince zinciri işaretle
export function markRoutine(update, td = today()) {
  update('routines', (d) => {
    const r = d.items.find((x) => x.sys === 'eng');
    if (r && !r.done.includes(td)) r.done.push(td);
  });
}
