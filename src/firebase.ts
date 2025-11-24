
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getPerformance } from 'firebase/performance';
import { getVertexAI, getGenerativeModel } from "@firebase/vertexai-preview";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase App (prevent re-initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const analytics = getAnalytics(app);
const auth = getAuth(app);
let db;
const storage = getStorage(app);
const functions = getFunctions(app);
const perf = getPerformance(app);
const vertex = getVertexAI(app);
const generativeModel = getGenerativeModel(vertex, { model: "gemini-pro" });

// Prevent re-initialization of Firestore in DEV mode with HMR
if (import.meta.env.DEV) {
  const host = window.location.hostname;
  if (host.includes('cloudworkstations.dev')) {
    const baseUrl = host.replace('9000-', '');
    try {
      connectAuthEmulator(auth, `https://9099-${baseUrl}`);
      // Use a global symbol to store the initialized db instance
      if (!(globalThis as any).__firebase_db) {
        (globalThis as any).__firebase_db = initializeFirestore(app, {
          host: `8080-${baseUrl}`,
          ssl: true,
        });
      }
      db = (globalThis as any).__firebase_db;
    } catch (e) {
      console.error("Error connecting to Firebase emulators in Cloud Workstation:", e);
    }
  } else {
    try {
      connectAuthEmulator(auth, "http://127.0.0.1:9099");
      connectFirestoreEmulator(getFirestore(app), "127.0.0.1", 8080);
      connectFunctionsEmulator(functions, "127.0.0.1", 5001);
      connectStorageEmulator(storage, "127.0.0.1", 9199);
      db = getFirestore(app);
    } catch (e) {
        console.error("Error connecting to local Firebase emulators:", e);
    }
  }
} else {
  db = getFirestore(app);
}

// Fallback for db if not initialized in DEV mode for some reason
if (!db) {
  db = getFirestore(app);
}

export { app, analytics, auth, db, storage, functions, generativeModel };
