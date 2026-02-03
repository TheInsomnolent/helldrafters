/**
 * Event UI State - New events system with Firebase-synced UI state
 *
 * This module defines the state structure for the redesigned events system.
 * All UI state is stored in Firebase to ensure all players stay in sync.
 *
 * Key philosophies:
 * - All choices explained upfront so players can make informed decisions
 * - Host makes decisions about outcomes and targets
 * - Affected players can make decisions about how their character is affected
 * - Non-host players can vote for their preferred outcome
 * - Backward navigation allowed until event is completed
 * - All UI state synced via Firebase
 */

import type { EventChoice, EventOutcome, GameEvent, StratagemSelection, Item } from '../../types'

/**
 * Event navigation step - tracks progression through the event
 */
export type EventStep =
    | 'OVERVIEW' // Initial event display with description
    | 'PLAYER_SELECTION' // Select which player is affected (if event targets single player)
    | 'CHOICE_SELECTION' // Host selects which choice/outcome to take
    | 'SELECTION_DETAILS' // Additional selections (stratagems, targets, etc.)
    | 'PLAYER_DECISIONS' // Affected players make their specific decisions
    | 'CONFIRMATION' // Final confirmation before applying
    | 'APPLYING' // Event outcome is being applied
    | 'COMPLETE' // Event is complete

/**
 * Vote for an event choice from a non-host player
 */
export interface PlayerVote {
    playerId: string
    playerName: string
    playerSlot: number
    choiceIndex: number
    timestamp: number
}

/**
 * Player-specific decision (e.g., which item to sacrifice, which stratagem to lose)
 */
export interface PlayerDecision {
    playerId: string
    playerSlot: number
    decisionType: 'ITEM_SELECTION' | 'STRATAGEM_SELECTION' | 'BOOSTER_SELECTION' | 'CONFIRMATION'
    selectedItemId?: string | null
    selectedStratagemSlotIndex?: number | null
    confirmed: boolean
    timestamp: number
}

/**
 * Special draft state for events that trigger item drafts
 */
export interface EventDraftState {
    isActive: boolean
    draftType: 'throwable' | 'secondary' | 'booster' | null
    draftItems: Item[]
    playerSelections: Record<number, string | null> // playerSlot -> itemId
    allSelectionsComplete: boolean
}

/**
 * Complete Event UI State - synced to Firebase for all players
 */
export interface EventUIState {
    // Event identification
    eventId: string
    event: GameEvent

    // Navigation state
    currentStep: EventStep
    stepHistory: EventStep[] // For backward navigation
    canGoBack: boolean

    // Player selection (for single-target events)
    selectedPlayerIndex: number | null
    hostHasSelectedPlayer: boolean

    // Choice/outcome selection
    selectedChoiceIndex: number | null
    selectedChoice: EventChoice | null
    hostHasSelectedChoice: boolean

    // Voting state (non-host players)
    votes: PlayerVote[]
    votingEnabled: boolean

    // Detailed selection state (for complex choices)
    sourcePlayerSelection: number | null
    stratagemSelection: StratagemSelection | null
    targetPlayerSelection: number | null
    targetStratagemSelection: StratagemSelection | null
    boosterDraft: string[] | null
    boosterSelection: string | null

    // Player-specific decisions
    playerDecisions: PlayerDecision[]
    waitingForPlayers: number[] // Player slots we're waiting on
    allDecisionsMade: boolean

    // Special draft state
    specialDraft: EventDraftState | null

    // Faction change state
    pendingFaction: string | null
    pendingSubfaction: string | null

    // UI feedback
    outcomePreview: string | null // Shows what will happen with current selections
    errorMessage: string | null

    // Timing
    startedAt: number
    lastUpdatedAt: number
    lastUpdatedBy: string // playerId who made the last update

    // Completion state
    isComplete: boolean
    completedAt: number | null
}

/**
 * Create initial event UI state for a new event
 */
export const createInitialEventUIState = (
    eventId: string,
    event: GameEvent,
    hostPlayerId: string,
): EventUIState => {
    // Determine if we need player selection first
    const needsPlayerSelection = event.targetPlayer === 'single'

    return {
        eventId,
        event,

        currentStep: needsPlayerSelection ? 'PLAYER_SELECTION' : 'OVERVIEW',
        stepHistory: [],
        canGoBack: false,

        selectedPlayerIndex: null,
        hostHasSelectedPlayer: false,

        selectedChoiceIndex: null,
        selectedChoice: null,
        hostHasSelectedChoice: false,

        votes: [],
        votingEnabled: true,

        sourcePlayerSelection: null,
        stratagemSelection: null,
        targetPlayerSelection: null,
        targetStratagemSelection: null,
        boosterDraft: null,
        boosterSelection: null,

        playerDecisions: [],
        waitingForPlayers: [],
        allDecisionsMade: true,

        specialDraft: null,

        pendingFaction: null,
        pendingSubfaction: null,

        outcomePreview: null,
        errorMessage: null,

        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
        lastUpdatedBy: hostPlayerId,

        isComplete: false,
        completedAt: null,
    }
}

/**
 * Check if a choice requires additional player-specific decisions
 * (e.g., player needs to choose which item to lose)
 */
export const choiceRequiresPlayerDecision = (choice: EventChoice | null): boolean => {
    if (!choice) return false

    return choice.outcomes.some(
        (outcome) =>
            outcome.targetPlayer === 'choose' &&
            (outcome.type === 'remove_item' ||
                outcome.type === 'transform_loadout' ||
                outcome.type === 'redraft'),
    )
}

/**
 * Check if a choice requires complex selection (stratagem swaps, duplicates, etc.)
 */
