// Dil dersleri (İngilizce, Almanca): ders ilerleyişi, tekrar kartları, kelime arama. React'e bağımlı değil.
import { today, addDays } from '../logic';

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const LEVEL_TR = { A1: 'Başlangıç', A2: 'Temel', B1: 'Orta', B2: 'Orta üstü', C1: 'İleri', C2: 'Ustalık' };
export const LEVEL_DESC = {
  A1: 'Hiç bilmiyorum ya da çok az biliyorum',
  A2: 'Basit cümleler kurabiliyorum',
  B1: 'Günlük konuları anlıyorum, kendimi ifade edebiliyorum',
  B2: 'Haberleri, makaleleri büyük ölçüde anlıyorum',
  C1: 'Akademik ve iş metinlerini rahat okuyorum',
  C2: 'Neredeyse ana dil gibi',
};
// Kart kutuları (aralıklı tekrar): kutu numarası → bir sonraki tekrara kalan gün
export const INTERVAL = [0, 1, 2, 4, 8, 16, 32];
export const MAX_BOX = INTERVAL.length - 1;
export const langDefault = () => ({ on: false, picked: false, cur: 0, done: {}, day: '', cards: {}, time: '', chain: [] });

const L_ = 'A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÇçÜüÖöÄäß';
const WORD_RE = new RegExp('[' + L_ + ']+(?:[-\'’][' + L_ + ']+)*', 'g');
// Kısa anlam (sınav seçenekleri için): ilk ";" öncesi, parantezsiz
export const shortTr = (tr) => String(tr || '').split(';')[0].replace(/\s*\(.*?\)\s*/g, ' ').trim() || String(tr || '');

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

