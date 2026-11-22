import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, BackHandler, ActivityIndicator, Platform, Vibration, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/store';
import { useTheme } from './src/theme';
import { UIProvider, useUI, IconBtn, T } from './src/ui';
import { FormsProvider, GoCtx, usePomo } from './src/components';
import { setupNotifications, syncNotifications } from './src/notifications';
import { notifPlan, tmState, mmss } from './src/logic';
import Home from './src/screens/Home';
import Tasks from './src/screens/Tasks';
import Routines from './src/screens/Routines';
import Calendar from './src/screens/Calendar';
import Food from './src/screens/Food';
import Study from './src/screens/Study';
import Library from './src/screens/Library';
import Money from './src/screens/Money';
import Books from './src/screens/Books';
import Login from './src/screens/Login';

const ROUTES = {
  '': ['Ana sayfa', Home],
  gorevler: ['Görevler', Tasks],
  rutin: ['Rutinler', Routines],
  takvim: ['Takvim', Calendar],
  yemek: ['Yemek takibi', Food],
  calisma: ['Çalışma', Study],
  ambar: ['Ders ambarı', Library],
  para: ['Para takibi', Money],
  kitap: ['Kitaplarım', Books],
};
const STATUS = { local: 'Bu cihazda', wait: 'Bağlanıyor', on: 'Eşitlendi', slow: 'Bağlantı yavaş', err: 'Eşitleme hatası' };

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <UIProvider>
          <Root />
        </UIProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const t = useTheme();
  const { ready, user, configured, st } = useStore();

  useEffect(() => { setupNotifications(); }, []);
  useEffect(() => {
    if (!ready) return undefined;
    const id = setTimeout(() => syncNotifications(st), 800);
    return () => clearTimeout(id);
  }, [st, ready]);

  if (!ready || (configured && user === undefined)) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style={t.dark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={t.acc} />
      </View>
    );
  }
  if (configured && !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar style={t.dark ? 'light' : 'dark'} />
        <Login />
      </SafeAreaView>
    );
  }
  return <Shell />;
}

function Shell() {
  const t = useTheme();
  const { status, mode, setThemeMode } = useStore();
  const [route, setRoute] = useState('');
  const scroll = useRef(null);
  const go = useCallback((r) => {
    setRoute(ROUTES[r] ? r : '');
    if (scroll.current) scroll.current.scrollTo({ y: 0, animated: false });
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route) { go(''); return true; }
      return false;
    });
    return () => sub.remove();
  }, [route, go]);
  const [title, Screen] = ROUTES[route];
  const dotColor = status === 'on' ? t.grn : status === 'err' ? t.red : status === 'slow' ? t.yel : t.mute;
  return (
    <GoCtx.Provider value={go}>
      <FormsProvider>
        <Watchers />
        <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: t.bg }}>
          <StatusBar style={t.dark ? 'light' : 'dark'} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderColor: t.line }}>
            {route ? <IconBtn name="chevron-back" label="Ana sayfaya dön" onPress={() => go('')} /> : <View style={{ width: 6 }} />}
            <T s={19} w="800" numberOfLines={1} style={{ flex: 1 }}>{title}</T>
            <MiniTimer route={route} go={go} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
              <Text style={{ fontSize: 12.5, color: t.mute }}>{STATUS[status]}</Text>
            </View>
            <IconBtn name={t.dark ? 'sunny-outline' : 'moon-outline'} label="Aydınlık / karanlık mod" onPress={() => setThemeMode(t.dark ? 'light' : 'dark')} />
          </View>
          {route ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, borderBottomWidth: 1, borderColor: t.line }} contentContainerStyle={{ gap: 6, paddingHorizontal: 10, paddingVertical: 8 }}>
              {Object.entries(ROUTES).map(([k, [l]]) => (
                <Pressable key={k} onPress={() => go(k)} style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, justifyContent: 'center', backgroundColor: k === route ? t.ink : t.card, borderColor: k === route ? t.ink : t.line }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: k === route ? t.bg : t.ink }}>{l}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <ScrollView ref={scroll} style={{ flex: 1 }} keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, paddingBottom: 60, width: '100%', maxWidth: 1120, alignSelf: 'center' }}>
            <Screen />
          </ScrollView>
        </SafeAreaView>
      </FormsProvider>
    </GoCtx.Provider>
  );
}

// Başka sayfadayken üst çubukta çalışan pomodoro
function MiniTimer({ route, go }) {
  const t = useTheme();
  const { st } = useStore();
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(i); }, []);
  const s = tmState(st.study);
  if (s.idle || route === '' || route === 'calisma') return null;
  return (
    <Pressable onPress={() => go('calisma')} style={{ backgroundColor: t.acc, borderRadius: 999, paddingHorizontal: 12, minHeight: 32, justifyContent: 'center' }}>
      <Text style={{ color: t.accI, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{(s.ph === 'b' ? 'Mola ' : '') + mmss(s.rem) + (s.run ? '' : ' ‖')}</Text>
    </Pressable>
  );
}

// Pomodoro turunu tamamlar; web'de hatırlatmaları ekranda gösterir
function Watchers() {
  const { st, dev } = useStore();
  const { toast } = useUI();
  const pomo = usePomo();
  const ref = useRef(st);
  ref.current = st;
  const pomoRef = useRef(pomo);
  pomoRef.current = pomo;
  const handled = useRef(0);
  const lastChk = useRef(Date.now());
  useEffect(() => {
    const i = setInterval(() => {
      const T0 = ref.current.study.timer;
      if (T0 && T0.run) {
        const rem = T0.end - Date.now();
        if (rem <= 0 && (T0.dev === dev || rem < -4000) && handled.current !== T0.end) {
          handled.current = T0.end;
          pomoRef.current.phaseDone(true);
          try { Vibration.vibrate([0, 400, 200, 400]); } catch (e) { /* yok say */ }
          toast(T0.phase === 'w' ? 'Çalışma bitti, mola zamanı!' : 'Mola bitti, çalışmaya dön!');
        }
      }
      if (Platform.OS === 'web') {
        const now = Date.now();
        const due = notifPlan(ref.current, lastChk.current).filter((o) => o.at <= now && o.id !== 'pomodoro');
        if (due.length) toast('Hatırlatma: ' + due.map((o) => o.title).join(', '));
        lastChk.current = now;
      }
    }, 1000);
    return () => clearInterval(i);
  }, [dev, toast]);
  return null;
}
