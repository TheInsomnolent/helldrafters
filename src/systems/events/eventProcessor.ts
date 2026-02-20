/**
 * Event processor for handling event outcomes
 */

import { OUTCOME_TYPES, type EventOutcome, type EventChoice, type GameEvent } from './events'
import { MASTER_DB } from '../../data/itemsByWarbond'
import { TYPE, FACTION } from '../../constants/types'
import type { Item, Player, GameConfig, Loadout } from '../../types'
import { ARMOR_CLASS } from '../../constants/armorPassives'
import { STARTING_LOADOUT } from '../../constants/gameConfig'
import { getFirstEmptyStratagemSlot } from '../../utils/loadoutHelpers'
import { getRequisitionMultiplier } from '../../constants/balancingConfig'

/**
 * Selections passed to event processing
 */
export interface EventSelections {
    stratagemSelection?: {
        stratagemId: string
        stratagemSlotIndex: number
    }
    targetPlayerSelection?: number | null
    targetStratagemSelection?: {
        stratagemSlotIndex: number
    }
    sourcePlayerSelection?: number | null
}

/**
 * Game state subset needed for event processing
 */
export interface EventProcessorState {
    players: Player[]
    eventPlayerChoice: number | null
    requisition: number
    currentDiff: number
    gameConfig: GameConfig
    burnedCards: string[]
}

/**
 * Gained item info for display
 */
export interface GainedItem {
    playerIndex: number
    itemName: string
}

/**
 * Transformed slot info for display
 */
export interface TransformedSlot {
    slot: string
    oldItem: string
    newItem: string
}

/**
 * State updates returned from event processing
 */
export interface EventStateUpdates {
    requisition?: number
    players?: Player[]
    currentDiff?: number
    needsSubfactionSelection?: boolean
    pendingFaction?: string
    needsBoosterSelection?: boolean
    boosterDraft?: string[]
    boosterOutcome?: EventOutcome
    burnBoosterDraft?: string[]
    gainedItemName?: string
    gainedItems?: GainedItem[]
    newBurnedCards?: string[]
    liquidatedItems?: string[]
    bonusRequisition?: number
    needsRedraft?: boolean
    redraftPlayerIndex?: number
    redraftCount?: number
    removedItemName?: string
    removedItemType?: string
    transformedSlots?: TransformedSlot[]
    needsSpecialDraft?: boolean
    specialDraftType?: 'throwable' | 'secondary'
    synchronizedLoadout?: boolean
    ceremonialLoadoutApplied?: boolean
    faction?: string
    subfaction?: string | null
    triggerGameOver?: boolean
}

/**
 * Process a single event outcome and return state updates
 * @param outcome - The outcome object to process
 * @param choice - The choice that was made
 * @param state - Current game state
 * @param selections - User selections for stratagem/player choices
 * @returns State updates to apply
 */
