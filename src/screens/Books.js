import React, { useState } from 'react';
import { View } from 'react-native';
import { useStore } from '../store';
import { useTheme, alpha } from '../theme';
import { T, Mute, H2, H3, Card, Btn, Chip, Row, Grid, Empty, IconBtn, Field, ListRow, Bar, useUI } from '../ui';
import { useForms } from '../components';
import { today, addDays, num, bRead } from '../logic';

function Reading({ b }) {
  const t = useTheme();
  const { update } = useStore();
  const forms = useForms();
  const { toast } = useUI();
  const [p, setP] = useState('');
  const td = today(), total = +b.total || 0, r = Math.min(bRead(b), total), rem = total - r;
  const tdp = b.logs.filter((l) => l.d === td).reduce((s, l) => s + l.p, 0);
  const w = b.logs.filter((l) => l.d > addDays(td, -7)).reduce((s, l) => s + l.p, 0) / 7;
  const est = w > 0 && rem > 0 ? Math.ceil(rem / w) : 0;
  const save = () => {
    const n = Math.round(+p);
    if (!(n > 0)) return toast('Okuduğun sayfa sayısını yaz');
    update('books', (d) => {
      const x = d.items.find((y) => y.id === b.id); if (!x) return;
      const last = x.logs[x.logs.length - 1];
      if (last && last.d === td) last.p += n; else x.logs.push({ d: td, p: n });
      const read = x.logs.reduce((s, l) => s + l.p, 0);
      if (read >= x.total) { x.st = 'bitti'; x.end = td; }
    });
    setP('');
    toast(r + n >= total ? 'Tebrikler, “' + b.title + '” bitti!' : total - r - n + ' sayfa kaldı');
  };
  return (
    <Card bg={alpha(t.acc, 0.06)} border={alpha(t.acc, 0.4)}>
      <Row style={{ alignItems: 'flex-start' }} wrap={false}>
        <View style={{ flex: 1 }}>
          <Mute>{'Şu an okuduğun' + (b.genre ? ' · ' + b.genre : '')}</Mute>
          <T s={26} w="800">{b.title}</T>
          {b.author ? <Mute>{b.author}</Mute> : null}
        </View>
        <IconBtn name="create-outline" label="Kitabı düzenle" onPress={() => forms.open('book', b)} />
      </Row>
      <Bar pct={total ? (r / total) * 100 : 0} h={14} />
      <Row>
        {[['Okunan', num(r) + ' / ' + num(total)], ['Kalan sayfa', num(rem)], ['Bugün', num(tdp) + ' sayfa']].map(([l, v]) => (
          <View key={l} style={{ flexGrow: 1, flexBasis: 110, padding: 12, borderRadius: t.rm, backgroundColor: t.card2 }}>
            <Mute s={13}>{l}</Mute><T s={21} w="800">{v}</T>
          </View>
        ))}
      </Row>
      {est ? <Mute>{'Son 7 günün hızıyla yaklaşık ' + est + ' günde biter.'}</Mute> : null}
      <Row style={{ alignItems: 'flex-end' }}>
        <Field label="Bugün okuduğum sayfa sayısı" value={p} onChangeText={setP} keyboardType="number-pad" placeholder="Örn. 25" onSubmitEditing={save} />
        <Btn kind="pri" title="Kaydet" onPress={save} />
        {b.logs.length ? <Btn title="Son girişi geri al" onPress={() => update('books', (d) => {
          const x = d.items.find((y) => y.id === b.id); if (!x || !x.logs.length) return;
          x.logs.pop();
          if (x.st === 'bitti' && x.logs.reduce((s, l) => s + l.p, 0) < x.total) x.st = 'oku';
        })} /> : null}
      </Row>
    </Card>
  );
}

export default function Books() {
  const { st, update } = useStore();
  const forms = useForms();
  const [g, setG] = useState(null);
  const B = st.books.items;
  const gs = [...new Set(B.map((b) => b.genre).filter(Boolean))];
  const vis = B.filter((b) => !g || b.genre === g);
  const cur = vis.filter((b) => b.st === 'oku'), later = vis.filter((b) => b.st === 'sira'), fin = vis.filter((b) => b.st === 'bitti');
  const small = (b, i, arr) => {
    const total = +b.total || 0, r = Math.min(bRead(b), total);
    return (
      <ListRow key={b.id} last={i === arr.length - 1}>
        <View style={{ flex: 1 }}>
          <T w="700">{b.title}</T>
          <Mute s={13}>{(b.author ? b.author + ' · ' : '') + (b.genre ? b.genre + ' · ' : '') + num(r) + '/' + num(total) + ' sayfa'}</Mute>
        </View>
        {b.st === 'sira' ? <Btn sm title="Başla" onPress={() => update('books', (d) => { const x = d.items.find((y) => y.id === b.id); if (x) x.st = 'oku'; })} /> : null}
        <IconBtn name="create-outline" label="Düzenle" onPress={() => forms.open('book', b)} />
      </ListRow>
    );
  };
  const finished = B.filter((b) => b.st === 'bitti').length;
  const pages = B.reduce((s, b) => s + Math.min(bRead(b), +b.total || 0), 0);
  return (
    <View style={{ gap: 16 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 180 }}><H2>Kitaplarım</H2><Mute>{finished + ' kitap bitti · ' + num(pages) + ' sayfa okundu'}</Mute></View>
        <Btn kind="pri" title="+ Kitap ekle" onPress={() => forms.open('book', { st: 'oku' })} />
      </Row>
      {gs.length ? (
        <Row>
          <Chip label="Tümü" on={!g} onPress={() => setG(null)} />
          {gs.map((x) => <Chip key={x} label={x} on={g === x} onPress={() => setG(x)} />)}
        </Row>
      ) : null}
      {cur.length ? cur.map((b) => <Reading key={b.id} b={b} />) : (
        <Card><Empty text={B.length ? 'Şu an okuduğun kitap yok. Listeden “Başla” diyebilirsin.' : 'Henüz kitap yok. “Kitap ekle” ile adını ve toplam sayfasını gir; her gün okuduğun sayfayı yazdıkça kalan sayfa düşer.'} /></Card>
      )}
      <Grid min={310}>
        <Card><H3>Okunacaklar</H3>{later.length ? later.map(small) : <Empty text="Okunacak listesi boş." />}</Card>
        <Card><H3>Bitenler</H3>{fin.length ? fin.map(small) : <Empty text="Henüz biten kitap yok." />}</Card>
      </Grid>
    </View>
  );
}
