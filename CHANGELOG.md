# Changelog

All notable changes to Helldrafters will be documented in this file.

## 2026-01-19

### Added
- Firebase Cloud Function for automatic cleanup of stale lobbies (older than 6 hours)
- `lastUpdatedAt` timestamp tracking on all lobby mutations for cleanup eligibility
- Second "Ready Up" button at the bottom of the warbonds page for improved UX
- Automatic scroll-to-top when navigating between game phases
- Patch notes modal on main menu to display release notes
- Automatic release note generation in CI workflow
- Instructions in copilot-instructions.md for maintaining CHANGELOG.md
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
