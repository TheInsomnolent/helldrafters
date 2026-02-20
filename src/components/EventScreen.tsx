import { useReducer } from 'react'
import { Subfaction } from 'src/constants/balancingConfig'
import { MASTER_DB } from 'src/data/itemsByWarbond'
import { gameReducer, initialState } from 'src/state/gameReducer'
import { EventPageWrapper } from 'src/styles/App.styles'
import {
    applyGainBoosterWithSelection,
    canAffordChoice,
    EventSelections,
    formatOutcome,
    formatOutcomes,
    needsPlayerChoice,
    processAllOutcomes,
} from 'src/systems/events/eventProcessor'
import { EVENT_TYPES } from 'src/systems/events/events'
import { saveRunToHistory } from 'src/systems/persistence/saveManager'
import { EventChoice, EventOutcome, Faction, TYPE } from 'src/types'
import { trackEventChoice } from 'src/utils/analytics'
import { createDraftState, generateDraftHand, getDraftHandSize } from 'src/utils/draftHelpers'
import EventDisplay from './EventDisplay'
import { MultiplayerStatusBar } from './MultiplayerLobby'

import { useMultiplayer } from 'src/systems/multiplayer'
import * as actions from '../state/actions'
import * as runAnalytics from '../state/analyticsStore'
import * as eventsV2 from '../systems/eventsV2'

interface EventScreenProps {
    getConnectedPlayerIndices: () => number[]
}

