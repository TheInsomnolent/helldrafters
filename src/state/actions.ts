/**
 * Redux-style action creators for game state management
 *
 * These action creators are used to dispatch actions to the game reducer.
 * The reducer handles state transitions based on these action types.
 */
import * as types from './actionTypes'
import type {
    GamePhase,
    GameConfig,
    GameState,
    Player,
    GameEvent,
    EventChoice,
    Item,
    Samples,
    DraftHistoryRecord,
    StratagemSelection,
    Faction,
    RunAnalyticsData,
    DraftState,
    SacrificeState,
    CustomSetup,
} from '../types'

// =============================================================================
// BASE ACTION TYPE
// =============================================================================

/**
 * Action with required payload
 */
export interface ActionWithPayload<T extends string, P> {
    type: T
    payload: P
}

/**
 * Action without payload
 */
export interface ActionWithoutPayload<T extends string> {
    type: T
}

// =============================================================================
// PHASE ACTIONS
// =============================================================================

export const setPhase = (
    phase: GamePhase,
): ActionWithPayload<typeof types.SET_PHASE, GamePhase> => ({
    type: types.SET_PHASE,
    payload: phase,
})

// =============================================================================
// GAME CONFIGURATION ACTIONS
// =============================================================================

export const updateGameConfig = (
    config: Partial<GameConfig>,
): ActionWithPayload<typeof types.UPDATE_GAME_CONFIG, Partial<GameConfig>> => ({
    type: types.UPDATE_GAME_CONFIG,
    payload: config,
})

export const setSubfaction = (
    subfaction: string,
): ActionWithPayload<typeof types.SET_SUBFACTION, string> => ({
    type: types.SET_SUBFACTION,
    payload: subfaction,
})

// =============================================================================
// DIFFICULTY AND RESOURCE ACTIONS
// =============================================================================

export const setDifficulty = (
    difficulty: number,
): ActionWithPayload<typeof types.SET_DIFFICULTY, number> => ({
    type: types.SET_DIFFICULTY,
    payload: difficulty,
})

export const setCurrentMission = (
    mission: number,
): ActionWithPayload<typeof types.SET_CURRENT_MISSION, number> => ({
    type: types.SET_CURRENT_MISSION,
    payload: mission,
})

export const setRequisition = (
    amount: number,
): ActionWithPayload<typeof types.SET_REQUISITION, number> => ({
    type: types.SET_REQUISITION,
    payload: amount,
})

export const addRequisition = (
    amount: number,
): ActionWithPayload<typeof types.ADD_REQUISITION, number> => ({
    type: types.ADD_REQUISITION,
    payload: amount,
})

export const spendRequisition = (
    amount: number,
): ActionWithPayload<typeof types.SPEND_REQUISITION, number> => ({
    type: types.SPEND_REQUISITION,
    payload: amount,
})

// =============================================================================
// SAMPLES ACTIONS
// =============================================================================

export const addSamples = (
    samples: Partial<Samples>,
): ActionWithPayload<typeof types.ADD_SAMPLES, Partial<Samples>> => ({
    type: types.ADD_SAMPLES,
    payload: samples,
})

export const resetSamples = (): ActionWithoutPayload<typeof types.RESET_SAMPLES> => ({
    type: types.RESET_SAMPLES,
})

// =============================================================================
// PLAYER ACTIONS
// =============================================================================

export const setPlayers = (
    players: Player[],
): ActionWithPayload<typeof types.SET_PLAYERS, Player[]> => ({
    type: types.SET_PLAYERS,
    payload: players,
})

export const setPlayerExcludedItems = (payload: {
    playerIndex: number
    excludedItems: string[]
}): ActionWithPayload<
    typeof types.SET_PLAYER_EXCLUDED_ITEMS,
    { playerIndex: number; excludedItems: string[] }
> => ({
    type: types.SET_PLAYER_EXCLUDED_ITEMS,
    payload,
})

export const setPlayerExtracted = (payload: {
    playerIndex: number
    extracted: boolean
}): ActionWithPayload<
    typeof types.SET_PLAYER_EXTRACTED,
    { playerIndex: number; extracted: boolean }
> => ({
    type: types.SET_PLAYER_EXTRACTED,
    payload,
})

// =============================================================================
// DRAFT SLOT LOCKING ACTIONS
// =============================================================================

export const lockPlayerDraftSlot = (payload: {
    playerId: string
    slotType: string
}): ActionWithPayload<
    typeof types.LOCK_PLAYER_DRAFT_SLOT,
    { playerId: string; slotType: string }
> => ({
    type: types.LOCK_PLAYER_DRAFT_SLOT,
    payload,
})

