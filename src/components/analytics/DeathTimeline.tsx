/**
 * Death Timeline Component
 *
 * Displays a visual timeline of player deaths/sacrifices throughout the run
 * X-axis shows mission numbers instead of time
 */

import React from 'react'
import { COLORS } from '../../constants/theme'
import { DIFFICULTY_CONFIG } from '../../constants/gameConfig'
import type { PlayerDeath } from '../../state/analyticsStore'

interface PlayerInfo {
    id: string
    name: string
}

// Get difficulty name
const getDifficultyName = (level: number): string => {
    const config = DIFFICULTY_CONFIG.find((d) => d.level === level)
    return config?.name || `D${level}`
}

// Player colors
const PLAYER_COLORS = [
    COLORS.ACCENT_BLUE,
    COLORS.ACCENT_GREEN,
    COLORS.ACCENT_PURPLE,
    COLORS.PRIMARY,
]

interface DeathTimelineProps {
    data: PlayerDeath[]
    totalMissions?: number
    players?: PlayerInfo[]
}

const DeathTimeline = ({
    data,
    totalMissions = 10,
    players = [],
}: DeathTimelineProps): React.ReactElement => {
    if (!data || data.length === 0) {
        return (
            <div
                style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.TEXT_MUTED,
                    backgroundColor: COLORS.CARD_INNER,
                    borderRadius: '8px',
                    border: `1px solid ${COLORS.CARD_BORDER}`,
                }}
            >
                <span style={{ fontSize: '32px', marginBottom: '8px' }}>🎖️</span>
                <span style={{ fontSize: '14px' }}>No casualties this run!</span>
                <span style={{ fontSize: '11px', marginTop: '4px', color: COLORS.TEXT_MUTED }}>
                    All Helldivers extracted successfully
                </span>
            </div>
        )
    }

    // Build player index map for colors
    const playerColorMap: Record<string, string> = {}
    players.forEach((player, index) => {
        playerColorMap[player.id] = PLAYER_COLORS[index % PLAYER_COLORS.length]
    })

    // Find the max mission number from deaths
    const maxMission = Math.max(...data.map((d) => d.mission || 1), totalMissions)

    // Generate mission markers (1 through maxMission)
    const missionMarkers = []
    for (let i = 1; i <= maxMission; i++) {
        missionMarkers.push(i)
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
                    margin: '0 0 16px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                <span style={{ fontSize: '18px' }}>💀</span>
                Casualty Report
                <span
                    style={{
                        marginLeft: 'auto',
                        backgroundColor: COLORS.ACCENT_RED,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                    }}
                >
                    {data.length} KIA
                </span>
            </h3>

            {/* Timeline visualization */}
            <div
                style={{
                    position: 'relative',
                    padding: '20px 0',
                    marginBottom: '16px',
                }}
            >
                {/* Timeline axis */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '0',
                        right: '0',
                        height: '2px',
                        backgroundColor: COLORS.CARD_BORDER,
                        transform: 'translateY(-50%)',
                    }}
                />

                {/* Mission markers */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '40px',
                        padding: '0 10px',
                    }}
                >
                    {missionMarkers.map((mission) => (
                        <div
                            key={mission}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                position: 'relative',
                            }}
                        >
                            <span
                                style={{
                                    color: COLORS.TEXT_MUTED,
                                    fontSize: '10px',
                                }}
                            >
                                M{mission}
                            </span>
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    width: '1px',
                                    height: '20px',
                                    backgroundColor: COLORS.CARD_BORDER,
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Death markers */}
                <div
                    style={{
                        position: 'relative',
                        height: '60px',
                        marginTop: '20px',
                        padding: '0 10px',
                    }}
                >
                    {data.map((death, index) => {
                        const mission = death.mission || 1
                        // Position based on mission number (1-indexed to percentage)
                        const position =
                            maxMission > 1 ? ((mission - 1) / (maxMission - 1)) * 100 : 50
                        const playerColor = playerColorMap[death.playerId] || COLORS.ACCENT_RED

                        // Offset deaths at same mission to prevent overlap
                        const deathsAtSameMission = data.filter((d) => (d.mission || 1) === mission)
                        const deathIndex = deathsAtSameMission.indexOf(death)
                        const verticalOffset = deathIndex * 45 // Stagger vertically

                        return (
                            <div
                                key={index}
                                style={{
                                    position: 'absolute',
                                    left: `${position}%`,
                                    top: `calc(50% + ${verticalOffset}px)`,
                                    transform: 'translate(-50%, -50%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    zIndex: 10 - deathIndex,
                                }}
                                title={`${death.playerName} - ${getDifficultyName(death.difficulty)} - Mission ${mission}`}
                            >
                                {/* Skull marker */}
                                <div
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: COLORS.ACCENT_RED,
                                        border: `3px solid ${playerColor}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: `0 0 10px ${COLORS.ACCENT_RED}`,
                                        animation: 'pulse 2s infinite',
                                    }}
                                >
                                    <span style={{ fontSize: '16px' }}>💀</span>
                                </div>

                                {/* Player name label */}
                                <div
                                    style={{
                                        marginTop: '8px',
                                        padding: '2px 6px',
                                        backgroundColor: playerColor,
                                        borderRadius: '4px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <span
                                        style={{
                                            color: 'white',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {death.playerName}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Death details list */}
            <div
                style={{
                    borderTop: `1px solid ${COLORS.CARD_BORDER}`,
                    paddingTop: '16px',
                }}
            >
                <p
                    style={{
                        color: COLORS.TEXT_MUTED,
                        fontSize: '11px',
                        margin: '0 0 12px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    Fallen Helldivers
                </p>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                    }}
                >
                    {data.map((death, index) => {
                        const playerColor = playerColorMap[death.playerId] || COLORS.ACCENT_RED

                        return (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 12px',
                                    backgroundColor: COLORS.CARD_BG,
                                    borderRadius: '6px',
                                    border: `1px solid ${COLORS.CARD_BORDER}`,
                                    borderLeft: `4px solid ${playerColor}`,
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>💀</span>

                                <div style={{ flex: 1 }}>
                                    <p
                                        style={{
                                            color: playerColor,
                                            margin: 0,
                                            fontSize: '13px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {death.playerName}
                                    </p>
                                    <p
                                        style={{
                                            color: COLORS.TEXT_MUTED,
                                            margin: '2px 0 0 0',
                                            fontSize: '11px',
                                        }}
                                    >
                                        {death.reason || 'Sacrificed for Democracy'}
                                    </p>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <p
                                        style={{
                                            color: COLORS.ACCENT_RED,
                                            margin: 0,
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {getDifficultyName(death.difficulty)}
                                    </p>
                                    <p
                                        style={{
                                            color: COLORS.TEXT_MUTED,
                                            margin: '2px 0 0 0',
                                            fontSize: '10px',
                                        }}
                                    >
                                        Mission {death.mission || 1}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* CSS for pulse animation */}
            <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 10px ${COLORS.ACCENT_RED}; }
          50% { box-shadow: 0 0 20px ${COLORS.ACCENT_RED}, 0 0 30px ${COLORS.ACCENT_RED}; }
        }
      `}</style>
        </div>
    )
}

export default DeathTimeline
