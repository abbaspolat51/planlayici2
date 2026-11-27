import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useTheme, alpha, lvlColor, lvlText, shadow, modColor } from '../theme';
import { T, Mute, H3, Card, Btn, Row, Grid, Bar, Empty, ListRow, Switch, IconBtn, SectionHead } from '../ui';
import { TimerCard, WeekProgram, NotifCard, TaskRow, DailyRow, useGo, useForms } from '../components';
import { today, addDays, AY, GUN, GK, DN, num, tl, hm, fday, ftot, lvl, LV, streak, balance, byPri, isTime, goalProgress, tmState, mmss, weekStart, parse } from '../logic';
import { useGroups, GROUP_TYPES } from '../groups';
import { fetchAyet, fetchHadis, fallbackPair, loadCached, saveCached } from '../ilham';
import { GoalsMini } from './Goals';
import { GroupTasksHome } from './Groups';
import { LangHomeCard } from './Language';
import { LANG_LIST } from '../lang';

export const TILES = [
  ['gorevler', 'Görevler', 'checkbox-outline'],
  ['rutin', 'Rutinler', 'link-outline'],
  ['takvim', 'Takvim', 'calendar-outline'],
  ['yemek', 'Yemek takibi', 'nutrition-outline'],
  ['calisma', 'Çalışma', 'timer-outline'],
  ['hedef', 'Hedefler', 'battery-half-outline'],
  ['ingilizce', 'İngilizce', 'language-outline'],
  ['almanca', 'Almanca', 'language-outline'],
  ['ambar', 'Ders ambarı', 'folder-open-outline'],
  ['para', 'Para takibi', 'wallet-outline'],
  ['kitap', 'Kitaplarım', 'book-outline'],
  ['grup', 'Gruplar', 'people-outline'],
];

// Günün ayeti ve hadisi köşesi: Arapçası + Diyanet İşleri meali, hadiste Arapçası + tercümesi
function IlhamBlock({ label, icon, color, item, sub }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const long = (item.tr || '').length > 260;
  return (
    <View style={{ gap: 8 }}>
      <Row style={{ gap: 6 }}>
        <Ionicons name={icon} size={15} color={color} />
        <Text style={{ fontSize: 13, fontWeight: '800', color }}>{label}</Text>
      </Row>
      {item.ar ? (
        <Text style={{ fontSize: 21, lineHeight: 38, color: t.ink, textAlign: 'right', writingDirection: 'rtl' }} numberOfLines={open ? undefined : 4}>{item.ar}</Text>
      ) : null}
      <Text style={{ fontSize: 16, lineHeight: 24, color: t.ink, fontWeight: '500' }} numberOfLines={open || !long ? undefined : 6}>{item.tr}</Text>
      {long || (item.ar || '').length > 220 ? (
        <Pressable onPress={() => setOpen((o) => !o)} hitSlop={6}><Text style={{ fontSize: 13, fontWeight: '800', color: t.accT }}>{open ? 'Kısalt' : 'Devamını oku'}</Text></Pressable>
      ) : null}
      <Text style={{ fontSize: 12.5, color: t.mute, fontWeight: '600' }}>{sub}</Text>
    </View>
  );
}

export function IlhamCard() {
  const t = useTheme();
  const [pair, setPair] = useState(null);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const refresh = async () => {
    setBusy(true);
    const [a, h] = await Promise.allSettled([fetchAyet(), fetchHadis()]);
    if (!alive.current) return;
    setPair((old) => {
      const fb = fallbackPair();
      const next = {
        ayet: a.status === 'fulfilled' ? a.value : (old && old.ayet) || fb.ayet,
        hadis: h.status === 'fulfilled' ? h.value : (old && old.hadis) || fb.hadis,
      };
      if (a.status === 'fulfilled' || h.status === 'fulfilled') saveCached(next);
      return next;
    });
    setBusy(false);
  };
  useEffect(() => {
    alive.current = true;
    loadCached().then((c) => { if (alive.current) setPair((p) => p || c || fallbackPair()); });
    refresh();
    return () => { alive.current = false; };
  }, []);
  const gold = t.dark ? t.gold : '#B07A0A';
  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: t.gold }}>
      <SectionHead icon="sparkles" color={gold} title="Günün ayeti ve hadisi"
        right={busy ? <Text style={{ fontSize: 12.5, color: t.mute, paddingRight: 8 }}>yükleniyor…</Text>
          : <IconBtn name="shuffle" label="Başka bir ayet ve hadis göster" color={t.accT} onPress={refresh} />} />
      {pair ? (
        <>
          <IlhamBlock label="Ayet" icon="book-outline" color={gold} item={pair.ayet}
            sub={'Kur’ân-ı Kerîm, ' + pair.ayet.src + ' · ' + (pair.ayet.meal || 'Diyanet İşleri meali')} />
          <View style={{ height: 1, backgroundColor: t.line }} />
          <IlhamBlock label="Hadis" icon="chatbubble-ellipses-outline" color={gold} item={pair.hadis}
            sub={[pair.hadis.src, pair.hadis.grade, pair.hadis.yedek ? 'uygulamadaki yedek liste' : 'HadeethEnc'].filter(Boolean).join(' · ')} />
          {pair.ayet.yedek || pair.hadis.yedek ? <Mute s={12}>İnternet bağlantısı olmadığı için uygulamadaki yedek listeden gösteriliyor.</Mute> : null}
        </>
      ) : <Mute>Yükleniyor…</Mute>}
    </Card>
  );
}

