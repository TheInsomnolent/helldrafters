/**
 * Lobby Manager - Handles lobby creation, joining, and player slot management
 * 
 * Security model:
 * - Lobbies are identified by UUIDv4, which serves as the "secret" for joining
 * - No lobby listing/scanning is possible - you must know the exact UUID
 * - Firebase rules prevent reading /lobbies (root) but allow reading /lobbies/{lobbyId}
 * - Only the host can write to gameState, clients write to clientActions
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  ref, 
  set, 
  get, 
  remove, 
  onValue, 
  onDisconnect,
  serverTimestamp 
} from 'firebase/database';
import { getFirebaseDatabase } from './firebaseConfig';

/**
 * Update the lastUpdatedAt timestamp for a lobby
 * This is used by the cleanup function to identify stale lobbies
 * @param {string} lobbyId - The lobby ID
 */
const updateLastUpdatedAt = async (lobbyId) => {
  const db = getFirebaseDatabase();
  const timestampRef = ref(db, `lobbies/${lobbyId}/lastUpdatedAt`);
  try {
    await set(timestampRef, serverTimestamp());
  } catch (error) {
    // Silently fail - this is not critical functionality
    console.warn('Failed to update lastUpdatedAt:', error);
  }
};

/**
 * Generate a new lobby ID (UUIDv4)
 * The UUID serves as both identifier and access control
 */
export const generateLobbyId = () => {
  return uuidv4();
};

/**
 * Create a new lobby as host
 * @param {string} lobbyId - The UUIDv4 lobby identifier
 * @param {Object} hostInfo - Information about the host player
 * @param {Object} gameConfig - Initial game configuration
 * @returns {Promise<Object>} Lobby data
 */
export const createLobby = async (lobbyId, hostInfo, gameConfig) => {
  const db = getFirebaseDatabase();
  const lobbyRef = ref(db, `lobbies/${lobbyId}`);
  
  const lobbyData = {
    id: lobbyId,
    hostId: hostInfo.id,
    createdAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(), // Used by cleanup function to delete stale lobbies
    status: 'waiting', // waiting, in-game, completed
    config: gameConfig,
    players: {
      [hostInfo.id]: {
        id: hostInfo.id,
        name: hostInfo.name,
        slot: 0, // Host takes slot 0 by default
        isHost: true,
        connected: true,
        joinedAt: serverTimestamp()
      }
    },
    // Game state is only written by host
    gameState: null,
    // Client actions queue - clients write here, host processes and clears
    clientActions: {}
  };
  
  await set(lobbyRef, lobbyData);
  
  // Set up disconnect handler to mark host as disconnected
  const playerRef = ref(db, `lobbies/${lobbyId}/players/${hostInfo.id}/connected`);
  onDisconnect(playerRef).set(false);
  
  return lobbyData;
};

/**
 * Check if a lobby exists and is joinable
 * @param {string} lobbyId - The lobby ID to check
 * @returns {Promise<Object|null>} Lobby info or null if not found/not joinable
 */
export const checkLobby = async (lobbyId) => {
  const db = getFirebaseDatabase();
  const lobbyRef = ref(db, `lobbies/${lobbyId}`);
  
  try {
    const snapshot = await get(lobbyRef);
    if (!snapshot.exists()) {
      return null;
    }
    
    const lobby = snapshot.val();
    
    // Check if this is a loaded/saved game (has gameState with phase other than MENU/LOBBY)
    const isLoadedGame = lobby.gameState && 
      lobby.gameState.phase && 
      !['MENU', 'LOBBY'].includes(lobby.gameState.phase);
    
    // Return basic info without full game state (for join screen)
    return {
      id: lobby.id,
      status: lobby.status,
      config: lobby.config,
      players: lobby.players,
      hostId: lobby.hostId,
      isLoadedGame: isLoadedGame
    };
  } catch (error) {
    console.error('Error checking lobby:', error);
    return null;
  }
};

/**
 * Join an existing lobby
 * @param {string} lobbyId - The lobby ID to join
 * @param {Object} playerInfo - Information about the joining player
 * @param {number} requestedSlot - The player slot to take (0-3)
 * @returns {Promise<Object>} Result with success status and data
 */
