# Firebase Configuration Files

This directory contains Firebase configuration files for Helldrafters multiplayer features.

## Files

### `firebase-database-rules.json`
Security rules for Firebase Realtime Database. These rules:
- Prevent clients from listing all lobbies (no read access to `/lobbies`)
- Allow clients to read individual lobbies if they know the UUID (`/lobbies/{lobbyId}`)
- Control write permissions based on host/player roles
- Allow Cloud Functions (with admin privileges) to read all lobbies for cleanup

### `firebase.json`
Main Firebase configuration file for deploying rules and functions.

## Security Model

The security model prevents lobby scanning while allowing cleanup:

1. **Client Access**: Clients can only read/write to specific lobby paths if they know the exact UUID
2. **Cloud Function Access**: Firebase Cloud Functions run with admin privileges and can read the entire `/lobbies` path for cleanup operations
3. **lastUpdated Field**: The `lastUpdated` field is writable by anyone who can write to the lobby (host or clients through their allowed paths)

## Deployment

To deploy these rules to Firebase:

```bash
firebase deploy --only database
```

To deploy the cleanup function:

```bash
cd functions
npm install
firebase deploy --only functions
```

## Manual Cleanup

You can manually trigger the cleanup function for testing:

```bash
firebase functions:call cleanupOldLobbiesManual
```

Or view logs:

```bash
firebase functions:log --only cleanupOldLobbies
```
