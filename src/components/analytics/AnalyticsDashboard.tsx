/**
 * Analytics Dashboard Component
 *
 * Main container for all post-run analytics charts and sharing features
 */

import React, { useRef } from 'react'
import styled from 'styled-components'
import { COLORS, getFactionColors } from '../../constants/theme'
import { DIFFICULTY_CONFIG } from '../../constants/gameConfig'
import { SUBFACTION_CONFIG, type Subfaction } from '../../constants/balancingConfig'
import { Text, Caption, Flex, Grid, Button } from '../../styles'
import SamplesChart from './SamplesChart'
import RequisitionChart from './RequisitionChart'
import LoadoutTimeline from './LoadoutTimeline'
import MissionRadar from './MissionRadar'
import DeathTimeline from './DeathTimeline'
import SharePanel from './SharePanel'
import type { AnalyticsStore } from '../../state/analyticsStore'
import type { Faction } from '../../types'

interface PlayerInfo {
    id: string
    name: string
}

type Outcome = 'victory' | 'defeat'

// Format duration in ms to readable string
const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m ${seconds % 60}s`
}

// Get difficulty name
const getDifficultyName = (level: number): string => {
    const config = DIFFICULTY_CONFIG.find((d) => d.level === level)
    return config?.name || `Difficulty ${level}`
}

// Get faction display name
const getFactionDisplayName = (factionId: string): string => {
    switch (factionId) {
        case 'terminid':
            return 'Terminids'
        case 'automaton':
            return 'Automatons'
        case 'illuminate':
            return 'Illuminate'
        default:
            return factionId || 'Unknown'
    }
}

// Get faction emoji
const getFactionEmoji = (factionId: string): string => {
    switch (factionId) {
        case 'terminid':
            return '🐛'
        case 'automaton':
            return '🤖'
        case 'illuminate':
            return '👽'
        default:
            return '❓'
    }
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const DashboardWrapper = styled.div`
    min-height: 100vh;
    background-color: ${({ theme }) => theme.colors.bgMain};
    background-image: linear-gradient(
        to bottom,
        ${({ theme }) => theme.colors.bgGradientStart},
        ${({ theme }) => theme.colors.bgGradientEnd}
    );
    padding: 20px;
    overflow: auto;
`

const DashboardCard = styled.div<{ $isVictory: boolean }>`
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    background-color: ${({ theme }) => theme.colors.cardBg};
    border-radius: ${({ theme }) => theme.radii.xl};
    border: 2px solid
        ${({ $isVictory, theme }) =>
            $isVictory ? theme.colors.accentGreen : theme.colors.accentRed};
    box-shadow: ${({ $isVictory }) =>
        $isVictory ? '0 0 40px rgba(34, 197, 94, 0.3)' : '0 0 40px rgba(239, 68, 68, 0.3)'};
