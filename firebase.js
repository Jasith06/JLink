// firebase.js - UPDATED FOR MOBILE APP
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration - SAME for both Web and Mobile
const firebaseConfig = {
  apiKey: "AIzaSyC9LacuzRJxswEETpZR2B0UUGSFWjIy540",
  authDomain: "jlink-38a3d.firebaseapp.com",
  databaseURL: "https://jlink-38a3d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jlink-38a3d",
  storageBucket: "jlink-38a3d.firebasestorage.app",
  messagingSenderId: "656810229652",
  appId: Platform.select({
    android: "1:656810229652:android:f3ca71b6f8c294b2b11981", // Add Android app ID
    default: "1:656810229652:web:557261a441412e27b11981"
  }),
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
    app = existingApps[0];
    console.log("✅ Using existing Firebase app");
  } else {
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase app initialized");
  }

  // Initialize Auth with AsyncStorage persistence for mobile
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log("✅ Firebase Auth initialized with persistence");
  } catch (authError) {
    // If auth already initialized, get existing instance
    if (authError.code === 'auth/already-initialized') {
      const { getAuth } = require('firebase/auth');
      auth = getAuth(app);
      console.log("✅ Using existing Auth instance");
    } else {
      throw authError;
    }
  }

  // Initialize Firestore
  db = getFirestore(app);
  console.log("✅ Firestore initialized");

  // Initialize Realtime Database
  rtdb = getDatabase(app);
  console.log("✅ Realtime Database initialized");

  console.log("✅ All Firebase services initialized successfully");

} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  console.error("Error code:", error.code);
  console.error("Error message:", error.message);
}

export { auth, db, rtdb, app };
