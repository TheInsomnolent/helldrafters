/**
 * Save Manager for game state persistence
 */

import type { GamePhase, GameConfig, Player, DraftState, Samples, CustomSetup } from '../../types'
import type { GameEvent } from '../events/events'
import type { AnalyticsStore } from '../../state/analyticsStore'

/**
 * Save state structure
 */
export interface SaveState {
    phase: GamePhase
    gameConfig: GameConfig
    currentDiff: number
    requisition: number
    samples: Samples
    burnedCards: string[]
    players: Player[]
    draftState: DraftState
    eventsEnabled: boolean
    currentEvent: GameEvent | null
    eventPlayerChoice: number | null
    seenEvents: string[]
    customSetup: CustomSetup
    selectedPlayer: number
    exportedAt: string
}

/**
 * Create a save state object from current game state
 * @param state - Current game state
 * @returns Serializable save state
 */
export const createSaveState = (state: {
    phase: GamePhase
    gameConfig: GameConfig
    currentDiff: number
    requisition: number
    samples: Samples
    burnedCards: string[]
    players: Player[]
    draftState: DraftState
    eventsEnabled: boolean
    currentEvent: GameEvent | null
    eventPlayerChoice: number | null
    seenEvents: string[]
    customSetup: CustomSetup
    selectedPlayer: number
}): SaveState => ({
    phase: state.phase,
    gameConfig: state.gameConfig,
    currentDiff: state.currentDiff,
    requisition: state.requisition,
    samples: state.samples,
    burnedCards: state.burnedCards,
    players: state.players,
    draftState: state.draftState,
    eventsEnabled: state.eventsEnabled,
    currentEvent: state.currentEvent,
    eventPlayerChoice: state.eventPlayerChoice,
    seenEvents: state.seenEvents,
    customSetup: state.customSetup,
    selectedPlayer: state.selectedPlayer,
    exportedAt: new Date().toISOString(),
})

export interface ValidationResult {
    valid: boolean
    error: string | null
}

/**
 * Validate a loaded save state
 * @param state - The state object to validate
 * @returns {valid: boolean, error: string}
 */
export const validateSaveState = (state: unknown): ValidationResult => {
    if (!state) {
        return { valid: false, error: 'Save state is null or undefined' }
    }

    const s = state as Partial<SaveState>

    if (!s.phase) {
        return { valid: false, error: 'Save state missing phase' }
    }

    if (!s.gameConfig) {
        return { valid: false, error: 'Save state missing gameConfig' }
    }

    if (!s.players) {
        return { valid: false, error: 'Save state missing players' }
    }

    return { valid: true, error: null }
}

/**
 * Export game state as a downloadable JSON file
 * @param state - Current game state
 */
