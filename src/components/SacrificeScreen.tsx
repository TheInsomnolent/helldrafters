import { useReducer, useState } from 'react'
import { useGamePersistence } from 'src/hooks'
import { gameReducer, initialState } from 'src/state/gameReducer'
import { Button, Caption, getFactionColors } from 'src/styles'
import {
    CenteredContent,
    EmptyBox,
    EmptyDescription,
    EmptyIcon,
    EmptyTitle,
    ExportRow,
    ItemGrid,
    PageWrapper,
    PhaseDescription,
    PhaseTitle,
    SacrificeCard,
    SacrificeCardHint,
    SacrificeCardName,
    SacrificeCardRarity,
    SacrificeCardSlot,
    SacrificeHeader,
    SacrificePenaltyBadge,
    SacrificePenaltySubtext,
    SacrificePenaltyTitle,
    SacrificeWaitSection,
    SacrificeWaitText,
    TitleSeparator,
} from 'src/styles/App.styles'
import { useMultiplayer } from 'src/systems/multiplayer'
import { Item } from 'src/types'
import { getItemById } from 'src/utils/itemHelpers'
import ExportButton from './ExportButton'
import SacrificeConfirmModal from './SacrificeConfirmModal'

import * as actions from '../state/actions'
import * as types from '../state/actionTypes'

interface SacrificeScreenProps {
    startDraftPhase: () => void
}

