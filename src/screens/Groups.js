import React, { useState } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useTheme, alpha, shadow } from '../theme';
import {
  T, Mute, H2, H3, Card, Btn, Chip, Row, Grid, Empty, IconBtn, Field, DateField, TimeField, Seg, Check, Sheet, FormFooter, ListRow, Bar, useUI,
} from '../ui';
import { useNow } from '../components';
import { useGroups, GROUP_TYPES } from '../groups';
import { MODULES, PRE, PRI, freshStats, mmss, fmtD, hm, isTime, today, num } from '../logic';

const unitVal = (m, period, v) => (m[0] === 'ders' ? hm(v || 0) : m[0] === 'rutin' && period === 'week' ? (v || 0) + ' gün seri' : num(v || 0) + ' ' + m[4]);

function CreateSheet({ onClose }) {
  const t = useTheme();
  const G = useGroups();
  const { toast } = useUI();
  const [v, setV] = useState({ name: '', type: 'yaris', modules: ['ders'], pomo: true });
  const [busy, setBusy] = useState(false);
  const toggleMod = (k) => setV((o) => ({ ...o, modules: o.modules.includes(k) ? o.modules.filter((x) => x !== k) : [...o.modules, k] }));
  const save = async () => {
    if (!v.name.trim()) return toast('Grubun adını yaz');
    if (!v.modules.length) return toast('En az bir bölüm seç');
    setBusy(true);
    const r = await G.create({ ...v, name: v.name.trim() });
    setBusy(false);
    if (typeof r === 'string') return toast(r);
    toast('Grup kuruldu. Kod: ' + r.code);
    onClose(r.code);
  };
  return (
    <Sheet visible title="Grup kur" onClose={() => onClose()} footer={<FormFooter onCancel={() => onClose()} onSave={save} saveLabel={busy ? 'Kuruluyor…' : 'Kur'} />}>
      <Field label="Grup adı" value={v.name} onChangeText={(x) => setV((o) => ({ ...o, name: x }))} placeholder="Örn. Termo çalışma grubu" autoFocus />
      <Seg label="Grup türü" value={v.type} onChange={(x) => setV((o) => ({ ...o, type: x }))} options={[['yaris', 'Arkadaşlarla yarış'], ['ogretmen', 'Öğretmen – öğrenci']]} />
      <Mute>{v.type === 'yaris'
        ? 'Herkes seçtiğin bölümlerde birbiriyle kapışır: kim daha çok çalıştı, kim daha çok okudu…'
        : 'Sen öğretmen olursun. Öğrencilerin seçtiğin bölümlerdeki durumunu görür, onlara görev atarsın; görev atayınca öğrenciye bildirim gider.'}</Mute>
      <View style={{ gap: 6 }}>
        <Mute style={{ fontWeight: '700' }}>{v.type === 'yaris' ? 'Neyle yarışılacak?' : 'Neyi takip edeceksin?'}</Mute>
        <Row>{MODULES.map((m) => <Chip key={m[0]} label={m[1]} on={v.modules.includes(m[0])} onPress={() => toggleMod(m[0])} />)}</Row>
      </View>
      <Check label="Birlikte pomodoro olsun" value={v.pomo} onChange={(x) => setV((o) => ({ ...o, pomo: x }))} />
      <Mute>Grup kurulunca bir davet kodu çıkar; arkadaşların ya da öğrencilerin bu kodla katılır.</Mute>
    </Sheet>
  );
}

function JoinSheet({ onClose }) {
  const G = useGroups();
  const { toast } = useUI();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const r = await G.join(code);
    setBusy(false);
    if (typeof r === 'string') return toast(r);
    toast('“' + r.name + '” grubuna katıldın');
    onClose(r.code);
  };
  return (
    <Sheet visible title="Koda katıl" onClose={() => onClose()} footer={<FormFooter onCancel={() => onClose()} onSave={save} saveLabel={busy ? 'Bekle…' : 'Katıl'} />}>
      <Field label="Davet kodu" value={code} onChangeText={(x) => setCode(x.toUpperCase())} placeholder="Örn. K7MP2QX" autoCapitalize="characters" autoFocus maxLength={10} onSubmitEditing={save} />
    </Sheet>
  );
}

