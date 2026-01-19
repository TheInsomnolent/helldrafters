/**
 * Cloud Functions for Helldrafters
 * 
 * This file contains Firebase Cloud Functions for backend operations
 * that cannot be performed by client code due to security rules.
 */

const {onSchedule} = require("firebase-functions/v2/scheduler");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Scheduled function to clean up old lobbies
 * 
 * Runs daily at 3:00 AM UTC and deletes lobbies that haven't been
 * updated in the last 6 hours.
 * 
 * This function has admin privileges and can read the entire /lobbies path,
 * which is necessary to list all lobbies for cleanup.
 * 
 * Schedule syntax: https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules
 */
exports.cleanupOldLobbies = onSchedule({
  schedule: "0 3 * * *", // Daily at 3:00 AM UTC
  timeZone: "UTC",
  retryConfig: {
    retryCount: 2,
    maxRetryDuration: "1h",
  },
}, async (event) => {
  logger.info("Starting lobby cleanup job");

  const db = admin.database();
  const lobbiesRef = db.ref("lobbies");

  try {
    // Get all lobbies - this is only possible with admin privileges
    const snapshot = await lobbiesRef.once("value");

    if (!snapshot.exists()) {
      logger.info("No lobbies found");
      return null;
    }

    const lobbies = snapshot.val();
    const now = Date.now();
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    const cutoffTime = now - SIX_HOURS_MS;

    const lobbiesToDelete = [];
    const lobbiesDeleted = [];
    const lobbiesKept = [];

    // Identify lobbies to delete
    Object.entries(lobbies).forEach(([lobbyId, lobby]) => {
      // If lobby has no lastUpdated field, use createdAt as fallback
      // If neither exists, delete it (corrupted lobby)
      let lastActivity = null;

      if (lobby.lastUpdated) {
        lastActivity = lobby.lastUpdated;
      } else if (lobby.createdAt) {
        lastActivity = lobby.createdAt;
      }

      if (!lastActivity) {
        // No timestamp at all - delete corrupted lobby
        logger.warn(`Lobby ${lobbyId} has no timestamp, marking for deletion`);
        lobbiesToDelete.push({id: lobbyId, reason: "no_timestamp"});
      } else if (lastActivity < cutoffTime) {
        // Lobby is older than 6 hours
        const ageHours = Math.round((now - lastActivity) / (1000 * 60 * 60));
        logger.info(`Lobby ${lobbyId} is ${ageHours} hours old, marking for deletion`);
        lobbiesToDelete.push({id: lobbyId, reason: "inactive", ageHours});
      } else {
        // Lobby is still active
        const ageHours = Math.round((now - lastActivity) / (1000 * 60 * 60));
        lobbiesKept.push({id: lobbyId, ageHours});
      }
    });

    // Delete old lobbies
    if (lobbiesToDelete.length > 0) {
      logger.info(`Deleting ${lobbiesToDelete.length} old lobbies`);

      const deletePromises = lobbiesToDelete.map(async ({id, reason, ageHours}) => {
        try {
          await db.ref(`lobbies/${id}`).remove();
          lobbiesDeleted.push({id, reason, ageHours});
          logger.info(`Deleted lobby ${id} (${reason}${ageHours ? `, ${ageHours}h old` : ""})`);
        } catch (error) {
          logger.error(`Failed to delete lobby ${id}:`, error);
        }
      });

      await Promise.all(deletePromises);
    }

    // Log summary
    logger.info("Lobby cleanup completed", {
      totalLobbies: Object.keys(lobbies).length,
      lobbiesDeleted: lobbiesDeleted.length,
      lobbiesKept: lobbiesKept.length,
      deletedLobbies: lobbiesDeleted,
      activeLobbies: lobbiesKept.length,
    });

    return {
      success: true,
      totalLobbies: Object.keys(lobbies).length,
      lobbiesDeleted: lobbiesDeleted.length,
      lobbiesKept: lobbiesKept.length,
    };
  } catch (error) {
    logger.error("Error during lobby cleanup:", error);
    throw error; // Re-throw to trigger retry
  }
});

/**
 * Manual cleanup trigger (for testing or emergency cleanup)
 * 
 * This function can be called manually from the Firebase console
 * or via HTTP request for testing purposes.
 * 
 * Example: firebase functions:call cleanupOldLobbiesManual
 */
exports.cleanupOldLobbiesManual = onSchedule({
  schedule: "every 24 hours", // This won't actually run on schedule
  timeZone: "UTC",
}, async (event) => {
  logger.info("Manual lobby cleanup triggered");
  // Reuse the same cleanup logic
  return exports.cleanupOldLobbies.run(event);
});
