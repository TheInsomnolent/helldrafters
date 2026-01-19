# Lobby Cleanup Implementation Summary

## Overview

This implementation adds automatic cleanup of inactive Firebase lobbies to prevent database bloat. The solution tracks when lobbies are last updated and uses a Firebase Cloud Function to delete lobbies inactive for more than 6 hours.

## Changes Made

### 1. Client-Side Changes

#### Modified Files:
- [src/systems/multiplayer/lobbyManager.js](src/systems/multiplayer/lobbyManager.js)
- [src/systems/multiplayer/syncManager.js](src/systems/multiplayer/syncManager.js)

#### Changes:
- Added `lastUpdated` timestamp field to lobby creation
- Updated all lobby mutation operations to increment `lastUpdated`:
  - `createLobby()` - Initial lobby creation
  - `joinLobby()` - When players join
  - `updateLobbyStatus()` - Status changes (waiting → in-game → completed)
  - `changePlayerSlot()` - Slot changes
  - `updatePlayerConfig()` - Player config updates
  - `syncGameState()` - Host game state syncs
  - `sendClientAction()` - Client action submissions

### 2. Firebase Cloud Function

#### New Files:
- [functions/index.js](functions/index.js) - Main Cloud Function implementation
- [functions/package.json](functions/package.json) - Function dependencies
- [functions/.eslintrc.js](functions/.eslintrc.js) - ESLint configuration
- [functions/.gitignore](functions/.gitignore) - Git ignore patterns

#### Function Details:
- **Name**: `cleanupOldLobbies`
- **Type**: Scheduled function
- **Schedule**: Daily at 3:00 AM UTC
- **Logic**:
  1. Reads all lobbies (admin privilege required)
  2. Checks each lobby's `lastUpdated` timestamp
  3. Deletes lobbies inactive for >6 hours
  4. Logs detailed cleanup statistics
  5. Handles edge cases (missing timestamps)

### 3. Firebase Security Rules

#### New File:
- [firebase-database-rules.json](firebase-database-rules.json)

#### Key Changes:
```json
"lastUpdated": {
  ".write": true
}
```

This allows any connection (authenticated or not) to update the `lastUpdated` field, which is necessary for client-side automatic updates.

#### Security Model:
- ✅ Clients **cannot** list all lobbies (no read access to `/lobbies`)
- ✅ Clients **can** read specific lobbies by UUID (`/lobbies/{lobbyId}`)
- ✅ Cloud Functions **can** list all lobbies (admin privileges)
- ✅ No lobby enumeration attacks possible from client code

### 4. Configuration Files

#### New Files:
- [firebase.json](firebase.json) - Main Firebase configuration
- [FIREBASE_CONFIG.md](FIREBASE_CONFIG.md) - Configuration documentation
- [LOBBY_CLEANUP_DEPLOYMENT.md](LOBBY_CLEANUP_DEPLOYMENT.md) - Deployment guide
- [GITHUB_ACTIONS_FIREBASE_SETUP.md](GITHUB_ACTIONS_FIREBASE_SETUP.md) - CI/CD setup guide

#### Modified Files:
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) - Added Firebase deployment to CI pipeline

### 5. Documentation

- [CHANGELOG.md](CHANGELOG.md) - Updated with implementation notes

## How It Works

### Timestamp Tracking

Every time a lobby is modified through any of these operations:
- Lobby creation
- Player joining/leaving
- Status updates
- Config changes
- Game state syncs
- Client actions

The `lastUpdated` field is automatically set to the current server timestamp using Firebase's `serverTimestamp()` function.

### Cleanup Process

1. **Daily Execution**: At 3:00 AM UTC, the Cloud Function wakes up
2. **Lobby Scan**: Function reads all lobbies (requires admin access)
3. **Age Calculation**: Compares current time vs `lastUpdated`
4. **Deletion**: Lobbies >6 hours old are removed
5. **Logging**: Detailed statistics logged for monitoring

### Why This Approach Works

1. **No Client Enumeration**: Clients still cannot list lobbies due to security rules
2. **Admin Privileges**: Cloud Functions run with Firebase Admin SDK, bypassing client rules
3. **Automatic Updates**: All existing code paths automatically update `lastUpdated`
4. **Fail-Safe**: Lobbies without timestamps are also cleaned up
5. **Observable**: Detailed logging for monitoring and debugging

