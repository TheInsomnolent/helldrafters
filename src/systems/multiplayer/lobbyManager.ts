/**
 * Lobby Manager - Handles lobby creation, joining, and player slot management
 *
 * Security model:
 * - Lobbies are identified by UUIDv4, which serves as the "secret" for joining
 * - No lobby listing/scanning is possible - you must know the exact UUID
 * - Firebase rules prevent reading /lobbies (root) but allow reading /lobbies/{lobbyId}
 * - Only the host can write to gameState, clients write to clientActions
 */

import {
    get,
    onDisconnect,
    onValue,
    ref,
    remove,
    serverTimestamp,
    set,
    Unsubscribe,
} from 'firebase/database'
import { v4 as uuidv4 } from 'uuid'
import { getFirebaseDatabase } from './firebaseConfig'
import { GameConfig } from '../../types'

// =============================================================================
// TYPES
// =============================================================================

export interface LobbyPlayer {
    id: string
    name: string
    slot: number
    isHost: boolean
    connected: boolean
    joinedAt: object | null // serverTimestamp
    warbonds?: string[]
    includeSuperstore?: boolean
    excludedItems?: string[]
    ready?: boolean
}

export interface LobbyData {
    id: string
    hostId: string
    createdAt: object | null // serverTimestamp
    lastUpdated: object | null // serverTimestamp
    status: 'waiting' | 'in-game' | 'completed'
    config: GameConfig
    players: Record<string, LobbyPlayer>
    gameState: unknown | null
    clientActions: Record<string, unknown>
}

export interface LobbyInfo {
    id: string
    status: 'waiting' | 'in-game' | 'completed'
    config: GameConfig
    players: Record<string, LobbyPlayer>
    hostId: string
    isLoadedGame: boolean
}

export interface JoinResult {
    success: boolean
    error?: string
    errorCode?: string
    lobby?: LobbyData
}

export interface PlayerConfig {
    name?: string
    warbonds?: string[]
    includeSuperstore?: boolean
    excludedItems?: string[]
    ready?: boolean
}

interface HostInfo {
    id: string
    name: string
}

// =============================================================================
// DEBUG LOGGING
// =============================================================================

/**
 * Debug logging for multiplayer sync - checks localStorage flag
 */
const mpDebugLog = (message: string, data: unknown = null): void => {
    try {
        if (localStorage.getItem('DEBUG_DRAFT_FILTERING') !== 'true') return
    } catch {
        return
    }

    const timestamp = new Date().toISOString()
    const logEntry: Record<string, unknown> = {
        timestamp,
        source: 'lobbyManager',
        message,
    }
    if (data) {
        logEntry.data = data
    }

    // eslint-disable-next-line no-console
    console.log(`[MPDebug] ${message}`, data ? JSON.stringify(data, null, 2) : '')

    // Store in sessionStorage
    try {
        const existing = JSON.parse(sessionStorage.getItem('mpDebugLogs') || '[]')
        existing.push(logEntry)
        if (existing.length > 500) existing.shift()
        sessionStorage.setItem('mpDebugLogs', JSON.stringify(existing))
    } catch {
        // Ignore
    }
}

// =============================================================================
// LOBBY FUNCTIONS
// =============================================================================

/**
 * Generate a new lobby ID (UUIDv4)
 * The UUID serves as both identifier and access control
 */
export const generateLobbyId = (): string => uuidv4()

/**
 * Create a new lobby as host
 * @param lobbyId - The UUIDv4 lobby identifier
 * @param hostInfo - Information about the host player
 * @param gameConfig - Initial game configuration
 * @returns Lobby data
 */
