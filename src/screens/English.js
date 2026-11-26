// İngilizce: her gün bir ders (A1 → C2). Önce yeni kelimeler, sonra dokununca anlamı açılan metin,
// ardından kelime kartları ve kısa sınav. Ders bitince "İngilizce: günün dersi" rutini işaretlenir.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, BackHandler, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useStore } from '../store';
import { useTheme, alpha, modColor } from '../theme';
import { T, Mute, H2, H3, Card, Btn, Chip, Row, Field, TimeField, Bar, Empty, ListRow, IconBtn, Switch, SectionHead, Grid, useUI } from '../ui';
import { useGo, useScrollTop } from '../components';
import { today, rid, isTime, streak, fmtD } from '../logic';
import {
  LESSONS, DICT, LEVELS, LEVEL_TR, ENG_COLOR, MAX_BOX, lookup, segments, currentIndex, finishedAll, doneToday,
  completeLesson, gradeCard, dueCards, learnedCount, masteredCount, firstLesson, exampleOf, quizFor, levelProgress,
  findRoutine, setOn, markRoutine,
} from '../english/logic';

// ---------- sesli okuma ----------
export function speak(text) {
  try {
    Speech.stop();
    Speech.speak(String(text), { language: 'en-GB', rate: Platform.OS === 'web' ? 0.9 : 0.85 });
  } catch (e) { /* ses yoksa sessiz geç */ }
}
function SpeakBtn({ text, size = 20, label = 'Sesli oku' }) {
  const t = useTheme();
  return <IconBtn name="volume-high-outline" size={size} color={t.accT} label={label} onPress={() => speak(text)} />;
}

