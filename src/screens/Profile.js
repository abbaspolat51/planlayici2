import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Platform, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useTheme, alpha, THEMES, THEME_IDS, PALETTES, PALETTE_IDS, buildTheme, shadow } from '../theme';
import { T, Mute, H2, H3, Card, Btn, Chip, Row, Grid, Field, Seg, Check, IconBtn, useUI } from '../ui';
import { NotifCard, useScrollTop } from '../components';
import { useGroups } from '../groups';
import { HOME_SECTIONS } from '../logic';
import { TILES } from './Home';
import { calendarSupported, calPermission, listCalendars, syncNow } from '../calendar';
import { testPomodoro, pushProjectId, nativeNotifications } from '../notifications';

function ThemeCard({ id, on, onPress }) {
  const t = useTheme();
  const dark = t.dark;
  const { st } = useStore();
  const p = buildTheme(id, dark, (st.prefs || {}).palette);
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }}
      style={({ pressed }) => [{ borderRadius: t.r, borderWidth: on ? 2 : t.bw || 1, borderColor: on ? t.acc : t.line, backgroundColor: t.card, padding: 12, gap: 10, transform: [{ scale: pressed && t.soft ? 0.97 : 1 }] }, shadow(t)]}>
      <View style={{ backgroundColor: p.bg, borderRadius: p.r - 6 > 6 ? p.r - 6 : 8, padding: 10, gap: 8 }}>
        <View style={{ backgroundColor: p.card, borderRadius: p.rm, borderWidth: p.bw, borderColor: p.line, padding: 10, gap: 6 }}>
          <View style={{ width: '60%', height: 8, borderRadius: 4, backgroundColor: p.ink, opacity: 0.85 }} />
          <View style={{ width: '40%', height: 6, borderRadius: 3, backgroundColor: p.mute }} />
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
            <View style={{ width: 54, height: 20, borderRadius: p.rb > 100 ? 10 : p.rb / 2, backgroundColor: p.acc }} />
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: p.red, alignSelf: 'center' }} />
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: p.yel, alignSelf: 'center' }} />
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: p.grn, alignSelf: 'center' }} />
          </View>
        </View>
      </View>
      <Row wrap={false}>
        <View style={{ flex: 1 }}>
          <T w="800">{THEMES[id].name}</T>
          <Mute s={13}>{THEMES[id].desc}</Mute>
        </View>
        {on ? <Ionicons name="checkmark-circle" size={24} color={t.accT} /> : null}
      </Row>
    </Pressable>
  );
}

function CalendarCard() {
  const { st, update } = useStore();
  const { toast } = useUI();
  const P = st.prefs;
  const [perm, setPerm] = useState(null);
  const [cals, setCals] = useState([]);
  const load = async (ask) => {
    const ok = await calPermission(ask);
    setPerm(ok);
    if (ok) setCals(await listCalendars());
  };
  useEffect(() => { load(false); }, []);
  const set = (k, v) => update('prefs', (d) => { d[k] = v; });
  const toggleCal = (id) => update('prefs', (d) => {
    const all = cals.map((c) => c.id);
    const cur = d.calIds.length ? d.calIds : all;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    d.calIds = next.length === all.length ? [] : next;
  });
  if (!calendarSupported) {
    return <Card><H3>Telefon takvimi</H3><Mute>Telefon takvimi bağlantısı Android uygulamasında çalışır. Telefonda içe alınan etkinlikler burada da “Telefon Takvimi” başlığı altında görünür.</Mute></Card>;
  }
  const imported = st.tasks.items.filter((x) => x.ext === 'cal').length;
  return (
    <Card>
      <H3>Telefon takvimi</H3>
      {perm === false ? (
        <>
          <Mute>Planlayıcı'nın telefon takvimine erişmesine izin ver.</Mute>
          <Row><Btn kind="pri" title="Takvime erişim izni ver" onPress={() => load(true)} /></Row>
        </>
      ) : (
        <>
          <Check label="Telefon takvimindeki etkinlikleri görevlere al" value={P.calImport} onChange={(v) => set('calImport', v)} />
          <Check label="Görevleri ve haftalık programı telefon takvimine yaz" value={P.calExport} onChange={(v) => set('calExport', v)} />
          <Check label="Takvim etkinlikleri için Planlayıcı da hatırlatsın" value={P.calNotify} onChange={(v) => set('calNotify', v)} />
          <Mute>{'Etkinliklerin hatırlatıcıları (alarmları) görevde saklanır. Son seçenek açıksa her hatırlatıcı için Planlayıcı da bildirim gönderir; telefonun takvimi zaten hatırlatıyorsa kapalı bırak. Şu an ' + imported + ' etkinlik içe alındı.'}</Mute>
          {P.calImport && cals.length ? (
            <View style={{ gap: 6 }}>
              <Mute style={{ fontWeight: '700' }}>Hangi takvimlerden alınsın?</Mute>
              <Row>{cals.map((c) => <Chip key={c.id} label={c.title + (c.account && c.account !== c.title ? ' · ' + c.account : '')} on={!P.calIds.length || P.calIds.includes(c.id)} onPress={() => toggleCal(c.id)} />)}</Row>
            </View>
          ) : null}
          <Row><Btn title="Şimdi eşitle" icon="sync-outline" onPress={async () => { const ok = await syncNow(st, update); toast(ok ? 'Takvim eşitlendi' : 'Takvime erişim izni yok'); }} /></Row>
        </>
      )}
    </Card>
  );
}

