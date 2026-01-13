# Project Architecture (Post Phase 3)

## Directory Structure

```
src/
├── App.js (1787 lines) - Main React component
├── App.css
├── index.js
├── events.js - Event data definitions
│
├── constants/
│   ├── types.js (36 lines) - RARITY, TYPE, FACTION enums
│   └── gameConfig.js (26 lines) - STARTING_LOADOUT, DIFFICULTY_CONFIG
│
├── data/
│   └── items.js (173 lines) - MASTER_DB item database
│
├── utils/
│   ├── itemHelpers.js (81 lines) - Item lookup & filtering
│   ├── draftHelpers.js (155 lines) - Draft generation logic
│   └── loadoutHelpers.js (94 lines) - Loadout validation
│
└── systems/
    ├── events/
    │   └── eventProcessor.js (274 lines) - Event outcome processing
    └── persistence/
        └── saveManager.js (115 lines) - Save/load game state
```

## Module Dependencies

```
App.js
├── React (UI framework)
├── lucide-react (icons)
├── events.js (event definitions)
├── constants/
│   ├── types.js
│   └── gameConfig.js
├── data/
│   └── items.js
├── utils/
│   ├── itemHelpers.js
│   ├── draftHelpers.js
│   └── loadoutHelpers.js
└── systems/
    ├── events/eventProcessor.js
    └── persistence/saveManager.js

eventProcessor.js
├── events.js (OUTCOME_TYPES)
├── data/items.js (MASTER_DB)
├── constants/types.js (TYPE)
├── constants/gameConfig.js (STARTING_LOADOUT)
└── utils/loadoutHelpers.js (getFirstEmptyStratagemSlot)

saveManager.js
└── (no dependencies - pure I/O)

draftHelpers.js
├── data/items.js (MASTER_DB)
├── constants/types.js (TYPE, FACTION, RARITY)
├── constants/gameConfig.js (DIFFICULTY_CONFIG)
└── utils/itemHelpers.js (getItemsByIds, itemHasTag)

loadoutHelpers.js
├── data/items.js (MASTER_DB)
├── constants/types.js (TYPE, TAGS)
└── utils/itemHelpers.js (getItemById, itemHasTag)

itemHelpers.js
├── data/items.js (MASTER_DB)
└── constants/types.js (TYPE, RARITY, TAGS)
```

## Layer Responsibilities

### UI Layer (App.js)
**Purpose**: React component orchestration and state management
- Component rendering
- React state (useState, useEffect)
- Event handlers
- UI logic
- Delegates business logic to systems

**Lines**: 1787 (down from 2366)

### Systems Layer
**Purpose**: Complex business logic with no UI dependencies

#### events/eventProcessor.js
- Event outcome processing
- All 15 OUTCOME_TYPES
- State updates (pure functions)
- Display formatting

#### persistence/saveManager.js
- Save state creation
- Load state validation
- File I/O operations
- State migration

### Utils Layer
**Purpose**: Pure utility functions

#### itemHelpers.js
- Item database lookups
- Item filtering and searching
- Tag-based queries

#### draftHelpers.js
- Draft hand size calculation
- Weighted pool generation
- Faction weighting
- Burn card mechanics

#### loadoutHelpers.js
- Loadout validation
- AT/Backpack checks
- Stratagem slot management
- Difficulty requirements

### Data Layer
**Purpose**: Static data and configuration

#### data/items.js
- MASTER_DB (all items)
- Item definitions

#### constants/types.js
- RARITY, TYPE, FACTION enums
- TAGS definitions

#### constants/gameConfig.js
- STARTING_LOADOUT
- DIFFICULTY_CONFIG

## Test Coverage

```
Test Suites: 8 (all passing)
Tests: 140 (all passing)

Coverage by Module:
├── constants/types.test.js - 8 tests
├── constants/gameConfig.test.js - 11 tests
├── data/items.test.js - 16 tests
├── utils/itemHelpers.test.js - 23 tests
├── utils/draftHelpers.test.js - 18 tests
├── utils/loadoutHelpers.test.js - 18 tests
├── systems/events/eventProcessor.test.js - 27 tests
└── systems/persistence/saveManager.test.js - 19 tests
```

## Data Flow

### Draft Phase
```
User clicks "Draft" 
  → App.js: startDraftPhase()
  → draftHelpers.generateDraftHand(player, difficulty, faction, burnCards)
    → itemHelpers.getItemsByIds(inventory)
    → draftHelpers.getWeightedPool(type, excludeIds, faction, settings)
  → App.js: setState with draft cards
  → User selects card
  → loadoutHelpers.validateLoadoutForDifficulty(loadout, difficulty)
  → App.js: updatePlayer()
```

### Event Phase
```
Random event triggers
  → events.js: selectRandomEvent(difficulty, faction)
  → App.js: setCurrentEvent()
  → User makes choice
  → eventProcessor.processAllOutcomes(outcomes, choice, state)
    → Returns: { requisition, lives, players, currentDiff, faction, ... }
  → App.js: Apply state updates via setters
```

### Save/Load
```
User clicks "Export"
  → saveManager.exportGameStateToFile(gameState, filename)
    → saveManager.createSaveState(gameState)
    → saveManager.validateSaveState(saveState)
    → Download JSON file

User clicks "Import"
  → User selects file
  → saveManager.parseSaveFile(fileContent)
  → saveManager.validateSaveState(parsed)
  → saveManager.normalizeLoadedState(validated)
  → App.js: Apply loaded state
```

## Key Principles

### 1. Separation of Concerns
- **UI**: App.js handles rendering and React state
- **Business Logic**: systems/ handles game rules
- **Utilities**: utils/ handles calculations
- **Data**: constants/ and data/ provide static information

### 2. Testability
- All business logic is pure functions
- No React dependencies in systems/utils
- Easy to test in isolation
- 140 comprehensive tests

### 3. Maintainability
- Clear module boundaries
- Single responsibility per file
- Easy to locate and modify code
- Self-documenting structure

### 4. Reusability
- Pure functions can be used anywhere
- No tight coupling
- Easy to extend and modify

## Progress Summary

| Metric | Original | Current | Improvement |
|--------|----------|---------|-------------|
| App.js Lines | 2366 | 1787 | -579 (-24.5%) |
| Modules | 1 | 9 | +8 |
| Test Coverage | 0% | High | 140 tests |
| Separation | None | 4 layers | Clear boundaries |

## Next Steps (Phase 4)

Extract large UI sections into components:
- `components/LoadoutDisplay.jsx`
- `components/EventDisplay.jsx`
- `components/DraftDisplay.jsx`

**Target**: Reduce App.js to ~1400 lines (further -350 lines)
