/**
 * Analytics Store for Post-Run Statistics
 *
 * Tracks timeline-based events throughout a game run for visualization
 * in victory/game over screens.
 */

// Event types for the analytics timeline
export const ANALYTICS_EVENT_TYPES = {
    // Resource events
    SAMPLES_CHANGE: 'SAMPLES_CHANGE',
    REQUISITION_CHANGE: 'REQUISITION_CHANGE',

    // Player events
    PLAYER_DEATH: 'PLAYER_DEATH',
    PLAYER_EXTRACT: 'PLAYER_EXTRACT',
    LOADOUT_CHANGE: 'LOADOUT_CHANGE',
    ITEM_SACRIFICED: 'ITEM_SACRIFICED',

    // Game events
    GAME_EVENT: 'GAME_EVENT',
    MISSION_COMPLETE: 'MISSION_COMPLETE',
    DIFFICULTY_CHANGE: 'DIFFICULTY_CHANGE',
    DRAFT_COMPLETE: 'DRAFT_COMPLETE',
    REROLL_USED: 'REROLL_USED',

    // Game flow
    RUN_START: 'RUN_START',
    RUN_END: 'RUN_END',
}

// The analytics store - holds all tracked data for the current run
let analyticsStore = {
    runId: null,
    startTime: null,
    endTime: null,

    // Timeline of all events (sorted by timestamp)
    timeline: [],

    // Cumulative resource snapshots over time
    sampleSnapshots: [], // { timestamp, common, rare, superRare, eventId? }
    requisitionSnapshots: [], // { timestamp, amount, change, reason, playerName? }

    // Player-specific tracking
    playerLoadouts: {}, // { playerId: [{ timestamp, loadout, reason }] }
    playerDeaths: [], // { timestamp, playerId, playerName, difficulty, mission }
    playerExtractions: [], // { timestamp, playerId, playerName, difficulty, mission }

    // Mission results
    missionResults: [], // { difficulty, mission, starRating, timestamp }

    // Event occurrences
    eventOccurrences: [], // { timestamp, eventId, eventName, outcome, difficulty }

    // Draft tracking
    draftHistory: [], // { timestamp, playerId, playerName, itemId, slot, difficulty }

    // Reroll tracking
    rerollHistory: [], // { timestamp, playerId, playerName, difficulty, cost }

    // Game configuration snapshot
    gameConfig: null,

    // Final statistics
    finalStats: null,
}

/**
 * Generate a unique run ID
 */