export const unlockPlayerDraftSlot = (payload: {
    playerId: string
    slotType: string
}): ActionWithPayload<
    typeof types.UNLOCK_PLAYER_DRAFT_SLOT,
    { playerId: string; slotType: string }
> => ({
    type: types.UNLOCK_PLAYER_DRAFT_SLOT,
    payload,
})

// =============================================================================
// DRAFT STATE ACTIONS
// =============================================================================

export const setDraftState = (
    draftState: DraftState,
): ActionWithPayload<typeof types.SET_DRAFT_STATE, DraftState> => ({
    type: types.SET_DRAFT_STATE,
    payload: draftState,
})

export const updateDraftState = (
    updates: Partial<DraftState>,
): ActionWithPayload<typeof types.UPDATE_DRAFT_STATE, Partial<DraftState>> => ({
    type: types.UPDATE_DRAFT_STATE,
    payload: updates,
})

export const addDraftHistory = (
    record: DraftHistoryRecord,
): ActionWithPayload<typeof types.ADD_DRAFT_HISTORY, DraftHistoryRecord> => ({
    type: types.ADD_DRAFT_HISTORY,
    payload: record,
})

export const setDraftHistory = (
    history: DraftHistoryRecord[] | null,
): ActionWithPayload<typeof types.SET_DRAFT_HISTORY, DraftHistoryRecord[] | null> => ({
    type: types.SET_DRAFT_HISTORY,
    payload: history,
})

export const startRetrospectiveDraft = (
    playerIndex: number,
): ActionWithPayload<typeof types.START_RETROSPECTIVE_DRAFT, number> => ({
    type: types.START_RETROSPECTIVE_DRAFT,
    payload: playerIndex,
})

// =============================================================================
// SACRIFICE STATE ACTIONS
// =============================================================================

export const setSacrificeState = (
    sacrificeState: SacrificeState,
): ActionWithPayload<typeof types.SET_SACRIFICE_STATE, SacrificeState> => ({
    type: types.SET_SACRIFICE_STATE,
    payload: sacrificeState,
})

export const updateSacrificeState = (
    updates: Partial<SacrificeState>,
): ActionWithPayload<typeof types.UPDATE_SACRIFICE_STATE, Partial<SacrificeState>> => ({
    type: types.UPDATE_SACRIFICE_STATE,
    payload: updates,
})

// =============================================================================
// EVENT ACTIONS
// =============================================================================

export const setCurrentEvent = (
    event: GameEvent | null,
): ActionWithPayload<typeof types.SET_CURRENT_EVENT, GameEvent | null> => ({
    type: types.SET_CURRENT_EVENT,
    payload: event,
})

export const setEventPlayerChoice = (
    playerIndex: number | null,
): ActionWithPayload<typeof types.SET_EVENT_PLAYER_CHOICE, number | null> => ({
    type: types.SET_EVENT_PLAYER_CHOICE,
    payload: playerIndex,
})

export const setEventSelectedChoice = (
    choice: EventChoice | null,
): ActionWithPayload<typeof types.SET_EVENT_SELECTED_CHOICE, EventChoice | null> => ({
    type: types.SET_EVENT_SELECTED_CHOICE,
    payload: choice,
})

export const setEventsEnabled = (
    enabled: boolean,
): ActionWithPayload<typeof types.SET_EVENTS_ENABLED, boolean> => ({
    type: types.SET_EVENTS_ENABLED,
    payload: enabled,
})

export const addSeenEvent = (
    eventId: string,
): ActionWithPayload<typeof types.ADD_SEEN_EVENT, string> => ({
    type: types.ADD_SEEN_EVENT,
    payload: eventId,
})

export const resetSeenEvents = (): ActionWithoutPayload<typeof types.RESET_SEEN_EVENTS> => ({
    type: types.RESET_SEEN_EVENTS,
})

export const setEventSourcePlayerSelection = (
    playerIndex: number | null,
): ActionWithPayload<typeof types.SET_EVENT_SOURCE_PLAYER_SELECTION, number | null> => ({
    type: types.SET_EVENT_SOURCE_PLAYER_SELECTION,
    payload: playerIndex,
})

export const setEventStratagemSelection = (
    selection: StratagemSelection | null,
): ActionWithPayload<typeof types.SET_EVENT_STRATAGEM_SELECTION, StratagemSelection | null> => ({
    type: types.SET_EVENT_STRATAGEM_SELECTION,
    payload: selection,
})

export const setEventTargetPlayerSelection = (
    playerIndex: number | null,
): ActionWithPayload<typeof types.SET_EVENT_TARGET_PLAYER_SELECTION, number | null> => ({
    type: types.SET_EVENT_TARGET_PLAYER_SELECTION,
    payload: playerIndex,
})

