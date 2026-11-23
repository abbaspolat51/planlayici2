// Haftalık / aylık / yıllık hedefler: her hedef bir pil, çalıştıkça dolar
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useTheme, alpha, battColor } from '../theme';
import {
  T, Mute, H2, H3, Card, Btn, Chip, Row, Grid, Empty, IconBtn, Field, Seg, Sheet, FormFooter, Battery, useUI,
} from '../ui';
import { useGo } from '../components';
import { PERIODS, UNITS, goalProgress, fmtAmount, rid, today, fmtD, parse } from '../logic';

// Pomodoro'da seçilebilen dersler + hedef adları
export function studySubjects(st) {
  const L = st.study.log || {};
  const fromLog = new Set();
  for (const d of Object.keys(L)) for (const k of Object.keys(L[d].by || {})) if (!k.startsWith('Grup: ')) fromLog.add(k);
  return [...new Set([
    ...st.library.folders.map((f) => f.name),
    ...st.goals.items.filter((g) => g.unit === 'saat').map((g) => g.subj && g.subj !== '*' ? g.subj : g.title),
    ...fromLog,
    ...(st.study.subj ? [st.study.subj] : []),
  ])].filter(Boolean);
}

function GoalForm({ data, onClose }) {
  const t = useTheme();
  const { st, update } = useStore();
  const { toast, confirm } = useUI();
  const [v, setV] = useState({
    title: data.title || '', period: data.period || 'year', unit: data.unit || 'saat',
    target: data.target ? String(data.target) : '', subj: data.subj ?? (data.id ? '' : 'auto'),
  });
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const subs = studySubjects(st);
  const save = () => {
    const title = v.title.trim();
    const target = parseFloat(String(v.target).replace(',', '.'));
    if (!title) return toast('Hedefin adını yaz');
    if (!(target > 0)) return toast('Hedef miktarını yaz (örn. 800)');
    // 'auto': hedef adıyla aynı ders adı pomodoro'da seçilince otomatik sayılır
    const subj = v.unit !== 'saat' ? '' : v.subj === 'auto' ? title : v.subj;
    update('goals', (d) => {
      if (data.id) { const g = d.items.find((x) => x.id === data.id); if (g) Object.assign(g, { title, period: v.period, unit: v.unit, target, subj }); }
      else d.items.push({ id: rid(), title, period: v.period, unit: v.unit, target, subj, logs: [], created: today() });
    });
    if (subj && subj !== '*' && !st.study.subj) update('study', (S) => { S.subj = subj; });
    toast(data.id ? 'Hedef güncellendi' : 'Hedef eklendi');
    onClose();
  };
  return (
    <Sheet visible title={data.id ? 'Hedefi düzenle' : 'Yeni hedef'} onClose={onClose} footer={<FormFooter onCancel={onClose} onSave={save} />}>
      <Field label="Hedef" value={v.title} onChangeText={set('title')} placeholder="Örn. C1 İngilizce" autoFocus={!data.id} />
      <Seg label="Dönem" value={v.period} onChange={set('period')} options={[['week', 'Haftalık'], ['month', 'Aylık'], ['year', 'Yıllık']]} />
      <Seg label="Birim" value={v.unit} onChange={set('unit')} options={Object.entries(UNITS).map(([k, u]) => [k, u[0]])} />
      <Field label={'Bu dönemde toplam (' + UNITS[v.unit][1] + ')'} value={v.target} onChangeText={set('target')} keyboardType="decimal-pad" placeholder={v.unit === 'saat' ? 'Örn. 800' : 'Örn. 20'} />
      {v.unit === 'saat' ? (
        <View style={{ gap: 6 }}>
          <Mute style={{ fontWeight: '700' }}>Pomodoro ile otomatik say</Mute>
          <Row>
            <Chip label="Hedefin adıyla" on={v.subj === 'auto'} onPress={() => set('subj')('auto')} />
            <Chip label="Tüm çalışmalar" on={v.subj === '*'} onPress={() => set('subj')('*')} />
            {subs.map((s) => <Chip key={s} label={s} on={v.subj === s} onPress={() => set('subj')(s)} />)}
            <Chip label="Sayma, elle gireceğim" on={v.subj === ''} onPress={() => set('subj')('')} />
          </Row>
          <Mute s={13}>Çalışma sayfasında “Ne çalışıyorsun?” kısmından bu dersi seçip pomodoro yaptıkça pil kendiliğinden dolar. Elle eklediklerin de sayılır.</Mute>
        </View>
      ) : null}
      {data.id ? <Btn kind="danger" icon="trash-outline" title="Hedefi sil" onPress={() => confirm('Bu hedef ve kayıtları silinsin mi?', () => { update('goals', (d) => { d.items = d.items.filter((x) => x.id !== data.id); }); onClose(); })} /> : null}
    </Sheet>
  );
}

