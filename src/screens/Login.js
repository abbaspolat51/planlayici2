import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { T, Mute, Card, Btn, Field, Row, useUI } from '../ui';

export default function Login() {
  const t = useTheme();
  const { signIn, signUp, resetPw } = useStore();
  const { toast } = useUI();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [newAcc, setNewAcc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async () => {
    if (!email.trim() || !pw) return setErr('E-posta ve şifreyi yaz.');
    setBusy(true); setErr('');
    const e = newAcc ? await signUp(email, pw) : await signIn(email, pw);
    setBusy(false);
    if (e) setErr(e);
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled">
      <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', gap: 16 }}>
        <View>
          <T s={40} w="800" style={{ letterSpacing: -1 }}>Planlayıcı</T>
          <Mute s={15}>Telefonda ve bilgisayarda aynı hesapla giriş yap; her şey eşitlenir.</Mute>
        </View>
        <Card>
          <T s={18} w="800">{newAcc ? 'Hesap oluştur' : 'Giriş yap'}</T>
          <Field label="E-posta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Şifre" value={pw} onChangeText={setPw} secureTextEntry autoComplete={newAcc ? 'new-password' : 'password'} onSubmitEditing={go} />
          {err ? <T c={t.red} w="700">{err}</T> : null}
          <Btn kind="pri" title={busy ? 'Bekle…' : newAcc ? 'Hesap oluştur' : 'Giriş yap'} disabled={busy} onPress={go} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Btn sm title={newAcc ? 'Zaten hesabım var' : 'Yeni hesap oluştur'} onPress={() => { setNewAcc(!newAcc); setErr(''); }} />
            {!newAcc ? <Btn sm title="Şifremi unuttum" onPress={async () => {
              if (!email.trim()) return setErr('Önce e-posta adresini yaz.');
              const e = await resetPw(email);
              if (e) setErr(e); else toast('Şifre sıfırlama e-postası gönderildi');
            }} /> : null}
          </Row>
        </Card>
      </View>
    </ScrollView>
  );
}
