/**
 * Sync Manager - Handles state synchronization between host and clients
 * 
 * Architecture:
 * - Host writes full game state to Firebase
 * - Clients read game state and subscribe to updates
 * - Clients write actions to clientActions queue
 * - Host processes client actions and updates game state
 */

import {
  get,
  onChildAdded,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set
} from 'firebase/database';
import { getFirebaseDatabase } from './firebaseConfig';

/**
 * Actions that clients are allowed to perform
 * These actions must include a playerSlot to identify which helldiver is affected
 */
export const CLIENT_ALLOWED_ACTIONS = [
  // Draft actions
  'DRAFT_PICK',           // Pick a card during draft (only during their turn)
  'DRAFT_REROLL',         // Reroll draft hand
  'DRAFT_BURN',           // Burn a card
  'SKIP_DRAFT',           // Skip the current draft turn
  'REMOVE_CARD',          // Remove a card from draft hand
  
  // Slot locking
  'LOCK_PLAYER_DRAFT_SLOT',
  'UNLOCK_PLAYER_DRAFT_SLOT',
  
  // Event actions (player-specific)
  'EVENT_SELECT_CHOICE',  // Select an event choice
  'EVENT_SELECT_STRATAGEM',
  'EVENT_SELECT_BOOSTER',
  'EVENT_SELECT_TARGET_PLAYER',
  'EVENT_SELECT_TARGET_STRATAGEM',
  'SET_EVENT_SPECIAL_DRAFT_SELECTION',
  
  // Loadout modifications
  'EQUIP_ITEM',           // Equip an item from inventory
  'STRATAGEM_REPLACEMENT', // Replace a stratagem slot
  
  // Sacrifice phase
  'SACRIFICE_ITEM',       // Sacrifice an item during sacrifice phase
  
  // Mission phase
  'SET_PLAYER_EXTRACTED', // Toggle extraction status (own player only)
  
  // Player ready state
  'PLAYER_READY',         // Mark player as ready
  'PLAYER_NOT_READY'      // Mark player as not ready
];

/**
 * Validate if an action is allowed for a client
 * @param {Object} action - The action to validate
 * @param {number} playerSlot - The client's assigned slot
 * @returns {boolean} Whether the action is allowed
 */
export const isActionAllowedForClient = (action, playerSlot) => {
  // Check if action type is in allowed list
  if (!CLIENT_ALLOWED_ACTIONS.includes(action.type)) {
    return false;
  }
  
  // Actions must target the player's own slot
  if (action.payload?.playerSlot !== undefined && action.payload.playerSlot !== playerSlot) {
    return false;
  }
  
  // For player index-based actions
  if (action.payload?.playerIndex !== undefined && action.payload.playerIndex !== playerSlot) {
    return false;
  }
  
  // For player ID-based actions, we'll need to validate in context
  // This is handled by the host when processing
  
  return true;
};

/**
 * Recursively sanitize state for Firebase - convert undefined to null and ensure arrays stay arrays
 * Firebase strips undefined values and converts sparse arrays to objects
 */
const sanitizeForFirebase = (obj) => {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item));
  }
  if (typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      // Convert undefined to null, otherwise recurse
      result[key] = value === undefined ? null : sanitizeForFirebase(value);
    }
    return result;
  }
  return obj;
};

/**
 * Host: Sync game state to Firebase for clients to receive
 * @param {string} lobbyId - The lobby ID
 * @param {Object} gameState - The current game state
 */
export const syncGameState = async (lobbyId, gameState) => {
  const db = getFirebaseDatabase();
  const stateRef = ref(db, `lobbies/${lobbyId}/gameState`);
  const lastUpdatedRef = ref(db, `lobbies/${lobbyId}/lastUpdated`);
  
  try {
    // Sanitize state to prevent Firebase from stripping undefined values or mangling arrays
    const sanitizedState = sanitizeForFirebase(gameState);
    
    // Add timestamp to state for ordering
    const stateWithTimestamp = {
      ...sanitizedState,
      _syncedAt: serverTimestamp(),
      _version: (gameState._version || 0) + 1
    };
    
    await Promise.all([
      set(stateRef, stateWithTimestamp),
      set(lastUpdatedRef, serverTimestamp())
    ]);
  } catch (error) {
    console.error('Error syncing game state:', error);
    throw error;
  }
};

