import { FACTION } from '../constants/types';
import * as types from './actionTypes';

/**
 * Initial game state
 */
export const initialState = {
  phase: 'MENU',
  gameConfig: {
    playerCount: 1,
    faction: FACTION.BUGS,
    starRating: 3,
    globalUniqueness: true,
    burnCards: true,
    customStart: false,
    endlessMode: false
  },
  currentDiff: 1,
  requisition: 0,
  lives: 3,
  samples: {
    common: 0,
    rare: 0,
    superRare: 0
  },
  players: [],
  draftState: {
    activePlayerIndex: 0,
    roundCards: [],
    isRerolling: false,
    pendingStratagem: null
  },
  burnedCards: [],
  customSetup: {
    difficulty: 1,
    loadouts: []
  },
  selectedPlayer: 0,
  eventsEnabled: true,
  currentEvent: null,
  eventPlayerChoice: null,
  settingsOpen: false,
  disabledWarbonds: []
};

/**
 * Game state reducer
 */
export function gameReducer(state, action) {
  switch (action.type) {
    // Phase management
    case types.SET_PHASE:
      return { ...state, phase: action.payload };

    // Game configuration
    case types.UPDATE_GAME_CONFIG:
      return {
        ...state,
        gameConfig: { ...state.gameConfig, ...action.payload }
      };

    case types.SET_GAME_CONFIG:
      return { ...state, gameConfig: action.payload };

    // Difficulty and resources
    case types.SET_DIFFICULTY:
      return { ...state, currentDiff: action.payload };

    case types.SET_REQUISITION:
      return { ...state, requisition: action.payload };

    case types.ADD_REQUISITION:
      return { ...state, requisition: state.requisition + action.payload };

    case types.SPEND_REQUISITION:
      return {
        ...state,
        requisition: Math.max(0, state.requisition - action.payload)
      };

    case types.SET_LIVES:
      return { ...state, lives: action.payload };

    case types.ADD_LIVES:
      return { ...state, lives: state.lives + action.payload };

    case types.LOSE_LIVES:
      return {
        ...state,
        lives: Math.max(0, state.lives - action.payload)
      };

    // Samples
    case types.ADD_SAMPLES:
      return {
        ...state,
        samples: {
          common: state.samples.common + (action.payload.common || 0),
          rare: state.samples.rare + (action.payload.rare || 0),
          superRare: state.samples.superRare + (action.payload.superRare || 0)
        }
      };

    case types.RESET_SAMPLES:
      return {
        ...state,
        samples: {
          common: 0,
          rare: 0,
          superRare: 0
        }
      };

    case types.SET_SAMPLES:
      return {
        ...state,
        samples: action.payload
      };

    // Players management
    case types.SET_PLAYERS:
      return { ...state, players: action.payload };

    case types.UPDATE_PLAYER:
      return {
        ...state,
        players: state.players.map((player, idx) =>
          idx === action.payload.index
            ? { ...player, ...action.payload.updates }
            : player
        )
      };

    case types.UPDATE_PLAYER_LOADOUT:
      return {
        ...state,
        players: state.players.map((player, idx) =>
          idx === action.payload.index
            ? {
                ...player,
                loadout: { ...player.loadout, ...action.payload.loadout }
              }
            : player
        )
      };

    case types.ADD_ITEM_TO_PLAYER:
      return {
        ...state,
        players: state.players.map((player, idx) =>
          idx === action.payload.playerIndex
            ? {
                ...player,
                inventory: [...player.inventory, action.payload.itemId]
              }
            : player
        )
      };

    case types.ADD_ARMOR_COMBO_TO_PLAYER:
      return {
        ...state,
        players: state.players.map((player, idx) =>
          idx === action.payload.playerIndex
            ? {
                ...player,
                inventory: [
                  ...player.inventory,
                  ...action.payload.armorCombo.items.map(armor => armor.id)
                ]
              }
            : player
        )
      };

    case types.SET_PLAYER_WARBONDS:
      return {
        ...state,
        players: state.players.map((player, idx) =>
          idx === action.payload.playerIndex
            ? { ...player, warbonds: action.payload.warbonds }
            : player
        )
      };

    case types.SET_PLAYER_SUPERSTORE:
      return {
        ...state,
        players: state.players.map((player, idx) =>
          idx === action.payload.playerIndex
            ? { ...player, includeSuperstore: action.payload.includeSuperstore }
            : player
        )
      };

    // Draft state
    case types.SET_DRAFT_STATE:
      return { ...state, draftState: action.payload };

    case types.UPDATE_DRAFT_STATE:
      return {
        ...state,
        draftState: { ...state.draftState, ...action.payload }
      };

    case types.SET_DRAFT_CARDS:
      return {
        ...state,
        draftState: { ...state.draftState, roundCards: action.payload }
      };

    case types.SET_ACTIVE_PLAYER_INDEX:
      return {
        ...state,
        draftState: {
          ...state.draftState,
          activePlayerIndex: action.payload
        }
      };

    case types.SET_PENDING_STRATAGEM:
      return {
        ...state,
        draftState: {
          ...state.draftState,
          pendingStratagem: action.payload
        }
      };

    // Events
    case types.SET_CURRENT_EVENT:
      return { ...state, currentEvent: action.payload };

    case types.SET_EVENT_PLAYER_CHOICE:
      return { ...state, eventPlayerChoice: action.payload };

    case types.SET_EVENTS_ENABLED:
      return { ...state, eventsEnabled: action.payload };

    // Custom setup
    case types.SET_CUSTOM_SETUP:
      return { ...state, customSetup: action.payload };

    case types.UPDATE_CUSTOM_SETUP:
      return {
        ...state,
        customSetup: { ...state.customSetup, ...action.payload }
      };

    case types.SET_SELECTED_PLAYER:
      return { ...state, selectedPlayer: action.payload };

    // Burn cards
    case types.ADD_BURNED_CARD:
      return {
        ...state,
        burnedCards: [...state.burnedCards, action.payload]
      };

    case types.SET_BURNED_CARDS:
      return { ...state, burnedCards: action.payload };

    // Full state operations
    case types.LOAD_GAME_STATE:
      return { ...state, ...action.payload };

    case types.RESET_GAME:
      return { ...initialState };

    default:
      return state;
  }
}
