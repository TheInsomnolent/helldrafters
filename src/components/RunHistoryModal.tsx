/**
 * Run History Modal
 *
 * Allows users to browse and view their past run analytics
 */

import { useState, useEffect } from 'react'
import { X, Trash2, Clock, Users, Star, Skull, ChevronRight } from 'lucide-react'
import styled from 'styled-components'
import { COLORS, getFactionColors } from '../constants/theme'
import {
    getRunSummaries,
    getRunById,
    deleteRunFromHistory,
    getRunHistoryStats,
    RunSummary,
    RunHistoryStats,
} from '../systems/persistence/saveManager'
import { AnalyticsDashboard } from './analytics'
import {
    ModalBackdrop,
    ModalContainer,
    ModalHeader,
    ModalContent,
    ModalFooter,
    ModalTitle,
    Text,
    Caption,
    Flex,
    IconButton,
    Button,
} from '../styles'
import type { AnalyticsStore } from '../state/analyticsStore'

// ============================================================================
// CUSTOM STYLED COMPONENTS
// ============================================================================

const RunCard = styled.div`
    background-color: ${({ theme }) => theme.colors.cardInner};
    border-radius: ${({ theme }) => theme.radii.xl};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    overflow: hidden;
    transition: all 0.2s;
`

const RunCardHeader = styled.div`
    padding: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 16px;
`

const OutcomeIcon = styled.div<{ $isVictory: boolean }>`
    width: 48px;
    height: 48px;
    border-radius: ${({ theme }) => theme.radii.xl};
    background-color: ${({ $isVictory }) =>
        $isVictory ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
    border: 2px solid
        ${({ $isVictory, theme }) =>
            $isVictory ? theme.colors.accentGreen : theme.colors.accentRed};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
`

const DifficultyBadge = styled.span<{ $color: string }>`
    color: ${({ $color }) => $color};
    font-size: 12px;
    padding: 2px 6px;
    background-color: ${({ $color }) => `${$color}20`};
    border-radius: ${({ theme }) => theme.radii.sm};
`

const StatItem = styled.span`
    display: flex;
    align-items: center;
    gap: 4px;
`

const ExpandedDetails = styled.div`
    padding: 0 16px 16px 16px;
    border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const SquadSection = styled.div`
    padding: 12px 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const PlayerTag = styled.span`
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 12px;
    padding: 4px 8px;
    background-color: ${({ theme }) => theme.colors.cardBg};
    border-radius: ${({ theme }) => theme.radii.sm};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const EmptyState = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: ${({ theme }) => theme.colors.textMuted};
`

type RunSummaryDisplay = Omit<RunSummary, 'fullData'>

