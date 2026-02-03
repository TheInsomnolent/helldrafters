/**
 * GameConfiguration - Reusable game configuration component
 * Used in both solo config screen and multiplayer host screen
 */

import styled from 'styled-components'
import { getFactionColors, FactionColorSet } from '../constants/theme'
import {
    getSubfactionsForFaction,
    SUBFACTION_CONFIG,
    Subfaction,
} from '../constants/balancingConfig'
import type { GameConfig, Faction } from '../types'
import {
    Label,
    Grid,
    SelectableCard,
    CheckboxLabel,
    Checkbox,
    Flex,
    Caption,
    Badge,
} from '../styles'

// ============================================================================
// STYLED COMPONENTS (component-specific only)
// ============================================================================

const OptionTitle = styled.div<{ $factionPrimary?: string }>`
    color: ${({ $factionPrimary, theme }) => $factionPrimary || theme.colors.primary};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-size: ${({ theme }) => theme.fontSizes.base};
    margin: 0;
`

const OptionDescription = styled(Caption)`
    margin-top: ${({ theme }) => theme.spacing.xs};
`

const SubfactionName = styled.div`
    font-size: ${({ theme }) => theme.fontSizes.base};
    margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const SubfactionDescription = styled.div`
    font-size: ${({ theme }) => theme.fontSizes.sm};
    opacity: 0.8;
    text-transform: none;
`

const ConfigSection = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.xxxl};
`

interface GameConfigurationProps {
    gameConfig: GameConfig
    eventsEnabled: boolean
    onUpdateGameConfig: (update: Partial<GameConfig>) => void
    onSetSubfaction: (subfaction: Subfaction) => void
    onSetEventsEnabled: (enabled: boolean) => void
    factionColors?: FactionColorSet
}

