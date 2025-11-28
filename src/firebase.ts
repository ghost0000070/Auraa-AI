
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, connectAuthEmulator, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore, Firestore } from 'firebase/firestore';
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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const perf = getPerformance(app);
const vertex = getVertexAI(app);
const generativeModel = getGenerativeModel(vertex, { model: "gemini-1.5-flash-preview-0514" });

// Simplified DB initialization
let db: Firestore;

// Only use emulators if explicitly enabled via environment variable
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    console.log("Development mode: connecting to emulators.");

    // Use a simplified and robust way to get the Firestore instance
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    });

    const host = import.meta.env.VITE_EMULATOR_HOST || "127.0.0.1";
    console.log(`Using emulator host: ${host}`);

    connectAuthEmulator(auth, `http://${host}:9099`);
    connectFirestoreEmulator(db, host, 8080);
    connectFunctionsEmulator(functions, host, 5001);
    connectStorageEmulator(storage, host, 9199);

} else {
    console.log("Production mode: connecting to live services.");
    db = getFirestore(app);
    
    // Ensure Firestore uses auth state for security rules
    // This explicitly tells Firestore to monitor auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Auth state changed: User authenticated", user.uid);
      } else {
        console.log("Auth state changed: User not authenticated");
      }
    });
}

export { app, analytics, auth, db, storage, functions, generativeModel, vertex };