`

const HeaderBanner = styled.div<{ $isVictory: boolean }>`
    text-align: center;
    margin-bottom: 32px;
    padding: 24px;
    background: ${({ $isVictory }) =>
        $isVictory
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'};
    border-radius: ${({ theme }) => theme.radii.xl};
    border: 1px solid
        ${({ $isVictory, theme }) =>
            $isVictory ? theme.colors.accentGreen : theme.colors.accentRed};
`

const OutcomeTitle = styled.h1<{ $isVictory: boolean }>`
    color: ${({ $isVictory, theme }) =>
        $isVictory ? theme.colors.accentGreen : theme.colors.accentRed};
    font-size: 32px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin: 0 0 8px 0;
    text-shadow: ${({ $isVictory }) =>
        $isVictory ? '0 0 20px rgba(34, 197, 94, 0.5)' : '0 0 20px rgba(239, 68, 68, 0.5)'};
`

const StatCard = styled.div<{ $accentColor?: string }>`
    background-color: ${({ theme }) => theme.colors.cardInner};
    border-radius: ${({ theme }) => theme.radii.xl};
    padding: ${({ theme }) => theme.spacing.lg};
    text-align: center;
    border: 1px solid
        ${({ $accentColor, theme }) =>
            $accentColor ? `${$accentColor}40` : theme.colors.cardBorder};
`

const StatValue = styled.p<{ $color?: string }>`
    color: ${({ $color }) => $color || COLORS.PRIMARY};
    font-size: 28px;
    font-weight: bold;
    margin: 0;
`

const StatLabel = styled.p`
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 11px;
    margin: 0 0 4px 0;
    text-transform: uppercase;
    letter-spacing: 0.1em;
`

const StatSubtext = styled.p`
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 11px;
    margin: 4px 0 0 0;
`

interface AnalyticsDashboardProps {
    analyticsData: AnalyticsStore | null
    outcome: Outcome
    faction?: Faction | string
    subfaction?: string | null
    players?: PlayerInfo[]
    onClose: () => void
    onViewHistory?: () => void
}

const AnalyticsDashboard = ({
    analyticsData,
    outcome,
    faction = 'terminid',
    subfaction = null,
    players = [],
    onClose,
    onViewHistory,
}: AnalyticsDashboardProps): React.ReactElement => {
    const dashboardRef = useRef<HTMLDivElement | null>(null)
    const factionColors = getFactionColors(faction as string)

    const isVictory = outcome === 'victory'
    const chartData = analyticsData
        ? {
              samplesData: analyticsData.sampleSnapshots || [],
              requisitionData: analyticsData.requisitionSnapshots || [],
              loadoutTimeline: Object.entries(analyticsData.playerLoadouts || {}).map(
                  ([playerId, loadouts]) => ({
                      playerId: parseInt(playerId),
                      playerName: loadouts[0]?.playerName || `Helldiver ${playerId}`,
                      changes: loadouts,
                  }),
              ),
              missionStars: analyticsData.missionResults || [],
              deathTimeline: analyticsData.playerDeaths || [],
          }
        : null

    const duration =
        analyticsData?.finalStats?.duration ||
        (analyticsData?.endTime && analyticsData?.startTime
            ? analyticsData.endTime - analyticsData.startTime
            : 0)

    // Get subfaction display name
    const subfactionName =
        subfaction && SUBFACTION_CONFIG[subfaction as Subfaction]
            ? SUBFACTION_CONFIG[subfaction as Subfaction].name
            : null

    // Check if faction was changed during the run (e.g., by an event)
    const startingFaction = analyticsData?.gameConfig?.faction
    const startingSubfaction = analyticsData?.gameConfig?.subfaction
    const factionWasChanged = startingFaction && startingFaction !== faction
    const startingFactionName = startingFaction ? getFactionDisplayName(startingFaction) : null
    const startingSubfactionName =
        startingSubfaction && SUBFACTION_CONFIG[startingSubfaction as Subfaction]
            ? SUBFACTION_CONFIG[startingSubfaction as Subfaction].name
            : null

    return (
        <DashboardWrapper>
            <DashboardCard ref={dashboardRef} $isVictory={isVictory}>
                {/* Header */}
                <HeaderBanner $isVictory={isVictory}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                        {isVictory ? '🏆' : '💀'}
                    </div>
                    <OutcomeTitle $isVictory={isVictory}>
                        {isVictory ? 'DEMOCRACY MANIFESTED' : 'DISHONORABLE DISCHARGE'}
                    </OutcomeTitle>
                    <Text $color="secondary" style={{ letterSpacing: '0.1em' }}>
                        {isVictory
                            ? 'Super Earth salutes your service, Helldiver!'
                            : 'Your sacrifice will not be forgotten.'}
                    </Text>
                </HeaderBanner>

                {/* Quick Stats Row */}
                <Grid
                    $columns="auto-fit"
                    $minWidth="150px"
                    $gap="md"
                    style={{ marginBottom: '32px' }}
                >
                    {/* Difficulty */}
                    <StatCard>
                        <StatLabel>Max Difficulty</StatLabel>
                        <StatValue $color={factionColors.PRIMARY}>
                            {analyticsData?.finalStats?.finalDifficulty || 1}
                        </StatValue>
                        <StatSubtext>
                            {getDifficultyName(analyticsData?.finalStats?.finalDifficulty || 1)}
                        </StatSubtext>
                    </StatCard>

                    {/* Duration */}
                    <StatCard>
                        <StatLabel>Duration</StatLabel>
                        <StatValue>{formatDuration(duration)}</StatValue>
                        <StatSubtext>Total Play Time</StatSubtext>
                    </StatCard>

                    {/* Squad Size */}
                    <StatCard>
                        <StatLabel>Squad Size</StatLabel>
                        <StatValue $color={COLORS.ACCENT_BLUE}>
                            {analyticsData?.finalStats?.playerCount || players.length || 1}
                        </StatValue>
                        <StatSubtext>Helldivers</StatSubtext>
                    </StatCard>

                    {/* Total Events */}
                    <StatCard>
                        <StatLabel>Events</StatLabel>
                        <StatValue $color={COLORS.ACCENT_PURPLE}>
                            {analyticsData?.finalStats?.totalEvents ||
                                analyticsData?.eventOccurrences?.length ||
                                0}
                        </StatValue>
                        <StatSubtext>Encountered</StatSubtext>
                    </StatCard>

                    {/* Final Requisition */}
                    <StatCard>
                        <StatLabel>Final Requisition</StatLabel>
                        <StatValue>
                            {parseFloat(
                                (analyticsData?.finalStats?.finalRequisition || 0).toFixed(2),
                            )}
                        </StatValue>
                        <StatSubtext>
                            <Flex $align="center" $justify="center" $gap="xs">
                                <img
                                    src="https://helldivers.wiki.gg/images/Requisition_Slip.svg"
                                    alt=""
                                    style={{ width: 14, height: 14 }}
                                />
                                Remaining
                            </Flex>
                        </StatSubtext>
                    </StatCard>

                    {/* Casualties */}
                    <StatCard>
                        <StatLabel>Casualties</StatLabel>
                        <StatValue $color={COLORS.ACCENT_RED}>
                            {analyticsData?.finalStats?.totalDeaths ||
                                analyticsData?.playerDeaths?.length ||
                                0}
                        </StatValue>
                        <StatSubtext>💀 KIA</StatSubtext>
                    </StatCard>

                    {/* Enemy Faction */}
                    <StatCard $accentColor={factionColors.PRIMARY} style={{ gridColumn: 'span 2' }}>
                        <StatLabel>Enemy Forces</StatLabel>
                        <Flex $align="center" $justify="center" $gap="sm">
                            <span style={{ fontSize: '24px' }}>{getFactionEmoji(faction)}</span>
                            <StatValue $color={factionColors.PRIMARY}>
                                {getFactionDisplayName(faction)}
                            </StatValue>
                        </Flex>
                        {subfactionName && (
                            <Text $color="secondary" $size="sm" style={{ marginTop: '4px' }}>
                                {subfactionName}
                            </Text>
                        )}
                        {factionWasChanged && (
                            <Caption
                                style={{
                                    color: COLORS.ACCENT_PURPLE,
                                    fontStyle: 'italic',
                                    marginTop: '8px',
                                }}
                            >
                                ⚡ Changed from {getFactionEmoji(startingFaction)}{' '}
                                {startingFactionName}
                                {startingSubfactionName &&
                                    startingSubfactionName !== 'Standard' &&
                                    ` (${startingSubfactionName})`}
                            </Caption>
                        )}
                    </StatCard>
                </Grid>

                {/* Charts Grid */}
                {chartData && (
                    <Grid $columns={2} $gap="lg" style={{ marginBottom: '32px' }}>
                        {/* Samples Chart - Full width */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <SamplesChart
                                data={chartData.samplesData}
                                missionStars={chartData.missionStars}
                                height={220}
                            />
                        </div>

                        {/* Requisition Chart */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <RequisitionChart
                                data={chartData.requisitionData}
                                missionStars={chartData.missionStars}
                                height={200}
                            />
                        </div>

                        {/* Mission Radar */}
                        <div>
                            <MissionRadar
                                data={chartData.missionStars}
                                faction={faction}
                                height={250}
                            />
                        </div>

                        {/* Death Timeline */}
                        <div>
                            <DeathTimeline
                                data={chartData.deathTimeline}
                                totalMissions={
                                    analyticsData?.finalStats?.totalMissions ||
                                    analyticsData?.missionResults?.length ||
                                    10
                                }
                                players={players}
                            />
                        </div>

                        {/* Loadout Timeline - Full width */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <LoadoutTimeline
                                data={chartData.loadoutTimeline}
                                totalMissions={
                                    analyticsData?.finalStats?.totalMissions ||
                                    analyticsData?.missionResults?.length ||
                                    10
                                }
                                missionStars={chartData.missionStars}
                            />
                        </div>
                    </Grid>
                )}

                {/* Share Panel */}
                <div style={{ marginBottom: '24px' }}>
                    <SharePanel
                        targetRef={dashboardRef}
                        runData={analyticsData}
                        outcome={outcome}
                    />
                </div>

                {/* Action Buttons */}
                <Flex $gap="md" $justify="center" $wrap>
                    <Button
                        $variant="primary"
                        onClick={onClose}
                        style={{
                            padding: '14px 32px',
                            backgroundColor: factionColors.PRIMARY,
                            borderColor: factionColors.PRIMARY,
                            boxShadow: factionColors.SHADOW,
                        }}
                    >
                        Return to Menu
                    </Button>

                    {onViewHistory && (
                        <Button
                            $variant="secondary"
                            onClick={onViewHistory}
                            style={{ padding: '14px 32px' }}
                        >
                            View Past Runs
                        </Button>
                    )}
                </Flex>
            </DashboardCard>
        </DashboardWrapper>
    )
}

export default AnalyticsDashboard
