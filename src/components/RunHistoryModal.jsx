/**
 * Run History Modal
 *
 * Allows users to browse and view their past run analytics
 */

import React, { useState, useEffect } from 'react'
import { X, Trash2, Clock, Users, Star, Skull, ChevronRight } from 'lucide-react'
import { COLORS, BUTTON_STYLES, getFactionColors } from '../constants/theme'
import {
    getRunSummaries,
    getRunById,
    deleteRunFromHistory,
    getRunHistoryStats,
} from '../systems/persistence/saveManager'
import { AnalyticsDashboard } from './analytics'

// Format duration in ms to readable string
const formatDuration = (ms) => {
    if (!ms) return '0m'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m ${seconds % 60}s`
}

// Format date to readable string
const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    // Less than 24 hours ago
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000)
        if (hours < 1) {
            const minutes = Math.floor(diff / 60000)
            return minutes < 1 ? 'Just now' : `${minutes}m ago`
        }
        return `${hours}h ago`
    }

    // Less than 7 days ago
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000)
        return `${days}d ago`
    }

    // Older - show date
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
}

const RunHistoryModal = ({ isOpen, onClose }) => {
    const [runs, setRuns] = useState([])
    const [selectedRun, setSelectedRun] = useState(null)
    const [viewingRun, setViewingRun] = useState(null)
    const [stats, setStats] = useState({ count: 0, sizeKB: 0, maxCount: 20 })
    const [confirmDelete, setConfirmDelete] = useState(null)

    // Load run history on mount
    useEffect(() => {
        if (isOpen) {
            setRuns(getRunSummaries())
            setStats(getRunHistoryStats())
        }
    }, [isOpen])

    // Handle viewing a run's full analytics
    const handleViewRun = (runId) => {
        const fullData = getRunById(runId)
        if (fullData) {
            setViewingRun(fullData)
        }
    }

    // Handle deleting a run
    const handleDeleteRun = (runId) => {
        if (deleteRunFromHistory(runId)) {
            setRuns(getRunSummaries())
            setStats(getRunHistoryStats())
            setConfirmDelete(null)
        }
    }

    if (!isOpen) return null

    // If viewing a specific run, show the analytics dashboard
    if (viewingRun) {
        return (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    overflow: 'auto',
                }}
            >
                <AnalyticsDashboard
                    analyticsData={viewingRun}
                    outcome={viewingRun.finalStats?.outcome || 'defeat'}
                    faction={viewingRun.gameConfig?.faction || 'terminid'}
                    players={viewingRun.finalStats?.players || []}
                    onClose={() => setViewingRun(null)}
                />
            </div>
        )
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
            }}
        >
            <div
                style={{
                    backgroundColor: COLORS.CARD_BG,
                    borderRadius: '16px',
                    border: `2px solid ${COLORS.PRIMARY}`,
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: `1px solid ${COLORS.CARD_BORDER}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <h2
                            style={{
                                color: COLORS.PRIMARY,
                                fontSize: '20px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            <span style={{ fontSize: '24px' }}>📊</span>
                            Past Runs
                        </h2>
                        <p
                            style={{
                                color: COLORS.TEXT_MUTED,
                                fontSize: '12px',
                                margin: '4px 0 0 0',
                            }}
                        >
                            {stats.count} of {stats.maxCount} runs saved ({stats.sizeKB}KB used)
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: COLORS.TEXT_MUTED,
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Run List */}
                <div
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '16px',
                    }}
                >
                    {runs.length === 0 ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: COLORS.TEXT_MUTED,
                            }}
                        >
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
                            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
                                No past runs yet
                            </p>
                            <p style={{ fontSize: '13px', margin: 0 }}>
                                Complete a game to see your run analytics here
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}
                        >
                            {runs.map((run) => {
                                const factionColors = getFactionColors(run.faction)
                                const isVictory = run.outcome === 'victory'

                                return (
                                    <div
                                        key={run.runId}
                                        style={{
                                            backgroundColor: COLORS.CARD_INNER,
                                            borderRadius: '12px',
                                            border: `1px solid ${COLORS.CARD_BORDER}`,
                                            overflow: 'hidden',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div
                                            onClick={() =>
                                                setSelectedRun(
                                                    selectedRun === run.runId ? null : run.runId,
                                                )
                                            }
                                            style={{
                                                padding: '16px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                            }}
                                        >
                                            {/* Outcome Icon */}
                                            <div
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    backgroundColor: isVictory
                                                        ? 'rgba(34, 197, 94, 0.15)'
                                                        : 'rgba(239, 68, 68, 0.15)',
                                                    border: `2px solid ${isVictory ? COLORS.ACCENT_GREEN : COLORS.ACCENT_RED}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '24px',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {isVictory ? '🏆' : '💀'}
                                            </div>

                                            {/* Run Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        marginBottom: '4px',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color: isVictory
                                                                ? COLORS.ACCENT_GREEN
                                                                : COLORS.ACCENT_RED,
                                                            fontSize: '14px',
                                                            fontWeight: 'bold',
                                                            textTransform: 'uppercase',
                                                        }}
                                                    >
                                                        {isVictory ? 'Victory' : 'Defeat'}
                                                    </span>
                                                    <span
                                                        style={{
                                                            color: factionColors.PRIMARY,
                                                            fontSize: '12px',
                                                            padding: '2px 6px',
                                                            backgroundColor: `${factionColors.PRIMARY}20`,
                                                            borderRadius: '4px',
                                                        }}
                                                    >
                                                        D{run.finalDifficulty}
                                                    </span>
                                                    <span
                                                        style={{
                                                            color: COLORS.TEXT_MUTED,
                                                            fontSize: '11px',
                                                        }}
                                                    >
                                                        {formatDate(run.savedAt)}
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        color: COLORS.TEXT_SECONDARY,
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <Users size={12} />
                                                        {run.playerCount}
                                                    </span>
                                                    <span
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <Clock size={12} />
                                                        {formatDuration(run.duration)}
                                                    </span>
                                                    {run.totalEvents > 0 && (
                                                        <span
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                            }}
                                                        >
                                                            <Star size={12} />
                                                            {run.totalEvents} events
                                                        </span>
                                                    )}
                                                    {run.totalDeaths > 0 && (
                                                        <span
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                color: COLORS.ACCENT_RED,
                                                            }}
                                                        >
                                                            <Skull size={12} />
                                                            {run.totalDeaths}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expand Arrow */}
                                            <ChevronRight
                                                size={20}
                                                style={{
                                                    color: COLORS.TEXT_MUTED,
                                                    transform:
                                                        selectedRun === run.runId
                                                            ? 'rotate(90deg)'
                                                            : 'rotate(0)',
                                                    transition: 'transform 0.2s',
                                                }}
                                            />
                                        </div>

                                        {/* Expanded Details */}
                                        {selectedRun === run.runId && (
                                            <div
                                                style={{
                                                    padding: '0 16px 16px 16px',
                                                    borderTop: `1px solid ${COLORS.CARD_BORDER}`,
                                                }}
                                            >
                                                {/* Player Names */}
                                                {run.playerNames && run.playerNames.length > 0 && (
                                                    <div
                                                        style={{
                                                            padding: '12px 0',
                                                            borderBottom: `1px solid ${COLORS.CARD_BORDER}`,
                                                        }}
                                                    >
                                                        <p
                                                            style={{
                                                                color: COLORS.TEXT_MUTED,
                                                                fontSize: '10px',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em',
                                                                margin: '0 0 8px 0',
                                                            }}
                                                        >
                                                            Squad
                                                        </p>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: '8px',
                                                            }}
                                                        >
                                                            {run.playerNames.map((name, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    style={{
                                                                        color: COLORS.TEXT_PRIMARY,
                                                                        fontSize: '12px',
                                                                        padding: '4px 8px',
                                                                        backgroundColor:
                                                                            COLORS.CARD_BG,
                                                                        borderRadius: '4px',
                                                                        border: `1px solid ${COLORS.CARD_BORDER}`,
                                                                    }}
                                                                >
                                                                    {name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: '12px',
                                                        marginTop: '12px',
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => handleViewRun(run.runId)}
                                                        style={{
                                                            ...BUTTON_STYLES.PRIMARY,
                                                            flex: 1,
                                                            padding: '10px 16px',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                        }}
                                                    >
                                                        <span>📊</span>
                                                        View Analytics
                                                    </button>

                                                    {confirmDelete === run.runId ? (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                gap: '8px',
                                                            }}
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteRun(run.runId)
                                                                }
                                                                style={{
                                                                    ...BUTTON_STYLES.SECONDARY,
                                                                    padding: '10px 16px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '12px',
                                                                    color: COLORS.ACCENT_RED,
                                                                    borderColor: COLORS.ACCENT_RED,
                                                                }}
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    setConfirmDelete(null)
                                                                }
                                                                style={{
                                                                    ...BUTTON_STYLES.SECONDARY,
                                                                    padding: '10px 16px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '12px',
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                setConfirmDelete(run.runId)
                                                            }
                                                            style={{
                                                                ...BUTTON_STYLES.SECONDARY,
                                                                padding: '10px 16px',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                color: COLORS.ACCENT_RED,
                                                                borderColor: COLORS.ACCENT_RED,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '16px 24px',
                        borderTop: `1px solid ${COLORS.CARD_BORDER}`,
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            ...BUTTON_STYLES.SECONDARY,
                            padding: '10px 24px',
                            borderRadius: '6px',
                            fontSize: '13px',
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RunHistoryModal