export const processEventOutcome = (
    outcome: EventOutcome,
    choice: EventChoice | null,
    state: EventProcessorState,
    selections: EventSelections = {},
): EventStateUpdates => {
    const { players, eventPlayerChoice, requisition, currentDiff, gameConfig, burnedCards } = state
    const updates: EventStateUpdates = {}

    switch (outcome.type) {
        case OUTCOME_TYPES.ADD_REQUISITION:
            // Add requisition is a global effect (shared pool), but supports targetPlayer: 'choose' for UI consistency
            // Apply dynamic scaling based on player count and subfaction
            {
                const reqMultiplier = getRequisitionMultiplier(
                    gameConfig.playerCount,
                    gameConfig.subfaction,
                )
                const scaledReqValue = (outcome.value || 0) * reqMultiplier
                updates.requisition = requisition + scaledReqValue
            }
            break

        case OUTCOME_TYPES.SPEND_REQUISITION:
            // Spend requisition is a global effect (shared pool)
            updates.requisition = Math.max(0, requisition - (outcome.value || 0))
            break

        case OUTCOME_TYPES.LOSE_REQUISITION:
            // Lose requisition is a global effect (shared pool)
            updates.requisition = Math.max(0, requisition - (outcome.value || 0))
            break

        case OUTCOME_TYPES.CHANGE_FACTION:
            {
                const currentFaction = gameConfig?.faction
                const allFactions = Object.values(FACTION)
                const otherFactions = allFactions.filter((f) => f !== currentFaction)
                const randomFaction =
                    otherFactions[Math.floor(Math.random() * otherFactions.length)]

                // Instead of directly changing faction, prompt for subfaction selection
                updates.needsSubfactionSelection = true
                updates.pendingFaction = randomFaction
            }
            break

        case OUTCOME_TYPES.EXTRA_DRAFT:
            // Store extra draft cards in the player who will benefit
            // Use targetPlayerSelection if provided (for explicit target selection), otherwise fall back to eventPlayerChoice
            {
                const extraDraftTargetIndex =
                    outcome.targetPlayer === 'choose'
                        ? (selections?.targetPlayerSelection ?? eventPlayerChoice)
                        : eventPlayerChoice

                if (extraDraftTargetIndex !== null && extraDraftTargetIndex !== undefined) {
                    const newPlayers = [...players]
                    const player = newPlayers[extraDraftTargetIndex]
                    player.extraDraftCards = (player.extraDraftCards || 0) + (outcome.value || 0)
                    updates.players = newPlayers
                }
            }
            break

        case OUTCOME_TYPES.SKIP_DIFFICULTY:
            // Skip difficulty is a global effect, but we support targetPlayer: 'choose' for UI consistency
            // (the selected player gets "credit" for the advancement in the narrative)
            updates.currentDiff = Math.min(10, currentDiff + (outcome.value || 0))
            break

        case OUTCOME_TYPES.REPLAY_DIFFICULTY:
            // Replay difficulty is a global effect, but we support targetPlayer: 'choose' for UI consistency
            updates.currentDiff = Math.max(1, currentDiff - (outcome.value || 0))
            break

        case OUTCOME_TYPES.SACRIFICE_ITEM:
            if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
                const newPlayers = [...players]
                const player = newPlayers[eventPlayerChoice]
                if (player.loadout.stratagems.length > 0) {
                    player.loadout.stratagems.pop()
                }
                updates.players = newPlayers
            }
            break

        case OUTCOME_TYPES.GAIN_BOOSTER:
            if (outcome.targetPlayer === 'random') {
                if (!players || players.length === 0) {
                    break
                }

                const availableBoosters = getAvailableBoosters(players, gameConfig, burnedCards)
                if (availableBoosters.length === 0) {
                    break
                }

                const mappedPlayers = players.map((player, index) => ({ player, index }))
                const playersWithoutBoosters = mappedPlayers.filter(
                    ({ player }) => !player.loadout.booster,
                )
                const playerPool =
                    playersWithoutBoosters.length > 0 ? playersWithoutBoosters : mappedPlayers
                const selectedPlayer = playerPool[Math.floor(Math.random() * playerPool.length)]
                const selectedBooster =
                    availableBoosters[Math.floor(Math.random() * availableBoosters.length)]
                const newPlayers = [...players]
                const targetPlayer = newPlayers[selectedPlayer.index]

                targetPlayer.loadout.booster = selectedBooster.id
                if (!targetPlayer.inventory.includes(selectedBooster.id)) {
                    targetPlayer.inventory.push(selectedBooster.id)
                }

                updates.players = newPlayers
                updates.gainedItems = [
                    { playerIndex: selectedPlayer.index, itemName: selectedBooster.name },
                ]

                if (gameConfig.burnCards) {
                    updates.newBurnedCards = [selectedBooster.id]
                }
                break
            }

            // Generate booster draft instead of directly applying
            {
                updates.needsBoosterSelection = true
                const boosterDraft = generateBoosterDraft(players, gameConfig, burnedCards || [])
                updates.boosterDraft = boosterDraft
                updates.boosterOutcome = outcome
                // If burn mode is enabled, mark these boosters to be burned when shown
                if (gameConfig.burnCards && boosterDraft.length > 0) {
                    updates.burnBoosterDraft = boosterDraft
                }
            }
            break

        case OUTCOME_TYPES.GAIN_SECONDARY:
            if (eventPlayerChoice !== null) {
                const newPlayers = [...players]
                const player = newPlayers[eventPlayerChoice]

                // Get available secondaries (not burned, not starting item)
                const availableSecondaries = MASTER_DB.filter(
                    (item) =>
                        item.type === TYPE.SECONDARY &&
                        !burnedCards.includes(item.id) &&
                        item.id !== 's_peacemaker',
                )

                if (availableSecondaries.length > 0) {
                    const randomSecondary =
                        availableSecondaries[
                            Math.floor(Math.random() * availableSecondaries.length)
                        ]
                    player.loadout.secondary = randomSecondary.id
                    updates.players = newPlayers
                    updates.gainedItemName = randomSecondary.name

                    // Burn the card if burn mode is enabled
                    if (gameConfig.burnCards) {
                        updates.newBurnedCards = [randomSecondary.id]
                    }
                }
            }
            break

        case OUTCOME_TYPES.GAIN_THROWABLE:
            if (eventPlayerChoice !== null) {
                const newPlayers = [...players]
                const player = newPlayers[eventPlayerChoice]

                // Get available throwables (not burned, not starting item)
                const availableThrowables = MASTER_DB.filter(
                    (item) =>
                        item.type === TYPE.GRENADE &&
                        !burnedCards.includes(item.id) &&
                        item.id !== 'g_he',
                )

                if (availableThrowables.length > 0) {
                    const randomThrowable =
                        availableThrowables[Math.floor(Math.random() * availableThrowables.length)]
                    player.loadout.grenade = randomThrowable.id
                    updates.players = newPlayers
                    updates.gainedItemName = randomThrowable.name

                    // Burn the card if burn mode is enabled
                    if (gameConfig.burnCards) {
                        updates.newBurnedCards = [randomThrowable.id]
                    }
                }
            }
            break

        case OUTCOME_TYPES.RANDOM_OUTCOME:
            // Choose a random outcome from possibleOutcomes array
            if (outcome.possibleOutcomes && outcome.possibleOutcomes.length > 0) {
                // Check if this applies to all players (based on the current event context)
                // If eventPlayerChoice is null but we have players, apply to all
                if (eventPlayerChoice === null && players && players.length > 0) {
                    // Apply to each player individually
                    const newPlayers = [...players]
                    const gainedItems: GainedItem[] = []
                    const possibleOutcomes = outcome.possibleOutcomes ?? []

                    players.forEach((_player, index) => {
                        const randomOutcome =
                            possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)]
                        // Process for this specific player
                        const playerState: EventProcessorState = {
                            ...state,
                            eventPlayerChoice: index,
                            players: newPlayers,
                        }
                        const randomUpdates = processEventOutcome(
                            randomOutcome,
                            choice,
                            playerState,
                            selections,
                        )

                        // Merge player updates
                        if (randomUpdates.players) {
                            newPlayers[index] = randomUpdates.players[index]
                        }

                        // Track gained items for display
                        if (randomUpdates.gainedItemName) {
                            gainedItems.push({
                                playerIndex: index,
                                itemName: randomUpdates.gainedItemName,
                            })
                        }

                        // Accumulate burned cards
                        if (randomUpdates.newBurnedCards) {
                            if (!updates.newBurnedCards) updates.newBurnedCards = []
                            updates.newBurnedCards.push(...randomUpdates.newBurnedCards)
                        }
                    })

                    updates.players = newPlayers
                    if (gainedItems.length > 0) {
                        updates.gainedItems = gainedItems
                    }
                } else {
                    // Single player application
                    const randomOutcome =
                        outcome.possibleOutcomes[
                            Math.floor(Math.random() * outcome.possibleOutcomes.length)
                        ]
                    const randomUpdates = processEventOutcome(
                        randomOutcome,
                        choice,
                        state,
                        selections,
                    )
                    Object.assign(updates, randomUpdates)
                }
            }
            break

        case OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER:
            updates.players = applyDuplicateStratagem(players, eventPlayerChoice, selections)
            break

        case OUTCOME_TYPES.REDRAFT:
            // Get list of items being liquidated
            if (eventPlayerChoice !== null) {
                const liquidatedItems = getLiquidatedItems(players[eventPlayerChoice])
                updates.liquidatedItems = liquidatedItems

                if (liquidatedItems.length > 0) {
                    // Calculate number of drafts based on liquidated items
                    const draftCount = Math.ceil(liquidatedItems.length / (outcome.value || 1))

                    // Calculate bonus requisition from items being discarded
                    updates.bonusRequisition = calculateRedraftBonus(
                        players[eventPlayerChoice],
                        outcome.value,
                    )

                    // Signal that we need to immediately start a redraft for this player
                    updates.needsRedraft = true
                    updates.redraftPlayerIndex = eventPlayerChoice
                    updates.redraftCount = draftCount

                    // Reset player's inventory and loadout, and store draft count
                    const newPlayers = applyRedraft(players, eventPlayerChoice)
                    // Store the number of redrafts in the player object
                    newPlayers[eventPlayerChoice].redraftRounds = draftCount
                    updates.players = newPlayers
                }
            }
            break

        case OUTCOME_TYPES.SWAP_STRATAGEM_WITH_PLAYER:
            updates.players = applySwapStratagem(players, eventPlayerChoice, selections)
            break

        case OUTCOME_TYPES.RESTRICT_TO_SINGLE_WEAPON:
            // Use eventTargetPlayerSelection if provided (for host-chosen player), otherwise eventPlayerChoice
            {
                const restrictPlayerIndex =
                    selections &&
                    selections.targetPlayerSelection !== null &&
                    selections.targetPlayerSelection !== undefined
                        ? selections.targetPlayerSelection
                        : outcome.targetPlayer === 'choose' && eventPlayerChoice !== null
                          ? eventPlayerChoice
                          : null

                if (restrictPlayerIndex !== null) {
                    const newPlayers = [...players]
                    const player = newPlayers[restrictPlayerIndex]

                    // Save current stratagems for restoration after mission
                    player.savedStratagems = [...player.loadout.stratagems]

                    // Clear all stratagems temporarily
                    player.loadout.stratagems = [null, null, null, null]

                    // Keep only one weapon: primary if they have it, otherwise secondary
                    if (!player.loadout.primary) {
                        player.loadout.primary = null
                    } else {
                        player.loadout.secondary = null
                    }

                    // Set restriction flag
                    player.weaponRestricted = true

                    updates.players = newPlayers
                }
            }
            break

        case OUTCOME_TYPES.TRANSFORM_LOADOUT:
            if (eventPlayerChoice !== null) {
                const transformResult = applyTransformLoadout(
                    players,
                    eventPlayerChoice,
                    outcome.value || 1,
                    gameConfig,
                    burnedCards || [],
                )
                updates.players = transformResult.players
                updates.transformedSlots = transformResult.transformedSlots
                if (transformResult.burnedCards.length > 0) {
                    updates.newBurnedCards = transformResult.burnedCards
                }
            }
            break

        case OUTCOME_TYPES.REMOVE_ITEM:
            if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
                const newPlayers = [...players]
                const player = newPlayers[eventPlayerChoice]

                // Collect removable items (primary, secondary, grenade, stratagems - not armor or booster)
                const removableItems: Array<{
                    type: string
                    id: string
                    slot: string | number
                }> = []

                if (player.loadout.primary) {
                    removableItems.push({
                        type: 'primary',
                        id: player.loadout.primary,
                        slot: 'primary',
                    })
                }
                if (player.loadout.secondary) {
                    removableItems.push({
                        type: 'secondary',
                        id: player.loadout.secondary,
                        slot: 'secondary',
                    })
                }
                if (player.loadout.grenade) {
                    removableItems.push({
                        type: 'grenade',
                        id: player.loadout.grenade,
                        slot: 'grenade',
                    })
                }
                player.loadout.stratagems.forEach((stratagemId, index) => {
                    if (stratagemId) {
                        removableItems.push({ type: 'stratagem', id: stratagemId, slot: index })
                    }
                })

                if (removableItems.length > 0) {
                    // Randomly select one to remove
                    const randomIndex = Math.floor(Math.random() * removableItems.length)
                    const itemToRemove = removableItems[randomIndex]

                    // Get item name for display
                    const item = MASTER_DB.find((i) => i.id === itemToRemove.id)
                    updates.removedItemName = item ? item.name : 'Unknown Item'
                    updates.removedItemType = itemToRemove.type

                    // Remove from loadout
                    if (itemToRemove.type === 'stratagem') {
                        player.loadout.stratagems[itemToRemove.slot as number] = null
                    } else {
                        const slotName = itemToRemove.slot as keyof Omit<Loadout, 'stratagems'>
                        player.loadout[slotName] = null
                    }

                    // Remove from inventory
                    const invIndex = player.inventory.indexOf(itemToRemove.id)
                    if (invIndex !== -1) {
                        player.inventory.splice(invIndex, 1)
                    }

                    // Ensure loadout remains valid after removal
                    const validated = ensureValidLoadout(player.loadout, player.inventory)
                    player.loadout = validated.loadout
                    player.inventory = validated.inventory
                }

                updates.players = newPlayers
            }
            break

        case OUTCOME_TYPES.GAIN_RANDOM_LIGHT_ARMOR_AND_DRAFT_THROWABLE:
            // Give all players random light armor and trigger throwable draft
            if (players && players.length > 0) {
                const newPlayers = [...players]

                // Give each player random light armor (filtered by their warbond/superstore config)
                newPlayers.forEach((player) => {
                    const lightArmors = MASTER_DB.filter((item) => {
                        if (item.type !== TYPE.ARMOR) {
                            return false
                        }
                        // Type narrow to ArmorItem to access armorClass
                        const armorItem = item as Item & { armorClass?: string }
                        if (armorItem.armorClass !== ARMOR_CLASS.LIGHT) {
                            return false
                        }
                        if (burnedCards.includes(item.id)) {
                            return false
                        }
                        // Filter by player's enabled warbonds and superstore access
                        if (player.warbonds && player.warbonds.length > 0) {
                            if (item.warbond && player.warbonds.includes(item.warbond)) {
                                return true
                            }
                            if (item.superstore && player.includeSuperstore) {
                                return true
                            }
                            return !item.warbond && !item.superstore
                        }
                        return true
                    })

                    if (lightArmors.length > 0) {
                        const randomArmor =
                            lightArmors[Math.floor(Math.random() * lightArmors.length)]
                        player.loadout.armor = randomArmor.id
                        // Add armor to inventory if not already present
                        if (!player.inventory.includes(randomArmor.id)) {
                            player.inventory.push(randomArmor.id)
                        }
                    }
                })

                updates.players = newPlayers

                // Trigger throwable draft for all players
                updates.needsSpecialDraft = true
                updates.specialDraftType = 'throwable'
            }
            break

        case OUTCOME_TYPES.GAIN_RANDOM_HEAVY_ARMOR_AND_DRAFT_SECONDARY:
            // Give all players random heavy armor and trigger secondary draft
            if (players && players.length > 0) {
                const newPlayers = [...players]

                // Give each player random heavy armor (filtered by their warbond/superstore config)
                newPlayers.forEach((player) => {
                    const heavyArmors = MASTER_DB.filter((item) => {
                        if (item.type !== TYPE.ARMOR) {
                            return false
                        }
                        // Type narrow to ArmorItem to access armorClass
                        const armorItem = item as Item & { armorClass?: string }
                        if (armorItem.armorClass !== ARMOR_CLASS.HEAVY) {
                            return false
                        }
                        if (burnedCards.includes(item.id)) {
                            return false
                        }
                        // Filter by player's enabled warbonds and superstore access
                        if (player.warbonds && player.warbonds.length > 0) {
                            if (item.warbond && player.warbonds.includes(item.warbond)) {
                                return true
                            }
                            if (item.superstore && player.includeSuperstore) {
                                return true
                            }
                            return !item.warbond && !item.superstore
                        }
                        return true
                    })

                    if (heavyArmors.length > 0) {
                        const randomArmor =
                            heavyArmors[Math.floor(Math.random() * heavyArmors.length)]
                        player.loadout.armor = randomArmor.id
                        // Add armor to inventory if not already present
                        if (!player.inventory.includes(randomArmor.id)) {
                            player.inventory.push(randomArmor.id)
                        }
                    }
                })

                updates.players = newPlayers

                // Trigger secondary draft for all players
                updates.needsSpecialDraft = true
                updates.specialDraftType = 'secondary'
            }
            break

        case OUTCOME_TYPES.DUPLICATE_LOADOUT_TO_ALL:
            // Duplicate one player's loadout to all players (except boosters)
            if (eventPlayerChoice !== null && players && players.length > 0) {
                const sourcePlayer = players[eventPlayerChoice]
                const newPlayers = [...players]

                // Copy loadout (excluding booster) to all players
                newPlayers.forEach((player, index) => {
                    if (index !== eventPlayerChoice) {
                        player.loadout.primary = sourcePlayer.loadout.primary
                        player.loadout.secondary = sourcePlayer.loadout.secondary
                        player.loadout.grenade = sourcePlayer.loadout.grenade
                        player.loadout.armor = sourcePlayer.loadout.armor
                        player.loadout.stratagems = [...sourcePlayer.loadout.stratagems]
                        // Note: booster is deliberately NOT copied
                    }
                })

                updates.players = newPlayers
                updates.synchronizedLoadout = true
            }
            break

        case OUTCOME_TYPES.SET_CEREMONIAL_LOADOUT:
            // Set all players to ceremonial parade loadout
            if (players && players.length > 0) {
                const newPlayers = [...players]

                newPlayers.forEach((player, index) => {
                    // Helper function to check if player has access to an item
                    const hasAccess = (itemId: string): boolean => {
                        const item = MASTER_DB.find((i) => i.id === itemId)
                        if (!item) return false

                        // Check if item is from a warbond the player has access to
                        if (
                            item.warbond &&
                            player.warbonds &&
                            player.warbonds.includes(item.warbond)
                        ) {
                            return true
                        }

                        // Check if item is from superstore and player has access
                        if (item.superstore && player.includeSuperstore) {
                            return true
                        }

                        return false
                    }

                    // Always set primary to constitution (available to everyone from helldivers_mobilize)
                    player.loadout.primary = 'p_constitution'
                    if (!player.inventory.includes('p_constitution')) {
                        player.inventory.push('p_constitution')
                    }

                    // Set secondary based on player position
                    if (index === 0) {
                        // Player 1: P-4 Senator (if available)
                        if (hasAccess('s_senator')) {
                            player.loadout.secondary = 's_senator'
                            if (!player.inventory.includes('s_senator')) {
                                player.inventory.push('s_senator')
                            }
                        }
                    } else {
                        // Players 2, 3, 4: CQC-2 Saber (if available)
                        if (hasAccess('s_saber')) {
                            player.loadout.secondary = 's_saber'
                            if (!player.inventory.includes('s_saber')) {
                                player.inventory.push('s_saber')
                            }
                        }
                    }

                    // Set armor based on player position
                    if (index === 0) {
                        // Player 1: RE-1861 Parade Commander (if available)
                        if (hasAccess('a_re1861')) {
                            player.loadout.armor = 'a_re1861'
                            if (!player.inventory.includes('a_re1861')) {
                                player.inventory.push('a_re1861')
                            }
                        }
                    } else {
                        // Players 2, 3, 4: RE-2310 Honorary Guard (if available)
                        if (hasAccess('a_re2310')) {
                            player.loadout.armor = 'a_re2310'
                            if (!player.inventory.includes('a_re2310')) {
                                player.inventory.push('a_re2310')
                            }
                        }
                    }

                    // Clear all stratagems first
                    player.loadout.stratagems = [null, null, null, null]

                    // Add specific stratagem for player 1
                    if (index === 0) {
                        // Player 1: CQC-1 One True Flag (if available)
                        if (hasAccess('st_flag')) {
                            player.loadout.stratagems[0] = 'st_flag'
                            if (!player.inventory.includes('st_flag')) {
                                player.inventory.push('st_flag')
                            }
                        }
                    }
                    // Players 2, 3, 4 get no stratagems (already cleared above)
                })

                updates.players = newPlayers
                updates.ceremonialLoadoutApplied = true
            }
            break

        default:
            break
    }

    return updates
}