// Koyu kart üzerindeki düğme
function HeroBtn({ title, icon, onPress, solid }) {
  const t = useTheme();
  const fg = solid ? (t.hero || ENG_COLOR) : '#fff';
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 16, borderRadius: t.rb, flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: solid ? '#fff' : 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: solid ? '#fff' : 'rgba(255,255,255,0.4)', opacity: pressed ? 0.8 : 1 })}>
      <Ionicons name={icon} size={18} color={fg} />
      <Text style={{ color: fg, fontWeight: '800', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

// Seviye rozeti
function LvBadge({ lv, big }) {
  const t = useTheme();
  const i = LEVELS.indexOf(lv);
  const c = ['#1E9460', '#2E8B57', '#2F63D9', '#4A55C8', '#7A4FE0', '#C8326E'][i] || ENG_COLOR;
  return (
    <View style={{ backgroundColor: alpha(c, t.dark ? 0.28 : 0.14), borderRadius: 999, paddingHorizontal: big ? 12 : 9, paddingVertical: big ? 5 : 3 }}>
      <Text style={{ color: t.dark ? '#fff' : c, fontWeight: '800', fontSize: big ? 15 : 12.5 }}>{lv}</Text>
    </View>
  );
}

// ---------- dokununca anlamı açılan metin ----------
export function TapText({ text, highlight, size = 18 }) {
  const t = useTheme();
  const [sel, setSel] = useState(null);
  const paras = useMemo(() => text.split('\n').map((p) => segments(p)), [text]);
  const lh = Math.round(size * 1.65);
  return (
    <View style={{ gap: 12 }}>
      {paras.map((segs, pi) => (
        <View key={pi} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {segs.map((s, i) => {
            const key = pi + ':' + i;
            const on = sel === key;
            const info = on ? lookup(s.word) : null;
            const hit = highlight && (() => { const x = lookup(s.word); return x && x.lm && highlight.has(x.lm); })();
            return (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {s.pre ? <Text style={{ fontSize: size, lineHeight: lh, color: t.ink }}>{s.pre}</Text> : null}
                <View style={{ alignItems: 'flex-start' }}>
                  <Pressable onPress={() => setSel(on ? null : key)} hitSlop={2} accessibilityRole="button" accessibilityLabel={s.word + ': anlamını göster'}>
                    <Text style={{
                      fontSize: size, lineHeight: lh, color: on ? t.accI : t.ink, fontWeight: hit ? '700' : '400',
                      backgroundColor: on ? t.acc : hit ? alpha(t.acc, t.dark ? 0.22 : 0.1) : 'transparent',
                      borderRadius: 6, textDecorationLine: hit && !on ? 'underline' : 'none', textDecorationColor: t.acc,
                    }}>{s.word}</Text>
                  </Pressable>
                  {on ? (
                    <Pressable onPress={() => speak(info && info.lm && !info.name ? (info.form || info.lm) : s.word)}
                      style={{ marginTop: 2, marginBottom: 6, maxWidth: 230, minWidth: 120, backgroundColor: t.card2, borderWidth: 1, borderColor: t.acc, borderRadius: t.rs, paddingHorizontal: 10, paddingVertical: 7 }}>
                      {info && info.name ? (
                        <Text style={{ fontSize: 14, color: t.ink }}><Text style={{ fontWeight: '800' }}>{info.word}</Text>{' · özel ad'}</Text>
                      ) : info ? (
                        <View style={{ gap: 2 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: t.accT }}>
                            {info.form ? info.form + ' → ' + info.lm : info.lm}{'  '}<Ionicons name="volume-medium-outline" size={14} color={t.accT} />
                          </Text>
                          <Text style={{ fontSize: 14.5, color: t.ink }}>{info.tr}</Text>
                        </View>
                      ) : <Text style={{ fontSize: 14, color: t.mute }}>Anlam bulunamadı</Text>}
                    </Pressable>
                  ) : null}
                </View>
                {s.post ? <Text style={{ fontSize: size, lineHeight: lh, color: t.ink }}>{s.post}</Text> : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---------- kelime kartları ----------
// mode 'learn': sadece alıştırma; 'review': cevaplar tekrar kutularını günceller
function FlashDeck({ words, mode, onDone, forms }) {
  const t = useTheme();
  const { update } = useStore();
  const [queue, setQueue] = useState(words);
  const [flip, setFlip] = useState(false);
  const [known, setKnown] = useState(0);
  const total = words.length;
  const w = queue[0];
  useEffect(() => { setFlip(false); }, [w, queue.length]);
  if (!w) {
    return (
      <Card bg={alpha(t.grn, 0.12)} border={alpha(t.grn, 0.4)}>
        <Row><Ionicons name="checkmark-circle" size={26} color={t.grn} /><H3>Kartlar bitti</H3></Row>
        <Mute>{total + ' kelimenin hepsini bildin.'}</Mute>
        <Row><Btn kind="pri" title="Devam" icon="arrow-forward" onPress={onDone} /></Row>
      </Card>
    );
  }
  const answer = (ok) => {
    if (mode === 'review') update('eng', (d) => gradeCard(d, w, ok));
    if (ok) { setKnown((k) => k + 1); setQueue((q) => q.slice(1)); } else setQueue((q) => q.slice(1).concat([w]));
  };
  const ex = exampleOf(w);
  const form = forms && forms[w];
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Mute>{'Kart ' + Math.min(total, known + 1) + ' / ' + total + (queue.length > total - known ? ' · tekrar' : '')}</Mute>
        <Mute>Karta dokun, arkasını gör</Mute>
      </Row>
      <Bar pct={(known / Math.max(1, total)) * 100} color={ENG_COLOR} h={8} />
      <Pressable onPress={() => setFlip(!flip)} accessibilityRole="button" accessibilityLabel={flip ? 'Kartı çevir: kelime' : 'Kartı çevir: anlam'}
        style={({ pressed }) => ({ minHeight: 220, borderRadius: t.r, padding: 20, gap: 12, justifyContent: 'center', alignItems: 'center',
          backgroundColor: flip ? alpha(ENG_COLOR, t.dark ? 0.25 : 0.1) : t.card, borderWidth: 2, borderColor: flip ? ENG_COLOR : t.line, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        {!flip ? (
          <>
            <Text style={{ fontSize: 36, fontWeight: '800', color: t.ink, textAlign: 'center' }}>{w}</Text>
            {form ? <Mute>{'metinde: ' + form}</Mute> : null}
            {ex ? <Text style={{ fontSize: 15, color: t.mute, textAlign: 'center', fontStyle: 'italic' }}>{'“' + ex + '”'}</Text> : null}
            <SpeakBtn text={w} size={26} />
          </>
        ) : (
          <>
            <Mute>{w}</Mute>
            <Text style={{ fontSize: 26, fontWeight: '800', color: t.ink, textAlign: 'center' }}>{DICT[w]}</Text>
          </>
        )}
      </Pressable>
      <Row wrap={false}>
        <Btn title="Tekrar göster" icon="refresh" onPress={() => answer(false)} style={{ flex: 1 }} />
        <Btn kind="pri" title="Bildim" icon="checkmark" onPress={() => answer(true)} style={{ flex: 1 }} />
      </Row>
    </View>
  );
}

// ---------- sınav ----------
function Quiz({ idx, onDone }) {
  const t = useTheme();
  const qs0 = useMemo(() => quizFor(idx), [idx]);
  const [queue, setQueue] = useState(qs0);
  const [pick, setPick] = useState(null);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const q = queue[0];
  if (!q) {
    return (
      <Card bg={alpha(t.grn, 0.12)} border={alpha(t.grn, 0.4)}>
        <Row><Ionicons name="trophy" size={26} color={t.gold || t.yel} /><H3>Sınav tamam!</H3></Row>
        <Mute>{qs0.length + ' sorunun hepsini doğru bildin' + (wrong ? ' (' + wrong + ' yanlıştan sonra tekrar ederek).' : ', hiç yanlış yapmadan!')}</Mute>
        <Row><Btn kind="pri" title="Dersi bitir" icon="flag" onPress={onDone} /></Row>
      </Card>
    );
  }
  const ok = pick !== null && q.opts[pick] === q.right;
  const next = () => {
    if (ok) { setRight((r) => r + 1); setQueue((x) => x.slice(1)); } else setQueue((x) => x.slice(1).concat([q]));
    setPick(null);
  };
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Mute>{'Soru ' + Math.min(qs0.length, right + 1) + ' / ' + qs0.length}</Mute>
        {wrong ? <Mute>{wrong + ' yanlış · yanlışlar sona eklenir'}</Mute> : null}
      </Row>
      <Bar pct={(right / Math.max(1, qs0.length)) * 100} color={ENG_COLOR} h={8} />
      <Card>
        <Mute>Bu kelimenin anlamı ne?</Mute>
        <Row style={{ justifyContent: 'space-between' }} wrap={false}>
          <Text style={{ fontSize: 30, fontWeight: '800', color: t.ink, flex: 1 }}>{q.w}</Text>
          <SpeakBtn text={q.w} />
        </Row>
        {q.opts.map((o, i) => {
          const isRight = o === q.right;
          const show = pick !== null;
          const bg = show && isRight ? alpha(t.grn, 0.18) : show && pick === i ? alpha(t.red, 0.15) : t.card2;
          const bd = show && isRight ? t.grn : show && pick === i ? t.red : t.line;
          return (
            <Pressable key={i} disabled={show} onPress={() => { setPick(i); if (o !== q.right) setWrong((x) => x + 1); }}
              style={({ pressed }) => ({ minHeight: 50, borderRadius: t.rm, borderWidth: 1.5, borderColor: bd, backgroundColor: bg, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
              <Row wrap={false}>
                <Text style={{ flex: 1, fontSize: 16, color: t.ink, fontWeight: show && isRight ? '800' : '500' }}>{o}</Text>
                {show && isRight ? <Ionicons name="checkmark-circle" size={22} color={t.grn} /> : show && pick === i ? <Ionicons name="close-circle" size={22} color={t.red} /> : null}
              </Row>
            </Pressable>
          );
        })}
        {pick !== null ? (
          <View style={{ gap: 6 }}>
            <T w="700" c={ok ? t.grn : t.red}>{ok ? 'Doğru!' : 'Yanlış. Doğrusu: ' + q.right}</T>
            {!ok ? <Mute>{q.w + ' = ' + DICT[q.w]}</Mute> : null}
            <Row><Btn kind="pri" title="Sonraki" icon="arrow-forward" onPress={next} /></Row>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

// ---------- ders ----------
const STEPS = [['kelime', 'Kelimeler', 'list'], ['metin', 'Metin', 'document-text'], ['kart', 'Kartlar', 'albums'], ['sinav', 'Sınav', 'help-circle']];

function Lesson({ idx, fresh, onExit }) {
  const t = useTheme();
  const { st, update } = useStore();
  const { toast } = useUI();
  const top = useScrollTop();
  const L = LESSONS[idx];
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const hl = useMemo(() => new Set(L.words), [L]);
  useEffect(() => { top(); }, [step, finished]);
  const finish = () => {
    if (fresh) {
      update('eng', (d) => completeLesson(d, idx));
      if (st.eng.on) markRoutine(update);
    }
    setFinished(true);
    toast(fresh ? 'Ders tamamlandı, ' + L.words.length + ' kelime kartlara eklendi' : 'Tekrar tamamlandı');
  };
  const lp = levelProgress(idx);
  return (
    <View style={{ gap: 14 }}>
      <Row wrap={false}>
        <IconBtn name="arrow-back" label="İngilizce ana sayfasına dön" onPress={onExit} />
        <View style={{ flex: 1 }}>
          <Row style={{ gap: 6 }}><LvBadge lv={L.lv} /><Mute s={13}>{'Ders ' + L.n + ' / ' + lp.of + ' · ' + LEVEL_TR[L.lv]}</Mute></Row>
          <T s={20} w="800">{L.title}</T>
          <Mute s={13.5}>{L.tr}</Mute>
        </View>
      </Row>
      {!finished ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {STEPS.map(([k, l, ic], i) => {
            const on = i === step, past = i < step;
            return (
              <Pressable key={k} onPress={() => setStep(i)} accessibilityRole="tab" accessibilityState={{ selected: on }}
                style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8, borderRadius: t.rs, backgroundColor: on ? ENG_COLOR : past ? alpha(ENG_COLOR, 0.15) : t.card2 }}>
                <Ionicons name={past ? 'checkmark' : ic} size={17} color={on ? '#fff' : past ? (t.dark ? '#8CB0FF' : ENG_COLOR) : t.mute} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: on ? '#fff' : t.ink }} numberOfLines={1}>{(i + 1) + '. ' + l}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {finished ? (
        <Card bg={alpha(t.grn, 0.12)} border={alpha(t.grn, 0.45)}>
          <Row><Ionicons name="ribbon" size={30} color={t.grn} /><H2>Tebrikler!</H2></Row>
          <T>{fresh ? '“' + L.title + '” dersini bitirdin. ' + L.words.length + ' yeni kelime tekrar kartlarına eklendi; yarından itibaren aralıklarla karşına çıkacak.' : 'Bu dersi tekrar ettin.'}</T>
          {fresh && st.eng.on ? <Mute>Bugünkü İngilizce görevin işaretlendi, zincirin devam ediyor.</Mute> : null}
          <Row><Btn kind="pri" title="İngilizce ana sayfası" icon="home" onPress={onExit} /></Row>
        </Card>
      ) : step === 0 ? (
        <Card>
          <SectionHead icon="list" color={ENG_COLOR} title={'Bu metindeki yeni kelimeler (' + L.words.length + ')'} sub="Önce bunlara göz at; metinde kalın ve altı çizili görünecekler." />
          {L.words.map((w, i) => (
            <ListRow key={w} last={i === L.words.length - 1}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: t.ink }}>{w}{L.fm && L.fm[w] ? <Text style={{ fontSize: 13, fontWeight: '600', color: t.mute }}>{'  (' + L.fm[w] + ')'}</Text> : null}</Text>
                <Text style={{ fontSize: 15, color: t.ink }}>{DICT[w]}</Text>
              </View>
              <SpeakBtn text={w} />
            </ListRow>
          ))}
          <Row><Btn kind="pri" title="Metne geç" icon="arrow-forward" onPress={() => setStep(1)} /></Row>
        </Card>
      ) : step === 1 ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Mute style={{ flex: 1 }}>Bir kelimeye dokun, anlamı altında açılsın. Anlam kutusuna dokunursan okunuşunu dinlersin.</Mute>
            <Btn sm icon="volume-high-outline" title="Dinle" onPress={() => speak(L.text)} />
          </Row>
          <TapText text={L.text} highlight={hl} />
          <Row><Btn kind="pri" title="Kartlara geç" icon="arrow-forward" onPress={() => { try { Speech.stop(); } catch (e) { /* yok */ } setStep(2); }} /></Row>
        </Card>
      ) : step === 2 ? (
        <FlashDeck words={L.words} mode="learn" forms={L.fm} onDone={() => setStep(3)} />
      ) : (
        <Quiz idx={idx} onDone={finish} />
      )}
    </View>
  );
}

// ---------- tekrar ----------
function Review({ onExit }) {
  const { st } = useStore();
  const top = useScrollTop();
  const [words] = useState(() => dueCards(st.eng).slice(0, 25));
  useEffect(() => { top(); }, []);
  return (
    <View style={{ gap: 14 }}>
      <Row wrap={false}>
        <IconBtn name="arrow-back" label="Geri" onPress={onExit} />
        <View style={{ flex: 1 }}><T s={20} w="800">Kelime tekrarı</T><Mute s={13.5}>Bildiklerin daha seyrek, bilemediklerin daha sık gelir.</Mute></View>
      </Row>
      {words.length ? <FlashDeck words={words} mode="review" onDone={onExit} /> : <Card><Empty text="Bugün tekrar edilecek kelime yok." /></Card>}
    </View>
  );
}

// ---------- kelime defteri ----------
function WordBook({ onExit }) {
  const t = useTheme();
  const { st } = useStore();
  const top = useScrollTop();
  const [q, setQ] = useState('');
  const [lv, setLv] = useState('');
  const [open, setOpen] = useState(null);
  useEffect(() => { top(); }, []);
  const C = st.eng.cards || {};
  const all = useMemo(() => Object.keys(C).filter((w) => DICT[w]).sort((a, b) => (firstLesson(a) - firstLesson(b)) || a.localeCompare(b)), [C]);
  const f = q.trim().toLocaleLowerCase('tr');
  const list = all.filter((w) => (!lv || LESSONS[firstLesson(w)].lv === lv) && (!f || w.includes(f) || DICT[w].toLocaleLowerCase('tr').includes(f)));
  return (
    <View style={{ gap: 14 }}>
      <Row wrap={false}>
        <IconBtn name="arrow-back" label="Geri" onPress={onExit} />
        <View style={{ flex: 1 }}><T s={20} w="800">Kelime defterim</T><Mute s={13.5}>{all.length + ' kelime öğrendin · ' + masteredCount(st.eng) + ' tanesi iyice yerleşti'}</Mute></View>
      </Row>
      <Field value={q} onChangeText={setQ} placeholder="Ara (İngilizce ya da Türkçe)" autoCapitalize="none" />
      <Row><Chip label="Hepsi" on={!lv} onPress={() => setLv('')} />{LEVELS.map((x) => <Chip key={x} label={x} on={lv === x} onPress={() => setLv(lv === x ? '' : x)} />)}</Row>
      <Card>
        {list.length ? list.slice(0, 300).map((w, i) => {
          const c = C[w];
          const on = open === w;
          return (
            <Pressable key={w} onPress={() => setOpen(on ? null : w)} style={{ paddingVertical: 8, borderBottomWidth: i === Math.min(list.length, 300) - 1 ? 0 : 1, borderColor: t.line, gap: 4 }}>
              <Row wrap={false}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: t.ink }}>{w}</Text>
                  <Text style={{ fontSize: 14.5, color: t.ink }} numberOfLines={on ? undefined : 1}>{DICT[w]}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 3 }} accessibilityLabel={'Kutu ' + c[0] + ' / ' + MAX_BOX}>
                  {Array.from({ length: MAX_BOX }, (_, k) => <View key={k} style={{ width: 6, height: 14, borderRadius: 3, backgroundColor: k < c[0] ? ENG_COLOR : t.off || t.line }} />)}
                </View>
                <LvBadge lv={LESSONS[firstLesson(w)].lv} />
              </Row>
              {on ? (
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 14, color: t.mute, fontStyle: 'italic' }}>{'“' + exampleOf(w) + '”'}</Text>
                  <Row><Mute s={13}>{'Sonraki tekrar: ' + (c[1] <= today() ? 'bugün' : fmtD(c[1]))}</Mute><SpeakBtn text={w} size={18} /></Row>
                </View>
              ) : null}
            </Pressable>
          );
        }) : <Empty text={all.length ? 'Aramana uyan kelime yok.' : 'Ders bitirdikçe kelimeler buraya eklenir.'} />}
        {list.length > 300 ? <Mute>İlk 300 kelime gösteriliyor; aramayı daralt.</Mute> : null}
      </Card>
    </View>
  );
}

// ---------- geçmiş dersler ----------
function Archive({ onOpen, onExit }) {
  const t = useTheme();
  const { st } = useStore();
  const top = useScrollTop();
  const [lv, setLv] = useState(LESSONS[Math.min(currentIndex(st.eng), LESSONS.length - 1)].lv);
  useEffect(() => { top(); }, []);
  const cur = currentIndex(st.eng);
  const list = LESSONS.map((L, i) => ({ L, i })).filter((x) => x.L.lv === lv);
  return (
    <View style={{ gap: 14 }}>
      <Row wrap={false}>
        <IconBtn name="arrow-back" label="Geri" onPress={onExit} />
        <View style={{ flex: 1 }}><T s={20} w="800">Dersler</T><Mute s={13.5}>Bitirdiğin dersleri tekrar okuyabilirsin.</Mute></View>
      </Row>
      <Row>{LEVELS.map((x) => <Chip key={x} label={x} on={lv === x} onPress={() => setLv(x)} />)}</Row>
      <Card>
        {list.map(({ L, i }, k) => {
          const done = !!st.eng.done[i], open = done || i === cur;
          return (
            <Pressable key={i} disabled={!open} onPress={() => onOpen(i, !done)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: k === list.length - 1 ? 0 : 1, borderColor: t.line, opacity: open ? 1 : 0.45 }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? alpha(t.grn, 0.18) : i === cur ? ENG_COLOR : t.card2 }}>
                {done ? <Ionicons name="checkmark" size={17} color={t.grn} /> : i === cur ? <Ionicons name="play" size={14} color="#fff" /> : <Ionicons name="lock-closed" size={13} color={t.mute} />}
              </View>
              <View style={{ flex: 1 }}>
                <T w="700">{L.n + '. ' + L.title}</T>
                <Mute s={13}>{L.tr + ' · ' + L.words.length + ' kelime' + (done ? ' · ' + fmtD(st.eng.done[i]) : '')}</Mute>
              </View>
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}

// ---------- aç / kapat kartı (İngilizce ve Rutinler ekranında) ----------
export function EngSwitchCard({ compact }) {
  const t = useTheme();
  const { st, update } = useStore();
  const go = useGo();
  const r = findRoutine(st.routines);
  const n = r ? streak(r.done) : 0;
  return (
    <Card border={st.eng.on ? alpha(ENG_COLOR, 0.5) : undefined}>
      <Row wrap={false}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: alpha(ENG_COLOR, t.dark ? 0.25 : 0.12), alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="language" size={22} color={t.dark ? '#8CB0FF' : ENG_COLOR} />
        </View>
        <Pressable style={{ flex: 1 }} onPress={compact ? () => go('ingilizce') : undefined}>
          <T w="800">Günlük İngilizce görevi</T>
          <Mute s={13}>{st.eng.on ? 'Açık · her gün bir ders, rutin zincirinde' + (n ? ' · ' + n + ' günlük seri' : '') : 'Kapalı · açınca rutinlerine “İngilizce: günün dersi” eklenir'}</Mute>
        </Pressable>
        <Switch value={!!st.eng.on} color={ENG_COLOR} label="Günlük İngilizce görevini aç ya da kapat" onChange={(v) => setOn(update, st, v, rid)} />
      </Row>
    </Card>
  );
}

// Ana ekran kartı
export function EngHomeCard() {
  const t = useTheme();
  const { st } = useStore();
  const go = useGo();
  if (!st.eng.on) return null;
  const E = st.eng, td = today();
  const idx = currentIndex(E), L = LESSONS[idx];
  const due = dueCards(E, td).length;
  const done = doneToday(E, td);
  return (
    <Card border={alpha(ENG_COLOR, 0.45)}>
      <SectionHead icon="language" color={t.dark ? '#8CB0FF' : ENG_COLOR} title="Günün İngilizce dersi"
        sub={done ? 'Bugünkü ders tamam ✓' + (due ? ' · ' + due + ' kelime tekrar bekliyor' : '') : L ? L.lv + ' · Ders ' + L.n + ': ' + L.title : 'Tüm dersleri bitirdin!'}
        right={<Btn sm kind={done ? undefined : 'pri'} title={done ? (due ? 'Tekrar et' : 'Aç') : 'Başla'} onPress={() => go('ingilizce')} />} />
    </Card>
  );
}

// ---------- ana ekran ----------
export default function English() {
  const t = useTheme();
  const { st, update } = useStore();
  const { toast } = useUI();
  const top = useScrollTop();
  const [view, setView] = useState({ v: 'home' });
  const E = st.eng, td = today();
  const back = () => { setView({ v: 'home' }); top(); };
  useEffect(() => {
    if (view.v === 'home') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => sub.remove();
  }, [view.v]);
  const [time, setTime] = useState(E.time || '');
  if (view.v === 'lesson') return <Lesson key={view.idx} idx={view.idx} fresh={view.fresh} onExit={back} />;
  if (view.v === 'review') return <Review onExit={back} />;
  if (view.v === 'words') return <WordBook onExit={back} />;
  if (view.v === 'archive') return <Archive onExit={back} onOpen={(i, fresh) => setView({ v: 'lesson', idx: i, fresh })} />;

  const idx = currentIndex(E);
  const all = finishedAll(E);
  const L = LESSONS[Math.min(idx, LESSONS.length - 1)];
  const done = doneToday(E, td);
  const due = dueCards(E, td).length;
  const lp = levelProgress(idx);
  const total = LESSONS.length;
  const saveTime = () => {
    if (time && !isTime(time)) return toast('Saati SS:DD olarak yaz (ör. 20:30)');
    update('eng', (d) => { d.time = time; });
    update('routines', (d) => { const r = d.items.find((x) => x.sys === 'eng'); if (r) r.rTime = time; });
    toast(time ? 'Her gün ' + time + '\'de hatırlatılacak' : 'Hatırlatma kapatıldı');
  };
  return (
    <View style={{ gap: 16 }}>
      <EngSwitchCard />

      <Card style={{ backgroundColor: t.hero || ENG_COLOR }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ gap: 8 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{all ? 'C2 ✓' : lp.lv}</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700' }}>{all ? 'Tüm seviyeler bitti' : LEVEL_TR[lp.lv] + ' · Ders ' + lp.n + ' / ' + lp.of}</Text>
          </Row>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700' }}>{Object.keys(E.done).length + ' / ' + total + ' ders'}</Text>
        </Row>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{all ? 'Bütün dersleri bitirdin!' : done ? 'Bugünkü dersin tamam' : L.title}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)' }}>{all ? 'Kelime tekrarına devam ederek öğrendiklerini kalıcı yap.' : done ? 'Yarın yeni ders açılacak. İstersen şimdi tekrar yap.' : L.tr + ' · ' + L.words.length + ' yeni kelime'}</Text>
        <View style={{ height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
          <View style={{ width: (Object.keys(E.done).length / total) * 100 + '%', height: '100%', backgroundColor: t.gold || '#FFC857' }} />
        </View>
        <Row>
          {!all && !done ? <HeroBtn solid icon="play" title="Derse başla" onPress={() => setView({ v: 'lesson', idx, fresh: true })} /> : null}
          {due ? <HeroBtn solid={done} icon="albums" title={'Tekrar (' + due + ')'} onPress={() => setView({ v: 'review' })} /> : null}
          {!all && done ? <HeroBtn icon="play-forward" title="Sonraki dersi şimdi aç" onPress={() => setView({ v: 'lesson', idx, fresh: true })} /> : null}
        </Row>
      </Card>

      <Grid min={300}>
        <Card>
          <H3>Seviyeler</H3>
          {LEVELS.map((lv) => {
            const ids = LESSONS.map((x, i) => (x.lv === lv ? i : -1)).filter((i) => i >= 0);
            const n = ids.filter((i) => E.done[i]).length;
            return (
              <View key={lv} style={{ gap: 4 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row style={{ gap: 8 }}><LvBadge lv={lv} /><T w="600">{LEVEL_TR[lv]}</T></Row>
                  <Mute s={13}>{n + ' / ' + ids.length}</Mute>
                </Row>
                <Bar pct={(n / ids.length) * 100} color={ENG_COLOR} h={7} />
              </View>
            );
          })}
        </Card>
        <View style={{ gap: 16 }}>
          <Card>
            <H3>Kelimelerim</H3>
            <Row style={{ gap: 18 }}>
              <View><Text style={{ fontSize: 30, fontWeight: '800', color: t.ink }}>{learnedCount(E)}</Text><Mute s={13}>öğrenilen</Mute></View>
              <View><Text style={{ fontSize: 30, fontWeight: '800', color: t.grn }}>{masteredCount(E)}</Text><Mute s={13}>yerleşen</Mute></View>
              <View><Text style={{ fontSize: 30, fontWeight: '800', color: due ? t.yelT || t.yel : t.ink }}>{due}</Text><Mute s={13}>bugün tekrar</Mute></View>
            </Row>
            <Row>
              <Btn sm icon="book-outline" title="Kelime defteri" onPress={() => setView({ v: 'words' })} />
              <Btn sm icon="list-outline" title="Dersler" onPress={() => setView({ v: 'archive' })} />
            </Row>
          </Card>
          <Card>
            <H3>Hatırlatma</H3>
            <Mute>Görev açıkken her gün bu saatte bildirim gelir; dersi bitirdiysen gelmez.</Mute>
            <Row style={{ alignItems: 'flex-end' }}>
              <TimeField label="Saat" value={time} onChange={setTime} />
              <Btn title="Kaydet" onPress={saveTime} />
            </Row>
          </Card>
        </View>
      </Grid>

      <Card>
        <H3>Nasıl çalışır?</H3>
        <Mute>{'Her gün bir ders açılır: A1\'den C2\'ye kadar 6 seviye, her seviyede 40 metin. Metinler birbirine bağlı bir hikâye anlatır ve yalnızca daha önce öğrendiğin kelimelerle o günün yeni kelimelerini kullanır.'}</Mute>
        <Mute>{'1) Yeni kelimelere bak  2) Metni oku, bilmediğin kelimeye dokun  3) Kartlarla çalış  4) Kısa sınavı geç. Bitirdiğin kelimeler 1, 2, 4, 8, 16, 32 gün arayla tekrar kartı olarak geri gelir.'}</Mute>
      </Card>
    </View>
  );
}
