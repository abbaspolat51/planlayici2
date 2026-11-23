import React, { useState } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useTheme, alpha, shadow } from '../theme';
import {
  T, Mute, H2, H3, Card, Btn, Chip, Row, Grid, Empty, IconBtn, Field, DateField, TimeField, Seg, Check, Sheet, FormFooter, ListRow, Bar, Switch, SectionHead, useUI,
} from '../ui';
import { useNow, useGo } from '../components';
import { useGroups, GROUP_TYPES, ASSIGN_TYPES, ROLE_NAMES, groupIntent, canAssign } from '../groups';
import { MODULES, PRE, PRI, DN, freshStats, mmss, fmtD, hm, isTime, today, addDays, num, leftInfo } from '../logic';
import { priColor, priText, modColor } from '../theme';

const TYPE_ICON = { yaris: 'timer-outline', ogretmen: 'school-outline', ekip: 'people-outline' };
const TYPE_DESC = {
  yaris: 'Arkadaşlarınla aynı anda çalışın: birlikte pomodoro, herkes birbirinin çalışma saatini görür, istersen seçtiğin bölümlerde yarışın.',
  ogretmen: 'Sen öğretmen olursun. Öğrencilerine görev atarsın; görev bildirim olarak gider ve takvimlerine işlenir. Öğrencilerinin çalışma saatlerini görürsün.',
  ekip: 'Sen ekip lideri olursun. Ekipte herkes birbirine görev verebilir; görev bildirim olarak gider ve takvime işlenir. Ekipteki herkes birbirinin çalışma saatini görür.',
};

