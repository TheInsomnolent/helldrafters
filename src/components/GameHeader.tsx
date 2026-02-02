import styled from 'styled-components'
import { DIFFICULTY_CONFIG, getMissionsForDifficulty } from '../constants/gameConfig'
import { HelpCircle } from 'lucide-react'
import { getFactionColors, FactionColorSet } from '../constants/theme'
import { SUBFACTION_CONFIG, Subfaction } from '../constants/balancingConfig'
import type { Faction, Samples } from '../types'
import { HeaderBar, Flex, Button, DifficultyBadge, Mono, Caption, ProgressCircle } from '../styles'

// ============================================================================
// STYLED COMPONENTS (component-specific only)
// ============================================================================

const HeaderContent = styled.div`
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};
    min-width: 0;

    @media (max-width: 768px) {
        flex-wrap: wrap;
        gap: ${({ theme }) => theme.spacing.sm};
    }
`

const DifficultyTitle = styled.h1`
    font-size: 18px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textPrimary};
    letter-spacing: 1px;
    margin: 0;

    @media (max-width: 480px) {
        font-size: 14px;
    }
`

const TheaterInfo = styled.div<{ $factionColor: string }>`
    font-size: 12px;
    color: ${({ $factionColor }) => $factionColor};
    font-family: monospace;
`

const OperationBadge = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    margin-left: ${({ theme }) => theme.spacing.lg};
    padding: 8px 12px;
    background-color: rgba(100, 116, 139, 0.2);
    border-radius: ${({ theme }) => theme.radii.md};
    border: 1px solid rgba(100, 116, 139, 0.3);
`

const OperationCount = styled.span<{ $factionColor: string }>`
    font-size: 11px;
    color: ${({ $factionColor }) => $factionColor};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
`

const StatIcon = styled.img`
    width: 20px;
    height: 20px;
`

const SmallStatIcon = styled.img`
    width: 18px;
    height: 18px;
`

const CurrentIndicator = styled.div<{ $factionColor: string }>`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${({ $factionColor }) => $factionColor};
`

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MissionProgressIndicatorProps {
    currentMission: number
    totalMissions: number
    factionColors: FactionColorSet
}

/**
 * Mission Progress Indicator Component
 * Shows hollow and filled circles for mission progress in Endurance Mode
 */
function MissionProgressIndicator({
    currentMission,
    totalMissions,
    factionColors,
}: MissionProgressIndicatorProps) {
    const circles: React.ReactNode[] = []
    for (let i = 1; i <= totalMissions; i++) {
        const isComplete = i < currentMission
        const isCurrent = i === currentMission
        circles.push(
            <ProgressCircle
                key={i}
                $complete={isComplete}
                $factionPrimary={factionColors.PRIMARY}
                title={`Mission ${i}${isComplete ? ' (Complete)' : isCurrent ? ' (Current)' : ''}`}
            >
                {isCurrent && <CurrentIndicator $factionColor={factionColors.PRIMARY} />}
            </ProgressCircle>,
        )
    }
    return (
        <Flex $align="center" $gap="xs">
            {circles}
        </Flex>
    )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface GameHeaderProps {
    currentDiff: number
    currentMission: number
    enduranceMode: boolean
    requisition: number
    faction: Faction | string
    subfaction: Subfaction
    samples: Samples
    onExport?: () => void
    onHelp?: () => void
}

/**
 * Game header component showing current difficulty, stats, and action buttons
 */
export default function GameHeader({
    currentDiff,
    currentMission,
    enduranceMode,
    requisition,
    faction,
    subfaction,
    samples,
    onExport,
    onHelp,
}: GameHeaderProps) {
    const factionColors = getFactionColors(faction)
    const subfactionName = SUBFACTION_CONFIG[subfaction]?.name || 'Unknown'
    const totalMissions = enduranceMode ? getMissionsForDifficulty(currentDiff) : 1

    return (
        <HeaderBar $factionPrimary={factionColors.PRIMARY}>
            <HeaderContent>
                <Flex $align="center" $gap="lg">
                    <DifficultyBadge $factionPrimary={factionColors.PRIMARY}>
                        D{currentDiff}
                    </DifficultyBadge>
                    <div>
                        <DifficultyTitle>
                            {DIFFICULTY_CONFIG[currentDiff - 1]?.name}
                        </DifficultyTitle>
                        <TheaterInfo $factionColor={factionColors.PRIMARY}>
                            Theater: {faction} - {subfactionName}
                        </TheaterInfo>
                    </div>

                    {/* Endurance Mode Mission Progress */}
                    {enduranceMode && (
                        <OperationBadge>
                            <Caption>Operation</Caption>
                            <MissionProgressIndicator
                                currentMission={currentMission || 1}
                                totalMissions={totalMissions}
                                factionColors={factionColors}
                            />
                            <OperationCount $factionColor={factionColors.PRIMARY}>
                                {currentMission || 1}/{totalMissions}
                            </OperationCount>
                        </OperationBadge>
                    )}
                </Flex>

                <Flex $align="center" $gap="xl">
                    {/* Requisition */}
                    <Flex $align="center" $gap="sm">
                        <StatIcon
                            src="https://helldivers.wiki.gg/images/Requisition_Slip.svg"
                            alt="Requisition"
                        />
                        <Mono $size="lg" $factionColor={factionColors.PRIMARY} $color="faction">
                            {Math.floor(requisition)}
                        </Mono>
                    </Flex>

                    {/* Samples */}
                    <Flex $align="center" $gap="md">
                        {/* Common Samples */}
                        <Flex $align="center" $gap="xs">
                            <SmallStatIcon
                                src="https://helldivers.wiki.gg/images/Common_Sample_Logo.svg"
                                alt="Common Samples"
                            />
                            <Mono $color="success">{samples?.common || 0}</Mono>
                        </Flex>

                        {/* Rare Samples */}
                        <Flex $align="center" $gap="xs">
                            <SmallStatIcon
                                src="https://helldivers.wiki.gg/images/Rare_Sample_Logo.svg"
                                alt="Rare Samples"
                            />
                            <Mono $color="warning">{samples?.rare || 0}</Mono>
                        </Flex>

                        {/* Super Rare Samples */}
                        <Flex $align="center" $gap="xs">
                            <SmallStatIcon
                                src="https://helldivers.wiki.gg/images/Super_Sample_Logo.svg"
                                alt="Super Rare Samples"
                            />
                            <Mono $factionColor="#a855f7" $color="faction">
                                {samples?.superRare || 0}
                            </Mono>
                        </Flex>
                    </Flex>

                    {/* Action Buttons */}
                    <Flex $align="center" $gap="sm">
                        <Button
                            $variant="ghost"
                            $size="sm"
                            $factionPrimary={factionColors.PRIMARY}
                            onClick={onHelp}
                        >
                            <HelpCircle size={16} />
                            Help
                        </Button>
                        <Button
                            $variant="ghost"
                            $size="sm"
                            $factionPrimary={factionColors.PRIMARY}
                            onClick={onExport}
                        >
                            💾 Export
                        </Button>
                    </Flex>
                </Flex>
            </HeaderContent>
        </HeaderBar>
    )
}
