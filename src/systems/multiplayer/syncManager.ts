/**
 * Sync Manager - Handles state synchronization between host and clients
 *
 * Architecture:
 * - Host writes full game state to Firebase
 * - Clients read game state and subscribe to updates
 * - Clients write actions to clientActions queue
 * - Host processes client actions and updates game state
 */

import {
    onChildAdded,
    onValue,
    push,
    ref,
    remove,
    serverTimestamp,
    set,
    Unsubscribe,
} from 'firebase/database'
import { getFirebaseDatabase } from './firebaseConfig'

// =============================================================================
// TYPES
// =============================================================================

export interface ClientAction {
    type: string
    payload?: Record<string, unknown> & {
        playerSlot?: number
        playerIndex?: number
    }
}

export interface ActionData {
    playerId: string
    action: ClientAction
    timestamp: object | null // serverTimestamp
    id: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Actions that clients are allowed to perform
 * These actions must include a playerSlot to identify which helldiver is affected
 */
export const CLIENT_ALLOWED_ACTIONS: string[] = [
    // Draft actions
    'DRAFT_PICK', // Pick a card during draft (only during their turn)
    'DRAFT_REROLL', // Reroll draft hand
    'DRAFT_BURN', // Burn a card
    'SKIP_DRAFT', // Skip the current draft turn
    'REMOVE_CARD', // Remove a card from draft hand

    // Slot locking
    'LOCK_PLAYER_DRAFT_SLOT',
    'UNLOCK_PLAYER_DRAFT_SLOT',

    // Event actions (player-specific)
    'EVENT_SELECT_CHOICE', // Select an event choice
    'EVENT_SELECT_STRATAGEM',
    'EVENT_SELECT_BOOSTER',
    'EVENT_SELECT_TARGET_PLAYER',
    'EVENT_SELECT_TARGET_STRATAGEM',
    'SET_EVENT_SPECIAL_DRAFT_SELECTION',

    // Loadout modifications
    'EQUIP_ITEM', // Equip an item from inventory
    'STRATAGEM_REPLACEMENT', // Replace a stratagem slot

    // Sacrifice phase
    'SACRIFICE_ITEM', // Sacrifice an item during sacrifice phase

    // Mission phase
    'SET_PLAYER_EXTRACTED', // Toggle extraction status (own player only)

    // Player ready state
    'PLAYER_READY', // Mark player as ready
    'PLAYER_NOT_READY', // Mark player as not ready
]

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate if an action is allowed for a client
 * @param action - The action to validate
 * @param playerSlot - The client's assigned slot
 * @returns Whether the action is allowed
 */
export const isActionAllowedForClient = (action: ClientAction, playerSlot: number): boolean => {
    // Check if action type is in allowed list
    if (!CLIENT_ALLOWED_ACTIONS.includes(action.type)) {
        return false
    }

    // Actions must target the player's own slot
    if (action.payload?.playerSlot !== undefined && action.payload.playerSlot !== playerSlot) {
        return false
    }

    // For player index-based actions
    if (action.payload?.playerIndex !== undefined && action.payload.playerIndex !== playerSlot) {
        return false
    }

    // For player ID-based actions, we'll need to validate in context
    // This is handled by the host when processing

    return true
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Recursively sanitize state for Firebase - convert undefined to null and ensure arrays stay arrays
 * Firebase strips undefined values and converts sparse arrays to objects
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
            // Convert undefined to null, otherwise recurse
            result[key] = value === undefined ? null : sanitizeForFirebase(value)
        }
        return result as T
    }
    return obj
}

// =============================================================================
// HOST FUNCTIONS
// =============================================================================

/**
 * Host: Sync game state to Firebase for clients to receive
 * @param lobbyId - The lobby ID
 * @param gameState - The current game state
 */
