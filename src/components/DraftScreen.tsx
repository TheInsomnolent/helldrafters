import { RefreshCw } from 'lucide-react'
import { useReducer } from 'react'
import { useGamePersistence } from 'src/hooks'
import { gameReducer, initialState } from 'src/state/gameReducer'
import { getFactionColors, SPACING } from 'src/styles'
import {
    ActionButton,
    AlertBox,
    AlertSubtitle,
    AlertTitle,
    ButtonRow,
    CenteredContent,
    ContentWrapper,
    ExportRow,
    HintText,
    ItemGrid,
    LoadoutItems,
    LoadoutLabel,
    LoadoutOverview,
    LoadoutSlot,
    LoadoutSlotLabel,
    LoadoutSlotValue,
    MonoText,
    PageWrapper,
    PhaseDescription,
    PhaseSubtitle,
    PhaseTitle,
    RequisitionDisplay,
    SectionHeader,
    SkipButton,
    StratagemGap,
    TitleSeparator,
    WaitingMessage,
    WaitingText,
} from 'src/styles/App.styles'
import { useMultiplayer } from 'src/systems/multiplayer'
import { DraftHandItem } from 'src/types'
import { getItemById } from 'src/utils/itemHelpers'
import ExportButton from './ExportButton'
import { isItem, ItemCard } from './ItemCard'
import { MultiplayerStatusBar } from './MultiplayerLobby'
import RemoveCardConfirmModal from './RemoveCardConfirmModal'
import StratagemReplacementModal from './StratagemReplacementModal'

import * as actions from '../state/actions'
import * as types from '../state/actionTypes'
import * as runAnalytics from '../state/analyticsStore'

interface DraftScreenProps {
    proceedToNextDraft: (updatedPlayers: typeof initialState.players) => void
    handleDraftPick: (item: DraftHandItem) => void
    handleSkipDraft: () => void
    setPendingCardRemoval: React.Dispatch<React.SetStateAction<DraftHandItem | null>>
    setShowRemoveCardConfirm: React.Dispatch<React.SetStateAction<boolean>>
    generateDraftHandForPlayer: (playerIndex: number) => DraftHandItem[]
    showRemoveCardConfirm: boolean
    pendingCardRemoval: DraftHandItem | null
    confirmRemoveCardFromDraft: () => void
}

