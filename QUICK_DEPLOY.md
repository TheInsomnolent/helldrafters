# 🚀 Quick Deployment Reference

## Automatic Deployment (CI/CD)

**Recommended**: Set up GitHub Actions for automatic deployment on every push to `master`.

See [GITHUB_ACTIONS_FIREBASE_SETUP.md](GITHUB_ACTIONS_FIREBASE_SETUP.md) for setup instructions.

Once configured, every push to master automatically deploys:
- ✅ React app to GitHub Pages
- ✅ Firebase Functions
- ✅ Firebase Database Rules

## Manual Deployment

### Prerequisites
```bash
npm install -g firebase-tools
firebase login
```

## First Time Setup

1. **Update Firebase Project ID**  
   Edit `.firebaserc` and replace `your-project-id-here` with your actual Firebase project ID

2. **Install Function Dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

3. **Deploy Everything**
   ```bash
   firebase deploy --only database,functions
   ```

## Testing

### Manual Test
```bash
firebase functions:call cleanupOldLobbiesManual
```

### View Logs
```bash
firebase functions:log --only cleanupOldLobbies
```

## Monitoring

### List Functions
```bash
firebase functions:list
```

### Recent Activity
```bash
firebase functions:log --limit 10
```

### Web Console
https://console.firebase.google.com/project/_/functions

## Configuration

### Cleanup Age (default: 6 hours)
`functions/index.js` → line ~45
```javascript
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
```

### Schedule (default: 3 AM UTC daily)
`functions/index.js` → line ~37
```javascript
schedule: "0 3 * * *"
```

## Quick Fixes

### Function Not Running?
```bash
firebase functions:list  # Check if deployed
firebase functions:log   # Check for errors
```

### Too Many/Few Deletions?
Adjust `SIX_HOURS_MS` in `functions/index.js`, then:
```bash
firebase deploy --only functions
```

### Emergency: Disable Cleanup
```bash
firebase functions:delete cleanupOldLobbies
```

## Cost
**Expected**: $0.00/month (free tier)  
**Usage**: 1 execution/day × ~1 second

## Support Files
- 📖 [LOBBY_CLEANUP_SUMMARY.md](LOBBY_CLEANUP_SUMMARY.md) - Complete overview
- 📋 [LOBBY_CLEANUP_DEPLOYMENT.md](LOBBY_CLEANUP_DEPLOYMENT.md) - Detailed deployment guide
- 🔧 [FIREBASE_CONFIG.md](FIREBASE_CONFIG.md) - Configuration documentation

---

**That's it!** 🎉 Deploy and forget.
