
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
// To prevent reinitialization in Next.js Fast Refresh environments, check if already initialized.
// However, user's code directly initializes. For module scope, this is usually fine.
// If issues arise with HMR, can add:
// import { getApps, getApp } from 'firebase/app';
// if (!getApps().length) { app = initializeApp(firebaseConfig); } else { app = getApp(); }
app = initializeApp(firebaseConfig);

const database: Database = getDatabase(app);

export { database, app };