/**
 * Process all outcomes from a choice
 * @param outcomes - Array of outcome objects
 * @param choice - The choice that was made
 * @param state - Current game state
 * @param selections - User selections
 * @returns Combined state updates
 */
export const processAllOutcomes = (
    outcomes: EventOutcome[],
    choice: EventChoice | null,
    state: EventProcessorState,
    selections: EventSelections = {},
): EventStateUpdates => {
    const allUpdates: EventStateUpdates = {}

    // Spend requisition if the choice requires it
    if (choice && choice.requiresRequisition) {
        allUpdates.requisition = Math.max(0, state.requisition - choice.requiresRequisition)
    }

    outcomes.forEach((outcome) => {
        const updates = processEventOutcome(
            outcome,
            choice,
            {
                ...state,
                ...allUpdates, // Apply previous updates
            } as EventProcessorState,
            selections,
        )

        if (updates.newBurnedCards) {
            allUpdates.newBurnedCards = [
                ...(allUpdates.newBurnedCards || []),
                ...updates.newBurnedCards,
            ]
            delete updates.newBurnedCards
        }

        if (updates.gainedItems) {
            allUpdates.gainedItems = [...(allUpdates.gainedItems || []), ...updates.gainedItems]
            delete updates.gainedItems
        }

        Object.assign(allUpdates, updates)
    })

    return allUpdates
}