export default function GameConfiguration({
    gameConfig,
    eventsEnabled,
    onUpdateGameConfig,
    onSetSubfaction,
    onSetEventsEnabled,
    factionColors: providedFactionColors,
}: GameConfigurationProps) {
    const factionColors = providedFactionColors || getFactionColors(gameConfig.faction)

    return (
        <div>
            {/* Theatre Selection */}
            <ConfigSection>
                <Label>Theatre of War</Label>
                <Grid $columns={3} $gap="md">
                    {(['terminid', 'automaton', 'illuminate'] as Faction[]).map((faction) => {
                        const isSelected = gameConfig.faction === faction
                        const colors = getFactionColors(faction)

                        return (
                            <SelectableCard
                                key={faction}
                                $selected={isSelected}
                                $factionPrimary={colors.PRIMARY}
                                $factionShadow={colors.SHADOW}
                                $padding="md"
                                onClick={() => {
                                    onUpdateGameConfig({ faction })
                                    // Auto-select first subfaction for this faction
                                    const subfactions = getSubfactionsForFaction(faction)
                                    if (subfactions.length > 0) {
                                        onSetSubfaction(subfactions[0])
                                    }
                                }}
                            >
                                {faction === 'terminid'
                                    ? 'Terminids'
                                    : faction === 'automaton'
                                      ? 'Automatons'
                                      : 'Illuminate'}
                            </SelectableCard>
                        )
                    })}
                </Grid>
            </ConfigSection>

            {/* Subfaction */}
            <ConfigSection>
                <Label>Enemy Variant</Label>
                <Grid $columns={1} $gap="md">
                    {getSubfactionsForFaction(gameConfig.faction).map((subfaction) => {
                        const isSelected = gameConfig.subfaction === subfaction
                        const config = SUBFACTION_CONFIG[subfaction]

                        return (
                            <SelectableCard
                                key={subfaction}
                                $selected={isSelected}
                                $factionPrimary={factionColors.PRIMARY}
                                $factionShadow={factionColors.SHADOW}
                                $padding="md"
                                onClick={() => onSetSubfaction(subfaction)}
                            >
                                <SubfactionName>{config.name}</SubfactionName>
                                <SubfactionDescription>
                                    {config.description} • Req: {config.reqMultiplier}x • Rares:{' '}
                                    {config.rareWeightMultiplier}x
                                </SubfactionDescription>
                            </SelectableCard>
                        )
                    })}
                </Grid>
            </ConfigSection>

            {/* Game Mode Options */}
            <ConfigSection>
                <Label>Game Mode Options</Label>
                <Flex $direction="column" $gap="md">
                    <CheckboxLabel
                        $selected={gameConfig.globalUniqueness}
                        $factionPrimary={factionColors.PRIMARY}
                    >
                        <Checkbox
                            checked={gameConfig.globalUniqueness}
                            onChange={(e) =>
                                onUpdateGameConfig({ globalUniqueness: e.target.checked })
                            }
                            $factionPrimary={factionColors.PRIMARY}
                        />
                        <div>
                            <OptionTitle $factionPrimary={factionColors.PRIMARY}>
                                Global Card Uniqueness
                            </OptionTitle>
                            <OptionDescription>
                                Cards drafted by one player cannot appear for other players
                            </OptionDescription>
                        </div>
                    </CheckboxLabel>
                    <CheckboxLabel
                        $selected={gameConfig.burnCards}
                        $factionPrimary={factionColors.PRIMARY}
                    >
                        <Checkbox
                            checked={gameConfig.burnCards}
                            onChange={(e) => onUpdateGameConfig({ burnCards: e.target.checked })}
                            $factionPrimary={factionColors.PRIMARY}
                        />
                        <div>
                            <OptionTitle $factionPrimary={factionColors.PRIMARY}>
                                Burn Cards After Viewing
                            </OptionTitle>
                            <OptionDescription>
                                Once a card appears in a draft, it cannot appear again this run
                            </OptionDescription>
                        </div>
                    </CheckboxLabel>
                    <CheckboxLabel
                        $selected={gameConfig.customStart}
                        $factionPrimary={factionColors.PRIMARY}
                    >
                        <Checkbox
                            checked={gameConfig.customStart}
                            onChange={(e) => onUpdateGameConfig({ customStart: e.target.checked })}
                            $factionPrimary={factionColors.PRIMARY}
                        />
                        <div>
                            <OptionTitle $factionPrimary={factionColors.PRIMARY}>
                                Custom Start Mode
                            </OptionTitle>
                            <OptionDescription>
                                Choose starting difficulty and loadouts for each player
                            </OptionDescription>
                        </div>
                    </CheckboxLabel>
                    <CheckboxLabel
                        $selected={eventsEnabled}
                        $factionPrimary={factionColors.PRIMARY}
                    >
                        <Checkbox
                            checked={eventsEnabled}
                            onChange={(e) => onSetEventsEnabled(e.target.checked)}
                            $factionPrimary={factionColors.PRIMARY}
                        />
                        <div>
                            <Flex $align="center" $gap="sm">
                                <OptionTitle $factionPrimary={factionColors.PRIMARY}>
                                    Enable Events
                                </OptionTitle>
                                <Badge $variant="warning" $size="sm">
                                    BETA
                                </Badge>
                            </Flex>
                            <OptionDescription>
                                Random high-risk, high-reward events between missions
                            </OptionDescription>
                        </div>
                    </CheckboxLabel>
                    <CheckboxLabel
                        $selected={gameConfig.endlessMode}
                        $factionPrimary={factionColors.PRIMARY}
                    >
                        <Checkbox
                            checked={gameConfig.endlessMode}
                            onChange={(e) => onUpdateGameConfig({ endlessMode: e.target.checked })}
                            $factionPrimary={factionColors.PRIMARY}
                        />
                        <div>
                            <OptionTitle $factionPrimary={factionColors.PRIMARY}>
                                Endless Mode
                            </OptionTitle>
                            <OptionDescription>
                                Continue running D10 missions indefinitely. Otherwise, win after
                                completing D10
                            </OptionDescription>
                        </div>
                    </CheckboxLabel>

                    <CheckboxLabel
                        $selected={gameConfig.enduranceMode}
                        $factionPrimary={factionColors.PRIMARY}
                    >
                        <Checkbox
                            checked={gameConfig.enduranceMode}
                            onChange={(e) =>
                                onUpdateGameConfig({ enduranceMode: e.target.checked })
                            }
                            $factionPrimary={factionColors.PRIMARY}
                        />
                        <div>
                            <OptionTitle $factionPrimary={factionColors.PRIMARY}>
                                Endurance Mode
                            </OptionTitle>
                            <OptionDescription>
                                Complete full operations (1-3 missions) at each difficulty. Draft
                                rewards only given at operation end
                            </OptionDescription>
                        </div>
                    </CheckboxLabel>

                    <CheckboxLabel
                        $selected={gameConfig.brutalityMode}
                        $factionPrimary={factionColors.PRIMARY}
                    >
                        <Checkbox
                            checked={gameConfig.brutalityMode}
                            onChange={(e) =>
                                onUpdateGameConfig({ brutalityMode: e.target.checked })
                            }
                            $factionPrimary={factionColors.PRIMARY}
                        />
                        <div>
                            <OptionTitle $factionPrimary={factionColors.PRIMARY}>
                                Brutality Mode
                            </OptionTitle>
                            <OptionDescription>
                                Non-extracted Helldivers sacrifice loadout items (down to Peacemaker
                                & B-01). If disabled, only all-fail triggers sacrifice.
                            </OptionDescription>
                        </div>
                    </CheckboxLabel>
                </Flex>
            </ConfigSection>
        </div>
    )
}
