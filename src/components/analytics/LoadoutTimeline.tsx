/**
 * Loadout Timeline (Mission-based Grid)
 *
 * Displays each player's loadout changes across missions in a grid format
 * Merges duplicate consecutive items into single cells
 * Uses timestamps to correctly map loadout changes to mission phases
 */

import React from 'react'
import { COLORS } from '../../constants/theme'
import { getItemById } from '../../utils/itemHelpers'
import type { LoadoutSnapshot, MissionResult } from '../../state/analyticsStore'
import type { Loadout } from '../../types'

// Get item name from ID
const getItemName = (itemId: string | null | undefined): string => {
    if (!itemId) return 'Empty'
    const item = getItemById(itemId)
    return item?.name || itemId
}

interface SlotConfig {
    label: string
    icon: string
    color: string
}

// Slot display configuration
const SLOT_CONFIG: Record<string, SlotConfig> = {
    primary: { label: 'Primary', icon: '🔫', color: COLORS.ACCENT_RED },
    secondary: { label: 'Secondary', icon: '🔫', color: COLORS.ACCENT_BLUE },
    grenade: { label: 'Grenade', icon: '💣', color: COLORS.ACCENT_GREEN },
    armor: { label: 'Armor', icon: '🛡️', color: COLORS.ACCENT_PURPLE },
    booster: { label: 'Booster', icon: '⚡', color: COLORS.PRIMARY },
    stratagem0: { label: 'Stratagem 1', icon: '📡', color: COLORS.TERMINIDS },
    stratagem1: { label: 'Stratagem 2', icon: '📡', color: COLORS.TERMINIDS },
    stratagem2: { label: 'Stratagem 3', icon: '📡', color: COLORS.TERMINIDS },
    stratagem3: { label: 'Stratagem 4', icon: '📡', color: COLORS.TERMINIDS },
}

/**
 * Get the slot value from a loadout change
 */
const getSlotValue = (change: LoadoutSnapshot, slot: string): string => {
    if (!change?.loadout) return 'Empty'

    if (slot.startsWith('stratagem')) {
        const slotIndex = parseInt(slot.replace('stratagem', ''), 10)
        const stratagems = change.loadout.stratagems || []
        return getItemName(stratagems[slotIndex])
    }

    return getItemName(change.loadout[slot as keyof Loadout] as string | null | undefined)
}

interface MergedSegment {
    value: string
    startMission: number
    endMission: number
    span: number
    isEmpty: boolean
}

/**
 * Build merged segments from changes using timestamp-based mission mapping
 *
 * Each mission boundary is defined by missionTimestamps (from missionStars).
 * A loadout change applies to all missions AFTER it occurred until the next change.
 */
const buildMergedSegments = (
    changes: LoadoutSnapshot[],
    slot: string,
    totalMissions: number,
    missionTimestamps: MissionResult[],
): MergedSegment[] => {
    if (!changes || changes.length === 0) return []

    // Sort changes by timestamp to ensure correct order
    const sortedChanges = [...changes].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

    // Build mission boundaries from timestamps
    // Mission N is the time period BEFORE missionTimestamps[N-1] (mission N completion)
    // So mission 1 ends at missionTimestamps[0], mission 2 ends at missionTimestamps[1], etc.

    // Get value for each mission
    const missionValues = []

    for (let mission = 1; mission <= totalMissions; mission++) {
        // Find the mission end timestamp (when mission N was completed)
        // If no timestamp data, use index-based approach
        const missionEndTime = missionTimestamps?.[mission - 1]?.timestamp

        // Find the last change that occurred BEFORE this mission ended
        // (i.e., the loadout state during this mission)
        let relevantChange = sortedChanges[0] // Start with initial loadout

        if (missionEndTime !== undefined) {
            // Timestamp-based: find last change before mission ended
            for (const change of sortedChanges) {
                if ((change.timestamp || 0) <= missionEndTime) {
                    relevantChange = change
                } else {
                    break // Changes after this mission don't apply
                }
            }
        } else {
            // Fallback: Use draft round mapping
            // Each draft happens before a mission, so use proportional mapping
            // Find which change index corresponds to this mission
            const changesPerMission = sortedChanges.length / totalMissions
            const changeIndex = Math.min(
                Math.floor((mission - 1) * changesPerMission),
                sortedChanges.length - 1,
            )
            relevantChange = sortedChanges[changeIndex] || sortedChanges[sortedChanges.length - 1]
        }

        missionValues.push(getSlotValue(relevantChange, slot))
    }

    // Merge consecutive identical values into segments
    const segments: MergedSegment[] = []
    let currentSegment: MergedSegment | null = null

    missionValues.forEach((value, index) => {
        const mission = index + 1

        if (!currentSegment || currentSegment.value !== value) {
            if (currentSegment) {
                segments.push(currentSegment)
            }
            currentSegment = {
                value,
                startMission: mission,
                endMission: mission,
                span: 1,
                isEmpty: value === 'Empty',
            }
        } else {
            currentSegment.endMission = mission
            currentSegment.span++
        }
    })

    if (currentSegment) {
        segments.push(currentSegment)
    }

    return segments
}

