import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { T, Mute, H3, Card, Btn, Chip, Row, Grid, Field, ListRow, useUI } from '../ui';
import { TimerCard, usePomo } from '../components';
import { PRE, today, addDays, dShort, hm } from '../logic';

export default function Study() {
  const t = useTheme();
  const { st, update } = useStore();
  const { toast } = useUI();
  const p = usePomo();
  const S = st.study, td = today(), L = S.log[td] || { m: 0, n: 0, by: {} };
  const [w, setW] = useState(String(S.work));
  const [b, setB] = useState(String(S.brk));
  const subs = [...new Set([...st.library.folders.map((f) => f.name), ...(S.subj ? [S.subj] : [])])];
  const days = Array.from({ length: 7 }, (_, i) => addDays(td, i - 6));
  const mins = days.map((d) => (S.log[d] || {}).m || 0);
  const mx = Math.max(60, ...mins), wk = mins.reduce((a, c) => a + c, 0);
  const by = Object.entries(L.by || {}).sort((a, c) => c[1] - a[1]);
  const apply = (ww, bb) => {
    if (!(ww >= 1 && bb >= 1)) return toast('Süreler en az 1 dakika olmalı');
    p.setDur(ww, bb); setW(String(Math.round(ww))); setB(String(Math.round(bb)));
    toast('Düzen: ' + Math.round(ww) + ' + ' + Math.round(bb));
  };
  const setSubj = (s) => update('study', (d) => { d.subj = s; if (d.timer) d.timer.subj = s; });
  return (
    <View style={{ gap: 16 }}>
      <Grid min={330}>
        <TimerCard big />
        <Card>
          <H3>Pomodoro düzeni</H3>
          <Mute>Hazır bir düzen seç ya da kendin yaz. Sayaç çalışırken değiştirirsen yeni süre bir sonraki turda geçerli olur. Süre bitince telefonuna bildirim gelir.</Mute>
          <Row>{PRE.map(([a, c]) => <Chip key={a + '-' + c} label={a + ' + ' + c} on={S.work === a && S.brk === c} onPress={() => apply(a, c)} />)}</Row>
          <Row style={{ alignItems: 'flex-end' }}>
            <Field label="Çalışma (dk)" value={w} onChangeText={setW} keyboardType="number-pad" />
            <Field label="Mola (dk)" value={b} onChangeText={setB} keyboardType="number-pad" />
            <Btn kind="pri" title="Uygula" onPress={() => apply(+w, +b)} />
          </Row>
          <Mute style={{ fontWeight: '700' }}>Ne çalışıyorsun?</Mute>
          {subs.length ? (
            <Row>
              <Chip label="Seçme" on={!S.subj} onPress={() => setSubj('')} />
              {subs.map((s) => <Chip key={s} label={s} on={S.subj === s} onPress={() => setSubj(s)} />)}
            </Row>
          ) : <Mute>Ders ambarına klasör ekleyince dersler burada çıkar.</Mute>}
        </Card>
      </Grid>
      <Card>
        <H3>Çalışma özeti</H3>
        <Row>
          {[['Bugün', hm(L.m)], ['Bugün biten pomodoro', String(L.n)], ['Son 7 gün', hm(wk)]].map(([l, v]) => (
            <View key={l} style={{ flexGrow: 1, flexBasis: 140, padding: 14, borderRadius: t.rm, backgroundColor: t.card2 }}>
              <Mute s={13}>{l}</Mute>
              <T s={24} w="800">{v}</T>
            </View>
          ))}
        </Row>
        {by.map(([k, v], i) => (
          <ListRow key={k} last={i === by.length - 1}><T style={{ flex: 1 }}>{k}</T><T w="800">{hm(v)}</T></ListRow>
        ))}
        <View style={{ flexDirection: 'row', height: 160, gap: 8, alignItems: 'flex-end', marginTop: 6 }}>
          {days.map((d, i) => (
            <View key={d} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 10.5, color: t.mute }} numberOfLines={1}>{mins[i] ? mins[i] + ' dk' : ''}</Text>
              <View style={{ width: '100%', height: (mins[i] / mx) * 110 + 3, borderRadius: 4, backgroundColor: t.acc }} />
              <Text style={{ fontSize: 12, color: t.mute, fontWeight: '600' }}>{dShort(d)}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
