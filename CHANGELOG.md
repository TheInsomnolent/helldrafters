# Changelog

All notable changes to Helldrafters will be documented in this file.

## 2026-01-19

### Added
- Second "Ready Up" button at the bottom of the warbonds page for improved UX
- Automatic scroll-to-top when navigating between game phases
- Patch notes modal on main menu to display release notes
- Automatic release note generation in CI workflow
- Instructions in copilot-instructions.md for maintaining CHANGELOG.md
- Firebase Cloud Function to automatically clean up inactive lobbies older than 6 hours
- `lastUpdated` timestamp tracking on all lobby operations for cleanup detection
- Scheduled daily lobby cleanup task (runs at 3:00 AM UTC)
- Automated Firebase Functions deployment in CI/CD pipeline alongside GitHub Pages

### Fixed
- Added package-lock.json for Firebase Functions to enable faster CI builds
- CI workflow now auto-generates .firebaserc from FIREBASE_PROJECT_ID variable
- Updated documentation with Google Cloud API prerequisites for first-time deployment
- Upgraded Firebase Functions runtime from Node.js 18 to Node.js 20 (18 was decommissioned)
- Initial release of Helldrafters
- Roguelite draft system for Helldivers 2
- Support for 1-4 players
- Smart drafting system with weighted card pools
- Theater selection (Terminids, Automatons, Illuminate)
- Events system with high-risk, high-reward choices
- Custom start mode for challenge runs
- Multiple game modes (Global Uniqueness, Burn Cards, Brutality Mode, Endless Mode)
- Warbond selection to filter draft pool
- Multiplayer support via Firebase
- Save/load game state functionality
