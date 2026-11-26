// İngilizce ders verisini derler: metinler + sözlük -> src/english/data.js
// Her metindeki her kelime ya önceki derslerde öğrenilmiş ya da o dersin yeni kelimesidir.
// Kullanım: node build.js [--report]
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const IRR = {
  is: 'be', are: 'be', am: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', having: 'have', did: 'do', does: 'do', done: 'do', doing: 'do',
  went: 'go', gone: 'go', goes: 'go', made: 'make', said: 'say', says: 'say', took: 'take', taken: 'take',
  got: 'get', gotten: 'get', saw: 'see', seen: 'see', came: 'come', gave: 'give', given: 'give',
  knew: 'know', known: 'know', thought: 'think', bought: 'buy', brought: 'bring', found: 'find',
  told: 'tell', felt: 'feel', ate: 'eat', eaten: 'eat', drank: 'drink', drunk: 'drink', wrote: 'write',
  written: 'write', spoke: 'speak', spoken: 'speak', ran: 'run', swam: 'swim', sang: 'sing', sung: 'sing',
  began: 'begin', begun: 'begin', met: 'meet', sat: 'sit', stood: 'stand', understood: 'understand',
  taught: 'teach', caught: 'catch', built: 'build', sent: 'send', spent: 'spend', lost: 'lose',
  paid: 'pay', heard: 'hear', held: 'hold', kept: 'keep', slept: 'sleep', meant: 'mean', chose: 'choose',
  chosen: 'choose', drove: 'drive', driven: 'drive', rode: 'ride', ridden: 'ride', flew: 'fly', flown: 'fly',
  grew: 'grow', grown: 'grow', threw: 'throw', thrown: 'throw', broke: 'break', broken: 'break',
  fell: 'fall', fallen: 'fall', forgot: 'forget', forgotten: 'forget', won: 'win', wore: 'wear',
  worn: 'wear', became: 'become', led: 'lead', rose: 'rise', risen: 'rise', shook: 'shake', shaken: 'shake',
  woke: 'wake', woken: 'wake', hid: 'hide', hidden: 'hide', sold: 'sell', sought: 'seek', fought: 'fight',
  fed: 'feed', dealt: 'deal', drew: 'draw', drawn: 'draw', laid: 'lay', overcame: 'overcome',
  withdrew: 'withdraw', withdrawn: 'withdraw', arose: 'arise', arisen: 'arise', struck: 'strike',
  shone: 'shine', stuck: 'stick', lent: 'lend', bent: 'bend', bound: 'bind', wept: 'weep', swept: 'sweep',
  forgave: 'forgive', stung: 'sting', begot: 'beget', begotten: 'beget', rewrote: 'rewrite', rewritten: 'rewrite', reread: 'reread', forgiven: 'forgive', undertook: 'undertake', undertaken: 'undertake',
  understood_: 'understand', mistook: 'mistake', mistaken: 'mistake', foresaw: 'foresee', foreseen: 'foresee',
  men: 'man', women: 'woman', children: 'child', teeth: 'tooth', feet: 'foot', mice: 'mouse',
  lives: 'life', wives: 'wife', knives: 'knife', leaves: 'leaf', shelves: 'shelf', halves: 'half',
  analyses: 'analysis', crises: 'crisis', hypotheses: 'hypothesis', phenomena: 'phenomenon', criteria: 'criterion',
  data: 'data', media: 'media', thieves: 'thief', selves: 'self', themselves: 'themselves',
  sprang: 'spring', spun: 'spin', slid: 'slide', fled: 'flee', clung: 'cling', strove: 'strive', striven: 'strive',
  dug: 'dig', hung: 'hang', lit: 'light', fit: 'fit', shot: 'shoot', bore: 'bear', borne: 'bear', tore: 'tear',
  torn: 'tear', froze: 'freeze', frozen: 'freeze', stole: 'steal', stolen: 'steal', bit: 'bit',
};

