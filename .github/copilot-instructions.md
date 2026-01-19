# Copilot Instructions for Helldrafters

## Code Quality Checks

Before committing or suggesting code changes, always run:

```bash
npm run lint
```

This checks for ESLint errors and warnings. The build process treats warnings as errors in CI, so code must pass lint checks with zero warnings.

## Release Notes

When making changes to the codebase, **always update CHANGELOG.md** with a brief description of your changes:

1. Check if today's date (YYYY-MM-DD format) exists as a heading in CHANGELOG.md
2. If the date heading exists, add your changes under it
3. If the date heading doesn't exist, create it as `## YYYY-MM-DD` at the top of the file (after the title)
4. Categorize changes using these headers:
   - `### Added` - New features
   - `### Changed` - Changes to existing functionality
   - `### Deprecated` - Features that will be removed in future versions
   - `### Removed` - Features that have been removed
   - `### Fixed` - Bug fixes
   - `### Security` - Security-related changes

Example:
```markdown
## 2026-01-19

### Added
- New event type for bonus requisition rewards

### Fixed
- Fixed issue where draft cards would sometimes be empty
```

This ensures that release notes are always up-to-date and automatically published with each deployment. Multiple releases on the same day will be grouped under the same date heading.

## Common Issues to Avoid

1. **Unused imports** - Remove any imports that are not used in the file
2. **Unused variables** - Remove or prefix with underscore if intentionally unused
3. **ESLint warnings** - Fix all warnings before committing, as CI treats them as errors

## Testing Commands

- `npm run lint` - Check for linting errors (must pass with 0 warnings)
- `npm test` - Run Jest unit tests
- `npm run build` - Create production build (runs in CI on push to master)

## Deployment

The app automatically deploys to GitHub Pages when pushed to the `master` branch. Ensure all lint checks pass locally before pushing to avoid failed deployments.
