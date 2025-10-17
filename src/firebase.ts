import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBLkkdRnJS4Rvy1SwIZWcLLIfzVbzzV4p4',
  authDomain: 'auraa-main-dev.firebaseapp.com',
  projectId: 'auraa-main-dev',
  storageBucket: 'auraa-main-dev.firebasestorage.app',
  messagingSenderId: '630465774471',
  appId: '1:630465774471:web:ca2d5df3893f8e244b8922',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