// ISO hafta numarası
const isoWeek = (d) => {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - y0) / 864e5 + 1) / 7);
};
// Takvim yaprağı gibi tarih rozeti + haftanın günleri şeridi
function DateBlock({ I }) {
  const t = useTheme();
  const n = new Date(), td = today(), ws = weekStart(td);
  const paper = t.dark ? t.card : '#FFFFFF', paperInk = t.dark ? t.ink : '#10242B';
  const y0 = new Date(n.getFullYear(), 0, 1), y1 = new Date(n.getFullYear() + 1, 0, 1);
  const yearPct = Math.floor(((n - y0) / (y1 - y0)) * 100);
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 76, borderRadius: 16, overflow: 'hidden', backgroundColor: paper, alignItems: 'center',
          ...Platform.select({ web: { boxShadow: '0 6px 16px rgba(0,0,0,0.22)' }, default: { elevation: 4, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } } }) }}>
          <View style={{ alignSelf: 'stretch', backgroundColor: t.coral, paddingVertical: 4, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: alpha('#000', 0.25) }} />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>{AY[n.getMonth()].slice(0, 3)}</Text>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: alpha('#000', 0.25) }} />
          </View>
          <Text style={{ fontSize: 36, fontWeight: '800', color: paperInk, lineHeight: 42, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{n.getDate()}</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.dark ? t.mute : '#5B6F75', paddingBottom: 7 }}>{GK[n.getDay()]}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: I, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>{GUN[n.getDay()]}</Text>
          <Text style={{ color: alpha(I, 0.8), fontSize: 14, fontWeight: '600' }}>{AY[n.getMonth()] + ' ' + n.getFullYear()}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: alpha(I, 0.14) }}>
              <Text style={{ color: I, fontSize: 12, fontWeight: '700' }}>{isoWeek(n) + '. hafta'}</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: alpha(I, 0.14) }}>
              <Text style={{ color: I, fontSize: 12, fontWeight: '700' }}>{'Yılın %' + yearPct + '\'i geçti'}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {DN.map((d, i) => {
          const day = addDays(ws, i), isT = day === td, past = day < td;
          return (
            <View key={d} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 7, borderRadius: 12, backgroundColor: isT ? t.gold : 'transparent' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: isT ? '#2A1D00' : alpha(I, past ? 0.5 : 0.8) }}>{d}</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: isT ? '#2A1D00' : alpha(I, past ? 0.5 : 0.95), fontVariant: ['tabular-nums'] }}>{parse(day).getDate()}</Text>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isT ? '#2A1D00' : past ? alpha(I, 0.35) : 'transparent' }} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const greet = (h) => (h < 5 ? 'İyi geceler' : h < 11 ? 'Günaydın' : h < 17 ? 'İyi günler' : h < 22 ? 'İyi akşamlar' : 'İyi geceler');