// cfg: { key, sys, name, short, flag, color, tts, routineName, stripS, data: { LESSONS, DICT, DISP, FORMS, NAMES } }
export function makeLang(cfg) {
  const { LESSONS, DICT, FORMS, NAMES } = cfg.data;
  const DISP = cfg.data.DISP || {};
  const NAME_SET = new Set(NAMES);
  const clean = (w) => {
    let s = String(w).toLowerCase().replace(/’/g, "'");
    if (cfg.stripS) s = s.replace(/'s$/, '').replace(/s'$/, 's');
    return s;
  };
  const isName = (raw) => /^[A-ZÇĞİÖŞÜÄ]/.test(raw) && NAME_SET.has(String(raw).replace(cfg.stripS ? /['’]s$/ : /$^/, '').toLowerCase());
  const disp = (lm) => DISP[lm] || lm;

  // Bir kelimenin anlamı: { lm (kök), tr (anlam), form (metindeki biçim), disp } ya da { name: true }
  function lookup(raw) {
    if (isName(raw)) return { name: true, word: raw.replace(/['’]s$/, '') };
    const w = clean(raw);
    const lm = DICT[w] ? w : FORMS[w];
    if (lm && DICT[lm]) return { lm, tr: DICT[lm], form: w !== lm ? w : null, disp: disp(lm) };
    if (w.includes('-')) {
      const parts = w.split('-').filter(Boolean).map((p) => {
        const l = DICT[p] ? p : FORMS[p];
        return l && DICT[l] ? { lm: l, tr: DICT[l] } : null;
      }).filter(Boolean);
      if (parts.length) return { lm: w, tr: parts.map((p) => disp(p.lm) + ': ' + p.tr).join(' · '), parts, disp: w };
    }
    return null;
  }

  const firstOf = (lv) => LESSONS.findIndex((x) => x.lv === lv);
  function levelProgress(cur) {
    const i = Math.min(cur, LESSONS.length - 1);
    const L = LESSONS[i];
    return { lv: L.lv, n: L.n, of: LESSONS.filter((x) => x.lv === L.lv).length };
  }
  const doneToday = (E, td = today()) => E.day === td;
  const currentIndex = (E) => Math.min(E.cur || 0, LESSONS.length);
  const finishedAll = (E) => (E.cur || 0) >= LESSONS.length;

  // Ders bitti: ilerle, yeni kelimeleri kart kutusuna koy
  function completeLesson(d, idx, td = today()) {
    const L = LESSONS[idx];
    if (!L) return d;
    d.done = d.done || {};
    d.cards = d.cards || {};
    if (!d.done[idx]) d.done[idx] = td;
    d.cur = Math.max(d.cur || 0, idx + 1);
    d.day = td;
    d.picked = true;
    for (const w of L.words) if (!d.cards[w]) d.cards[w] = [1, addDays(td, INTERVAL[1])];
    return d;
  }
  // Seviye seç: sıradaki ders o seviyenin ilk dersi olur (bugünkü ders kilidi açılır)
  function pickLevel(d, lv) {
    const i = firstOf(lv);
    if (i < 0) return d;
    d.cur = i;
    d.day = '';
    d.picked = true;
    return d;
  }
  // Kart cevabı: bildim → bir üst kutu, bilemedim → 1. kutu ve bugün tekrar
  function gradeCard(d, w, knew, td = today()) {
    d.cards = d.cards || {};
    const c = d.cards[w] || [0, td];
    const box = knew ? Math.min(MAX_BOX, (c[0] || 0) + 1) : 1;
    d.cards[w] = [box, knew ? addDays(td, INTERVAL[box]) : td];
    return d;
  }
  function dueCards(E, td = today()) {
    const C = E.cards || {};
    return Object.keys(C).filter((w) => C[w][1] <= td && DICT[w]).sort((a, b) => (C[a][1] < C[b][1] ? -1 : C[a][1] > C[b][1] ? 1 : C[a][0] - C[b][0]));
  }
  const learnedCount = (E) => Object.keys(E.cards || {}).length;
  const masteredCount = (E) => Object.values(E.cards || {}).filter((c) => c[0] >= 4).length;

  let FIRST = null;
  function firstLesson(w) {
    if (!FIRST) {
      FIRST = {};
      LESSONS.forEach((L, i) => L.words.forEach((x) => { if (FIRST[x] === undefined) FIRST[x] = i; }));
    }
    return FIRST[w];
  }
  function exampleOf(w) {
    const i = firstLesson(w);
    return i === undefined ? '' : (LESSONS[i].ex || {})[w] || '';
  }

  // Sınav: her kelime için 4 seçenek (yakın derslerden çeldiriciler)
  function quizFor(idx, rnd = Math.random) {
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

  // Rutin zinciri: aç → rutini (eski zinciriyle) ekle; kapat → zinciri sakla, rutini kaldır
  const findRoutine = (routines) => (routines.items || []).find((r) => r.sys === cfg.sys);
  function setOn(update, st, on, rid) {
    const E = st[cfg.key] || {};
    const r = findRoutine(st.routines);
    if (on) {
      update(cfg.key, (d) => { d.on = true; });
      if (!r) {
        update('routines', (d) => {
          d.items.push({ id: rid(), sys: cfg.sys, name: cfg.routineName, done: (E.chain || []).slice(), color: cfg.color, rTime: E.time || '' });
        });
      }
    } else {
      update(cfg.key, (d) => { d.on = false; if (r) d.chain = (r.done || []).slice(-1000); });
      if (r) update('routines', (d) => { d.items = d.items.filter((x) => x.sys !== cfg.sys); });
    }
  }
  function markRoutine(update, td = today()) {
    update('routines', (d) => {
      const r = d.items.find((x) => x.sys === cfg.sys);
      if (r && !r.done.includes(td)) r.done.push(td);
    });
  }

  return {
    ...cfg, LESSONS, DICT, DISP, LEVELS, LEVEL_TR, clean, isName, disp, lookup, segments, firstOf, levelProgress, doneToday,
    currentIndex, finishedAll, completeLesson, pickLevel, gradeCard, dueCards, learnedCount, masteredCount, firstLesson,
    exampleOf, quizFor, findRoutine, setOn, markRoutine,
  };
}