export const joinLobby = async (lobbyId, playerInfo, requestedSlot) => {
  const db = getFirebaseDatabase();
  const lobbyRef = ref(db, `lobbies/${lobbyId}`);
  
  try {
    // Get current lobby state
    const snapshot = await get(lobbyRef);
    if (!snapshot.exists()) {
      return { success: false, error: 'Lobby not found' };
    }
    
    const lobby = snapshot.val();
    
    // Allow joining in both 'waiting' and 'in-game' states (hot-join support)
    // Only reject if lobby is 'completed'
    if (lobby.status === 'completed') {
      return { success: false, error: 'Game has already completed' };
    }
    
    // Check if player already exists in lobby (avoid overwriting) before slot validation
    const players = lobby.players || {};
    if (players[playerInfo.id]) {
      return { success: false, error: 'Player is already in this lobby', errorCode: 'PLAYER_ID_CONFLICT' };
    }
    
    // Check if slot is available
    const slotTaken = Object.values(players).some(p => p.slot === requestedSlot);
    if (slotTaken) {
      return { success: false, error: 'Slot is already taken' };
    }
    
    // Check player count limit (always allow up to 4 players in multiplayer)
    const playerCount = Object.keys(players).length;
    if (playerCount >= 4) {
      return { success: false, error: 'Lobby is full' };
    }
    
    // Add player to lobby
    const playerRef = ref(db, `lobbies/${lobbyId}/players/${playerInfo.id}`);
    await set(playerRef, {
      id: playerInfo.id,
      name: playerInfo.name,
      slot: requestedSlot,
      isHost: false,
      connected: true,
      joinedAt: serverTimestamp()
    });
    
    // Set up disconnect handler
    const connectedRef = ref(db, `lobbies/${lobbyId}/players/${playerInfo.id}/connected`);
    onDisconnect(connectedRef).set(false);
    
    return { 
      success: true, 
      lobby: {
        ...lobby,
        players: {
          ...players,
          [playerInfo.id]: {
            id: playerInfo.id,
            name: playerInfo.name,
            slot: requestedSlot,
            isHost: false,
            connected: true
          }
        }
      }
    };
  } catch (error) {
    console.error('Error joining lobby:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Leave a lobby
 * @param {string} lobbyId - The lobby ID
 * @param {string} playerId - The player ID leaving
 */
export const leaveLobby = async (lobbyId, playerId) => {
  const db = getFirebaseDatabase();
  const playerRef = ref(db, `lobbies/${lobbyId}/players/${playerId}`);
  
  try {
    await remove(playerRef);
  } catch (error) {
    console.error('Error leaving lobby:', error);
  }
};

/**
 * Kick a player from the lobby (host only)
 * This removes the player from the lobby but preserves their loadout in the game state
 * so they can rejoin and resume their progress
 * @param {string} lobbyId - The lobby ID
 * @param {string} playerId - The player ID to kick
 * @returns {Promise<Object>} Result with success status
 */
export const kickPlayer = async (lobbyId, playerId) => {
  const db = getFirebaseDatabase();
  const playerRef = ref(db, `lobbies/${lobbyId}/players/${playerId}`);
  
  try {
    await remove(playerRef);
    return { success: true };
  } catch (error) {
    console.error('Error kicking player:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Close/delete a lobby (host only)
 * @param {string} lobbyId - The lobby ID to close
 */
export const closeLobby = async (lobbyId) => {
  const db = getFirebaseDatabase();
  const lobbyRef = ref(db, `lobbies/${lobbyId}`);
  
  try {
    await remove(lobbyRef);
  } catch (error) {
    console.error('Error closing lobby:', error);
  }
};

/**
 * Update lobby status (host only)
 * @param {string} lobbyId - The lobby ID
 * @param {string} status - New status ('waiting', 'in-game', 'completed')
 */
export const updateLobbyStatus = async (lobbyId, status) => {
  const db = getFirebaseDatabase();
  const statusRef = ref(db, `lobbies/${lobbyId}/status`);
  
  try {
    await set(statusRef, status);
  } catch (error) {
    console.error('Error updating lobby status:', error);
  }
};

/**
 * Change player slot
 * @param {string} lobbyId - The lobby ID
 * @param {string} playerId - The player changing slots
 * @param {number} newSlot - The new slot number
 * @returns {Promise<Object>} Result with success status
 */
export const changePlayerSlot = async (lobbyId, playerId, newSlot) => {
  const db = getFirebaseDatabase();
  
  try {
    // Check if slot is available
    const playersRef = ref(db, `lobbies/${lobbyId}/players`);
    const snapshot = await get(playersRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Lobby not found' };
    }
    
    const players = snapshot.val();
    const slotTaken = Object.values(players).some(p => p.id !== playerId && p.slot === newSlot);
    
    if (slotTaken) {
      return { success: false, error: 'Slot is already taken' };
    }
    
    // Update slot
    const slotRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/slot`);
    await set(slotRef, newSlot);
    
    return { success: true };
  } catch (error) {
    console.error('Error changing slot:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to lobby updates
 * @param {string} lobbyId - The lobby ID
 * @param {Function} callback - Called with lobby data on updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeLobby = (lobbyId, callback) => {
  const db = getFirebaseDatabase();
  const lobbyRef = ref(db, `lobbies/${lobbyId}`);
  
  const unsubscribe = onValue(lobbyRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Lobby subscription error:', error);
    callback(null, error);
  });
  
  return unsubscribe;
};

/**
 * Get available slots in a lobby
 * @param {Object} lobby - The lobby data
 * @returns {number[]} Array of available slot indices
 */
export const getAvailableSlots = (lobby) => {
  if (!lobby || !lobby.config) return [];
  
  const totalSlots = 4; // Always allow up to 4 players in multiplayer (dynamic)
  const players = lobby.players || {};
  const takenSlots = Object.values(players).map(p => p.slot);
  
  const available = [];
  for (let i = 0; i < totalSlots; i++) {
    if (!takenSlots.includes(i)) {
      available.push(i);
    }
  }
  
  return available;
};

/**
 * Update player's connected status
 * @param {string} lobbyId - The lobby ID
 * @param {string} playerId - The player ID
 * @param {boolean} connected - Connection status
 */
export const updatePlayerConnection = async (lobbyId, playerId, connected) => {
  const db = getFirebaseDatabase();
  const connectedRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/connected`);
  
  try {
    await set(connectedRef, connected);
  } catch (error) {
    console.error('Error updating connection status:', error);
  }
};

/**
 * Update player's configuration (name, warbonds, ready state, etc.)
 * @param {string} lobbyId - The lobby ID
 * @param {string} playerId - The player ID
 * @param {Object} config - Configuration to update
 * @returns {Promise<Object>} Result with success status
 */
export const updatePlayerConfig = async (lobbyId, playerId, config) => {
  const db = getFirebaseDatabase();
  
  try {
    // Update each config field individually to avoid overwriting other fields
    const updates = [];
    
    if (config.name !== undefined) {
      const nameRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/name`);
      updates.push(set(nameRef, config.name));
    }
    
    if (config.warbonds !== undefined) {
      const warbondsRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/warbonds`);
      updates.push(set(warbondsRef, config.warbonds));
    }
    
    if (config.includeSuperstore !== undefined) {
      const superstoreRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/includeSuperstore`);
      updates.push(set(superstoreRef, config.includeSuperstore));
    }
    
    if (config.ready !== undefined) {
      const readyRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/ready`);
      updates.push(set(readyRef, config.ready));
    }
    
    await Promise.all(updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating player config:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set player's ready state
 * @param {string} lobbyId - The lobby ID
 * @param {string} playerId - The player ID
 * @param {boolean} ready - Ready state
 * @returns {Promise<Object>} Result with success status
 */
export const setPlayerReady = async (lobbyId, playerId, ready) => {
  const db = getFirebaseDatabase();
  const readyRef = ref(db, `lobbies/${lobbyId}/players/${playerId}/ready`);
  
  try {
    await set(readyRef, ready);
    return { success: true };
  } catch (error) {
    console.error('Error setting ready state:', error);
    return { success: false, error: error.message };
  }
};
