/**
 * Death Timeline Component
 *
 * Displays a visual timeline of player deaths/sacrifices throughout the run
 * X-axis shows mission numbers instead of time
 */

import React from 'react'
import styled, { keyframes } from 'styled-components'
import { COLORS } from '../../constants/theme'
import { DIFFICULTY_CONFIG } from '../../constants/gameConfig'
import { Card, Text, Caption, Flex } from '../../styles'
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

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ChartCard = styled(Card)`
    background-color: ${({ theme }) => theme.colors.cardInner};
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: ${({ theme }) => theme.spacing.lg};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const ChartTitle = styled.h3`
    color: ${({ theme }) => theme.colors.textPrimary};
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    gap: 8px;
`

const EmptyState = styled.div`
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.textMuted};
    background-color: ${({ theme }) => theme.colors.cardInner};
    border-radius: ${({ theme }) => theme.radii.lg};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const KIABadge = styled.span`
    margin-left: auto;
    background-color: ${({ theme }) => theme.colors.accentRed};
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
`

const TimelineAxis = styled.div`
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.cardBorder};
    transform: translateY(-50%);
`

const MissionTick = styled.span`
    position: absolute;
    top: 16px;
    width: 1px;
    height: 20px;
    background-color: ${({ theme }) => theme.colors.cardBorder};
`

const pulse = keyframes`
    0%, 100% { box-shadow: 0 0 10px ${COLORS.ACCENT_RED}; }
    50% { box-shadow: 0 0 20px ${COLORS.ACCENT_RED}, 0 0 30px ${COLORS.ACCENT_RED}; }
`

const SkullMarker = styled.div<{ $playerColor: string }>`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.colors.accentRed};
    border: 3px solid ${({ $playerColor }) => $playerColor};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.accentRed};
    animation: ${pulse} 2s infinite;
`

const PlayerLabel = styled.div<{ $playerColor: string }>`
    margin-top: 8px;
    padding: 2px 6px;
    background-color: ${({ $playerColor }) => $playerColor};
    border-radius: 4px;
    white-space: nowrap;
`

const DeathDetailsList = styled.div`
    border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
    padding-top: 16px;
`

const DeathCard = styled.div<{ $playerColor: string }>`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background-color: ${({ theme }) => theme.colors.cardBg};
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    border-left: 4px solid ${({ $playerColor }) => $playerColor};
`

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
            <EmptyState>
                <span style={{ fontSize: '32px', marginBottom: '8px' }}>🎖️</span>
                <Text $size="sm">No casualties this run!</Text>
                <Caption style={{ marginTop: '4px' }}>
                    All Helldivers extracted successfully
                </Caption>
            </EmptyState>
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
        <ChartCard>
            <ChartTitle>
                <span style={{ fontSize: '18px' }}>💀</span>
                Casualty Report
                <KIABadge>{data.length} KIA</KIABadge>
            </ChartTitle>

            {/* Timeline visualization */}
            <div style={{ position: 'relative', padding: '20px 0', marginBottom: '16px' }}>
                {/* Timeline axis */}
                <TimelineAxis />

                {/* Mission markers */}
                <Flex $justify="between" style={{ marginBottom: '40px', padding: '0 10px' }}>
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
                            <Caption>M{mission}</Caption>
                            <MissionTick />
                        </div>
                    ))}
                </Flex>

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
                                <SkullMarker $playerColor={playerColor}>
                                    <span>💀</span>
                                </SkullMarker>

                                {/* Player name label */}
                                <PlayerLabel $playerColor={playerColor}>
                                    <Text
                                        style={{
                                            color: 'white',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {death.playerName}
                                    </Text>
                                </PlayerLabel>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Death details list */}
            <DeathDetailsList>
                <Caption
                    style={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '12px',
                    }}
                >
                    Fallen Helldivers
                </Caption>

                <Flex $direction="column" $gap="sm">
                    {data.map((death, index) => {
                        const playerColor = playerColorMap[death.playerId] || COLORS.ACCENT_RED

                        return (
                            <DeathCard key={index} $playerColor={playerColor}>
                                <span style={{ fontSize: '20px' }}>💀</span>

                                <div style={{ flex: 1 }}>
                                    <Text style={{ color: playerColor, fontWeight: 'bold' }}>
                                        {death.playerName}
                                    </Text>
                                    <Caption style={{ marginTop: '2px' }}>
                                        {death.reason || 'Sacrificed for Democracy'}
                                    </Caption>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <Text $color="error" $size="sm" style={{ fontWeight: 'bold' }}>
                                        {getDifficultyName(death.difficulty)}
                                    </Text>
                                    <Caption style={{ marginTop: '2px' }}>
                                        Mission {death.mission || 1}
                                    </Caption>
                                </div>
                            </DeathCard>
                        )
                    })}
                </Flex>
            </DeathDetailsList>
        </ChartCard>
    )
}

export default DeathTimeline