function AssignSheet({ code, students, onClose }) {
  const t = useTheme();
  const G = useGroups();
  const { toast } = useUI();
  const [v, setV] = useState({ to: 'all', title: '', p: 2, end: '', rTime: '', note: '' });
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const save = async () => {
    if (!v.title.trim()) return toast('Görevi yaz');
    if (v.rTime && !isTime(v.rTime)) return toast('Saati SS:DD olarak yaz');
    const r = await G.assign(code, { ...v, title: v.title.trim(), note: v.note.trim() });
    if (typeof r === 'string') return toast(r);
    toast(r.pushed ? 'Görev atandı, bildirim gönderildi' : 'Görev atandı');
    onClose();
  };
  return (
    <Sheet visible title="Görev ata" onClose={onClose} footer={<FormFooter onCancel={onClose} onSave={save} saveLabel="Ata" />}>
      <View style={{ gap: 6 }}>
        <Mute style={{ fontWeight: '700' }}>Kime?</Mute>
        <Row>
          <Chip label="Herkes" on={v.to === 'all'} onPress={() => set('to')('all')} />
          {students.map(([id, n]) => <Chip key={id} label={n} on={v.to === id} onPress={() => set('to')(id)} />)}
        </Row>
      </View>
      <Field label="Görev" value={v.title} onChangeText={set('title')} placeholder="Örn. 3. bölüm sorularını çöz" autoFocus />
      <Seg label="Öncelik" value={v.p} onChange={set('p')} options={[[1, 'Acil', t.red], [2, 'Öncelikli', t.yel], [3, 'Öncelikli değil', t.grn]]} />
      <Row style={{ alignItems: 'flex-start' }}>
        <DateField label="Son gün" value={v.end} onChange={set('end')} />
        <TimeField label="Hatırlatma saati" value={v.rTime} onChange={set('rTime')} />
      </Row>
      <Field label="Not" value={v.note} onChangeText={set('note')} />
    </Sheet>
  );
}

function GroupTimer({ code, g }) {
  const t = useTheme();
  const G = useGroups();
  const now = useNow(500);
  const T0 = g.timer, w = (g.work || 25) * 60000;
  const idle = !T0, run = T0 && T0.run;
  const rem = idle ? w : run ? T0.end - now : T0.left;
  const dur = idle ? w : T0.dur || w;
  const pct = Math.min(100, Math.max(0, (1 - rem / dur) * 100));
  const ph = (T0 && T0.phase === 'b' ? 'Mola' : 'Çalışma') + (idle ? ' · hazır' : !run ? ' · duraklatıldı' : '');
  const joined = !!G.joined[code];
  return (
    <Card bg={t.acc} border={t.acc}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ color: t.accI, fontWeight: '800', fontSize: 16 }}>Birlikte çalış</Text>
        <Text style={{ color: t.accI, opacity: 0.85 }}>{ph}</Text>
      </Row>
      <Text style={{ color: t.accI, fontSize: 64, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] }}>{mmss(rem)}</Text>
      <View style={{ height: 8, borderRadius: 8, backgroundColor: alpha(t.accI, 0.22), overflow: 'hidden' }}>
        <View style={{ width: pct + '%', height: '100%', backgroundColor: t.accI }} />
      </View>
      <Row>
        <Btn title={run ? 'Herkes için duraklat' : idle ? 'Herkes için başlat' : 'Devam'} onPress={() => G.pomo.toggle(code)} color={t.accI} style={{ borderColor: t.accI }} />
        <Btn title="Sıfırla" kind="inv" onPress={() => G.pomo.reset(code)} />
        <Btn title="Atla" kind="inv" onPress={() => G.pomo.skip(code)} />
      </Row>
      <Row>
        {PRE.slice(0, 4).map(([a, b]) => (
          <Pressable key={a + '-' + b} onPress={() => G.pomo.setDur(code, a, b)} style={{ paddingHorizontal: 12, minHeight: 34, justifyContent: 'center', borderRadius: 999, backgroundColor: (g.work || 25) === a && (g.brk || 5) === b ? t.accI : alpha(t.accI, 0.15) }}>
            <Text style={{ fontWeight: '700', color: (g.work || 25) === a && (g.brk || 5) === b ? t.acc : t.accI }}>{a + ' + ' + b}</Text>
          </Pressable>
        ))}
      </Row>
      <Pressable onPress={() => G.setJoin(code, !joined)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 }}>
        <Ionicons name={joined ? 'checkbox' : 'square-outline'} size={22} color={t.accI} />
        <Text style={{ color: t.accI, fontWeight: '700' }}>{joined ? 'Katılıyorum: zil bende de çalar, süre bana da yazılır' : 'Bu oturuma katıl'}</Text>
      </Pressable>
    </Card>
  );
}

