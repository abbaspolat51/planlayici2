// Telefon bildirimleri, pomodoro zili ve anlık (push) bildirimler.
import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifPlan } from './logic';

export const nativeNotifications = Platform.OS !== 'web';
const CHANNEL = 'hatirlatmalar';
export const POMO_CHANNEL = 'pomodoro-zil';
const TYPES = Notifications.SchedulableTriggerInputTypes || {};
const DATE = TYPES.DATE || 'date';
const INTERVAL = TYPES.TIME_INTERVAL || 'timeInterval';
const MINE = 'pl-'; // bu dosyanın kurduğu hatırlatmalar

// ---------- zil ----------
let player = null;
function getPlayer() {
  if (player) return player;
  try {
    const { createAudioPlayer, setAudioModeAsync } = require('expo-audio');
    try { setAudioModeAsync({ playsInSilentMode: true }); } catch (e) { /* yok say */ }
    player = createAudioPlayer(require('../assets/zil.wav'));
  } catch (e) {
    player = null;
  }
  return player;
}
export function ring() {
  try { Vibration.vibrate([0, 600, 300, 600, 300, 900]); } catch (e) { /* yok say */ }
  const p = getPlayer();
  if (!p) return;
  try { p.seekTo(0); p.play(); } catch (e) { /* yok say */ }
}

export async function setupNotifications() {
  if (!nativeNotifications) return false;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (n) => {
        const kind = n && n.request && n.request.content && n.request.content.data && n.request.content.data.kind;
        // Uygulama açıkken pomodoro zilini uygulama kendisi çalar
        const quiet = kind === 'pomodoro';
        return { shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: !quiet, shouldSetBadge: false };
      },
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Hatırlatmalar',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 200, 250],
        lightColor: '#2950E0',
      });
      await Notifications.setNotificationChannelAsync(POMO_CHANNEL, {
        name: 'Pomodoro zili',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'zil.wav',
        enableVibrate: true,
        vibrationPattern: [0, 600, 300, 600, 300, 900],
        lightColor: '#2950E0',
      });
    }
    // Önceki sürümün adsız kurduğu hatırlatmaları bir kez temizle (çift bildirim olmasın)
    if (!(await AsyncStorage.getItem('pl-notif-v2'))) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem('pl-notif-v2', '1');
    }
  } catch (e) { /* yok say */ }
  return permission(true);
}

export async function permission(ask) {
  if (!nativeNotifications) return false;
  try {
    let s = await Notifications.getPermissionsAsync();
    if (!s.granted && ask && s.canAskAgain !== false) s = await Notifications.requestPermissionsAsync();
    return !!s.granted;
  } catch (e) {
    return false;
  }
}

function contentFor(p) {
  const pomo = p.id === 'pomodoro' || String(p.id).startsWith('gpomo');
  return {
    content: { title: p.title, body: p.text, sound: pomo ? 'zil.wav' : 'default', data: { kind: pomo ? 'pomodoro' : 'hatirlatma' } },
    channelId: pomo ? POMO_CHANNEL : CHANNEL,
  };
}

let lastKey = '';
let running = false;
let pending = null;

// Verideki hatırlatmaları telefona kurar (yalnızca kendi kurduklarını siler). En yakın 60 tanesi.
export async function syncNotifications(st) {
  if (!nativeNotifications) return;
  if (running) { pending = st; return; }
  const plan = notifPlan(st).slice(0, 60);
  const key = JSON.stringify(plan.map((p) => [p.id, p.at, p.title, p.text]));
  if (key === lastKey) return;
  running = true;
  lastKey = key;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if (String(n.identifier).startsWith(MINE)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
    let i = 0;
    for (const p of plan) {
      const c = contentFor(p);
      await Notifications.scheduleNotificationAsync({
        identifier: MINE + i++,
        content: c.content,
        trigger: { type: DATE, date: new Date(p.at), channelId: c.channelId },
      });
    }
  } catch (e) {
    lastKey = '';
  }
  running = false;
  if (pending) { const s = pending; pending = null; syncNotifications(s); }
}

// Tek bir hatırlatmayı belirli bir kimlikle kur / iptal et (grup pomodorosu için)
export async function scheduleOne(id, at, title, text) {
  if (!nativeNotifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    if (!at || at <= Date.now()) return;
    const c = contentFor({ id, title, text });
    await Notifications.scheduleNotificationAsync({ identifier: id, content: c.content, trigger: { type: DATE, date: new Date(at), channelId: c.channelId } });
  } catch (e) { /* yok say */ }
}
export async function cancelOne(id) {
  if (!nativeNotifications) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch (e) { /* yok say */ }
}

export async function notifyNow(title, body) {
  if (!nativeNotifications) return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: { type: INTERVAL, seconds: 1, channelId: CHANNEL },
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function testNotification() {
  return notifyNow('Planlayıcı', 'Bildirimler çalışıyor. Hatırlatmaların böyle gelecek.');
}
export async function testPomodoro() {
  if (!nativeNotifications) { ring(); return true; }
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Pomodoro', body: 'Zil böyle çalacak.', sound: 'zil.wav', data: { kind: 'pomodoro-test' } },
      trigger: { type: INTERVAL, seconds: 3, channelId: POMO_CHANNEL },
    });
    return true;
  } catch (e) {
    return false;
  }
}

// ---------- anlık bildirim (Expo push) ----------
export const pushProjectId = () => {
  const c = Constants && (Constants.expoConfig || Constants.manifest2 || Constants.manifest);
  return (c && c.extra && c.extra.eas && c.extra.eas.projectId) || null;
};
export async function getPushToken() {
  if (!nativeNotifications) return null;
  const projectId = pushProjectId();
  if (!projectId) return null;
  try {
    if (!(await permission(false))) return null;
    const r = await Notifications.getExpoPushTokenAsync({ projectId });
    return (r && r.data) || null;
  } catch (e) {
    return null;
  }
}
// Başka telefonlara anlık bildirim gönder (Expo'nun ücretsiz servisi)
export async function sendPush(tokens, title, body, data) {
  const msgs = [...new Set((tokens || []).filter(Boolean))].map((to) => ({
    to, title, body, data: data || {}, sound: 'default', priority: 'high', channelId: CHANNEL,
  }));
  if (!msgs.length) return false;
  try {
    const r = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(msgs.slice(0, 100)),
    });
    return r.ok;
  } catch (e) {
    return false;
  }
}
