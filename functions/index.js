/**
 * Firebase Cloud Functions for Helldrafters
 * 
 * This module provides scheduled cleanup of stale lobbies in the Firebase Realtime Database.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login to Firebase: firebase login
 * 3. Initialize Firebase in the project root: firebase init functions
 * 4. Deploy functions: firebase deploy --only functions
 * 
 * SECURITY NOTE:
 * The Firebase Admin SDK used here bypasses all security rules, allowing the function
 * to read and delete all lobbies. Frontend clients cannot list lobbies due to the
 * security rules (lobbies/.read is false), but this function can.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

// Initialize Firebase Admin SDK
initializeApp();

// Lobby cleanup threshold in milliseconds (6 hours)
const STALE_LOBBY_THRESHOLD_MS = 6 * 60 * 60 * 1000;

/**
 * Scheduled function to clean up stale lobbies
 * 
 * Runs daily at 3:00 AM UTC.
 * Deletes any lobby where lastUpdatedAt is older than 6 hours.
 * 
 * Note: The Firebase Admin SDK bypasses security rules, allowing this function
 * to read /lobbies even though frontend clients cannot (lobbies/.read is false).
 */
exports.cleanupStaleLobbies = onSchedule(
  {
    schedule: "0 3 * * *", // Run at 3:00 AM UTC daily
    timeZone: "UTC",
    retryCount: 3,
  },
  async (_event) => {
    const db = getDatabase();
    const lobbiesRef = db.ref("lobbies");
    
    try {
      // Get all lobbies (Admin SDK bypasses security rules)
      const snapshot = await lobbiesRef.get();
      
      if (!snapshot.exists()) {
        console.log("No lobbies found in database");
        return;
      }
      
      const lobbies = snapshot.val();
      const now = Date.now();
      const deletePromises = [];
      let deletedCount = 0;
      let skippedCount = 0;
      
      for (const [lobbyId, lobby] of Object.entries(lobbies)) {
        // Check if lobby has lastUpdatedAt timestamp
        const lastUpdatedAt = lobby.lastUpdatedAt;
        
        if (!lastUpdatedAt) {
          // If no timestamp, use createdAt or delete if neither exists
          const createdAt = lobby.createdAt;
          if (!createdAt || (now - createdAt) > STALE_LOBBY_THRESHOLD_MS) {
            console.log(`Deleting lobby ${lobbyId} (no lastUpdatedAt, createdAt: ${createdAt})`);
            deletePromises.push(db.ref(`lobbies/${lobbyId}`).remove());
            deletedCount++;
          } else {
            skippedCount++;
          }
          continue;
        }
        
        // Check if lobby is stale
        const lobbyAge = now - lastUpdatedAt;
        if (lobbyAge > STALE_LOBBY_THRESHOLD_MS) {
          console.log(`Deleting stale lobby ${lobbyId} (age: ${Math.round(lobbyAge / 1000 / 60)} minutes)`);
          deletePromises.push(db.ref(`lobbies/${lobbyId}`).remove());
          deletedCount++;
        } else {
          skippedCount++;
        }
      }
      
      // Wait for all deletions to complete
      await Promise.all(deletePromises);
      
      console.log(`Cleanup complete: deleted ${deletedCount} lobbies, skipped ${skippedCount} active lobbies`);
    } catch (error) {
      console.error("Error during lobby cleanup:", error);
      throw error;
    }
  }
);
