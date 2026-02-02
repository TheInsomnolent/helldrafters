/**
 * Event UI Sync Manager - Handles Firebase synchronization for event UI state
 *
 * This module provides functions to:
 * - Sync event UI state to Firebase (host)
 * - Subscribe to event UI state changes (clients)
 * - Handle event actions and state transitions
 */

import { ref, set, onValue, Unsubscribe, serverTimestamp } from 'firebase/database'
import { getFirebaseDatabase } from '../multiplayer/firebaseConfig'
import {
    createInitialEventUIState,
    getNextStep,
    canNavigateBack,
    generateOutcomePreview,
    type EventUIState,
    type PlayerVote,
    type PlayerDecision,
} from './eventUIState'
import type { GameEvent, EventChoice, StratagemSelection } from '../../types'

/**
 * Sanitize state for Firebase - convert undefined to null
 * Firebase strips undefined values which can cause issues
 */
const sanitizeForFirebase = <T>(obj: T): T => {
    if (obj === undefined) return null as T
    if (obj === null) return null as T
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeForFirebase(item)) as T
    }
    if (typeof obj === 'object') {
        const result: Record<string, unknown> = {}
        for (const key of Object.keys(obj as object)) {
            const value = (obj as Record<string, unknown>)[key]
            result[key] = value === undefined ? null : sanitizeForFirebase(value)
        }
        return result as T
    }
    return obj
}

// =============================================================================
// FIREBASE OPERATIONS
// =============================================================================

/**
 * Get the Firebase ref path for event UI state
 */
const getEventUIStatePath = (lobbyId: string): string => `lobbies/${lobbyId}/eventUIState`

/**
 * Initialize a new event UI state in Firebase (host only)
 */
export const initializeEventUIState = async (
    lobbyId: string,
    eventId: string,
    event: GameEvent,
    hostPlayerId: string,
): Promise<void> => {
    const db = getFirebaseDatabase()
    const eventUIStateRef = ref(db, getEventUIStatePath(lobbyId))

    const initialState = createInitialEventUIState(eventId, event, hostPlayerId)
    const sanitizedState = sanitizeForFirebase(initialState)

    await set(eventUIStateRef, {
        ...sanitizedState,
        _updatedAt: serverTimestamp(),
    })
}

/**
 * Subscribe to event UI state updates (clients)
 */
export const subscribeEventUIState = (
    lobbyId: string,
    callback: (state: EventUIState | null) => void,
): Unsubscribe => {
    const db = getFirebaseDatabase()
    const eventUIStateRef = ref(db, getEventUIStatePath(lobbyId))

    return onValue(
        eventUIStateRef,
        (snapshot) => {
            if (snapshot.exists()) {
                const state = snapshot.val() as EventUIState & { _updatedAt?: unknown }
                // Remove internal fields before passing to callback
                const { _updatedAt: _, ...cleanState } = state
                callback(cleanState as EventUIState)
            } else {
                callback(null)
            }
        },
        (error) => {
            console.error('Event UI state subscription error:', error)
            callback(null)
        },
    )
}

/**
 * Update event UI state in Firebase (host only)
 */
export const updateEventUIState = async (
    lobbyId: string,
    updates: Partial<EventUIState>,
    playerId: string,
): Promise<void> => {
    const db = getFirebaseDatabase()
    const eventUIStateRef = ref(db, getEventUIStatePath(lobbyId))

    // Get current state first
    return new Promise((resolve, reject) => {
        onValue(
            eventUIStateRef,
            async (snapshot) => {
                if (snapshot.exists()) {
                    const currentState = snapshot.val() as EventUIState
                    const newState: EventUIState = {
                        ...currentState,
                        ...updates,
                        lastUpdatedAt: Date.now(),
                        lastUpdatedBy: playerId,
                    }

                    // Update outcome preview if selections changed
                    if (
                        updates.selectedChoice !== undefined ||
                        updates.selectedPlayerIndex !== undefined
                    ) {
                        newState.outcomePreview = generateOutcomePreview(newState)
                    }

                    // Update canGoBack based on history
                    newState.canGoBack = canNavigateBack(newState)

                    const sanitizedState = sanitizeForFirebase(newState)
                    await set(eventUIStateRef, {
                        ...sanitizedState,
                        _updatedAt: serverTimestamp(),
                    })
                    resolve()
                } else {
                    reject(new Error('Event UI state not found'))
                }
            },
            { onlyOnce: true },
        )
    })
}

