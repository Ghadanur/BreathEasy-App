
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  // Add other Firebase config properties if needed for other services (Auth, Firestore, Storage)
  // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  // appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const database: Database = getDatabase(app);

export { app, database };