function Ranking({ g, members, uid, period }) {
  const t = useTheme();
  const mods = MODULES.filter((m) => (g.modules || []).includes(m[0]));
  const people = Object.entries(members || {}).filter(([id]) => (g.members || []).includes(id)).map(([id, m]) => [id, freshStats(m), m.name || (g.names || {})[id] || 'Üye']);
  return (
    <Grid min={300}>
      {mods.map((m) => {
        const field = period === 'week' ? m[3] : m[2];
        const rows = people.map(([id, s, n]) => [id, n, s[field] || 0]).sort((a, b) => b[2] - a[2]);
        const top = Math.max(1, ...rows.map((r) => r[2]));
        return (
          <Card key={m[0]}>
            <H3>{m[1]}</H3>
            {rows.length ? rows.map(([id, n, v], i) => (
              <View key={id} style={{ gap: 4 }}>
                <Row wrap={false}>
                  <Text style={{ width: 24, fontWeight: '800', color: i === 0 ? t.acc : t.mute }}>{i + 1 + '.'}</Text>
                  <T w={id === uid ? '800' : '500'} style={{ flex: 1 }} numberOfLines={1}>{n + (id === uid ? ' (sen)' : '')}</T>
                  <T w="800">{unitVal(m, period, v)}</T>
                </Row>
                <Bar pct={(v / top) * 100} color={i === 0 ? t.acc : alpha(t.acc, 0.45)} h={8} />
              </View>
            )) : <Empty text="Henüz veri yok." />}
          </Card>
        );
      })}
    </Grid>
  );
}

