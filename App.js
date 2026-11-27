import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, BackHandler, ActivityIndicator, Platform, Pressable, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/store';
import { useTheme } from './src/theme';
import { UIProvider, useUI, IconBtn, T, Sheet } from './src/ui';
import { alpha, modColor, shadow } from './src/theme';
import { FormsProvider, GoCtx, ScrollCtx, usePomo } from './src/components';
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
import { English, German } from './src/screens/Language';
import Profile from './src/screens/Profile';
import Login from './src/screens/Login';

const ROUTES = {
  '': ['Bugün', Home, 'home-outline'],
  gorevler: ['Görevler', Tasks, 'checkbox-outline'],
  hedef: ['Hedefler', Goals, 'battery-half-outline'],
  ingilizce: ['İngilizce', English, 'language-outline'],
  almanca: ['Almanca', German, 'language-outline'],
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
        <ActivityIndicator size="large" color={t.accT} />
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
  const { st, user, status, setThemeMode } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [route, setRoute] = useState('');
  const [menu, setMenu] = useState(false);
  const scroll = useRef(null);
  const fade = useRef(new Animated.Value(1)).current;
  useCalendarSync();
  const scrollTop = useCallback(() => { if (scroll.current) scroll.current.scrollTo({ y: 0, animated: false }); }, []);
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
  const icon = (k, on) => (on ? ROUTES[k][2].replace('-outline', '') : ROUTES[k][2]);
  const modeBtn = (
    <Pressable onPress={() => setThemeMode(t.dark ? 'light' : 'dark')} accessibilityRole="button" accessibilityLabel={t.dark ? 'Açık moda geç' : 'Koyu moda geç'}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? t.card2 : t.card, ...(shadow(t) || {}) })}>
      <Ionicons name={t.dark ? 'sunny' : 'moon'} size={19} color={t.dark ? t.gold : t.accT} />
    </Pressable>
  );
  const SideItem = ({ k }) => {
    const on = k === route, c = modColor(t, k);
    return (
      <Pressable onPress={() => go(k)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={ROUTES[k][0]}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingHorizontal: 10, borderRadius: t.rs, backgroundColor: on ? alpha(c, t.dark ? 0.2 : 0.12) : pressed ? t.card2 : 'transparent' })}>
        <View style={{ width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c : alpha(c, 0.12) }}>
          <Ionicons name={icon(k, on)} size={17} color={on ? '#fff' : c} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: on ? '800' : '600', color: t.ink }} numberOfLines={1}>{ROUTES[k][0]}</Text>
      </Pressable>
    );
  };
  const TabItem = ({ k, onPress, label, ic, on }) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={label}
      style={({ pressed }) => ({ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 56, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999, backgroundColor: on ? alpha(t.acc, t.dark ? 0.22 : 0.16) : 'transparent' }}>
        <Ionicons name={ic} size={22} color={on ? t.accT : t.mute} />
      </View>
      <Text style={{ fontSize: 11.5, fontWeight: on ? '800' : '600', color: on ? t.accT : t.mute }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
  return (
    <GoCtx.Provider value={go}>
      <ScrollCtx.Provider value={scrollTop}>
      <FormsProvider>
        <Watchers />
        <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: t.bg }}>
          <StatusBar style={t.dark ? 'light' : 'dark'} />
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {wide ? (
              <View style={{ width: 240, backgroundColor: t.card, borderRightWidth: 1, borderColor: t.line, paddingVertical: 18, paddingHorizontal: 12, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingBottom: 16 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.hero, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="navigate" size={18} color={t.gold} style={{ transform: [{ rotate: '45deg' }] }} />
                  </View>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: t.ink }}>Planlayıcı</Text>
                </View>
                {navKeys.map((k) => <SideItem key={k} k={k} />)}
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 6 }}>
                {route ? (
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(modColor(t, route), t.dark ? 0.22 : 0.14) }}>
                      <Ionicons name={icon(route, true)} size={18} color={modColor(t, route)} />
                    </View>
                    <T s={20} w="800" numberOfLines={1} style={{ flex: 1 }}>{title}</T>
                  </View>
                ) : (
                  <Pressable onPress={() => go('profil')} accessibilityRole="button" accessibilityLabel="Ayarlar ve profil"
                    style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.7 : 1 })}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.hero, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.gold }}>
                      <Text style={{ color: t.heroI, fontWeight: '800', fontSize: 17 }}>{display.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={{ flexShrink: 1 }}>
                      <T s={16} w="800" numberOfLines={1}>{display}</T>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dotColor }} />
                        <Text style={{ fontSize: 12, color: t.mute }}>{STATUS[status]}</Text>
                      </View>
                    </View>
                  </Pressable>
                )}
                <MiniTimer route={route} go={go} />
                {route ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor, marginHorizontal: 4 }} accessibilityLabel={STATUS[status]} /> : null}
                {modeBtn}
              </View>
              <ScrollView ref={scroll} style={{ flex: 1 }} keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 16, paddingTop: 6, paddingBottom: wide ? 60 : 110, width: '100%', maxWidth: 1040, alignSelf: 'center' }}>
                <Animated.View style={{ opacity: fade }}>
                  <Screen />
                </Animated.View>
              </ScrollView>
              {!wide ? (
                <View pointerEvents="box-none" style={{ position: 'absolute', left: 12, right: 12, bottom: 10 }}>
                  <View style={{ flexDirection: 'row', backgroundColor: t.card, borderRadius: 24, paddingHorizontal: 4, borderWidth: t.dark ? 1 : 0, borderColor: t.line,
                    ...Platform.select({ web: { boxShadow: t.dark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(15,50,60,0.16)' }, default: { elevation: 10, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } } }) }}>
                    {tabs.map((k) => <TabItem key={k} k={k} label={ROUTES[k][0]} ic={icon(k, k === route)} on={k === route} onPress={() => go(k)} />)}
                    <TabItem k="menu" label="Menü" ic={tabs.includes(route) ? 'grid-outline' : 'grid'} on={!tabs.includes(route)} onPress={() => setMenu(true)} />
                  </View>
                </View>
              ) : null}
            </View>
          </View>
          <Sheet visible={menu} title="Tüm bölümler" onClose={() => setMenu(false)}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
              {navKeys.map((k) => {
                const on = k === route, c = modColor(t, k);
                return (
                  <View key={k} style={{ width: '33.333%', padding: 5 }}>
                    <Pressable onPress={() => go(k)} accessibilityLabel={ROUTES[k][0]} style={({ pressed }) => ({ alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 4, borderRadius: t.rm, borderWidth: on ? 2 : 0, borderColor: c, backgroundColor: pressed ? alpha(c, 0.18) : alpha(c, t.dark ? 0.14 : 0.08) })}>
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={icon(k, true)} size={22} color="#fff" />
                      </View>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: t.ink, textAlign: 'center' }} numberOfLines={1}>{ROUTES[k][0]}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            {hidden.length ? <Text style={{ fontSize: 13, color: t.mute }}>Kapattığın bölümleri Ayarlar → Bölümleri aç / kapat'tan geri açabilirsin.</Text> : null}
          </Sheet>
        </SafeAreaView>
      </FormsProvider>
      </ScrollCtx.Provider>
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
    <Pressable onPress={() => go('calisma')} style={{ backgroundColor: t.acc, borderRadius: 999, paddingHorizontal: 12, minHeight: 34, justifyContent: 'center' }}>
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