/**
 * Get available boosters filtered by current state.
 * @param players - Array of player objects
 * @param gameConfig - Game configuration
 * @param burnedCards - Array of burned card IDs
 * @returns Array of booster objects
 */
const getAvailableBoosters = (
    players: Player[] = [],
    gameConfig: Partial<GameConfig> = {},
    burnedCards: string[] = [],
): Item[] => {
    let boosters = MASTER_DB.filter((item) => item.type === TYPE.BOOSTER)
    if (boosters.length === 0) return []

    // Filter out boosters that any player already has (globally unique)
    const existingBoosters = new Set<string>()
    players.forEach((player) => {
        if (player.loadout.booster) {
            existingBoosters.add(player.loadout.booster)
        }
    })
    boosters = boosters.filter((b) => !existingBoosters.has(b.id))

    // Filter out burned cards if burn mode is enabled
    if (gameConfig.burnCards && burnedCards.length > 0) {
        boosters = boosters.filter((b) => !burnedCards.includes(b.id))
    }

    return boosters
}

/**
 * Generate a draft of boosters for selection
 * @param players - Array of player objects
 * @param gameConfig - Game configuration
 * @param burnedCards - Array of burned card IDs
 * @returns Array of 2 random booster IDs
 */
const generateBoosterDraft = (
    players: Player[] = [],
    gameConfig: Partial<GameConfig> = {},
    burnedCards: string[] = [],
): string[] => {
    const boosters = getAvailableBoosters(players, gameConfig, burnedCards)
    if (boosters.length === 0) return []

    // Shuffle and take 2
    const shuffled = [...boosters].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(2, shuffled.length)).map((b) => b.id)
}

