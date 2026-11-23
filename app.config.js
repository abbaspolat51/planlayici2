// Uygulama ayarları (Expo)
const fs = require('fs');

// Anlık bildirim ayarları (README > Anlık bildirim). Boşsa anlık bildirim kapalı kalır.
let push = {};
try { push = JSON.parse(fs.readFileSync('./push.json', 'utf8')); } catch (e) { push = {}; }
const googleServices = fs.existsSync('./google-services.json') ? './google-services.json' : undefined;

module.exports = {
  expo: {
    name: 'Planlayıcı',
    slug: 'planlayici',
    ...(push.owner ? { owner: push.owner } : {}),
    version: '2.1.0',
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    backgroundColor: '#f4f3ef',
    splash: { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#2950E0' },
    android: {
      package: 'com.planlayici.mobil',
      versionCode: Number(process.env.GITHUB_RUN_NUMBER || 1),
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#2950E0' },
      ...(googleServices ? { googleServicesFile: googleServices } : {}),
      permissions: [
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.SCHEDULE_EXACT_ALARM',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
        'android.permission.READ_CALENDAR',
        'android.permission.WRITE_CALENDAR',
      ],
      softwareKeyboardLayoutMode: 'resize',
    },
    web: { output: 'single', favicon: './assets/favicon.png', name: 'Planlayıcı', backgroundColor: '#f4f3ef' },
    experiments: { baseUrl: process.env.EXPO_BASE_URL || '' },
    extra: push.projectId ? { eas: { projectId: push.projectId } } : {},
    plugins: [
      ['expo-notifications', { color: '#2950E0', sounds: ['./assets/zil.wav'] }],
      ['expo-calendar', { calendarPermission: 'Planlayıcı, görevlerini ve takvim etkinliklerini eşitlemek için takvimine erişir.' }],
    ],
  },
};