export const syncGameState = async (lobbyId: string, gameState: unknown): Promise<void> => {
    const db = getFirebaseDatabase()
    const stateRef = ref(db, `lobbies/${lobbyId}/gameState`)
    const lastUpdatedRef = ref(db, `lobbies/${lobbyId}/lastUpdated`)

    try {
        // Sanitize state to prevent Firebase from stripping undefined values or mangling arrays
        const sanitizedState = sanitizeForFirebase(gameState as Record<string, unknown>)

        // Add timestamp to state for ordering
        const stateWithTimestamp = {
            ...sanitizedState,
            _syncedAt: serverTimestamp(),
            _version: ((gameState as { _version?: number })?._version || 0) + 1,
        }

        await Promise.all([
            set(stateRef, stateWithTimestamp),
            set(lastUpdatedRef, serverTimestamp()),
        ])
    } catch (error) {
        console.error('Error syncing game state:', error)
        throw error
    }
}

/**
 * Host: Subscribe to client actions
 * @param lobbyId - The lobby ID
 * @param callback - Called with each new action
 * @returns Unsubscribe function
 */
export const subscribeClientActions = (
    lobbyId: string,
    callback: (actionData: ActionData, actionId: string) => void,
): Unsubscribe => {
    const db = getFirebaseDatabase()
    const actionsRef = ref(db, `lobbies/${lobbyId}/clientActions`)

    // Listen for new child actions
    const unsubscribe = onChildAdded(
        actionsRef,
        (snapshot) => {
            if (snapshot.exists() && snapshot.key) {
                const actionData = snapshot.val() as ActionData
                callback(actionData, snapshot.key)
            }
        },
        (error) => {
            console.error('Client actions subscription error:', error)
        },
    )

    return unsubscribe
}

/**
 * Host: Remove a processed action from the queue
 * @param lobbyId - The lobby ID
 * @param actionId - The action key to remove
 */
export const removeClientAction = async (lobbyId: string, actionId: string): Promise<void> => {
    const db = getFirebaseDatabase()
    const actionRef = ref(db, `lobbies/${lobbyId}/clientActions/${actionId}`)

    try {
        await remove(actionRef)
    } catch (error) {
        console.error('Error removing client action:', error)
    }
}

// =============================================================================
// CLIENT FUNCTIONS
// =============================================================================

/**
 * Client: Subscribe to game state updates
 * @param lobbyId - The lobby ID
 * @param callback - Called with new state on updates
 * @returns Unsubscribe function
 */
export const subscribeGameState = (
    lobbyId: string,
    callback: (state: unknown, version?: number) => void,
): Unsubscribe => {
    const db = getFirebaseDatabase()
    const stateRef = ref(db, `lobbies/${lobbyId}/gameState`)

    const unsubscribe = onValue(
        stateRef,
        (snapshot) => {
            if (snapshot.exists()) {
                const state = snapshot.val() as { _syncedAt?: unknown; _version?: number }
                // Remove internal sync fields before passing to callback
                const { _syncedAt, _version, ...cleanState } = state
                callback(cleanState, _version)
            }
        },
        (error) => {
            console.error('Game state subscription error:', error)
        },
    )

    return unsubscribe
}

/**
 * Client: Send an action to the host via Firebase
 * @param lobbyId - The lobby ID
 * @param playerId - The client's player ID
 * @param action - The action to send
 */
export const sendClientAction = async (
    lobbyId: string,
    playerId: string,
    action: ClientAction,
): Promise<string> => {
    const db = getFirebaseDatabase()
    const actionsRef = ref(db, `lobbies/${lobbyId}/clientActions`)
    const lastUpdatedRef = ref(db, `lobbies/${lobbyId}/lastUpdated`)

    try {
        // Push a new action to the queue
        const newActionRef = push(actionsRef)
        const actionKey = newActionRef.key
        if (!actionKey) {
            throw new Error('Failed to generate action key')
        }
        await Promise.all([
            set(newActionRef, {
                playerId,
                action,
                timestamp: serverTimestamp(),
                id: actionKey,
            }),
            set(lastUpdatedRef, serverTimestamp()),
        ])

        return actionKey
    } catch (error) {
        console.error('Error sending client action:', error)
        throw error
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
