import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useStore } from '../store';
import { useTheme, alpha, priColor } from '../theme';
import { T, Mute, H3, Card, Btn, Row, Grid, Empty, MonthView } from '../ui';
import { TaskRow } from '../components';
import { PRI, today, addDays, byPri, dayLabel, nowYM, shiftM } from '../logic';

export default function Calendar() {
  const t = useTheme();
  const { st } = useStore();
  const { width } = useWindowDimensions();
  const narrow = width < 600;
  const td = today();
  const [ym, setYm] = useState(nowYM());
  const [sel, setSel] = useState(td);
  const tasks = st.tasks.items.filter((x) => x.end && x.cat !== 'daily');
  const by = {};
  tasks.forEach((x) => { (by[x.end] = by[x.end] || []).push(x); });
  const dl = (by[sel] || []).slice().sort(byPri);
  const ongoing = st.tasks.items.filter((x) => !x.done && x.cat !== 'daily' && x.ext !== 'cal' && x.start && x.end && x.start <= sel && x.end > sel).sort(byPri);
  const up = tasks.filter((x) => !x.done && x.ext !== 'cal' && x.end >= td && x.end <= addDays(td, 14)).sort((a, b) => a.end.localeCompare(b.end) || a.p - b.p);
  return (
    <View style={{ gap: 16 }}>
      <Card>
        <MonthView
          y={ym.y} m={ym.m} onShift={(d) => setYm(shiftM(ym, d))}
          renderCell={(d) => {
            const its = (by[d] || []).slice().sort(byPri), isT = d === td, isS = d === sel;
            return (
              <Pressable onPress={() => setSel(d)} accessibilityLabel={d + ', ' + its.length + ' son gün'}
                style={{ minHeight: narrow ? 60 : 92, borderWidth: 1, borderColor: isS ? t.acc : t.line, margin: -0.5, padding: narrow ? 4 : 6, gap: 3, backgroundColor: isS ? alpha(t.acc, 0.08) : t.card }}>
                <Text style={{ alignSelf: 'flex-start', fontWeight: '700', fontSize: 14, paddingHorizontal: 6, borderRadius: 8, overflow: 'hidden', backgroundColor: isT ? t.acc : 'transparent', color: isT ? t.accI : t.ink }}>{+d.slice(8)}</Text>
                {narrow ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, paddingLeft: 4 }}>
                    {its.slice(0, 4).map((x) => <View key={x.id} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: x.ext === 'cal' ? t.acc : priColor(t, x.p), opacity: x.done ? 0.4 : 1 }} />)}
                  </View>
                ) : (
                  <>
                    {its.slice(0, 3).map((x) => (
                      <Text key={x.id} numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', color: t.ink, backgroundColor: alpha(x.ext === 'cal' ? t.acc : priColor(t, x.p), 0.22), opacity: x.done ? 0.5 : 1, textDecorationLine: x.done ? 'line-through' : 'none' }}>{x.title}</Text>
                    ))}
                    {its.length > 3 ? <Mute s={12}>{'+' + (its.length - 3)}</Mute> : null}
                  </>
                )}
              </Pressable>
            );
          }}
        />
        <Row style={{ columnGap: 16 }}>
          {[1, 2, 3].map((p) => (
            <Row key={p} style={{ gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: priColor(t, p) }} /><T s={13.5} w="700">{PRI[p]}</T></Row>
          ))}
          <Btn sm title="Bugüne git" onPress={() => { setYm(nowYM()); setSel(td); }} />
        </Row>
      </Card>
      <Grid min={310}>
        <Card>
          <H3>{dayLabel(sel) + ' · son günü olanlar'}</H3>
          {dl.length ? dl.map((x, i) => <TaskRow key={x.id} x={x} rank={i + 1} />) : <Empty text="Bu gün son günü olan görev yok." />}
          {ongoing.length ? (
            <>
              <H3 style={{ marginTop: 8 }}>Bu gün devam edenler</H3>
              {ongoing.map((x, i) => <TaskRow key={x.id} x={x} rank={i + 1} />)}
            </>
          ) : null}
        </Card>
        <Card>
          <H3>Önümüzdeki 14 gün</H3>
          {up.length ? up.map((x, i) => <TaskRow key={x.id} x={x} rank={i + 1} />) : <Empty text="Yaklaşan son gün yok." />}
        </Card>
      </Grid>
    </View>
  );
}
