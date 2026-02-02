# GitHub Pages Deployments

This document explains how the GitHub Pages deployment system works for Helldrafters.

## Deployment Environments

The project supports multiple deployment environments on GitHub Pages:

### 1. Production (Main)
- **Branch**: `main`
- **URL**: https://theinsomnolent.github.io/helldrafters/
- **Trigger**: Automatic on push to `main`
- **Workflow**: `.github/workflows/deploy.yml`

### 2. Development (Develop)
- **Branch**: `develop`
- **URL**: https://theinsomnolent.github.io/helldrafters/develop/
- **Trigger**: Automatic on push to `develop`
- **Workflow**: `.github/workflows/deploy.yml`

### 3. Test Branches (Feature/PR Branches)
- **Branch**: Any branch (manual deployment)
- **URL**: `https://theinsomnolent.github.io/helldrafters/branch-{sanitized-branch-name}/`
- **Trigger**: Manual via GitHub Actions workflow dispatch
- **Workflow**: `.github/workflows/deploy-test.yml`

## Deploying a Test Branch

To deploy a feature branch for testing:

1. Go to **Actions** tab in GitHub
2. Select **"Deploy Test Branch to GitHub Pages"** workflow
3. Click **"Run workflow"**
4. Either:
   - Leave the branch field empty to deploy the default branch
   - Enter a specific branch name to deploy
5. Click **"Run workflow"** button

The workflow will:
- Build the application from your branch
- Deploy it to `branch-{name}` subdirectory
- Comment on any related PR with the deployment URL

## Cleanup Strategy

Test deployments are automatically cleaned up in two scenarios:

### 1. When PRs are Closed/Merged
- **Trigger**: Automatic when a PR is closed
- **Workflow**: `.github/workflows/cleanup-deployments.yml`
- Removes the deployment for that specific branch

### 2. When Main or Develop Deploys
- **Trigger**: Automatic after `main` or `develop` deployment completes
- **Workflow**: Part of `.github/workflows/deploy.yml`
- Removes ALL test branch deployments (branch-*)

### Manual Cleanup
You can also manually clean up deployments:

1. Go to **Actions** tab
2. Select **"Cleanup Test Deployments"** workflow
3. Click **"Run workflow"**
4. Either:
   - Leave empty to clean up all closed PR branches
   - Enter a specific branch name to clean up only that deployment
5. Click **"Run workflow"** button

## HashRouter Compatibility

The application uses React Router's `HashRouter`, which is fully compatible with GitHub Pages subdirectory deployments. The hash-based routing (`#/path`) works seamlessly regardless of the deployment directory because:

1. All routing happens client-side via URL fragments (after the `#`)
2. No server-side routing configuration is needed
3. Direct navigation to any route works correctly

## Branch Name Sanitization

Branch names are sanitized for use in URLs by:
- Converting to lowercase
- Replacing non-alphanumeric characters (except hyphens) with hyphens
- Examples:
  - `feature/new-item` → `branch-feature-new-item`
  - `copilot/add-dev-test-deployments` → `branch-copilot-add-dev-test-deployments`
  - `fix/Bug-123` → `branch-fix-bug-123`

## Permissions

The workflows require the following permissions:
- `contents: write` - To push to the `gh-pages` branch
- `pull-requests: write` - To comment on PRs with deployment URLs (test deployments only)

## Firebase Deployments

Note that Firebase deployments (database and functions) only happen for `main` branch deployments. Test deployments are GitHub Pages only.
