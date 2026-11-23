import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useStore } from '../store';
import { useTheme, alpha, lvlColor, lvlText } from '../theme';
import { T, Mute, H2, H3, Card, Btn, Row, Grid, Empty, IconBtn, Field, ListRow, useUI } from '../ui';
import { Scale } from './Home';
import { MEALS, LV, today, addDays, dayLabel, dShort, num, fday, ftot, lvl, rid } from '../logic';

export default function Food() {
  const t = useTheme();
  const { st, update } = useStore();
  const { toast } = useUI();
  const td = today();
  const [day, setDay] = useState(td);
  const [meal, setMeal] = useState(null);
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const F = st.food, D = fday(F, day), tot = ftot(D), L = lvl(F, tot), c = lvlColor(t, L);
  const [steps, setSteps] = useState(D.steps ? String(D.steps) : '');
  const [burn, setBurn] = useState(D.burn ? String(D.burn) : '');
  const [good, setGood] = useState(String(F.good));
  const [avg, setAvg] = useState(String(F.avg));
  const sub = (k) => D.items.filter((x) => x.m === k).reduce((s, x) => s + (+x.kcal || 0), 0);
  const days = Array.from({ length: 7 }, (_, i) => addDays(td, i - 6));
  const vals = days.map((x) => ftot(fday(F, x)));
  const mx = Math.max(F.avg * 1.15, ...vals);
  const ensure = (d) => d.days[day] || (d.days[day] = { items: [], steps: 0, burn: 0 });
  const changeDay = (n) => {
    const nd = addDays(day, n);
    if (nd > td) return;
    setDay(nd);
    const X = fday(F, nd);
    setSteps(X.steps ? String(X.steps) : '');
    setBurn(X.burn ? String(X.burn) : '');
  };
  const add = () => {
    const k = Math.round(+kcal);
    if (!name.trim()) return toast('Ne yediğini yaz');
    if (!(k >= 0) || kcal === '') return toast('Kaloriyi sayı olarak yaz');
    update('food', (d) => { ensure(d).items.push({ id: rid(), m: meal, name: name.trim(), kcal: k }); });
    setName(''); setKcal('');
  };
  return (
    <View style={{ gap: 16 }}>
      <Card bg={alpha(c, 0.13)} border={alpha(c, 0.42)}>
        <Row style={{ justifyContent: 'space-between' }} wrap={false}>
          <IconBtn name="chevron-back" label="Önceki gün" onPress={() => changeDay(-1)} />
          <T s={17} w="800">{dayLabel(day)}</T>
          <IconBtn name="chevron-forward" label="Sonraki gün" disabled={day >= td} onPress={() => changeDay(1)} />
        </Row>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Mute>Toplam alınan</Mute>
            <Text style={{ fontSize: 56, fontWeight: '800', color: t.ink, letterSpacing: -1 }}>{num(tot)} <Text style={{ fontSize: 18, color: t.mute }}>kcal</Text></Text>
            <Row><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c }} /><T w="800" c={lvlText(t, L)}>{LV[L]}</T></Row>
          </View>
          <View style={{ gap: 2 }}>
            <Mute>{'Adım '}<Text style={{ color: t.ink, fontWeight: '700' }}>{num(D.steps)}</Text></Mute>
            <Mute>{'Yakılan '}<Text style={{ color: t.ink, fontWeight: '700' }}>{num(D.burn) + ' kcal'}</Text></Mute>
            <Mute>{'Net '}<Text style={{ color: t.ink, fontWeight: '700' }}>{num(tot - (+D.burn || 0)) + ' kcal'}</Text></Mute>
          </View>
        </Row>
        <Scale tot={tot} max={Math.max(F.avg * 1.3, tot, 1)} />
        <Mute>{'Yeşil ' + num(F.good) + " kcal'ye kadar çok iyi · Sarı " + num(F.avg) + " kcal'ye kadar ortalama · üstü kırmızı, aşırı"}</Mute>
      </Card>

      <View style={{ gap: 10 }}>
        <H2>Öğün seç</H2>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, rowGap: 10 }}>
          {MEALS.map(([k, n]) => {
            const on = meal === k;
            return (
              <View key={k} style={{ width: '50%', paddingHorizontal: 5, maxWidth: 280 }}>
                <Pressable onPress={() => setMeal(on ? null : k)} accessibilityState={{ selected: on }}
                  style={{ minHeight: 80, borderRadius: t.r, borderWidth: t.bw || (on ? 0 : 1), borderColor: on ? t.acc : t.line, backgroundColor: on ? t.acc : t.card, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '800', fontSize: 17, color: on ? t.accI : t.ink }}>{n}</Text>
                  <Text style={{ fontSize: 13.5, color: on ? t.accI : t.mute }}>{num(sub(k)) + ' kcal'}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
        {meal ? (
          <Card>
            <H3>{MEALS.find((m) => m[0] === meal)[1] + ' öğününe ekle'}</H3>
            <Row style={{ alignItems: 'flex-end' }}>
              <Field label="Ne yedin?" value={name} onChangeText={setName} placeholder="Örn. menemen ve ekmek" style={{ flexBasis: 200 }} autoFocus />
              <Field label="Kalori" value={kcal} onChangeText={setKcal} keyboardType="number-pad" placeholder="kcal" style={{ flexBasis: 100, flexGrow: 0 }} onSubmitEditing={add} />
              <Btn kind="pri" title="Ekle" onPress={add} />
            </Row>
          </Card>
        ) : null}
      </View>

      <Grid min={300}>
        {MEALS.map(([k, n]) => {
          const its = D.items.filter((x) => x.m === k);
          return (
            <Card key={k}>
              <Row style={{ justifyContent: 'space-between' }}><H3>{n}</H3><T w="800">{num(sub(k)) + ' kcal'}</T></Row>
              {its.length ? its.map((x, i) => (
                <ListRow key={x.id} last={i === its.length - 1}>
                  <T style={{ flex: 1 }}>{x.name}</T>
                  <T w="800">{num(x.kcal) + ' kcal'}</T>
                  <IconBtn name="trash-outline" label="Sil" onPress={() => update('food', (d) => { const X = ensure(d); X.items = X.items.filter((y) => y.id !== x.id); })} />
                </ListRow>
              )) : <Empty text="Henüz bir şey eklenmedi." />}
            </Card>
          );
        })}
      </Grid>

      <Grid min={300}>
        <Card>
          <H3>Adım ve yakılan kalori</H3>
          <Mute>Telefonundaki Samsung Health / Google Fit'te gördüğün günlük sayıları buraya yaz.</Mute>
          <Row style={{ alignItems: 'flex-end' }}>
            <Field label="Adım" value={steps} onChangeText={setSteps} keyboardType="number-pad" />
            <Field label="Yakılan kcal" value={burn} onChangeText={setBurn} keyboardType="number-pad" />
          </Row>
          <Row><Btn kind="pri" title="Kaydet" onPress={() => { update('food', (d) => { const X = ensure(d); X.steps = Math.max(0, Math.round(+steps || 0)); X.burn = Math.max(0, Math.round(+burn || 0)); }); toast('Kaydedildi'); }} /></Row>
        </Card>
        <Card>
          <H3>Son 7 gün</H3>
          <View style={{ flexDirection: 'row', height: 160, gap: 8, alignItems: 'flex-end' }}>
            {days.map((x, i) => (
              <View key={x} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 10.5, color: t.mute }} numberOfLines={1}>{vals[i] ? num(vals[i]) : ''}</Text>
                <View style={{ width: '100%', height: (vals[i] / mx) * 110 + 3, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderRadius: 3, backgroundColor: lvlColor(t, lvl(F, vals[i])) }} />
                <Text style={{ fontSize: 12, color: t.mute, fontWeight: '600' }}>{dShort(x)}</Text>
              </View>
            ))}
          </View>
        </Card>
        <Card>
          <H3>Renk sınırları</H3>
          <Mute>Kendi hedefine göre ayarla.</Mute>
          <Row style={{ alignItems: 'flex-end' }}>
            <Field label="Yeşil üst sınır" value={good} onChangeText={setGood} keyboardType="number-pad" />
            <Field label="Sarı üst sınır" value={avg} onChangeText={setAvg} keyboardType="number-pad" />
          </Row>
          <Row><Btn title="Kaydet" onPress={() => {
            const g = Math.round(+good), a = Math.round(+avg);
            if (!(g > 0 && a > g)) return toast('Sarı sınır yeşilden büyük olmalı');
            update('food', (d) => { d.good = g; d.avg = a; });
            toast('Sınırlar güncellendi');
          }} /></Row>
        </Card>
      </Grid>
    </View>
  );
}