export default function DraftScreen({
    proceedToNextDraft,
    handleDraftPick,
    handleSkipDraft,
    setPendingCardRemoval,
    setShowRemoveCardConfirm,
    generateDraftHandForPlayer,
    showRemoveCardConfirm,
    pendingCardRemoval,
    confirmRemoveCardFromDraft,
}: DraftScreenProps) {
    const [state, dispatch] = useReducer(gameReducer, initialState)

    const { gameConfig, currentDiff, requisition, players, draftState, draftHistory } = state

    const multiplayer = useMultiplayer()
    const {
        isMultiplayer,
        isHost,
        hostGame,
        startMultiplayerGame,
        syncState,
        disconnect,
        playerSlot,
        sendAction,
        firebaseReady,
    } = multiplayer

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

    const handleStratagemReplacement = (slotIndex: number) => {
        const currentPlayerIdx = draftState.activePlayerIndex

        // In multiplayer, only the player whose turn it is can select replacement
        if (isMultiplayer && playerSlot !== currentPlayerIdx) {
            console.warn('Not your turn to select replacement', { playerSlot, currentPlayerIdx })
            return
        }

        // In multiplayer as client, send action to host instead of processing locally
        if (isMultiplayer && !isHost) {
            sendAction({
                type: types.STRATAGEM_REPLACEMENT,
                payload: {
                    playerIndex: currentPlayerIdx,
                    slotIndex,
                },
            })
            return
        }

        const updatedPlayers = [...players]
        const player = updatedPlayers[currentPlayerIdx]
        const item = draftState.pendingStratagem

        // Guard: ensure we have a pending stratagem
        if (!item) {
            console.error('handleStratagemReplacement: No pending stratagem', {
                currentPlayerIdx,
                slotIndex,
            })
            return
        }

        // Add to inventory
        player.inventory.push(item.id)

        // Replace the selected slot
        player.loadout.stratagems[slotIndex] = item.id

        dispatch(actions.setPlayers(updatedPlayers))
        dispatch(actions.updateDraftState({ pendingStratagem: null }))

        // Record loadout change for analytics
        runAnalytics.recordLoadoutChange(
            String(currentPlayerIdx),
            player.name || `Helldiver ${currentPlayerIdx + 1}`,
            { ...player.loadout },
            `stratagems`,
            item.id,
            `Replaced stratagem slot ${slotIndex + 1}: ${item.name || 'Unknown'}`,
        )

        // Next player, extra draft, or finish
        proceedToNextDraft(updatedPlayers)
    }

    const removeCardFromDraft = (cardToRemove: DraftHandItem) => {
        // Show confirmation modal first
        setPendingCardRemoval(cardToRemove)
        setShowRemoveCardConfirm(true)
    }

    const rerollDraft = (cost: number) => {
        if (requisition < cost) return

        // In multiplayer as client, send action to host instead of processing locally
        if (isMultiplayer && !isHost) {
            sendAction({
                type: 'DRAFT_REROLL',
                payload: {
                    cost,
                    playerIndex: draftState.activePlayerIndex,
                },
            })
            return
        }

        dispatch(actions.spendRequisition(cost))

        // Record requisition spend for analytics
        const playerName =
            players[draftState.activePlayerIndex]?.name ||
            `Helldiver ${draftState.activePlayerIndex + 1}`
        runAnalytics.recordRequisitionChange(-cost, playerName, 'Draft Reroll')
        runAnalytics.recordRerollUsed(
            String(draftState.activePlayerIndex),
            playerName,
            currentDiff,
            cost,
        )

        dispatch(
            actions.updateDraftState({
                roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex),
            }),
        )
    }

    const player = players[draftState.activePlayerIndex]

    // In multiplayer, check if it's this player's turn to draft
    const isMyTurn = !isMultiplayer || playerSlot === draftState.activePlayerIndex

    return (
        <PageWrapper>
            {/* MULTIPLAYER STATUS BAR */}
            {isMultiplayer && (
                <MultiplayerStatusBar gameConfig={gameConfig} onDisconnect={disconnect} />
            )}

            <ContentWrapper>
                <ExportRow>
                    <ExportButton onClick={exportGameState} factionColors={factionColors} />
                </ExportRow>

                {/* Stratagem Replacement Modal */}
                <StratagemReplacementModal
                    isOpen={!!draftState.pendingStratagem}
                    pendingStratagem={draftState.pendingStratagem}
                    player={player}
                    factionColors={factionColors}
                    onSelectSlot={handleStratagemReplacement}
                    onCancel={() => dispatch(actions.updateDraftState({ pendingStratagem: null }))}
                />

                <CenteredContent>
                    <SectionHeader $center $marginBottom="40px">
                        {draftState.isRetrospective && (
                            <AlertBox $variant="info">
                                <AlertTitle $color="#3b82f6">
                                    🔄 RETROSPECTIVE DRAFT{' '}
                                    {(player.retrospectiveDraftsCompleted || 0) + 1}/
                                    {player.catchUpDraftsRemaining || draftHistory.length}
                                </AlertTitle>
                                <AlertSubtitle>
                                    Catching up on past mission rewards • No rerolls available
                                </AlertSubtitle>
                            </AlertBox>
                        )}
                        {draftState.extraDraftRound > 0 && (
                            <AlertBox
                                $variant="success"
                                style={{
                                    backgroundColor: `${factionColors.PRIMARY}20`,
                                    borderColor: factionColors.PRIMARY,
                                }}
                            >
                                <AlertTitle $color={factionColors.PRIMARY}>
                                    🎁 BONUS DRAFT {draftState.extraDraftRound}/
                                    {player.extraDraftCards || 0}
                                </AlertTitle>
                                <AlertSubtitle>Priority Access Equipment</AlertSubtitle>
                            </AlertBox>
                        )}
                        {draftState.isRedrafting && (player.redraftRounds ?? 0) > 0 && (
                            <AlertBox $variant="error">
                                <AlertTitle $color={factionColors.PRIMARY}>
                                    🔄 ASSET REINVESTMENT
                                </AlertTitle>
                                <AlertSubtitle>
                                    Draft {player.redraftRounds} of {player.redraftRounds} Remaining
                                </AlertSubtitle>
                            </AlertBox>
                        )}
                        <PhaseSubtitle $color={factionColors.PRIMARY}>
                            Priority Requisition Authorized
                        </PhaseSubtitle>
                        <PhaseTitle>
                            {player.name} <TitleSeparator>//</TitleSeparator> Select Upgrade
                        </PhaseTitle>
                        <PhaseDescription>
                            Choose wisely. This equipment is vital for Difficulty {currentDiff}.
                        </PhaseDescription>
                    </SectionHeader>

                    {/* Current Loadout Overview */}
                    <LoadoutOverview>
                        <LoadoutLabel>{player.name}'s Current Loadout</LoadoutLabel>
                        <LoadoutItems>
                            {/* Primary */}
                            <LoadoutSlot>
                                <LoadoutSlotLabel>Primary</LoadoutSlotLabel>
                                <LoadoutSlotValue
                                    $hasItem={!!player.loadout.primary}
                                    $color={
                                        player.loadout.primary ? factionColors.PRIMARY : undefined
                                    }
                                >
                                    {player.loadout.primary
                                        ? getItemById(player.loadout.primary)?.name || '—'
                                        : '—'}
                                </LoadoutSlotValue>
                            </LoadoutSlot>

                            {/* Stratagems */}
                            <LoadoutSlot>
                                <LoadoutSlotLabel>Stratagems</LoadoutSlotLabel>
                                <StratagemGap>
                                    {player.loadout.stratagems.map((sid, i) => {
                                        const strat = sid ? getItemById(sid) : null
                                        return (
                                            <LoadoutSlotValue
                                                key={i}
                                                $hasItem={!!strat}
                                                title={strat?.name || 'Empty'}
                                            >
                                                {strat?.name || '—'}
                                            </LoadoutSlotValue>
                                        )
                                    })}
                                </StratagemGap>
                            </LoadoutSlot>

                            {/* Secondary */}
                            <LoadoutSlot>
                                <LoadoutSlotLabel>Secondary</LoadoutSlotLabel>
                                <LoadoutSlotValue $hasItem={!!player.loadout.secondary}>
                                    {player.loadout.secondary
                                        ? getItemById(player.loadout.secondary)?.name || '—'
                                        : '—'}
                                </LoadoutSlotValue>
                            </LoadoutSlot>

                            {/* Grenade */}
                            <LoadoutSlot>
                                <LoadoutSlotLabel>Grenade</LoadoutSlotLabel>
                                <LoadoutSlotValue $hasItem={!!player.loadout.grenade}>
                                    {player.loadout.grenade
                                        ? getItemById(player.loadout.grenade)?.name || '—'
                                        : '—'}
                                </LoadoutSlotValue>
                            </LoadoutSlot>

                            {/* Armor */}
                            <LoadoutSlot>
                                <LoadoutSlotLabel>Armor</LoadoutSlotLabel>
                                <LoadoutSlotValue $hasItem={!!player.loadout.armor}>
                                    {player.loadout.armor
                                        ? getItemById(player.loadout.armor)?.name || '—'
                                        : '—'}
                                </LoadoutSlotValue>
                            </LoadoutSlot>

                            {/* Booster */}
                            {player.loadout.booster && (
                                <LoadoutSlot>
                                    <LoadoutSlotLabel>Booster</LoadoutSlotLabel>
                                    <LoadoutSlotValue $hasItem $special>
                                        {getItemById(player.loadout.booster)?.name || '—'}
                                    </LoadoutSlotValue>
                                </LoadoutSlot>
                            )}
                        </LoadoutItems>
                    </LoadoutOverview>

                    {/* Filter out any null/undefined items that may have been stripped during sync */}
                    {(() => {
                        const validCards = (draftState.roundCards || []).filter(
                            (item): item is DraftHandItem =>
                                item !== null &&
                                item !== undefined &&
                                (isItem(item)
                                    ? Boolean(item.id || item.name)
                                    : Boolean(item.passive)),
                        )
                        return (
                            <ItemGrid
                                $columns={Math.min(validCards.length, 4)}
                                $disabled={!isMyTurn}
                            >
                                {validCards.map((item, idx) => (
                                    <ItemCard
                                        key={`${isItem(item) ? item.id : item.passive}-${idx}`}
                                        item={item}
                                        factionColors={factionColors}
                                        onSelect={isMyTurn ? handleDraftPick : undefined}
                                        onRemove={isMyTurn ? removeCardFromDraft : undefined}
                                        shouldPulse={isMyTurn}
                                        animationDelay={idx * 0.2}
                                    />
                                ))}
                            </ItemGrid>
                        )
                    })()}

                    {/* Not your turn message */}
                    {!isMyTurn && (
                        <WaitingMessage>
                            <WaitingText>Waiting for {player.name} to draft...</WaitingText>
                        </WaitingMessage>
                    )}

                    {/* Only show draft controls if it's your turn */}
                    {isMyTurn && (
                        <>
                            <ButtonRow>
                                {/* Disable rerolling during retrospective drafts */}
                                {!draftState.isRetrospective && (
                                    <ActionButton
                                        onClick={() => rerollDraft(1)}
                                        disabled={requisition < 1}
                                        $variant="outline"
                                        $disabled={requisition < 1}
                                    >
                                        <RefreshCw size={20} />
                                        Reroll All Cards (-1 Req)
                                    </ActionButton>
                                )}
                                <SkipButton onClick={handleSkipDraft}>Skip Draft</SkipButton>
                            </ButtonRow>

                            <HintText $center $marginTop={SPACING.lg}>
                                Click the × on a card to remove just that card (free)
                                <br />
                                Or use "Reroll All Cards" to reroll the entire hand
                            </HintText>
                        </>
                    )}

                    <RequisitionDisplay>
                        <MonoText $color={factionColors.PRIMARY}>
                            Current Requisition: {Math.floor(requisition)} R
                        </MonoText>
                    </RequisitionDisplay>
                </CenteredContent>
            </ContentWrapper>

            {/* Remove Card Confirmation Modal */}
            <RemoveCardConfirmModal
                isOpen={showRemoveCardConfirm}
                pendingCardRemoval={pendingCardRemoval}
                onCancel={() => {
                    setShowRemoveCardConfirm(false)
                    setPendingCardRemoval(null)
                }}
                onConfirm={confirmRemoveCardFromDraft}
            />
        </PageWrapper>
    )
}
