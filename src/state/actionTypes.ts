/**
 * Action type constants for game state reducer
 *
 * These constants define all possible action types that can be dispatched
 * to modify the game state.
 */

// Phase management
export const SET_PHASE = 'SET_PHASE' as const

// Game configuration
export const UPDATE_GAME_CONFIG = 'UPDATE_GAME_CONFIG' as const
export const SET_GAME_CONFIG = 'SET_GAME_CONFIG' as const

// Difficulty and resources
export const SET_DIFFICULTY = 'SET_DIFFICULTY' as const
export const SET_REQUISITION = 'SET_REQUISITION' as const
export const ADD_REQUISITION = 'ADD_REQUISITION' as const
export const SPEND_REQUISITION = 'SPEND_REQUISITION' as const

// Faction and subfaction
export const SET_SUBFACTION = 'SET_SUBFACTION' as const

// Draft slot locking (per-player)
export const LOCK_PLAYER_DRAFT_SLOT = 'LOCK_PLAYER_DRAFT_SLOT' as const
export const UNLOCK_PLAYER_DRAFT_SLOT = 'UNLOCK_PLAYER_DRAFT_SLOT' as const

// Samples
export const ADD_SAMPLES = 'ADD_SAMPLES' as const
export const RESET_SAMPLES = 'RESET_SAMPLES' as const
export const SET_SAMPLES = 'SET_SAMPLES' as const

// Players management
export const SET_PLAYERS = 'SET_PLAYERS' as const
export const UPDATE_PLAYER = 'UPDATE_PLAYER' as const
export const UPDATE_PLAYER_LOADOUT = 'UPDATE_PLAYER_LOADOUT' as const
export const ADD_ITEM_TO_PLAYER = 'ADD_ITEM_TO_PLAYER' as const
export const ADD_ARMOR_COMBO_TO_PLAYER = 'ADD_ARMOR_COMBO_TO_PLAYER' as const
export const SET_PLAYER_WARBONDS = 'SET_PLAYER_WARBONDS' as const
export const SET_PLAYER_SUPERSTORE = 'SET_PLAYER_SUPERSTORE' as const
export const SET_PLAYER_EXCLUDED_ITEMS = 'SET_PLAYER_EXCLUDED_ITEMS' as const
export const SET_PLAYER_EXTRACTED = 'SET_PLAYER_EXTRACTED' as const
export const SACRIFICE_ITEM = 'SACRIFICE_ITEM' as const

// Draft state
export const SET_DRAFT_STATE = 'SET_DRAFT_STATE' as const
export const UPDATE_DRAFT_STATE = 'UPDATE_DRAFT_STATE' as const
export const SET_DRAFT_CARDS = 'SET_DRAFT_CARDS' as const
export const SET_ACTIVE_PLAYER_INDEX = 'SET_ACTIVE_PLAYER_INDEX' as const
export const SET_PENDING_STRATAGEM = 'SET_PENDING_STRATAGEM' as const
export const DRAFT_PICK = 'DRAFT_PICK' as const
export const STRATAGEM_REPLACEMENT = 'STRATAGEM_REPLACEMENT' as const
export const ADD_DRAFT_HISTORY = 'ADD_DRAFT_HISTORY' as const
export const SET_DRAFT_HISTORY = 'SET_DRAFT_HISTORY' as const
export const START_RETROSPECTIVE_DRAFT = 'START_RETROSPECTIVE_DRAFT' as const

// Sacrifice state
export const SET_SACRIFICE_STATE = 'SET_SACRIFICE_STATE' as const
export const UPDATE_SACRIFICE_STATE = 'UPDATE_SACRIFICE_STATE' as const

// Events
export const SET_CURRENT_EVENT = 'SET_CURRENT_EVENT' as const
export const SET_EVENT_PLAYER_CHOICE = 'SET_EVENT_PLAYER_CHOICE' as const
export const SET_EVENT_SELECTED_CHOICE = 'SET_EVENT_SELECTED_CHOICE' as const
export const SET_EVENTS_ENABLED = 'SET_EVENTS_ENABLED' as const
export const ADD_SEEN_EVENT = 'ADD_SEEN_EVENT' as const
export const RESET_SEEN_EVENTS = 'RESET_SEEN_EVENTS' as const
export const SET_EVENT_SOURCE_PLAYER_SELECTION = 'SET_EVENT_SOURCE_PLAYER_SELECTION' as const
export const SET_EVENT_STRATAGEM_SELECTION = 'SET_EVENT_STRATAGEM_SELECTION' as const
export const SET_EVENT_TARGET_PLAYER_SELECTION = 'SET_EVENT_TARGET_PLAYER_SELECTION' as const
export const SET_EVENT_TARGET_STRATAGEM_SELECTION = 'SET_EVENT_TARGET_STRATAGEM_SELECTION' as const
export const SET_EVENT_BOOSTER_DRAFT = 'SET_EVENT_BOOSTER_DRAFT' as const
export const SET_EVENT_BOOSTER_SELECTION = 'SET_EVENT_BOOSTER_SELECTION' as const
export const SET_EVENT_SPECIAL_DRAFT = 'SET_EVENT_SPECIAL_DRAFT' as const
export const SET_EVENT_SPECIAL_DRAFT_TYPE = 'SET_EVENT_SPECIAL_DRAFT_TYPE' as const
export const SET_EVENT_SPECIAL_DRAFT_SELECTIONS = 'SET_EVENT_SPECIAL_DRAFT_SELECTIONS' as const
export const SET_EVENT_SPECIAL_DRAFT_SELECTION = 'SET_EVENT_SPECIAL_DRAFT_SELECTION' as const
export const SET_PENDING_FACTION = 'SET_PENDING_FACTION' as const
export const SET_PENDING_SUBFACTION_SELECTION = 'SET_PENDING_SUBFACTION_SELECTION' as const
export const RESET_EVENT_SELECTIONS = 'RESET_EVENT_SELECTIONS' as const

// Custom setup
export const SET_CUSTOM_SETUP = 'SET_CUSTOM_SETUP' as const
export const UPDATE_CUSTOM_SETUP = 'UPDATE_CUSTOM_SETUP' as const
export const SET_SELECTED_PLAYER = 'SET_SELECTED_PLAYER' as const

// Burn cards
export const ADD_BURNED_CARD = 'ADD_BURNED_CARD' as const
export const SET_BURNED_CARDS = 'SET_BURNED_CARDS' as const

// Endurance mode
export const SET_CURRENT_MISSION = 'SET_CURRENT_MISSION' as const

// Full state load
export const LOAD_GAME_STATE = 'LOAD_GAME_STATE' as const
export const RESET_GAME = 'RESET_GAME' as const

// Analytics
export const SET_RUN_ANALYTICS_DATA = 'SET_RUN_ANALYTICS_DATA' as const

// Settings
export const SET_SETTINGS_OPEN = 'SET_SETTINGS_OPEN' as const
export const SET_DISABLED_WARBONDS = 'SET_DISABLED_WARBONDS' as const
