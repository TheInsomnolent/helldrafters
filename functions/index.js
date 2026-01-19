/**
 * Cloud Functions for Helldrafters
 * 
 * This file contains Firebase Cloud Functions for backend operations
 * that cannot be performed by client code due to security rules.
 */

const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");

// Define secrets
const kofiVerificationToken = defineSecret("KOFI_VERIFICATION_TOKEN");

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
 * NOTE: This function only affects the /lobbies path. Other data paths
 * like /contributors are NOT affected by this cleanup process.
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
 * HTTP function to handle Ko-Fi webhooks
 * 
 * Receives webhook notifications when users subscribe to Ko-Fi tiers.
 * Only stores minimal data: username and subscription count.
 * 
 * Expected tier names from Ko-Fi:
 * - "Space Cadet"
 * - "Skull Admiral"
 * 
 * Verification token must be set as a secret: KOFI_VERIFICATION_TOKEN
 * 
 * Set this with: firebase functions:secrets:set KOFI_VERIFICATION_TOKEN
 * Then enter your verification token when prompted.
 */
exports.kofiWebhook = onRequest({
  cors: true,
  region: "us-central1",
  secrets: [kofiVerificationToken],
}, async (req, res) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    logger.warn("Invalid request method:", req.method);
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // Ko-Fi sends data as form-encoded with a 'data' field containing JSON
    const rawData = req.body.data;
    
    if (!rawData) {
      logger.warn("No data field in request body");
      res.status(400).send("Bad Request: Missing data field");
      return;
    }

    // Parse the JSON data
    let webhookData;
    try {
      webhookData = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
    } catch (parseError) {
      logger.error("Failed to parse webhook data:", parseError);
      res.status(400).send("Bad Request: Invalid JSON");
      return;
    }

    logger.info("Received Ko-Fi webhook", {
      type: webhookData.type,
      from: webhookData.from_name,
      amount: webhookData.amount,
      isFirstPayment: webhookData.is_first_subscription_payment,
    });

    // Verify the token to prevent spoofing
    const expectedToken = kofiVerificationToken.value();
    if (!expectedToken) {
      logger.error("KOFI_VERIFICATION_TOKEN not configured");
      res.status(500).send("Server configuration error");
      return;
    }

    if (webhookData.verification_token !== expectedToken) {
      logger.warn("Invalid verification token");
      res.status(401).send("Unauthorized: Invalid verification token");
      return;
    }

    // Only process subscription payments
    if (webhookData.type !== "Subscription" || !webhookData.is_subscription_payment) {
      logger.info("Ignoring non-subscription payment");
      res.status(200).send("OK: Not a subscription");
      return;
    }

    // Get tier from tier_name field (Ko-Fi provides this directly)
    // Valid tiers: "Space Cadet" or "Skull Admiral"
    let tier = webhookData.tier_name || "Unknown";
    
    // Normalize tier name if needed (in case Ko-Fi sends it differently)
    if (tier && tier !== "Unknown") {
      // Tier names should match exactly: "Space Cadet" or "Skull Admiral"
      // If Ko-Fi sends something else, keep it as-is
      logger.info("Subscriber tier:", tier);
    } else {
      // First subscription payment sometimes has null tier_name
      // Log this case but still process the subscription
      logger.warn("No tier_name provided in webhook data");
    }

    const db = admin.database();
    const contributorsRef = db.ref("contributors");
    
    // Create a safe key from the email (use hash to avoid storing email directly)
    const crypto = require("crypto");
    const emailHash = crypto.createHash("sha256").update(webhookData.email.toLowerCase()).digest("hex");
    const contributorRef = contributorsRef.child(emailHash);

    // Get existing data
    const snapshot = await contributorRef.once("value");
    const existingData = snapshot.val();

    let monthsSubscribed = 1;
    let firstSubscriptionDate = Date.now();

    if (existingData) {
      // Existing subscriber - increment month count
      monthsSubscribed = (existingData.monthsSubscribed || 1) + 1;
      firstSubscriptionDate = existingData.firstSubscriptionDate || Date.now();
    }

    // Store minimal data: only display name, tier, and subscription count
    await contributorRef.set({
      displayName: webhookData.from_name,
      tier: tier,
      monthsSubscribed: monthsSubscribed,
      lastPaymentDate: Date.now(),
      firstSubscriptionDate: firstSubscriptionDate,
      isPublic: webhookData.is_public !== false, // Default to true if not specified
    });

    logger.info("Successfully processed Ko-Fi subscription", {
      displayName: webhookData.from_name,
      tier: tier,
      monthsSubscribed: monthsSubscribed,
    });

    res.status(200).send("OK");
  } catch (error) {
    logger.error("Error processing Ko-Fi webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});