/**
 * Clear event UI state from Firebase (when event is complete)
 */
export const clearEventUIState = async (lobbyId: string): Promise<void> => {
    const db = getFirebaseDatabase()
    const eventUIStateRef = ref(db, getEventUIStatePath(lobbyId))
    await set(eventUIStateRef, null)
}

// =============================================================================
// STATE TRANSITION ACTIONS
// =============================================================================

/**
 * Move to the next step in the event flow
 */
export const advanceToNextStep = async (
    lobbyId: string,
    currentState: EventUIState,
    playerId: string,
): Promise<void> => {
    const nextStep = getNextStep(currentState)

    await updateEventUIState(
        lobbyId,
        {
            currentStep: nextStep,
            stepHistory: [...currentState.stepHistory, currentState.currentStep],
            errorMessage: null,
        },
        playerId,
    )
}

/**
 * Go back to the previous step
 */
export const goBackToPreviousStep = async (
    lobbyId: string,
    currentState: EventUIState,
    playerId: string,
): Promise<void> => {
    if (!canNavigateBack(currentState)) return

    const previousStep = currentState.stepHistory[currentState.stepHistory.length - 1]
    const newHistory = currentState.stepHistory.slice(0, -1)

    await updateEventUIState(
        lobbyId,
        {
            currentStep: previousStep,
            stepHistory: newHistory,
            errorMessage: null,
        },
        playerId,
    )
}

// =============================================================================
// HOST ACTIONS
// =============================================================================

/**
 * Host selects which player is affected by the event
 */
export const selectPlayer = async (
    lobbyId: string,
    _currentState: EventUIState,
    playerIndex: number,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            selectedPlayerIndex: playerIndex,
            hostHasSelectedPlayer: true,
        },
        playerId,
    )
}

/**
 * Host selects which choice/outcome to apply
 */
export const selectChoice = async (
    lobbyId: string,
    _currentState: EventUIState,
    choiceIndex: number,
    choice: EventChoice,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            selectedChoiceIndex: choiceIndex,
            selectedChoice: choice,
            hostHasSelectedChoice: true,
        },
        playerId,
    )
}

/**
 * Host sets source player for stratagem operations
 */
export const setSourcePlayer = async (
    lobbyId: string,
    _currentState: EventUIState,
    playerIndex: number,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            sourcePlayerSelection: playerIndex,
            // Clear dependent selections when source changes
            stratagemSelection: null,
            targetPlayerSelection: null,
            targetStratagemSelection: null,
        },
        playerId,
    )
}

/**
 * Host sets stratagem selection
 */
export const setStratagemSelection = async (
    lobbyId: string,
    _currentState: EventUIState,
    selection: StratagemSelection,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            stratagemSelection: selection,
        },
        playerId,
    )
}

/**
 * Host sets target player for stratagem operations
 */
export const setTargetPlayer = async (
    lobbyId: string,
    _currentState: EventUIState,
    playerIndex: number,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            targetPlayerSelection: playerIndex,
            // Clear target stratagem when target player changes
            targetStratagemSelection: null,
        },
        playerId,
    )
}

/**
 * Host sets target stratagem selection
 */
export const setTargetStratagemSelection = async (
    lobbyId: string,
    _currentState: EventUIState,
    selection: StratagemSelection,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            targetStratagemSelection: selection,
        },
        playerId,
    )
}

/**
 * Host sets booster selection
 */
export const setBoosterSelection = async (
    lobbyId: string,
    _currentState: EventUIState,
    boosterId: string,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            boosterSelection: boosterId,
        },
        playerId,
    )
}

