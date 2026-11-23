import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, BackHandler, ActivityIndicator, Platform, Pressable, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/store';
import { useTheme } from './src/theme';
import { UIProvider, useUI, IconBtn, T, Sheet } from './src/ui';
import { alpha } from './src/theme';
import { FormsProvider, GoCtx, usePomo } from './src/components';
import { GroupsProvider } from './src/groups';
import { setupNotifications, syncNotifications, ring } from './src/notifications';
import { useCalendarSync } from './src/calendar';
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
import Groups from './src/screens/Groups';
import Goals from './src/screens/Goals';
import Profile from './src/screens/Profile';
import Login from './src/screens/Login';

const ROUTES = {
  '': ['Bugün', Home, 'home-outline'],
  gorevler: ['Görevler', Tasks, 'checkbox-outline'],
  hedef: ['Hedefler', Goals, 'battery-half-outline'],
  calisma: ['Çalışma', Study, 'timer-outline'],
  rutin: ['Rutinler', Routines, 'link-outline'],
  takvim: ['Takvim', Calendar, 'calendar-outline'],
  grup: ['Gruplar', Groups, 'people-outline'],
  yemek: ['Yemek takibi', Food, 'nutrition-outline'],
  para: ['Para takibi', Money, 'wallet-outline'],
  kitap: ['Kitaplarım', Books, 'book-outline'],
  ambar: ['Ders ambarı', Library, 'folder-open-outline'],
  profil: ['Ayarlar ve profil', Profile, 'settings-outline'],
};
// Telefonda alt çubukta duran bölümler (gizlenmişse sıradaki gelir)
const TAB_ORDER = ['', 'gorevler', 'hedef', 'calisma', 'rutin', 'takvim', 'grup'];
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
  return (
    <GroupsProvider>
      <Shell />
    </GroupsProvider>
  );
}

