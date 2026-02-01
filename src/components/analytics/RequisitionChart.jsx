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
import { COLORS } from '../../constants/theme'

// Custom tooltip component
const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]?.payload

    return (
        <div
            style={{
                backgroundColor: COLORS.CARD_BG,
                border: `1px solid ${COLORS.CARD_BORDER}`,
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                minWidth: '150px',
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

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                }}
            >
                <img
                    src="https://helldivers.wiki.gg/images/Requisition_Slip.svg"
                    alt="Requisition"
                    style={{ width: 18, height: 18 }}
                />
                <span
                    style={{
                        color: COLORS.PRIMARY,
                        fontSize: '20px',
                        fontWeight: 'bold',
                    }}
                >
                    {data?.amount || 0}
                </span>
            </div>

            {data?.spendEvents && data.spendEvents.length > 0 && (
                <div
                    style={{
                        padding: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '4px',
                        border: `1px solid ${COLORS.ACCENT_RED}`,
                    }}
                >
                    <p
                        style={{
                            color: COLORS.TEXT_MUTED,
                            margin: '0 0 4px 0',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Spent this mission:
                    </p>
                    {data.spendEvents.map((event, idx) => (
                        <p
                            key={idx}
                            style={{
                                color: COLORS.ACCENT_RED,
                                margin: '2px 0',
                                fontSize: '11px',
                            }}
                        >
                            -{Math.abs(event.change)} • {event.reason}
                            {event.player && ` (${event.player})`}
                        </p>
                    ))}
                </div>
            )}
        </div>
    )
}

/**
 * Transform time-based data to mission-based data
 * Each mission shows the requisition at the end of that mission
 */
const transformToMissionData = (data, missionStars) => {
    if (!data || data.length === 0) return []
    if (!missionStars || missionStars.length === 0) {
        // Fallback: just use data points as-is with index-based mission labels
        return data.map((d, index) => ({
            ...d,
            mission: index + 1,
            missionLabel: `M${index + 1}`,
        }))
    }

    // Sort missions by timestamp
    const sortedMissions = [...missionStars].sort((a, b) => a.timestamp - b.timestamp)
    const sortedData = [...data].sort((a, b) => (a.time || 0) - (b.time || 0))

    // For each mission, find the last data point before or at mission completion
    // Also collect spend events that happened during that mission
    let previousMissionTime = 0

    const missionData = sortedMissions.map((mission, index) => {
        const missionEndTime = mission.timestamp

        // Find the last snapshot before or at this mission's completion
        let relevantSnapshot = sortedData[0]
        for (const snapshot of sortedData) {
            if ((snapshot.time || 0) <= missionEndTime) {
                relevantSnapshot = snapshot
            } else {
                break
            }
        }

        // Find spend events during this mission
        const spendEvents = sortedData.filter(
            (d) =>
                d.change < 0 &&
                (d.time || 0) > previousMissionTime &&
                (d.time || 0) <= missionEndTime,
        )

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

const RequisitionChart = ({ data, missionStars = [], height = 200 }) => {
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
                No requisition data recorded
            </div>
        )
    }

    // Collect all spend events for summary
    const allSpendEvents = missionData.flatMap((m) => m.spendEvents || [])

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
                <img
                    src="https://helldivers.wiki.gg/images/Requisition_Slip.svg"
                    alt="Requisition"
                    style={{ width: 20, height: 20 }}
                />
                Requisition
            </h3>

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
                <div
                    style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: `1px solid ${COLORS.CARD_BORDER}`,
                    }}
                >
                    <p
                        style={{
                            color: COLORS.TEXT_MUTED,
                            fontSize: '11px',
                            margin: '0 0 8px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Expenditures
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                        }}
                    >
                        {allSpendEvents.map((event, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.ACCENT_RED}`,
                                }}
                            >
                                <span
                                    style={{
                                        color: COLORS.ACCENT_RED,
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    -{Math.abs(event.change)}
                                </span>
                                <span style={{ color: COLORS.TEXT_SECONDARY, fontSize: '11px' }}>
                                    {event.reason}
                                </span>
                                {event.player && (
                                    <span style={{ color: COLORS.TEXT_MUTED, fontSize: '10px' }}>
                                        ({event.player})
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default RequisitionChart