export const choiceRequiresDetailedSelection = (choice: EventChoice | null): boolean => {
    if (!choice) return false

    return choice.outcomes.some(
        (outcome) =>
            outcome.type === 'duplicate_stratagem_to_another_helldiver' ||
            outcome.type === 'swap_stratagem_with_player' ||
            (outcome.type === 'restrict_to_single_weapon' && outcome.targetPlayer === 'choose') ||
            outcome.type === 'duplicate_loadout_to_all',
    )
}

/**
 * Check if a choice requires booster selection
 */
export const choiceRequiresBoosterSelection = (choice: EventChoice | null): boolean => {
    if (!choice) return false

    return choice.outcomes.some(
        (outcome) => outcome.type === 'gain_booster' && outcome.targetPlayer === 'choose',
    )
}

/**
 * Get the next step based on current state and event configuration
 */
export const getNextStep = (state: EventUIState): EventStep => {
    const { currentStep, event, selectedChoice } = state

    switch (currentStep) {
        case 'OVERVIEW':
            // If event has choices, move to choice selection
            if (event.type === 'choice' && event.choices && event.choices.length > 0) {
                return 'CHOICE_SELECTION'
            }
            // Otherwise, go straight to confirmation
            return 'CONFIRMATION'

        case 'PLAYER_SELECTION':
            // After selecting player, show overview with choices
            return 'OVERVIEW'

        case 'CHOICE_SELECTION':
            // Check if the selected choice needs additional selections
            if (choiceRequiresDetailedSelection(selectedChoice)) {
                return 'SELECTION_DETAILS'
            }
            if (choiceRequiresBoosterSelection(selectedChoice)) {
                return 'SELECTION_DETAILS'
            }
            if (choiceRequiresPlayerDecision(selectedChoice)) {
                return 'PLAYER_DECISIONS'
            }
            return 'CONFIRMATION'

        case 'SELECTION_DETAILS':
            // After detailed selections, check if affected players need to make decisions
            if (choiceRequiresPlayerDecision(selectedChoice)) {
                return 'PLAYER_DECISIONS'
            }
            return 'CONFIRMATION'

        case 'PLAYER_DECISIONS':
            return 'CONFIRMATION'

        case 'CONFIRMATION':
            return 'APPLYING'

        case 'APPLYING':
            return 'COMPLETE'

        default:
            return 'COMPLETE'
    }
}

/**
 * Can navigate back from current step
 */
export const canNavigateBack = (state: EventUIState): boolean => {
    // Cannot go back once applying or complete
    if (state.currentStep === 'APPLYING' || state.currentStep === 'COMPLETE') {
        return false
    }

    // Cannot go back if no history
    if (state.stepHistory.length === 0) {
        return false
    }

    return true
}

/**
 * Get previous step from history
 */
export const getPreviousStep = (state: EventUIState): EventStep | null => {
    if (state.stepHistory.length === 0) return null
    return state.stepHistory[state.stepHistory.length - 1]
}

/**
 * Generate outcome preview text for the current state
 */
export const generateOutcomePreview = (state: EventUIState): string => {
    const { selectedChoice, selectedPlayerIndex, event } = state

    if (!selectedChoice) {
        if (event.outcomes && event.outcomes.length > 0) {
            return formatOutcomesPreview(event.outcomes)
        }
        return 'Select a choice to see the outcome'
    }

    let preview = formatOutcomesPreview(selectedChoice.outcomes)

    // Add target player info if applicable
    if (selectedPlayerIndex !== null && event.targetPlayer === 'single') {
        preview = `HELLDIVER ${selectedPlayerIndex + 1}: ${preview}`
    }

    return preview
}

/**
 * Format outcomes for preview display
 */
const formatOutcomesPreview = (outcomes: EventOutcome[]): string => {
    if (!outcomes || outcomes.length === 0) return 'No effect'

    return outcomes
        .map((outcome) => {
            switch (outcome.type) {
                case 'add_requisition':
                    return `+${outcome.value} Requisition`
                case 'lose_requisition':
                case 'spend_requisition':
                    return `-${outcome.value} Requisition`
                case 'change_faction':
                    return 'Switch to a different theater'
                case 'extra_draft':
                    return `+${outcome.value} extra draft card(s)`
                case 'skip_difficulty':
                    return `Skip ${outcome.value} difficulty level(s)`
                case 'replay_difficulty':
                    return `Repeat ${outcome.value} difficulty level(s)`
                case 'gain_booster':
                    return 'Gain a tactical booster'
                case 'remove_item':
                    return 'Lose an item'
                case 'transform_loadout':
                    return 'Transform loadout item(s)'
                case 'redraft':
                    return 'Redraft your equipment'
                case 'restrict_to_single_weapon':
                    return 'Restricted to single weapon'
                case 'duplicate_stratagem_to_another_helldiver':
                    return 'Duplicate a stratagem to another player'
                case 'swap_stratagem_with_player':
                    return 'Swap stratagems with another player'
                case 'duplicate_loadout_to_all':
                    return 'Duplicate loadout to all players'
                case 'gain_secondary':
                    return 'Gain a secondary weapon'
                case 'gain_throwable':
                    return 'Gain a throwable'
                case 'gain_random_light_armor_and_draft_throwable':
                    return 'Receive light armor and draft a throwable'
                case 'gain_random_heavy_armor_and_draft_secondary':
                    return 'Receive heavy armor and draft a secondary'
                case 'set_ceremonial_loadout':
                    return 'Equip ceremonial loadout'
                case 'random_outcome':
                    return 'Random outcome'
                default:
                    return ''
            }
        })
        .filter((text) => text !== '')
        .join(', ')
}