/**
 * Apply gain booster outcome with selection
 * @param players - Array of player objects
 * @param outcome - The outcome object
 * @param eventPlayerChoice - The player index
 * @param selectedBoosterId - The selected booster ID
 */
export const applyGainBoosterWithSelection = (
    players: Player[],
    outcome: EventOutcome,
    eventPlayerChoice: number | null,
    selectedBoosterId: string,
): Player[] => {
    if (!selectedBoosterId) return players

    if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
        const newPlayers = [...players]
        newPlayers[eventPlayerChoice].loadout.booster = selectedBoosterId
        if (!newPlayers[eventPlayerChoice].inventory.includes(selectedBoosterId)) {
            newPlayers[eventPlayerChoice].inventory.push(selectedBoosterId)
        }
        return newPlayers
    } else if (!outcome.targetPlayer || outcome.targetPlayer === 'all') {
        return players.map((p) => ({
            ...p,
            loadout: { ...p.loadout, booster: selectedBoosterId },
            inventory: p.inventory.includes(selectedBoosterId)
                ? p.inventory
                : [...p.inventory, selectedBoosterId],
        }))
    }

    return players
}

/**
 * Apply duplicate stratagem outcome
 * @param players - Array of player objects
 * @param eventPlayerChoice - The source player index
 * @param selections - User selections
 */
const applyDuplicateStratagem = (
    players: Player[],
    eventPlayerChoice: number | null,
    selections: EventSelections = {},
): Player[] => {
    if (players.length <= 1 || eventPlayerChoice === null) return players

    const { stratagemSelection, targetPlayerSelection, targetStratagemSelection } = selections

    // If we have selections, use them
    if (
        stratagemSelection &&
        targetPlayerSelection !== null &&
        targetPlayerSelection !== undefined
    ) {
        const newPlayers = [...players]
        const { stratagemId } = stratagemSelection

        // Check if we have a target stratagem selection (for overwrite)
        if (targetStratagemSelection) {
            // Overwrite the selected slot
            const { stratagemSlotIndex } = targetStratagemSelection
            newPlayers[targetPlayerSelection].loadout.stratagems[stratagemSlotIndex] = stratagemId
            if (!newPlayers[targetPlayerSelection].inventory.includes(stratagemId)) {
                newPlayers[targetPlayerSelection].inventory.push(stratagemId)
            }
        } else {
            // Find first empty slot and add there
            const emptySlot = getFirstEmptyStratagemSlot(newPlayers[targetPlayerSelection].loadout)
            if (emptySlot !== -1) {
                newPlayers[targetPlayerSelection].loadout.stratagems[emptySlot] = stratagemId
                if (!newPlayers[targetPlayerSelection].inventory.includes(stratagemId)) {
                    newPlayers[targetPlayerSelection].inventory.push(stratagemId)
                }
            }
        }

        return newPlayers
    }

    // Fallback to random selection (old behavior)
    const sourcePlayer = players[eventPlayerChoice]
    const availableStratagems = sourcePlayer.loadout.stratagems.filter((s) => s !== null)

    if (availableStratagems.length === 0) return players

    const randomStratagem =
        availableStratagems[Math.floor(Math.random() * availableStratagems.length)]
    const otherPlayers = players
        .map((p, idx) => ({ player: p, idx }))
        .filter((_, idx) => idx !== eventPlayerChoice)

    if (otherPlayers.length === 0) return players

    const targetPlayerData = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
    const newPlayers = [...players]
    const emptySlot = getFirstEmptyStratagemSlot(newPlayers[targetPlayerData.idx].loadout)

    if (emptySlot !== -1 && randomStratagem) {
        newPlayers[targetPlayerData.idx].loadout.stratagems[emptySlot] = randomStratagem
        newPlayers[targetPlayerData.idx].inventory.push(randomStratagem)
    }

    return newPlayers
}

/**
 * Slot info for transform loadout
 */
interface SlotInfo {
    slot: string
    slotIndex?: number
    type: string
    current: string
}

/**
 * Transform loadout result
 */
interface TransformResult {
    players: Player[]
    transformedSlots: TransformedSlot[]
    burnedCards: string[]
}

/**
 * Apply transform loadout outcome - replace slots with random items of same type
 * @param players - Array of player objects
 * @param eventPlayerChoice - The player index to transform
 * @param slotCount - Number of slots to transform (-1 for all)
 * @param gameConfig - Game configuration
 * @param burnedCards - Currently burned cards
 * @returns Transform result
 */