function AddSheet({ g, onClose }) {
  const { update } = useStore();
  const { toast } = useUI();
  const [val, setVal] = useState('');
  const isH = g.unit === 'saat';
  const save = () => {
    const n = parseFloat(String(val).replace(',', '.'));
    if (!(n > 0)) return toast('Bir miktar yaz');
    const v = isH ? Math.round(n * 60) : n;
    update('goals', (d) => { const x = d.items.find((y) => y.id === g.id); if (x) x.logs.push({ d: today(), v }); });
    toast(fmtAmount(g.unit, isH ? v / 60 : v) + ' eklendi');
    onClose();
  };
  return (
    <Sheet visible title={g.title + ' · ilerleme ekle'} onClose={onClose} footer={<FormFooter onCancel={onClose} onSave={save} saveLabel="Ekle" />}>
      <Field label={isH ? 'Kaç saat? (örn. 1,5)' : 'Kaç ' + UNITS[g.unit][1] + '?'} value={val} onChangeText={setVal} keyboardType="decimal-pad" autoFocus onSubmitEditing={save} />
    </Sheet>
  );
}

const leftTxt = (p) => (p.left <= 1 ? 'Bugün son gün' : p.left + ' gün kaldı');

export function GoalCard({ g, onEdit }) {
  const t = useTheme();
  const { st, update } = useStore();
  const { toast } = useUI();
  const [adding, setAdding] = useState(false);
  const p = goalProgress(st, g);
  const u = UNITS[g.unit] || UNITS.adet;
  const add = (v) => {
    update('goals', (d) => { const x = d.items.find((y) => y.id === g.id); if (x) x.logs.push({ d: today(), v }); });
    const after = goalProgress({ ...st, goals: { items: [] } }, { ...g, logs: [...g.logs, { d: today(), v }] });
    if (p.pct < 100 && after.pct >= 100) toast('Tebrikler, “' + g.title + '” hedefi doldu! ⚡');
  };
  const undo = () => update('goals', (d) => { const x = d.items.find((y) => y.id === g.id); if (x && x.logs.length) x.logs.pop(); });
  const linked = g.unit === 'saat' && g.subj;
  const pace = p.pct >= 100 ? 'Hedef tamam' : g.unit === 'saat'
    ? 'Günde ortalama ' + fmtAmount('saat', p.perDay) + ' çalışırsan yetişir'
    : 'Günde ortalama ' + fmtAmount(g.unit, Math.ceil(p.perDay * 10) / 10) + ' gerekiyor';
  return (
    <Card>
      <Row wrap={false} style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Mute s={13}>{PERIODS[g.period] + ' hedef · ' + leftTxt(p)}</Mute>
          <T s={20} w="800">{g.title}</T>
        </View>
        <IconBtn name="create-outline" label="Hedefi düzenle" onPress={() => onEdit(g)} color={t.mute} />
      </Row>
      <View style={{ alignItems: 'center', paddingVertical: 6 }}>
        <Battery pct={p.pct} w={200} h={78} label={g.title} />
      </View>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <T s={17} w="800">{fmtAmount(g.unit, p.done) + ' / ' + fmtAmount(g.unit, g.target)}</T>
        <Mute s={13} style={{ textAlign: 'center' }}>{pace}</Mute>
        {linked ? <Mute s={12.5} style={{ textAlign: 'center' }}>{'Pomodoro: ' + (g.subj === '*' ? 'tüm çalışmalar sayılıyor' : '“' + g.subj + '” çalıştıkça dolar')}</Mute> : null}
      </View>
      <Row style={{ justifyContent: 'center' }}>
        {u[2].map(([v, l]) => <Btn key={l} kind={v === u[2][0][0] ? 'pri' : undefined} title={l} onPress={() => add(v)} />)}
        <Btn title="Başka…" onPress={() => setAdding(true)} />
        {g.logs.length ? <IconBtn name="arrow-undo-outline" label="Son girişi geri al" onPress={undo} color={t.mute} /> : null}
      </Row>
      {adding ? <AddSheet g={g} onClose={() => setAdding(false)} /> : null}
    </Card>
  );
}

