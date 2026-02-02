# Events V2 Migration Guide

This document outlines the steps required to migrate from the original events system to the new Events V2 system.

## Overview

The Events V2 system was designed to address several issues with the original events system in multiplayer mode:

1. **Stale UI state**: Events sometimes displayed outdated state from previous events
2. **Client interference**: Sometimes clients could make selections on behalf of other players
3. **Poor UX flow**: Events requiring target selection had confusing navigation
4. **Flavor text mismatch**: Event descriptions sometimes implied player choice when outcomes were random

## Key Improvements in Events V2

### 1. Firebase-Synced UI State
All event UI state is stored in Firebase, ensuring all players see the same state at all times.

### 2. Clear Role Separation
- **Host**: Makes decisions about event outcomes and target players
- **Affected players**: Make specific decisions about how their character is affected
- **Non-host players**: Can cast visible votes for their preferred outcome

### 3. Improved Navigation
- Step-by-step progression through event resolution
- Backward navigation allowed until event outcome is applied
- Clear preview of outcomes at each step

### 4. Better UX
- Choices explained upfront so players can make informed decisions
- Outcome preview updates as selections are made
- Clear indication of who is making what decision

## Migration Checklist

### Phase 1: Core System (Completed)
- [x] Create `EventUIState` interface for Firebase-synced state
- [x] Implement `eventUISyncManager` for Firebase operations
- [x] Add voting system types and operations
- [x] Add player decision types and operations
- [x] Add settings toggle (`useEventsV2`) in `GameConfig`
- [x] Write tests for new event state management

### Phase 2: UI Components (In Progress)
- [ ] Create `EventDisplayV2` component
  - [ ] Overview step showing event description and outcome preview
  - [ ] Player selection step (for single-target events)
  - [ ] Choice selection step with voting UI
  - [ ] Detailed selection step (stratagems, boosters, etc.)
  - [ ] Player decisions step
  - [ ] Confirmation step with final outcome preview
  - [ ] Applying state with progress indicator
  - [ ] Complete state with summary

### Phase 3: Integration
- [ ] Wire up `EventDisplayV2` to App component
- [ ] Conditionally render V2 vs V1 based on `gameConfig.useEventsV2`
- [ ] Ensure proper Firebase subscription cleanup
- [ ] Test multiplayer sync with multiple clients

### Phase 4: Testing
- [ ] Manual testing of all event types
- [ ] Test backward navigation at each step
- [ ] Test voting system with multiple non-host players
- [ ] Test player-specific decisions
- [ ] Test disconnection/reconnection scenarios
- [ ] Performance testing with slow network

### Phase 5: Deprecation of V1
- [ ] Remove `useEventsV2` toggle (make V2 the default)
- [ ] Remove V1 `EventDisplay` component
- [ ] Remove V1 event state from `GameState`
- [ ] Clean up unused V1 event actions
- [ ] Update all documentation

## File Changes Summary

### New Files (Phase 1)
- `src/systems/eventsV2/eventUIState.ts` - Event UI state types and helpers
- `src/systems/eventsV2/eventUISyncManager.ts` - Firebase sync operations
- `src/systems/eventsV2/index.ts` - Module exports
- `src/systems/eventsV2/eventUIState.test.ts` - Unit tests

### Modified Files (Phase 1)
- `src/types/index.ts` - Added `useEventsV2` to `GameConfig`
- `src/state/gameReducer.ts` - Added default for `useEventsV2`
- `src/components/GameConfiguration.tsx` - Added V2 toggle checkbox
- `src/App.tsx` - Added eventsV2 import and initialization
- `knip.json` - Temporarily ignore eventsV2 during development

### Future Files (Phase 2+)
- `src/components/EventDisplayV2.tsx` - New event UI component
- `src/components/EventDisplayV2.test.tsx` - Component tests

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
    votes: PlayerVote[]
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

#### Player Voting
```typescript
await eventsV2.castVote(lobbyId, state, playerId, playerName, playerSlot, choiceIndex)
await eventsV2.removeVote(lobbyId, state, playerId)
```

#### Player Decisions
```typescript
await eventsV2.submitPlayerDecision(lobbyId, state, decision)
```

## Notes

- The original events system continues to work during the migration period
- Users can opt-in to the new system via the settings toggle
- The toggle is only visible when events are enabled
- The new system is marked as "EXPERIMENTAL" in the UI

## Testing the New System

1. Enable "Events" in game configuration
2. Check the "Use New Events System (V2)" checkbox
3. Start a multiplayer game
4. Collect samples to trigger an event
5. Observe the new event UI flow