/**
 * Client: Subscribe to game state updates
 * @param {string} lobbyId - The lobby ID
 * @param {Function} callback - Called with new state on updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeGameState = (lobbyId, callback) => {
  const db = getFirebaseDatabase();
  const stateRef = ref(db, `lobbies/${lobbyId}/gameState`);
  
  const unsubscribe = onValue(stateRef, (snapshot) => {
    if (snapshot.exists()) {
      const state = snapshot.val();
      // Remove internal sync fields before passing to callback
      const { _syncedAt, _version, ...cleanState } = state;
      callback(cleanState, _version);
    }
  }, (error) => {
    console.error('Game state subscription error:', error);
  });
  
  return unsubscribe;
};

/**
 * Client: Send an action to the host via Firebase
 * @param {string} lobbyId - The lobby ID
 * @param {string} playerId - The client's player ID
 * @param {Object} action - The action to send
 */
export const sendClientAction = async (lobbyId, playerId, action) => {
  const db = getFirebaseDatabase();
  const actionsRef = ref(db, `lobbies/${lobbyId}/clientActions`);
  const lastUpdatedRef = ref(db, `lobbies/${lobbyId}/lastUpdated`);
  
  try {
    // Push a new action to the queue
    const newActionRef = push(actionsRef);
    await Promise.all([
      set(newActionRef, {
        playerId,
        action,
        timestamp: serverTimestamp(),
        id: newActionRef.key
      }),
      set(lastUpdatedRef, serverTimestamp())
    ]);
    
    return newActionRef.key;
  } catch (error) {
    console.error('Error sending client action:', error);
    throw error;
  }
};

/**
 * Host: Subscribe to client actions
 * @param {string} lobbyId - The lobby ID
 * @param {Function} callback - Called with each new action
 * @returns {Function} Unsubscribe function
 */
export const subscribeClientActions = (lobbyId, callback) => {
  const db = getFirebaseDatabase();
  const actionsRef = ref(db, `lobbies/${lobbyId}/clientActions`);
  
  // Listen for new child actions
  const unsubscribe = onChildAdded(actionsRef, (snapshot) => {
    if (snapshot.exists()) {
      const actionData = snapshot.val();
      callback(actionData, snapshot.key);
    }
  }, (error) => {
    console.error('Client actions subscription error:', error);
  });
  
  return unsubscribe;
};

/**
 * Host: Remove a processed action from the queue
 * @param {string} lobbyId - The lobby ID
 * @param {string} actionId - The action key to remove
 */
export const removeClientAction = async (lobbyId, actionId) => {
  const db = getFirebaseDatabase();
  const actionRef = ref(db, `lobbies/${lobbyId}/clientActions/${actionId}`);
  
  try {
    await remove(actionRef);
  } catch (error) {
    console.error('Error removing client action:', error);
  }
};

/**
 * Host: Clear all client actions (e.g., on game end)
 * @param {string} lobbyId - The lobby ID
 */
export const clearAllClientActions = async (lobbyId) => {
  const db = getFirebaseDatabase();
  const actionsRef = ref(db, `lobbies/${lobbyId}/clientActions`);
  
  try {
    await remove(actionsRef);
  } catch (error) {
    console.error('Error clearing client actions:', error);
  }
};

/**
 * Get current game state (one-time fetch)
 * @param {string} lobbyId - The lobby ID
 * @returns {Promise<Object|null>} The game state or null
 */
export const getGameState = async (lobbyId) => {
  const db = getFirebaseDatabase();
  const stateRef = ref(db, `lobbies/${lobbyId}/gameState`);
  
  try {
    const snapshot = await get(stateRef);
    if (snapshot.exists()) {
      const state = snapshot.val();
      const { _syncedAt, _version, ...cleanState } = state;
      return cleanState;
    }
    return null;
  } catch (error) {
    console.error('Error getting game state:', error);
    return null;
  }
};

/**
 * Create a multiplayer-aware dispatch wrapper
 * For hosts: dispatch locally and sync
 * For clients: send action to host
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.isHost - Whether this client is the host
 * @param {string} options.lobbyId - The lobby ID
 * @param {string} options.playerId - This player's ID
 * @param {number} options.playerSlot - This player's slot
 * @param {Function} options.localDispatch - The local dispatch function
 * @returns {Function} Wrapped dispatch function
 */
export const createMultiplayerDispatch = ({ isHost, lobbyId, playerId, playerSlot, localDispatch }) => {
  return async (action) => {
    if (isHost) {
      // Host dispatches locally - sync happens via effect
      localDispatch(action);
    } else {
      // Client validates and sends action to host
      if (!isActionAllowedForClient(action, playerSlot)) {
        console.warn('Action not allowed for client:', action.type);
        return;
      }
      
      try {
        await sendClientAction(lobbyId, playerId, action);
      } catch (error) {
        console.error('Failed to send action:', error);
      }
    }
  };
};
