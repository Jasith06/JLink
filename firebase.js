import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9LacuzRJxswEETpZR2B0UUGSFWjIy540",
  authDomain: "jlink-38a3d.firebaseapp.com",
  databaseURL: "https://jlink-38a3d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jlink-38a3d",
  storageBucket: "jlink-38a3d.firebasestorage.app",
  messagingSenderId: "656810229652",
  appId: "1:656810229652:web:557261a441412e27b11981",
  measurementId: "G-QGG4T2YHZW"
};

// Initialize Firebase only once
let app;
let auth;
let db;
let rtdb;

try {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    // Use the existing app
    app = existingApps[0];
  } else {
    // Initialize new app
    app = initializeApp(firebaseConfig);
  }

  // Initialize services
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });

  db = getFirestore(app);
  rtdb = getDatabase(app);

  console.log("Firebase services initialized successfully");

} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { auth, db, rtdb };