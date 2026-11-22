// Uygulama ayarları (Expo)
module.exports = {
  expo: {
    name: 'Planlayıcı',
    slug: 'planlayici',
    version: '2.0.0',
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    backgroundColor: '#f4f3ef',
    splash: { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#2950E0' },
    android: {
      package: 'com.planlayici.mobil',
      versionCode: Number(process.env.GITHUB_RUN_NUMBER || 1),
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#2950E0' },
      permissions: [
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.SCHEDULE_EXACT_ALARM',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
      ],
      softwareKeyboardLayoutMode: 'resize',
    },
    web: { output: 'single', favicon: './assets/favicon.png', name: 'Planlayıcı', backgroundColor: '#f4f3ef' },
    experiments: { baseUrl: process.env.EXPO_BASE_URL || '' },
    plugins: [['expo-notifications', { color: '#2950E0' }]],
  },
};