export const exportGameStateToFile = (state: Parameters<typeof createSaveState>[0]): void => {
    const saveState = createSaveState(state)
    const dataStr = JSON.stringify(saveState, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `helldrafters-save-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Parse and validate a save file
 * @param file - The file to parse
 * @returns Parsed and validated save state
 */
export const parseSaveFile = (file: File): Promise<SaveState> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const state = JSON.parse(e.target?.result as string)
                const validation = validateSaveState(state)

                if (!validation.valid) {
                    reject(new Error(validation.error || 'Invalid save state'))
                    return
                }

                resolve(state as SaveState)
            } catch {
                reject(new Error('Failed to parse save file. File may be corrupted.'))
            }
        }

        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }

        reader.readAsText(file)
    })

/**
 * Normalized state with defaults
 */
export interface NormalizedState {
    phase: GamePhase
    gameConfig: GameConfig
    currentDiff: number
    requisition: number
    samples: Samples
    burnedCards: string[]
    players: Player[]
    draftState: DraftState
    eventsEnabled: boolean
    currentEvent: GameEvent | null
    eventPlayerChoice: number | null
    seenEvents: string[]
    customSetup: CustomSetup
    selectedPlayer: number
}

/**
 * Normalize loaded state to ensure all fields exist
 * @param loadedState - The loaded state
 * @returns Normalized state with defaults for missing fields
 */
export const normalizeLoadedState = (loadedState: SaveState): NormalizedState => ({
    phase: loadedState.phase,
    gameConfig: loadedState.gameConfig,
    currentDiff: loadedState.currentDiff || 1,
    requisition: loadedState.requisition || 0,
    samples: loadedState.samples || { common: 0, rare: 0, superRare: 0 },
    burnedCards: loadedState.burnedCards || [],
    players: loadedState.players || [],
    draftState: loadedState.draftState || {
        activePlayerIndex: 0,
        roundCards: [],
        isRerolling: false,
        pendingStratagem: null,
        draftOrder: [],
        extraDraftRound: 0,
        isRetrospective: false,
        retrospectivePlayerIndex: null,
    },
    eventsEnabled: loadedState.eventsEnabled !== undefined ? loadedState.eventsEnabled : true,
    currentEvent: loadedState.currentEvent || null,
    eventPlayerChoice: loadedState.eventPlayerChoice || null,
    seenEvents: loadedState.seenEvents || [],
    customSetup: loadedState.customSetup || { difficulty: 1, loadouts: [] },
    selectedPlayer: loadedState.selectedPlayer || 0,
})

// ============================================================================
// RUN HISTORY PERSISTENCE
// ============================================================================

const RUN_HISTORY_KEY = 'helldraftersRunHistory'
const MAX_RUN_HISTORY = 20

/**
 * Run summary for display
 */
export interface RunSummary {
    runId: string
    savedAt: number
    startTime: number | null
    endTime: number | null
    duration: number
    outcome: string
    finalDifficulty: number
    playerCount: number
    playerNames: string[]
    faction: string
    totalEvents: number
    totalDeaths: number
    finalRequisition: number
    fullData?: AnalyticsStore
}

/**
 * Save a completed run's analytics data to local storage
 * @param analyticsData - The complete analytics snapshot from the run
 * @returns Whether the save was successful
 */
export const saveRunToHistory = (analyticsData: AnalyticsStore): boolean => {
    try {
        if (!analyticsData || !analyticsData.runId) {
            console.warn('Invalid analytics data - cannot save to history')
            return false
        }

        const history = loadRunHistory()

        // Create a summary for the run
        const runSummary: RunSummary = {
            runId: analyticsData.runId,
            savedAt: Date.now(),
            startTime: analyticsData.startTime,
            endTime: analyticsData.endTime,
            duration: (analyticsData.endTime || 0) - (analyticsData.startTime || 0),
            outcome: analyticsData.finalStats?.outcome || 'unknown',
            finalDifficulty: analyticsData.finalStats?.finalDifficulty || 1,
            playerCount: analyticsData.finalStats?.playerCount || 1,
            playerNames:
                analyticsData.finalStats?.players?.map((p: { name: string }) => p.name) || [],
            faction: analyticsData.gameConfig?.faction || 'terminid',
            totalEvents: analyticsData.eventOccurrences?.length || 0,
            totalDeaths: analyticsData.playerDeaths?.length || 0,
            finalRequisition: analyticsData.finalStats?.finalRequisition || 0,
            // Store the full analytics data for viewing
            fullData: analyticsData,
        }

        // Add to front of history (most recent first)
        history.unshift(runSummary)

        // Trim to max size
        while (history.length > MAX_RUN_HISTORY) {
            history.pop()
        }

        localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(history))
        return true
    } catch (error) {
        console.error('Failed to save run to history:', error)
        return false
    }
}

/**
 * Load run history from local storage
 * @returns Array of run summaries (most recent first)
 */
export const loadRunHistory = (): RunSummary[] => {
    try {
        const stored = localStorage.getItem(RUN_HISTORY_KEY)
        if (!stored) return []

        const history = JSON.parse(stored)
        if (!Array.isArray(history)) return []

        return history
    } catch (error) {
        console.error('Failed to load run history:', error)
        return []
    }
}

/**
 * Get summarized list of past runs (without full analytics data)
 * @returns Array of run summaries for display
 */
export const getRunSummaries = (): Omit<RunSummary, 'fullData'>[] => {
    const history = loadRunHistory()
    return history.map((run) => ({
        runId: run.runId,
        savedAt: run.savedAt,
        startTime: run.startTime,
        endTime: run.endTime,
        duration: run.duration,
        outcome: run.outcome,
        finalDifficulty: run.finalDifficulty,
        playerCount: run.playerCount,
        playerNames: run.playerNames,
        faction: run.faction,
        totalEvents: run.totalEvents,
        totalDeaths: run.totalDeaths,
        finalRequisition: run.finalRequisition,
    }))
}

/**
 * Get full analytics data for a specific run
 * @param runId - The run ID to retrieve
 * @returns Full analytics data or null if not found
 */
export const getRunById = (runId: string): AnalyticsStore | null => {
    const history = loadRunHistory()
    const run = history.find((r) => r.runId === runId)
    return run?.fullData || null
}

/**
 * Delete a run from history
 * @param runId - The run ID to delete
 * @returns Whether the deletion was successful
 */
export const deleteRunFromHistory = (runId: string): boolean => {
    try {
        const history = loadRunHistory()
        const filtered = history.filter((r) => r.runId !== runId)
        localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(filtered))
        return true
    } catch (error) {
        console.error('Failed to delete run from history:', error)
        return false
    }
}

export interface RunHistoryStats {
    count: number
    sizeKB: number
    maxCount: number
}

/**
 * Get storage usage info for run history
 * @returns { count, sizeKB, maxCount }
 */
export const getRunHistoryStats = (): RunHistoryStats => {
    try {
        const stored = localStorage.getItem(RUN_HISTORY_KEY) || '[]'
        const history = loadRunHistory()
        return {
            count: history.length,
            sizeKB: Math.round((stored.length / 1024) * 10) / 10,
            maxCount: MAX_RUN_HISTORY,
        }
    } catch {
        return { count: 0, sizeKB: 0, maxCount: MAX_RUN_HISTORY }
    }
}
