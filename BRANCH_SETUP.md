# Branch Setup and Protection Guide

This guide documents how to set up the `develop` branch and configure branch protection rules for community contributions.

## Overview

**Branch Strategy:**
- **`master`** — Production branch. Auto-deploys to GitHub Pages when updated. Protected.
- **`develop`** — Integration branch for community contributions. All PRs target this branch.

**Deployment Flow:**
```
Contributor fork → PR to develop → Approved & merged → Maintainer merges develop → master → Auto-deploy
```

## Step 1: Create the `develop` Branch

Run these commands locally:

```bash
# Ensure you're on the latest master
git checkout master
git pull origin master

# Create develop branch from master
git checkout -b develop

# Push develop to GitHub
git push -u origin develop
```

## Step 2: Set `develop` as the Default Branch

1. Go to your GitHub repository
2. Click **Settings** → **Branches** (under "Code and automation")
3. Under **Default branch**, click the switch icon (⇄)
4. Select `develop` from the dropdown
5. Click **Update** and confirm

**Why?** New contributors will automatically target `develop` when creating PRs, and the repo will display `develop` as the main branch.

## Step 3: Configure `master` Branch Protection

1. Go to **Settings** → **Branches** → **Add rule**
2. **Branch name pattern:** `master`
3. Enable these rules:

### Required Settings

✅ **Require a pull request before merging**
   - Check this box
   - **Required approvals:** 1
   - ✅ Check "Dismiss stale pull request approvals when new commits are pushed"
   - ✅ Check "Require review from Code Owners" (if you create a CODEOWNERS file)

✅ **Require status checks to pass before merging**
   - Check this box
   - ✅ Check "Require branches to be up to date before merging"
   - Add these required checks (after the first PR runs):
     - `test` (from pr-check.yml workflow)
   
✅ **Require conversation resolution before merging**
   - Check this box

✅ **Do not allow bypassing the above settings**
   - Check this box (enforces rules for admins too)

✅ **Block force pushes**
   - Check this box

✅ **Restrict deletions**
   - Check this box

### Optional Settings (Recommended)

⚠️ **Require linear history**
   - Only enable if you prefer a rebase workflow (clean commit history)
   - Disables merge commits — all PRs must be rebased or squashed
   - **Recommendation:** Leave unchecked initially; enable later if desired

⚠️ **Require signed commits**
   - Requires contributors to sign commits with GPG keys
   - **Recommendation:** Skip unless your project requires this

❌ **Restrict creations/updates**
   - Not needed for typical workflows

4. Click **Create** to save the rule

## Step 4: Configure `develop` Branch Protection

1. Go to **Settings** → **Branches** → **Add rule**
2. **Branch name pattern:** `develop`
3. Enable these rules:

### Required Settings

✅ **Require a pull request before merging**
   - Check this box
   - **Required approvals:** 1
   - ✅ Check "Dismiss stale pull request approvals when new commits are pushed"

✅ **Require status checks to pass before merging**
   - Check this box
   - ✅ Check "Require branches to be up to date before merging"
   - Add these required checks (after the first PR runs):
     - `test` (from pr-check.yml workflow)

✅ **Require conversation resolution before merging**
   - Check this box

✅ **Block force pushes**
   - Check this box

### Settings to Skip for `develop`

❌ **Do not allow bypassing the above settings**
   - Leave unchecked — maintainers need flexibility on `develop`

❌ **Restrict deletions**
   - Leave unchecked — maintainers may need to manage branches

4. Click **Create** to save the rule

## Step 5: Verify Workflows Run on PRs

The [pr-check.yml](.github/workflows/pr-check.yml) workflow will automatically run on all PRs to `develop` and `master`. After the first PR is submitted:

1. Go to **Settings** → **Branches**
2. Edit the `master` and `develop` branch rules
3. Under "Require status checks to pass before merging," search for and add:
   - `test` (the job name from pr-check.yml)

**Note:** GitHub only shows available status checks after they've run at least once. Submit a test PR to `develop` first if needed.

## Step 6: Test the Setup

Create a test PR to verify everything works:

```bash
# On your fork
git checkout develop
git pull upstream develop
git checkout -b test/branch-protection
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "Test branch protection"
git push origin test/branch-protection
```

1. Open a PR on GitHub targeting `develop`
2. Verify the `test` check runs automatically
3. Verify you cannot merge until checks pass and an approval is given
4. Close the PR without merging (or merge and delete TEST.md)

## Step 7: Update Contributors

Once setup is complete:

1. Announce the new contribution workflow (e.g., in README, Discord, etc.)
2. Direct contributors to [CONTRIBUTING.md](CONTRIBUTING.md)
3. Ensure all PRs target `develop` going forward

## Ongoing Maintenance

### Merging `develop` → `master`

When you're ready to deploy changes from `develop`:

```bash
git checkout master
git pull origin master
git merge develop
git push origin master
```

The [deploy.yml](.github/workflows/deploy.yml) workflow will automatically build and deploy to GitHub Pages.

### Keeping `develop` in Sync

Periodically sync `develop` with `master` if hotfixes are made directly to `master`:

```bash
git checkout develop
git merge master
git push origin develop
```

**Best practice:** Avoid committing directly to `master`. Always merge through `develop` → `master`.

## Summary of Branch Protection Rules

| Rule | `master` | `develop` | Reason |
|------|----------|-----------|--------|
| Require PR | ✅ (1 approval) | ✅ (1 approval) | Code review required |
| Require status checks | ✅ | ✅ | Lint, test, build must pass |
| Require up-to-date | ✅ | ✅ | Prevent stale branches |
| Conversation resolution | ✅ | ✅ | Address all review comments |
| Block force pushes | ✅ | ✅ | Protect history |
| Restrict deletions | ✅ | ❌ | Prevent accidental deletion |
| No bypass | ✅ | ❌ | Enforce for everyone vs. maintainer flexibility |
| Require linear history | ⚠️ Optional | ⚠️ Optional | Clean history (strict) |

## Troubleshooting

**Status checks don't appear in branch protection settings:**
- Status checks only appear after they've run at least once
- Submit a test PR to trigger the workflow, then add the checks

**Can't merge even though checks pass:**
- Verify branch is up-to-date with the target branch
- Check if all conversations are resolved
- Ensure required approvals are met

**Workflow doesn't run on PRs:**
- Check [pr-check.yml](.github/workflows/pr-check.yml) syntax
- Verify the `on: pull_request: branches:` configuration is correct
- Check the Actions tab for workflow run history

---

**Questions?** Open an issue or discussion on GitHub.