// Çalışma ve Görevler sayfalarındaki rol düğmeleri
export function RoleCard({ onPick }) {
  const t = useTheme();
  const go = useGo();
  const G = useGroups();
  const now = useNow(30000);
  const open = (action, type) => {
    if (onPick) return onPick(action, type);
    groupIntent.current = { action, type };
    go('grup');
  };
  let live = 0;
  for (const x of (G && G.list) || []) for (const [id, m] of Object.entries(x.members || {})) if (id !== G.uid && m.live && m.live.end > now && m.live.ph === 'w') live++;
  const rows = [
    ['ogretmen', 'Öğretmen – öğrenci', 'Öğretmenim', 'Öğrenciyim'],
    ['ekip', 'Ekip – lider', 'Ekip kur (lider)', 'Ekibe katıl'],
    ['yaris', 'Grup çalışması', 'Grup kur', 'Koda katıl'],
  ];
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <H3>Birlikte çalış</H3>
          <Mute s={13}>{live ? 'Şu an gruplarında ' + live + ' kişi çalışıyor' : 'Rolünü seç: görev ver, görev al ya da birlikte çalış'}</Mute>
        </View>
        {G && G.list.length ? <Btn sm icon="people-outline" title={G.list.length + ' grubum'} onPress={() => go('grup')} /> : null}
      </Row>
      {rows.map(([type, title, lead, join], i) => (
        <View key={type} style={{ gap: 8, paddingTop: 10, borderTopWidth: 1, borderColor: t.line }}>
          <Row wrap={false} style={{ gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: t.soft ? 17 : 10, backgroundColor: alpha(t.acc, 0.13), alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={TYPE_ICON[type]} size={19} color={t.accT} />
            </View>
            <T w="800" style={{ flex: 1 }}>{title}</T>
          </Row>
          <Row wrap={false}>
            <Btn sm kind="pri" title={lead} onPress={() => open('create', type)} style={{ flex: 1 }} />
            <Btn sm title={join} onPress={() => open('join', type)} style={{ flex: 1 }} />
          </Row>
        </View>
      ))}
    </Card>
  );
}

// Herkes birbirinin çalışma saatini görür: bugün, bu hafta, şu an çalışıyor mu
function StudyBoard({ g, members, uid }) {
  const t = useTheme();
  const now = useNow(15000);
  const people = (g.members || []).map((id) => {
    const m = (members || {})[id];
    return { id, n: (m && m.name) || (g.names || {})[id] || 'Üye', s: freshStats(m) };
  }).sort((a, b) => (b.s.studyWeek || 0) - (a.s.studyWeek || 0));
  const top = Math.max(60, ...people.map((p) => Math.max(0, ...(p.s.study7 || []))));
  const tdIdx = (new Date().getDay() + 6) % 7;
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}><H3>Kim ne kadar çalıştı?</H3><Mute s={13}>bu hafta, Pzt → Paz</Mute></Row>
      {people.map((p, i) => {
        const L = p.s.live && p.s.live.end > now ? p.s.live : null;
        const st7 = p.s.study7 || [];
        return (
          <View key={p.id} style={{ gap: 8, paddingTop: 10, borderTopWidth: i ? 1 : 0, borderColor: t.line }}>
            <Row wrap={false}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: alpha(t.acc, 0.15), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: t.accT, fontWeight: '800' }}>{String(p.n).slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <T w={p.id === uid ? '800' : '700'} numberOfLines={1}>{p.n + (p.id === uid ? ' (sen)' : '')}</T>
                {L ? (
                  <Row wrap={false} style={{ gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: L.ph === 'w' ? t.grn : t.yel }} />
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: L.ph === 'w' ? t.grn : t.yelT }} numberOfLines={1}>
                      {(L.ph === 'w' ? 'Şu an çalışıyor' : 'Molada') + ' · ' + Math.max(1, Math.ceil((L.end - now) / 60000)) + ' dk kaldı' + (L.subj ? ' · ' + L.subj : '')}
                    </Text>
                  </Row>
                ) : <Mute s={12.5}>{'Bugün ' + hm(p.s.studyToday || 0)}</Mute>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T w="800">{hm(p.s.studyWeek || 0)}</T>
                <Mute s={12}>{'bugün ' + hm(p.s.studyToday || 0)}</Mute>
              </View>
            </Row>
            <View style={{ flexDirection: 'row', gap: 4, height: 34, alignItems: 'flex-end', paddingLeft: 44 }}>
              {DN.map((d, k) => (
                <View key={d} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                  <View style={{ width: '100%', height: Math.max(2, ((st7[k] || 0) / top) * 22), borderRadius: 3, backgroundColor: k === tdIdx ? t.acc : alpha(t.acc, 0.4) }} />
                  <Text style={{ fontSize: 9.5, color: t.mute }}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
      <Mute s={12.5}>Çalışma süreleri herkesin kendi pomodorosundan gelir.</Mute>
    </Card>
  );
}

const unitVal = (m, period, v) => (m[0] === 'ders' ? hm(v || 0) : m[0] === 'rutin' && period === 'week' ? (v || 0) + ' gün seri' : num(v || 0) + ' ' + m[4]);

function CreateSheet({ onClose, type0 }) {
  const t = useTheme();
  const G = useGroups();
  const { toast } = useUI();
  const [v, setV] = useState({ name: '', type: type0 || 'yaris', modules: ['ders'], pomo: true });
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
      <Field label={v.type === 'ekip' ? 'Ekip adı' : 'Grup adı'} value={v.name} onChangeText={(x) => setV((o) => ({ ...o, name: x }))} placeholder={v.type === 'ekip' ? 'Örn. Bitirme projesi ekibi' : v.type === 'ogretmen' ? 'Örn. 11-A Matematik' : 'Örn. Termo çalışma grubu'} autoFocus />
      <Seg label="Tür" value={v.type} onChange={(x) => setV((o) => ({ ...o, type: x }))} options={[['yaris', 'Grup çalışması'], ['ogretmen', 'Öğretmen – öğrenci'], ['ekip', 'Ekip – lider']]} />
      <Mute>{TYPE_DESC[v.type]}</Mute>
      <View style={{ gap: 6 }}>
        <Mute style={{ fontWeight: '700' }}>{v.type === 'yaris' ? 'Neyle yarışılacak?' : 'Neyi takip edeceksin?'}</Mute>
        <Row>{MODULES.map((m) => <Chip key={m[0]} label={m[1]} on={v.modules.includes(m[0])} onPress={() => toggleMod(m[0])} />)}</Row>
      </View>
      <Check label="Birlikte pomodoro olsun" value={v.pomo} onChange={(x) => setV((o) => ({ ...o, pomo: x }))} />
      <Mute>{'Grup kurulunca bir davet kodu çıkar; ' + (v.type === 'ogretmen' ? 'öğrencilerin' : v.type === 'ekip' ? 'ekip arkadaşların' : 'arkadaşların') + ' bu kodla katılır.'}</Mute>
    </Sheet>
  );
}

function JoinSheet({ onClose, type0 }) {
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
    <Sheet visible title={type0 === 'ogretmen' ? 'Öğrenci olarak katıl' : type0 === 'ekip' ? 'Ekibe katıl' : 'Koda katıl'} onClose={() => onClose()} footer={<FormFooter onCancel={() => onClose()} onSave={save} saveLabel={busy ? 'Bekle…' : 'Katıl'} />}>
      <Mute>{type0 === 'ogretmen' ? 'Öğretmeninin verdiği davet kodunu yaz. Verdiği görevler bildirim olarak gelir ve takvimine işlenir.' : type0 === 'ekip' ? 'Ekip liderinin verdiği kodu yaz. Ekipte herkes birbirine görev verebilir; sana verilen görevler bildirim olarak gelir ve takvimine işlenir.' : 'Arkadaşının verdiği grup kodunu yaz.'}</Mute>
      <Field label="Davet kodu" value={code} onChangeText={(x) => setCode(x.toUpperCase())} placeholder="Örn. K7MP2QX" autoCapitalize="characters" autoFocus maxLength={10} onSubmitEditing={save} />
    </Sheet>
  );
}

function AssignSheet({ code, people, g, onClose }) {
  const t = useTheme();
  const G = useGroups();
  const { toast } = useUI();
  const [v, setV] = useState({ to: 'all', title: '', p: 2, end: addDays(today(), 1), rTime: '', note: '' });
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const picked = v.to === 'all' ? [] : v.to;
  const togglePerson = (id) => setV((o) => {
    const cur = o.to === 'all' ? [] : o.to;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    return { ...o, to: next.length ? next : 'all' };
  });
  const save = async () => {
    if (!v.title.trim()) return toast('Görevi yaz');
    if (v.rTime && !isTime(v.rTime)) return toast('Saati SS:DD olarak yaz');
    const r = await G.assign(code, { ...v, end: v.end || today(), title: v.title.trim(), note: v.note.trim() });
    if (typeof r === 'string') return toast(r);
    toast(r.pushed ? 'Görev verildi, bildirim gönderildi' : 'Görev verildi');
    onClose();
  };
  return (
    <Sheet visible title="Görev ver" onClose={onClose} footer={<FormFooter onCancel={onClose} onSave={save} saveLabel="Görevi ver" />}>
      <View style={{ gap: 6 }}>
        <Mute style={{ fontWeight: '700' }}>Kime? (birden çok kişi seçebilirsin)</Mute>
        <Row>
          <Chip label={g.type === 'ogretmen' ? 'Tüm öğrenciler' : 'Herkes'} on={v.to === 'all'} onPress={() => set('to')('all')} />
          {people.map(([id, n]) => <Chip key={id} label={n} on={picked.includes(id)} onPress={() => togglePerson(id)} />)}
        </Row>
      </View>
      <Field label="Görev" value={v.title} onChangeText={set('title')} placeholder="Örn. Literatür taramasını bitir" autoFocus />
      <Seg label="Öncelik" value={v.p} onChange={set('p')} options={[[1, 'Acil', t.red], [2, 'Öncelikli', t.yel], [3, 'Öncelikli değil', t.grn]]} />
      <Row style={{ alignItems: 'flex-start' }}>
        <DateField label="Son gün" value={v.end} onChange={set('end')} />
        <TimeField label="Hatırlatma saati" value={v.rTime} onChange={set('rTime')} />
      </Row>
      <Field label="Not" value={v.note} onChangeText={set('note')} />
      <Mute s={13}>Görev bildirim olarak gider; son günüyle birlikte görevlerine ve takvimine işlenir.</Mute>
    </Sheet>
  );
}

// Tek bir grup görevi: kim verdi → kime, son gün, kimler tamamladı
export function GroupTaskItem({ x, showGroup }) {
  const t = useTheme();
  const G = useGroups();
  const { confirm } = useUI();
  const { a, g, code } = x;
  const nameOf = (id) => {
    const D = G.list.find((y) => y.code === code) || {};
    return (D.members && D.members[id] && D.members[id].name) || (g.names || {})[id] || 'Üye';
  };
  const c = priColor(t, a.p || 2);
  const left = a.end ? leftInfo({ end: a.end, done: x.toMe ? x.doneMe : x.doneN === x.targets.length }) : null;
  const allDone = x.targets.length > 0 && x.doneN === x.targets.length;
  const who = a.to === 'all' ? (g.type === 'ogretmen' ? 'Tüm öğrenciler' : 'Herkes') : x.targets.map((id) => (id === G.uid ? 'Sen' : nameOf(id))).join(', ');
  const canDel = x.byMe || g.owner === G.uid;
  return (
    <View style={{ flexDirection: 'row', borderRadius: t.rm, backgroundColor: t.card2, borderWidth: t.bw ? 1 : 0, borderColor: t.line, overflow: 'hidden' }}>
      <View style={{ width: 5, backgroundColor: c, opacity: (x.toMe ? x.doneMe : allDone) ? 0.4 : 1 }} />
      <View style={{ flex: 1, padding: 12, paddingRight: 6, gap: 6 }}>
        <Row wrap={false} style={{ alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <T s={16} w="700" c={x.toMe && x.doneMe ? t.mute : t.ink} style={{ textDecorationLine: x.toMe && x.doneMe ? 'line-through' : 'none' }}>{a.title}</T>
            <Row wrap style={{ gap: 4 }}>
              <Ionicons name="person-circle-outline" size={15} color={t.mute} />
              <Text style={{ fontSize: 13, color: t.ink, fontWeight: '700' }}>{x.byMe ? 'Sen' : a.byName || nameOf(a.by)}</Text>
              <Ionicons name="arrow-forward" size={13} color={t.mute} />
              <Text style={{ fontSize: 13, color: t.ink, fontWeight: '700', flexShrink: 1 }}>{who}</Text>
            </Row>
          </View>
          {x.toMe ? <Switch value={x.doneMe} onChange={(v) => G.setMine(code, a.id, v)} label="Tamamladım" color={c} /> : null}
        </Row>
        <Row style={{ gap: 6 }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: alpha(c, 0.16) }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: priText(t, a.p || 2) }}>{PRI[a.p || 2]}</Text>
          </View>
          {a.end ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: t.card }}>
              <Ionicons name="calendar-outline" size={12} color={left && left.n < 0 ? t.red : t.mute} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: left && left.n < 0 ? t.red : left && left.n <= 2 ? t.yelT : t.mute }}>{fmtD(a.end) + (left ? ' · ' + left.text : '')}</Text>
            </View>
          ) : null}
          {isTime(a.rTime) ? <Text style={{ fontSize: 12, color: t.mute }}>{'⏰ ' + a.rTime}</Text> : null}
          {showGroup ? <Text style={{ fontSize: 12, color: t.accT, fontWeight: '700' }}>{g.name}</Text> : null}
        </Row>
        {a.note ? <Text style={{ fontSize: 13, color: t.mute }}>{a.note}</Text> : null}
        {x.targets.length > 1 || !x.toMe ? (
          <Row style={{ gap: 6 }}>
            {x.targets.map((id) => {
              const ok = !!(a.done && a.done[id]);
              return (
                <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: ok ? alpha(t.grn, 0.5) : t.line, backgroundColor: ok ? alpha(t.grn, 0.12) : 'transparent' }}>
                  <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={ok ? t.grn : t.mute} />
                  <Text style={{ fontSize: 12, color: ok ? t.grn : t.mute, fontWeight: '700' }}>{id === G.uid ? 'Sen' : nameOf(id)}</Text>
                </View>
              );
            })}
            <Text style={{ fontSize: 12, color: allDone ? t.grn : t.mute, fontWeight: '700' }}>{x.doneN + '/' + x.targets.length + ' tamamladı'}</Text>
          </Row>
        ) : null}
      </View>
      {canDel ? (
        <View style={{ justifyContent: 'flex-start', paddingTop: 4 }}>
          <IconBtn name="trash-outline" label="Görevi sil" color={t.mute} onPress={() => confirm('Bu görev herkesten silinsin mi?', () => G.delAssign(code, a.id))} />
        </View>
      ) : null}
    </View>
  );
}

