/**
 * Mission Radar Chart
 *
 * Displays mission star ratings in a radar/spider chart format
 */

import React from 'react'
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import styled from 'styled-components'
import { COLORS, getFactionColors } from '../../constants/theme'
import { DIFFICULTY_CONFIG } from '../../constants/gameConfig'
import { Card, Text, Caption, Flex } from '../../styles'
import type { MissionResult } from '../../state/analyticsStore'
import type { Faction } from '../../types'

interface DifficultyDataPoint {
    difficulty: number
    difficultyName: string
    stars: number
    count: number
    avgStars?: string
    displayName?: string
}

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
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    gap: 8px;
`

const EmptyState = styled.div<{ $height: number }>`
    height: ${({ $height }) => $height}px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.textMuted};
    background-color: ${({ theme }) => theme.colors.cardInner};
    border-radius: ${({ theme }) => theme.radii.lg};
`

const ChartTooltip = styled.div`
    background-color: ${({ theme }) => theme.colors.cardBg};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`

const CenterDisplay = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: none;
`

const MissionSummary = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const MissionCard = styled.div`
    text-align: center;
    padding: 8px;
    background-color: ${({ theme }) => theme.colors.cardBg};
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{ payload?: DifficultyDataPoint }>
}

// Custom tooltip
const CustomTooltip = ({ active, payload }: CustomTooltipProps): React.ReactElement | null => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]?.payload
    if (!data) return null

    return (
        <ChartTooltip>
            <Text $color="primary" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {data?.difficultyName}
            </Text>
            <Text $color="secondary" $size="sm" style={{ marginBottom: '4px' }}>
                Star Rating: {'⭐'.repeat(data?.stars || 0)}
            </Text>
            {data?.count > 1 && (
                <Caption style={{ fontStyle: 'italic' }}>
                    Played {data.count} times (avg: {data.avgStars}⭐)
                </Caption>
            )}
        </ChartTooltip>
    )
}

interface MissionRadarProps {
    data: MissionResult[]
    faction?: Faction | string
    height?: number
}

const MissionRadar = ({
    data,
    faction = 'terminid',
    height = 300,
}: MissionRadarProps): React.ReactElement => {
    const factionColors = getFactionColors(faction as string)

    if (!data || data.length === 0) {
        return <EmptyState $height={height}>No mission data recorded</EmptyState>
    }

    // Transform mission results into radar chart data
    // Group by difficulty and calculate average stars
    const difficultyData: Record<number, DifficultyDataPoint> = {}

    data.forEach((mission) => {
        const diffConfig = DIFFICULTY_CONFIG.find((d) => d.level === mission.difficulty)
        const key = mission.difficulty

        if (!difficultyData[key]) {
            difficultyData[key] = {
                difficulty: mission.difficulty,
                difficultyName: diffConfig?.name || `D${mission.difficulty}`,
                stars: 0,
                count: 0,
            }
        }

        difficultyData[key].stars += mission.starRating
        difficultyData[key].count += 1
    })

    // Calculate averages and prepare chart data
    const chartData = Object.values(difficultyData)
        .map((d) => ({
            ...d,
            stars: Math.round(d.stars / d.count),
            avgStars: (d.stars / d.count).toFixed(1),
            // Add indicator for repeated difficulties
            displayName: d.count > 1 ? `${d.difficultyName} (×${d.count})` : d.difficultyName,
        }))
        .sort((a, b) => a.difficulty - b.difficulty)

    // Calculate total average for center display
    const totalStars = data.reduce((sum, m) => sum + m.starRating, 0)
    const avgStars = (totalStars / data.length).toFixed(1)

    return (
        <ChartCard>
            <ChartTitle>
                <span style={{ fontSize: '18px' }}>⭐</span>
                Mission Performance
            </ChartTitle>

            <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={height}>
                    <RadarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                    >
                        <defs>
                            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="0%"
                                    stopColor={factionColors.PRIMARY}
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={factionColors.PRIMARY}
                                    stopOpacity={0.2}
                                />
                            </linearGradient>
                        </defs>

                        <PolarGrid stroke={COLORS.CARD_BORDER} gridType="polygon" />

                        <PolarAngleAxis
                            dataKey="displayName"
                            tick={{ fill: COLORS.TEXT_SECONDARY, fontSize: 11 }}
                            tickLine={{ stroke: COLORS.CARD_BORDER }}
                        />

                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 3]}
                            tick={{ fill: COLORS.TEXT_MUTED, fontSize: 10 }}
                            axisLine={{ stroke: COLORS.CARD_BORDER }}
                            tickCount={4}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        <Radar
                            name="Star Rating"
                            dataKey="stars"
                            stroke={factionColors.PRIMARY}
                            fill="url(#radarGradient)"
                            strokeWidth={2}
                            dot={{
                                fill: factionColors.PRIMARY,
                                strokeWidth: 2,
                                r: 4,
                            }}
                            activeDot={{
                                fill: COLORS.TEXT_PRIMARY,
                                stroke: factionColors.PRIMARY,
                                strokeWidth: 2,
                                r: 6,
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>

                {/* Center average display */}
                <CenterDisplay>
                    <Text
                        $color="primary"
                        style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            textShadow: `0 0 20px ${factionColors.PRIMARY}`,
                        }}
                    >
                        {avgStars}
                    </Text>
                    <Caption style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Avg Stars
                    </Caption>
                </CenterDisplay>
            </div>

            {/* Mission summary grid */}
            <MissionSummary>
                {chartData.map((d, index) => (
                    <MissionCard key={index}>
                        <Text
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '12px',
                                fontWeight: 'bold',
                                marginBottom: '4px',
                            }}
                        >
                            D{d.difficulty}
                        </Text>
                        <Flex $align="center" $justify="center" $gap="xs">
                            <span style={{ fontSize: '14px' }}>⭐</span>
                            <Text $color="secondary" $size="sm" style={{ fontWeight: 'bold' }}>
                                {d.stars}
                            </Text>
                        </Flex>
                        <Caption style={{ marginTop: '4px' }}>
                            {d.count} mission{d.count > 1 ? 's' : ''}
                        </Caption>
                    </MissionCard>
                ))}
            </MissionSummary>
        </ChartCard>
    )
}

export default MissionRadar
