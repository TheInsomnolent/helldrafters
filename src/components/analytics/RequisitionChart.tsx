/**
 * Requisition Area Chart
 *
 * Displays requisition per mission with mission-based X-axis
 */

import React from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import styled from 'styled-components'
import { COLORS } from '../../constants/theme'
import { Card, Text, Caption, Flex } from '../../styles'
import type { RequisitionSnapshot, MissionResult } from '../../state/analyticsStore'

interface SpendEvent {
    change: number
    reason: string
    player?: string
}

interface MissionDataPoint {
    mission: number
    missionLabel: string
    amount: number
    spendEvents: SpendEvent[]
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
    margin: 0 0 16px 0;
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
    min-width: 150px;
`

const SpendEventBox = styled.div`
    padding: 8px;
    background-color: rgba(239, 68, 68, 0.1);
    border-radius: 4px;
    border: 1px solid ${({ theme }) => theme.colors.accentRed};
`

const SpendTag = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background-color: rgba(239, 68, 68, 0.1);
    border-radius: 4px;
    border: 1px solid ${({ theme }) => theme.colors.accentRed};
`

const ExpendituresSection = styled.div`
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{ payload?: MissionDataPoint }>
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: CustomTooltipProps): React.ReactElement | null => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]?.payload
    if (!data) return null

    return (
        <ChartTooltip>
            <Text $color="primary" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {data?.missionLabel}
            </Text>

            <Flex $align="center" $gap="sm" style={{ marginBottom: '8px' }}>
                <img
                    src="https://helldivers.wiki.gg/images/Requisition_Slip.svg"
                    alt="Requisition"
                    style={{ width: 18, height: 18 }}
                />
                <Text $color="primary" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {data?.amount || 0}
                </Text>
            </Flex>

            {data?.spendEvents && data.spendEvents.length > 0 && (
                <SpendEventBox>
                    <Caption
                        style={{
                            textTransform: 'uppercase',
                            display: 'block',
                            marginBottom: '4px',
                        }}
                    >
                        Spent this mission:
                    </Caption>
                    {data.spendEvents.map((event, idx) => (
                        <Text key={idx} $color="error" $size="sm" style={{ margin: '2px 0' }}>
                            -{Math.abs(event.change)} • {event.reason}
                            {event.player && ` (${event.player})`}
                        </Text>
                    ))}
                </SpendEventBox>
            )}
        </ChartTooltip>
    )
}

/**
 * Transform time-based data to mission-based data
 * Each mission shows the requisition at the end of that mission
 */
const transformToMissionData = (
    data: RequisitionSnapshot[],
    missionStars: MissionResult[],
): MissionDataPoint[] => {
    if (!data || data.length === 0) return []
    if (!missionStars || missionStars.length === 0) {
        // Fallback: just use data points as-is with index-based mission labels
        return data.map((d, index) => ({
            mission: index + 1,
            missionLabel: `M${index + 1}`,
            amount: d.amount,
            spendEvents: [],
        }))
    }

    // Sort missions by timestamp
    const sortedMissions = [...missionStars].sort((a, b) => a.timestamp - b.timestamp)
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp)

    // For each mission, find the last data point before or at mission completion
    // Also collect spend events that happened during that mission
    let previousMissionTime = 0

    const missionData = sortedMissions.map((mission, index) => {
        const missionEndTime = mission.timestamp

        // Find the last snapshot before or at this mission's completion
        let relevantSnapshot = sortedData[0]
        for (const snapshot of sortedData) {
            if (snapshot.timestamp <= missionEndTime) {
                relevantSnapshot = snapshot
            } else {
                break
            }
        }

        // Find spend events during this mission
        const spendEvents: SpendEvent[] = sortedData
            .filter(
                (d) =>
                    d.change < 0 &&
                    d.timestamp > previousMissionTime &&
                    d.timestamp <= missionEndTime,
            )
            .map((d) => ({
                change: d.change,
                reason: d.reason,
                player: d.playerName,
            }))

        previousMissionTime = missionEndTime

        return {
            mission: index + 1,
            missionLabel: `M${index + 1}`,
            amount: relevantSnapshot?.amount || 0,
            spendEvents,
        }
    })

    // Add starting point
    const startData = {
        mission: 0,
        missionLabel: 'Start',
        amount: sortedData[0]?.amount || 0,
        spendEvents: [],
    }

    return [startData, ...missionData]
}

interface RequisitionChartProps {
    data: RequisitionSnapshot[]
    missionStars?: MissionResult[]
    height?: number
}

const RequisitionChart = ({
    data,
    missionStars = [],
    height = 200,
}: RequisitionChartProps): React.ReactElement => {
    const missionData = transformToMissionData(data, missionStars)

    if (!missionData || missionData.length === 0) {
        return <EmptyState $height={height}>No requisition data recorded</EmptyState>
    }

    // Collect all spend events for summary
    const allSpendEvents = missionData.flatMap((m) => m.spendEvents || [])

    return (
        <ChartCard>
            <ChartTitle>
                <img
                    src="https://helldivers.wiki.gg/images/Requisition_Slip.svg"
                    alt="Requisition"
                    style={{ width: 20, height: 20 }}
                />
                Requisition
            </ChartTitle>

            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={missionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRequisition" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.PRIMARY} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS.PRIMARY} stopOpacity={0.1} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={COLORS.CARD_BORDER}
                        opacity={0.5}
                    />

                    <XAxis
                        dataKey="missionLabel"
                        stroke={COLORS.TEXT_MUTED}
                        tick={{ fill: COLORS.TEXT_MUTED, fontSize: 11 }}
                        axisLine={{ stroke: COLORS.CARD_BORDER }}
                    />

                    <YAxis
                        domain={[0, (dataMax) => Math.max(Math.ceil(dataMax * 1.1), 5)]}
                        stroke={COLORS.TEXT_MUTED}
                        tick={{ fill: COLORS.TEXT_MUTED, fontSize: 11 }}
                        axisLine={{ stroke: COLORS.CARD_BORDER }}
                        allowDecimals={false}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke={COLORS.PRIMARY}
                        fill="url(#colorRequisition)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: COLORS.PRIMARY, stroke: COLORS.CARD_BG, strokeWidth: 2 }}
                        activeDot={{
                            r: 6,
                            fill: COLORS.PRIMARY,
                            stroke: COLORS.CARD_BG,
                            strokeWidth: 2,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Spend events summary */}
            {allSpendEvents.length > 0 && (
                <ExpendituresSection>
                    <Caption
                        style={{
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'block',
                            marginBottom: '8px',
                        }}
                    >
                        Expenditures
                    </Caption>
                    <Flex $wrap $gap="sm">
                        {allSpendEvents.map((event, index) => (
                            <SpendTag key={index}>
                                <Text $color="error" $size="sm" style={{ fontWeight: 'bold' }}>
                                    -{Math.abs(event.change)}
                                </Text>
                                <Text $color="secondary" $size="sm">
                                    {event.reason}
                                </Text>
                                {event.player && <Caption>({event.player})</Caption>}
                            </SpendTag>
                        ))}
                    </Flex>
                </ExpendituresSection>
            )}
        </ChartCard>
    )
}

export default RequisitionChart