export default function SacrificeScreen({ startDraftPhase }: SacrificeScreenProps) {
    const [state, dispatch] = useReducer(gameReducer, initialState)

    const { gameConfig, players, sacrificeState } = state

    const multiplayer = useMultiplayer()
    const {
        isMultiplayer,
        isHost,
        hostGame,
        startMultiplayerGame,
        syncState,
        playerSlot,
        sendAction,
        firebaseReady,
    } = multiplayer

    const [showSacrificeConfirm, setShowSacrificeConfirm] = useState(false) // For sacrifice confirmation modal
    const [pendingSacrificeItem, setPendingSacrificeItem] = useState<
        (Item & { slot: string }) | null
    >(null) // Item pending sacrifice

    // Game persistence (save/load functionality)
    const { exportGameState } = useGamePersistence({
        state,
        dispatch,
        firebaseReady,
        hostGame,
        startMultiplayerGame,
        syncState,
        loadGameStateAction: actions.loadGameState,
    })

    const factionColors = getFactionColors(gameConfig.faction)

    const handleSacrifice = (item: Item) => {
        // Sacrifice the item for the current active player
        const playerIndex = sacrificeState.activePlayerIndex
        // eslint-disable-next-line no-console
        console.log(
            'Sacrificing item',
            item.id,
            'for player index',
            playerIndex,
            'player:',
            players[playerIndex]?.name,
        )

        // In multiplayer as client, send action to host instead of processing locally
        if (isMultiplayer && !isHost) {
            sendAction({
                type: types.SACRIFICE_ITEM,
                payload: {
                    playerIndex,
                    itemId: item.id,
                },
            })
            return
        }

        // Apply sacrifice to the players array
        const itemId = item.id
        const updatedPlayers = players.map((player, idx) => {
            if (idx !== playerIndex) return player

            // Remove from inventory
            const newInventory = player.inventory.filter((id) => id !== itemId)

            // Remove from loadout if equipped
            const newLoadout = {
                ...player.loadout,
                stratagems: [...player.loadout.stratagems],
            }

            if (newLoadout.primary === itemId) newLoadout.primary = null
            if (newLoadout.secondary === itemId) {
                newLoadout.secondary = 's_peacemaker'
                if (!newInventory.includes('s_peacemaker')) {
                    newInventory.push('s_peacemaker')
                }
            }
            if (newLoadout.grenade === itemId) {
                newLoadout.grenade = 'g_he'
                if (!newInventory.includes('g_he')) {
                    newInventory.push('g_he')
                }
            }
            if (newLoadout.armor === itemId) {
                newLoadout.armor = 'a_b01'
                if (!newInventory.includes('a_b01')) {
                    newInventory.push('a_b01')
                }
            }
            if (newLoadout.booster === itemId) newLoadout.booster = null

            // Remove stratagem from all slots that match
            for (let i = 0; i < newLoadout.stratagems.length; i++) {
                if (newLoadout.stratagems[i] === itemId) {
                    newLoadout.stratagems[i] = null
                }
            }

            return {
                ...player,
                inventory: newInventory,
                loadout: newLoadout,
            }
        })

        // Move to next player who needs to sacrifice, or end sacrifice phase
        const currentIndex = sacrificeState.sacrificesRequired.indexOf(playerIndex)
        const nextIndex = currentIndex + 1

        // eslint-disable-next-line no-console
        console.log(
            'Current position in sacrifice queue:',
            currentIndex,
            'Next:',
            nextIndex,
            'Total required:',
            sacrificeState.sacrificesRequired,
        )

        if (nextIndex < sacrificeState.sacrificesRequired.length) {
            // Move to next player
            const nextPlayerIndex = sacrificeState.sacrificesRequired[nextIndex]
            // eslint-disable-next-line no-console
            console.log('Moving to next player index:', nextPlayerIndex)
            dispatch(actions.setPlayers(updatedPlayers))
            dispatch(
                actions.updateSacrificeState({
                    activePlayerIndex: nextPlayerIndex,
                }),
            )
        } else {
            // All sacrifices complete - reset extraction status and move to draft
            // eslint-disable-next-line no-console
            console.log('All sacrifices complete, moving to draft')
            const resetPlayers = updatedPlayers.map((p) => ({ ...p, extracted: true }))
            dispatch(actions.setPlayers(resetPlayers))
            startDraftPhase()
        }
    }

    const playerIndex = sacrificeState.activePlayerIndex
    const player = players[playerIndex]

    // In multiplayer, check if it's this player's turn to sacrifice
    const isMyTurn = !isMultiplayer || playerSlot === sacrificeState.activePlayerIndex

    // eslint-disable-next-line no-console
    console.log('SACRIFICE PHASE RENDER:', {
        playerIndex,
        playerName: player?.name,
        isMultiplayer,
        playerSlot,
        activePlayerIndex: sacrificeState.activePlayerIndex,
        isMyTurn,
        showSacrificeConfirm,
        pendingSacrificeItem,
    })

    if (!player) {
        console.error('SACRIFICE: Invalid player index', playerIndex, 'players:', players.length)
        return <div>Error: Invalid player state</div>
    }

    const sacrificableItems: (Item & { slot: string })[] = []

    // Collect all sacrificable items from player's loadout
    // Cannot sacrifice P2-Peacemaker (s_peacemaker) or B-01 Tactical (a_b01)
    if (player.loadout.primary) {
        const item = getItemById(player.loadout.primary)
        if (item) sacrificableItems.push({ ...item, slot: 'Primary' })
    }

    if (player.loadout.secondary && player.loadout.secondary !== 's_peacemaker') {
        const item = getItemById(player.loadout.secondary)
        if (item) sacrificableItems.push({ ...item, slot: 'Secondary' })
    }

    if (player.loadout.grenade && player.loadout.grenade !== 'g_he') {
        const item = getItemById(player.loadout.grenade)
        if (item) sacrificableItems.push({ ...item, slot: 'Grenade' })
    }

    if (player.loadout.armor && player.loadout.armor !== 'a_b01') {
        const item = getItemById(player.loadout.armor)
        if (item) sacrificableItems.push({ ...item, slot: 'Armor' })
    }

    if (player.loadout.booster) {
        const item = getItemById(player.loadout.booster)
        if (item) sacrificableItems.push({ ...item, slot: 'Booster' })
    }

    player.loadout.stratagems.forEach((sid, idx) => {
        if (sid) {
            const item = getItemById(sid)
            if (item) sacrificableItems.push({ ...item, slot: `Stratagem ${idx + 1}` })
        }
    })

    return (
        <PageWrapper $withPadding style={{ display: 'flex', flexDirection: 'column' }}>
            <ExportRow>
                <ExportButton onClick={exportGameState} factionColors={factionColors} />
            </ExportRow>

            <CenteredContent>
                <SacrificeHeader>
                    <SacrificePenaltyBadge>
                        <SacrificePenaltyTitle>⚠️ EXTRACTION FAILURE PENALTY</SacrificePenaltyTitle>
                        <SacrificePenaltySubtext>
                            Equipment Lost in Combat Zone
                        </SacrificePenaltySubtext>
                    </SacrificePenaltyBadge>

                    <PhaseTitle>
                        {player.name} <TitleSeparator>//</TitleSeparator> Sacrifice Item
                    </PhaseTitle>
                    <PhaseDescription>
                        Select one item from your loadout to sacrifice (minimum gear protected)
                    </PhaseDescription>
                </SacrificeHeader>

                {sacrificableItems.length === 0 ? (
                    <EmptyBox>
                        <EmptyIcon>🛡️</EmptyIcon>
                        <EmptyTitle $color={factionColors.PRIMARY}>
                            No Items to Sacrifice
                        </EmptyTitle>
                        <EmptyDescription>
                            You only have minimum required equipment (P2-Peacemaker & B-01
                            Tactical).
                        </EmptyDescription>
                        <Button
                            onClick={() => {
                                // Skip this player - move to next or end sacrifice phase
                                const currentIndex = sacrificeState.sacrificesRequired.indexOf(
                                    sacrificeState.activePlayerIndex,
                                )
                                const nextIndex = currentIndex + 1

                                if (nextIndex < sacrificeState.sacrificesRequired.length) {
                                    dispatch(
                                        actions.updateSacrificeState({
                                            activePlayerIndex:
                                                sacrificeState.sacrificesRequired[nextIndex],
                                        }),
                                    )
                                } else {
                                    const resetPlayers = players.map((p) => ({
                                        ...p,
                                        extracted: true,
                                    }))
                                    dispatch(actions.setPlayers(resetPlayers))
                                    startDraftPhase()
                                }
                            }}
                            $variant="primary"
                            style={{ marginTop: '24px' }}
                        >
                            Continue
                        </Button>
                    </EmptyBox>
                ) : (
                    <ItemGrid
                        $columns={Math.min(sacrificableItems.length, 4)}
                        $disabled={!isMyTurn}
                    >
                        {sacrificableItems.map((item, idx) => (
                            <SacrificeCard
                                key={`${item.id}-${idx}`}
                                onClick={() => {
                                    // eslint-disable-next-line no-console
                                    console.log('Sacrifice card clicked!', {
                                        item,
                                        isMyTurn,
                                        showSacrificeConfirm,
                                    })
                                    if (!isMyTurn) {
                                        // eslint-disable-next-line no-console
                                        console.log('Not my turn, returning')
                                        return
                                    }
                                    // eslint-disable-next-line no-console
                                    console.log('Setting pending sacrifice item and showing modal')
                                    setPendingSacrificeItem(item)
                                    setShowSacrificeConfirm(true)
                                    // eslint-disable-next-line no-console
                                    console.log('State update calls completed')
                                }}
                                $interactive={isMyTurn}
                            >
                                <SacrificeCardSlot>{item.slot}</SacrificeCardSlot>
                                <SacrificeCardName>{item.name}</SacrificeCardName>
                                <SacrificeCardRarity>{item.rarity}</SacrificeCardRarity>
                                <SacrificeCardHint>Click to sacrifice</SacrificeCardHint>
                            </SacrificeCard>
                        ))}
                    </ItemGrid>
                )}
                {!isMyTurn && (
                    <SacrificeWaitSection>
                        <SacrificeWaitText>
                            Waiting for {player.name} to sacrifice an item...
                        </SacrificeWaitText>
                        <Caption>Please wait for your turn</Caption>
                    </SacrificeWaitSection>
                )}
            </CenteredContent>

            {/* Sacrifice Item Confirmation Modal */}
            <SacrificeConfirmModal
                isOpen={showSacrificeConfirm}
                pendingSacrificeItem={pendingSacrificeItem}
                onCancel={() => {
                    setShowSacrificeConfirm(false)
                    setPendingSacrificeItem(null)
                }}
                onConfirm={() => {
                    if (pendingSacrificeItem) {
                        handleSacrifice(pendingSacrificeItem)
                    }
                    setShowSacrificeConfirm(false)
                    setPendingSacrificeItem(null)
                }}
            />
        </PageWrapper>
    )
}