function GroupDetail({ code, onBack }) {
  const t = useTheme();
  const G = useGroups();
  const { confirm, toast } = useUI();
  const [period, setPeriod] = useState('today');
  const [assigning, setAssigning] = useState(false);
  const D = G.list.find((x) => x.code === code) || {};
  const g = D.g;
  if (D.missing) {
    return (
      <View style={{ gap: 16 }}>
        <Btn sm icon="chevron-back" title="Gruplar" onPress={onBack} style={{ alignSelf: 'flex-start' }} />
        <Card><T w="700">Bu grup artık yok ya da gruptan çıkarıldın.</T><Btn title="Listeden kaldır" onPress={() => { G.leave(code); onBack(); }} /></Card>
      </View>
    );
  }
  if (!g) return <View style={{ gap: 16 }}><Btn sm icon="chevron-back" title="Gruplar" onPress={onBack} style={{ alignSelf: 'flex-start' }} /><Mute>Yükleniyor…</Mute></View>;
  const me = G.uid, isOwner = g.owner === me, teacherType = g.type === 'ogretmen';
  const names = g.names || {}, roles = g.roles || {};
  const students = (g.members || []).filter((id) => roles[id] === 'student').map((id) => [id, (D.members && D.members[id] && D.members[id].name) || names[id] || 'Öğrenci']);
  const assigns = (D.assign || []).slice().sort((a, b) => (b.created || 0) - (a.created || 0));
  const mineAssigns = assigns.filter((a) => a.to === 'all' || a.to === me);
  const mods = MODULES.filter((m) => (g.modules || []).includes(m[0]));
  return (
    <View style={{ gap: 16 }}>
      <Btn sm icon="chevron-back" title="Gruplar" onPress={onBack} style={{ alignSelf: 'flex-start' }} />
      <Card>
        <Mute>{GROUP_TYPES[g.type] || ''}</Mute>
        <T s={28} w="800">{g.name}</T>
        <Row>
          <Mute>Davet kodu</Mute>
          <T s={22} w="800" style={{ letterSpacing: 2 }}>{code}</T>
          <Btn sm icon="share-social-outline" title="Paylaş" onPress={() => Share.share({ message: 'Planlayıcı\'da “' + g.name + '” grubuma katıl. Grup kodu: ' + code }).catch(() => {})} />
        </Row>
        <Mute>{(g.members || []).length + ' üye · ' + mods.map((m) => m[1]).join(', ')}</Mute>
      </Card>

      {g.pomo ? <GroupTimer code={code} g={g} /> : null}

      {!teacherType ? (
        <>
          <Row>
            <Chip label="Bugün" on={period === 'today'} onPress={() => setPeriod('today')} />
            <Chip label="Bu hafta" on={period === 'week'} onPress={() => setPeriod('week')} />
          </Row>
          <Ranking g={g} members={D.members} uid={me} period={period} />
        </>
      ) : isOwner ? (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            <H2>Öğrenciler</H2>
            <Row>
              <Chip label="Bugün" on={period === 'today'} onPress={() => setPeriod('today')} />
              <Chip label="Bu hafta" on={period === 'week'} onPress={() => setPeriod('week')} />
            </Row>
          </Row>
          {students.length ? (
            <Grid min={280}>
              {students.map(([id, n]) => {
                const s = freshStats(D.members && D.members[id]);
                const open = assigns.filter((a) => (a.to === 'all' || a.to === id) && !(a.done && a.done[id])).length;
                return (
                  <Card key={id}>
                    <Row wrap={false}><T w="800" style={{ flex: 1 }}>{n}</T><IconBtn name="person-remove-outline" label="Gruptan çıkar" onPress={() => confirm(n + ' gruptan çıkarılsın mı?', () => G.kick(code, id), 'Çıkar')} /></Row>
                    {mods.map((m) => (
                      <Row key={m[0]} style={{ justifyContent: 'space-between' }}>
                        <Mute>{m[1]}</Mute>
                        <T w="700">{unitVal(m, period, s[period === 'week' ? m[3] : m[2]])}</T>
                      </Row>
                    ))}
                    <Mute>{open ? open + ' görev bekliyor' : 'Bekleyen görev yok'}</Mute>
                  </Card>
                );
              })}
            </Grid>
          ) : <Card><Empty text="Henüz öğrenci yok. Davet kodunu öğrencilerinle paylaş." /></Card>}
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <H3>Atanan görevler</H3>
              <Btn kind="pri" title="+ Görev ata" onPress={() => setAssigning(true)} />
            </Row>
            {assigns.length ? assigns.map((a, i) => {
              const targets = a.to === 'all' ? students.map((s) => s[0]) : [a.to];
              const doneN = targets.filter((id) => a.done && a.done[id]).length;
              return (
                <ListRow key={a.id} last={i === assigns.length - 1}>
                  <View style={{ flex: 1 }}>
                    <T w="700">{a.title}</T>
                    <Mute s={13}>{(a.to === 'all' ? 'Herkes' : names[a.to] || 'Öğrenci') + ' · ' + PRI[a.p || 2] + (a.end ? ' · son gün ' + fmtD(a.end) : '') + ' · ' + doneN + '/' + targets.length + ' tamamladı'}</Mute>
                  </View>
                  <IconBtn name="trash-outline" label="Görevi sil" onPress={() => confirm('Bu görev öğrencilerden de silinsin mi?', () => G.delAssign(code, a.id))} />
                </ListRow>
              );
            }) : <Empty text="Henüz görev atamadın." />}
          </Card>
        </>
      ) : (
        <Card>
          <H3>{'Öğretmenin verdiği görevler'}</H3>
          <Mute>Bunlar Görevler sayfanda da görünür; orada işaretlediğinde öğretmenin görür.</Mute>
          {mineAssigns.length ? mineAssigns.map((a, i) => {
            const done = !!(a.done && a.done[me]);
            return (
              <ListRow key={a.id} last={i === mineAssigns.length - 1}>
                <Pressable onPress={() => G.markAssign(code + '/' + a.id, !done)} hitSlop={6}>
                  <Ionicons name={done ? 'checkbox' : 'square-outline'} size={26} color={done ? t.grn : t.mute} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <T w="700" style={{ textDecorationLine: done ? 'line-through' : 'none' }}>{a.title}</T>
                  <Mute s={13}>{PRI[a.p || 2] + (a.end ? ' · son gün ' + fmtD(a.end) : '') + (a.note ? ' · ' + a.note : '')}</Mute>
                </View>
              </ListRow>
            );
          }) : <Empty text="Henüz görev yok." />}
        </Card>
      )}

      <Card>
        <H3>Üyeler</H3>
        {(g.members || []).map((id, i, arr) => (
          <ListRow key={id} last={i === arr.length - 1}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: alpha(t.acc, 0.15), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: t.acc, fontWeight: '800' }}>{String(names[id] || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
            <T style={{ flex: 1 }} w={id === me ? '800' : '500'}>{(names[id] || 'Üye') + (id === me ? ' (sen)' : '')}</T>
            <Mute>{roles[id] === 'teacher' ? 'Öğretmen' : roles[id] === 'student' ? 'Öğrenci' : id === g.owner ? 'Kurucu' : 'Üye'}</Mute>
            {isOwner && id !== me && !teacherType ? <IconBtn name="person-remove-outline" label="Gruptan çıkar" onPress={() => confirm((names[id] || 'Üye') + ' gruptan çıkarılsın mı?', () => G.kick(code, id), 'Çıkar')} /> : null}
          </ListRow>
        ))}
        <Row>
          {isOwner
            ? <Btn kind="danger" title="Grubu sil" onPress={() => confirm('Grup herkes için silinsin mi?', () => { G.remove(code); onBack(); })} />
            : <Btn kind="danger" title="Gruptan ayrıl" onPress={() => confirm('Gruptan ayrılmak istiyor musun?', () => { G.leave(code); onBack(); }, 'Ayrıl')} />}
        </Row>
      </Card>
      {assigning ? <AssignSheet code={code} students={students} onClose={() => setAssigning(false)} /> : null}
    </View>
  );
}

