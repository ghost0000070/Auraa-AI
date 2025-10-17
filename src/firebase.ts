import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "auraa-main-dev",
  appId: "1:630465774471:web:ca2d5df3893f8e244b8922",
  storageBucket: "auraa-main-dev.firebasestorage.app",
  apiKey: "AIzaSyBLkkdRnJS4Rvy1SwIZWcLLIfzVbzzV4p4",
  authDomain: "auraa-main-dev.firebaseapp.com",
  messagingSenderId: "630465774471",
  projectNumber: "630465774471",
  version: "2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
