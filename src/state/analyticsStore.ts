/**
 * Analytics Store for Post-Run Statistics
 *
 * Tracks timeline-based events throughout a game run for visualization
 * in victory/game over screens.
 */

import type { GameConfig, Player, Loadout, Samples } from '../types'

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
} as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[keyof typeof ANALYTICS_EVENT_TYPES]

// Type definitions for analytics data
export interface TimelineEvent {
    id: string
    type: AnalyticsEventType
    timestamp: number
    absoluteTime: number
    [key: string]: unknown
}

export interface SampleSnapshot {
    timestamp: number
    common: number
    rare: number
    superRare: number
    change?: {
        common: number
        rare: number
        superRare: number
    }
    reason?: string
    eventName?: string | null
}

export interface RequisitionSnapshot {
    timestamp: number
    amount: number
    change: number
    reason: string
    playerName?: string
}

export interface LoadoutSnapshot {
    timestamp: number
    loadout: Loadout
    slot?: string
    itemId?: string
    reason: string
    playerName: string
}

export interface PlayerDeath {
    timestamp: number
    playerId: string
    playerName: string
    difficulty: number
    mission: number
    reason: string
}

export interface PlayerExtraction {
    timestamp: number
    playerId: string
    playerName: string
    difficulty: number
    mission: number
}

export interface MissionResult {
    timestamp: number
    mission: number
    difficulty: number
    starRating: number
    extractedCount: number
    totalPlayers: number
}

export interface EventOccurrence {
    timestamp: number
    eventId: string
    eventName: string
    eventType: string
    outcome: string
    difficulty: number
    affectedPlayers: string[]
}

export interface DraftRecord {
    timestamp: number
    playerId: string
    playerName: string
    itemId: string
    slot: string
    difficulty: number
}

export interface RerollRecord {
    timestamp: number
    playerId: string
    playerName: string
    difficulty: number
    cost: number
}

export interface FinalStats {
    outcome: 'victory' | 'defeat'
    duration: number
    finalDifficulty: number
    finalRequisition: number
    finalSamples: Samples
    totalMissions: number
    totalEvents: number
    totalDeaths: number
    totalDrafts: number
    totalRerolls: number
    playerCount: number
    players: Array<{
        id: string
        name: string
        finalLoadout: Loadout
        extracted: boolean
    }>
}

export interface AnalyticsStore {
    runId: string | null
    startTime: number | null
    endTime: number | null
    timeline: TimelineEvent[]
    sampleSnapshots: SampleSnapshot[]
    requisitionSnapshots: RequisitionSnapshot[]
    playerLoadouts: Record<string, LoadoutSnapshot[]>
    playerDeaths: PlayerDeath[]
    playerExtractions: PlayerExtraction[]
    missionResults: MissionResult[]
    eventOccurrences: EventOccurrence[]
    draftHistory: DraftRecord[]
    rerollHistory: RerollRecord[]
    gameConfig: GameConfig | null
    finalStats: FinalStats | null
}

