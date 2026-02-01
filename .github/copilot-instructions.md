# GitHub Copilot Instructions for Helldrafters

## Package Manager

**Always use `yarn` instead of `npm`** for this project.

| Instead of | Use |
|------------|-----|
| `npm install` | `yarn` or `yarn install` |
| `npm ci` | `yarn --frozen-lockfile` |
| `npm run <script>` | `yarn <script>` |
| `npm test` | `yarn test` |
| `npm start` | `yarn start` |
| `npm run build` | `yarn build` |

## Code Style

This project uses ESLint and Prettier with the following preferences:

- **4 space indentation** (not 2 spaces, not tabs)
- **No semicolons** at end of statements
- **Single quotes** for JavaScript strings
- **Double quotes** for JSX attributes
- **Arrow functions** preferred over function declarations
- **Trailing commas** in multi-line arrays/objects

## Console Logging

- `console.warn()`, `console.error()`, and `console.debug()` are allowed
- `console.log()` requires an eslint-disable comment:
  ```javascript
  // eslint-disable-next-line no-console
  console.log('Debug message')
  ```

## React Patterns

- Use **functional components** with hooks (no class components)
- Prefer **arrow function components**: `const Component = () => { ... }`
- Use **self-closing tags** for components without children: `<Component />`
- Avoid unnecessary curly braces in JSX: `name="value"` not `name={"value"}`

## Project Structure

- `src/components/` - React components
- `src/constants/` - Game configuration and constants
- `src/data/` - Item database and warbond data
- `src/state/` - Redux-like state management
- `src/systems/` - Game systems (events, multiplayer, persistence)
- `src/utils/` - Utility functions and helpers
- `functions/` - Firebase Cloud Functions (uses separate ESLint config with Google style)

## Testing

Run tests with `yarn test`. Tests use React Testing Library and Jest.

## Before Committing

Pre-commit hooks automatically run Prettier and ESLint on staged files. If needed manually:

```bash
yarn style      # Check formatting and linting
yarn style:fix  # Auto-fix issues
```
