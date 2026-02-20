/**
 * Game state reducer for managing all game state transitions
 */
import { FACTION } from '../constants/types'
import { getDefaultSubfaction } from '../constants/balancingConfig'
import * as types from './actionTypes'
import type {
    GamePhase,
    GameConfig,
    Player,
    Loadout,
    GameState,
    Samples,
    DraftState,
    SacrificeState,
    CustomSetup,
    GameEvent,
    EventChoice,
    StratagemSelection,
    RunAnalyticsData,
    Faction,
    DraftHistoryRecord,
    Item,
    StratagemItem,
} from '../types'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if debug mode is enabled via query string
 * Note: This is evaluated once at initialization. Debug mode cannot be toggled
 * during runtime - users must refresh the page with ?debug=true to enable it.
 * This is intentional to prevent accidental enabling of debug features in production.
 */
const isDebugModeEnabled = (): boolean => {
    if (typeof window === 'undefined') return false
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('debug') === 'true'
}

/**
 * Normalize stratagems arrays - Firebase may strip nulls or convert to objects
 */
const normalizeStratagems = (stratagems: unknown): (string | null)[] => {
    if (!stratagems) return [null, null, null, null]
    if (Array.isArray(stratagems)) {
        // Ensure exactly 4 slots, converting undefined to null
        const result: (string | null)[] = [null, null, null, null]
        for (let i = 0; i < 4; i++) {
            result[i] = (stratagems[i] as string | null) || null
        }
        return result
    }
    // Firebase may convert sparse arrays to objects with numeric keys
    if (typeof stratagems === 'object') {
        const stratagemObj = stratagems as Record<string | number, string | null>
        const result: (string | null)[] = [null, null, null, null]
        for (let i = 0; i < 4; i++) {
            result[i] = stratagemObj[i] || stratagemObj[String(i)] || null
        }
        return result
    }
    return [null, null, null, null]
}

// =============================================================================
// INITIAL STATE
// =============================================================================

/**
 * Initial game state
 */
export const initialState: GameState = {
    phase: 'MENU',
    gameConfig: {
        playerCount: 1,
        faction: FACTION.BUGS,
        subfaction: getDefaultSubfaction(FACTION.BUGS),
        starRating: 3,
        globalUniqueness: true,
        burnCards: true,
        customStart: false,
        endlessMode: false,
        enduranceMode: false,
        debugEventsMode: isDebugModeEnabled(),
        brutalityMode: false,
    },
    currentDiff: 1,
    currentMission: 1,
    requisition: 0,
    samples: {
        common: 0,
        rare: 0,
        superRare: 0,
    },
    players: [],
    draftState: {
        activePlayerIndex: 0,
        roundCards: [],
        isRerolling: false,
        pendingStratagem: null,
        extraDraftRound: 0,
        draftOrder: [],
        isRetrospective: false,
        retrospectivePlayerIndex: null,
    },
    draftHistory: [],
    sacrificeState: {
        activePlayerIndex: 0,
        sacrificesRequired: [],
    },
    burnedCards: [],
    customSetup: {
        difficulty: 1,
        loadouts: [],
    },
    selectedPlayer: 0,
    eventsEnabled: true,
    currentEvent: null,
    eventPlayerChoice: null,
    eventSelectedChoice: null,
    eventSourcePlayerSelection: null,
    eventStratagemSelection: null,
    eventTargetPlayerSelection: null,
    eventTargetStratagemSelection: null,
    eventBoosterDraft: null,
    eventBoosterSelection: null,
    eventSpecialDraft: null,
    eventSpecialDraftType: null,
    eventSpecialDraftSelections: null,
    pendingFaction: null,
    pendingSubfactionSelection: null,
    seenEvents: [],
    settingsOpen: false,
    disabledWarbonds: [],
    runAnalyticsData: null,
}

// =============================================================================
// ACTION TYPES
// =============================================================================

interface BaseAction<T extends string = string> {
    type: T
    payload?: unknown
}

interface SetPhaseAction extends BaseAction<typeof types.SET_PHASE> {
    payload: GamePhase
}

interface UpdateGameConfigAction extends BaseAction<typeof types.UPDATE_GAME_CONFIG> {
    payload: Partial<GameConfig>
}

