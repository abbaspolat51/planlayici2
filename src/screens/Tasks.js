import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useStore } from '../store';
import { useTheme, alpha } from '../theme';
import { T, Mute, H2, H3, Card, Btn, Row, Grid, Empty, IconBtn, useUI } from '../ui';
import { TaskRow, DailyRow, useForms } from '../components';
import { PRI, byPri, today, addDays } from '../logic';
import { RoleCard } from './Groups';

export default function Tasks() {
  const t = useTheme();
  const { st, update } = useStore();
  const forms = useForms();
  const { confirm } = useUI();
  const [showDone, setShowDone] = useState(false);
  const all = st.tasks.items.filter((x) => x.cat !== 'daily' && x.ext !== 'cal');
  const td0 = today();
  const calItems = st.tasks.items.filter((x) => x.ext === 'cal' && x.end >= td0 && x.start <= addDays(td0, 14))
    .sort((a, b) => (a.start + (a.rTime || '')).localeCompare(b.start + (b.rTime || '')));
  const open = all.filter((x) => !x.done).sort(byPri), done = all.filter((x) => x.done).sort(byPri);
  const daily = st.tasks.items.filter((x) => x.cat === 'daily').sort(byPri);
  const td = today(), dd = daily.filter((x) => (x.doneOn || []).includes(td)).length;
  const colors = { 1: t.red, 2: t.yel, 3: t.grn };
  return (
    <View style={{ gap: 22 }}>
      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <H2>Görevler</H2>
            <Mute>{'Öncelik sırasına göre · ' + open.length + ' açık görev'}</Mute>
          </View>
          <Btn kind="pri" title="+ Görev ekle" onPress={() => forms.open('task', { cat: 'genel' })} />
        </Row>
        <Row style={{ columnGap: 16 }}>
          {[1, 2, 3].map((p) => (
            <Row key={p} style={{ gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: colors[p] }} />
              <T s={13.5} w="700">{PRI[p] + ' · ' + open.filter((x) => x.p === p).length}</T>
            </Row>
          ))}
        </Row>
        {open.length ? open.map((x, i) => <TaskRow key={x.id} x={x} rank={i + 1} />) : <Empty text="Açık görev yok. “Görev ekle” ile başla." />}
        {done.length ? (
          <>
            <Btn sm title={(showDone ? 'Tamamlananları gizle' : 'Tamamlananlar') + ' (' + done.length + ')'} onPress={() => setShowDone(!showDone)} style={{ alignSelf: 'flex-start' }} />
            {showDone ? done.map((x) => <TaskRow key={x.id} x={x} rank="" />) : null}
          </>
        ) : null}
      </Card>

      <RoleCard />

      <View style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <H2>Başlıklar</H2>
            <Mute>Hangi görev hangi başlığın altında</Mute>
          </View>
          <Btn title="+ Başlık ekle" onPress={() => forms.open('cat')} />
        </Row>
        <Grid min={310}>
          <Card bg={alpha(t.acc, 0.08)} border={alpha(t.acc, 0.35)}>
            <Row style={{ justifyContent: 'space-between' }}><H3>Günlük İşler</H3><Mute>{'bugün ' + dd + '/' + daily.length}</Mute></Row>
            {daily.length ? daily.map((x) => <DailyRow key={x.id} x={x} />) : <Empty text="Her gün tekrar eden işlerini buraya ekle; her gün yeniden işaretlenir." />}
            <Btn sm title="+ Günlük iş" onPress={() => forms.open('task', { cat: 'daily' })} style={{ alignSelf: 'flex-start' }} />
          </Card>
          {st.tasks.cats.filter((c) => c.id !== 'daily').map((c) => {
            const isCal = c.id === 'takvim';
            if (isCal && !calItems.length) return null;
            const its = isCal ? calItems : all.filter((x) => x.cat === c.id).sort(byPri);
            let r = 0;
            return (
              <Card key={c.id}>
                <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                  <H3 style={{ flex: 1 }}>{c.name}</H3>
                  <Mute>{its.filter((x) => !x.done).length + ' açık'}</Mute>
                  {c.id !== 'genel' && !isCal && !c.id.startsWith('g-') ? <IconBtn name="trash-outline" label="Başlığı sil" onPress={() => confirm('Bu başlık silinsin mi? İçindeki görevler “Genel” başlığına taşınır.', () => update('tasks', (d) => {
                    d.items.forEach((x) => { if (x.cat === c.id) x.cat = 'genel'; });
                    d.cats = d.cats.filter((y) => y.id !== c.id);
                  }))} /> : null}
                </Row>
                {its.length ? its.map((x) => <TaskRow key={x.id} x={x} rank={x.done ? '' : ++r} inFolder />) : <Empty text="Bu başlıkta görev yok." />}
                {isCal ? <Mute>Önümüzdeki 14 gün · telefon takviminden</Mute> : c.id.startsWith('g-') ? <Mute>Grupta sana atanan görevler (takviminde de görünür)</Mute> : <Btn sm title="+ Görev" onPress={() => forms.open('task', { cat: c.id })} style={{ alignSelf: 'flex-start' }} />}
              </Card>
            );
          })}
        </Grid>
      </View>
    </View>
  );
}
