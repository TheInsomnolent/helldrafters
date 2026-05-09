import { useReducer } from 'react'
import { DIFFICULTY_CONFIG } from 'src/constants/gameConfig'
import { MASTER_DB } from 'src/data/itemsByWarbond'
import { gameReducer, initialState } from 'src/state/gameReducer'
import { getFactionColors, SPACING } from 'src/styles'
import {
    CenteredContent,
    CustomSetupActions,
    CustomSetupPhaseTitle,
    DifficultyButton,
    DifficultyGrid,
    DifficultyLabel,
    FlexButton,
    FormSectionLabel,
    LoadoutConfigTitle,
    LoadoutField,
    LoadoutFieldLabel,
    LoadoutFieldSpaced,
    LoadoutSelect,
    LoadoutSelectColored,
    PageWrapper,
    PhaseDescription,
    PlayerTab,
    PlayerTabs,
    SectionBox,
    SectionBoxSpaced,
    SectionHeader,
    StartOperationButton,
    StratagemGrid,
    StratagemSelect,
} from 'src/styles/App.styles'
import { useMultiplayer } from 'src/systems/multiplayer'
import { Loadout, TYPE } from 'src/types'
import LoadingScreen from './LoadingScreen'

import { trackGameStart } from 'src/utils/analytics'
import { createPlayer } from 'src/utils/playerHelper'
import * as actions from '../state/actions'
import * as runAnalytics from '../state/analyticsStore'

interface GameLobbyProps {
    selectedPlayer: number
    setSelectedPlayer: (index: number) => void
    setGameStartTime: (timestamp: number) => void
}