function Shell() {
  const t = useTheme();
  const { st, user, status } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [route, setRoute] = useState('');
  const [menu, setMenu] = useState(false);
  const scroll = useRef(null);
  const fade = useRef(new Animated.Value(1)).current;
  useCalendarSync();
  const go = useCallback((r) => {
    setMenu(false);
    setRoute(ROUTES[r] ? r : '');
    if (scroll.current) scroll.current.scrollTo({ y: 0, animated: false });
  }, []);
  useEffect(() => {
    if (!t.soft) { fade.setValue(1); return; }
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [route]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (menu) { setMenu(false); return true; }
      if (route) { go(''); return true; }
      return false;
    });
    return () => sub.remove();
  }, [route, go, menu]);
  const [title, Screen] = ROUTES[route] || ROUTES[''];
  const dotColor = status === 'on' ? t.grn : status === 'err' ? t.red : status === 'slow' ? t.yel : t.mute;
  const hidden = st.prefs.hidden || [];
  const navKeys = Object.keys(ROUTES).filter((k) => !hidden.includes(k));
  const tabs = TAB_ORDER.filter((k) => !hidden.includes(k)).slice(0, 4);
  const display = (st.prefs.name || '').trim() || (user && user.email ? user.email.split('@')[0] : 'Profil');
  const NavItem = ({ k, compact }) => {
    const on = k === route;
    return (
      <Pressable onPress={() => go(k)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={ROUTES[k][0]}
        style={({ pressed }) => (compact
          ? { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 54, opacity: pressed ? 0.6 : 1 }
          : { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 42, paddingHorizontal: 12, borderRadius: t.rs, backgroundColor: on ? alpha(t.acc, 0.13) : pressed ? t.card2 : 'transparent' })}>
        <Ionicons name={on ? ROUTES[k][2].replace('-outline', '') : ROUTES[k][2]} size={compact ? 23 : 20} color={on ? t.acc : t.mute} />
        <Text style={{ fontSize: compact ? 11.5 : 15, fontWeight: on ? '800' : '600', color: on ? t.acc : compact ? t.mute : t.ink }} numberOfLines={1}>{ROUTES[k][0]}</Text>
      </Pressable>
    );
  };
  return (
    <GoCtx.Provider value={go}>
      <FormsProvider>
        <Watchers />
        <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: t.bg }}>
          <StatusBar style={t.dark ? 'light' : 'dark'} />
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {wide ? (
              <View style={{ width: 232, backgroundColor: t.card, borderRightWidth: 1, borderColor: t.line, paddingVertical: 16, paddingHorizontal: 10, gap: 2 }}>
                <Text style={{ fontSize: 19, fontWeight: '800', color: t.ink, paddingHorizontal: 12, paddingBottom: 14 }}>Planlayıcı</Text>
                {navKeys.map((k) => <NavItem key={k} k={k} />)}
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6 }}>
                {route ? (
                  <T s={19} w="800" numberOfLines={1} style={{ flex: 1, paddingLeft: 6 }}>{title}</T>
                ) : (
                  <Pressable onPress={() => go('profil')} accessibilityRole="button" accessibilityLabel="Ayarlar ve profil"
                    style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 4, opacity: pressed ? 0.7 : 1 })}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.acc, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: t.accI, fontWeight: '800', fontSize: 17 }}>{display.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={{ flexShrink: 1 }}>
                      <T s={16} w="800" numberOfLines={1}>{display}</T>
                      <Text style={{ fontSize: 12, color: t.mute }}>Ayarlar ve temalar</Text>
                    </View>
                  </Pressable>
                )}
                <MiniTimer route={route} go={go} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6 }} accessibilityLabel={STATUS[status]}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
                  {width > 380 ? <Text style={{ fontSize: 12.5, color: t.mute }}>{STATUS[status]}</Text> : null}
                </View>
              </View>
              <ScrollView ref={scroll} style={{ flex: 1 }} keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: wide ? 60 : 32, width: '100%', maxWidth: 1040, alignSelf: 'center' }}>
                <Animated.View style={{ opacity: fade }}>
                  <Screen />
                </Animated.View>
              </ScrollView>
              {!wide ? (
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: t.line, backgroundColor: t.card, paddingHorizontal: 4, paddingVertical: 4 }}>
                  {tabs.map((k) => <NavItem key={k} k={k} compact />)}
                  <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="Tüm bölümler"
                    style={({ pressed }) => ({ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 54, opacity: pressed ? 0.6 : 1 })}>
                    <Ionicons name={tabs.includes(route) ? 'grid-outline' : 'grid'} size={22} color={tabs.includes(route) ? t.mute : t.acc} />
                    <Text style={{ fontSize: 11.5, fontWeight: tabs.includes(route) ? '600' : '800', color: tabs.includes(route) ? t.mute : t.acc }}>Menü</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
          <Sheet visible={menu} title="Tüm bölümler" onClose={() => setMenu(false)}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
              {navKeys.map((k) => {
                const on = k === route;
                return (
                  <View key={k} style={{ width: '33.333%', padding: 4 }}>
                    <Pressable onPress={() => go(k)} style={({ pressed }) => ({ alignItems: 'center', gap: 6, paddingVertical: 16, paddingHorizontal: 4, borderRadius: t.rm, borderWidth: on ? 2 : 1, borderColor: on ? t.acc : t.line, backgroundColor: pressed ? t.card2 : t.card })}>
                      <Ionicons name={ROUTES[k][2]} size={24} color={on ? t.acc : t.ink} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: on ? t.acc : t.ink, textAlign: 'center' }} numberOfLines={1}>{ROUTES[k][0]}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            {hidden.length ? <Text style={{ fontSize: 13, color: t.mute }}>Kapattığın bölümleri Ayarlar → Bölümleri aç / kapat'tan geri açabilirsin.</Text> : null}
          </Sheet>
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

// Pomodoro turunu tamamlar (zil + titreşim); web'de hatırlatmaları ekranda gösterir
function Watchers() {
  const { st, dev } = useStore();
  const { toast } = useUI();
  const pomo = usePomo();
  const ref = useRef(st);
  ref.current = st;
  const pomoRef = useRef(pomo);
  pomoRef.current = pomo;
  const handled = useRef(0);
  const rung = useRef(0);
  const lastChk = useRef(Date.now());
  useEffect(() => {
    const i = setInterval(() => {
      const T0 = ref.current.study.timer;
      if (T0 && T0.run) {
        const rem = T0.end - Date.now();
        if (rem <= 0 && rung.current !== T0.end) {
          // Zil her açık cihazda bir kez çalar
          rung.current = T0.end;
          if (rem > -60000) ring();
        }
        // Turu başlatan cihaz ilerletir; o kapalıysa 4 sn sonra herhangi biri
        if (rem <= 0 && handled.current !== T0.end && (T0.dev === dev || rem < -4000)) {
          handled.current = T0.end;
          pomoRef.current.phaseDone(true);
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