// Grubun görev panosu
function TaskBoard({ code, g, onAssign }) {
  const G = useGroups();
  const me = G.uid;
  const all = G.groupTasks.filter((x) => x.code === code);
  const toMe = all.filter((x) => x.toMe), byMe = all.filter((x) => x.byMe);
  const teacherOwner = g.type === 'ogretmen' && g.owner === me;
  const [tab, setTab] = useState(teacherOwner ? 'byMe' : 'toMe');
  const tabs = g.type === 'ogretmen'
    ? (teacherOwner ? [['byMe', 'Verdiğim görevler', byMe]] : [['toMe', 'Bana verilen', toMe]])
    : [['toMe', 'Bana verilen', toMe], ['byMe', 'Benim verdiğim', byMe], ['all', 'Tümü', all]];
  const cur = tabs.find((x) => x[0] === tab) || tabs[0];
  const open = cur[2].filter((x) => !(x.toMe ? x.doneMe : x.doneN === x.targets.length && x.targets.length));
  const done = cur[2].filter((x) => !open.includes(x));
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <H3>Görev panosu</H3>
          <Mute s={13}>{g.type === 'ekip' ? 'Ekipte herkes birbirine görev verebilir' : teacherOwner ? 'Öğrencilerine görev ver, kimin bitirdiğini gör' : 'Görevleri yalnızca öğretmenin verir'}</Mute>
        </View>
        {canAssign(g, me) ? <Btn kind="pri" icon="add" title="Görev ver" onPress={onAssign} /> : null}
      </Row>
      {tabs.length > 1 ? (
        <Row>{tabs.map(([k, l, arr]) => <Chip key={k} label={l + ' · ' + arr.length} on={cur[0] === k} onPress={() => setTab(k)} />)}</Row>
      ) : null}
      {open.length ? open.map((x) => <GroupTaskItem key={x.a.id} x={x} />) : <Empty text={cur[2].length ? 'Bekleyen görev yok, hepsi tamam.' : cur[0] === 'toMe' ? 'Sana henüz görev verilmedi.' : 'Henüz görev vermedin.'} />}
      {done.length ? <Mute s={13} style={{ fontWeight: '700', marginTop: 4 }}>{'Tamamlananlar (' + done.length + ')'}</Mute> : null}
      {done.map((x) => <GroupTaskItem key={x.a.id} x={x} />)}
    </Card>
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
      <Pressable onPress={() => G.setJoin(code, !joined)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}>
        <Text style={{ color: t.accI, fontWeight: '700', flex: 1 }}>{joined ? 'Katılıyorum: zil bende de çalar, süre bana da yazılır' : 'Bu oturuma katıl'}</Text>
        <Switch value={joined} onChange={(x) => G.setJoin(code, x)} label="Oturuma katıl" color={alpha(t.accI, 0.9)} />
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
                  <Text style={{ width: 24, fontWeight: '800', color: i === 0 ? t.accT : t.mute }}>{i + 1 + '.'}</Text>
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
  const me = G.uid, isOwner = g.owner === me, teacherType = ASSIGN_TYPES.includes(g.type), ekip = g.type === 'ekip';
  const names = g.names || {}, roles = g.roles || {};
  const students = (g.members || []).filter((id) => id !== g.owner).map((id) => [id, (D.members && D.members[id] && D.members[id].name) || names[id] || (ekip ? 'Üye' : 'Öğrenci')]);
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

      {!teacherType || ekip || isOwner ? <StudyBoard g={g} members={D.members} uid={me} /> : null}

      {!teacherType ? (
        <>
          <Row>
            <Chip label="Bugün" on={period === 'today'} onPress={() => setPeriod('today')} />
            <Chip label="Bu hafta" on={period === 'week'} onPress={() => setPeriod('week')} />
          </Row>
          <Ranking g={g} members={D.members} uid={me} period={period} />
        </>
      ) : (
        <>
          <TaskBoard code={code} g={g} onAssign={() => setAssigning(true)} />
          {isOwner && !ekip ? (
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
                    const s2 = freshStats(D.members && D.members[id]);
                    const open = G.groupTasks.filter((x) => x.code === code && x.targets.includes(id) && !(x.a.done && x.a.done[id])).length;
                    return (
                      <Card key={id}>
                        <Row wrap={false}><T w="800" style={{ flex: 1 }}>{n}</T><IconBtn name="person-remove-outline" label="Gruptan çıkar" onPress={() => confirm(n + ' gruptan çıkarılsın mı?', () => G.kick(code, id), 'Çıkar')} /></Row>
                        {mods.map((m) => (
                          <Row key={m[0]} style={{ justifyContent: 'space-between' }}>
                            <Mute>{m[1]}</Mute>
                            <T w="700">{unitVal(m, period, s2[period === 'week' ? m[3] : m[2]])}</T>
                          </Row>
                        ))}
                        <Mute>{open ? open + ' görev bekliyor' : 'Bekleyen görev yok'}</Mute>
                      </Card>
                    );
                  })}
                </Grid>
              ) : <Card><Empty text="Henüz öğrenci yok. Davet kodunu öğrencilerinle paylaş." /></Card>}
            </>
          ) : null}
        </>
      )}

      <Card>
        <H3>Üyeler</H3>
        {(g.members || []).map((id, i, arr) => (
          <ListRow key={id} last={i === arr.length - 1}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: alpha(t.acc, 0.15), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: t.accT, fontWeight: '800' }}>{String(names[id] || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
            <T style={{ flex: 1 }} w={id === me ? '800' : '500'}>{(names[id] || 'Üye') + (id === me ? ' (sen)' : '')}</T>
            <Mute>{ROLE_NAMES[roles[id]] && roles[id] !== 'member' ? ROLE_NAMES[roles[id]] : id === g.owner ? 'Kurucu' : 'Üye'}</Mute>
            {isOwner && id !== me ? <IconBtn name="person-remove-outline" label="Gruptan çıkar" onPress={() => confirm((names[id] || 'Üye') + ' gruptan çıkarılsın mı?', () => G.kick(code, id), 'Çıkar')} /> : null}
          </ListRow>
        ))}
        <Row>
          {isOwner
            ? <Btn kind="danger" title="Grubu sil" onPress={() => confirm('Grup herkes için silinsin mi?', () => { G.remove(code); onBack(); })} />
            : <Btn kind="danger" title="Gruptan ayrıl" onPress={() => confirm('Gruptan ayrılmak istiyor musun?', () => { G.leave(code); onBack(); }, 'Ayrıl')} />}
        </Row>
      </Card>
      {assigning ? <AssignSheet code={code} g={g} people={(g.members || []).filter((id) => id !== me && !(g.type === 'ogretmen' && id === g.owner)).map((id) => [id, (D.members && D.members[id] && D.members[id].name) || names[id] || 'Üye'])} onClose={() => setAssigning(false)} /> : null}
    </View>
  );
}

