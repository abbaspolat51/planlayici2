import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useTheme, alpha, lvlColor, lvlText, shadow } from '../theme';
import { T, Mute, H3, Card, Btn, Row, Grid, Bar, Empty, ListRow, Switch, IconBtn } from '../ui';
import { TimerCard, WeekProgram, NotifCard, TaskRow, DailyRow, useGo, useForms } from '../components';
import { today, addDays, AY, GUN, num, tl, hm, fday, ftot, lvl, LV, streak, balance, byPri, isTime } from '../logic';
import { useGroups, GROUP_TYPES } from '../groups';
import { AYETLER, HADISLER, randomPair } from '../ilham';
import { GoalsMini } from './Goals';

export const TILES = [
  ['gorevler', 'Görevler', 'checkbox-outline'],
  ['rutin', 'Rutinler', 'link-outline'],
  ['takvim', 'Takvim', 'calendar-outline'],
  ['yemek', 'Yemek takibi', 'nutrition-outline'],
  ['calisma', 'Çalışma', 'timer-outline'],
  ['hedef', 'Hedefler', 'battery-half-outline'],
  ['ambar', 'Ders ambarı', 'folder-open-outline'],
  ['para', 'Para takibi', 'wallet-outline'],
  ['kitap', 'Kitaplarım', 'book-outline'],
  ['grup', 'Gruplar', 'people-outline'],
];

// Günün ayeti ve hadisi köşesi
export function IlhamCard() {
  const t = useTheme();
  const [pair, setPair] = useState(() => randomPair());
  const a = AYETLER[pair.a], h = HADISLER[pair.h];
  const Block = ({ label, icon, text, src }) => (
    <View style={{ gap: 6 }}>
      <Row style={{ gap: 6 }}>
        <Ionicons name={icon} size={15} color={t.acc} />
        <Text style={{ fontSize: 13, fontWeight: '800', color: t.acc }}>{label}</Text>
      </Row>
      <Text style={{ fontSize: 16.5, lineHeight: 25, color: t.ink, fontWeight: '500' }}>{'“' + text + '”'}</Text>
      <Text style={{ fontSize: 13, color: t.mute, fontWeight: '600' }}>{src}</Text>
    </View>
  );
  return (
    <Card bg={alpha(t.acc, t.dark ? 0.12 : 0.07)} border={alpha(t.acc, 0.3)}>
      <Row wrap={false}>
        <T s={15} w="800" style={{ flex: 1 }}>Günün ayeti ve hadisi</T>
        <IconBtn name="shuffle-outline" label="Başka bir ayet ve hadis göster" color={t.acc} onPress={() => setPair((p) => randomPair(p))} />
      </Row>
      <Block label="Ayet" icon="book-outline" text={a[0]} src={'Kur’ân-ı Kerîm, ' + a[1]} />
      <View style={{ height: 1, backgroundColor: alpha(t.acc, 0.2) }} />
      <Block label="Hadis" icon="chatbubble-ellipses-outline" text={h[0]} src={h[1] + ' · Riyâzü’s-Sâlihîn'} />
      <Mute s={12}>Anlamlar sade Türkçeyle aktarılmıştır; kelimesi kelimesine meal değildir.</Mute>
    </Card>
  );
}