export const createLobby = async (
    lobbyId: string,
    hostInfo: HostInfo,
    gameConfig: GameConfig,
): Promise<LobbyData> => {
    const db = getFirebaseDatabase()
    const lobbyRef = ref(db, `lobbies/${lobbyId}`)

    const lobbyData: LobbyData = {
        id: lobbyId,
        hostId: hostInfo.id,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        status: 'waiting',
        config: gameConfig,
        players: {
            [hostInfo.id]: {
                id: hostInfo.id,
                name: hostInfo.name,
                slot: 0, // Host takes slot 0 by default
                isHost: true,
                connected: true,
                joinedAt: serverTimestamp(),
            },
        },
        // Game state is only written by host
        gameState: null,
        // Client actions queue - clients write here, host processes and clears
        clientActions: {},
    }

    await set(lobbyRef, lobbyData)

    // Set up disconnect handler to remove the entire lobby when host disconnects
    // This effectively kicks all players when the host closes the browser/tab
    onDisconnect(lobbyRef).remove()

    return lobbyData
}

/**
 * Check if a lobby exists and is joinable
 * @param lobbyId - The lobby ID to check
 * @returns Lobby info or null if not found/not joinable
 */
export const checkLobby = async (lobbyId: string): Promise<LobbyInfo | null> => {
    const db = getFirebaseDatabase()
    const lobbyRef = ref(db, `lobbies/${lobbyId}`)

    try {
        const snapshot = await get(lobbyRef)
        if (!snapshot.exists()) {
            return null
        }

        const lobby = snapshot.val() as LobbyData

        // Check if this is a loaded/saved game (has gameState with phase other than MENU/LOBBY)
        const gameState = lobby.gameState as { phase?: string } | null
        const isLoadedGame =
            gameState && gameState.phase && !['MENU', 'LOBBY'].includes(gameState.phase)

        // Return basic info without full game state (for join screen)
        return {
            id: lobby.id,
            status: lobby.status,
            config: lobby.config,
            players: lobby.players,
            hostId: lobby.hostId,
            isLoadedGame: !!isLoadedGame,
        }
    } catch (error) {
        console.error('Error checking lobby:', error)
        return null
    }
}

/**
 * Join an existing lobby
 * @param lobbyId - The lobby ID to join
 * @param playerInfo - Information about the joining player
 * @param requestedSlot - The player slot to take (0-3)
 * @returns Result with success status and data
 */