// Karşılama alanı: hedef halkaları, bugünkü ilerleme, çalışma ve en önde giden hedef
function Hero({ doneN, tot }) {
  const t = useTheme();
  const { st, user } = useStore();
  const go = useGo();
  const n = new Date(), td = today();
  const name = (st.prefs.name || '').trim() || (user && user.email ? user.email.split('@')[0] : '');
  const SL = st.study.log[td] || { m: 0 };
  const g = st.goals.items[0];
  const gp = g ? goalProgress(st, g) : null;
  const pct = tot ? (doneN / tot) * 100 : 0;
  const I = t.heroI;
  const pill = (icon, text, onPress) => (
    <Pressable key={text} onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: alpha(I, pressed ? 0.24 : 0.14) })}>
      <Ionicons name={icon} size={15} color={I} />
      <Text style={{ color: I, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{text}</Text>
    </Pressable>
  );
  return (
    <View style={{ backgroundColor: t.hero, borderRadius: t.r + 4, padding: 20, overflow: 'hidden', gap: 14 }}>
      {/* uçan ok: yaydan yeni çıkmış, arkasında hız izleri */}
      <View pointerEvents="none" style={{ position: 'absolute', right: 14, top: -26, width: 210, height: 120, transform: [{ rotate: '-18deg' }, { scale: 0.82 }] }}>
        <View style={{ position: 'absolute', left: 0, top: 30, width: 70, height: 6, borderRadius: 3, backgroundColor: alpha(t.gold, 0.28) }} />
        <View style={{ position: 'absolute', left: -20, top: 50, width: 100, height: 6, borderRadius: 3, backgroundColor: alpha(t.gold, 0.4) }} />
        <View style={{ position: 'absolute', left: 6, top: 70, width: 60, height: 6, borderRadius: 3, backgroundColor: alpha(t.gold, 0.24) }} />
        {/* tüyler */}
        <View style={{ position: 'absolute', left: 92, top: 38, width: 22, height: 10, borderRadius: 3, backgroundColor: alpha(t.coral, 0.55), transform: [{ skewX: '-35deg' }] }} />
        <View style={{ position: 'absolute', left: 92, top: 58, width: 22, height: 10, borderRadius: 3, backgroundColor: alpha(t.coral, 0.4), transform: [{ skewX: '35deg' }] }} />
        {/* gövde */}
        <View style={{ position: 'absolute', left: 90, top: 50, width: 96, height: 6, borderRadius: 3, backgroundColor: alpha(I, 0.55) }} />
        {/* uç */}
        <View style={{ position: 'absolute', left: 184, top: 43, width: 0, height: 0, borderTopWidth: 10, borderBottomWidth: 10, borderLeftWidth: 22, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: alpha(t.coral, 0.85) }} />
      </View>
      <Text style={{ color: alpha(I, 0.85), fontSize: 14.5, fontWeight: '700' }}>{greet(n.getHours()) + (name ? ', ' + name : '') + ' 👋'}</Text>
      <DateBlock I={I} />
      {tot ? (
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: I, fontWeight: '700', fontSize: 13.5 }}>Bugünün hedefi</Text>
            <Text style={{ color: I, fontWeight: '800', fontSize: 13.5 }}>{doneN + ' / ' + tot}</Text>
          </View>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: alpha(I, 0.18), overflow: 'hidden' }}>
            <View style={{ width: pct + '%', height: '100%', borderRadius: 5, backgroundColor: pct >= 100 ? t.grn : t.gold }} />
          </View>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {pill('timer-outline', 'Bugün ' + hm(SL.m), () => go('calisma'))}
        {gp ? pill('battery-half-outline', g.title + ' %' + Math.floor(gp.pct), () => go('hedef')) : pill('flag-outline', 'Hedef koy', () => go('hedef'))}
      </View>
    </View>
  );
}

