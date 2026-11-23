import React, { useState } from 'react';
import { View, Text, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useTheme, alpha } from '../theme';
import { T, Mute, H2, H3, Card, Btn, Row, Grid, Empty, IconBtn, ListRow, useUI } from '../ui';
import { useForms } from '../components';
import { fmtD, rid, today } from '../logic';

// Yalnızca telefonda kullanılan modüller (web'de yüklenmez)
const native = Platform.OS !== 'web';
const DocumentPicker = native ? require('expo-document-picker') : null;
const FS = native ? require('expo-file-system/legacy') : null;
const IntentLauncher = Platform.OS === 'android' ? require('expo-intent-launcher') : null;

const size = (b) => (b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round((b || 0) / 1024)) + ' KB');

export default function Library() {
  const t = useTheme();
  const { st, update, dev } = useStore();
  const forms = useForms();
  const { toast, confirm } = useUI();
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(false);
  const L = st.library, f = L.folders.find((x) => x.id === openId);

  if (!f) {
    return (
      <View style={{ gap: 16 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 180 }}><H2>Ders ambarı</H2><Mute>Her dersin kendi klasörü var; PDF'lerini ilgili klasöre ekle.</Mute></View>
          <Btn kind="pri" title="+ Klasör ekle" onPress={() => forms.open('folder')} />
        </Row>
        {L.folders.length ? (
          <Grid min={200} gap={12}>
            {L.folders.map((x) => (
              <Pressable key={x.id} onPress={() => setOpenId(x.id)} style={({ pressed }) => ({ minHeight: 120, padding: 14, borderRadius: t.r, borderWidth: t.bw, borderColor: pressed ? t.acc : t.line, backgroundColor: t.card, justifyContent: 'space-between' })}>
                <View style={{ width: 44, height: 44, borderRadius: t.soft ? 22 : 12, backgroundColor: alpha(t.acc, 0.14), alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="folder-open-outline" size={23} color={t.acc} />
                </View>
                <View><T w="800">{x.name}</T><Mute s={13}>{x.files.length + ' dosya'}</Mute></View>
              </Pressable>
            ))}
          </Grid>
        ) : <Card><Empty text="Henüz klasör yok. “Klasör ekle” ile her dersin için bir klasör aç." /></Card>}
      </View>
    );
  }

  const addPdf = async () => {
    if (!native) return toast('Bilgisayarda PDF yerine bağlantı ekleyebilirsin');
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: true, copyToCacheDirectory: true });
      if (r.canceled || !r.assets || !r.assets.length) return;
      setBusy(true);
      const dir = FS.documentDirectory + 'ambar/';
      await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const added = [];
      for (const a of r.assets) {
        const id = rid(), local = 'ambar/' + id + '.pdf';
        await FS.copyAsync({ from: a.uri, to: FS.documentDirectory + local });
        added.push({ id, kind: 'pdf', name: a.name || 'belge.pdf', size: a.size || 0, d: today(), dev, local });
      }
      update('library', (d) => { const x = d.folders.find((y) => y.id === f.id); if (x) x.files.push(...added); });
      toast(added.length + ' dosya eklendi');
    } catch (e) {
      toast('Dosya eklenemedi');
    }
    setBusy(false);
  };

  const openFile = async (x) => {
    if (x.kind === 'link') { Linking.openURL(x.url).catch(() => toast('Bağlantı açılamadı')); return; }
    if (!native || x.dev !== dev) return toast('Bu PDF başka bir cihazda; orada açabilirsin');
    try {
      const uri = FS.documentDirectory + x.local;
      if (Platform.OS === 'android') {
        const c = await FS.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: c, flags: 1, type: 'application/pdf' });
      } else {
        await Linking.openURL(uri);
      }
    } catch (e) {
      toast('PDF açılamadı; telefonunda bir PDF okuyucu olduğundan emin ol');
    }
  };

  const delFile = (x) => confirm('“' + x.name + '” silinsin mi?', async () => {
    if (x.kind !== 'link' && native && x.dev === dev) { try { await FS.deleteAsync(FS.documentDirectory + x.local, { idempotent: true }); } catch (e) { /* yok say */ } }
    update('library', (d) => { const y = d.folders.find((z) => z.id === f.id); if (y) y.files = y.files.filter((z) => z.id !== x.id); });
  });

  const delFolder = () => confirm(f.files.length ? '“' + f.name + '” klasörü ve içindeki ' + f.files.length + ' dosya silinsin mi?' : '“' + f.name + '” klasörü silinsin mi?', async () => {
    for (const x of f.files) {
      if (x.kind !== 'link' && native && x.dev === dev) { try { await FS.deleteAsync(FS.documentDirectory + x.local, { idempotent: true }); } catch (e) { /* yok say */ } }
    }
    update('library', (d) => { d.folders = d.folders.filter((y) => y.id !== f.id); });
    setOpenId(null);
  });

  const files = f.files.slice().reverse();
  return (
    <View style={{ gap: 16 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 180, gap: 10 }}>
          <Btn sm icon="chevron-back" title="Tüm klasörler" onPress={() => setOpenId(null)} style={{ alignSelf: 'flex-start' }} />
          <H2>{f.name}</H2>
          <Mute>{f.files.length + ' dosya'}</Mute>
        </View>
        <Row>
          <Btn sm title="Yeniden adlandır" onPress={() => forms.open('folder', f)} />
          <Btn sm kind="danger" title="Klasörü sil" onPress={delFolder} />
        </Row>
      </Row>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H3>Dosyalar</H3>
          <Row>
            {native ? <Btn kind="pri" icon="cloud-upload-outline" title={busy ? 'Ekleniyor…' : 'PDF ekle'} disabled={busy} onPress={addPdf} /> : null}
            <Btn icon="link-outline" title="Bağlantı ekle" onPress={() => forms.open('link', { folder: f.id })} />
          </Row>
        </Row>
        <Mute>{native ? 'PDF\'ler bu telefonda saklanır. Bilgisayarda da açmak istediklerini Google Drive bağlantısı olarak ekle.' : 'Bilgisayarda PDF\'leri bağlantı olarak ekleyebilirsin (örn. Google Drive). Telefonda eklenen PDF\'ler telefonda açılır.'}</Mute>
        {files.length ? files.map((x, i) => {
          const here = x.kind === 'link' || (native && x.dev === dev);
          return (
            <ListRow key={x.id} last={i === files.length - 1}>
              <View style={{ width: 40, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(x.kind === 'link' ? t.acc : t.red, 0.15) }}>
                {x.kind === 'link' ? <Ionicons name="link" size={20} color={t.acc} /> : <Text style={{ fontSize: 11, fontWeight: '800', color: t.red }}>PDF</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <T w="700">{x.name}</T>
                <Mute s={13}>{(x.kind === 'link' ? 'Bağlantı' : size(x.size)) + ' · ' + fmtD(x.d) + (here ? '' : ' · başka cihazda')}</Mute>
              </View>
              <Btn sm title="Aç" disabled={!here} onPress={() => openFile(x)} />
              <IconBtn name="trash-outline" label="Sil" onPress={() => delFile(x)} />
            </ListRow>
          );
        }) : <Empty text="Bu klasörde dosya yok." />}
      </Card>
    </View>
  );
}