export default function EventScreen({ getConnectedPlayerIndices }: EventScreenProps) {
    const [state, dispatch] = useReducer(gameReducer, initialState)

    const {
        gameConfig,
        currentDiff,
        requisition,
        burnedCards,
        players,
        currentEvent,
        eventPlayerChoice,
        eventSourcePlayerSelection,
        eventStratagemSelection,
        eventTargetPlayerSelection,
        eventTargetStratagemSelection,
        eventBoosterDraft,
        eventBoosterSelection,
        eventSpecialDraft,
        eventSpecialDraftType,
        eventSpecialDraftSelections,
        eventSelectedChoice,
        pendingFaction,
        pendingSubfactionSelection,
        eventsEnabled,
    } = state

    // Multiplayer context
    const multiplayer = useMultiplayer()
    const { isMultiplayer, isHost, disconnect, playerSlot, sendAction, lobbyId } = multiplayer

    if (!currentEvent) {
        dispatch(actions.setPhase('DRAFT'))
        return null
    }

    /**
     * Clear event state from Firebase when completing an event
     * Call this whenever closing/completing an event
     */
    const clearEventsV2State = () => {
        if (eventsEnabled && isMultiplayer && lobbyId) {
            console.debug(`[eventsV2] Host clearing event UI state for lobby ${lobbyId}`)
            eventsV2
                .clearEventUIState(lobbyId)
                .then(() => {
                    console.debug(
                        `[eventsV2] Successfully cleared event UI state for lobby ${lobbyId}`,
                    )
                })
                .catch((error) => {
                    console.error(
                        `[eventsV2] Failed to clear eventsV2 state for lobby ${lobbyId}:`,
                        error,
                    )
                })
        }
    }

    const handleEventChoice = (choice?: EventChoice) => {
        // Track event choice
        trackEventChoice(currentEvent?.type || 'unknown', choice?.text || 'unknown')

        // Record event for analytics
        runAnalytics.recordGameEvent(
            currentEvent?.id || 'unknown',
            currentEvent?.name || 'Unknown Event',
            currentEvent?.type || 'unknown',
            choice?.text || 'Unknown Choice',
            currentDiff,
            players.map((p) => p.id),
        )

        // Process outcomes using the event processor with selections
        // Transform our StratagemSelection types to EventSelections format
        const selections: EventSelections = {
            sourcePlayerSelection: eventSourcePlayerSelection,
            stratagemSelection: eventStratagemSelection
                ? {
                      stratagemId: eventStratagemSelection.stratagemId,
                      stratagemSlotIndex: eventStratagemSelection.stratagemSlotIndex,
                  }
                : undefined,
            targetPlayerSelection: eventTargetPlayerSelection,
            targetStratagemSelection: eventTargetStratagemSelection
                ? {
                      stratagemSlotIndex: eventTargetStratagemSelection.stratagemSlotIndex,
                  }
                : undefined,
        }

        const updates = processAllOutcomes(
            choice?.outcomes || [],
            choice || null,
            {
                players,
                eventPlayerChoice,
                requisition,
                currentDiff,
                gameConfig,
                burnedCards,
            },
            selections,
        )

        // Check if we need booster selection
        if (updates.needsBoosterSelection && updates.boosterDraft) {
            dispatch(actions.setEventBoosterDraft(updates.boosterDraft))
            // Store the outcome for later application
            window.__boosterOutcome = updates.boosterOutcome

            // Burn both booster options shown in the draft
            if (updates.burnBoosterDraft && updates.burnBoosterDraft.length > 0) {
                updates.burnBoosterDraft.forEach((boosterId) => {
                    dispatch(actions.addBurnedCard(boosterId))
                })
            }

            return // Don't close event yet, wait for booster selection
        }

        // Check if we need subfaction selection
        if (updates.needsSubfactionSelection && updates.pendingFaction) {
            dispatch(actions.setPendingFaction(updates.pendingFaction as Faction))
            return // Don't close event yet, wait for subfaction selection
        }

        // Check if we need special draft (throwable or secondary for all players)
        if (updates.needsSpecialDraft && updates.specialDraftType) {
            // Generate draft pool based on type
            const itemType =
                updates.specialDraftType === 'throwable' ? TYPE.GRENADE : TYPE.SECONDARY
            let availableItems = MASTER_DB.filter((item) => item.type === itemType)

            // Filter out burned cards if burn mode is enabled
            if (gameConfig.burnCards && burnedCards.length > 0) {
                availableItems = availableItems.filter((item) => !burnedCards.includes(item.id))
            }

            // For throwables, enforce global uniqueness (each must be different across all players)
            if (updates.specialDraftType === 'throwable' && gameConfig.globalUniqueness) {
                const existingThrowables = new Set()
                players.forEach((player) => {
                    if (player.loadout.grenade) {
                        existingThrowables.add(player.loadout.grenade)
                    }
                })
                availableItems = availableItems.filter((item) => !existingThrowables.has(item.id))
            }

            // Set up special draft state
            dispatch(actions.setEventSpecialDraft(availableItems))
            dispatch(actions.setEventSpecialDraftType(updates.specialDraftType))
            dispatch(actions.setEventSpecialDraftSelections(new Array(players.length).fill(null)))

            // Apply player updates (armor changes)
            if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players))

            return // Don't close event yet, wait for all players to select
        }

        // Apply state updates
        if (updates.requisition !== undefined) dispatch(actions.setRequisition(updates.requisition))
        if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players))
        if (updates.currentDiff !== undefined) dispatch(actions.setDifficulty(updates.currentDiff))
        if (updates.faction !== undefined || updates.subfaction !== undefined) {
            const configUpdates: { faction?: Faction; subfaction?: string } = {}
            if (updates.faction !== undefined) configUpdates.faction = updates.faction as Faction
            if (updates.subfaction !== undefined && updates.subfaction !== null)
                configUpdates.subfaction = updates.subfaction
            dispatch(actions.updateGameConfig(configUpdates))
        }
        if (updates.bonusRequisition !== undefined)
            dispatch(actions.addRequisition(updates.bonusRequisition))

        // Handle burned cards from transformation
        if (updates.newBurnedCards && updates.newBurnedCards.length > 0) {
            updates.newBurnedCards.forEach((cardId) => dispatch(actions.addBurnedCard(cardId)))
        }

        // Display transformed slots
        if (updates.transformedSlots && updates.transformedSlots.length > 0) {
            const transformedSlots = updates.transformedSlots
            const transformList = transformedSlots
                .map(
                    (t) => `${t.slot.replace('_', ' ').toUpperCase()}: ${t.oldItem} → ${t.newItem}`,
                )
                .join('\n• ')
            setTimeout(() => {
                alert(
                    `Quantum Reconfiguration Complete!\n\n${transformedSlots.length} item${transformedSlots.length > 1 ? 's' : ''} transformed:\n\n• ${transformList}`,
                )
            }, 100)
        }

        // Check if we need to immediately start a redraft
        if (updates.needsRedraft && updates.redraftPlayerIndex !== undefined) {
            // Show liquidated items message
            if (updates.liquidatedItems && updates.liquidatedItems.length > 0) {
                const liquidatedItems = updates.liquidatedItems
                const itemsList = liquidatedItems.join('\n• ')
                const draftCount = updates.redraftCount || 1
                setTimeout(() => {
                    alert(
                        `Assets Liquidated (${liquidatedItems.length} items):\n\n• ${itemsList}\n\nYou will now complete ${draftCount} draft round${draftCount > 1 ? 's' : ''} to rebuild your loadout.`,
                    )
                }, 100)
            }

            // Close event
            dispatch(actions.setCurrentEvent(null))
            dispatch(actions.resetEventSelections())
            clearEventsV2State()

            // Get the updated players
            const updatedPlayers = updates.players || players

            // Start first draft round for the redrafting player
            const redraftPlayer = updatedPlayers[updates.redraftPlayerIndex]
            const playerLockedSlots = redraftPlayer?.lockedSlots || []
            const redraftHand = generateDraftHand(
                redraftPlayer,
                currentDiff,
                gameConfig,
                burnedCards,
                updatedPlayers,
                (cardId) => dispatch(actions.addBurnedCard(cardId)),
                getDraftHandSize(gameConfig.starRating),
                playerLockedSlots,
            )

            dispatch(
                actions.setDraftState(
                    createDraftState({
                        activePlayerIndex: updates.redraftPlayerIndex,
                        roundCards: redraftHand,
                        isRerolling: false,
                        pendingStratagem: null,
                        extraDraftRound: 0,
                        isRedrafting: true, // Flag to indicate this is a redraft
                        draftOrder: [updates.redraftPlayerIndex], // Single player redraft
                    }),
                ),
            )
            dispatch(actions.setPhase('DRAFT'))
            return
        }

        // Display removed item notification
        if (updates.removedItemName) {
            const itemType =
                updates.removedItemType === 'stratagem'
                    ? 'Stratagem'
                    : updates.removedItemType === 'primary'
                      ? 'Primary Weapon'
                      : updates.removedItemType === 'secondary'
                        ? 'Secondary Weapon'
                        : 'Grenade'
            setTimeout(() => {
                alert(
                    `Equipment Confiscated: ${updates.removedItemName} (${itemType}) has been removed from your loadout.`,
                )
            }, 100)
        }

        // Display gained item notification (single player)
        if (updates.gainedItemName) {
            setTimeout(() => {
                alert(
                    `Equipment Acquired: ${updates.gainedItemName} has been added to your loadout!`,
                )
            }, 100)
        }

        // Display gained items notification (multiple players)
        if (updates.gainedItems && updates.gainedItems.length > 0) {
            const gainedItems = updates.gainedItems
            setTimeout(() => {
                const itemList = gainedItems
                    .map((item) => `${state.players[item.playerIndex].name}: ${item.itemName}`)
                    .join('\n')
                alert(`Equipment Acquired:\n${itemList}`)
            }, 100)
        }

        // Handle game over
        if (updates.triggerGameOver) {
            // Finalize and save run analytics
            const analyticsSnapshot = runAnalytics.finalizeRun('defeat', state)
            dispatch(actions.setRunAnalyticsData(analyticsSnapshot))
            saveRunToHistory(analyticsSnapshot)

            setTimeout(() => dispatch(actions.setPhase('GAMEOVER')), 100)
            return
        }

        // After event, proceed to dashboard
        dispatch(actions.setCurrentEvent(null))
        dispatch(actions.resetEventSelections())
        clearEventsV2State()
        dispatch(actions.setPhase('DASHBOARD'))
    }

    const handleAutoContinue = () => {
        // Handle booster selection confirmation
        if (eventBoosterDraft && eventBoosterSelection) {
            const outcome = window.__boosterOutcome as EventOutcome
            const newPlayers = applyGainBoosterWithSelection(
                players,
                outcome,
                eventPlayerChoice,
                eventBoosterSelection,
            )
            dispatch(actions.setPlayers(newPlayers))

            // Clean up and close event
            window.__boosterOutcome = null
            dispatch(actions.setCurrentEvent(null))
            dispatch(actions.resetEventSelections())
            clearEventsV2State()
            dispatch(actions.setPhase('DASHBOARD'))
            return
        }

        // Handle special draft completion (all players have selected)
        if (eventSpecialDraft && eventSpecialDraftType) {
            // Check if all players have their selections stored
            const allPlayersSelected =
                Array.isArray(eventSpecialDraftSelections) &&
                eventSpecialDraftSelections.length === players.length &&
                eventSpecialDraftSelections.every(
                    (selection) => selection !== null && selection !== undefined,
                )

            if (!allPlayersSelected) {
                return
            }

            const newPlayers = [...players]
            const selections = eventSpecialDraftSelections

            // Apply selections and burn cards
            selections.forEach((itemId, playerIndex) => {
                if (eventSpecialDraftType === 'throwable') {
                    newPlayers[playerIndex].loadout.grenade = itemId
                } else if (eventSpecialDraftType === 'secondary') {
                    newPlayers[playerIndex].loadout.secondary = itemId
                }

                // Burn the selected card if burn mode is enabled
                if (gameConfig.burnCards) {
                    dispatch(actions.addBurnedCard(itemId))
                }
            })

            dispatch(actions.setPlayers(newPlayers))

            // Clean up
            dispatch(actions.setCurrentEvent(null))
            dispatch(actions.resetEventSelections())
            clearEventsV2State()
            dispatch(actions.setPhase('DASHBOARD'))
            return
        }

        if (currentEvent.outcomes) {
            let outcomesToProcess: EventOutcome[] = []

            if (currentEvent.type === EVENT_TYPES.RANDOM) {
                // Pick weighted random outcome
                const totalWeight = currentEvent.outcomes.reduce(
                    (sum, o) => sum + (o.weight || 1),
                    0,
                )
                let random = Math.random() * totalWeight
                for (const outcome of currentEvent.outcomes) {
                    random -= outcome.weight || 1
                    if (random <= 0) {
                        outcomesToProcess = [outcome]
                        break
                    }
                }
            } else {
                // Process all outcomes for BENEFICIAL/DETRIMENTAL
                outcomesToProcess = currentEvent.outcomes
            }

            // Process outcomes using the event processor
            const updates = processAllOutcomes(outcomesToProcess, null, {
                players,
                eventPlayerChoice,
                requisition,
                currentDiff,
                gameConfig,
                burnedCards,
            })

            // Apply state updates
            if (updates.requisition !== undefined)
                dispatch(actions.setRequisition(updates.requisition))
            if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players))
            if (updates.currentDiff !== undefined)
                dispatch(actions.setDifficulty(updates.currentDiff))
            if (updates.faction !== undefined || updates.subfaction !== undefined) {
                const configUpdates: { faction?: Faction; subfaction?: string } = {}
                if (updates.faction !== undefined)
                    configUpdates.faction = updates.faction as Faction
                if (updates.subfaction !== undefined && updates.subfaction !== null)
                    configUpdates.subfaction = updates.subfaction
                dispatch(actions.updateGameConfig(configUpdates))
            }

            // Handle game over
            if (updates.triggerGameOver) {
                // Finalize and save run analytics
                const analyticsSnapshot = runAnalytics.finalizeRun('defeat', state)
                dispatch(actions.setRunAnalyticsData(analyticsSnapshot))
                saveRunToHistory(analyticsSnapshot)

                setTimeout(() => dispatch(actions.setPhase('GAMEOVER')), 100)
                return
            }
        }

        dispatch(actions.setCurrentEvent(null))
        dispatch(actions.resetEventSelections())
        clearEventsV2State()
        dispatch(actions.setPhase('DASHBOARD'))
    }

    const handleSkipEvent = () => {
        // Emergency skip for beta testing - helps escape soft-locks
        dispatch(actions.setCurrentEvent(null))
        dispatch(actions.resetEventSelections())
        clearEventsV2State()
        dispatch(actions.setPhase('DASHBOARD'))
    }

    return (
        <EventPageWrapper>
            {/* MULTIPLAYER STATUS BAR */}
            {isMultiplayer && (
                <MultiplayerStatusBar gameConfig={gameConfig} onDisconnect={disconnect} />
            )}

            <EventDisplay
                currentEvent={currentEvent}
                eventPlayerChoice={eventPlayerChoice}
                eventSourcePlayerSelection={eventSourcePlayerSelection}
                eventStratagemSelection={eventStratagemSelection}
                eventTargetPlayerSelection={eventTargetPlayerSelection}
                eventTargetStratagemSelection={eventTargetStratagemSelection}
                eventBoosterDraft={eventBoosterDraft}
                eventBoosterSelection={eventBoosterSelection}
                eventSpecialDraft={eventSpecialDraft}
                eventSpecialDraftType={eventSpecialDraftType}
                eventSpecialDraftSelections={eventSpecialDraftSelections}
                eventSelectedChoice={eventSelectedChoice}
                pendingFaction={pendingFaction}
                pendingSubfactionSelection={pendingSubfactionSelection as Subfaction | null}
                players={players}
                currentDiff={currentDiff}
                requisition={requisition}
                isHost={!isMultiplayer || isHost}
                isMultiplayer={isMultiplayer}
                playerSlot={playerSlot}
                needsPlayerChoice={needsPlayerChoice}
                canAffordChoice={canAffordChoice}
                formatOutcome={formatOutcome}
                formatOutcomes={formatOutcomes}
                connectedPlayerIndices={isMultiplayer ? getConnectedPlayerIndices() : null}
                onPlayerChoice={(choice) => dispatch(actions.setEventPlayerChoice(choice))}
                onEventChoice={handleEventChoice}
                onAutoContinue={handleAutoContinue}
                onSkipEvent={handleSkipEvent}
                onSourcePlayerSelection={(playerIndex) =>
                    dispatch(actions.setEventSourcePlayerSelection(playerIndex))
                }
                onStratagemSelection={(selection) =>
                    dispatch(actions.setEventStratagemSelection(selection))
                }
                onTargetPlayerSelection={(playerIndex) =>
                    dispatch(actions.setEventTargetPlayerSelection(playerIndex))
                }
                onTargetStratagemSelection={(selection) =>
                    dispatch(actions.setEventTargetStratagemSelection(selection))
                }
                onBoosterSelection={(boosterId) =>
                    dispatch(actions.setEventBoosterSelection(boosterId))
                }
                onEventSelectedChoice={(choice) => dispatch(actions.setEventSelectedChoice(choice))}
                onSubfactionSelection={(subfaction) => {
                    // Only host can select subfaction in multiplayer
                    if (isMultiplayer && !isHost) return
                    dispatch(actions.setPendingSubfactionSelection(subfaction))
                }}
                onConfirmSubfaction={() => {
                    // Only host can confirm subfaction in multiplayer
                    if (isMultiplayer && !isHost) return

                    // Apply the faction and subfaction change
                    dispatch(
                        actions.updateGameConfig({
                            faction: pendingFaction ?? undefined,
                            subfaction: pendingSubfactionSelection ?? undefined,
                        }),
                    )
                    // Close the event
                    dispatch(actions.setCurrentEvent(null))
                    dispatch(actions.setEventPlayerChoice(null))
                    dispatch(actions.resetEventSelections())
                    clearEventsV2State()
                    dispatch(actions.setPhase('DASHBOARD'))
                }}
                onSpecialDraftSelection={(playerIndex, itemId) => {
                    if (isMultiplayer && playerSlot !== playerIndex) {
                        return
                    }

                    if (isMultiplayer && !isHost) {
                        sendAction({
                            type: 'SET_EVENT_SPECIAL_DRAFT_SELECTION',
                            payload: {
                                playerIndex,
                                itemId,
                            },
                        })
                        return
                    }

                    dispatch(actions.setEventSpecialDraftSelection({ playerIndex, itemId }))
                }}
                onConfirmSelections={handleEventChoice}
            />
        </EventPageWrapper>
    )
}