// Hızlı işlemler
function QuickActions() {
  const t = useTheme();
  const { st } = useStore();
  const go = useGo();
  const forms = useForms();
  const hidden = st.prefs.hidden || [];
  const run = !tmState(st.study).idle;
  const items = [
    ['gorevler', 'add-circle', 'Görev', () => forms.open('task', { cat: 'genel' })],
    ['calisma', run ? 'pause-circle' : 'play-circle', run ? mmss(tmState(st.study).rem) : 'Pomodoro', () => go('calisma')],
    ['hedef', 'flag', 'Hedef', () => go('hedef')],
    ['grup', 'people', 'Grup', () => go('grup')],
  ].filter(([k]) => !hidden.includes(k));
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {items.map(([k, ic, l, f]) => {
        const c = modColor(t, k);
        return (
          <Pressable key={k} onPress={f} accessibilityRole="button" accessibilityLabel={l}
            style={({ pressed }) => [{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: t.rm, backgroundColor: t.card, transform: [{ scale: pressed ? 0.96 : 1 }], borderWidth: t.bw, borderColor: t.line }, shadow(t)]}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: alpha(c, t.dark ? 0.22 : 0.13), alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={ic} size={22} color={c} />
            </View>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: t.ink }} numberOfLines={1}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CalorieCard() {
  const t = useTheme();
  const { st } = useStore();
  const go = useGo();
  const D = fday(st.food, today()), tot = ftot(D), L = lvl(st.food, tot), c = lvlColor(t, L);
  const max = Math.max(st.food.avg * 1.3, tot, 1);
  return (
    <Card bg={L === 'n' ? undefined : alpha(c, 0.13)} border={L === 'n' ? undefined : alpha(c, 0.42)}>
      <Mute>Bugün alınan kalori</Mute>
      <Text style={{ fontSize: 56, fontWeight: '800', color: t.ink, letterSpacing: -1 }}>
        {num(tot)} <Text style={{ fontSize: 18, color: t.mute }}>kcal</Text>
      </Text>
      <Row><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c }} /><T w="800" c={lvlText(t, L)}>{LV[L]}</T></Row>
      <Scale tot={tot} max={max} />
      <Mute>{'Adım ' + num(D.steps) + ' · Yakılan ' + num(D.burn) + ' kcal · Net ' + num(tot - (+D.burn || 0)) + ' kcal'}</Mute>
      <Row><Btn kind="pri" title="Öğün ekle" onPress={() => go('yemek')} /></Row>
    </Card>
  );
}

export function Scale({ tot, max }) {
  const t = useTheme();
  const { st } = useStore();
  const g = (st.food.good / max) * 100, y = (Math.max(0, st.food.avg - st.food.good) / max) * 100;
  return (
    <View style={{ height: 24, justifyContent: 'center' }}>
      <View style={{ height: 12, flexDirection: 'row', borderRadius: 8, overflow: 'hidden', opacity: 0.8 }}>
        <View style={{ width: g + '%', backgroundColor: t.grn }} />
        <View style={{ width: y + '%', backgroundColor: t.yel }} />
        <View style={{ flex: 1, backgroundColor: t.red }} />
      </View>
      {tot ? <View style={{ position: 'absolute', left: (Math.min(tot, max) / max) * 100 + '%', width: 5, height: 24, marginLeft: -2.5, borderRadius: 3, backgroundColor: t.ink, borderWidth: 1, borderColor: t.card }} /> : null}
    </View>
  );
}

export default function Home() {
  const t = useTheme();
  const { st, configured } = useStore();
  const go = useGo();
  const G = useGroups();
  const { width } = useWindowDimensions();
  const H = st.prefs.home, hidden = st.prefs.hidden;
  const n = new Date(), td = today();
  const T0 = st.tasks.items, open = T0.filter((x) => !x.done && x.cat !== 'daily' && x.ext !== 'cal');
  const urgent = open.filter((x) => x.p === 1).length;
  const due = open.filter((x) => x.end).sort((a, b) => a.end.localeCompare(b.end) || a.p - b.p).slice(0, 6);
  const daily = T0.filter((x) => x.cat === 'daily').sort(byPri);
  const phone = T0.filter((x) => x.ext === 'cal' && x.start <= td && x.end >= td).sort((a, b) => (a.rTime || '00:00').localeCompare(b.rTime || '00:00'));
  const R0 = hidden.includes('rutin') ? [] : st.routines.items;
  const tot = R0.length + daily.length;
  const doneN = R0.filter((r) => r.done.includes(td)).length + daily.filter((x) => (x.doneOn || []).includes(td)).length;
  const cards = [
    H.due ? (
      <Card key="due">
        <SectionHead icon="alarm" color={modColor(t, 'gorevler')} title="Yaklaşan son günler" right={<Btn sm title="Takvim" onPress={() => go('takvim')} />} />
        {due.length ? due.map((x, i) => <TaskRow key={x.id} x={x} rank={i + 1} />) : <Empty text="Son tarihi olan açık görev yok." />}
      </Card>
    ) : null,
    H.phone && phone.length ? (
      <Card key="phone">
        <Row style={{ justifyContent: 'space-between' }}><H3>Telefon takvimi · bugün</H3><Btn sm title="Tümü" onPress={() => go('gorevler')} /></Row>
        {phone.map((x, i) => (
          <ListRow key={x.id} last={i === phone.length - 1}>
            <T w="800" style={{ width: 52 }}>{isTime(x.rTime) ? x.rTime : 'Gün'}</T>
            <View style={{ flex: 1 }}>
              <T w="700">{x.title}</T>
              {x.alarms && x.alarms.length ? <Mute s={13}>{x.alarms.length + ' hatırlatıcı'}</Mute> : null}
            </View>
          </ListRow>
        ))}
      </Card>
    ) : null,
    H.groups && G && G.list.length && !hidden.includes('grup') ? (
      <Card key="groups">
        <SectionHead icon="people" color={modColor(t, 'grup')} title="Gruplarım" right={<Btn sm title="Gruplar" onPress={() => go('grup')} />} />
        {G.list.map((x, i) => (
          <ListRow key={x.code} last={i === G.list.length - 1}>
            <View style={{ flex: 1 }}>
              <T w="700">{x.g ? x.g.name : x.code}</T>
              <Mute s={13}>{x.g ? GROUP_TYPES[x.g.type] + (x.g.timer && x.g.timer.run ? ' · şu an birlikte çalışılıyor' : '') : ''}</Mute>
            </View>
          </ListRow>
        ))}
      </Card>
    ) : null,
    H.notif ? <NotifCard key="notif" /> : null,
  ].filter(Boolean);
  return (
    <View style={{ gap: 16 }}>
      <Hero doneN={doneN} tot={tot} />
      <QuickActions />
      {H.ilham ? <IlhamCard /> : null}
      {!configured ? (
        <Card bg={alpha(t.yel, 0.15)} border={alpha(t.yel, 0.5)}>
          <T w="700">Eşitleme henüz kurulmadı</T>
          <Mute>Uygulama çalışıyor ama veriler yalnızca bu cihazda. Telefonla bilgisayarı eşitlemek için README'deki Firebase adımlarını yap.</Mute>
        </Card>
      ) : null}
      {H.timer || H.cal ? (
        <Grid min={330}>
          {H.timer && !hidden.includes('calisma') ? <TimerCard /> : null}
          {H.cal && !hidden.includes('yemek') ? <CalorieCard /> : null}
        </Grid>
      ) : null}
      {H.today ? <TodayList routines={R0} daily={daily} /> : null}
      {H.gtasks && !hidden.includes('grup') ? <GroupTasksHome /> : null}
      {H.goals && !hidden.includes('hedef') ? <GoalsMini /> : null}
      {LANG_LIST.map((G) => (H[G.key] && !hidden.includes(G.route) ? <LangHomeCard key={G.key} G={G} /> : null))}
      {H.week ? <WeekProgram /> : null}
      {cards.length ? <Grid min={310}>{cards}</Grid> : null}
      {!cards.length && !H.week && !H.timer && !H.cal && !H.today && !H.ilham ? (
        <Card><Mute>Ana ekranda gösterilecek bölüm seçmedin. Sağ üstteki profil düğmesinden açabilirsin.</Mute></Card>
      ) : null}
    </View>
  );
}

// Bugün yapılacaklar: rutinler ve günlük işler, hepsi switch
function TodayList({ routines, daily }) {
  const t = useTheme();
  const { update } = useStore();
  const go = useGo();
  const forms = useForms();
  const td = today();
  return (
    <Card>
      <SectionHead icon="checkmark-done" color={modColor(t, '')} title="Bugün yapılacaklar" sub="Rutinler ve günlük işler"
        right={<Btn sm icon="add" title="Günlük iş" onPress={() => forms.open('task', { cat: 'daily' })} />} />
      {routines.map((r) => {
        const on = r.done.includes(td);
        return (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: t.rm, backgroundColor: t.card2, borderWidth: t.bw ? 1 : 0, borderColor: t.line, overflow: 'hidden', minHeight: 60, paddingRight: 2 }}>
            <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: r.color }} />
            <Pressable style={{ flex: 1, paddingVertical: 6 }} onPress={() => go(r.sys === 'eng' ? 'ingilizce' : r.sys === 'deu' ? 'almanca' : 'rutin')}>
              <T s={15.5} w="600" c={on ? t.mute : t.ink} style={{ textDecorationLine: on ? 'line-through' : 'none' }}>{r.name}</T>
              <Mute s={13}>{'Rutin · ' + streak(r.done) + ' günlük seri'}</Mute>
            </Pressable>
            <Switch value={on} color={r.color} label={r.name + ': bugün yapıldı'} onChange={() => update('routines', (d) => {
              const x = d.items.find((y) => y.id === r.id); if (!x) return;
              const k = x.done.indexOf(td); if (k >= 0) x.done.splice(k, 1); else x.done.push(td);
            })} />
          </View>
        );
      })}
      {daily.map((x) => <DailyRow key={x.id} x={x} />)}
      {!routines.length && !daily.length ? <Empty text="Rutin ya da günlük iş ekle; her gün buradan tek dokunuşla açarsın." /> : null}
    </Card>
  );
}