const applyTransformLoadout = (
    players: Player[],
    eventPlayerChoice: number | null,
    slotCount: number,
    gameConfig: Partial<GameConfig>,
    burnedCards: string[],
): TransformResult => {
    if (eventPlayerChoice === null) return { players, transformedSlots: [], burnedCards: [] }

    const newPlayers = [...players]
    const player = newPlayers[eventPlayerChoice]
    const transformedSlots: TransformedSlot[] = []
    const newBurnedCards: string[] = []
    const useBurnMode = gameConfig.burnMode

    // Collect all applicable slots (everything but empty stratagems)
    const applicableSlots: SlotInfo[] = []

    if (player.loadout.primary) {
        applicableSlots.push({
            slot: 'primary',
            type: TYPE.PRIMARY,
            current: player.loadout.primary,
        })
    }
    if (player.loadout.secondary) {
        applicableSlots.push({
            slot: 'secondary',
            type: TYPE.SECONDARY,
            current: player.loadout.secondary,
        })
    }
    if (player.loadout.grenade) {
        applicableSlots.push({
            slot: 'grenade',
            type: TYPE.GRENADE,
            current: player.loadout.grenade,
        })
    }
    if (player.loadout.armor) {
        applicableSlots.push({ slot: 'armor', type: TYPE.ARMOR, current: player.loadout.armor })
    }
    if (player.loadout.booster) {
        applicableSlots.push({
            slot: 'booster',
            type: TYPE.BOOSTER,
            current: player.loadout.booster,
        })
    }
    player.loadout.stratagems.forEach((stratagemId, index) => {
        if (stratagemId) {
            applicableSlots.push({
                slot: `stratagem_${index}`,
                slotIndex: index,
                type: TYPE.STRATAGEM,
                current: stratagemId,
            })
        }
    })

    // Shuffle the slots
    const shuffled = [...applicableSlots].sort(() => Math.random() - 0.5)

    // Determine how many slots to transform
    const transformCount = slotCount === -1 ? shuffled.length : Math.min(slotCount, shuffled.length)

    // Track currently burned cards (include existing + new burns)
    const currentBurnedCards = [...burnedCards]

    // Transform slots
    for (let i = 0; i < transformCount; i++) {
        const slotInfo = shuffled[i]

        // Get all items of this type that aren't burned
        const availableItems = MASTER_DB.filter((item) => {
            if (item.type !== slotInfo.type) return false
            if (useBurnMode && currentBurnedCards.includes(item.id)) return false
            return true
        })

        if (availableItems.length > 0) {
            // Randomly select a new item
            const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)]

            // Get item name for display
            const oldItem = MASTER_DB.find((i) => i.id === slotInfo.current)

            // Update the slot
            if (slotInfo.slot === 'primary') {
                player.loadout.primary = randomItem.id
            } else if (slotInfo.slot === 'secondary') {
                player.loadout.secondary = randomItem.id
            } else if (slotInfo.slot === 'grenade') {
                player.loadout.grenade = randomItem.id
            } else if (slotInfo.slot === 'armor') {
                player.loadout.armor = randomItem.id
            } else if (slotInfo.slot === 'booster') {
                player.loadout.booster = randomItem.id
            } else if (slotInfo.slot.startsWith('stratagem_') && slotInfo.slotIndex !== undefined) {
                player.loadout.stratagems[slotInfo.slotIndex] = randomItem.id
            }

            // Update inventory - remove old, add new
            const oldInvIndex = player.inventory.indexOf(slotInfo.current)
            if (oldInvIndex !== -1) {
                player.inventory.splice(oldInvIndex, 1)
            }
            if (!player.inventory.includes(randomItem.id)) {
                player.inventory.push(randomItem.id)
            }

            // Track transformation
            transformedSlots.push({
                slot: slotInfo.slot,
                oldItem: oldItem ? oldItem.name : 'Unknown',
                newItem: randomItem.name,
            })

            // Burn the new card if burn mode is enabled
            if (useBurnMode && !currentBurnedCards.includes(randomItem.id)) {
                currentBurnedCards.push(randomItem.id)
                newBurnedCards.push(randomItem.id)
            }
        }
    }

    return { players: newPlayers, transformedSlots, burnedCards: newBurnedCards }
}

/**
 * Valid loadout result
 */
interface ValidLoadoutResult {
    loadout: Loadout
    inventory: string[]
}

/**
 * Ensure loadout has required fallback equipment
 * - If no armor → default to B-01 Tactical
 * - If no primary AND no secondary → default to P-2 Peacemaker
 * - Primaries, grenades, stratagems can be empty
 * - Secondaries can be empty if primary exists
 */
const ensureValidLoadout = (loadout: Loadout, inventory: string[]): ValidLoadoutResult => {
    const validLoadout = { ...loadout }
    const validInventory = [...inventory]

    // If no armor, default to B-01 Tactical
    if (!validLoadout.armor) {
        validLoadout.armor = 'a_b01'
        if (!validInventory.includes('a_b01')) {
            validInventory.push('a_b01')
        }
    }

    // If no primary AND no secondary, default to P-2 Peacemaker
    if (!validLoadout.primary && !validLoadout.secondary) {
        validLoadout.secondary = 's_peacemaker'
        if (!validInventory.includes('s_peacemaker')) {
            validInventory.push('s_peacemaker')
        }
    }

    return { loadout: validLoadout, inventory: validInventory }
}

/**
 * Get list of items being liquidated during redraft
 */
