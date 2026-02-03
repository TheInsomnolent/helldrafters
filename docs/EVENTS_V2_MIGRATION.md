# Events V2 System

This document describes the Events V2 system for multiplayer events synchronization.

## Overview

The Events V2 system was designed to address several issues with the original events system in multiplayer mode:

1. **Stale UI state**: Events sometimes displayed outdated state from previous events
2. **Client interference**: Sometimes clients could make selections on behalf of other players
3. **Poor UX flow**: Events requiring target selection had confusing navigation
4. **Flavor text mismatch**: Event descriptions sometimes implied player choice when outcomes were random

## Key Features

### 1. Firebase-Synced UI State
All event UI state is stored in Firebase, ensuring all players see the same state at all times.

### 2. Clear Role Separation
- **Host**: Makes decisions about event outcomes and target players
- **Affected players**: Make specific decisions about how their character is affected

### 3. Improved Navigation
- Step-by-step progression through event resolution
- Backward navigation allowed until event outcome is applied
- Clear preview of outcomes at each step

### 4. Better UX
- Choices explained upfront so players can make informed decisions
- Outcome preview updates as selections are made
- Clear indication of who is making what decision

## Implementation Status

### Completed
- [x] Firebase-synced event UI state (`EventUIState` interface)
- [x] Event state synchronization manager (`eventUISyncManager`)
- [x] Player decision handling
- [x] Firebase security rules for `eventUIState` path
- [x] Client subscription to event state updates
- [x] Automatic state cleanup when events complete

### Events V2 is now the primary events system
- Events V2 is automatically enabled when events are enabled in game settings
- No separate toggle required
- All multiplayer events use Firebase synchronization

## File Structure

### Core Files
- `src/systems/eventsV2/eventUIState.ts` - Event UI state types and helpers
- `src/systems/eventsV2/eventUISyncManager.ts` - Firebase sync operations
- `src/systems/eventsV2/index.ts` - Module exports
- `src/systems/eventsV2/eventUIState.test.ts` - Unit tests

### Modified Files
- `src/App.tsx` - Event state initialization and cleanup
- `firebase-database-rules.json` - Added `eventUIState` rules

## API Reference

### EventUIState
The main state object synced to Firebase:

```typescript
interface EventUIState {
    eventId: string
    event: GameEvent
    currentStep: EventStep
    stepHistory: EventStep[]
    canGoBack: boolean
    selectedPlayerIndex: number | null
    selectedChoice: EventChoice | null
    playerDecisions: PlayerDecision[]
    // ... and more
}
```

### Key Functions

#### Initialization
```typescript
// Host initializes event UI state
await eventsV2.initializeEventUIState(lobbyId, eventId, event, hostPlayerId)
```

#### Subscription (Clients)
```typescript
const unsubscribe = eventsV2.subscribeEventUIState(lobbyId, (state) => {
    // Update local UI with synced state
})
```

#### Host Actions
```typescript
await eventsV2.selectPlayer(lobbyId, state, playerIndex, playerId)
await eventsV2.selectChoice(lobbyId, state, choiceIndex, choice, playerId)
await eventsV2.advanceToNextStep(lobbyId, state, playerId)
await eventsV2.goBackToPreviousStep(lobbyId, state, playerId)
```

#### Player Decisions
```typescript
await eventsV2.submitPlayerDecision(lobbyId, state, decision)
```

#### Cleanup
```typescript
// Host clears event UI state when event completes
await eventsV2.clearEventUIState(lobbyId)
```

## How It Works

1. When events are enabled and a new event is triggered:
   - Host initializes the event UI state in Firebase
   - All clients subscribe to the event state

2. During event resolution:
   - Host makes selections (player choice, event choice, etc.)
   - All updates are synced to Firebase
   - Clients receive updates automatically

3. When event completes:
   - Host clears the event UI state
   - Clients receive the null state and clear their local event