export const joinLobby = async (
    lobbyId: string,
    playerInfo: HostInfo,
    requestedSlot: number,
): Promise<JoinResult> => {
    const db = getFirebaseDatabase()
    const lobbyRef = ref(db, `lobbies/${lobbyId}`)

    try {
        // Get current lobby state
        const snapshot = await get(lobbyRef)
        if (!snapshot.exists()) {
            return { success: false, error: 'Lobby not found' }
        }

        const lobby = snapshot.val() as LobbyData

        // Allow joining in both 'waiting' and 'in-game' states (hot-join support)
        // Only reject if lobby is 'completed'
        if (lobby.status === 'completed') {
            return { success: false, error: 'Game has already completed' }
        }

        // Check if player already exists in lobby (avoid overwriting) before slot validation
        const players = lobby.players || {}
        if (players[playerInfo.id]) {
            return {
                success: false,
                error: 'Player is already in this lobby',
                errorCode: 'PLAYER_ID_CONFLICT',
            }
        }

        // Check if slot is available - a slot is available if:
        // 1. No player is in that slot, OR
        // 2. The player in that slot is disconnected (connected === false)
        const playerInSlot = Object.values(players).find((p) => p.slot === requestedSlot)
        const slotTakenByConnectedPlayer = playerInSlot && playerInSlot.connected !== false
        if (slotTakenByConnectedPlayer) {
            return { success: false, error: 'Slot is already taken by an active player' }
        }

        // If taking over a disconnected player's slot, remove the old player entry first
        let removedDisconnectedPlayer: LobbyPlayer | null = null
        if (playerInSlot && playerInSlot.connected === false) {
            const oldPlayerRef = ref(db, `lobbies/${lobbyId}/players/${playerInSlot.id}`)
            const oldConnectedRef = ref(
                db,
                `lobbies/${lobbyId}/players/${playerInSlot.id}/connected`,
            )
            await onDisconnect(oldConnectedRef).cancel()
            await remove(oldPlayerRef)
            removedDisconnectedPlayer = playerInSlot
        }

        // Check player count limit (only count connected players for the limit)
        // Exclude the player we just removed (if any) from the count
        const connectedPlayerCount = Object.values(players).filter(
            (p) => p.connected !== false && p.id !== removedDisconnectedPlayer?.id,
        ).length
        if (connectedPlayerCount >= 4) {
            return { success: false, error: 'Lobby is full' }
        }

        // Add player to lobby
        const playerRef = ref(db, `lobbies/${lobbyId}/players/${playerInfo.id}`)
        await set(playerRef, {
            id: playerInfo.id,
            name: playerInfo.name,
            slot: requestedSlot,
            isHost: false,
            connected: true,
            joinedAt: serverTimestamp(),
        })

        // Update lobby's lastUpdated timestamp
        const lastUpdatedRef = ref(db, `lobbies/${lobbyId}/lastUpdated`)
        await set(lastUpdatedRef, serverTimestamp())

        // Set up disconnect handler
        const connectedRef = ref(db, `lobbies/${lobbyId}/players/${playerInfo.id}/connected`)
        onDisconnect(connectedRef).set(false)

        return {
            success: true,
            lobby: {
                ...lobby,
                players: {
                    ...players,
                    [playerInfo.id]: {
                        id: playerInfo.id,
                        name: playerInfo.name,
                        slot: requestedSlot,
                        isHost: false,
                        connected: true,
                        joinedAt: null,
                    },
                },
            },
        }
    } catch (error) {
        console.error('Error joining lobby:', error)
        return { success: false, error: (error as Error).message }
    }
}

/**
 * Leave a lobby
 * @param lobbyId - The lobby ID
 * @param playerId - The player ID leaving
 */
export const leaveLobby = async (lobbyId: string, playerId: string): Promise<void> => {
    const db = getFirebaseDatabase()
    const playerRef = ref(db, `lobbies/${lobbyId}/players/${playerId}`)
    const connectedRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/connected`)

    try {
        // Cancel the onDisconnect handler BEFORE removing the player
        // This prevents the handler from creating a partial entry after removal
        await onDisconnect(connectedRef).cancel()
        await remove(playerRef)
    } catch (error) {
        console.error('Error leaving lobby:', error)
    }
}

/**
 * Kick a player from the lobby (host only)
 * This removes the player from the lobby but preserves their loadout in the game state
 * so they can rejoin and resume their progress
 * @param lobbyId - The lobby ID
 * @param playerId - The player ID to kick
 * @returns Result with success status
 */
export const kickPlayer = async (
    lobbyId: string,
    playerId: string,
): Promise<{ success: boolean; error?: string }> => {
    const db = getFirebaseDatabase()
    const playerRef = ref(db, `lobbies/${lobbyId}/players/${playerId}`)
    const connectedRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/connected`)

    try {
        // Cancel the onDisconnect handler to prevent partial entry creation
        await onDisconnect(connectedRef).cancel()
        await remove(playerRef)
        return { success: true }
    } catch (error) {
        console.error('Error kicking player:', error)
        return { success: false, error: (error as Error).message }
    }
}

/**
 * Kick all players from a lobby (host only)
 * @param lobbyId - The lobby ID
 */
export const kickAllPlayers = async (lobbyId: string): Promise<void> => {
    const db = getFirebaseDatabase()
    const lobbyRef = ref(db, `lobbies/${lobbyId}`)

    try {
        // Get current lobby state
        const snapshot = await get(lobbyRef)
        if (!snapshot.exists()) {
            return
        }

        const lobby = snapshot.val() as LobbyData
        const players = lobby.players || {}

        // Kick all non-host players
        const kickPromises = Object.values(players)
            .filter((player) => !player.isHost)
            .map((player) => kickPlayer(lobbyId, player.id))

        await Promise.all(kickPromises)
    } catch (error) {
        console.error('Error kicking all players:', error)
    }
}

