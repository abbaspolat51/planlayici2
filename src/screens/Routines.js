import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { T, Mute, H2, H3, Card, Btn, Row, Grid, Empty, IconBtn, MonthView, ListRow, Switch } from '../ui';
import { useForms } from '../components';
import { today, addDays, streak, runs, fmtD, nowYM, shiftM, AY } from '../logic';

export default function Routines() {
  const t = useTheme();
  const { st, update } = useStore();
  const forms = useForms();
  const R = st.routines.items, td = today();
  const [selId, setSel] = useState(null);
  const [ym, setYm] = useState(nowYM());
  const sel = R.find((r) => r.id === selId) || R[0];
  const toggle = (id, d) => update('routines', (x) => {
    const r = x.items.find((y) => y.id === id); if (!r || d > td) return;
    const k = r.done.indexOf(d); if (k >= 0) r.done.splice(k, 1); else r.done.push(d);
  });
  const head = (
    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View style={{ flex: 1, minWidth: 180 }}><H2>Rutinler</H2><Mute>Her gün işaretle, zincirini kırma</Mute></View>
      <Btn kind="pri" title="+ Rutin ekle" onPress={() => forms.open('routine')} />
    </Row>
  );
  if (!sel) return <View style={{ gap: 16 }}>{head}<Card><Empty text="Henüz rutin yok. Örneğin “Sabah 20 dk kitap” ya da “Spor” ekle; her gün işaretledikçe takvimde zincir oluşur." /></Card></View>;
  const s = new Set(sel.done), rc = sel.color;
  const rs = runs(sel.done).filter((x) => x.n > 1).reverse().slice(0, 8);
  return (
    <View style={{ gap: 16 }}>
      {head}
      <Grid min={250} gap={12}>
        {R.map((r) => {
          const n = streak(r.done), best = Math.max(0, ...runs(r.done).map((x) => x.n)), on = r.done.includes(td), isSel = r.id === sel.id;
          return (
            <Card key={r.id} border={isSel ? r.color : undefined} style={isSel ? { borderWidth: 2 } : null}>
              <Pressable onPress={() => setSel(r.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: r.color }} />
                <T s={17} w="800" style={{ flex: 1 }}>{r.name}</T>
              </Pressable>
              <Text>
                <Text style={{ fontSize: 28, fontWeight: '800', color: r.color }}>{n}</Text>
                <Text style={{ color: t.ink }}> günlük seri</Text>
                <Text style={{ color: t.mute }}>{' · en uzun ' + best + ' gün' + (r.rTime ? ' · hatırlatma ' + r.rTime : '')}</Text>
              </Text>
              <Row wrap={false}>
                <T w="700" c={on ? r.color : t.mute} style={{ flex: 1 }}>{on ? 'Bugün yapıldı' : 'Bugün yapmadın'}</T>
                <IconBtn name="create-outline" label="Rutini düzenle" color={t.mute} onPress={() => forms.open('routine', r)} />
                <Switch value={on} onChange={() => toggle(r.id, td)} label={r.name + ': bugün yapıldı'} color={r.color} />
              </Row>
            </Card>
          );
        })}
      </Grid>
      <Grid min={330}>
        <Card>
          <MonthView
            y={ym.y} m={ym.m} onShift={(d) => setYm(shiftM(ym, d))}
            title={sel.name + ' · ' + AY[ym.m] + ' ' + ym.y}
            renderCell={(d, col) => {
              const on = s.has(d), ll = on && col > 0 && s.has(addDays(d, -1)), lr = on && col < 6 && s.has(addDays(d, 1));
              let k = 0;
              if (on && !s.has(addDays(d, 1))) { let x = d; while (s.has(x)) { k++; x = addDays(x, -1); } }
              return (
                <Pressable onPress={() => toggle(sel.id, d)} disabled={d > td} accessibilityLabel={fmtD(d)}
                  style={{ height: 64, alignItems: 'center', paddingTop: 6, opacity: d > td ? 0.4 : 1 }}>
                  {ll ? <View style={{ position: 'absolute', top: 20, left: 0, right: '50%', height: 8, backgroundColor: rc }} /> : null}
                  {lr ? <View style={{ position: 'absolute', top: 20, left: '50%', right: 0, height: 8, backgroundColor: rc }} /> : null}
                  <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? rc : 'transparent', borderWidth: d === td && !on ? 2 : 0, borderColor: t.ink }}>
                    <Text style={{ fontWeight: '700', color: on ? '#fff' : t.ink }}>{+d.slice(8)}</Text>
                  </View>
                  {k > 1 ? <Text style={{ fontSize: 11, fontWeight: '800', color: rc, marginTop: 2 }}>{k + ' gün'}</Text> : null}
                </Pressable>
              );
            }}
          />
          <Mute>Geçmiş bir güne dokunarak işaretleyebilir ya da kaldırabilirsin.</Mute>
        </Card>
        <Card>
          <H3>Zincirler</H3>
          {rs.length ? rs.map((x, i) => (
            <ListRow key={x.s} last={i === rs.length - 1}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: rc }} />
              <T style={{ flex: 1 }}>{fmtD(x.s) + ' – ' + fmtD(x.e)}</T>
              <T w="800">{x.n + ' gün'}</T>
            </ListRow>
          )) : <Empty text="En az iki gün üst üste işaretlediğinde zincirlerin burada listelenir." />}
        </Card>
      </Grid>
    </View>
  );
}
