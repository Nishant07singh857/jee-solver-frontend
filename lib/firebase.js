// lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Fallback configuration in case environment variables aren't loaded
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBhH9Z1CUSNAM4mVKN0EJZ7v2RSfaVJvUk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ai-powerd-jee-learn.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-powerd-jee-learn",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ai-powerd-jee-learn.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "374670447388",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:374670447388:web:049fc6cb2dca32349660d9",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-EK06052MQE"
};

// Debug log to check configuration
console.log('Firebase Config Loaded:', {
  hasApiKey: !!firebaseConfig.apiKey,
  apiKeyLength: firebaseConfig.apiKey ? firebaseConfig.apiKey.length : 0,
  authDomain: firebaseConfig.authDomain,
  usingFallback: !process.env.NEXT_PUBLIC_FIREBASE_API_KEY
});

// Initialize Firebase only if it hasn't been initialized already
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
} else {
  app = getApps()[0];
  console.log('Using existing Firebase app');
}

export const auth = getAuth(app);
export const db = getFirestore(app);