/**
 * Close/delete a lobby (host only)
 * Kicks all players before closing the lobby
 * @param lobbyId - The lobby ID to close
 */
export const closeLobby = async (lobbyId: string): Promise<void> => {
    const db = getFirebaseDatabase()
    const lobbyRef = ref(db, `lobbies/${lobbyId}`)

    try {
        // First kick all players
        await kickAllPlayers(lobbyId)

        // Then remove the lobby
        await remove(lobbyRef)
    } catch (error) {
        console.error('Error closing lobby:', error)
    }
}

/**
 * Update lobby status (host only)
 * @param lobbyId - The lobby ID
 * @param status - New status ('waiting', 'in-game', 'completed')
 */
export const updateLobbyStatus = async (
    lobbyId: string,
    status: 'waiting' | 'in-game' | 'completed',
): Promise<void> => {
    const db = getFirebaseDatabase()
    const statusRef = ref(db, `lobbies/${lobbyId}/status`)
    const lastUpdatedRef = ref(db, `lobbies/${lobbyId}/lastUpdated`)

    try {
        await Promise.all([set(statusRef, status), set(lastUpdatedRef, serverTimestamp())])
    } catch (error) {
        console.error('Error updating lobby status:', error)
    }
}

/**
 * Change player slot
 * @param lobbyId - The lobby ID
 * @param playerId - The player changing slots
 * @param newSlot - The new slot number
 * @returns Result with success status
 */