/**
 * Host sets booster draft options
 */
export const setBoosterDraft = async (
    lobbyId: string,
    _currentState: EventUIState,
    boosterIds: string[],
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            boosterDraft: boosterIds,
        },
        playerId,
    )
}

/**
 * Host sets pending faction for faction change
 */
export const setPendingFaction = async (
    lobbyId: string,
    _currentState: EventUIState,
    faction: string,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            pendingFaction: faction,
            pendingSubfaction: null,
        },
        playerId,
    )
}

/**
 * Host sets subfaction selection
 */
export const setSubfactionSelection = async (
    lobbyId: string,
    _currentState: EventUIState,
    subfaction: string,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            pendingSubfaction: subfaction,
        },
        playerId,
    )
}

// =============================================================================
// PLAYER VOTING ACTIONS
// =============================================================================

/**
 * Non-host player casts a vote for their preferred choice
 */
export const castVote = async (
    lobbyId: string,
    currentState: EventUIState,
    playerId: string,
    playerName: string,
    playerSlot: number,
    choiceIndex: number,
): Promise<void> => {
    // Remove any existing vote from this player
    const filteredVotes = currentState.votes.filter((v: PlayerVote) => v.playerId !== playerId)

    const newVote: PlayerVote = {
        playerId,
        playerName,
        playerSlot,
        choiceIndex,
        timestamp: Date.now(),
    }

    await updateEventUIState(
        lobbyId,
        {
            votes: [...filteredVotes, newVote],
        },
        playerId,
    )
}

/**
 * Player removes their vote
 */
export const removeVote = async (
    lobbyId: string,
    currentState: EventUIState,
    playerId: string,
): Promise<void> => {
    const filteredVotes = currentState.votes.filter((v: PlayerVote) => v.playerId !== playerId)

    await updateEventUIState(
        lobbyId,
        {
            votes: filteredVotes,
        },
        playerId,
    )
}

// =============================================================================
// PLAYER DECISION ACTIONS
// =============================================================================

/**
 * Affected player makes a decision (e.g., which item to lose)
 */
export const submitPlayerDecision = async (
    lobbyId: string,
    currentState: EventUIState,
    decision: PlayerDecision,
): Promise<void> => {
    // Remove any existing decision from this player for this decision type
    const filteredDecisions = currentState.playerDecisions.filter(
        (d: PlayerDecision) =>
            !(d.playerId === decision.playerId && d.decisionType === decision.decisionType),
    )

    const newDecisions = [...filteredDecisions, decision]

    // Check if all required decisions are made
    const waitingForPlayers = currentState.waitingForPlayers.filter(
        (slot: number) => !newDecisions.some((d) => d.playerSlot === slot && d.confirmed),
    )

    await updateEventUIState(
        lobbyId,
        {
            playerDecisions: newDecisions,
            waitingForPlayers,
            allDecisionsMade: waitingForPlayers.length === 0,
        },
        decision.playerId,
    )
}

/**
 * Set which players need to make decisions
 */
export const setWaitingForPlayers = async (
    lobbyId: string,
    _currentState: EventUIState,
    playerSlots: number[],
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            waitingForPlayers: playerSlots,
            allDecisionsMade: playerSlots.length === 0,
            playerDecisions: [], // Clear previous decisions
        },
        playerId,
    )
}

// =============================================================================
// EVENT COMPLETION
// =============================================================================

/**
 * Mark the event as complete
 */
export const completeEvent = async (
    lobbyId: string,
    _currentState: EventUIState,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            currentStep: 'COMPLETE',
            isComplete: true,
            completedAt: Date.now(),
        },
        playerId,
    )
}

/**
 * Set error message
 */
export const setEventError = async (
    lobbyId: string,
    _currentState: EventUIState,
    errorMessage: string,
    playerId: string,
): Promise<void> => {
    await updateEventUIState(
        lobbyId,
        {
            errorMessage,
        },
        playerId,
    )
}
