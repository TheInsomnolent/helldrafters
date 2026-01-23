/**
 * Firebase configuration for Helldrafters multiplayer
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use existing)
 * 3. Enable Realtime Database (not Firestore)
 * 4. Copy your config values to a .env file:
 *    REACT_APP_FIREBASE_API_KEY=your-api-key
 *    REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
 *    REACT_APP_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
 *    REACT_APP_FIREBASE_PROJECT_ID=your-project
 *    REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
 *    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
 *    REACT_APP_FIREBASE_APP_ID=your-app-id
 */

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase only if config is present
let app = null;
let database = null;
let analytics = null;

export const initializeFirebase = async () => {
  if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
    console.warn('Firebase config not found. Multiplayer features will be disabled.');
    return false;
  }
  
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    
    // Initialize Analytics if supported (works in browsers, not in Node.js environments)
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized successfully');
    } else {
      console.log('Firebase Analytics not supported in this environment');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return false;
  }
};

export const getFirebaseDatabase = () => {
  if (!database) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return database;
};

export const getFirebaseAnalytics = () => {
  return analytics; // Returns null if not initialized or not supported
};

export const isFirebaseConfigured = () => {
  return !!(firebaseConfig.apiKey && firebaseConfig.databaseURL);
};
