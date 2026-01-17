# Copilot Instructions for Helldrafters

## Code Quality Checks

Before committing or suggesting code changes, always run:

```bash
npm run lint
```

This checks for ESLint errors and warnings. The build process treats warnings as errors in CI, so code must pass lint checks with zero warnings.

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
