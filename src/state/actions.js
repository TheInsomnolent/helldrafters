import * as types from './actionTypes';

/**
 * Action creators for game state
 */

// Phase management
export const setPhase = (phase) => ({
  type: types.SET_PHASE,
  payload: phase
});

// Game configuration
export const updateGameConfig = (config) => ({
  type: types.UPDATE_GAME_CONFIG,
  payload: config
});

export const setGameConfig = (config) => ({
  type: types.SET_GAME_CONFIG,
  payload: config
});

// Difficulty and resources
export const setDifficulty = (difficulty) => ({
  type: types.SET_DIFFICULTY,
  payload: difficulty
});

export const setRequisition = (amount) => ({
  type: types.SET_REQUISITION,
  payload: amount
});

export const addRequisition = (amount) => ({
  type: types.ADD_REQUISITION,
  payload: amount
});

export const spendRequisition = (amount) => ({
  type: types.SPEND_REQUISITION,
  payload: amount
});

// Faction and subfaction
export const setSubfaction = (subfaction) => ({
  type: types.SET_SUBFACTION,
  payload: subfaction
});

// Draft slot locking (per-player)
export const lockPlayerDraftSlot = (playerId, slotType) => ({
  type: types.LOCK_PLAYER_DRAFT_SLOT,
  payload: { playerId, slotType }
});

export const unlockPlayerDraftSlot = (playerId, slotType) => ({
  type: types.UNLOCK_PLAYER_DRAFT_SLOT,
  payload: { playerId, slotType }
});

// Samples
export const addSamples = (samples) => ({
  type: types.ADD_SAMPLES,
  payload: samples
});

export const resetSamples = () => ({
  type: types.RESET_SAMPLES
});

export const setSamples = (samples) => ({
  type: types.SET_SAMPLES,
  payload: samples
});

// Event selections
export const setEventStratagemSelection = (selection) => ({
  type: types.SET_EVENT_STRATAGEM_SELECTION,
  payload: selection
});

export const setEventTargetPlayerSelection = (playerIndex) => ({
  type: types.SET_EVENT_TARGET_PLAYER_SELECTION,
  payload: playerIndex
});

export const setEventTargetStratagemSelection = (selection) => ({
  type: types.SET_EVENT_TARGET_STRATAGEM_SELECTION,
  payload: selection
});

export const setEventBoosterDraft = (boosters) => ({
  type: types.SET_EVENT_BOOSTER_DRAFT,
  payload: boosters
});

export const setEventBoosterSelection = (boosterId) => ({
  type: types.SET_EVENT_BOOSTER_SELECTION,
  payload: boosterId
});

export const setEventSpecialDraft = (items) => ({
  type: types.SET_EVENT_SPECIAL_DRAFT,
  payload: items
});

export const setEventSpecialDraftType = (draftType) => ({
  type: types.SET_EVENT_SPECIAL_DRAFT_TYPE,
  payload: draftType
});

export const setPendingFaction = (faction) => ({
  type: types.SET_PENDING_FACTION,
  payload: faction
});

export const setPendingSubfactionSelection = (subfaction) => ({
  type: types.SET_PENDING_SUBFACTION_SELECTION,
  payload: subfaction
});

export const resetEventSelections = () => ({
  type: types.RESET_EVENT_SELECTIONS
});

// Players management
export const setPlayers = (players) => ({
  type: types.SET_PLAYERS,
  payload: players
});

export const updatePlayer = (index, updates) => ({
  type: types.UPDATE_PLAYER,
  payload: { index, updates }
});

export const updatePlayerLoadout = (index, loadout) => ({
  type: types.UPDATE_PLAYER_LOADOUT,
  payload: { index, loadout }
});

export const addItemToPlayer = (playerIndex, itemId) => ({
  type: types.ADD_ITEM_TO_PLAYER,
  payload: { playerIndex, itemId }
});

export const addArmorComboToPlayer = (playerIndex, armorCombo) => ({
  type: types.ADD_ARMOR_COMBO_TO_PLAYER,
  payload: { playerIndex, armorCombo }
});

export const setPlayerWarbonds = (playerIndex, warbonds) => ({
  type: types.SET_PLAYER_WARBONDS,
  payload: { playerIndex, warbonds }
});

export const setPlayerSuperstore = (playerIndex, includeSuperstore) => ({
  type: types.SET_PLAYER_SUPERSTORE,
  payload: { playerIndex, includeSuperstore }
});

export const setPlayerExtracted = (playerIndex, extracted) => ({
  type: types.SET_PLAYER_EXTRACTED,
  payload: { playerIndex, extracted }
});

export const sacrificeItem = (playerIndex, itemId) => ({
  type: types.SACRIFICE_ITEM,
  payload: { playerIndex, itemId }
});

// Sacrifice state
export const setSacrificeState = (sacrificeState) => ({
  type: types.SET_SACRIFICE_STATE,
  payload: sacrificeState
});

export const updateSacrificeState = (updates) => ({
  type: types.UPDATE_SACRIFICE_STATE,
  payload: updates
});

// Draft state// Draft state
export const setDraftState = (draftState) => ({
  type: types.SET_DRAFT_STATE,
  payload: draftState
});

export const updateDraftState = (updates) => ({
  type: types.UPDATE_DRAFT_STATE,
  payload: updates
});

export const setDraftCards = (cards) => ({
  type: types.SET_DRAFT_CARDS,
  payload: cards
});

export const setActivePlayerIndex = (index) => ({
  type: types.SET_ACTIVE_PLAYER_INDEX,
  payload: index
});

export const setPendingStratagem = (stratagem) => ({
  type: types.SET_PENDING_STRATAGEM,
  payload: stratagem
});

// Multiplayer draft pick action
export const draftPick = (playerIndex, item) => ({
  type: types.DRAFT_PICK,
  payload: { playerIndex, item }
});

// Events
export const setCurrentEvent = (event) => ({
  type: types.SET_CURRENT_EVENT,
  payload: event
});

export const setEventPlayerChoice = (choice) => ({
  type: types.SET_EVENT_PLAYER_CHOICE,
  payload: choice
});

export const setEventsEnabled = (enabled) => ({
  type: types.SET_EVENTS_ENABLED,
  payload: enabled
});

export const addSeenEvent = (eventId) => ({
  type: types.ADD_SEEN_EVENT,
  payload: eventId
});

export const resetSeenEvents = () => ({
  type: types.RESET_SEEN_EVENTS
});

// Custom setup
export const setCustomSetup = (setup) => ({
  type: types.SET_CUSTOM_SETUP,
  payload: setup
});

export const updateCustomSetup = (updates) => ({
  type: types.UPDATE_CUSTOM_SETUP,
  payload: updates
});

export const setSelectedPlayer = (index) => ({
  type: types.SET_SELECTED_PLAYER,
  payload: index
});

// Burn cards
export const addBurnedCard = (cardId) => ({
  type: types.ADD_BURNED_CARD,
  payload: cardId
});

export const setBurnedCards = (cards) => ({
  type: types.SET_BURNED_CARDS,
  payload: cards
});

// Full state operations
export const loadGameState = (state) => ({
  type: types.LOAD_GAME_STATE,
  payload: state
});

export const resetGame = () => ({
  type: types.RESET_GAME
});
