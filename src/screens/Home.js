import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useTheme, alpha, lvlColor, lvlText } from '../theme';
import { T, Mute, H3, Card, Btn, Row, Grid, Bar, Empty, ListRow, Field, Seg, useUI } from '../ui';
import { TimerCard, WeekProgram, NotifCard, TaskRow, DailyRow, useGo, useForms } from '../components';
import { today, addDays, AY, GUN, num, tl, hm, fday, ftot, lvl, LV, streak, balance, byPri } from '../logic';

const TILES = [
  ['gorevler', 'Görevler', 'checkbox-outline'],
  ['rutin', 'Rutinler', 'link-outline'],
  ['takvim', 'Takvim', 'calendar-outline'],
  ['yemek', 'Yemek takibi', 'nutrition-outline'],
  ['calisma', 'Çalışma', 'timer-outline'],
  ['ambar', 'Ders ambarı', 'folder-open-outline'],
  ['para', 'Para takibi', 'wallet-outline'],
  ['kitap', 'Kitaplarım', 'book-outline'],
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

function SettingsCard() {
  const t = useTheme();
  const { mode, setThemeMode, user, signOut, configured, importData, status } = useStore();
  const { toast, confirm } = useUI();
  const [imp, setImp] = useState('');
  const [showImp, setShowImp] = useState(false);
  const doImport = () => {
    try {
      const obj = JSON.parse(imp);
      const n = importData(obj);
      toast(n ? n + ' bölüm aktarıldı' : 'Bu metinde planlayıcı verisi bulunamadı');
      if (n) { setImp(''); setShowImp(false); }
    } catch (e) { toast('Metin okunamadı; tamamını kopyaladığından emin ol'); }
  };
  return (
    <Card>
      <H3>Ayarlar</H3>
      <Seg label="Görünüm" value={mode} onChange={setThemeMode} options={[['system', 'Telefona göre'], ['light', 'Aydınlık'], ['dark', 'Karanlık']]} />
      {configured ? (
        user ? (
          <Row style={{ justifyContent: 'space-between' }}>
            <Mute style={{ flex: 1 }}>{'Hesap: ' + (user.email || '') + (status === 'on' ? ' · eşitlendi' : '')}</Mute>
            <Btn sm title="Çıkış yap" onPress={() => confirm('Çıkış yapılsın mı? Verilerin bulutta kalır.', signOut, 'Çıkış yap')} />
          </Row>
        ) : null
      ) : (
        <Mute>Eşitleme kapalı: veriler yalnızca bu cihazda. Telefon ve bilgisayarı eşitlemek için README'deki Firebase adımlarını yap.</Mute>
      )}
      <Btn sm title={showImp ? 'Veri aktarmayı kapat' : 'Eski planlayıcıdan veri aktar'} onPress={() => setShowImp(!showImp)} />
      {showImp ? (
        <View style={{ gap: 8 }}>
          <Mute>Eski planlayıcı sayfasında "Verilerini dışa aktar" düğmesine bas, kopyalanan metni buraya yapıştır.</Mute>
          <Field value={imp} onChangeText={setImp} multiline placeholder="{ ... }" inputStyle={{ minHeight: 100, textAlignVertical: 'top', paddingTop: 10 }} />
          <Row><Btn sm kind="pri" title="Aktar" onPress={doImport} /></Row>
        </View>
      ) : null}
    </Card>
  );
}

export default function Home() {
  const t = useTheme();
  const { st, configured } = useStore();
  const go = useGo();
  const { width } = useWindowDimensions();
  const n = new Date(), td = today();
  const T0 = st.tasks.items, open = T0.filter((x) => !x.done && x.cat !== 'daily');
  const urgent = open.filter((x) => x.p === 1).length;
  const due = open.filter((x) => x.end).sort((a, b) => a.end.localeCompare(b.end) || a.p - b.p).slice(0, 6);
  const daily = T0.filter((x) => x.cat === 'daily').sort(byPri);
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
  };
  const tileCols = width < 600 ? 2 : width < 900 ? 4 : 8;
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
      <Grid min={330}>
        <TimerCard />
        <CalorieCard />
      </Grid>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 12 }}>
        {TILES.map(([k, l, ic]) => (
          <View key={k} style={{ width: 100 / tileCols + '%', paddingHorizontal: 6 }}>
            <Pressable onPress={() => go(k)} accessibilityRole="button"
              style={({ pressed }) => ({ minHeight: 124, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: pressed ? t.acc : t.line, backgroundColor: t.card, justifyContent: 'space-between', gap: 10 })}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: alpha(t.acc, 0.14), alignItems: 'center', justifyContent: 'center' }}>
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
      <WeekProgram />
      <Grid min={310}>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}><H3>Yaklaşan son günler</H3><Btn sm title="Takvim" onPress={() => go('takvim')} /></Row>
          {due.length ? due.map((x, i) => <TaskRow key={x.id} x={x} rank={i + 1} />) : <Empty text="Son tarihi olan açık görev yok." />}
        </Card>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}><H3>Günlük işler</H3><Btn sm title="Tümü" onPress={() => go('gorevler')} /></Row>
          {daily.length ? daily.map((x) => <DailyRow key={x.id} x={x} />) : <Empty text="Görevler sayfasındaki “Günlük İşler” klasörüne ekleyebilirsin." />}
        </Card>
        <RoutinesToday />
        <NotifCard />
        <SettingsCard />
      </Grid>
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
