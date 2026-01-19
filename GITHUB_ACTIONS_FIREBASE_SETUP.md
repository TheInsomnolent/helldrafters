# GitHub Actions CI/CD Setup for Firebase Deployment

This guide explains how to configure GitHub Actions to automatically deploy Firebase Functions and Database Rules when you push to the `master` branch.

## Overview

The CI workflow now performs these steps on every push to `master`:
1. ✅ Build the React app
2. ✅ Deploy to GitHub Pages
3. ✅ Install Firebase Functions dependencies
4. ✅ Deploy Firebase Functions and Database Rules

## Prerequisites (First-Time Setup)

Before setting up CI/CD, you need to enable the required Google Cloud APIs. This prevents rate limiting errors during the first deployment.

**Option A: Manual deployment** (Recommended - Easiest)
```bash
firebase deploy --only functions
```
This automatically enables all required APIs with proper timing.

**Option B: Enable APIs manually**
```bash
# If you have gcloud CLI installed
gcloud services enable cloudfunctions.googleapis.com --project=YOUR_PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=YOUR_PROJECT_ID
gcloud services enable artifactregistry.googleapis.com --project=YOUR_PROJECT_ID
```

**Option C: Enable via Console**
- Go to https://console.cloud.google.com/apis/library?project=YOUR_PROJECT_ID
- Search and enable: Cloud Functions API, Cloud Build API, Artifact Registry API

## Required GitHub Secrets

⚠️ **CRITICAL**: You need to add one secret and one variable to your GitHub repository or the deployment will fail.

### 1. FIREBASE_TOKEN (Secret)

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

### 2. FIREBASE_PROJECT_ID (Variable)

This is your Firebase project ID.

**IMPORTANT**: This is a repository **variable**, not a secret. Variables are used for non-sensitive configuration.

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
3. Click the **Variables** tab (not Secrets)
4. Click **New repository variable**
5. Name: `FIREBASE_PROJECT_ID`
6. Value: Your Firebase project ID (e.g., `helldrafters-12345`)
7. Click **Add variable**

## Verification

### Check Secrets and Variables Are Set

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Under **Secrets** tab, you should see:
   - ✅ `FIREBASE_TOKEN`
3. Under **Variables** tab, you should see:
   - ✅ `FIREBASE_PROJECT_ID`
4. Note: `GITHUB_TOKEN` is automatically provided

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

### Error: "Quota exceeded for quota metric 'Mutate requests'"

**Full Error**: `HTTP Error: 429, Quota exceeded for quota metric 'Mutate requests' and limit 'Mutate requests per minute'`

**Problem**: Firebase is trying to enable multiple Google Cloud APIs at once (Cloud Functions, Cloud Build, Artifact Registry) and hitting rate limits. This typically happens on the first deployment.

**Solution**:

Do a manual deployment first to enable all required APIs:
```bash
firebase deploy --only functions
```

This will enable the APIs one at a time with proper timing. After this succeeds, CI deployments will work without issues.

Alternatively, wait 1 minute and re-run the failed workflow - the APIs may have been partially enabled.

### Error: "Invalid or expired token"

**Problem**: The `FIREBASE_TOKEN` is invalid or has expired.

**Solution**: Regenerate the token:
```bash
firebase login:ci
```
Update the secret in GitHub with the new token.

### Error: "Missing permissions required for functions deploy"

**Full Error**: `Error: Missing permissions required for functions deploy. You must have permission iam.serviceAccounts.ActAs`

**Problem**: The account that generated the `FIREBASE_TOKEN` doesn't have sufficient permissions to deploy Cloud Functions.

**Solution**:

1. **Option A - Add Service Account User Role** (Recommended):
   ```bash
   # Go to IAM admin in Google Cloud Console
   https://console.cloud.google.com/iam-admin/iam?project=YOUR_PROJECT_ID
   ```
   - Find the user that generated the token
   - Click "Edit" (pencil icon)
   - Click "Add Another Role"
   - Add "Service Account User" role
   - Click "Save"
   - Regenerate token: `firebase login:ci`
   - Update GitHub secret with new token

2. **Option B - Use Owner Account**:
   ```bash
   # Logout current user
   firebase logout
   
   # Login with project owner account
   firebase login:ci
   ```
   - Copy the new token
   - Update `FIREBASE_TOKEN` secret in GitHub

3. **Option C - Use Service Account** (Most Secure):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "IAM & Admin" → "Service Accounts"
   - Create a new service account
   - Grant roles: "Firebase Admin", "Service Account User"
   - Generate JSON key
   - Base64 encode the key: `cat key.json | base64`
   - Use this as `FIREBASE_TOKEN` (requires workflow changes)

### Error: "Project not found" or "your-project-id-here"

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