interface SetGameConfigAction extends BaseAction<typeof types.SET_GAME_CONFIG> {
    payload: GameConfig
}

interface SetDifficultyAction extends BaseAction<typeof types.SET_DIFFICULTY> {
    payload: number
}

interface SetCurrentMissionAction extends BaseAction<typeof types.SET_CURRENT_MISSION> {
    payload: number
}

interface SetRequisitionAction extends BaseAction<typeof types.SET_REQUISITION> {
    payload: number
}

interface AddRequisitionAction extends BaseAction<typeof types.ADD_REQUISITION> {
    payload: number
}

interface SpendRequisitionAction extends BaseAction<typeof types.SPEND_REQUISITION> {
    payload: number
}

interface SetSubfactionAction extends BaseAction<typeof types.SET_SUBFACTION> {
    payload: string
}

interface LockPlayerDraftSlotAction extends BaseAction<typeof types.LOCK_PLAYER_DRAFT_SLOT> {
    payload: { playerId: string; slotType: string }
}

interface UnlockPlayerDraftSlotAction extends BaseAction<typeof types.UNLOCK_PLAYER_DRAFT_SLOT> {
    payload: { playerId: string; slotType: string }
}

interface AddSamplesAction extends BaseAction<typeof types.ADD_SAMPLES> {
    payload: Partial<Samples>
}

interface ResetSamplesAction extends BaseAction<typeof types.RESET_SAMPLES> {}

interface SetSamplesAction extends BaseAction<typeof types.SET_SAMPLES> {
    payload: Samples
}

interface SetPlayersAction extends BaseAction<typeof types.SET_PLAYERS> {
    payload: Player[]
}

interface UpdatePlayerAction extends BaseAction<typeof types.UPDATE_PLAYER> {
    payload: { index: number; updates: Partial<Player> }
}

interface UpdatePlayerLoadoutAction extends BaseAction<typeof types.UPDATE_PLAYER_LOADOUT> {
    payload: { index: number; loadout: Partial<Loadout> }
}

interface AddItemToPlayerAction extends BaseAction<typeof types.ADD_ITEM_TO_PLAYER> {
    payload: { playerIndex: number; itemId: string }
}

interface AddArmorComboToPlayerAction extends BaseAction<typeof types.ADD_ARMOR_COMBO_TO_PLAYER> {
    payload: { playerIndex: number; armorCombo: { items: Array<{ id: string }> } }
}

interface SetPlayerWarbondsAction extends BaseAction<typeof types.SET_PLAYER_WARBONDS> {
    payload: { playerIndex: number; warbonds: string[] }
}

interface SetPlayerSuperstoreAction extends BaseAction<typeof types.SET_PLAYER_SUPERSTORE> {
    payload: { playerIndex: number; includeSuperstore: boolean }
}

interface SetPlayerExcludedItemsAction extends BaseAction<typeof types.SET_PLAYER_EXCLUDED_ITEMS> {
    payload: { playerIndex: number; excludedItems: string[] }
}

interface SetPlayerExtractedAction extends BaseAction<typeof types.SET_PLAYER_EXTRACTED> {
    payload: { playerIndex: number; extracted: boolean }
}

interface SacrificeItemAction extends BaseAction<typeof types.SACRIFICE_ITEM> {
    payload: { playerIndex: number; itemId: string }
}

interface SetSacrificeStateAction extends BaseAction<typeof types.SET_SACRIFICE_STATE> {
    payload: SacrificeState
}

interface UpdateSacrificeStateAction extends BaseAction<typeof types.UPDATE_SACRIFICE_STATE> {
    payload: Partial<SacrificeState>
}

interface SetDraftStateAction extends BaseAction<typeof types.SET_DRAFT_STATE> {
    payload: DraftState
}

interface UpdateDraftStateAction extends BaseAction<typeof types.UPDATE_DRAFT_STATE> {
    payload: Partial<DraftState>
}

interface SetDraftCardsAction extends BaseAction<typeof types.SET_DRAFT_CARDS> {
    payload: Item[]
}

interface SetActivePlayerIndexAction extends BaseAction<typeof types.SET_ACTIVE_PLAYER_INDEX> {
    payload: number
}

