/**
 * Multiplayer Context - React context for multiplayer state and functionality
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { initializeFirebase, isFirebaseConfigured } from './firebaseConfig';
import {
  generateLobbyId,
  createLobby,
  checkLobby,
  joinLobby,
  leaveLobby,
  closeLobby,
  updateLobbyStatus,
  changePlayerSlot,
  subscribeLobby,
  getAvailableSlots
} from './lobbyManager';
import {
  syncGameState,
  subscribeGameState,
  sendClientAction,
  subscribeClientActions,
  removeClientAction,
  isActionAllowedForClient
} from './syncManager';

// Context
const MultiplayerContext = createContext(null);

// Generate a persistent player ID for this browser session
const getOrCreatePlayerId = () => {
  let playerId = sessionStorage.getItem('helldrafters_player_id');
  if (!playerId) {
    playerId = uuidv4();
    sessionStorage.setItem('helldrafters_player_id', playerId);
  }
  return playerId;
};

/**
 * Multiplayer Provider Component
 */
export function MultiplayerProvider({ children }) {
  // Multiplayer state
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [lobbyId, setLobbyId] = useState(null);
  const [lobbyData, setLobbyData] = useState(null);
  const [playerId] = useState(getOrCreatePlayerId);
  const [playerSlot, setPlayerSlot] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [error, setError] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  
  // Dispatch ref - set by the game component
  const dispatchRef = useRef(null);
  
  // Refs for cleanup
  const lobbyUnsubscribeRef = useRef(null);;
  const stateUnsubscribeRef = useRef(null);
  const actionsUnsubscribeRef = useRef(null);  const disconnectRef = useRef(null);  
  // Initialize Firebase on mount
  useEffect(() => {
    if (isFirebaseConfigured()) {
      const success = initializeFirebase();
      setFirebaseReady(success);
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lobbyUnsubscribeRef.current) lobbyUnsubscribeRef.current();
      if (stateUnsubscribeRef.current) stateUnsubscribeRef.current();
      if (actionsUnsubscribeRef.current) actionsUnsubscribeRef.current();
    };
  }, []);
  
  /**
   * Host: Create a new lobby
   */
  const hostGame = useCallback(async (hostName, gameConfig) => {
    if (!firebaseReady) {
      setError('Firebase not configured');
      return null;
    }
    
    setConnectionStatus('connecting');
    setError(null);
    
    try {
      const newLobbyId = generateLobbyId();
      const hostInfo = { id: playerId, name: hostName };
      
      await createLobby(newLobbyId, hostInfo, gameConfig);
      
      setLobbyId(newLobbyId);
      setIsHost(true);
      setIsMultiplayer(true);
      setPlayerSlot(0);
      setPlayerName(hostName);
      setConnectionStatus('connected');
      
      // Subscribe to lobby updates
      lobbyUnsubscribeRef.current = subscribeLobby(newLobbyId, (lobby) => {
        if (lobby) {
          setLobbyData(lobby);
        } else {
          // Lobby was deleted
          setError('Lobby was closed');
          if (disconnectRef.current) disconnectRef.current();
        }
      });
      
      return newLobbyId;
    } catch (err) {
      console.error('Failed to host game:', err);
      setError(err.message);
      setConnectionStatus('disconnected');
      return null;
    }
  }, [firebaseReady, playerId]);
  
  /**
   * Client: Join an existing lobby
   */
  const joinGame = useCallback(async (joinLobbyId, name, slot) => {
    if (!firebaseReady) {
      setError('Firebase not configured');
      return false;
    }
    
    setConnectionStatus('connecting');
    setError(null);
    
    try {
      const playerInfo = { id: playerId, name };
      const result = await joinLobby(joinLobbyId, playerInfo, slot);
      
      if (!result.success) {
        setError(result.error);
        setConnectionStatus('disconnected');
        return false;
      }
      
      setLobbyId(joinLobbyId);
      setIsHost(false);
      setIsMultiplayer(true);
      setPlayerSlot(slot);
      setPlayerName(name);
      setConnectionStatus('connected');
      
      // Subscribe to lobby updates
      lobbyUnsubscribeRef.current = subscribeLobby(joinLobbyId, (lobby) => {
        if (lobby) {
          setLobbyData(lobby);
        } else {
          // Lobby was deleted/closed
          setError('Lobby was closed by host');
          if (disconnectRef.current) disconnectRef.current();
        }
      });
      
      // Subscribe to game state updates (clients only)
      stateUnsubscribeRef.current = subscribeGameState(joinLobbyId, (state) => {
        if (state && dispatchRef.current) {
          // Update local state with synced state from host
          dispatchRef.current({ type: 'LOAD_GAME_STATE', payload: state });
        }
      });
      
      return true;
    } catch (err) {
      console.error('Failed to join game:', err);
      setError(err.message);
      setConnectionStatus('disconnected');
      return false;
    }
  }, [firebaseReady, playerId]);
  
  /**
   * Check if a lobby exists and get its info
   */
  const checkLobbyExists = useCallback(async (checkId) => {
    if (!firebaseReady) return null;
    return await checkLobby(checkId);
  }, [firebaseReady]);
  
  /**
   * Get available slots for a lobby
   */
  const getSlots = useCallback(() => {
    if (!lobbyData) return [];
    return getAvailableSlots(lobbyData);
  }, [lobbyData]);
  
  /**
   * Change player's slot (pre-game only)
   */
  const changeSlot = useCallback(async (newSlot) => {
    if (!lobbyId || !playerId) return false;
    
    const result = await changePlayerSlot(lobbyId, playerId, newSlot);
    if (result.success) {
      setPlayerSlot(newSlot);
    } else {
      setError(result.error);
    }
    return result.success;
  }, [lobbyId, playerId]);
  
  /**
   * Host: Start the game
   */
  const startMultiplayerGame = useCallback(async () => {
    if (!isHost || !lobbyId) return;
    
    await updateLobbyStatus(lobbyId, 'in-game');
    
    // Start listening for client actions
    actionsUnsubscribeRef.current = subscribeClientActions(lobbyId, async (actionData, actionId) => {
      // Process the action
      const { playerId: actionPlayerId, action } = actionData;
      
      // Find the player's slot
      const player = Object.values(lobbyData?.players || {}).find(p => p.id === actionPlayerId);
      if (!player) {
        console.warn('Action from unknown player:', actionPlayerId);
        await removeClientAction(lobbyId, actionId);
        return;
      }
      
      // Validate action is allowed for this player
      if (!isActionAllowedForClient(action, player.slot)) {
        console.warn('Unauthorized action from player:', action.type);
        await removeClientAction(lobbyId, actionId);
        return;
      }
      
      // Dispatch the action locally (host processes it)
      if (dispatchRef.current) {
        dispatchRef.current(action);
      }
      
      // Remove processed action
      await removeClientAction(lobbyId, actionId);
    });
  }, [isHost, lobbyId, lobbyData]);
  
  /**
   * Host: Sync current state to clients
   */
  const syncState = useCallback(async (state) => {
    if (!isHost || !lobbyId) return;
    
    try {
      await syncGameState(lobbyId, state);
    } catch (err) {
      console.error('Failed to sync state:', err);
    }
  }, [isHost, lobbyId]);
  
  /**
   * Client: Send an action to the host
   */
  const sendAction = useCallback(async (action) => {
    if (isHost || !lobbyId || !playerId) return;
    
    // Validate action locally first
    if (!isActionAllowedForClient(action, playerSlot)) {
      console.warn('Action not allowed:', action.type);
      return;
    }
    
    try {
      await sendClientAction(lobbyId, playerId, action);
    } catch (err) {
      console.error('Failed to send action:', err);
      setError('Failed to send action');
    }
  }, [isHost, lobbyId, playerId, playerSlot]);
  
  /**
   * Disconnect from multiplayer
   */
  const disconnect = useCallback(async () => {
    // Cleanup subscriptions
    if (lobbyUnsubscribeRef.current) {
      lobbyUnsubscribeRef.current();
      lobbyUnsubscribeRef.current = null;
    }
    if (stateUnsubscribeRef.current) {
      stateUnsubscribeRef.current();
      stateUnsubscribeRef.current = null;
    }
    if (actionsUnsubscribeRef.current) {
      actionsUnsubscribeRef.current();
      actionsUnsubscribeRef.current = null;
    }
    
    // Leave/close lobby
    if (lobbyId && playerId) {
      if (isHost) {
        await closeLobby(lobbyId);
      } else {
        await leaveLobby(lobbyId, playerId);
      }
    }
    
    // Reset state
    setIsMultiplayer(false);
    setIsHost(false);
    setLobbyId(null);
    setLobbyData(null);
    setPlayerSlot(null);
    setConnectionStatus('disconnected');
    setError(null);
  }, [lobbyId, playerId, isHost]);
  
  // Keep disconnect ref up to date
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);
  
  /**
   * Register dispatch function from game component
   */
  const setDispatch = useCallback((dispatch) => {
    dispatchRef.current = dispatch;
  }, []);
  
  // Context value
  const value = {
    // State
    isMultiplayer,
    isHost,
    lobbyId,
    lobbyData,
    playerId,
    playerSlot,
    playerName,
    connectionStatus,
    error,
    firebaseReady,
    
    // Computed
    connectedPlayers: lobbyData?.players ? Object.values(lobbyData.players) : [],
    
    // Actions
    hostGame,
    joinGame,
    checkLobbyExists,
    getSlots,
    changeSlot,
    startMultiplayerGame,
    syncState,
    sendAction,
    disconnect,
    setDispatch,
    clearError: () => setError(null)
  };
  
  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
}

/**
 * Hook to use multiplayer context
 */
export function useMultiplayer() {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
}

/**
 * Hook to create a multiplayer-aware dispatch
 * Returns either local dispatch (for host/single player) or sendAction (for clients)
 */
export function useMultiplayerDispatch(localDispatch) {
  const { isMultiplayer, isHost, sendAction } = useMultiplayer();
  
  return useCallback((action) => {
    if (!isMultiplayer || isHost) {
      // Single player or host - dispatch locally
      localDispatch(action);
    } else {
      // Client - send to host
      sendAction(action);
    }
  }, [isMultiplayer, isHost, localDispatch, sendAction]);
}

export default MultiplayerContext;