function readText(lv) {
  const f = path.join(DIR, 'content', lv + '.txt');
  if (!fs.existsSync(f)) return [];
  const raw = fs.readFileSync(f, 'utf8').replace(/\r/g, '');
  const out = [];
  let cur = null;
  for (const line of raw.split('\n')) {
    const m = line.match(/^#\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*$/);
    if (m) { cur = { lv, n: +m[1], tr: m[2], title: m[3], body: [] }; out.push(cur); continue; }
    if (cur && line.trim()) cur.body.push(line.trim());
  }
  out.forEach((x) => { x.text = x.body.join('\n'); delete x.body; });
  return out;
}

function readDict() {
  const d = {};
  const f = path.join(DIR, 'content', 'dict.txt');
  if (!fs.existsSync(f)) return d;
  for (const line of fs.readFileSync(f, 'utf8').replace(/\r/g, '').split('\n')) {
    const m = line.match(/^\s*([^\s=#][^=]*?)\s*=\s*(.+?)\s*$/);
    if (m) d[m[1]] = m[2];
  }
  return d;
}
const NAMES = new Set(fs.readFileSync(path.join(DIR, 'content', 'names.txt'), 'utf8').split(/\s+/).filter(Boolean).map((s) => s.toLowerCase()));

// Özel ad: büyük harfle başlayan ve ad listesinde olan
const isName = (raw) => /^[A-ZÇĞİÖŞÜ]/.test(raw) && NAMES.has(raw.replace(/['’]s$/, '').toLowerCase());
// Metni kelimelere böl (uygulamadakiyle aynı kural)
const WORD = /[A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÇçÜüÖö]+(?:[-'’][A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÇçÜüÖö]+)*/g;
const clean = (w) => w.toLowerCase().replace(/’/g, "'").replace(/'s$/, '').replace(/s'$/, 's');

function candidates(w) {
  const c = [];
  if (IRR[w]) c.push(IRR[w]);
  const dbl = (s) => s.length > 2 && s[s.length - 1] === s[s.length - 2] && !/[aeiou]/.test(s[s.length - 1]) ? s.slice(0, -1) : null;
  if (w.endsWith('ies') && w.length > 4) c.push(w.slice(0, -3) + 'y');
  if (w.endsWith('s') && !w.endsWith('ss')) c.push(w.slice(0, -1));
  if (w.endsWith('es')) c.push(w.slice(0, -2));
  if (w.endsWith('ied')) c.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ed')) { const s = w.slice(0, -2); c.push(s + 'e', s); const d = dbl(s); if (d) c.push(d); }
  if (w.endsWith('d')) c.push(w.slice(0, -1));
  if (w.endsWith('ing')) { const s = w.slice(0, -3); c.push(s + 'e', s); const d = dbl(s); if (d) c.push(d); if (s.endsWith('y')) c.push(s.slice(0, -1) + 'ie'); }
  if (w.endsWith('ier')) c.push(w.slice(0, -3) + 'y');
  if (w.endsWith('iest')) c.push(w.slice(0, -4) + 'y');
  if (w.endsWith('er')) { const s = w.slice(0, -2); c.push(s + 'e', s); const d = dbl(s); if (d) c.push(d); }
  if (w.endsWith('est')) { const s = w.slice(0, -3); c.push(s + 'e', s); const d = dbl(s); if (d) c.push(d); }
  return c;
}

function lemmaOf(w, dict) {
  if (dict[w]) return w;
  for (const c of candidates(w)) if (dict[c]) return c;
  return null;
}
// Sözlükte yokken öneri
function guess(w) {
  if (IRR[w]) return IRR[w];
  if (/(ss|us|is|ous)$/.test(w)) return w;
  if (/ies$/.test(w)) return w.slice(0, -3) + 'y';
  if (/(ches|shes|xes|sses|zes)$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && w.length > 3) return w.slice(0, -1);
  if (/ied$/.test(w)) return w.slice(0, -3) + 'y';
  if (/([bcdfghjklmnpqrstvwz])\1(ed|ing)$/.test(w)) return w.replace(/([a-z])\1(ed|ing)$/, '$1');
  if (/ed$/.test(w)) return w.slice(0, -2);
  if (/ing$/.test(w) && w.length > 5) return w.slice(0, -3);
  return w;
}

function sentences(text) {
  return text.replace(/\n/g, ' ').match(/[^.!?]+[.!?]+["'”’]?|[^.!?]+$/g).map((s) => s.trim()).filter(Boolean);
}

function build(report) {
  const dict = readDict();
  const lessons = [];
  for (const lv of LEVELS) lessons.push(...readText(lv));
  const seen = new Set();
  const forms = {};
  const missing = new Map();
  const out = [];
  lessons.forEach((L, i) => {
    const sents = sentences(L.text);
    const nw = [];
    const ex = {};
    const fm = {};
    for (const s of sents) {
      for (const raw of s.match(WORD) || []) {
        const w = clean(raw);
        if (isName(raw)) continue;
        const parts = !w.includes('-') || lemmaOf(w, dict) ? [w] : w.split('-').filter(Boolean);
        for (const p of parts) {
          const lm = lemmaOf(p, dict);
          if (!lm) {
            const g = guess(p);
            if (!missing.has(g)) missing.set(g, { forms: new Set(), at: L.lv + '-' + L.n });
            missing.get(g).forms.add(p);
            continue;
          }
          if (p !== lm) forms[p] = lm;
          if (!seen.has(lm)) { seen.add(lm); nw.push(lm); ex[lm] = s; if (p !== lm) fm[lm] = p; }
        }
      }
    }
    out.push({ id: i, lv: L.lv, n: L.n, title: L.title, tr: L.tr, text: L.text, words: nw, ex, fm });
  });
  if (report) {
    for (const lv of LEVELS) {
      const ls = out.filter((x) => x.lv === lv);
      if (!ls.length) continue;
      const counts = ls.map((x) => x.words.length);
      const wc = ls.map((x) => (x.text.match(WORD) || []).length);
      console.log(lv, 'ders', ls.length, '| yeni kelime/ders:', counts.join(','), '| toplam', counts.reduce((a, b) => a + b, 0), '| metin uzunluğu ort', Math.round(wc.reduce((a, b) => a + b, 0) / wc.length));
    }
    console.log('Sözlükte olmayan:', missing.size);
    if (missing.size) fs.writeFileSync(path.join(DIR, 'missing.txt'), [...missing].map(([g, v]) => g + ' = ' + ' # ' + [...v.forms].join(',') + ' @' + v.at).join('\n'));
    const used = new Set(Object.values(forms).concat([...seen]));
    const unused = Object.keys(dict).filter((k) => !used.has(k));
    if (unused.length) console.log('Kullanılmayan sözlük girişi:', unused.length, unused.slice(0, 30).join(' '));
  }
  return { out, dict, forms, missing, seen };
}

if (require.main === module) {
  const r = build(true);
  if (!r.missing.size && process.argv.includes('--write')) {
    const DICT = {};
    for (const k of r.seen) DICT[k] = r.dict[k];
    const js = '// Otomatik üretildi (eng/build.js). Elle düzenleme; metinler eng/content içinde.\n' +
      'export const LESSONS = ' + JSON.stringify(r.out) + ';\n' +
      'export const DICT = ' + JSON.stringify(DICT) + ';\n' +
      'export const FORMS = ' + JSON.stringify(r.forms) + ';\n' +
      'export const NAMES = ' + JSON.stringify([...NAMES]) + ';\n';
    const dest = process.argv[process.argv.indexOf('--write') + 1];
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, js);
    console.log('yazıldı', dest, Math.round(js.length / 1024) + ' KB');
  }
}
module.exports = { build, WORD, clean };
