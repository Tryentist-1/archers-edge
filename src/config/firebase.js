import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// Replace these values with your actual Firebase project configuration
// You can find these in your Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDjCqHqMT-3LkKWGFlRx2Mls37vJTN0d7k",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "archers-edge.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "archers-edge",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "archers-edge.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1056447684075",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1056447684075:web:9fdd213f321c50f4758dae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 