export function CalorieCard() {
  const t = useTheme();
  const { st } = useStore();
  const go = useGo();
  const D = fday(st.food, today()), tot = ftot(D), L = lvl(st.food, tot), c = lvlColor(t, L);
  const max = Math.max(st.food.avg * 1.3, tot, 1);
  return (
    <Card bg={alpha(c, 0.13)} border={alpha(c, 0.42)}>
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
  const R = st.routines.items, best = R.reduce((m, r) => Math.max(m, streak(r.done)), 0);
  const SL = st.study.log[td] || { m: 0 };
  const rd = st.books.items.find((b) => b.st === 'oku');
  const files = st.library.folders.reduce((s, f) => s + f.files.length, 0);
  const wk = open.filter((x) => x.end && x.end >= td && x.end <= addDays(td, 6)).length;
  const stats = {
    gorevler: open.length + ' açık' + (urgent ? ' · ' + urgent + ' acil' : ''),
    rutin: R.length ? 'En uzun seri ' + best + ' gün' : 'Rutin ekle',
    takvim: 'Bu hafta ' + wk + ' son gün',
    yemek: 'Bugün ' + num(ftot(fday(st.food, td))) + ' kcal',
    calisma: 'Bugün ' + hm(SL.m),
    ambar: st.library.folders.length + ' klasör · ' + files + ' dosya',
    para: 'Kalan ' + tl(balance(st.money)),
    kitap: rd ? rd.title : 'Kitap ekle',
    grup: G && G.list.length ? G.list.length + ' grup' : 'Grup kur ya da katıl',
  };
  stats.hedef = st.goals.items.length ? st.goals.items.length + ' hedef' : 'Hedef koy';
  const tiles = TILES.filter(([k]) => !hidden.includes(k));
  const tileCols = width < 600 ? 3 : width < 900 ? 5 : Math.min(tiles.length, 10);
  const R0 = hidden.includes('rutin') ? [] : st.routines.items;
  const tot = R0.length + daily.length;
  const doneN = R0.filter((r) => r.done.includes(td)).length + daily.filter((x) => (x.doneOn || []).includes(td)).length;
  const cards = [
    H.due ? (
      <Card key="due">
        <Row style={{ justifyContent: 'space-between' }}><H3>Yaklaşan son günler</H3><Btn sm title="Takvim" onPress={() => go('takvim')} /></Row>
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
        <Row style={{ justifyContent: 'space-between' }}><H3>Gruplarım</H3><Btn sm title="Gruplar" onPress={() => go('grup')} /></Row>
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
      <View>
        <Mute>{GUN[n.getDay()]}</Mute>
        <T s={46} w="800" style={{ letterSpacing: -1.5 }}>{n.getDate() + ' ' + AY[n.getMonth()]}</T>
        {tot ? (
          <Row wrap={false} style={{ marginTop: 8, gap: 12 }}>
            <View style={{ flex: 1, maxWidth: 260 }}><Bar pct={(doneN / tot) * 100} h={8} /></View>
            <Mute><Text style={{ fontWeight: '800', color: t.ink }}>{doneN + '/' + tot}</Text>{' bugün tamam'}</Mute>
          </Row>
        ) : null}
      </View>
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
      {H.goals && !hidden.includes('hedef') ? <GoalsMini /> : null}
      {H.tiles && tiles.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 12 }}>
          {tiles.map(([k, l, ic]) => (
            <View key={k} style={{ width: 100 / tileCols + '%', paddingHorizontal: 6 }}>
              <Pressable onPress={() => go(k)} accessibilityRole="button"
                style={({ pressed }) => [{ minHeight: 96, padding: 12, borderRadius: t.rm, borderWidth: t.bw, borderColor: pressed ? t.acc : t.line, backgroundColor: t.card, justifyContent: 'space-between', gap: 8, transform: [{ scale: pressed && t.soft ? 0.96 : 1 }] }, shadow(t)]}>
                <Ionicons name={ic} size={22} color={t.acc} />
                <View>
                  <T s={14} w="700" numberOfLines={1}>{l}</T>
                  <Mute s={12} numberOfLines={1}>{stats[k]}</Mute>
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {H.week ? <WeekProgram /> : null}
      {cards.length ? <Grid min={310}>{cards}</Grid> : null}
      {!cards.length && !H.week && !H.tiles && !H.timer && !H.cal && !H.today && !H.ilham ? (
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
      <Row style={{ justifyContent: 'space-between' }}>
        <H3>Bugün yapılacaklar</H3>
        <Btn sm icon="add" title="Günlük iş" onPress={() => forms.open('task', { cat: 'daily' })} />
      </Row>
      {routines.map((r) => {
        const on = r.done.includes(td);
        return (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: t.rm, backgroundColor: t.card2, borderWidth: t.bw ? 1 : 0, borderColor: t.line, overflow: 'hidden', minHeight: 60, paddingRight: 2 }}>
            <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: r.color }} />
            <Pressable style={{ flex: 1, paddingVertical: 6 }} onPress={() => go('rutin')}>
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
