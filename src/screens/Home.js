import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useTheme, alpha, lvlColor, lvlText, shadow } from '../theme';
import { T, Mute, H3, Card, Btn, Row, Grid, Bar, Empty, ListRow } from '../ui';
import { TimerCard, WeekProgram, NotifCard, TaskRow, DailyRow, useGo, useForms } from '../components';
import { today, addDays, AY, GUN, num, tl, hm, fday, ftot, lvl, LV, streak, balance, byPri, isTime } from '../logic';
import { useGroups, GROUP_TYPES } from '../groups';

export const TILES = [
  ['gorevler', 'Görevler', 'checkbox-outline'],
  ['rutin', 'Rutinler', 'link-outline'],
  ['takvim', 'Takvim', 'calendar-outline'],
  ['yemek', 'Yemek takibi', 'nutrition-outline'],
  ['calisma', 'Çalışma', 'timer-outline'],
  ['ambar', 'Ders ambarı', 'folder-open-outline'],
  ['para', 'Para takibi', 'wallet-outline'],
  ['kitap', 'Kitaplarım', 'book-outline'],
  ['grup', 'Gruplar', 'people-outline'],
];

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
  const tiles = TILES.filter(([k]) => !hidden.includes(k));
  const tileCols = width < 600 ? 2 : width < 900 ? 4 : Math.min(tiles.length, 9);
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
    H.daily ? (
      <Card key="daily">
        <Row style={{ justifyContent: 'space-between' }}><H3>Günlük işler</H3><Btn sm title="Tümü" onPress={() => go('gorevler')} /></Row>
        {daily.length ? daily.map((x) => <DailyRow key={x.id} x={x} />) : <Empty text="Görevler sayfasındaki “Günlük İşler” klasörüne ekleyebilirsin." />}
      </Card>
    ) : null,
    H.routines && !hidden.includes('rutin') ? <RoutinesToday key="routines" /> : null,
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
        <T s={44} w="800" style={{ letterSpacing: -1 }}>{n.getDate() + ' ' + AY[n.getMonth()]}</T>
      </View>
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
      {H.tiles && tiles.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 12 }}>
          {tiles.map(([k, l, ic]) => (
            <View key={k} style={{ width: 100 / tileCols + '%', paddingHorizontal: 6 }}>
              <Pressable onPress={() => go(k)} accessibilityRole="button"
                style={({ pressed }) => [{ minHeight: 124, padding: 14, borderRadius: t.r, borderWidth: t.bw, borderColor: pressed ? t.acc : t.line, backgroundColor: t.card, justifyContent: 'space-between', gap: 10, transform: [{ scale: pressed && t.soft ? 0.96 : 1 }] }, shadow(t)]}>
                <View style={{ width: 44, height: 44, borderRadius: t.soft ? 22 : 12, backgroundColor: alpha(t.acc, 0.14), alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={ic} size={23} color={t.acc} />
                </View>
                <View>
                  <T w="800">{l}</T>
                  <Mute s={13} numberOfLines={2}>{stats[k]}</Mute>
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {H.week ? <WeekProgram /> : null}
      {cards.length ? <Grid min={310}>{cards}</Grid> : null}
      {!cards.length && !H.week && !H.tiles && !H.timer && !H.cal ? (
        <Card><Mute>Ana ekranda gösterilecek bölüm seçmedin. Sağ üstteki profil düğmesinden açabilirsin.</Mute></Card>
      ) : null}
    </View>
  );
}

function RoutinesToday() {
  const t = useTheme();
  const { st, update } = useStore();
  const go = useGo();
  const td = today(), R = st.routines.items;
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}><H3>Bugünkü rutinler</H3><Btn sm title="Zincirler" onPress={() => go('rutin')} /></Row>
      {R.length ? R.map((r, i) => {
        const on = r.done.includes(td);
        return (
          <ListRow key={r.id} last={i === R.length - 1}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: r.color }} />
            <View style={{ flex: 1 }}>
              <T w="700">{r.name}</T>
              <Mute>{streak(r.done) + ' günlük seri'}</Mute>
            </View>
            <Btn sm kind={on ? 'ok' : undefined} title={on ? 'Yapıldı' : 'Yaptım'} onPress={() => update('routines', (d) => {
              const x = d.items.find((y) => y.id === r.id); if (!x) return;
              const k = x.done.indexOf(td); if (k >= 0) x.done.splice(k, 1); else x.done.push(td);
            })} />
          </ListRow>
        );
      }) : <Empty text="Henüz rutin yok." />}
    </Card>
  );
}
