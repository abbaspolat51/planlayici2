import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';

export const configured =
  !!firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('BURAYA') && !!firebaseConfig.projectId;

let app = null, auth = null, db = null;
if (configured) {
  app = initializeApp(firebaseConfig);
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  }
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
}
export { app, auth, db };
