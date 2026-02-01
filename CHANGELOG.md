# Changelog

All notable changes to Helldrafters will be documented in this file.

## 2026-02-01

### Added
- Comprehensive draft filtering test suite (16+ tests for warbond/superstore filtering)
- Debug logging infrastructure for draft mechanics (enable via localStorage: `DEBUG_DRAFT_FILTERING`)
- Armor combo validation tests in itemHelpers

### Fixed
- **Critical multiplayer bug**: Late-joining players now properly inherit lobby warbond configuration instead of empty array
- **Critical multiplayer bug**: Catch-up draft count is now deterministic (difficulty - 1) instead of using cumulative draft history
- Draft history now properly resets between games to prevent cumulative catch-up drafts
- Retrospective draft system now uses deterministic difficulty progression (1, 2, 3...) instead of relying on draft history
- **UX improvement**: Removed cards during draft are now permanently added to excluded items list in localStorage, preventing them from appearing in future sessions

## 2026-01-23

### Added
- Redacted Regiment warbond items and images
- Development route `/card-library` for browsing all available items
- Retrospective drafts for late joiners (players joining mid-game can now draft to catch up)
- Game analytics tracking for continuous tuning and improvement
- Exact armor passive descriptions on draft cards
- Armor class and passive name display on drafting screen

### Fixed
- Router navigation issues
- Sacrifice event handling
- Faction color validation (Terminid faction)
- Navigation using Link component instead of anchor tags
- Custom start configuration
- Late-joining and rejoining lobby functionality
- Icon URLs for various weapons and stratagems to use new thumbnail format

## 2026-01-20

### Fixed
- Increased Gen AI transparency disclosure after Reddit feedback

## 2026-01-19

### Added
- Second "Ready Up" button at the bottom of the warbonds page for improved UX
- Automatic scroll-to-top when navigating between game phases
- Patch notes modal on main menu to display release notes
- Automatic release note generation in CI workflow
- Firebase Cloud Function to automatically clean up inactive lobbies older than 6 hours
- `lastUpdated` timestamp tracking on all lobby operations for cleanup detection
- Scheduled daily lobby cleanup task (runs at 3:00 AM UTC)
- Automated Firebase Functions deployment in CI/CD pipeline alongside GitHub Pages
- Stratagem mini-game for player training
- Contributors page and support page
- Savegame support for multiplayer
- Connection status indicators for multiplayer
- Gen AI disclosure button and modal to main menu
- Emergency skip feature for beta testing
- Event selection UI multiplayer sync (eventSelectedChoiceIndex state)
- Bug/feedback reporting buttons to menu and footer
- Open Graph and Twitter Card meta tags for better link sharing
- Draft diversity logic to prevent same-type domination
- Ceremonial Parade event with SET_CEREMONIAL_LOADOUT outcome
- Endurance Mode game option with mission progress tracking
- ExplainerModal component with Help buttons in menu and header
- Accessibility improvements (escape key, ARIA attributes)
- Rarity display to booster draft selection UI

### Fixed
- Package-lock.json for Firebase Functions to enable faster CI builds
- CI workflow now auto-generates .firebaserc from FIREBASE_PROJECT_ID variable
- Updated documentation with Google Cloud API prerequisites for first-time deployment
- Upgraded Firebase Functions runtime from Node.js 18 to Node.js 20 (18 was decommissioned)
- Updated terminology from "roguelite" to "roguelike" across documentation and codebase
- Event handling player loadout checks and player selection logic
- Loose requisition events
- Armor combo access checks by including excluded items
- Remove a Card description in How to Play section
- Fisher-Yates shuffle algorithm for draft order
- CHANGELOG path to use PUBLIC_URL for production builds
- Theme constants usage in footer
- Multiplayer disconnect issues (return to menu, kicked screen, player counts)
- Kicked screen no longer flashes to menu
- Host disconnect now returns to menu properly
- Kicked player loadouts properly hidden
- Cancel onDisconnect when leaving lobby
- Allow rejoining disconnected slots
- Player count calculation when taking over disconnected slot
- Skip disconnected players in draft/events
- Rocket sentry rarity, warbond ID, and image URLs
- Stratagem replacement to allow player choice in multiplayer
- Slot locking now restricted to current player only
- Playtest bugs: armor passives, reroll sync, loadout preview, superstore items, event handling
- Commendation ceremony random booster distribution
- Throwables selection (TYPE.THROWABLE to TYPE.GRENADE)
- Requisition float formatting on victory, gameover, and sacrifice screens
- Armor distribution to add armor to player inventory
- Draft screen difficulty display (removed incorrect +1 increment)
- Maximum star rating changed from 6 to 5

### Removed
- Debug events mode from config
- Show card pool button and display UI
- Cancel run button

## 2026-01-18

### Added
- Randomized draft order for multiplayer
- Icon URLs for all items
- Icons on draft cards and item selection modal
- Custom scrollbar styles
- Warbond name to draft cards
- Ready button moved to top of draft screen
- Join retry handling on conflicts

### Fixed
- Duplicate icon URL mapping for Guard Dog variants
- Parsing error in GameLobby.jsx
- Multiplayer throwable selection flow
- Lobby player overwrite prevention

## 2026-01-17

### Added
- Ko-fi support link moved from header to footer component
- Logo image under title in main menu

### Fixed
- Footer width to match content on all screens
- Footer background made transparent
- Draft card text color (title changed from theme color to white)
- Text color contrast for faction colors
- Armor passive display on draft cards
- Armor passive lookup and error handling
- Missing armor passive descriptions
- Guard passive warnings in dev mode

## 2026-01-16

### Fixed
- Slot locking and drafting rarity issues

## 2026-01-13

### Added
- Win/loss pages
- Samples implementation
- Warbond drafting and armor drafting special rules
- Master database by warbond
- More event outcomes

### Fixed
- Burning card mechanics
- Randomizer event
- REDRAFT event outcome
- RESTRICT_TO_SINGLE_WEAPON and EXTRA_DRAFT outcomes
- Booster drafting
- Teamwork training event
- Events refactoring

## 2026-01-12

### Added
- Initial release of Helldrafters
- Roguelike draft system for Helldivers 2
- Support for 1-4 players
- Smart drafting system with weighted card pools
- Theater selection (Terminids, Automatons, Illuminate)
- Events system with high-risk, high-reward choices
- Custom start mode for challenge runs
- Multiple game modes (Global Uniqueness, Burn Cards, Brutality Mode, Endless Mode)
- Warbond selection to filter draft pool
- Multiplayer support via Firebase
- Save/load game state functionality
- Failure extraction penalties and Brutality Mode
- Lives system removed