export const setEventTargetStratagemSelection = (
    selection: StratagemSelection | null,
): ActionWithPayload<
    typeof types.SET_EVENT_TARGET_STRATAGEM_SELECTION,
    StratagemSelection | null
> => ({
    type: types.SET_EVENT_TARGET_STRATAGEM_SELECTION,
    payload: selection,
})

export const setEventBoosterDraft = (
    boosters: string[] | null,
): ActionWithPayload<typeof types.SET_EVENT_BOOSTER_DRAFT, string[] | null> => ({
    type: types.SET_EVENT_BOOSTER_DRAFT,
    payload: boosters,
})

export const setEventBoosterSelection = (
    boosterId: string | null,
): ActionWithPayload<typeof types.SET_EVENT_BOOSTER_SELECTION, string | null> => ({
    type: types.SET_EVENT_BOOSTER_SELECTION,
    payload: boosterId,
})

export const setEventSpecialDraft = (
    items: Item[] | null,
): ActionWithPayload<typeof types.SET_EVENT_SPECIAL_DRAFT, Item[] | null> => ({
    type: types.SET_EVENT_SPECIAL_DRAFT,
    payload: items,
})

export const setEventSpecialDraftType = (
    draftType: 'throwable' | 'secondary' | null,
): ActionWithPayload<
    typeof types.SET_EVENT_SPECIAL_DRAFT_TYPE,
    'throwable' | 'secondary' | null
> => ({
    type: types.SET_EVENT_SPECIAL_DRAFT_TYPE,
    payload: draftType,
})

export const setEventSpecialDraftSelections = (
    selections: string[] | null,
): ActionWithPayload<typeof types.SET_EVENT_SPECIAL_DRAFT_SELECTIONS, string[] | null> => ({
    type: types.SET_EVENT_SPECIAL_DRAFT_SELECTIONS,
    payload: selections,
})

export const setEventSpecialDraftSelection = (payload: {
    playerIndex: number
    itemId: string | null
}): ActionWithPayload<
    typeof types.SET_EVENT_SPECIAL_DRAFT_SELECTION,
    { playerIndex: number; itemId: string | null }
> => ({
    type: types.SET_EVENT_SPECIAL_DRAFT_SELECTION,
    payload,
})

export const setPendingFaction = (
    faction: Faction | null,
): ActionWithPayload<typeof types.SET_PENDING_FACTION, Faction | null> => ({
    type: types.SET_PENDING_FACTION,
    payload: faction,
})

export const setPendingSubfactionSelection = (
    subfaction: string | null,
): ActionWithPayload<typeof types.SET_PENDING_SUBFACTION_SELECTION, string | null> => ({
    type: types.SET_PENDING_SUBFACTION_SELECTION,
    payload: subfaction,
})

export const resetEventSelections = (): ActionWithoutPayload<
    typeof types.RESET_EVENT_SELECTIONS
> => ({
    type: types.RESET_EVENT_SELECTIONS,
})

// =============================================================================
// CUSTOM SETUP ACTIONS
// =============================================================================

export const setCustomSetup = (
    customSetup: CustomSetup,
): ActionWithPayload<typeof types.SET_CUSTOM_SETUP, CustomSetup> => ({
    type: types.SET_CUSTOM_SETUP,
    payload: customSetup,
})

export const updateCustomSetup = (
    updates: Partial<CustomSetup>,
): ActionWithPayload<typeof types.UPDATE_CUSTOM_SETUP, Partial<CustomSetup>> => ({
    type: types.UPDATE_CUSTOM_SETUP,
    payload: updates,
})

// =============================================================================
// BURN CARD ACTIONS
// =============================================================================

export const setBurnedCards = (
    cards: string[],
): ActionWithPayload<typeof types.SET_BURNED_CARDS, string[]> => ({
    type: types.SET_BURNED_CARDS,
    payload: cards,
})

export const addBurnedCard = (
    cardId: string,
): ActionWithPayload<typeof types.ADD_BURNED_CARD, string> => ({
    type: types.ADD_BURNED_CARD,
    payload: cardId,
})

// =============================================================================
// ANALYTICS ACTIONS
// =============================================================================

export const setRunAnalyticsData = (
    data: RunAnalyticsData | null,
): ActionWithPayload<typeof types.SET_RUN_ANALYTICS_DATA, RunAnalyticsData | null> => ({
    type: types.SET_RUN_ANALYTICS_DATA,
    payload: data,
})

// =============================================================================
// GAME LIFECYCLE ACTIONS
// =============================================================================

export const loadGameState = (
    state: Partial<GameState>,
): ActionWithPayload<typeof types.LOAD_GAME_STATE, Partial<GameState>> => ({
    type: types.LOAD_GAME_STATE,
    payload: state,
})
