# GitHub Actions CI/CD Setup for Firebase Deployment

This guide explains how to configure GitHub Actions to automatically deploy Firebase Functions and Database Rules when you push to the `master` branch.

## Overview

The CI workflow now performs these steps on every push to `master`:
1. ✅ Build the React app
2. ✅ Deploy to GitHub Pages
3. ✅ Install Firebase Functions dependencies
4. ✅ Deploy Firebase Functions and Database Rules

## Required GitHub Secrets

You need to add two secrets to your GitHub repository:

### 1. FIREBASE_TOKEN

This is a CI token that allows GitHub Actions to deploy to Firebase on your behalf.

#### Generate the token:

```bash
firebase login:ci
```

This will:
1. Open a browser for authentication
2. Generate a token after successful login
3. Display the token in your terminal

**Copy this token** - you'll need it for the next step.

#### Add to GitHub:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_TOKEN`
5. Value: Paste the token from the `firebase login:ci` command
6. Click **Add secret**

### 2. FIREBASE_PROJECT_ID

This is your Firebase project ID.

#### Find your project ID:

Option A - From `.firebaserc`:
```bash
cat .firebaserc
```
Look for the value under `"default"`.

Option B - From Firebase Console:
1. Go to https://console.firebase.google.com/
2. Select your project
3. Click the gear icon → **Project settings**
4. Copy the **Project ID** (not the project name)

#### Add to GitHub:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_PROJECT_ID`
5. Value: Your Firebase project ID (e.g., `helldrafters-12345`)
6. Click **Add secret**

## Verification

### Check Secrets Are Set

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see:
   - ✅ `FIREBASE_TOKEN`
   - ✅ `FIREBASE_PROJECT_ID`
   - ✅ `GITHUB_TOKEN` (automatically provided)

### Test the Workflow

1. Make a small change and commit:
   ```bash
   git add .
   git commit -m "test: trigger CI deployment"
   git push origin master
   ```

2. Monitor the deployment:
   - Go to your repository on GitHub
   - Click the **Actions** tab
   - You should see a new workflow run called "Deploy to GitHub Pages and Firebase"
   - Click on it to view detailed logs

### Expected Workflow Steps

You should see these steps in the Actions log:
1. ✅ Checkout repository
2. ✅ Setup Node.js
3. ✅ Install dependencies
4. ✅ Copy CHANGELOG to build
5. ✅ Build application
6. ✅ Deploy to GitHub Pages
7. ✅ Install Firebase Functions dependencies
8. ✅ Deploy to Firebase

## What Gets Deployed to Firebase

The workflow deploys:
- **Database Rules**: `firebase-database-rules.json`
- **Cloud Functions**: Everything in `functions/` directory
  - `cleanupOldLobbies` - Scheduled daily cleanup
  - `cleanupOldLobbiesManual` - Manual trigger function

## Troubleshooting

### Error: "Invalid or expired token"

**Problem**: The `FIREBASE_TOKEN` is invalid or has expired.

**Solution**: Regenerate the token:
```bash
firebase login:ci
```
Update the secret in GitHub with the new token.

### Error: "Project not found"

**Problem**: The `FIREBASE_PROJECT_ID` doesn't match your Firebase project.

**Solution**: 
1. Verify your project ID: `firebase projects:list`
2. Update the secret with the correct project ID
3. Ensure `.firebaserc` has the correct project ID

### Error: "Permission denied"

**Problem**: The Firebase token doesn't have sufficient permissions.

**Solution**:
1. Ensure you're logged in as the project owner or have "Editor" role
2. Regenerate token while logged in as the correct user
3. Update the GitHub secret

### Deployment Succeeds but Functions Not Updated

**Problem**: Functions deployed but not reflecting changes.

**Solution**:
1. Check the Actions log for deployment confirmation
2. View Firebase Functions logs: `firebase functions:log`
3. Verify function version in Firebase Console

### Want to Skip Firebase Deployment

If you need to deploy only to GitHub Pages temporarily:

**Option 1**: Add `[skip firebase]` to your commit message (requires workflow modification)

**Option 2**: Comment out the Firebase deployment steps in `.github/workflows/deploy.yml`:
```yaml
# - name: Install Firebase Functions dependencies
#   run: |
#     cd functions
#     npm ci

# - name: Deploy to Firebase
#   uses: w9jds/firebase-action@master
#   with:
#     args: deploy --only database,functions
#   env:
#     FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
#     PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
```

## Manual Deployment (Fallback)

If CI deployment fails, you can always deploy manually:

```bash
# Deploy everything
firebase deploy

# Or deploy selectively
firebase deploy --only functions
firebase deploy --only database
```

## Security Notes

### Token Safety
- ✅ Never commit `FIREBASE_TOKEN` to your repository
- ✅ GitHub Secrets are encrypted and only exposed during workflow runs
- ✅ Tokens are not visible in workflow logs
- ✅ Revoke old tokens if compromised: `firebase logout` then regenerate

### Token Permissions
The CI token has the same permissions as the account that generated it. Use a service account for production:

1. Go to Firebase Console → Settings → Service Accounts
2. Create a service account with "Firebase Admin" role
3. Generate a private key
4. Use the key for authentication (advanced setup)

## Monitoring

### View Deployment Status
- **GitHub Actions**: Repository → Actions tab
- **Firebase Console**: https://console.firebase.google.com/project/_/functions

### Check Function Logs After Deployment
```bash
firebase functions:log --only cleanupOldLobbies --limit 10
```

### Verify Database Rules
```bash
firebase database:get / --limit 1
```

## Cost Implications

Firebase Cloud Functions deployment via CI:
- **Build time**: ~30-60 seconds added to your CI pipeline
- **Firebase quota**: Uses your project's deployment quota
- **GitHub Actions**: Free for public repositories, 2000 minutes/month for private

**Total additional cost**: $0.00 for typical usage

## Advanced: Conditional Deployment

If you want to deploy Firebase only when function code changes:

```yaml
- name: Check for Firebase changes
  id: firebase_changes
  run: |
    if git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep -E '^(functions/|firebase)'; then
      echo "changed=true" >> $GITHUB_OUTPUT
    else
      echo "changed=false" >> $GITHUB_OUTPUT
    fi

- name: Deploy to Firebase
  if: steps.firebase_changes.outputs.changed == 'true'
  uses: w9jds/firebase-action@master
  # ... rest of the step
```

## Getting Help

- **Firebase CLI Issues**: https://github.com/firebase/firebase-tools/issues
- **GitHub Actions Issues**: https://github.com/w9jds/firebase-action/issues
- **Workflow Syntax**: https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions

## Summary

Once you've added the two GitHub Secrets:
1. ✅ `FIREBASE_TOKEN` (from `firebase login:ci`)
2. ✅ `FIREBASE_PROJECT_ID` (your Firebase project ID)

Every push to `master` will automatically:
- Build and deploy your React app to GitHub Pages
- Deploy Firebase Functions and Database Rules
- No manual deployment needed! 🎉