interface SlotRowProps {
    changes: LoadoutSnapshot[]
    slot: string
    totalMissions: number
    missionTimestamps: MissionResult[]
}

// Slot row component
const SlotRow = ({
    changes,
    slot,
    totalMissions,
    missionTimestamps,
}: SlotRowProps): React.ReactElement => {
    const config = SLOT_CONFIG[slot] || { label: slot, icon: '📦', color: COLORS.ACCENT_BLUE }
    const segments = buildMergedSegments(changes, slot, totalMissions, missionTimestamps)

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '2px',
            }}
        >
            {/* Slot label */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '90px',
                    flexShrink: 0,
                }}
            >
                <span style={{ fontSize: '11px' }}>{config.icon}</span>
                <span
                    style={{
                        color: COLORS.TEXT_MUTED,
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    {config.label}
                </span>
            </div>

            {/* Mission cells */}
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    gap: '1px',
                }}
            >
                {segments.map((segment, index) => (
                    <div
                        key={index}
                        style={{
                            flex: segment.span,
                            minWidth: 0,
                            height: '22px',
                            backgroundColor: segment.isEmpty ? 'transparent' : config.color,
                            opacity: segment.isEmpty ? 1 : 0.8,
                            border: segment.isEmpty ? `1px dashed ${COLORS.CARD_BORDER}` : 'none',
                            borderRadius: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 4px',
                            overflow: 'hidden',
                        }}
                        title={`${segment.value} (Mission ${segment.startMission}${segment.span > 1 ? `-${segment.endMission}` : ''})`}
                    >
                        <span
                            style={{
                                color: segment.isEmpty ? COLORS.TEXT_MUTED : 'white',
                                fontSize: '9px',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                textShadow: segment.isEmpty ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                                fontStyle: segment.isEmpty ? 'italic' : 'normal',
                            }}
                        >
                            {segment.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

interface PlayerTimelineProps {
    playerId: number
    playerName: string
    changes: LoadoutSnapshot[]
    totalMissions: number
    playerIndex: number
    missionTimestamps: MissionResult[]
}

// Player timeline component
const PlayerTimeline = ({
    playerId: _playerId,
    playerName,
    changes,
    totalMissions,
    playerIndex,
    missionTimestamps,
}: PlayerTimelineProps): React.ReactElement | null => {
    if (!changes || changes.length === 0) return null

    // Colors for different players
    const playerColors = [
        COLORS.ACCENT_BLUE,
        COLORS.ACCENT_GREEN,
        COLORS.ACCENT_PURPLE,
        COLORS.PRIMARY,
    ]
    const playerColor = playerColors[playerIndex % playerColors.length]

    const slots = [
        'primary',
        'secondary',
        'grenade',
        'armor',
        'booster',
        'stratagem0',
        'stratagem1',
        'stratagem2',
        'stratagem3',
    ]

    return (
        <div
            style={{
                marginBottom: '12px',
                padding: '12px',
                backgroundColor: COLORS.CARD_BG,
                borderRadius: '8px',
                border: `1px solid ${COLORS.CARD_BORDER}`,
                borderLeft: `3px solid ${playerColor}`,
            }}
        >
            {/* Player header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                }}
            >
                <span
                    style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: playerColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                    }}
                >
                    {playerIndex + 1}
                </span>
                <span
                    style={{
                        color: playerColor,
                        fontSize: '13px',
                        fontWeight: '600',
                    }}
                >
                    {playerName}
                </span>
            </div>

            {/* Slot rows */}
            {slots.map((slot) => (
                <SlotRow
                    key={slot}
                    changes={changes}
                    slot={slot}
                    totalMissions={totalMissions}
                    missionTimestamps={missionTimestamps}
                />
            ))}
        </div>
    )
}

interface PlayerLoadoutData {
    playerId: number
    playerName: string
    changes: LoadoutSnapshot[]
}

interface LoadoutTimelineProps {
    data: PlayerLoadoutData[]
    totalMissions?: number
    missionStars?: MissionResult[]
}

const LoadoutTimeline = ({
    data,
    totalMissions = 10,
    missionStars = [],
}: LoadoutTimelineProps): React.ReactElement => {
    if (!data || data.length === 0) {
        return (
            <div
                style={{
                    padding: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.TEXT_MUTED,
                    backgroundColor: COLORS.CARD_INNER,
                    borderRadius: '8px',
                }}
            >
                No loadout data recorded
            </div>
        )
    }

    // Filter out any ghost players that might have empty data
    // Also filter out players whose playerId doesn't match a real player index
    const validPlayers = data.filter(
        (player) =>
            player.changes &&
            player.changes.length > 0 &&
            player.playerName &&
            // Ensure player ID is a reasonable value (0-3 for 4 player max)
            player.playerId >= 0 &&
            player.playerId < 4,
    )

    // Also deduplicate by player name (in case of duplicate entries)
    const uniquePlayers = []
    const seenNames = new Set()
    for (const player of validPlayers) {
        if (!seenNames.has(player.playerName)) {
            seenNames.add(player.playerName)
            uniquePlayers.push(player)
        }
    }

    if (uniquePlayers.length === 0) {
        return (
            <div
                style={{
                    padding: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.TEXT_MUTED,
                    backgroundColor: COLORS.CARD_INNER,
                    borderRadius: '8px',
                }}
            >
                No loadout data recorded
            </div>
        )
    }

    return (
        <div
            style={{
                backgroundColor: COLORS.CARD_INNER,
                borderRadius: '8px',
                padding: '16px',
                border: `1px solid ${COLORS.CARD_BORDER}`,
            }}
        >
            <h3
                style={{
                    color: COLORS.TEXT_PRIMARY,
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                <span style={{ fontSize: '18px' }}>🎒</span>
                Loadout Evolution
            </h3>

            {/* Mission axis header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: `1px solid ${COLORS.CARD_BORDER}`,
                }}
            >
                <div style={{ minWidth: '90px', flexShrink: 0 }} />
                <div
                    style={{
                        display: 'flex',
                        flex: 1,
                        gap: '1px',
                    }}
                >
                    {Array.from({ length: totalMissions }, (_, i) => (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                color: COLORS.TEXT_MUTED,
                                fontSize: '9px',
                                fontWeight: '500',
                            }}
                        >
                            M{i + 1}
                        </div>
                    ))}
                </div>
            </div>

            {/* Player timelines */}
            {uniquePlayers.map((player, index) => (
                <PlayerTimeline
                    key={player.playerId}
                    playerId={player.playerId}
                    playerName={player.playerName}
                    changes={player.changes}
                    totalMissions={totalMissions}
                    playerIndex={index}
                    missionTimestamps={missionStars}
                />
            ))}
        </div>
    )
}

export default LoadoutTimeline