// The analytics store - holds all tracked data for the current run
let analyticsStore: AnalyticsStore = {
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

/**
 * Generate a unique run ID
 */
const generateRunId = (): string => `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

/**
 * Get current timestamp relative to run start
 */
const getRelativeTimestamp = (): number => {
    if (!analyticsStore.startTime) return 0
    return Date.now() - analyticsStore.startTime
}

/**
 * Initialize a new analytics session for a run
 */
export const initializeAnalytics = (gameConfig: GameConfig, players: Player[]): string => {
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
const addTimelineEvent = <T extends object>(type: AnalyticsEventType, data: T): TimelineEvent => {
    const event: TimelineEvent = {
        id: `evt_${analyticsStore.timeline.length}`,
        type,
        timestamp: getRelativeTimestamp(),
        absoluteTime: Date.now(),
        ...(data as Record<string, unknown>),
    }
    analyticsStore.timeline.push(event)
    return event
}

/**
 * Record a change in sample counts
 */
export const recordSampleChange = (
    samples: Samples,
    reason: string,
    eventName: string | null = null,
): void => {
    const timestamp = getRelativeTimestamp()
    const lastSnapshot = analyticsStore.sampleSnapshots[
        analyticsStore.sampleSnapshots.length - 1
    ] || { common: 0, rare: 0, superRare: 0 }

    const snapshot: SampleSnapshot = {
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
 * @param change - The amount changed (positive for gain, negative for spend)
 * @param playerName - Name of player who caused the change (or 'System')
 * @param reason - Why the change happened
 */
export const recordRequisitionChange = (
    change: number,
    playerName: string,
    reason: string,
): void => {
    const timestamp = getRelativeTimestamp()

    // Get the last known amount to calculate running total
    const lastSnapshot =
        analyticsStore.requisitionSnapshots[analyticsStore.requisitionSnapshots.length - 1]
    const previousAmount = lastSnapshot?.amount || 0
    const newAmount = previousAmount + change

    const snapshot: RequisitionSnapshot = {
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
 * @param playerId - Player ID
 * @param playerName - Player name
 * @param difficulty - Difficulty level when death occurred
 * @param _mission - Mission number when death occurred (unused, calculated from results)
 * @param reason - Reason for death
 */
export const recordPlayerDeath = (
    playerId: string,
    playerName: string,
    difficulty: number,
    _mission: number = 1,
    reason: string = 'Failed to extract',
): void => {
    const timestamp = getRelativeTimestamp()

    // Get total missions completed so far for accurate mission tracking
    const totalMissionsCompleted = analyticsStore.missionResults.length

    const death: PlayerDeath = {
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
 * Record a loadout change for a player
 */
export const recordLoadoutChange = (
    playerId: string,
    playerName: string,
    loadout: Loadout,
    slot: string,
    itemId: string,
    reason: string = 'draft',
): void => {
    const timestamp = getRelativeTimestamp()

    if (!analyticsStore.playerLoadouts[playerId]) {
        analyticsStore.playerLoadouts[playerId] = []
    }

    // Deep copy the loadout to avoid reference issues with stratagems array
    const loadoutSnapshot: LoadoutSnapshot = {
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
 * Record a game event occurrence
 */
export const recordGameEvent = (
    eventId: string,
    eventName: string,
    eventType: string,
    outcome: string,
    difficulty: number,
    affectedPlayers: string[] = [],
): void => {
    const timestamp = getRelativeTimestamp()

    const eventOccurrence: EventOccurrence = {
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
 * @param mission - Mission number within operation
 * @param difficulty - Current difficulty level (1-10)
 * @param starRating - Star rating earned (1-5)
 * @param extractedCount - Number of players who extracted
 * @param totalPlayers - Total number of players
 */
export const recordMissionComplete = (
    mission: number,
    difficulty: number,
    starRating: number,
    extractedCount: number = 0,
    totalPlayers: number = 1,
): void => {
    const timestamp = getRelativeTimestamp()

    const result: MissionResult = {
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
 * Record a draft round completion
 */
export const recordDraftComplete = (
    playerId: string,
    playerName: string,
    itemId: string,
    slot: string,
    difficulty: number,
): void => {
    const timestamp = getRelativeTimestamp()

    const draft: DraftRecord = {
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
export const recordRerollUsed = (
    playerId: string,
    playerName: string,
    difficulty: number,
    cost: number,
): void => {
    const timestamp = getRelativeTimestamp()

    const reroll: RerollRecord = {
        timestamp,
        playerId,
        playerName,
        difficulty,
        cost,
    }

    analyticsStore.rerollHistory.push(reroll)

    addTimelineEvent(ANALYTICS_EVENT_TYPES.REROLL_USED, reroll)
}

interface FinalState {
    currentDiff: number
    requisition: number
    samples: Samples
    players: Player[]
}

/**
 * Finalize the run and calculate final statistics
 */
export const finalizeRun = (
    outcome: 'victory' | 'defeat',
    finalState: FinalState,
): AnalyticsStore => {
    analyticsStore.endTime = Date.now()

    // Handle case where analytics wasn't properly initialized
    if (!analyticsStore.startTime) {
        analyticsStore.startTime = analyticsStore.endTime // Duration will be 0
    }

    const finalStats: FinalStats = {
        outcome,
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
export const getAnalyticsSnapshot = (): AnalyticsStore => ({
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
export const clearAnalytics = (): void => {
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
 * Register a late-joining player in analytics
 * This adds their initial loadout snapshot so they appear in the analytics
 */
export const registerLatePlayer = (player: Player): void => {
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