const getLiquidatedItems = (player: Player | null): string[] => {
    if (!player) return []

    const items: string[] = []

    // Collect all non-default loadout items
    if (player.loadout.primary && player.loadout.primary !== STARTING_LOADOUT.primary) {
        const item = MASTER_DB.find((i) => i.id === player.loadout.primary)
        if (item) items.push(item.name)
    }

    // Secondary is only liquidated if it's not the default peacemaker
    if (player.loadout.secondary && player.loadout.secondary !== STARTING_LOADOUT.secondary) {
        const item = MASTER_DB.find((i) => i.id === player.loadout.secondary)
        if (item) items.push(item.name)
    }

    // Grenade is only liquidated if it's not the default HE grenade
    if (player.loadout.grenade && player.loadout.grenade !== STARTING_LOADOUT.grenade) {
        const item = MASTER_DB.find((i) => i.id === player.loadout.grenade)
        if (item) items.push(item.name)
    }

    // Armor is only liquidated if it's not the default B-01
    if (player.loadout.armor && player.loadout.armor !== STARTING_LOADOUT.armor) {
        const item = MASTER_DB.find((i) => i.id === player.loadout.armor)
        if (item) items.push(item.name)
    }

    // Boosters are NOT affected by redraft - they are kept

    // Stratagems
    player.loadout.stratagems.forEach((stratagemId) => {
        if (stratagemId) {
            const item = MASTER_DB.find((i) => i.id === stratagemId)
            if (item) items.push(item.name)
        }
    })

    // Inventory items (excluding those already in loadout)
    player.inventory.forEach((itemId) => {
        // Skip if already in loadout or is a default item
        const alreadyInLoadout =
            itemId === player.loadout.primary ||
            itemId === player.loadout.secondary ||
            itemId === player.loadout.grenade ||
            itemId === player.loadout.armor ||
            itemId === player.loadout.booster ||
            player.loadout.stratagems.includes(itemId)

        if (!alreadyInLoadout) {
            const item = MASTER_DB.find((i) => i.id === itemId)
            if (item) items.push(item.name)
        }
    })

    return items
}

/**
 * Apply redraft outcome
 */
const applyRedraft = (players: Player[], eventPlayerChoice: number | null): Player[] => {
    if (eventPlayerChoice === null) return players

    const player = players[eventPlayerChoice]
    const newPlayers = [...players]

    const baseLoadout: Loadout = {
        primary: STARTING_LOADOUT.primary,
        secondary: STARTING_LOADOUT.secondary,
        grenade: STARTING_LOADOUT.grenade,
        armor: STARTING_LOADOUT.armor,
        booster: player.loadout.booster, // Preserve current booster
        stratagems: [...STARTING_LOADOUT.stratagems],
    }

    const baseInventory = [
        STARTING_LOADOUT.secondary,
        STARTING_LOADOUT.grenade,
        STARTING_LOADOUT.armor,
    ].filter((id): id is string => id !== null)

    // Add current booster to inventory if it exists
    if (player.loadout.booster && !baseInventory.includes(player.loadout.booster)) {
        baseInventory.push(player.loadout.booster)
    }

    const { loadout, inventory } = ensureValidLoadout(baseLoadout, baseInventory)

    newPlayers[eventPlayerChoice] = {
        ...player,
        inventory,
        loadout,
    }

    return newPlayers
}

/**
 * Calculate bonus requisition from redraft
 */
const calculateRedraftBonus = (
    player: Player | null,
    divisionValue: number | undefined,
): number => {
    if (!player) return 0
    const discardedCount = player.inventory.length
    return Math.ceil(discardedCount / (divisionValue || 1))
}

/**
 * Apply swap stratagem outcome
 * @param players - Array of player objects
 * @param eventPlayerChoice - The source player index
 * @param selections - User selections
 */
const applySwapStratagem = (
    players: Player[],
    eventPlayerChoice: number | null,
    selections: EventSelections = {},
): Player[] => {
    if (players.length <= 1) return players

    const {
        sourcePlayerSelection,
        stratagemSelection,
        targetPlayerSelection,
        targetStratagemSelection,
    } = selections

    // New behavior: use sourcePlayerSelection if provided
    const sourcePlayerIndex =
        sourcePlayerSelection !== null && sourcePlayerSelection !== undefined
            ? sourcePlayerSelection
            : eventPlayerChoice

    // If we have all selections, use them
    if (
        stratagemSelection &&
        targetPlayerSelection !== null &&
        targetPlayerSelection !== undefined &&
        targetStratagemSelection &&
        sourcePlayerIndex !== null
    ) {
        const newPlayers = [...players]
        const { stratagemSlotIndex } = stratagemSelection
        const { stratagemSlotIndex: targetStratagemSlotIndex } = targetStratagemSelection

        // Perform swap
        const temp = newPlayers[sourcePlayerIndex].loadout.stratagems[stratagemSlotIndex]
        newPlayers[sourcePlayerIndex].loadout.stratagems[stratagemSlotIndex] =
            newPlayers[targetPlayerSelection].loadout.stratagems[targetStratagemSlotIndex]
        newPlayers[targetPlayerSelection].loadout.stratagems[targetStratagemSlotIndex] = temp

        return newPlayers
    }

    // If we have partial selections (old behavior for duplicate/fallback), use them
    if (
        stratagemSelection &&
        targetPlayerSelection !== null &&
        targetPlayerSelection !== undefined &&
        sourcePlayerIndex !== null
    ) {
        const newPlayers = [...players]
        const { stratagemSlotIndex } = stratagemSelection

        // Find target player's stratagem to swap (first non-null stratagem)
        const targetStratagems = newPlayers[targetPlayerSelection].loadout.stratagems
            .map((s, idx) => ({ stratagem: s, idx }))
            .filter((s) => s.stratagem !== null)

        if (targetStratagems.length === 0) return players

        // Use first available stratagem from target player
        const targetStratData = targetStratagems[0]

        // Perform swap
        const temp = newPlayers[sourcePlayerIndex].loadout.stratagems[stratagemSlotIndex]
        newPlayers[sourcePlayerIndex].loadout.stratagems[stratagemSlotIndex] =
            newPlayers[targetPlayerSelection].loadout.stratagems[targetStratData.idx]
        newPlayers[targetPlayerSelection].loadout.stratagems[targetStratData.idx] = temp

        return newPlayers
    }

    // Fallback to random selection (old behavior)
    if (eventPlayerChoice === null) return players

    const sourcePlayer = players[eventPlayerChoice]
    const availableStratagems = sourcePlayer.loadout.stratagems
        .map((s, idx) => ({ stratagem: s, idx }))
        .filter((s) => s.stratagem !== null)

    if (availableStratagems.length === 0) return players

    const otherPlayers = players
        .map((p, idx) => ({ player: p, idx }))
        .filter((_, idx) => idx !== eventPlayerChoice)
    if (otherPlayers.length === 0) return players

    const targetPlayerData = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
    const targetStratagems = targetPlayerData.player.loadout.stratagems
        .map((s, idx) => ({ stratagem: s, idx }))
        .filter((s) => s.stratagem !== null)

    if (targetStratagems.length === 0) return players

    // Pick random stratagems to swap
    const sourceStratData =
        availableStratagems[Math.floor(Math.random() * availableStratagems.length)]
    const targetStratData = targetStratagems[Math.floor(Math.random() * targetStratagems.length)]

    const newPlayers = [...players]
    const temp = newPlayers[eventPlayerChoice].loadout.stratagems[sourceStratData.idx]
    newPlayers[eventPlayerChoice].loadout.stratagems[sourceStratData.idx] =
        newPlayers[targetPlayerData.idx].loadout.stratagems[targetStratData.idx]
    newPlayers[targetPlayerData.idx].loadout.stratagems[targetStratData.idx] = temp

    return newPlayers
}