## Deployment Required

You have two deployment options:

### Option 1: Automated CI/CD (Recommended)

Set up GitHub Actions to automatically deploy on every push to `master`:

1. **Generate Firebase CI Token**:
   ```bash
   firebase login:ci
   ```

2. **Add GitHub Secrets**:
   - Go to Repository Settings → Secrets and variables → Actions
   - Add `FIREBASE_TOKEN` (from step 1)
   - Add `FIREBASE_PROJECT_ID` (your Firebase project ID)

3. **Push to master**:
   ```bash
   git push origin master
   ```

See [GITHUB_ACTIONS_FIREBASE_SETUP.md](GITHUB_ACTIONS_FIREBASE_SETUP.md) for detailed setup instructions.

### Option 2: Manual Deployment

**⚠️ Manual steps required**:

1. **Deploy Security Rules**:
   ```bash
   firebase deploy --only database
   ```

2. **Install Function Dependencies**:
   ```bash
   cd functions
   npm install
   ```

3. **Deploy Cloud Function**:
   ```bash
   firebase deploy --only functions
   ```

See [LOBBY_CLEANUP_DEPLOYMENT.md](LOBBY_CLEANUP_DEPLOYMENT.md) for complete deployment instructions.

## Testing

### Manual Trigger
```bash
firebase functions:call cleanupOldLobbiesManual
```

### View Logs
```bash
firebase functions:log --only cleanupOldLobbies
```

### Expected Log Output
```
Lobby cleanup completed {
  totalLobbies: 15,
  lobbiesDeleted: 8,
  lobbiesKept: 7,
  deletedLobbies: [...],
  activeLobbies: 7
}
```

## Configuration Options

### Change Cleanup Age

Edit [functions/index.js](functions/index.js):
```javascript
const SIX_HOURS_MS = 6 * 60 * 60 * 1000; // Adjust hours here
```

### Change Schedule

Edit [functions/index.js](functions/index.js):
```javascript
schedule: "0 3 * * *", // Cron syntax
```

Examples:
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * *"` - Daily at midnight UTC
- `"0 0 * * 0"` - Weekly on Sundays

## Benefits

1. **Prevents Database Bloat**: Automatically removes abandoned lobbies
2. **No Client Impact**: Cleanup happens server-side with admin privileges
3. **Maintains Security**: Clients still cannot enumerate lobbies
4. **Observable**: Detailed logging for monitoring
5. **Configurable**: Easy to adjust age threshold and schedule
6. **Reliable**: Scheduled execution with retry logic
7. **Cost-Effective**: Minimal execution time, fits in free tier

## Cost Estimate

Firebase Cloud Functions pricing (as of 2026):
- **Invocations**: 1 per day (well within 2M free tier)
- **Compute Time**: ~1 second per execution (well within 400K GB-seconds)
- **Network**: Minimal (reading/deleting database entries)

**Expected cost**: $0.00/month (covered by free tier)

## Monitoring

### Check Function Status
```bash
firebase functions:list
```

### View Recent Logs
```bash
firebase functions:log --only cleanupOldLobbies --limit 5
```

### Firebase Console
Visit: https://console.firebase.google.com/project/_/functions

## Future Enhancements

Potential improvements:
1. Add metrics export to Cloud Monitoring
2. Set up alerting for cleanup failures
3. Add manual cleanup API endpoint
4. Track average lobby lifetime statistics
5. Implement gradual cleanup (soft delete with grace period)

## Rollback Plan

If issues arise:

1. **Disable function**:
   ```bash
   firebase functions:delete cleanupOldLobbies
   ```

2. **Restore old rules**:
   Remove `lastUpdated` section from security rules and redeploy:
   ```bash
   firebase deploy --only database
   ```

3. **Revert code**:
   Git revert the changes to lobbyManager.js and syncManager.js

## Questions?

For detailed deployment steps, see [LOBBY_CLEANUP_DEPLOYMENT.md](LOBBY_CLEANUP_DEPLOYMENT.md)

For Firebase configuration details, see [FIREBASE_CONFIG.md](FIREBASE_CONFIG.md)
