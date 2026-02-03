/**
 * Events V2 - Redesigned events system with native multiplayer support
 *
 * This module provides a complete events system redesign that addresses
 * the issues with the original system:
 *
 * Key improvements:
 * - All UI state synced via Firebase for consistent multiplayer experience
 * - Clear separation of host decisions vs player-specific decisions
 * - Backward navigation until event is completed
 * - Better UX with upfront outcome explanation
 *
 * The eventsV2 system is now the primary events mechanism and is automatically
 * enabled when events are enabled in the game configuration.
 */

// Event UI State types and helpers
export {
    type EventUIState,
    type EventStep,
    type PlayerVote,
    type PlayerDecision,
    type EventDraftState,
    createInitialEventUIState,
    choiceRequiresPlayerDecision,
    choiceRequiresDetailedSelection,
    choiceRequiresBoosterSelection,
    getNextStep,
    canNavigateBack,
    getPreviousStep,
    generateOutcomePreview,
} from './eventUIState'

// Event UI Sync Manager
export {
    initializeEventUIState,
    subscribeEventUIState,
    updateEventUIState,
    clearEventUIState,
    advanceToNextStep,
    goBackToPreviousStep,
    selectPlayer,
    selectChoice,
    setSourcePlayer,
    setStratagemSelection,
    setTargetPlayer,
    setTargetStratagemSelection,
    setBoosterSelection,
    setBoosterDraft,
    setPendingFaction,
    setSubfactionSelection,
    submitPlayerDecision,
    setWaitingForPlayers,
    completeEvent,
    setEventError,
} from './eventUISyncManager'