interface SetPendingStratagemAction extends BaseAction<typeof types.SET_PENDING_STRATAGEM> {
    payload: StratagemItem | null
}

interface AddDraftHistoryAction extends BaseAction<typeof types.ADD_DRAFT_HISTORY> {
    payload: DraftHistoryRecord
}

interface SetDraftHistoryAction extends BaseAction<typeof types.SET_DRAFT_HISTORY> {
    payload: DraftHistoryRecord[] | null
}

interface StartRetrospectiveDraftAction extends BaseAction<typeof types.START_RETROSPECTIVE_DRAFT> {
    payload: number
}

interface SetCurrentEventAction extends BaseAction<typeof types.SET_CURRENT_EVENT> {
    payload: GameEvent | null
}

interface SetEventPlayerChoiceAction extends BaseAction<typeof types.SET_EVENT_PLAYER_CHOICE> {
    payload: number | null
}

interface SetEventSelectedChoiceAction extends BaseAction<typeof types.SET_EVENT_SELECTED_CHOICE> {
    payload: EventChoice | null
}

interface SetEventsEnabledAction extends BaseAction<typeof types.SET_EVENTS_ENABLED> {
    payload: boolean
}

interface AddSeenEventAction extends BaseAction<typeof types.ADD_SEEN_EVENT> {
    payload: string
}

interface ResetSeenEventsAction extends BaseAction<typeof types.RESET_SEEN_EVENTS> {}

interface SetEventSourcePlayerSelectionAction extends BaseAction<
    typeof types.SET_EVENT_SOURCE_PLAYER_SELECTION
> {
    payload: number | null
}

interface SetEventStratagemSelectionAction extends BaseAction<
    typeof types.SET_EVENT_STRATAGEM_SELECTION
> {
    payload: StratagemSelection | null
}

interface SetEventTargetPlayerSelectionAction extends BaseAction<
    typeof types.SET_EVENT_TARGET_PLAYER_SELECTION
> {
    payload: number | null
}

interface SetEventTargetStratagemSelectionAction extends BaseAction<
    typeof types.SET_EVENT_TARGET_STRATAGEM_SELECTION
> {
    payload: StratagemSelection | null
}

interface SetEventBoosterDraftAction extends BaseAction<typeof types.SET_EVENT_BOOSTER_DRAFT> {
    payload: string[] | null
}

interface SetEventBoosterSelectionAction extends BaseAction<
    typeof types.SET_EVENT_BOOSTER_SELECTION
> {
    payload: string | null
}

interface SetEventSpecialDraftAction extends BaseAction<typeof types.SET_EVENT_SPECIAL_DRAFT> {
    payload: Item[] | null
}

interface SetEventSpecialDraftTypeAction extends BaseAction<
    typeof types.SET_EVENT_SPECIAL_DRAFT_TYPE
> {
    payload: 'throwable' | 'secondary' | null
}

interface SetEventSpecialDraftSelectionsAction extends BaseAction<
    typeof types.SET_EVENT_SPECIAL_DRAFT_SELECTIONS
> {
    payload: string[] | null
}

interface SetEventSpecialDraftSelectionAction extends BaseAction<
    typeof types.SET_EVENT_SPECIAL_DRAFT_SELECTION
> {
    payload: { playerIndex: number; itemId: string | null }
}

interface SetPendingFactionAction extends BaseAction<typeof types.SET_PENDING_FACTION> {
    payload: Faction | null
}

interface SetPendingSubfactionSelectionAction extends BaseAction<
    typeof types.SET_PENDING_SUBFACTION_SELECTION
> {
    payload: string | null
}

interface ResetEventSelectionsAction extends BaseAction<typeof types.RESET_EVENT_SELECTIONS> {}

interface SetCustomSetupAction extends BaseAction<typeof types.SET_CUSTOM_SETUP> {
    payload: CustomSetup
}

interface UpdateCustomSetupAction extends BaseAction<typeof types.UPDATE_CUSTOM_SETUP> {
    payload: Partial<CustomSetup>
}

interface SetSelectedPlayerAction extends BaseAction<typeof types.SET_SELECTED_PLAYER> {
    payload: number
}

