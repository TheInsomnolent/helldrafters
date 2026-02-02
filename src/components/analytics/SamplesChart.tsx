/**
 * Samples Stacked Area Chart
 *
 * Displays sample collection per mission with mission-based X-axis
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
import { COLORS } from '../../constants/theme'
import type { SampleSnapshot, MissionResult } from '../../state/analyticsStore'

// Sample rarity colors matching the game UI
const SAMPLE_COLORS = {
    common: '#22c55e', // Green
    rare: '#f97316', // Orange
    superRare: '#a855f7', // Purple
}

// Sample SVG icon URLs
const SAMPLE_ICONS = {
    common: 'https://helldivers.wiki.gg/images/Common_Sample_Logo.svg',
    rare: 'https://helldivers.wiki.gg/images/Rare_Sample_Logo.svg',
    superRare: 'https://helldivers.wiki.gg/images/Super_Sample_Logo.svg',
}

interface MissionDataPoint {
    mission: number
    missionLabel: string
    common: number
    rare: number
    superRare: number
}

// Custom tooltip component
interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{ payload?: MissionDataPoint }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps): React.ReactElement | null => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]?.payload
    if (!data) return null

    return (
        <div
            style={{
                backgroundColor: COLORS.CARD_BG,
                border: `1px solid ${COLORS.CARD_BORDER}`,
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
        >
            <p
                style={{
                    color: COLORS.PRIMARY,
                    margin: '0 0 8px 0',
                    fontSize: '13px',
                    fontWeight: 'bold',
                }}
            >
                {data?.missionLabel}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                        src={SAMPLE_ICONS.superRare}
                        alt="Super Rare"
                        style={{ width: 14, height: 14 }}
                    />
                    <span style={{ color: COLORS.TEXT_PRIMARY, fontSize: '13px' }}>
                        Super Rare: {data?.superRare || 0}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={SAMPLE_ICONS.rare} alt="Rare" style={{ width: 14, height: 14 }} />
                    <span style={{ color: COLORS.TEXT_PRIMARY, fontSize: '13px' }}>
                        Rare: {data?.rare || 0}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={SAMPLE_ICONS.common} alt="Common" style={{ width: 14, height: 14 }} />
                    <span style={{ color: COLORS.TEXT_PRIMARY, fontSize: '13px' }}>
                        Common: {data?.common || 0}
                    </span>
                </div>
            </div>
        </div>
    )
}

/**
 * Transform time-based data to mission-based data
 * Each mission shows the cumulative samples at the end of that mission
 */
const transformToMissionData = (
    data: SampleSnapshot[],
    missionStars: MissionResult[],
): MissionDataPoint[] => {
    if (!data || data.length === 0) return []
    if (!missionStars || missionStars.length === 0) {
        // Fallback: just use data points as-is with index-based mission labels
        return data.map((d, index) => ({
            mission: index + 1,
            missionLabel: `M${index + 1}`,
            common: d.common,
            rare: d.rare,
            superRare: d.superRare,
        }))
    }

    // Sort missions by timestamp
    const sortedMissions = [...missionStars].sort((a, b) => a.timestamp - b.timestamp)
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp)

    // For each mission, find the last data point before or at mission completion
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

        return {
            mission: index + 1,
            missionLabel: `M${index + 1}`,
            common: relevantSnapshot?.common || 0,
            rare: relevantSnapshot?.rare || 0,
            superRare: relevantSnapshot?.superRare || 0,
        }
    })

    // Add starting point (mission 0 / start)
    const startData = {
        mission: 0,
        missionLabel: 'Start',
        common: 0,
        rare: 0,
        superRare: 0,
    }

    return [startData, ...missionData]
}

interface SamplesChartProps {
    data: SampleSnapshot[]
    missionStars?: MissionResult[]
    height?: number
}

const SamplesChart = ({
    data,
    missionStars = [],
    height = 250,
}: SamplesChartProps): React.ReactElement => {
    const missionData = transformToMissionData(data, missionStars)

    if (!missionData || missionData.length === 0) {
        return (
            <div
                style={{
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.TEXT_MUTED,
                    backgroundColor: COLORS.CARD_INNER,
                    borderRadius: '8px',
                }}
            >
                No sample data recorded
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
                <img src={SAMPLE_ICONS.common} alt="Samples" style={{ width: 20, height: 20 }} />
                Sample Collection
            </h3>

            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={missionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCommon" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={SAMPLE_COLORS.common} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={SAMPLE_COLORS.common} stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorRare" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={SAMPLE_COLORS.rare} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={SAMPLE_COLORS.rare} stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorSuperRare" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor={SAMPLE_COLORS.superRare}
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stopColor={SAMPLE_COLORS.superRare}
                                stopOpacity={0.1}
                            />
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
                        stroke={COLORS.TEXT_MUTED}
                        tick={{ fill: COLORS.TEXT_MUTED, fontSize: 11 }}
                        axisLine={{ stroke: COLORS.CARD_BORDER }}
                        domain={[0, (dataMax) => Math.max(Math.ceil(dataMax * 1.1), 5)]}
                        allowDecimals={false}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Area
                        type="monotone"
                        dataKey="common"
                        stackId="1"
                        stroke={SAMPLE_COLORS.common}
                        fill="url(#colorCommon)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="rare"
                        stackId="1"
                        stroke={SAMPLE_COLORS.rare}
                        fill="url(#colorRare)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="superRare"
                        stackId="1"
                        stroke={SAMPLE_COLORS.superRare}
                        fill="url(#colorSuperRare)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '24px',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${COLORS.CARD_BORDER}`,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src={SAMPLE_ICONS.common} alt="Common" style={{ width: 16, height: 16 }} />
                    <span style={{ color: COLORS.TEXT_SECONDARY, fontSize: '12px' }}>Common</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src={SAMPLE_ICONS.rare} alt="Rare" style={{ width: 16, height: 16 }} />
                    <span style={{ color: COLORS.TEXT_SECONDARY, fontSize: '12px' }}>Rare</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img
                        src={SAMPLE_ICONS.superRare}
                        alt="Super Rare"
                        style={{ width: 16, height: 16 }}
                    />
                    <span style={{ color: COLORS.TEXT_SECONDARY, fontSize: '12px' }}>
                        Super Rare
                    </span>
                </div>
            </div>
        </div>
    )
}

export default SamplesChart
