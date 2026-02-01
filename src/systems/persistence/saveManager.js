/**
 * Create a save state object from current game state
 * @param {Object} state - Current game state
 * @returns {Object} Serializable save state
 */
export const createSaveState = (state) => ({
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

/**
 * Validate a loaded save state
 * @param {Object} state - The state object to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export const validateSaveState = (state) => {
    if (!state) {
        return { valid: false, error: 'Save state is null or undefined' }
    }

    if (!state.phase) {
        return { valid: false, error: 'Save state missing phase' }
    }

    if (!state.gameConfig) {
        return { valid: false, error: 'Save state missing gameConfig' }
    }

    if (!state.players) {
        return { valid: false, error: 'Save state missing players' }
    }

    return { valid: true, error: null }
}

/**
 * Export game state as a downloadable JSON file
 * @param {Object} state - Current game state
 */
export const exportGameStateToFile = (state) => {
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
 * @param {File} file - The file to parse
 * @returns {Promise<Object>} Parsed and validated save state
 */
export const parseSaveFile = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const state = JSON.parse(e.target?.result)
                const validation = validateSaveState(state)

                if (!validation.valid) {
                    reject(new Error(validation.error))
                    return
                }

                resolve(state)
            } catch (error) {
                reject(new Error('Failed to parse save file. File may be corrupted.'))
            }
        }

        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }

        reader.readAsText(file)
    })

/**
 * Normalize loaded state to ensure all fields exist
 * @param {Object} loadedState - The loaded state
 * @returns {Object} Normalized state with defaults for missing fields
 */
export const normalizeLoadedState = (loadedState) => ({
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
 * Save a completed run's analytics data to local storage
 * @param {Object} analyticsData - The complete analytics snapshot from the run
 * @returns {boolean} Whether the save was successful
 */
export const saveRunToHistory = (analyticsData) => {
    try {
        if (!analyticsData || !analyticsData.runId) {
            console.warn('Invalid analytics data - cannot save to history')
            return false
        }

        const history = loadRunHistory()

        // Create a summary for the run
        const runSummary = {
            runId: analyticsData.runId,
            savedAt: Date.now(),
            startTime: analyticsData.startTime,
            endTime: analyticsData.endTime,
            duration: analyticsData.endTime - analyticsData.startTime,
            outcome: analyticsData.finalStats?.outcome || 'unknown',
            finalDifficulty: analyticsData.finalStats?.finalDifficulty || 1,
            playerCount: analyticsData.finalStats?.playerCount || 1,
            playerNames: analyticsData.finalStats?.players?.map((p) => p.name) || [],
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
 * @returns {Array} Array of run summaries (most recent first)
 */
export const loadRunHistory = () => {
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
 * @returns {Array} Array of run summaries for display
 */
export const getRunSummaries = () => {
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
 * @param {string} runId - The run ID to retrieve
 * @returns {Object|null} Full analytics data or null if not found
 */
export const getRunById = (runId) => {
    const history = loadRunHistory()
    const run = history.find((r) => r.runId === runId)
    return run?.fullData || null
}

/**
 * Delete a run from history
 * @param {string} runId - The run ID to delete
 * @returns {boolean} Whether the deletion was successful
 */
export const deleteRunFromHistory = (runId) => {
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

/**
 * Clear all run history
 * @returns {boolean} Whether the clear was successful
 */
export const clearRunHistory = () => {
    try {
        localStorage.removeItem(RUN_HISTORY_KEY)
        return true
    } catch (error) {
        console.error('Failed to clear run history:', error)
        return false
    }
}

/**
 * Get storage usage info for run history
 * @returns {Object} { count, sizeKB, maxCount }
 */
export const getRunHistoryStats = () => {
    try {
        const stored = localStorage.getItem(RUN_HISTORY_KEY) || '[]'
        const history = loadRunHistory()
        return {
            count: history.length,
            sizeKB: Math.round((stored.length / 1024) * 10) / 10,
            maxCount: MAX_RUN_HISTORY,
        }
    } catch (error) {
        return { count: 0, sizeKB: 0, maxCount: MAX_RUN_HISTORY }
    }
}
