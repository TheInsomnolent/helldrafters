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
 *    REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX (for analytics)
 *
 * ANALYTICS CONFIGURATION:
 *    REACT_APP_ANALYTICS_ENABLED=true (enable/disable analytics)
 *    REACT_APP_ANALYTICS_DEBUG=true (enable debug mode for localhost testing)
 */

import { initializeApp, getApps } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAnalytics, isSupported, setAnalyticsCollectionEnabled } from 'firebase/analytics'

// ============================================
// ANALYTICS CONFIGURATION
// Set these to control analytics behavior
// ============================================

// Enable/disable analytics entirely (set to false to disable)
const ANALYTICS_ENABLED = process.env.REACT_APP_ANALYTICS_ENABLED !== 'false'

// Enable debug mode for localhost testing (set to true to see events in DebugView)
// To view debug events: Firebase Console > Analytics > DebugView
// You may also need to install the Google Analytics Debugger browser extension
const ANALYTICS_DEBUG_MODE =
    process.env.REACT_APP_ANALYTICS_DEBUG === 'true' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost')

// Log analytics events to console (helpful for development)
const ANALYTICS_CONSOLE_LOGGING = process.env.NODE_ENV === 'development'

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase only if config is present
let app = null
let database = null
let analytics = null
let analyticsInitialized = false

/**
 * Initialize Firebase Analytics only (for single-player users)
 * This can be called independently of multiplayer features
 */
export const initializeAnalytics = async () => {
    if (analyticsInitialized) {
        return analytics !== null
    }

    if (!ANALYTICS_ENABLED) {
        // eslint-disable-next-line no-console
        console.log('Firebase Analytics is disabled via configuration')
        analyticsInitialized = true
        return false
    }

    if (!firebaseConfig.apiKey) {
        console.warn('Firebase API key not found. Analytics will be disabled.')
        analyticsInitialized = true
        return false
    }

    try {
        // Initialize app if not already done
        if (!app) {
            const existingApps = getApps()
            app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig)
        }

        // Check if analytics is supported
        const analyticsSupported = await isSupported()
        if (!analyticsSupported) {
            // eslint-disable-next-line no-console
            console.log('Firebase Analytics not supported in this environment')
            analyticsInitialized = true
            return false
        }

        // Initialize analytics
        analytics = getAnalytics(app)

        // Enable debug mode for localhost if configured
        if (ANALYTICS_DEBUG_MODE) {
            // For Firebase Analytics DebugView to work, you need EITHER:
            // 1. Install "Google Analytics Debugger" Chrome extension and enable it
            // 2. OR we pass debug_mode: true with each event (handled in analytics.js)
            /* eslint-disable no-console */
            console.log('🔍 Firebase Analytics Debug Mode ENABLED')
            console.log('   To see events in DebugView:')
            console.log('   1. Go to Firebase Console > Analytics > DebugView')
            console.log('   2. Select your device/browser from the "Debug devices" dropdown')
            console.log(
                '   3. If no device appears, install "Google Analytics Debugger" Chrome extension',
            )
            console.log('')
            console.log(
                '   ⚠️  Check Network tab for requests to google-analytics.com or analytics.google.com',
            )
            console.log('   ⚠️  Ad blockers will block analytics - disable them for testing')
            /* eslint-enable no-console */
        }

        // Ensure collection is enabled
        setAnalyticsCollectionEnabled(analytics, true)

        analyticsInitialized = true
        /* eslint-disable no-console */
        console.log('✅ Firebase Analytics initialized successfully')
        console.log(
            `   Measurement ID: ${firebaseConfig.measurementId || 'NOT SET - analytics will not work!'}`,
        )
        if (ANALYTICS_CONSOLE_LOGGING) {
            console.log('   Console logging enabled for analytics events')
        }
        /* eslint-enable no-console */

        return true
    } catch (error) {
        console.error('Failed to initialize Firebase Analytics:', error)
        analyticsInitialized = true
        return false
    }
}

/**
 * Initialize Firebase for multiplayer (database + analytics)
 */
export const initializeFirebase = async () => {
    if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
        console.warn('Firebase config not found. Multiplayer features will be disabled.')
        return false
    }

    try {
        // Initialize app if not already done
        if (!app) {
            const existingApps = getApps()
            app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig)
        }

        // Initialize database for multiplayer
        if (!database) {
            database = getDatabase(app)
        }

        // Also initialize analytics if not done yet
        await initializeAnalytics()

        return true
    } catch (error) {
        console.error('Failed to initialize Firebase:', error)
        return false
    }
}

export const getFirebaseDatabase = () => {
    if (!database) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.')
    }
    return database
}

export const getFirebaseAnalytics = () => analytics // Returns null if not initialized or not supported

export const isFirebaseConfigured = () => !!(firebaseConfig.apiKey && firebaseConfig.databaseURL)

export const isAnalyticsConfigured = () => !!(firebaseConfig.apiKey && ANALYTICS_ENABLED)

export const isAnalyticsDebugMode = () => ANALYTICS_DEBUG_MODE

export const isAnalyticsConsoleLogging = () => ANALYTICS_CONSOLE_LOGGING