/**
 * Check if a choice can be afforded
 * @param choice - The choice object
 * @param requisition - Current requisition amount
 * @param players - Array of player objects
 * @param eventPlayerChoice - Currently selected player index
 * @returns True if choice can be afforded
 */
export const canAffordChoice = (
    choice: EventChoice,
    requisition: number,
    players: Player[] | null = null,
    eventPlayerChoice: number | null = null,
): boolean => {
    if (choice.requiresRequisition && requisition < choice.requiresRequisition) {
        return false
    }

    // Check if REDRAFT choice has items to sacrifice
    if (choice.outcomes && choice.outcomes.some((o) => o.type === OUTCOME_TYPES.REDRAFT)) {
        if (players && eventPlayerChoice !== null && players[eventPlayerChoice]) {
            const liquidatedItems = getLiquidatedItems(players[eventPlayerChoice])
            if (liquidatedItems.length === 0) {
                return false
            }
        }
    }

    return true
}

/**
 * Format a single outcome for display
 * @param outcome - The outcome to format
 * @returns Formatted outcome text
 */
export const formatOutcome = (outcome: EventOutcome): string => {
    switch (outcome.type) {
        case OUTCOME_TYPES.ADD_REQUISITION:
            return `+${outcome.value} Requisition`
        case OUTCOME_TYPES.SPEND_REQUISITION:
            return `-${outcome.value} Requisition`
        case OUTCOME_TYPES.LOSE_REQUISITION:
            return `-${outcome.value} Requisition`
        case OUTCOME_TYPES.CHANGE_FACTION:
            return `Switch to different theater`
        case OUTCOME_TYPES.EXTRA_DRAFT:
            return `Draft ${outcome.value} extra card${(outcome.value || 0) > 1 ? 's' : ''}`
        case OUTCOME_TYPES.SKIP_DIFFICULTY:
            return `Skip ${outcome.value} difficulty level${(outcome.value || 0) > 1 ? 's' : ''}`
        case OUTCOME_TYPES.REPLAY_DIFFICULTY:
            return `Replay current difficulty`
        case OUTCOME_TYPES.SACRIFICE_ITEM:
            return `Remove a ${outcome.value}`
        case OUTCOME_TYPES.GAIN_BOOSTER: {
            const target = outcome.targetPlayer === 'all' ? '(All Helldivers)' : ''
            return `Gain random Booster ${target}`
        }
        case OUTCOME_TYPES.GAIN_SECONDARY:
            return `Gain random Secondary`
        case OUTCOME_TYPES.GAIN_THROWABLE:
            return `Gain random Throwable`
        case OUTCOME_TYPES.RANDOM_OUTCOME:
            if (outcome.possibleOutcomes && outcome.possibleOutcomes.length > 0) {
                const outcomeTexts = outcome.possibleOutcomes.map((o) => formatOutcome(o))
                return outcomeTexts.join(' OR ')
            }
            return `Random outcome`
        case OUTCOME_TYPES.REMOVE_ITEM:
            return `Remove an item`
        case OUTCOME_TYPES.GAIN_SPECIFIC_ITEM:
            return `Gain specific item`
        case OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER:
            return `Copy stratagem to another Helldiver`
        case OUTCOME_TYPES.SWAP_STRATAGEM_WITH_PLAYER:
            return `Swap stratagem with another Helldiver`
        case OUTCOME_TYPES.RESTRICT_TO_SINGLE_WEAPON:
            return `Use only 1 weapon next mission (no stratagems)`
        case OUTCOME_TYPES.REDRAFT:
            return `Redraft: Discard all items, draft ${outcome.value ? Math.ceil(1 / outcome.value) : 1}x per discarded`
        case OUTCOME_TYPES.TRANSFORM_LOADOUT:
            if (outcome.value === -1) {
                return `Transform entire loadout randomly`
            }
            return `Transform ${outcome.value} random item${(outcome.value || 0) > 1 ? 's' : ''}`
        case OUTCOME_TYPES.GAIN_RANDOM_LIGHT_ARMOR_AND_DRAFT_THROWABLE:
            return `All Helldivers: Random Light Armor + Choose Throwable`
        case OUTCOME_TYPES.GAIN_RANDOM_HEAVY_ARMOR_AND_DRAFT_SECONDARY:
            return `All Helldivers: Random Heavy Armor + Choose Secondary`
        case OUTCOME_TYPES.DUPLICATE_LOADOUT_TO_ALL:
            return `Duplicate chosen Helldiver's loadout to all`
        case OUTCOME_TYPES.SET_CEREMONIAL_LOADOUT:
            return `Equip full ceremonial parade loadout`
        default:
            return ''
    }
}

/**
 * Format multiple outcomes for display
 * @param outcomes - Array of outcome objects
 * @returns Formatted outcomes text
 */
export const formatOutcomes = (outcomes: EventOutcome[]): string => {
    if (!outcomes || outcomes.length === 0) return 'No effect'
    return outcomes
        .map(formatOutcome)
        .filter((o) => o)
        .join(', ')
}

/**
 * Check if an event needs player choice
 * @param event - The event object
 * @returns True if player choice is needed
 */
export const needsPlayerChoice = (event: GameEvent | null): boolean => {
    if (!event || event.targetPlayer !== 'single' || !event.choices) {
        return false
    }

    return event.choices.some((c) => {
        if (!c.outcomes || !Array.isArray(c.outcomes)) return false
        return c.outcomes.some((o) => {
            // Direct targetPlayer: 'choose'
            if (o.targetPlayer === 'choose') return true
            // Check nested possibleOutcomes for RANDOM_OUTCOME
            if (o.possibleOutcomes && Array.isArray(o.possibleOutcomes)) {
                return o.possibleOutcomes.some((po) => po.targetPlayer === 'choose')
            }
            return false
        })
    })
}