export default function CustomSetup({
    selectedPlayer,
    setSelectedPlayer,
    setGameStartTime,
}: GameLobbyProps): React.ReactElement {
    const [state, dispatch] = useReducer(gameReducer, initialState)
    const multiplayer = useMultiplayer()

    const { customSetup, gameConfig } = state
    const { isHost, isMultiplayer } = multiplayer

    const factionColors = getFactionColors(gameConfig.faction)

    const startGameFromCustomSetup = () => {
        const newPlayers = customSetup.loadouts.map((loadout: Loadout, i: number) =>
            createPlayer({
                id: String(i + 1),
                name: `Helldiver ${i + 1}`,
                loadout: { ...loadout },
                inventory: Object.values(loadout)
                    .flat()
                    .filter((id): id is string => id !== null),
                weaponRestricted: false,
            }),
        )
        dispatch(actions.setPlayers(newPlayers))
        dispatch(actions.setDifficulty(customSetup.difficulty))
        dispatch(actions.setRequisition(0))
        setGameStartTime(Date.now())
        trackGameStart(isMultiplayer ? 'multiplayer' : 'solo', customSetup.difficulty)
        dispatch(actions.setBurnedCards([]))
        dispatch(actions.setPhase('DASHBOARD'))

        // Initialize run analytics
        runAnalytics.initializeAnalytics(gameConfig, newPlayers)
        dispatch(actions.setRunAnalyticsData(null))
    }

    if (isMultiplayer && !isHost) {
        return (
            <LoadingScreen
                title="HOST CONFIGURING CUSTOM START"
                subtitle="Please wait while the host configures the starting difficulty and loadouts..."
                factionColors={factionColors}
            />
        )
    }

    // Safety check: ensure customSetup.loadouts exists before proceeding
    if (!customSetup || !customSetup.loadouts) {
        return <LoadingScreen title="LOADING..." factionColors={factionColors} />
    }

    const updateLoadoutSlot = (playerIdx: number, slotType: string, itemId: string | null) => {
        const newLoadouts = [...customSetup.loadouts]
        if (slotType === 'stratagem' && itemId) {
            const slotIndex = parseInt(itemId.split('_')[1])
            const stratagems = [...newLoadouts[playerIdx].stratagems]
            stratagems[slotIndex] = itemId.split('_')[0]
            newLoadouts[playerIdx] = { ...newLoadouts[playerIdx], stratagems }
        } else {
            newLoadouts[playerIdx] = { ...newLoadouts[playerIdx], [slotType]: itemId }
        }
        dispatch(actions.updateCustomSetup({ loadouts: newLoadouts }))
    }

    const currentLoadout = customSetup.loadouts[selectedPlayer]
    const itemsByType = {
        primary: MASTER_DB.filter((i) => i.type === TYPE.PRIMARY),
        secondary: MASTER_DB.filter((i) => i.type === TYPE.SECONDARY),
        grenade: MASTER_DB.filter((i) => i.type === TYPE.GRENADE),
        armor: MASTER_DB.filter((i) => i.type === TYPE.ARMOR),
        booster: MASTER_DB.filter((i) => i.type === TYPE.BOOSTER),
        stratagem: MASTER_DB.filter((i) => i.type === TYPE.STRATAGEM),
    }

    return (
        <PageWrapper $withPadding>
            <CenteredContent>
                <SectionHeader $center $marginBottom={SPACING.xxl}>
                    <CustomSetupPhaseTitle $color={factionColors.PRIMARY}>
                        CUSTOM START SETUP
                    </CustomSetupPhaseTitle>
                    <PhaseDescription>Configure starting difficulty and loadouts</PhaseDescription>
                </SectionHeader>

                {/* Difficulty Selection */}
                <SectionBoxSpaced $marginBottom={SPACING.xl}>
                    <FormSectionLabel>Starting Difficulty</FormSectionLabel>
                    <DifficultyGrid>
                        {DIFFICULTY_CONFIG.map((diff) => (
                            <DifficultyButton
                                key={diff.level}
                                onClick={() =>
                                    dispatch(actions.updateCustomSetup({ difficulty: diff.level }))
                                }
                                $selected={customSetup.difficulty === diff.level}
                                $factionColor={factionColors.PRIMARY}
                                title={diff.name}
                            >
                                {diff.level}
                            </DifficultyButton>
                        ))}
                    </DifficultyGrid>
                    <DifficultyLabel $color={factionColors.PRIMARY}>
                        {DIFFICULTY_CONFIG[customSetup.difficulty - 1]?.name}
                    </DifficultyLabel>
                </SectionBoxSpaced>

                {/* Player Tabs */}
                <PlayerTabs>
                    {customSetup.loadouts.map((_, i) => (
                        <PlayerTab
                            key={i}
                            onClick={() => setSelectedPlayer(i)}
                            $active={selectedPlayer === i}
                            $factionColor={factionColors.PRIMARY}
                        >
                            Helldiver {i + 1}
                        </PlayerTab>
                    ))}
                </PlayerTabs>

                {/* Loadout Editor */}
                <SectionBox>
                    <LoadoutConfigTitle $color={factionColors.PRIMARY}>
                        Loadout Configuration
                    </LoadoutConfigTitle>

                    {/* Primary */}
                    <LoadoutFieldSpaced $marginBottom={SPACING.lg}>
                        <LoadoutFieldLabel>Primary</LoadoutFieldLabel>
                        <LoadoutSelectColored
                            value={currentLoadout.primary || ''}
                            onChange={(e) =>
                                updateLoadoutSlot(selectedPlayer, 'primary', e.target.value || null)
                            }
                            $color={factionColors.PRIMARY}
                        >
                            <option value="">None</option>
                            {itemsByType.primary.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.rarity})
                                </option>
                            ))}
                        </LoadoutSelectColored>
                    </LoadoutFieldSpaced>

                    {/* Secondary */}
                    <LoadoutFieldSpaced $marginBottom={SPACING.lg}>
                        <LoadoutFieldLabel>Secondary</LoadoutFieldLabel>
                        <LoadoutSelect
                            value={currentLoadout.secondary || ''}
                            onChange={(e) =>
                                updateLoadoutSlot(
                                    selectedPlayer,
                                    'secondary',
                                    e.target.value || null,
                                )
                            }
                        >
                            <option value="">None</option>
                            {itemsByType.secondary.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.rarity})
                                </option>
                            ))}
                        </LoadoutSelect>
                    </LoadoutFieldSpaced>

                    {/* Grenade */}
                    <LoadoutFieldSpaced $marginBottom={SPACING.lg}>
                        <LoadoutFieldLabel>Grenade</LoadoutFieldLabel>
                        <LoadoutSelect
                            value={currentLoadout.grenade || ''}
                            onChange={(e) =>
                                updateLoadoutSlot(selectedPlayer, 'grenade', e.target.value || null)
                            }
                        >
                            <option value="">None</option>
                            {itemsByType.grenade.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.rarity})
                                </option>
                            ))}
                        </LoadoutSelect>
                    </LoadoutFieldSpaced>

                    {/* Armor */}
                    <LoadoutFieldSpaced $marginBottom={SPACING.lg}>
                        <LoadoutFieldLabel>Armor</LoadoutFieldLabel>
                        <LoadoutSelect
                            value={currentLoadout.armor || ''}
                            onChange={(e) =>
                                updateLoadoutSlot(selectedPlayer, 'armor', e.target.value || null)
                            }
                        >
                            <option value="">None</option>
                            {itemsByType.armor.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.rarity})
                                </option>
                            ))}
                        </LoadoutSelect>
                    </LoadoutFieldSpaced>

                    {/* Booster */}
                    <LoadoutFieldSpaced $marginBottom={SPACING.lg}>
                        <LoadoutFieldLabel>Booster</LoadoutFieldLabel>
                        <LoadoutSelect
                            value={currentLoadout.booster || ''}
                            onChange={(e) =>
                                updateLoadoutSlot(selectedPlayer, 'booster', e.target.value || null)
                            }
                        >
                            <option value="">None</option>
                            {itemsByType.booster.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.rarity})
                                </option>
                            ))}
                        </LoadoutSelect>
                    </LoadoutFieldSpaced>

                    {/* Stratagems */}
                    <LoadoutField>
                        <LoadoutFieldLabel>Stratagems</LoadoutFieldLabel>
                        <StratagemGrid>
                            {[0, 1, 2, 3].map((slotIdx) => (
                                <StratagemSelect
                                    key={slotIdx}
                                    value={currentLoadout.stratagems[slotIdx] || ''}
                                    onChange={(e) => {
                                        const newStratagems = [...currentLoadout.stratagems]
                                        newStratagems[slotIdx] = e.target.value || null
                                        // Update stratagems directly on loadout
                                        const newLoadouts = [...customSetup.loadouts]
                                        newLoadouts[selectedPlayer] = {
                                            ...newLoadouts[selectedPlayer],
                                            stratagems: newStratagems,
                                        }
                                        dispatch(
                                            actions.updateCustomSetup({
                                                loadouts: newLoadouts,
                                            }),
                                        )
                                    }}
                                >
                                    <option value="">Slot {slotIdx + 1}: None</option>
                                    {itemsByType.stratagem.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </StratagemSelect>
                            ))}
                        </StratagemGrid>
                    </LoadoutField>
                </SectionBox>

                {/* Action Buttons */}
                <CustomSetupActions>
                    <FlexButton
                        onClick={() => dispatch(actions.setPhase('MENU'))}
                        $variant="danger"
                    >
                        Back to Menu
                    </FlexButton>
                    <StartOperationButton onClick={startGameFromCustomSetup} $variant="primary">
                        Start Operation
                    </StartOperationButton>
                </CustomSetupActions>
            </CenteredContent>
        </PageWrapper>
    )
}