export default function Groups() {
  const t = useTheme();
  const { configured, user } = useStore();
  const G = useGroups();
  const [open, setOpen] = useState(null);
  const intent = React.useRef(groupIntent.current);
  if (groupIntent.current) groupIntent.current = null;
  const [sheet, setSheet] = useState(intent.current ? intent.current.action : null);
  const [type0, setType0] = useState(intent.current ? intent.current.type : undefined);
  const pick = (action, type) => { setType0(type); setSheet(action); };
  if (!configured || !user) return <Card><T w="700">Gruplar için eşitleme ve giriş gerekiyor.</T></Card>;
  if (open) return <GroupDetail code={open} onBack={() => setOpen(null)} />;
  return (
    <View style={{ gap: 16 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 180 }}><H2>Gruplar</H2><Mute>Grup çalışması, öğretmen–öğrenci ve ekip–lider</Mute></View>
        <Row>
          <Btn title="Koda katıl" onPress={() => pick('join', undefined)} />
          <Btn kind="pri" title="+ Grup kur" onPress={() => pick('create', undefined)} />
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
                    <Ionicons name={(g && TYPE_ICON[g.type]) || 'people-outline'} size={23} color={t.accT} />
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
      ) : null}
      <RoleCard onPick={pick} />
      {sheet === 'create' ? <CreateSheet type0={type0} onClose={(code) => { setSheet(null); if (code) setOpen(code); }} /> : null}
      {sheet === 'join' ? <JoinSheet type0={type0} onClose={(code) => { setSheet(null); if (code) setOpen(code); }} /> : null}
    </View>
  );
}

// Ana sayfa: tüm gruplardaki görevlerim
export function GroupTasksHome() {
  const t = useTheme();
  const G = useGroups();
  const go = useGo();
  if (!G || !G.groupTasks.length) return null;
  const mine = G.groupTasks.filter((x) => x.toMe && !x.doneMe);
  const given = G.groupTasks.filter((x) => x.byMe && x.doneN < x.targets.length);
  return (
    <Card>
      <SectionHead icon="people" color={modColor(t, 'grup')} title="Grup görevleri" sub={mine.length + ' görev seni bekliyor' + (given.length ? ', verdiğin ' + given.length + ' görev sürüyor' : '')}
        right={<Btn sm title="Gruplar" onPress={() => go('grup')} />} />
      {mine.length ? mine.slice(0, 6).map((x) => <GroupTaskItem key={x.code + x.a.id} x={x} showGroup />) : <Empty text="Sana verilen bekleyen görev yok." />}
      {given.length ? (
        <>
          <Mute s={13} style={{ fontWeight: '700', marginTop: 4 }}>Verdiğin görevler</Mute>
          {given.slice(0, 4).map((x) => <GroupTaskItem key={x.code + x.a.id} x={x} showGroup />)}
        </>
      ) : null}
    </Card>
  );
}
