import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { T, Mute, H3, Card, Btn, Chip, Row, Grid, Empty, IconBtn, Field, DateField, Seg, ListRow, Bar, useUI } from '../ui';
import { today, addDays, weekStart, fmtD, tl, balance, parseAmt, rid } from '../logic';

const CATS = ['Yemek', 'Market', 'Ulaşım', 'Okul', 'Kira', 'Fatura', 'Eğlence', 'Giyim', 'Harçlık', 'Burs', 'Maaş'];

export default function Money() {
  const t = useTheme();
  const { st, update } = useStore();
  const { toast, confirm } = useUI();
  const M = st.money, td = today();
  const [ws, setWs] = useState(weekStart(td));
  const we = addDays(ws, 6);
  const [start, setStart] = useState(String(M.start || 0).replace('.', ','));
  const [v, setV] = useState({ t: 'gider', amt: '', d: td, cat: '', note: '' });
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const wk = M.items.filter((x) => x.d >= ws && x.d <= we).sort((a, b) => b.d.localeCompare(a.d));
  const inc = wk.filter((x) => x.t === 'gelir').reduce((s, x) => s + x.amt, 0);
  const exp = wk.filter((x) => x.t === 'gider').reduce((s, x) => s + x.amt, 0);
  const bal = balance(M);
  const cats = {};
  wk.filter((x) => x.t === 'gider').forEach((x) => { const c = x.cat || 'Diğer'; cats[c] = (cats[c] || 0) + x.amt; });
  const cmx = Math.max(1, ...Object.values(cats));
  const allCats = [...new Set([...CATS, ...M.items.map((x) => x.cat).filter(Boolean)])];
  const add = () => {
    const amt = parseAmt(v.amt);
    if (!(amt > 0)) return toast('Geçerli bir tutar yaz');
    update('money', (d) => { d.items.push({ id: rid(), t: v.t, amt: Math.round(amt * 100) / 100, cat: v.cat.trim(), note: v.note.trim(), d: v.d || td }); });
    toast(v.t === 'gelir' ? 'Kazanç eklendi' : 'Harcama eklendi');
    setV((o) => ({ ...o, amt: '', note: '' }));
  };
  return (
    <View style={{ gap: 16 }}>
      <Grid min={330}>
        <Card>
          <Mute>Kalan param</Mute>
          <Text style={{ fontSize: 48, fontWeight: '800', letterSpacing: -1, color: bal < 0 ? t.red : t.ink }}>{tl(bal)}</Text>
          <Row style={{ alignItems: 'flex-end' }}>
            <Field label="Başlangıç bakiyesi (₺)" value={start} onChangeText={setStart} keyboardType="decimal-pad" />
            <Btn sm title="Güncelle" onPress={() => {
              const n = parseAmt(start);
              if (isNaN(n)) return toast('Geçerli bir tutar yaz');
              update('money', (d) => { d.start = Math.round(n * 100) / 100; });
              toast('Başlangıç bakiyesi güncellendi');
            }} />
          </Row>
        </Card>
        <Card>
          <Row style={{ justifyContent: 'space-between' }} wrap={false}>
            <IconBtn name="chevron-back" label="Önceki hafta" onPress={() => setWs(addDays(ws, -7))} />
            <T s={17} w="800">{fmtD(ws) + ' – ' + fmtD(we) + (ws === weekStart(td) ? ' · bu hafta' : '')}</T>
            <IconBtn name="chevron-forward" label="Sonraki hafta" onPress={() => setWs(addDays(ws, 7))} />
          </Row>
          <Row>
            {[['Kazandım', inc, t.grn], ['Harcadım', exp, t.red], ['Haftalık fark', inc - exp, t.ink]].map(([l, n, c]) => (
              <View key={l} style={{ flexGrow: 1, flexBasis: 120, padding: 14, borderRadius: 14, backgroundColor: t.card2 }}>
                <Mute s={13}>{l}</Mute>
                <T s={21} w="800" c={c}>{tl(n)}</T>
              </View>
            ))}
          </Row>
        </Card>
      </Grid>
      <Grid min={310}>
        <Card>
          <H3>Yeni kayıt</H3>
          <Seg label="Tür" value={v.t} onChange={set('t')} options={[['gider', 'Harcama', t.red], ['gelir', 'Kazanç', t.grn]]} />
          <Row style={{ alignItems: 'flex-start' }}>
            <Field label="Tutar (₺)" value={v.amt} onChangeText={set('amt')} keyboardType="decimal-pad" placeholder="0,00" />
            <DateField label="Tarih" value={v.d} onChange={set('d')} allowClear={false} />
          </Row>
          <Field label="Kategori" value={v.cat} onChangeText={set('cat')} placeholder="Yemek, Ulaşım…" />
          <Row>{allCats.map((c) => <Chip key={c} label={c} on={v.cat === c} onPress={() => set('cat')(v.cat === c ? '' : c)} />)}</Row>
          <Field label="Açıklama" value={v.note} onChangeText={set('note')} placeholder="Örn. market alışverişi" />
          <Row><Btn kind="pri" title="Ekle" onPress={add} /></Row>
        </Card>
        <Card>
          <H3>Haftanın kayıtları</H3>
          {wk.length ? wk.map((x, i) => (
            <ListRow key={x.id} last={i === wk.length - 1}>
              <View style={{ flex: 1 }}>
                <T w="700">{x.note || x.cat || (x.t === 'gelir' ? 'Kazanç' : 'Harcama')}</T>
                <Mute s={13}>{fmtD(x.d) + (x.cat ? ' · ' + x.cat : '')}</Mute>
              </View>
              <T w="800" c={x.t === 'gelir' ? t.grn : t.red}>{(x.t === 'gelir' ? '+' : '−') + tl(x.amt)}</T>
              <IconBtn name="trash-outline" label="Kaydı sil" onPress={() => confirm('Bu kayıt silinsin mi?', () => update('money', (d) => { d.items = d.items.filter((y) => y.id !== x.id); }))} />
            </ListRow>
          )) : <Empty text="Bu hafta kayıt yok." />}
        </Card>
        <Card>
          <H3>Harcama dağılımı</H3>
          {Object.keys(cats).length ? Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
            <View key={k} style={{ gap: 4 }}>
              <Row style={{ justifyContent: 'space-between' }}><T>{k}</T><T w="800">{tl(n)}</T></Row>
              <Bar pct={(n / cmx) * 100} color={t.red} />
            </View>
          )) : <Empty text="Bu hafta harcama yok." />}
        </Card>
      </Grid>
    </View>
  );
}