function ModeCard() {
  const t = useTheme();
  const { st, setThemeMode } = useStore();
  const P = st.prefs;
  return (
        <Card>
          <H3>Açık / koyu mod</H3>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[['light', 'Açık', 'sunny'], ['dark', 'Koyu', 'moon'], ['system', 'Otomatik', 'phone-portrait-outline']].map(([k, l, ic]) => {
              const on = (P.mode || 'system') === k;
              const pv = buildTheme(P.theme, k === 'dark' ? true : k === 'light' ? false : t.dark, P.palette);
              return (
                <Pressable key={k} onPress={() => setThemeMode(k)} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={l}
                  style={{ flex: 1, borderRadius: t.rm, borderWidth: 2, borderColor: on ? t.acc : t.line, padding: 6, gap: 6, backgroundColor: t.card }}>
                  <View style={{ height: 58, borderRadius: t.rs, backgroundColor: pv.bg, padding: 8, gap: 5, overflow: 'hidden' }}>
                    <View style={{ height: 16, borderRadius: 6, backgroundColor: pv.hero }} />
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                      <View style={{ flex: 1, height: 18, borderRadius: 6, backgroundColor: pv.card }} />
                      <View style={{ width: 26, height: 18, borderRadius: 9, backgroundColor: pv.acc }} />
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingBottom: 2 }}>
                    <Ionicons name={ic} size={14} color={on ? t.accT : t.mute} />
                    <Text style={{ fontSize: 12.5, fontWeight: on ? '800' : '600', color: on ? t.accT : t.ink }} numberOfLines={1}>{l}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
  );
}

function PaletteCard() {
  const t = useTheme();
  const { st, update } = useStore();
  const P = st.prefs;
  return (
        <Card>
          <H3>Renk paleti</H3>
          <Mute s={13}>{'Düğmeler, switch\'ler ve vurgular bu renkle görünür. Şu an: ' + THEMES[t.id].name + ' · ' + PALETTES[t.pal].name}</Mute>
          {[['Canlı renkler', PALETTE_IDS.filter((k) => !PALETTES[k].pastel)], ['Açık renkler (pastel)', PALETTE_IDS.filter((k) => PALETTES[k].pastel)]].map(([gl, ids]) => (
            <View key={gl} style={{ gap: 8 }}>
              <Mute s={13} style={{ fontWeight: '700' }}>{gl}</Mute>
              <Row style={{ gap: 8 }}>
                {ids.map((k) => {
                  const c = k === 'tema' ? buildTheme(P.theme, t.dark).acc : (t.dark ? PALETTES[k].dark : PALETTES[k].light);
                  const on = (P.palette || 'tema') === k;
                  const pastel = !!PALETTES[k].pastel;
                  return (
                    <Pressable key={k} onPress={() => update('prefs', (d) => { d.palette = k; })} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={PALETTES[k].name}
                      style={{ alignItems: 'center', gap: 4, width: 62 }}>
                      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c, borderWidth: 3, borderColor: on ? t.ink : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {on ? <Ionicons name="checkmark" size={20} color={pastel ? '#1A1A24' : '#fff'} /> : k === 'tema' ? <Ionicons name="color-palette-outline" size={18} color="#fff" /> : null}
                      </View>
                      <Text style={{ fontSize: 11.5, color: on ? t.ink : t.mute, fontWeight: on ? '800' : '500', textAlign: 'center' }} numberOfLines={1}>{PALETTES[k].name}</Text>
                    </Pressable>
                  );
                })}
              </Row>
            </View>
          ))}
        </Card>
  );
}

export default function Profile() {
  const t = useTheme();
  const { st, update, user, configured, signOut, importData, status, setTheme, setThemeMode } = useStore();
  const { toast, confirm } = useUI();
  const G = useGroups();
  const P = st.prefs;
  const [name, setName] = useState(P.name || '');
  const [imp, setImp] = useState('');
  const [showImp, setShowImp] = useState(false);
  const shown = (user && user.email) || '';
  const display = (P.name || '').trim() || (shown ? shown.split('@')[0] : 'Ben');
  const doImport = () => {
    try {
      const n = importData(JSON.parse(imp));
      toast(n ? n + ' bölüm aktarıldı' : 'Bu metinde planlayıcı verisi bulunamadı');
      if (n) { setImp(''); setShowImp(false); }
    } catch (e) { toast('Metin okunamadı; tamamını kopyaladığından emin ol'); }
  };
  const top = useScrollTop();
  const [sec, setSec] = useState(null);
  const open = (k) => { setSec(k); top(); };
  const back = () => { setSec(null); top(); };
  useEffect(() => {
    if (!sec) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => sub.remove();
  }, [sec]);
  const nHome = HOME_SECTIONS.filter(([k]) => P.home[k] !== false).length;
  const SECTIONS = [
    ['tema', 'Tema ve görünüm', 'color-palette-outline', THEMES[t.id].name + ' · ' + ((P.mode || 'system') === 'dark' ? 'Koyu' : (P.mode || 'system') === 'light' ? 'Açık' : 'Otomatik') + ' · ' + PALETTES[t.pal].name],
    ['ana', 'Ana ekran', 'home-outline', nHome + ' / ' + HOME_SECTIONS.length + ' kart görünüyor'],
    ['bolum', 'Bölümler', 'apps-outline', P.hidden.length ? P.hidden.length + ' bölüm kapalı' : 'Hepsi açık'],
    ['takvim', 'Telefon takvimi', 'calendar-outline', P.calImport || P.calExport ? 'Eşitleme açık' : 'Kapalı'],
    ['bildirim', 'Bildirimler ve zil', 'notifications-outline', 'Hatırlatmalar, pomodoro zili, grup bildirimleri'],
    ['hesap', 'Hesap ve veriler', 'person-circle-outline', shown || 'Eşitleme kapalı'],
  ];
  const head = (k) => {
    const S = SECTIONS.find((x) => x[0] === k);
    return (
      <Row wrap={false}>
        <IconBtn name="arrow-back" label="Ayarlara dön" onPress={back} />
        <Ionicons name={S[2]} size={22} color={t.accT} />
        <T s={20} w="800" style={{ flex: 1 }}>{S[1]}</T>
      </Row>
    );
  };

  if (sec === 'tema') {
    return (
      <View style={{ gap: 16 }}>
        {head('tema')}
        <Mute>Önerilen: Nişan. Her temanın içinde açık/koyu modu ve renk paletini ayrıca seçebilirsin.</Mute>
        <Grid min={200} gap={12}>
          {THEME_IDS.map((id) => <ThemeCard key={id} id={id} on={(P.theme || 'nisan') === id} onPress={() => setTheme(id)} />)}
        </Grid>
        <ModeCard />
        <PaletteCard />
      </View>
    );
  }
  if (sec === 'ana') {
    return (
      <View style={{ gap: 16 }}>
        {head('ana')}
        <Card>
          <Mute>Bugün ekranında hangi kartların görüneceğini seç.</Mute>
          {HOME_SECTIONS.map(([k, l]) => (
            <Check key={k} label={l} value={P.home[k] !== false} onChange={(v) => update('prefs', (d) => { d.home[k] = v; })} />
          ))}
        </Card>
      </View>
    );
  }
  if (sec === 'bolum') {
    return (
      <View style={{ gap: 16 }}>
        {head('bolum')}
        <Card>
          <Mute>Kullanmadığın bölümü kapat (örneğin Yemek takibi); menüden ve ana ekrandan kalkar. Verilerin silinmez, açınca geri gelir.</Mute>
          {TILES.map(([k, l]) => (
            <Check key={k} label={l} value={!P.hidden.includes(k)} onChange={(v) => update('prefs', (d) => { d.hidden = v ? d.hidden.filter((x) => x !== k) : [...d.hidden, k]; })} />
          ))}
        </Card>
      </View>
    );
  }
  if (sec === 'takvim') return <View style={{ gap: 16 }}>{head('takvim')}<CalendarCard /></View>;
  if (sec === 'bildirim') {
    return (
      <View style={{ gap: 16 }}>
        {head('bildirim')}
        <NotifCard />
        <Card>
          <H3>Pomodoro zili</H3>
          <Mute>Süre bitince zil çalar ve telefon titrer. Uygulama kapalıyken de zilli bildirim gelir.</Mute>
          <Row><Btn title="Zili dene" icon="musical-notes-outline" onPress={async () => { await testPomodoro(); toast(nativeNotifications ? '3 saniye içinde zil çalacak' : 'Zil çalıyor'); }} /></Row>
        </Card>
        {nativeNotifications ? (
          <Card>
            <H3>Anlık bildirim (gruplar)</H3>
            <Mute>{G && G.token
              ? 'Kurulu. Öğretmenin ya da ekip liderin görev atadığında ya da grupta birlikte çalışma başladığında anında bildirim gelir.'
              : pushProjectId()
                ? 'Anlık bildirim için izin bekleniyor ya da Firebase anahtarı eksik (README, Anlık bildirim bölümü).'
                : 'Henüz kurulmadı. Kurulana kadar grup bildirimleri uygulama açıkken gelir (README, Anlık bildirim bölümü).'}</Mute>
          </Card>
        ) : null}
      </View>
    );
  }
  if (sec === 'hesap') {
    return (
      <View style={{ gap: 16 }}>
        {head('hesap')}
        <Card>
          <Row style={{ alignItems: 'flex-end' }}>
            <Field label="Görünen adın (gruplarda bu görünür)" value={name} onChangeText={setName} placeholder="Örn. Abbas" />
            <Btn title="Kaydet" onPress={() => { update('prefs', (d) => { d.name = name.trim(); }); toast('Ad kaydedildi'); }} />
          </Row>
        </Card>
        <Card>
          <Btn sm title={showImp ? 'Veri aktarmayı kapat' : 'Eski planlayıcıdan veri aktar'} onPress={() => setShowImp(!showImp)} style={{ alignSelf: 'flex-start' }} />
          {showImp ? (
            <View style={{ gap: 8 }}>
              <Mute>Eski planlayıcı sayfasında "Verilerini dışa aktar" düğmesine bas, kopyalanan metni buraya yapıştır.</Mute>
              <Field value={imp} onChangeText={setImp} multiline placeholder="{ ... }" inputStyle={{ minHeight: 100, textAlignVertical: 'top', paddingTop: 10 }} />
              <Row><Btn sm kind="pri" title="Aktar" onPress={doImport} /></Row>
            </View>
          ) : null}
          {configured && user ? (
            <Btn kind="danger" title="Çıkış yap" onPress={() => confirm('Çıkış yapılsın mı? Verilerin bulutta kalır.', signOut, 'Çıkış yap')} style={{ alignSelf: 'flex-start' }} />
          ) : <Mute>Eşitleme kapalı: veriler yalnızca bu cihazda.</Mute>}
        </Card>
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Card>
        <Row wrap={false} style={{ gap: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.acc, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: t.accI, fontSize: 28, fontWeight: '800' }}>{display.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <T s={24} w="800">{display}</T>
            <Mute>{shown ? shown + (status === 'on' ? ' · eşitlendi' : '') : 'Eşitleme kapalı'}</Mute>
          </View>
        </Row>
      </Card>
      <H2>Ayarlar</H2>
      <Card style={{ paddingVertical: 6, gap: 0 }}>
        {SECTIONS.map(([k, l, ic, sub], i) => (
          <Pressable key={k} onPress={() => open(k)} accessibilityRole="button" accessibilityLabel={l}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i === SECTIONS.length - 1 ? 0 : 1, borderColor: t.line, opacity: pressed ? 0.7 : 1 })}>
            <View style={{ width: 38, height: 38, borderRadius: t.soft ? 13 : 10, backgroundColor: alpha(t.acc, t.dark ? 0.2 : 0.12), alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={ic} size={20} color={t.accT} />
            </View>
            <View style={{ flex: 1 }}>
              <T w="700">{l}</T>
              <Mute s={13} numberOfLines={1}>{sub}</Mute>
            </View>
            <Ionicons name="chevron-forward" size={20} color={t.mute} />
          </Pressable>
        ))}
      </Card>
    </View>
  );
}