// Ana sayfadaki küçük piller
export function GoalsMini() {
  const t = useTheme();
  const { st } = useStore();
  const go = useGo();
  const G = st.goals.items;
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}><H3>Hedeflerim</H3><Btn sm title={G.length ? 'Tümü' : '+ Hedef'} onPress={() => go('hedef')} /></Row>
      {G.length ? (
        <View style={{ gap: 12 }}>
          {G.slice(0, 5).map((g) => {
            const p = goalProgress(st, g);
            return (
              <Pressable key={g.id} onPress={() => go('hedef')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Battery pct={p.pct} w={74} h={34} label={g.title} />
                <View style={{ flex: 1 }}>
                  <T w="700" numberOfLines={1}>{g.title}</T>
                  <Mute s={13}>{PERIODS[g.period] + ' · ' + fmtAmount(g.unit, p.done) + ' / ' + fmtAmount(g.unit, g.target)}</Mute>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : <Empty text="Örneğin “C1 İngilizce, yılda 800 saat” gibi bir hedef koy; çalıştıkça pili dolar." />}
    </Card>
  );
}

export default function Goals() {
  const t = useTheme();
  const { st } = useStore();
  const [period, setPeriod] = useState('all');
  const [form, setForm] = useState(null);
  const all = st.goals.items;
  const list = all.filter((g) => period === 'all' || g.period === period);
  const order = { week: 0, month: 1, year: 2 };
  list.sort((a, b) => order[a.period] - order[b.period]);
  return (
    <View style={{ gap: 16 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ flex: 1, minWidth: 180 }}>
          <H2>Hedefler</H2>
          <Mute>Her hedef bir pil: çalıştıkça dolar, dönem bitince yeniden başlar.</Mute>
        </View>
        <Btn kind="pri" icon="add" title="Hedef ekle" onPress={() => setForm({})} />
      </Row>
      <Row>
        {[['all', 'Tümü'], ['week', 'Haftalık'], ['month', 'Aylık'], ['year', 'Yıllık']].map(([k, l]) => (
          <Chip key={k} label={l + (k === 'all' ? '' : ' · ' + all.filter((g) => g.period === k).length)} on={period === k} onPress={() => setPeriod(k)} />
        ))}
      </Row>
      {list.length ? (
        <Grid min={320}>{list.map((g) => <GoalCard key={g.id} g={g} onEdit={setForm} />)}</Grid>
      ) : (
        <Card>
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 10 }}>
            <Battery pct={0} w={140} h={56} showText={false} />
            <T w="700" style={{ textAlign: 'center' }}>{all.length ? 'Bu dönemde hedef yok.' : 'Henüz hedefin yok.'}</T>
            <Mute style={{ textAlign: 'center' }}>Örnek: “C1 İngilizce”, yıllık, 800 saat. Pomodoro'da “C1 İngilizce” dersini seçip çalıştıkça pil dolar; her saat yüzde olarak görünür.</Mute>
            <Btn kind="pri" icon="add" title="İlk hedefini ekle" onPress={() => setForm({ title: '', period: 'year', unit: 'saat' })} />
          </View>
        </Card>
      )}
      {form ? <GoalForm data={form} onClose={() => setForm(null)} /> : null}
    </View>
  );
}