interface AddBurnedCardAction extends BaseAction<typeof types.ADD_BURNED_CARD> {
    payload: string
}

interface SetBurnedCardsAction extends BaseAction<typeof types.SET_BURNED_CARDS> {
    payload: string[]
}

interface LoadGameStateAction extends BaseAction<typeof types.LOAD_GAME_STATE> {
    payload: Partial<GameState>
}

interface ResetGameAction extends BaseAction<typeof types.RESET_GAME> {}

interface SetRunAnalyticsDataAction extends BaseAction<typeof types.SET_RUN_ANALYTICS_DATA> {
    payload: RunAnalyticsData | null
}

export type GameAction =
    | SetPhaseAction
    | UpdateGameConfigAction
    | SetGameConfigAction
    | SetDifficultyAction
    | SetCurrentMissionAction
    | SetRequisitionAction
    | AddRequisitionAction
    | SpendRequisitionAction
    | SetSubfactionAction
    | LockPlayerDraftSlotAction
    | UnlockPlayerDraftSlotAction
    | AddSamplesAction
    | ResetSamplesAction
    | SetSamplesAction
    | SetPlayersAction
    | UpdatePlayerAction
    | UpdatePlayerLoadoutAction
    | AddItemToPlayerAction
    | AddArmorComboToPlayerAction
    | SetPlayerWarbondsAction
    | SetPlayerSuperstoreAction
    | SetPlayerExcludedItemsAction
    | SetPlayerExtractedAction
    | SacrificeItemAction
    | SetSacrificeStateAction
    | UpdateSacrificeStateAction
    | SetDraftStateAction
    | UpdateDraftStateAction
    | SetDraftCardsAction
    | SetActivePlayerIndexAction
    | SetPendingStratagemAction
    | AddDraftHistoryAction
    | SetDraftHistoryAction
    | StartRetrospectiveDraftAction
    | SetCurrentEventAction
    | SetEventPlayerChoiceAction
    | SetEventSelectedChoiceAction
    | SetEventsEnabledAction
    | AddSeenEventAction
    | ResetSeenEventsAction
    | SetEventSourcePlayerSelectionAction
    | SetEventStratagemSelectionAction
    | SetEventTargetPlayerSelectionAction
    | SetEventTargetStratagemSelectionAction
    | SetEventBoosterDraftAction
    | SetEventBoosterSelectionAction
    | SetEventSpecialDraftAction
    | SetEventSpecialDraftTypeAction
    | SetEventSpecialDraftSelectionsAction
    | SetEventSpecialDraftSelectionAction
    | SetPendingFactionAction
    | SetPendingSubfactionSelectionAction
    | ResetEventSelectionsAction
    | SetCustomSetupAction
    | UpdateCustomSetupAction
    | SetSelectedPlayerAction
    | AddBurnedCardAction
    | SetBurnedCardsAction
    | LoadGameStateAction
    | ResetGameAction
    | SetRunAnalyticsDataAction

// Extended Player type for internal use with additional optional fields
// Note: Player already has warbonds/includeSuperstore, this type is for convenience
type ExtendedPlayer = Player

// =============================================================================
// REDUCER
// =============================================================================

