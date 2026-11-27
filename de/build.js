// Almanca ders verisini derler: metinler + sözlük -> src/german/data.js
// Her metindeki her kelime ya önceki derslerde öğrenilmiş ya da o dersin yeni kelimesidir.
// content/dict.txt:  anahtar = Gösterim | anlam   (ör. haus = das Haus | ev)  ya da  anahtar = anlam
// content/forms.txt: çekimli biçim > kök          (ör. ging > gehen)
// Metin dosyasında "> ..." satırları derse kalıp notu olarak eklenir.
// Kullanım: node de/build.js --report  |  node de/build.js --write src/german/data.js
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const L_ = 'A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÇçÜüÖöÄäß';
const WORD = new RegExp('[' + L_ + ']+(?:[-\'’][' + L_ + ']+)*', 'g');

function readText(lv) {
  const f = path.join(DIR, 'content', lv + '.txt');
  if (!fs.existsSync(f)) return [];
  const out = [];
  let cur = null;
  for (const line of fs.readFileSync(f, 'utf8').replace(/\r/g, '').split('\n')) {
    const m = line.match(/^#\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*$/);
    if (m) { cur = { lv, n: +m[1], tr: m[2], title: m[3], body: [], notes: [] }; out.push(cur); continue; }
    if (!cur || !line.trim()) continue;
    if (line.trim().startsWith('>')) cur.notes.push(line.trim().slice(1).trim());
    else cur.body.push(line.trim());
  }
  out.forEach((x) => { x.text = x.body.join('\n'); delete x.body; });
  return out;
}

function readDict() {
  const d = {}, disp = {};
  const f = path.join(DIR, 'content', 'dict.txt');
  if (fs.existsSync(f)) {
    for (const line of fs.readFileSync(f, 'utf8').replace(/\r/g, '').split('\n')) {
      const m = line.match(/^\s*([^\s=#][^=]*?)\s*=\s*(.+?)\s*$/);
      if (!m) continue;
      const k = m[1].toLowerCase();
      const v = m[2];
      const i = v.indexOf(' | ');
      if (i > 0) { disp[k] = v.slice(0, i).trim(); d[k] = v.slice(i + 3).trim(); } else d[k] = v;
    }
  }
  return { d, disp };
}
function readForms() {
  const fm = {};
  const f = path.join(DIR, 'content', 'forms.txt');
  if (fs.existsSync(f)) {
    for (const line of fs.readFileSync(f, 'utf8').replace(/\r/g, '').split('\n')) {
      const m = line.match(/^\s*([^\s>#][^>]*?)\s*>\s*(\S+)\s*$/);
      if (m) for (const x of m[1].split(',')) fm[x.trim().toLowerCase()] = m[2].toLowerCase();
    }
  }
  return fm;
}
const NAMES = new Set(fs.readFileSync(path.join(DIR, 'content', 'names.txt'), 'utf8').split(/\s+/).filter(Boolean).map((s) => s.toLowerCase()));
const isName = (raw) => /^[A-ZÇĞİÖŞÜÄ]/.test(raw) && NAMES.has(raw.toLowerCase());
const clean = (w) => w.toLowerCase().replace(/’/g, "'");

const SEP = ['zurück', 'zusammen', 'vorbei', 'weiter', 'statt', 'fest', 'fern', 'teil', 'nach', 'heim', 'weg', 'vor', 'mit', 'los', 'her', 'hin', 'aus', 'auf', 'ein', 'bei', 'ab', 'an', 'zu', 'um', 'durch', 'über', 'unter', 'wieder'];
const deUml = (s) => {
  const out = new Set([s]);
  const r = [[/äu(?=[^äöü]*$)/, 'au'], [/ä(?=[^äöü]*$)/, 'a'], [/ö(?=[^äöü]*$)/, 'o'], [/ü(?=[^äöü]*$)/, 'u']];
  for (const [re, to] of r) if (re.test(s)) out.add(s.replace(re, to));
  return [...out];
};
const ENDS = ['sten', 'ster', 'stem', 'stes', 'ste', 'test', 'tet', 'ten', 'tes', 'ern', 'est', 'em', 'en', 'er', 'es', 'et', 'st', 'te', 'e', 'n', 's', 't'];

function candidates(w) {
  const c = [];
  const add = (s) => { if (s && s.length > 1) for (const u of deUml(s)) c.push(u, u + 'en', u + 'n', u + 'e', u + 'er'); };
  c.push(w + 'en', w + 'n', w + 'e');
  if (/ss(e|en|es)$/.test(w)) c.push(w.replace(/ss(e|en|es)$/, 's'));
  if (/innen$/.test(w)) c.push(w.slice(0, -3));
  for (const e of ENDS) if (w.length > e.length + 1 && w.endsWith(e)) add(w.slice(0, -e.length));
  // Partizip: ge…t / ge…en, ayrılabilir önekle: auf-ge-…
  const part = (rest, pre) => {
    for (const e of ['t', 'et', 'en', 'n']) {
      if (rest.endsWith(e) && rest.length > e.length + 1) {
        const s = rest.slice(0, -e.length);
        for (const u of deUml(s)) c.push(pre + u + 'en', pre + u + 'n');
      }
    }
  };
  if (w.startsWith('ge') && w.length > 4) part(w.slice(2), '');
  for (const p of SEP) {
    if (w.startsWith(p + 'ge') && w.length > p.length + 4) part(w.slice(p.length + 2), p);
    if (w.startsWith(p + 'zu') && w.length > p.length + 4) c.push(p + w.slice(p.length + 2));
  }
  // be-, ver-, er-, ent- fiillerinin ortacı: -t ile biter (bezahlt -> bezahlen)
  if (/^(be|ver|er|ent|zer|emp|miss|über|unter|wieder)/.test(w)) part(w, '');
  // son çare: ayrılabilir öneki at (ausruhen -> ruhen)
  for (const p of SEP) if (w.startsWith(p) && w.length > p.length + 3) { const r = w.slice(p.length); c.push(r); for (const e of ENDS) if (r.endsWith(e)) c.push(r.slice(0, -e.length) + 'en'); }
  return c;
}

function lemmaOf(w, dict, forms) {
  if (dict[w]) return w;
  if (forms[w] && dict[forms[w]]) return forms[w];
  for (const c of candidates(w)) if (dict[c]) return c;
  return null;
}

function sentences(text) {
  return text.replace(/\n/g, ' ').match(/[^.!?]+[.!?]+["'”’“]?|[^.!?]+$/g).map((s) => s.trim()).filter(Boolean);
}

function build(report) {
  const { d: dict, disp } = readDict();
  const forms = readForms();
  const lessons = [];
  for (const lv of LEVELS) lessons.push(...readText(lv));
  const seen = new Set();
  const formMap = {};
  const missing = new Map();
  const out = [];
  lessons.forEach((L, i) => {
    const nw = [], ex = {}, fm = {};
    for (const s of sentences(L.text)) {
      for (const raw of s.match(WORD) || []) {
        if (isName(raw)) continue;
        const w = clean(raw);
        const parts = !w.includes('-') || lemmaOf(w, dict, forms) ? [w] : w.split('-').filter(Boolean);
        for (const p of parts) {
          const lm = lemmaOf(p, dict, forms);
          if (!lm) {
            if (!missing.has(p)) missing.set(p, L.lv + '-' + L.n);
            continue;
          }
          if (p !== lm) formMap[p] = lm;
          if (!seen.has(lm)) { seen.add(lm); nw.push(lm); ex[lm] = s; if (p !== lm) fm[lm] = raw; }
        }
      }
    }
    out.push({ id: i, lv: L.lv, n: L.n, title: L.title, tr: L.tr, text: L.text, notes: L.notes, words: nw, ex, fm });
  });
  if (report) {
    for (const lv of LEVELS) {
      const ls = out.filter((x) => x.lv === lv);
      if (!ls.length) continue;
      const counts = ls.map((x) => x.words.length);
      const wc = ls.map((x) => (x.text.match(WORD) || []).length);
      console.log(lv, 'ders', ls.length, '| yeni/ders:', counts.join(','), '| toplam', counts.reduce((a, b) => a + b, 0), '| uzunluk ort', Math.round(wc.reduce((a, b) => a + b, 0) / wc.length));
    }
    console.log('Sözlükte olmayan:', missing.size);
    fs.writeFileSync(path.join(DIR, 'missing.txt'), [...missing].map(([w, at]) => w + ' @' + at).join('\n'));
  }
  return { out, dict, disp, formMap, missing, seen };
}

if (require.main === module) {
  const r = build(true);
  if (process.argv.includes('--write')) {
    if (r.missing.size) { console.log('Eksik kelimeler var, yazılmadı.'); process.exit(1); }
    const DICT = {}, DISP = {};
    for (const k of r.seen) { DICT[k] = r.dict[k]; if (r.disp[k]) DISP[k] = r.disp[k]; }
    const js = '// Otomatik üretildi (de/build.js). Elle düzenleme; metinler de/content içinde.\n' +
      'export const LESSONS = ' + JSON.stringify(r.out) + ';\n' +
      'export const DICT = ' + JSON.stringify(DICT) + ';\n' +
      'export const DISP = ' + JSON.stringify(DISP) + ';\n' +
      'export const FORMS = ' + JSON.stringify(r.formMap) + ';\n' +
      'export const NAMES = ' + JSON.stringify([...NAMES]) + ';\n';
    const dest = process.argv[process.argv.indexOf('--write') + 1];
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, js);
    console.log('yazıldı', dest, Math.round(js.length / 1024) + ' KB');
  }
}
module.exports = { build, WORD, clean, candidates };