const generateRunId = () => `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

/**
 * Get current timestamp relative to run start
 */
const getRelativeTimestamp = () => {
    if (!analyticsStore.startTime) return 0
    return Date.now() - analyticsStore.startTime
}

/**
 * Initialize a new analytics session for a run
 */
export const initializeAnalytics = (gameConfig, players) => {
    const runId = generateRunId()
    const startTime = Date.now()

    analyticsStore = {
        runId,
        startTime,
        endTime: null,
        timeline: [],
        sampleSnapshots: [{ timestamp: 0, common: 0, rare: 0, superRare: 0 }],
        requisitionSnapshots: [{ timestamp: 0, amount: 0, change: 0, reason: 'start' }],
        playerLoadouts: {},
        playerDeaths: [],
        playerExtractions: [],
        missionResults: [],
        eventOccurrences: [],
        draftHistory: [],
        rerollHistory: [],
        gameConfig: { ...gameConfig },
        finalStats: null,
    }

    // Initialize player loadout tracking with deep copy of stratagems
    players.forEach((player) => {
        analyticsStore.playerLoadouts[player.id] = [
            {
                timestamp: 0,
                loadout: {
                    ...player.loadout,
                    stratagems: player.loadout?.stratagems ? [...player.loadout.stratagems] : [],
                },
                reason: 'start',
                playerName: player.name || `Helldiver ${player.id}`,
            },
        ]
    })

    // Record run start event
    addTimelineEvent(ANALYTICS_EVENT_TYPES.RUN_START, {
        gameConfig,
        playerCount: players.length,
        playerNames: players.map((p) => p.name),
    })

    return runId
}

/**
 * Add an event to the timeline
 */
const addTimelineEvent = (type, data) => {
    const event = {
        id: `evt_${analyticsStore.timeline.length}`,
        type,
        timestamp: getRelativeTimestamp(),
        absoluteTime: Date.now(),
        ...data,
    }
    analyticsStore.timeline.push(event)
    return event
}

/**
 * Record a change in sample counts
 */
export const recordSampleChange = (samples, reason, eventName = null) => {
    const timestamp = getRelativeTimestamp()
    const lastSnapshot = analyticsStore.sampleSnapshots[
        analyticsStore.sampleSnapshots.length - 1
    ] || { common: 0, rare: 0, superRare: 0 }

    const snapshot = {
        timestamp,
        common: samples.common,
        rare: samples.rare,
        superRare: samples.superRare,
        change: {
            common: samples.common - lastSnapshot.common,
            rare: samples.rare - lastSnapshot.rare,
            superRare: samples.superRare - lastSnapshot.superRare,
        },
        reason,
        eventName,
    }

    analyticsStore.sampleSnapshots.push(snapshot)

    addTimelineEvent(ANALYTICS_EVENT_TYPES.SAMPLES_CHANGE, {
        samples: { ...samples },
        change: snapshot.change,
        reason,
        eventName,
    })
}

/**
 * Record a change in requisition
 * @param {number} change - The amount changed (positive for gain, negative for spend)
 * @param {string} playerName - Name of player who caused the change (or 'System')
 * @param {string} reason - Why the change happened
 */
export const recordRequisitionChange = (change, playerName, reason) => {
    const timestamp = getRelativeTimestamp()

    // Get the last known amount to calculate running total
    const lastSnapshot =
        analyticsStore.requisitionSnapshots[analyticsStore.requisitionSnapshots.length - 1]
    const previousAmount = lastSnapshot?.amount || 0
    const newAmount = previousAmount + change

    const snapshot = {
        timestamp,
        amount: newAmount,
        change,
        reason,
        playerName,
    }

    analyticsStore.requisitionSnapshots.push(snapshot)

    addTimelineEvent(ANALYTICS_EVENT_TYPES.REQUISITION_CHANGE, {
        amount: newAmount,
        change,
        reason,
        playerName,
    })
}

/**
 * Record a player death (failed extraction)
 * @param {number} playerId - Player ID
 * @param {string} playerName - Player name
 * @param {number} difficulty - Difficulty level when death occurred
 * @param {number} mission - Mission number when death occurred
 * @param {string} reason - Reason for death
 */
export const recordPlayerDeath = (
    playerId,
    playerName,
    difficulty,
    _mission = 1,
    reason = 'Failed to extract',
) => {
    const timestamp = getRelativeTimestamp()

    // Get total missions completed so far for accurate mission tracking
    const totalMissionsCompleted = analyticsStore.missionResults.length

    const death = {
        timestamp,
        playerId,
        playerName,
        difficulty,
        mission: totalMissionsCompleted + 1, // Current mission being played
        reason,
    }

    analyticsStore.playerDeaths.push(death)

    addTimelineEvent(ANALYTICS_EVENT_TYPES.PLAYER_DEATH, death)
}

/**
 * Record a player extraction
 */
export const recordPlayerExtraction = (playerId, playerName, difficulty, mission = 1) => {
    const timestamp = getRelativeTimestamp()

    const extraction = {
        timestamp,
        playerId,
        playerName,
        difficulty,
        mission,
    }

    analyticsStore.playerExtractions.push(extraction)

    addTimelineEvent(ANALYTICS_EVENT_TYPES.PLAYER_EXTRACT, extraction)
}

/**
 * Record a loadout change for a player
 */
export const recordLoadoutChange = (
    playerId,
    playerName,
    loadout,
    slot,
    itemId,
    reason = 'draft',
) => {
    const timestamp = getRelativeTimestamp()

    if (!analyticsStore.playerLoadouts[playerId]) {
        analyticsStore.playerLoadouts[playerId] = []
    }

    // Deep copy the loadout to avoid reference issues with stratagems array
    const loadoutSnapshot = {
        timestamp,
        loadout: {
            ...loadout,
            stratagems: loadout.stratagems ? [...loadout.stratagems] : [],
        },
        slot,
        itemId,
        reason,
        playerName,
    }

    analyticsStore.playerLoadouts[playerId].push(loadoutSnapshot)

    addTimelineEvent(ANALYTICS_EVENT_TYPES.LOADOUT_CHANGE, {
        playerId,
        playerName,
        slot,
        itemId,
        reason,
    })
}

/**
 * Record an item being sacrificed
 */
export const recordItemSacrifice = (playerId, playerName, itemId, slot, difficulty) => {
    const timestamp = getRelativeTimestamp()

    const sacrifice = {
        timestamp,
        playerId,
        playerName,
        itemId,
        slot,
        difficulty,
    }

    addTimelineEvent(ANALYTICS_EVENT_TYPES.ITEM_SACRIFICED, sacrifice)
}

/**
 * Record a game event occurrence
 */
export const recordGameEvent = (
    eventId,
    eventName,
    eventType,
    outcome,
    difficulty,
    affectedPlayers = [],
) => {
    const timestamp = getRelativeTimestamp()

    const eventOccurrence = {
        timestamp,
        eventId,
        eventName,
        eventType,
        outcome,
        difficulty,
        affectedPlayers,
    }

    analyticsStore.eventOccurrences.push(eventOccurrence)

    addTimelineEvent(ANALYTICS_EVENT_TYPES.GAME_EVENT, eventOccurrence)
}

/**
 * Record mission completion with star rating
 * @param {number} mission - Mission number within operation
 * @param {number} difficulty - Current difficulty level (1-10)
 * @param {number} starRating - Star rating earned (1-5)
 * @param {number} extractedCount - Number of players who extracted
 * @param {number} totalPlayers - Total number of players
 */
export const recordMissionComplete = (
    mission,
    difficulty,
    starRating,
    extractedCount = 0,
    totalPlayers = 1,
) => {
    const timestamp = getRelativeTimestamp()

    const result = {
        timestamp,
        mission,
        difficulty,
        starRating,
        extractedCount,
        totalPlayers,
    }

    analyticsStore.missionResults.push(result)

    addTimelineEvent(ANALYTICS_EVENT_TYPES.MISSION_COMPLETE, result)
}

/**
 * Record difficulty advancement
 */
export const recordDifficultyChange = (oldDifficulty, newDifficulty, reason = 'advance') => {
    addTimelineEvent(ANALYTICS_EVENT_TYPES.DIFFICULTY_CHANGE, {
        oldDifficulty,
        newDifficulty,
        reason,
    })
}

/**
 * Record a draft round completion
 */
export const recordDraftComplete = (playerId, playerName, itemId, slot, difficulty) => {
    const timestamp = getRelativeTimestamp()

    const draft = {
        timestamp,
        playerId,
        playerName,
        itemId,
        slot,
        difficulty,
    }

    analyticsStore.draftHistory.push(draft)

    addTimelineEvent(ANALYTICS_EVENT_TYPES.DRAFT_COMPLETE, draft)
}

/**
 * Record a reroll being used
 */
export const recordRerollUsed = (playerId, playerName, difficulty, cost) => {
    const timestamp = getRelativeTimestamp()

    const reroll = {
        timestamp,
        playerId,
        playerName,
        difficulty,
        cost,
    }

    analyticsStore.rerollHistory.push(reroll)

    addTimelineEvent(ANALYTICS_EVENT_TYPES.REROLL_USED, reroll)
}

/**
 * Finalize the run and calculate final statistics
 */
export const finalizeRun = (outcome, finalState) => {
    analyticsStore.endTime = Date.now()

    // Handle case where analytics wasn't properly initialized
    if (!analyticsStore.startTime) {
        analyticsStore.startTime = analyticsStore.endTime // Duration will be 0
    }

    const finalStats = {
        outcome, // 'victory' or 'defeat'
        duration: analyticsStore.endTime - analyticsStore.startTime,
        finalDifficulty: finalState.currentDiff,
        finalRequisition: finalState.requisition,
        finalSamples: { ...finalState.samples },
        totalMissions: analyticsStore.missionResults.length,
        totalEvents: analyticsStore.eventOccurrences.length,
        totalDeaths: analyticsStore.playerDeaths.length,
        totalDrafts: analyticsStore.draftHistory.length,
        totalRerolls: analyticsStore.rerollHistory.length,
        playerCount: finalState.players.length,
        players: finalState.players.map((p) => ({
            id: p.id,
            name: p.name,
            finalLoadout: { ...p.loadout },
            extracted: p.extracted,
        })),
    }

    analyticsStore.finalStats = finalStats

    addTimelineEvent(ANALYTICS_EVENT_TYPES.RUN_END, {
        outcome,
        finalStats,
    })

    return getAnalyticsSnapshot()
}

/**
 * Get a complete snapshot of the current analytics data
 */
export const getAnalyticsSnapshot = () => ({
    ...analyticsStore,
    // Deep copy arrays to prevent mutation
    timeline: [...analyticsStore.timeline],
    sampleSnapshots: [...analyticsStore.sampleSnapshots],
    requisitionSnapshots: [...analyticsStore.requisitionSnapshots],
    playerDeaths: [...analyticsStore.playerDeaths],
    playerExtractions: [...analyticsStore.playerExtractions],
    missionResults: [...analyticsStore.missionResults],
    eventOccurrences: [...analyticsStore.eventOccurrences],
    draftHistory: [...analyticsStore.draftHistory],
    rerollHistory: [...analyticsStore.rerollHistory],
    playerLoadouts: Object.fromEntries(
        Object.entries(analyticsStore.playerLoadouts).map(([k, v]) => [k, [...v]]),
    ),
})

/**
 * Clear all analytics data (for starting a new run)
 */
export const clearAnalytics = () => {
    analyticsStore = {
        runId: null,
        startTime: null,
        endTime: null,
        timeline: [],
        sampleSnapshots: [],
        requisitionSnapshots: [],
        playerLoadouts: {},
        playerDeaths: [],
        playerExtractions: [],
        missionResults: [],
        eventOccurrences: [],
        draftHistory: [],
        rerollHistory: [],
        gameConfig: null,
        finalStats: null,
    }
}

/**
 * Check if analytics is currently active
 */
export const isAnalyticsActive = () =>
    analyticsStore.runId !== null && analyticsStore.endTime === null

/**
 * Get the current run ID
 */
export const getRunId = () => analyticsStore.runId

/**
 * Export analytics data for storage/sharing
 */
export const exportAnalyticsData = () => {
    const snapshot = getAnalyticsSnapshot()
    return {
        version: 1,
        exportedAt: Date.now(),
        ...snapshot,
    }
}

/**
 * Import analytics data (for viewing past runs)
 */
export const importAnalyticsData = (data) => {
    if (!data || data.version !== 1) {
        console.warn('Invalid analytics data format')
        return false
    }

    analyticsStore = {
        runId: data.runId,
        startTime: data.startTime,
        endTime: data.endTime,
        timeline: data.timeline || [],
        sampleSnapshots: data.sampleSnapshots || [],
        requisitionSnapshots: data.requisitionSnapshots || [],
        playerLoadouts: data.playerLoadouts || {},
        playerDeaths: data.playerDeaths || [],
        playerExtractions: data.playerExtractions || [],
        missionResults: data.missionResults || [],
        eventOccurrences: data.eventOccurrences || [],
        draftHistory: data.draftHistory || [],
        rerollHistory: data.rerollHistory || [],
        gameConfig: data.gameConfig || null,
        finalStats: data.finalStats || null,
    }

    return true
}

/**
 * Get formatted data for charts
 */
export const getChartData = () => ({
    // Samples over time with event annotations
    samplesData: analyticsStore.sampleSnapshots.map((s) => ({
        time: s.timestamp,
        common: s.common,
        rare: s.rare,
        superRare: s.superRare,
        event: s.eventName,
    })),

    // Requisition over time with spend annotations
    requisitionData: analyticsStore.requisitionSnapshots.map((r) => ({
        time: r.timestamp,
        amount: r.amount,
        change: r.change,
        reason: r.reason,
        player: r.playerName,
    })),

    // Player loadout timeline for Gantt chart
    loadoutTimeline: Object.entries(analyticsStore.playerLoadouts).map(([playerId, loadouts]) => ({
        playerId: parseInt(playerId),
        playerName: loadouts[0]?.playerName || `Player ${playerId}`,
        changes: loadouts,
    })),

    // Mission star results for radar chart
    missionStars: analyticsStore.missionResults,

    // Death timeline
    deathTimeline: analyticsStore.playerDeaths,

    // Event markers for annotations
    eventMarkers: analyticsStore.eventOccurrences.map((e) => ({
        time: e.timestamp,
        name: e.eventName,
        type: e.eventType,
        difficulty: e.difficulty,
    })),
})

/**
 * Register a late-joining player in analytics
 * This adds their initial loadout snapshot so they appear in the analytics
 */
export const registerLatePlayer = (player) => {
    if (!analyticsStore.runId) {
        console.warn('Cannot register late player: analytics not initialized')
        return
    }

    const playerId = player.id
    const timestamp = getRelativeTimestamp()

    // Skip if player already registered
    if (
        analyticsStore.playerLoadouts[playerId] &&
        analyticsStore.playerLoadouts[playerId].length > 0
    ) {
        return
    }

    // Add initial loadout snapshot for the late-joining player
    analyticsStore.playerLoadouts[playerId] = [
        {
            timestamp,
            loadout: {
                ...player.loadout,
                stratagems: player.loadout?.stratagems ? [...player.loadout.stratagems] : [],
            },
            reason: 'late-join',
            playerName: player.name || `Helldiver ${playerId}`,
        },
    ]

    // Record the join event in timeline
    addTimelineEvent(ANALYTICS_EVENT_TYPES.RUN_START, {
        type: 'PLAYER_JOINED',
        playerId,
        playerName: player.name,
    })
}

// Bundle all exports for convenience
const runAnalytics = {
    initializeAnalytics,
    recordSampleChange,
    recordRequisitionChange,
    recordPlayerDeath,
    recordPlayerExtraction,
    recordLoadoutChange,
    recordItemSacrifice,
    recordGameEvent,
    recordMissionComplete,
    recordDifficultyChange,
    recordDraftComplete,
    recordRerollUsed,
    finalizeRun,
    getAnalyticsSnapshot,
    clearAnalytics,
    isAnalyticsActive,
    getRunId,
    exportAnalyticsData,
    importAnalyticsData,
    getChartData,
    registerLatePlayer,
    ANALYTICS_EVENT_TYPES,
}

export default runAnalytics
