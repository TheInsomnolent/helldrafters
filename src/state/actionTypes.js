/**
 * Action types for game state reducer
 */

// Phase management
export const SET_PHASE = 'SET_PHASE';

// Game configuration
export const UPDATE_GAME_CONFIG = 'UPDATE_GAME_CONFIG';
export const SET_GAME_CONFIG = 'SET_GAME_CONFIG';

// Difficulty and resources
export const SET_DIFFICULTY = 'SET_DIFFICULTY';
export const SET_REQUISITION = 'SET_REQUISITION';
export const ADD_REQUISITION = 'ADD_REQUISITION';
export const SPEND_REQUISITION = 'SPEND_REQUISITION';
export const SET_LIVES = 'SET_LIVES';
export const ADD_LIVES = 'ADD_LIVES';
export const LOSE_LIVES = 'LOSE_LIVES';

// Players management
export const SET_PLAYERS = 'SET_PLAYERS';
export const UPDATE_PLAYER = 'UPDATE_PLAYER';
export const UPDATE_PLAYER_LOADOUT = 'UPDATE_PLAYER_LOADOUT';
export const ADD_ITEM_TO_PLAYER = 'ADD_ITEM_TO_PLAYER';

// Draft state
export const SET_DRAFT_STATE = 'SET_DRAFT_STATE';
export const UPDATE_DRAFT_STATE = 'UPDATE_DRAFT_STATE';
export const SET_DRAFT_CARDS = 'SET_DRAFT_CARDS';
export const SET_ACTIVE_PLAYER_INDEX = 'SET_ACTIVE_PLAYER_INDEX';
export const SET_PENDING_STRATAGEM = 'SET_PENDING_STRATAGEM';

// Events
export const SET_CURRENT_EVENT = 'SET_CURRENT_EVENT';
export const SET_EVENT_PLAYER_CHOICE = 'SET_EVENT_PLAYER_CHOICE';
export const SET_EVENTS_ENABLED = 'SET_EVENTS_ENABLED';

// Custom setup
export const SET_CUSTOM_SETUP = 'SET_CUSTOM_SETUP';
export const UPDATE_CUSTOM_SETUP = 'UPDATE_CUSTOM_SETUP';
export const SET_SELECTED_PLAYER = 'SET_SELECTED_PLAYER';

// Burn cards
export const ADD_BURNED_CARD = 'ADD_BURNED_CARD';
export const SET_BURNED_CARDS = 'SET_BURNED_CARDS';

// Full state load
export const LOAD_GAME_STATE = 'LOAD_GAME_STATE';
export const RESET_GAME = 'RESET_GAME';
