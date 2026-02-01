# Contributing to Helldrafters

Thank you for your interest in contributing to Helldrafters! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

- **Node.js 18+** (recommended: use the version specified in `.github/workflows/`)
- **npm** (comes with Node.js)
- **Git**
- A GitHub account

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork locally:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/helldrafters.git
   cd helldrafters
   ```
3. **Add the upstream remote:**
   ```bash
   git remote add upstream https://github.com/TheInsomnolent/helldrafters.git
   ```
4. **Install dependencies:**
   ```bash
   npm install
   ```
5. **Start the development server:**
   ```bash
   npm start
   ```
   The app will open at [http://localhost:3000](http://localhost:3000)

## Development Workflow

### Branch Strategy

- **`master`** — Production branch. Automatically deploys to GitHub Pages when updated. **Do not submit PRs directly to master.**
- **`develop`** — Integration branch for all contributions. **Submit your PRs here.**

### Making Changes

1. **Sync your fork with upstream:**
   ```bash
   git checkout develop
   git pull upstream develop
   ```

2. **Create a feature branch from `develop`:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
   Use descriptive branch names:
   - `feature/add-new-stratagem-filter`
   - `fix/draft-reroll-bug`
   - `docs/update-setup-instructions`

3. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```
   Write clear commit messages:
   - ✅ `Fix draft reroll not updating card state`
   - ✅ `Add filter for stratagem type in draft display`
   - ❌ `Fix bug`
   - ❌ `Update stuff`

4. **Run tests and linting before pushing:**
   ```bash
   npm run lint    # Must pass with 0 warnings
   npm test        # All tests must pass
   npm run build   # Must build successfully
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub targeting the `develop` branch

## Coding Standards

### React & JavaScript

- **React 19** with functional components and hooks
- **No class components** — use functional components exclusively
- **PropTypes are not required** — TypeScript migration is a future consideration
- Follow existing code style and structure

### Styling

- **Tailwind CSS 4** for all styling
- Avoid inline styles or external CSS files unless absolutely necessary
- Use existing theme colors from `src/constants/theme.js`
- Ensure responsive design (mobile-first approach)

### Linting

- **Zero warnings policy** — `npm run lint` must pass with no warnings
- ESLint configuration is based on `react-app` preset
- Fix all linting errors before submitting a PR

### Testing

- Add tests for new features and bug fixes
- Test files use `.test.js` or `.test.jsx` extension
- Run `npm test` to ensure all tests pass
- Aim for meaningful test coverage (not just 100% for the sake of it)

### File Organization

- **Components:** `src/components/` — React components
- **Constants:** `src/constants/` — Configuration, game data, types
- **State:** `src/state/` — Redux-style reducer logic
- **Systems:** `src/systems/` — Core systems (multiplayer, events, persistence)
- **Utils:** `src/utils/` — Helper functions
- **Data:** `src/data/` — Static game data (warbonds, items)

## Pull Request Guidelines

### Before Submitting

- [ ] Your branch is up to date with `develop`
- [ ] All tests pass (`npm test`)
- [ ] Linting passes with zero warnings (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] You've tested your changes manually in the browser
- [ ] Your commits have clear, descriptive messages

### PR Description

Use the PR template to provide:
- **What** you changed
- **Why** you made the change
- **How** to test the change
- Screenshots/videos for UI changes
- Related issue numbers (e.g., "Fixes #123")

### Review Process

1. Automated checks (lint, test, build) must pass
2. At least one maintainer approval required
3. Address any requested changes
4. Once approved, a maintainer will merge your PR into `develop`

### What to Expect

- PRs are typically reviewed within 2-5 days
- Complex changes may require discussion
- Be open to feedback and iteration
- Maintainers may request changes or suggest alternative approaches

## Reporting Bugs

Found a bug? Please [open an issue](https://github.com/TheInsomnolent/helldrafters/issues/new?template=bug_report.yml) with:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior** vs. **actual behavior**
- **Screenshots/videos** if applicable
- **Environment details:** browser, OS, device
- **Game configuration:** player count, game modes, warbond selection

Use the bug report template to ensure all necessary information is included.

## Suggesting Features

Have an idea? We'd love to hear it! Please [open an issue](https://github.com/TheInsomnolent/helldrafters/issues/new) with:

- **Clear description** of the feature
- **Use case** — why is this valuable?
- **Mockups or examples** if applicable
- **Implementation ideas** (optional)

## Project Structure

### Key Areas

- **Draft System** (`src/utils/draftHelpers.js`) — Card selection, rarity weighting
- **Game State** (`src/state/gameReducer.js`) — Core game logic
- **Events System** (`src/systems/events/`) — High-risk events between missions
- **Multiplayer** (`src/systems/multiplayer/`) — Firebase-based syncing
- **Analytics** (`src/components/analytics/`) — Post-game statistics

### Firebase

This project uses Firebase for:
- Realtime Database (multiplayer lobby sync)
- Cloud Functions (lobby cleanup)

You don't need a Firebase account for local development — multiplayer features will simply be disabled.

## Questions?

- **General questions:** [Open a discussion](https://github.com/TheInsomnolent/helldrafters/discussions)
- **Bug reports:** [Open an issue](https://github.com/TheInsomnolent/helldrafters/issues)
- **Security vulnerabilities:** See [SECURITY.md](SECURITY.md) (if available)

## License

By contributing to Helldrafters, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Helldrafters! Every contribution, no matter how small, helps make the project better for the community. 🎮🚀
