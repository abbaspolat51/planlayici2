// Telefon bildirimleri (yalnızca Android/iOS). Web'de hiçbir şey yapmaz.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notifPlan } from './logic';

export const nativeNotifications = Platform.OS !== 'web';
const CHANNEL = 'hatirlatmalar';
const TYPES = Notifications.SchedulableTriggerInputTypes || {};
const DATE = TYPES.DATE || 'date';
const INTERVAL = TYPES.TIME_INTERVAL || 'timeInterval';

export async function setupNotifications() {
  if (!nativeNotifications) return false;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true,
        shouldPlaySound: true, shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Hatırlatmalar',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 200, 250],
        lightColor: '#2950E0',
      });
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

let lastKey = '';
let running = false;
let pending = null;

// Verideki hatırlatmaları telefona kurar (önce eskileri siler). En yakın 60 tanesi.
export async function syncNotifications(st) {
  if (!nativeNotifications) return;
  if (running) { pending = st; return; }
  const plan = notifPlan(st).slice(0, 60);
  const key = JSON.stringify(plan.map((p) => [p.id, p.at, p.title, p.text]));
  if (key === lastKey) return;
  running = true;
  lastKey = key;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const p of plan) {
      await Notifications.scheduleNotificationAsync({
        content: { title: p.title, body: p.text, sound: 'default' },
        trigger: { type: DATE, date: new Date(p.at), channelId: CHANNEL },
      });
    }
  } catch (e) {
    lastKey = '';
  }
  running = false;
  if (pending) { const s = pending; pending = null; syncNotifications(s); }
}

export async function testNotification() {
  if (!nativeNotifications) return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Planlayıcı', body: 'Bildirimler çalışıyor. Hatırlatmaların böyle gelecek.', sound: 'default' },
      trigger: { type: INTERVAL, seconds: 2, channelId: CHANNEL },
    });
    return true;
  } catch (e) {
    return false;
  }
}
