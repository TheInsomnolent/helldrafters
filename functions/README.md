# Helldrafters Firebase Functions

This directory contains Firebase Cloud Functions for Helldrafters, specifically for cleaning up stale lobbies in the Firebase Realtime Database.

## Functions

### `cleanupStaleLobbies`

A scheduled function that runs daily at 3:00 AM UTC to delete lobbies that haven't been updated in over 6 hours.

**How it works:**
1. Uses Firebase Admin SDK to read all lobbies (bypasses security rules)
2. Checks the `lastUpdatedAt` timestamp on each lobby
3. Deletes lobbies older than 6 hours
4. Falls back to `createdAt` if `lastUpdatedAt` is not present

## Security

The Firebase Admin SDK runs with elevated privileges and bypasses all security rules. This allows the cleanup function to:
- Read the `/lobbies` path (which frontend clients cannot do due to `.read: false`)
- Delete any lobby regardless of ownership

Frontend clients cannot list lobbies because the security rules specify:
```json
{
  "lobbies": {
    ".read": false,
    ".write": false,
    "$lobbyId": {
      ".read": true
      // ...
    }
  }
}
```

This means clients must know the exact lobby ID (UUID) to access it.

## Setup

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Select your Firebase project:
   ```bash
   firebase use <your-project-id>
   ```

4. Install function dependencies:
   ```bash
   cd functions
   npm install
   ```

5. Deploy functions:
   ```bash
   npm run deploy
   # or from project root:
   firebase deploy --only functions
   ```

## Local Development

To test the function locally:

```bash
cd functions
npm run serve
```

This will start the Firebase emulator with the functions loaded.

## Logs

To view function logs:

```bash
npm run logs
# or
firebase functions:log
```

## Manual Cleanup

To manually trigger a cleanup (useful for testing), you can:
1. Use the Firebase Functions shell: `npm run shell`
2. Call the function: `cleanupStaleLobbies()`

Note: Scheduled functions can also be triggered manually from the Firebase Console.
