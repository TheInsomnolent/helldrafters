# Lobby Cleanup Deployment Guide

This guide will help you deploy the Firebase Cloud Function that automatically cleans up old lobbies.

## Prerequisites

1. **Firebase CLI**: Install the Firebase CLI globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Ensure you have a Firebase project set up and have admin access

3. **Authentication**: Log in to Firebase CLI
   ```bash
   firebase login
   ```

## Deployment Steps

### Step 1: Initialize Firebase Project (if not already done)

If you haven't already initialized Firebase in your project:

```bash
firebase init
```

Select:
- ✅ Functions: Configure a Cloud Functions directory and files
- ✅ Database: Deploy Firebase Realtime Database Rules
- ✅ Hosting: Configure files for Firebase Hosting

When prompted, use:
- Functions directory: `functions`
- Language: JavaScript
- ESLint: Yes
- Install dependencies: Yes

### Step 2: Deploy Database Rules

The new security rules allow Cloud Functions to list lobbies while preventing client access:

```bash
firebase deploy --only database
```

**Important**: The key change in the rules is:
```json
"lastUpdated": {
  ".write": true
}
```

This allows any authenticated user or unauthenticated connection to update the `lastUpdated` field, which is updated automatically by the client code on all lobby mutations.

### Step 3: Install Function Dependencies

```bash
cd functions
npm install
```

### Step 4: Deploy Cloud Function

```bash
firebase deploy --only functions
```

This deploys the `cleanupOldLobbies` function which runs daily at 3:00 AM UTC.

### Step 5: Verify Deployment

Check that the function is deployed:

```bash
firebase functions:list
```

You should see:
- `cleanupOldLobbies` - Scheduled function (runs daily at 3:00 AM UTC)

## Testing

### Manual Trigger

You can manually trigger the cleanup function for testing:

```bash
firebase functions:call cleanupOldLobbiesManual
```

### View Logs

Check the function logs to see cleanup activity:

```bash
firebase functions:log --only cleanupOldLobbies
```

Or view all function logs:

```bash
firebase functions:log
```

### Test in Console

You can also view and trigger functions from the Firebase Console:
1. Go to https://console.firebase.google.com/
2. Select your project
3. Navigate to "Functions" in the left sidebar
4. Find `cleanupOldLobbies` and view logs/metrics

## How It Works

### Client-Side Changes

All lobby mutation operations now update the `lastUpdated` timestamp:
- Lobby creation
- Player joining
- Status updates
- Config changes
- Game state syncing
- Client actions

### Cloud Function Logic

The `cleanupOldLobbies` function:
1. Runs daily at 3:00 AM UTC
2. Reads all lobbies (admin privilege)
3. Checks each lobby's `lastUpdated` timestamp
4. Deletes lobbies inactive for >6 hours
5. Logs detailed cleanup statistics

### Security Model

- **Clients**: Can only read/write to specific lobby paths with UUID
- **Cloud Functions**: Have admin privileges to read entire `/lobbies` path
- **No Lobby Scanning**: Clients cannot list all lobbies, preventing lobby enumeration attacks

## Monitoring

### Check Cleanup Statistics

After the function runs, check logs for statistics:

```bash
firebase functions:log --only cleanupOldLobbies --limit 5
```

Look for log entries showing:
- Total lobbies found
- Lobbies deleted
- Lobbies kept (still active)
- Reason for deletion (inactive, no_timestamp, etc.)

### Set Up Alerts (Optional)

You can set up Cloud Monitoring alerts for:
- Function execution failures
- High deletion counts (potential issue)
- Function not executing on schedule

## Troubleshooting

### Function Not Running

Check the scheduled trigger:
```bash
firebase functions:list
```

Verify the schedule is "0 3 * * *" (daily at 3:00 AM UTC).

### Permission Errors

Ensure the Firebase Admin SDK has proper permissions:
- Go to Firebase Console > Settings > Service Accounts
- Verify the service account has "Firebase Admin SDK Administrator" role

### Testing Schedule

To test without waiting for 3 AM UTC:
1. Manually call the function: `firebase functions:call cleanupOldLobbiesManual`
2. Or temporarily change the schedule in `functions/index.js` to `"every 5 minutes"` for testing

### Costs

Cloud Functions billing:
- Scheduled functions are triggered once per day
- Function execution is very fast (typically <1 second)
- Cost is minimal (free tier should cover it)

Check your usage: https://console.firebase.google.com/project/_/usage

## Rollback

If you need to rollback:

### Restore Old Rules
Replace [firebase-database-rules.json](firebase-database-rules.json) with the old rules (remove the `lastUpdated` section).

```bash
firebase deploy --only database
```

### Disable Function
```bash
firebase functions:delete cleanupOldLobbies
firebase functions:delete cleanupOldLobbiesManual
```

## Configuration

### Change Cleanup Age Threshold

Edit [functions/index.js](functions/index.js):

```javascript
const SIX_HOURS_MS = 6 * 60 * 60 * 1000; // Change 6 to desired hours
```

### Change Schedule

Edit [functions/index.js](functions/index.js):

```javascript
schedule: "0 3 * * *", // Cron format: minute hour day month weekday
```

Examples:
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * *"` - Midnight UTC
- `"0 0 * * 0"` - Midnight UTC every Sunday

Redeploy after changes:
```bash
firebase deploy --only functions
```

## Next Steps

After deployment:
1. Monitor logs for the first few days
2. Verify lobbies are being cleaned up correctly
3. Adjust the 6-hour threshold if needed
4. Set up monitoring alerts (optional)