/**
 * Game state reducer
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        // Phase management
        case types.SET_PHASE:
            return {
                ...state,
                phase: action.payload,
                // Clear seen events when returning to menu
                seenEvents: action.payload === 'MENU' ? [] : state.seenEvents,
            }

        // Game configuration
        case types.UPDATE_GAME_CONFIG:
            return {
                ...state,
                gameConfig: { ...state.gameConfig, ...action.payload },
            }

        case types.SET_GAME_CONFIG:
            return { ...state, gameConfig: action.payload }

        // Difficulty and resources
        case types.SET_DIFFICULTY:
            return { ...state, currentDiff: action.payload }

        case types.SET_CURRENT_MISSION:
            return { ...state, currentMission: action.payload }

        case types.SET_REQUISITION:
            return { ...state, requisition: action.payload }

        case types.ADD_REQUISITION:
            return { ...state, requisition: state.requisition + action.payload }

        case types.SPEND_REQUISITION:
            return {
                ...state,
                requisition: Math.max(0, state.requisition - action.payload),
            }

        // Faction and subfaction
        case types.SET_SUBFACTION:
            return {
                ...state,
                gameConfig: { ...state.gameConfig, subfaction: action.payload },
            }

        // Draft slot locking (per-player)
        case types.LOCK_PLAYER_DRAFT_SLOT:
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.payload.playerId
                        ? {
                              ...p,
                              lockedSlots:
                                  p.lockedSlots &&
                                  p.lockedSlots.includes(
                                      action.payload.slotType as import('../types').ItemType,
                                  )
                                      ? p.lockedSlots
                                      : ([
                                            ...(p.lockedSlots || []),
                                            action.payload.slotType,
                                        ] as import('../types').ItemType[]),
                          }
                        : p,
                ),
            }

        case types.UNLOCK_PLAYER_DRAFT_SLOT:
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.payload.playerId
                        ? {
                              ...p,
                              lockedSlots: (p.lockedSlots || []).filter(
                                  (slot) => slot !== action.payload.slotType,
                              ),
                          }
                        : p,
                ),
            }

        // Samples
        case types.ADD_SAMPLES:
            return {
                ...state,
                samples: {
                    common: state.samples.common + (action.payload.common || 0),
                    rare: state.samples.rare + (action.payload.rare || 0),
                    superRare: state.samples.superRare + (action.payload.superRare || 0),
                },
            }

        case types.RESET_SAMPLES:
            return {
                ...state,
                samples: {
                    common: 0,
                    rare: 0,
                    superRare: 0,
                },
            }

        case types.SET_SAMPLES:
            return {
                ...state,
                samples: action.payload,
            }

        // Players management
        case types.SET_PLAYERS:
            return { ...state, players: action.payload }

        case types.UPDATE_PLAYER:
            return {
                ...state,
                players: state.players.map((player, idx) =>
                    idx === action.payload.index
                        ? { ...player, ...action.payload.updates }
                        : player,
                ),
            }

        case types.UPDATE_PLAYER_LOADOUT:
            return {
                ...state,
                players: state.players.map((player, idx) =>
                    idx === action.payload.index
                        ? {
                              ...player,
                              loadout: { ...player.loadout, ...action.payload.loadout },
                          }
                        : player,
                ),
            }

        case types.ADD_ITEM_TO_PLAYER:
            return {
                ...state,
                players: state.players.map((player, idx) =>
                    idx === action.payload.playerIndex
                        ? {
                              ...player,
                              inventory: [...player.inventory, action.payload.itemId],
                          }
                        : player,
                ),
            }

        case types.ADD_ARMOR_COMBO_TO_PLAYER:
            return {
                ...state,
                players: state.players.map((player, idx) =>
                    idx === action.payload.playerIndex
                        ? {
                              ...player,
                              inventory: [
                                  ...player.inventory,
                                  ...action.payload.armorCombo.items.map((armor) => armor.id),
                              ],
                          }
                        : player,
                ),
            }

        case types.SET_PLAYER_WARBONDS:
            return {
                ...state,
                players: state.players.map((player, idx) =>
                    idx === action.payload.playerIndex
                        ? { ...player, warbonds: action.payload.warbonds }
                        : player,
                ) as Player[],
            }

        case types.SET_PLAYER_SUPERSTORE:
            return {
                ...state,
                players: state.players.map((player, idx) =>
                    idx === action.payload.playerIndex
                        ? { ...player, includeSuperstore: action.payload.includeSuperstore }
                        : player,
                ) as Player[],
            }

        case types.SET_PLAYER_EXCLUDED_ITEMS:
            return {
                ...state,
                players: state.players.map((player, idx) =>
                    idx === action.payload.playerIndex
                        ? { ...player, excludedItems: action.payload.excludedItems }
                        : player,
                ),
            }

        case types.SET_PLAYER_EXTRACTED:
            return {
                ...state,
                players: state.players.map((player, idx) =>
                    idx === action.payload.playerIndex
                        ? { ...player, extracted: action.payload.extracted }
                        : player,
                ),
            }

        case types.SACRIFICE_ITEM: {
            return {
                ...state,
                players: state.players.map((player, idx) => {
                    if (idx !== action.payload.playerIndex) return player

                    const itemId = action.payload.itemId

                    // Remove from inventory
                    const newInventory = player.inventory.filter((id) => id !== itemId)

                    // Remove from loadout if equipped
                    const newLoadout: Loadout = {
                        ...player.loadout,
                        stratagems: [...player.loadout.stratagems],
                    }

                    if (newLoadout.primary === itemId) newLoadout.primary = null
                    if (newLoadout.secondary === itemId) {
                        newLoadout.secondary = 's_peacemaker'
                        // Ensure s_peacemaker is in inventory
                        if (!newInventory.includes('s_peacemaker')) {
                            newInventory.push('s_peacemaker')
                        }
                    }
                    if (newLoadout.grenade === itemId) {
                        newLoadout.grenade = 'g_he'
                        // Ensure g_he is in inventory
                        if (!newInventory.includes('g_he')) {
                            newInventory.push('g_he')
                        }
                    }
                    if (newLoadout.armor === itemId) {
                        newLoadout.armor = 'a_b01'
                        // Ensure a_b01 is in inventory
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
                }),
            }
        }

        // Sacrifice state
        case types.SET_SACRIFICE_STATE:
            return { ...state, sacrificeState: action.payload }

        case types.UPDATE_SACRIFICE_STATE:
            return {
                ...state,
                sacrificeState: { ...state.sacrificeState, ...action.payload },
            }

        // Draft state
        case types.SET_DRAFT_STATE:
            return { ...state, draftState: action.payload }

        case types.UPDATE_DRAFT_STATE:
            return {
                ...state,
                draftState: { ...state.draftState, ...action.payload },
            }

        case types.SET_DRAFT_CARDS:
            return {
                ...state,
                draftState: { ...state.draftState, roundCards: action.payload },
            }

        case types.SET_ACTIVE_PLAYER_INDEX:
            return {
                ...state,
                draftState: {
                    ...state.draftState,
                    activePlayerIndex: action.payload,
                },
            }

        case types.SET_PENDING_STRATAGEM:
            return {
                ...state,
                draftState: {
                    ...state.draftState,
                    pendingStratagem: action.payload,
                },
            }

        // Draft history
        case types.ADD_DRAFT_HISTORY:
            return {
                ...state,
                draftHistory: [
                    ...state.draftHistory,
                    {
                        difficulty: action.payload.difficulty,
                        starRating: action.payload.starRating,
                    },
                ],
            }

        case types.SET_DRAFT_HISTORY:
            return {
                ...state,
                draftHistory: action.payload || [],
            }

        // Retrospective draft
        case types.START_RETROSPECTIVE_DRAFT:
            return {
                ...state,
                draftState: {
                    ...state.draftState,
                    isRetrospective: true,
                    retrospectivePlayerIndex: action.payload,
                },
            }

        // Events
        case types.SET_CURRENT_EVENT:
            // When setting a new event, always reset all event selections to ensure clean state
            return {
                ...state,
                currentEvent: action.payload,
                eventPlayerChoice: null,
                eventSelectedChoice: null,
                eventSourcePlayerSelection: null,
                eventStratagemSelection: null,
                eventTargetPlayerSelection: null,
                eventTargetStratagemSelection: null,
                eventBoosterDraft: null,
                eventBoosterSelection: null,
                eventSpecialDraft: null,
                eventSpecialDraftType: null,
                eventSpecialDraftSelections: null,
                pendingFaction: null,
                pendingSubfactionSelection: null,
            }

        case types.SET_EVENT_PLAYER_CHOICE:
            return { ...state, eventPlayerChoice: action.payload }

        case types.SET_EVENT_SELECTED_CHOICE:
            return { ...state, eventSelectedChoice: action.payload }

        case types.SET_EVENTS_ENABLED:
            return { ...state, eventsEnabled: action.payload }

        case types.ADD_SEEN_EVENT:
            return { ...state, seenEvents: [...state.seenEvents, action.payload] }

        case types.RESET_SEEN_EVENTS:
            return { ...state, seenEvents: [] }

        case types.SET_EVENT_SOURCE_PLAYER_SELECTION:
            return { ...state, eventSourcePlayerSelection: action.payload }

        case types.SET_EVENT_STRATAGEM_SELECTION:
            return { ...state, eventStratagemSelection: action.payload }

        case types.SET_EVENT_TARGET_PLAYER_SELECTION:
            return { ...state, eventTargetPlayerSelection: action.payload }

        case types.SET_EVENT_TARGET_STRATAGEM_SELECTION:
            return { ...state, eventTargetStratagemSelection: action.payload }

        case types.SET_EVENT_BOOSTER_DRAFT:
            return { ...state, eventBoosterDraft: action.payload }

        case types.SET_EVENT_BOOSTER_SELECTION:
            return { ...state, eventBoosterSelection: action.payload }

        case types.SET_EVENT_SPECIAL_DRAFT:
            return { ...state, eventSpecialDraft: action.payload }

        case types.SET_EVENT_SPECIAL_DRAFT_TYPE:
            return { ...state, eventSpecialDraftType: action.payload }

        case types.SET_EVENT_SPECIAL_DRAFT_SELECTIONS:
            return { ...state, eventSpecialDraftSelections: action.payload }

        case types.SET_EVENT_SPECIAL_DRAFT_SELECTION: {
            const playerCount = state.players?.length || 0
            const currentSelections = Array.isArray(state.eventSpecialDraftSelections)
                ? state.eventSpecialDraftSelections
                : new Array(playerCount).fill(null)
            const normalizedSelections = currentSelections
                .slice(0, playerCount)
                .concat(new Array(Math.max(0, playerCount - currentSelections.length)).fill(null))
            return {
                ...state,
                eventSpecialDraftSelections: normalizedSelections.map((selection, idx) =>
                    idx === action.payload.playerIndex ? action.payload.itemId : selection,
                ),
            }
        }

        case types.SET_PENDING_FACTION:
            return { ...state, pendingFaction: action.payload }

        case types.SET_PENDING_SUBFACTION_SELECTION:
            return { ...state, pendingSubfactionSelection: action.payload }

        case types.RESET_EVENT_SELECTIONS:
            return {
                ...state,
                eventPlayerChoice: null,
                eventSelectedChoice: null,
                eventSourcePlayerSelection: null,
                eventStratagemSelection: null,
                eventTargetPlayerSelection: null,
                eventTargetStratagemSelection: null,
                eventBoosterDraft: null,
                eventBoosterSelection: null,
                eventSpecialDraft: null,
                eventSpecialDraftType: null,
                eventSpecialDraftSelections: null,
                pendingFaction: null,
                pendingSubfactionSelection: null,
            }

        // Custom setup
        case types.SET_CUSTOM_SETUP:
            return { ...state, customSetup: action.payload }

        case types.UPDATE_CUSTOM_SETUP:
            return {
                ...state,
                customSetup: { ...state.customSetup, ...action.payload },
            }

        case types.SET_SELECTED_PLAYER:
            return { ...state, selectedPlayer: action.payload }

        // Burn cards
        case types.ADD_BURNED_CARD:
            return {
                ...state,
                burnedCards: [...state.burnedCards, action.payload],
            }

        case types.SET_BURNED_CARDS:
            return { ...state, burnedCards: action.payload }

        // Full state operations
        case types.LOAD_GAME_STATE: {
            const loadedPlayers = (action.payload.players || []) as ExtendedPlayer[]
            return {
                ...state,
                ...action.payload,
                // Ensure new fields exist with defaults
                samples: action.payload.samples || { common: 0, rare: 0, superRare: 0 },
                seenEvents: action.payload.seenEvents || [],
                eventSpecialDraftSelections: action.payload.eventSpecialDraftSelections ?? null,
                currentMission: action.payload.currentMission || 1,
                draftHistory: action.payload.draftHistory || [],
                players: loadedPlayers.map((p) => ({
                    ...p,
                    weaponRestricted: p.weaponRestricted || false,
                    loadout: p.loadout
                        ? {
                              ...p.loadout,
                              stratagems: normalizeStratagems(p.loadout.stratagems),
                          }
                        : p.loadout,
                })) as Player[],
            }
        }

        case types.RESET_GAME:
            return { ...initialState }

        case types.SET_RUN_ANALYTICS_DATA:
            return { ...state, runAnalyticsData: action.payload }

        default:
            return state
    }
}