// Format duration in ms to readable string
const formatDuration = (ms: number): string => {
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
const formatDate = (timestamp: number): string => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

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

interface RunHistoryModalProps {
    isOpen: boolean
    onClose: () => void
}

const RunHistoryModal = ({ isOpen, onClose }: RunHistoryModalProps) => {
    const [runs, setRuns] = useState<RunSummaryDisplay[]>([])
    const [selectedRun, setSelectedRun] = useState<string | null>(null)
    const [viewingRun, setViewingRun] = useState<AnalyticsStore | null>(null)
    const [stats, setStats] = useState<RunHistoryStats>({ count: 0, sizeKB: 0, maxCount: 20 })
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

    // Load run history on mount
    useEffect(() => {
        if (isOpen) {
            setRuns(getRunSummaries())
            setStats(getRunHistoryStats())
        }
    }, [isOpen])

    // Handle viewing a run's full analytics
    const handleViewRun = (runId: string) => {
        const fullData = getRunById(runId)
        if (fullData) {
            setViewingRun(fullData)
        }
    }

    // Handle deleting a run
    const handleDeleteRun = (runId: string) => {
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
                    players={
                        viewingRun.finalStats?.players?.map((p) => ({ id: p.id, name: p.name })) ??
                        []
                    }
                    onClose={() => setViewingRun(null)}
                    onViewHistory={() => {}}
                />
            </div>
        )
    }

    return (
        <ModalBackdrop>
            <ModalContainer
                $size="lg"
                style={{ display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}
            >
                {/* Header */}
                <ModalHeader>
                    <div>
                        <Flex $align="center" $gap="sm">
                            <span style={{ fontSize: '24px' }}>📊</span>
                            <ModalTitle style={{ margin: 0, fontSize: '20px' }}>
                                Past Runs
                            </ModalTitle>
                        </Flex>
                        <Caption style={{ marginTop: '4px' }}>
                            {stats.count} of {stats.maxCount} runs saved ({stats.sizeKB}KB used)
                        </Caption>
                    </div>
                    <IconButton onClick={onClose} title="Close">
                        <X size={24} />
                    </IconButton>
                </ModalHeader>

                {/* Run List */}
                <ModalContent $padding="lg" style={{ flex: 1, overflow: 'auto' }}>
                    {runs.length === 0 ? (
                        <EmptyState>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
                            <Text style={{ marginBottom: '8px' }}>No past runs yet</Text>
                            <Caption>Complete a game to see your run analytics here</Caption>
                        </EmptyState>
                    ) : (
                        <Flex $direction="column" $gap="md">
                            {runs.map((run) => {
                                const factionColors = getFactionColors(run.faction)
                                const isVictory = run.outcome === 'victory'

                                return (
                                    <RunCard key={run.runId}>
                                        <RunCardHeader
                                            onClick={() =>
                                                setSelectedRun(
                                                    selectedRun === run.runId ? null : run.runId,
                                                )
                                            }
                                        >
                                            {/* Outcome Icon */}
                                            <OutcomeIcon $isVictory={isVictory}>
                                                {isVictory ? '🏆' : '💀'}
                                            </OutcomeIcon>

                                            {/* Run Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Flex
                                                    $align="center"
                                                    $gap="sm"
                                                    style={{ marginBottom: '4px' }}
                                                >
                                                    <Text
                                                        $color={isVictory ? 'success' : 'error'}
                                                        $size="sm"
                                                        style={{
                                                            fontWeight: 'bold',
                                                            textTransform: 'uppercase',
                                                        }}
                                                    >
                                                        {isVictory ? 'Victory' : 'Defeat'}
                                                    </Text>
                                                    <DifficultyBadge $color={factionColors.PRIMARY}>
                                                        D{run.finalDifficulty}
                                                    </DifficultyBadge>
                                                    <Caption>{formatDate(run.savedAt)}</Caption>
                                                </Flex>

                                                <Flex
                                                    $align="center"
                                                    $gap="md"
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    <StatItem>
                                                        <Users size={12} />
                                                        {run.playerCount}
                                                    </StatItem>
                                                    <StatItem>
                                                        <Clock size={12} />
                                                        {formatDuration(run.duration)}
                                                    </StatItem>
                                                    {run.totalEvents > 0 && (
                                                        <StatItem>
                                                            <Star size={12} />
                                                            {run.totalEvents} events
                                                        </StatItem>
                                                    )}
                                                    {run.totalDeaths > 0 && (
                                                        <StatItem
                                                            style={{ color: COLORS.ACCENT_RED }}
                                                        >
                                                            <Skull size={12} />
                                                            {run.totalDeaths}
                                                        </StatItem>
                                                    )}
                                                </Flex>
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
                                        </RunCardHeader>

                                        {/* Expanded Details */}
                                        {selectedRun === run.runId && (
                                            <ExpandedDetails>
                                                {/* Player Names */}
                                                {run.playerNames && run.playerNames.length > 0 && (
                                                    <SquadSection>
                                                        <Caption
                                                            style={{
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em',
                                                                marginBottom: '8px',
                                                                display: 'block',
                                                            }}
                                                        >
                                                            Squad
                                                        </Caption>
                                                        <Flex $wrap $gap="sm">
                                                            {run.playerNames.map((name, idx) => (
                                                                <PlayerTag key={idx}>
                                                                    {name}
                                                                </PlayerTag>
                                                            ))}
                                                        </Flex>
                                                    </SquadSection>
                                                )}

                                                {/* Actions */}
                                                <Flex $gap="md" style={{ marginTop: '12px' }}>
                                                    <Button
                                                        $variant="primary"
                                                        $size="sm"
                                                        onClick={() => handleViewRun(run.runId)}
                                                        style={{ flex: 1 }}
                                                    >
                                                        <span>📊</span>
                                                        View Analytics
                                                    </Button>

                                                    {confirmDelete === run.runId ? (
                                                        <Flex $gap="sm">
                                                            <Button
                                                                $variant="danger"
                                                                $size="sm"
                                                                onClick={() =>
                                                                    handleDeleteRun(run.runId)
                                                                }
                                                            >
                                                                Confirm
                                                            </Button>
                                                            <Button
                                                                $variant="secondary"
                                                                $size="sm"
                                                                onClick={() =>
                                                                    setConfirmDelete(null)
                                                                }
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </Flex>
                                                    ) : (
                                                        <Button
                                                            $variant="danger"
                                                            $size="sm"
                                                            onClick={() =>
                                                                setConfirmDelete(run.runId)
                                                            }
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </Button>
                                                    )}
                                                </Flex>
                                            </ExpandedDetails>
                                        )}
                                    </RunCard>
                                )
                            })}
                        </Flex>
                    )}
                </ModalContent>

                {/* Footer */}
                <ModalFooter>
                    <Button $variant="secondary" $size="sm" onClick={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContainer>
        </ModalBackdrop>
    )
}

export default RunHistoryModal
