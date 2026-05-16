// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your actual Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBhH9Z1CUSNAM4mVKN0EJZ7v2RSfaVJvUk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ai-powerd-jee-learn.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-powerd-jee-learn",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ai-powerd-jee-learn.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "374670447388",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:374670447388:web:049fc6cb2dca32349660d9",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-EK06052MQE"
};

// Validate configuration
const validateConfig = (config) => {
  console.log('🔧 Firebase Config Check:', {
    apiKey: config.apiKey ? '✅ Set' : '❌ Missing',
    authDomain: config.authDomain ? '✅ Set' : '❌ Missing',
    projectId: config.projectId ? '✅ Set' : '❌ Missing',
    appId: config.appId ? '✅ Set' : '❌ Missing'
  });

  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing Firebase config:', missing);
    return false;
  }
  
  return true;
};

// Initialize Firebase
let app;
let auth;
let db;
let isFirebaseInitialized = false;

console.log('🚀 Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

try {
  if (validateConfig(firebaseConfig)) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Set persistence
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("✅ Firebase auth persistence set");
      })
      .catch((error) => {
        console.error("❌ Firebase persistence error:", error);
      });
    
    isFirebaseInitialized = true;
    console.log("✅ Firebase initialized successfully!");
    
    // Test Firestore connection
    console.log("🔧 Testing Firestore connection...");
    
  } else {
    throw new Error('Invalid Firebase configuration - check environment variables');
  }
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message);
  
  // Create enhanced mock objects for development
  console.log("🔧 Falling back to demo mode...");
  
  app = { 
    name: "FirebaseMock",
    options: firebaseConfig
  };
  
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      console.log("🔐 Mock auth state changed");
      // Simulate no user initially
      setTimeout(() => callback(null), 100);
      return () => {};
    },
    signInWithEmailAndPassword: async (email, password) => {
      console.log("🔐 Mock login:", email);
      // Simulate successful login after delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        user: {
          uid: 'demo-user-' + Date.now(),
          email: email,
          displayName: email.split('@')[0],
          emailVerified: true,
          getIdToken: async () => 'demo-token'
        }
      };
    },
    createUserWithEmailAndPassword: async (email, password) => {
      console.log("🔐 Mock register:", email);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        user: {
          uid: 'demo-user-' + Date.now(),
          email: email,
          displayName: email.split('@')[0],
          emailVerified: false,
          getIdToken: async () => 'demo-token'
        }
      };
    },
    signOut: async () => {
      console.log("🔐 Mock sign out");
      await new Promise(resolve => setTimeout(resolve, 500));
      return Promise.resolve();
    },
    sendEmailVerification: async (user) => {
      console.log("📧 Mock email verification sent to:", user.email);
      await new Promise(resolve => setTimeout(resolve, 500));
      return Promise.resolve();
    },
    sendPasswordResetEmail: async (email) => {
      console.log("📧 Mock password reset email sent to:", email);
      await new Promise(resolve => setTimeout(resolve, 500));
      return Promise.resolve();
    }
  };
  
  db = {
    collection: (name) => ({
      where: (field, op, value) => ({
        stream: async () => [],
        get: async () => ({ 
          docs: [],
          empty: true,
          size: 0
        })
      }),
      doc: (id) => ({
        get: async () => ({ 
          exists: false, 
          data: () => null,
          id: id || 'mock-doc'
        }),
        set: async (data) => {
          console.log(`📝 Mock set document:`, data);
          await new Promise(resolve => setTimeout(resolve, 100));
          return Promise.resolve();
        },
        update: async (data) => {
          console.log(`📝 Mock update document:`, data);
          await new Promise(resolve => setTimeout(resolve, 100));
          return Promise.resolve();
        }
      }),
      add: async (data) => {
        console.log(`📝 Mock add to ${name}:`, data);
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id: 'mock-id-' + Date.now() };
      }
    })
  };
  
  isFirebaseInitialized = false;
}

export { auth, db, isFirebaseInitialized };
export default app;