export default function Groups() {
  const t = useTheme();
  const { configured, user } = useStore();
  const G = useGroups();
  const [open, setOpen] = useState(null);
  const [sheet, setSheet] = useState(null);
  if (!configured || !user) return <Card><T w="700">Gruplar için eşitleme ve giriş gerekiyor.</T></Card>;
  if (open) return <GroupDetail code={open} onBack={() => setOpen(null)} />;
  return (
    <View style={{ gap: 16 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 180 }}><H2>Gruplar</H2><Mute>Arkadaşlarınla yarış ya da öğrencilerini takip et</Mute></View>
        <Row>
          <Btn title="Koda katıl" onPress={() => setSheet('join')} />
          <Btn kind="pri" title="+ Grup kur" onPress={() => setSheet('create')} />
        </Row>
      </Row>
      {G.list.length ? (
        <Grid min={260} gap={12}>
          {G.list.map((x) => {
            const g = x.g;
            return (
              <Pressable key={x.code} onPress={() => setOpen(x.code)}
                style={({ pressed }) => [{ minHeight: 120, padding: 16, borderRadius: t.r, borderWidth: t.bw, borderColor: pressed ? t.acc : t.line, backgroundColor: t.card, gap: 8, transform: [{ scale: pressed && t.soft ? 0.97 : 1 }] }, shadow(t)]}>
                <Row wrap={false}>
                  <View style={{ width: 44, height: 44, borderRadius: t.soft ? 22 : 12, backgroundColor: alpha(t.acc, 0.14), alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={g && g.type === 'ogretmen' ? 'school-outline' : 'trophy-outline'} size={23} color={t.acc} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T w="800" numberOfLines={1}>{g ? g.name : x.missing ? 'Silinmiş grup' : 'Yükleniyor…'}</T>
                    <Mute s={13}>{g ? GROUP_TYPES[g.type] + ' · ' + (g.members || []).length + ' üye' : x.code}</Mute>
                  </View>
                </Row>
                {g && g.timer && g.timer.run ? <Mute s={13}>Şu an birlikte çalışılıyor</Mute> : null}
              </Pressable>
            );
          })}
        </Grid>
      ) : <Card><Empty text="Henüz bir grubun yok. Grup kur ve kodunu arkadaşlarınla paylaş ya da sana verilen kodla katıl." /></Card>}
      {sheet === 'create' ? <CreateSheet onClose={(code) => { setSheet(null); if (code) setOpen(code); }} /> : null}
      {sheet === 'join' ? <JoinSheet onClose={(code) => { setSheet(null); if (code) setOpen(code); }} /> : null}
    </View>
  );
}