export const changePlayerSlot = async (
    lobbyId: string,
    playerId: string,
    newSlot: number,
): Promise<{ success: boolean; error?: string }> => {
    const db = getFirebaseDatabase()

    try {
        // Check if slot is available
        const playersRef = ref(db, `lobbies/${lobbyId}/players`)
        const snapshot = await get(playersRef)

        if (!snapshot.exists()) {
            return { success: false, error: 'Lobby not found' }
        }

        const players = snapshot.val() as Record<string, LobbyPlayer>
        const slotTaken = Object.values(players).some(
            (p) => p.id !== playerId && p.slot === newSlot,
        )

        if (slotTaken) {
            return { success: false, error: 'Slot is already taken' }
        }

        // Update slot
        const slotRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/slot`)
        const lastUpdatedRef = ref(db, `lobbies/${lobbyId}/lastUpdated`)
        await Promise.all([set(slotRef, newSlot), set(lastUpdatedRef, serverTimestamp())])

        return { success: true }
    } catch (error) {
        console.error('Error changing slot:', error)
        return { success: false, error: (error as Error).message }
    }
}

/**
 * Subscribe to lobby updates
 * @param lobbyId - The lobby ID
 * @param callback - Called with lobby data on updates
 * @returns Unsubscribe function
 */
export const subscribeLobby = (
    lobbyId: string,
    callback: (lobby: LobbyData | null, error?: Error) => void,
): Unsubscribe => {
    const db = getFirebaseDatabase()
    const lobbyRef = ref(db, `lobbies/${lobbyId}`)

    const unsubscribe = onValue(
        lobbyRef,
        (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val() as LobbyData)
            } else {
                callback(null)
            }
        },
        (error) => {
            console.error('Lobby subscription error:', error)
            callback(null, error)
        },
    )

    return unsubscribe
}

/**
 * Get available slots in a lobby
 * @param lobby - The lobby data
 * @returns Array of available slot indices
 */
export const getAvailableSlots = (lobby: LobbyData | null): number[] => {
    if (!lobby || !lobby.config) return []

    const totalSlots = 4 // Always allow up to 4 players in multiplayer (dynamic)
    const players = lobby.players || {}
    const takenSlots = Object.values(players).map((p) => p.slot)

    const available: number[] = []
    for (let i = 0; i < totalSlots; i++) {
        if (!takenSlots.includes(i)) {
            available.push(i)
        }
    }

    return available
}

/**
 * Update player's configuration (name, warbonds, ready state, etc.)
 * @param lobbyId - The lobby ID
 * @param playerId - The player ID
 * @param config - Configuration to update
 * @returns Result with success status
 */
export const updatePlayerConfig = async (
    lobbyId: string,
    playerId: string,
    config: PlayerConfig,
): Promise<{ success: boolean; error?: string }> => {
    const db = getFirebaseDatabase()

    // === DEBUG: Log config being written to Firebase ===
    mpDebugLog('updatePlayerConfig called', {
        lobbyId: `${lobbyId?.substring(0, 8)}...`,
        playerId: `${playerId?.substring(0, 8)}...`,
        config: {
            name: config.name,
            warbonds: config.warbonds,
            warbondsLength: config.warbonds?.length,
            includeSuperstore: config.includeSuperstore,
            includeSuperstoreType: typeof config.includeSuperstore,
            excludedItems: config.excludedItems,
            excludedItemsLength: config.excludedItems?.length,
            ready: config.ready,
        },
    })

    try {
        // Update each config field individually to avoid overwriting other fields
        const updates: Promise<void>[] = []

        if (config.name !== undefined) {
            const nameRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/name`)
            updates.push(set(nameRef, config.name))
        }

        if (config.warbonds !== undefined) {
            const warbondsRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/warbonds`)
            mpDebugLog('Writing warbonds to Firebase', {
                playerId: `${playerId?.substring(0, 8)}...`,
                warbonds: config.warbonds,
                warbondsLength: config.warbonds?.length,
            })
            updates.push(set(warbondsRef, config.warbonds))
        }

        if (config.includeSuperstore !== undefined) {
            const superstoreRef = ref(
                db,
                `lobbies/${lobbyId}/players/${playerId}/includeSuperstore`,
            )
            mpDebugLog('Writing includeSuperstore to Firebase', {
                playerId: `${playerId?.substring(0, 8)}...`,
                includeSuperstore: config.includeSuperstore,
                type: typeof config.includeSuperstore,
            })
            updates.push(set(superstoreRef, config.includeSuperstore))
        }

        if (config.excludedItems !== undefined) {
            const excludedItemsRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/excludedItems`)
            mpDebugLog('Writing excludedItems to Firebase', {
                playerId: `${playerId?.substring(0, 8)}...`,
                excludedItemsCount: config.excludedItems?.length,
            })
            updates.push(set(excludedItemsRef, config.excludedItems))
        }

        if (config.ready !== undefined) {
            const readyRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/ready`)
            updates.push(set(readyRef, config.ready))
        }

        // Also update lobby's lastUpdated timestamp
        const lastUpdatedRef = ref(db, `lobbies/${lobbyId}/lastUpdated`)
        updates.push(set(lastUpdatedRef, serverTimestamp()))

        await Promise.all(updates)
        mpDebugLog('updatePlayerConfig SUCCESS', { updatesCount: updates.length })
        return { success: true }
    } catch (error) {
        console.error('Error updating player config:', error)
        mpDebugLog('updatePlayerConfig ERROR', { error: (error as Error).message })
        return { success: false, error: (error as Error).message }
    }
}

/**
 * Set player's ready state
 * @param lobbyId - The lobby ID
 * @param playerId - The player ID
 * @param ready - Ready state
 * @returns Result with success status
 */
export const setPlayerReady = async (
    lobbyId: string,
    playerId: string,
    ready: boolean,
): Promise<{ success: boolean; error?: string }> => {
    const db = getFirebaseDatabase()
    const readyRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/ready`)

    try {
        await set(readyRef, ready)
        return { success: true }
    } catch (error) {
        console.error('Error setting ready state:', error)
        return { success: false, error: (error as Error).message }
    }
}
