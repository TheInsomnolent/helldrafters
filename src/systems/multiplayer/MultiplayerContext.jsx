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
  kickPlayer,
  closeLobby,
  updateLobbyStatus,
  changePlayerSlot,
  subscribeLobby,
  getAvailableSlots,
  updatePlayerConfig as updatePlayerConfigInLobby,
  setPlayerReady as setPlayerReadyInLobby
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
  const [playerId, setPlayerId] = useState(getOrCreatePlayerId);
  const [playerSlot, setPlayerSlot] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [error, setError] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [hostDisconnected, setHostDisconnected] = useState(false); // Track if host closed the lobby
  const [wasKicked, setWasKicked] = useState(false); // Track if player was kicked
  const [clientDisconnected, setClientDisconnected] = useState(false); // Track if client intentionally disconnected
  
  // Dispatch ref - set by the game component
  const dispatchRef = useRef(null);
  
  // Handler for special actions (like DRAFT_PICK) that need app-level processing
  const actionHandlerRef = useRef(null);
  
  // Refs for cleanup
  const lobbyUnsubscribeRef = useRef(null);
  const stateUnsubscribeRef = useRef(null);
  const actionsUnsubscribeRef = useRef(null);
  const disconnectRef = useRef(null);
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
      let activePlayerId = playerId;
      let didRetry = false;
      let result = await joinLobby(joinLobbyId, { id: activePlayerId, name }, slot);
      
      if (!result.success && result.errorCode === 'PLAYER_ID_CONFLICT') {
        didRetry = true;
        activePlayerId = uuidv4();
        sessionStorage.setItem('helldrafters_player_id', activePlayerId);
        setPlayerId(activePlayerId);
        result = await joinLobby(joinLobbyId, { id: activePlayerId, name }, slot);
      }
      
      if (!result.success) {
        if (didRetry && result.errorCode === 'PLAYER_ID_CONFLICT') {
          setError('Unable to join lobby. Please try again.');
        } else {
          setError(result.error);
        }
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
          // Check if current player has been kicked (no longer in players list)
          const stillInLobby = lobby.players && Object.keys(lobby.players).includes(playerId);
          if (!stillInLobby) {
            // Player was kicked
            setWasKicked(true);
            if (disconnectRef.current) disconnectRef.current();
          } else {
            setLobbyData(lobby);
          }
        } else {
          // Lobby was deleted/closed by host
          setError('Lobby was closed by host');
          setHostDisconnected(true); // Signal that host disconnected
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
   * Host: Kick a player from the lobby (frees their slot for rejoining)
   */
  const kickPlayerFromLobby = useCallback(async (playerIdToKick) => {
    if (!isHost || !lobbyId) return false;
    
    const result = await kickPlayer(lobbyId, playerIdToKick);
    if (!result.success) {
      setError(result.error);
    }
    return result.success;
  }, [isHost, lobbyId]);
  
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
      
      // Check if there's a special handler for this action type
      if (actionHandlerRef.current && actionHandlerRef.current(action)) {
        // Handler processed the action
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
   * Disconnect from multiplayer (intentional disconnect by user)
   */
  const disconnect = useCallback(async () => {
    console.log('[Multiplayer] disconnect() called', { isHost, lobbyId, playerId });
    
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
        console.log('[Multiplayer] Host closing lobby', { lobbyId });
        await closeLobby(lobbyId);
        // Host also needs to be returned to menu
        setClientDisconnected(true);
      } else {
        console.log('[Multiplayer] Client leaving lobby', { lobbyId, playerId });
        await leaveLobby(lobbyId, playerId);
        // Set flag that client intentionally disconnected (to trigger menu return)
        setClientDisconnected(true);
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
   * Update player's configuration (name, warbonds, ready state)
   */
  const updatePlayerConfig = useCallback(async (config) => {
    if (!lobbyId || !playerId) return;
    
    try {
      await updatePlayerConfigInLobby(lobbyId, playerId, config);
      
      // Update local player name if changed
      if (config.name !== undefined) {
        setPlayerName(config.name);
      }
    } catch (err) {
      console.error('Failed to update player config:', err);
      setError('Failed to update configuration');
    }
  }, [lobbyId, playerId]);
  
  /**
   * Set player's ready state
   */
  const setPlayerReady = useCallback(async (ready) => {
    if (!lobbyId || !playerId) return;
    
    try {
      await setPlayerReadyInLobby(lobbyId, playerId, ready);
    } catch (err) {
      console.error('Failed to set ready state:', err);
      setError('Failed to update ready state');
    }
  }, [lobbyId, playerId]);
  
  /**
   * Get list of connected players from lobby data
   */
  const getConnectedPlayers = useCallback(() => {
    if (!lobbyData?.players) return [];
    return Object.values(lobbyData.players)
      .filter(p => p.connected)
      .sort((a, b) => a.slot - b.slot);
  }, [lobbyData]);
  
  /**
   * Register dispatch function from game component
   */
  const setDispatch = useCallback((dispatch) => {
    dispatchRef.current = dispatch;
  }, []);
  
  /**
   * Register action handler for special actions (like DRAFT_PICK)
   * Handler should return true if it processed the action
   */
  const setActionHandler = useCallback((handler) => {
    actionHandlerRef.current = handler;
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
    hostDisconnected,
    wasKicked,
    clientDisconnected,
    
    // Computed
    connectedPlayers: lobbyData?.players ? Object.values(lobbyData.players) : [],
    
    // Actions
    hostGame,
    joinGame,
    checkLobbyExists,
    getSlots,
    changeSlot,
    kickPlayerFromLobby,
    startMultiplayerGame,
    syncState,
    sendAction,
    disconnect,
    setDispatch,
    setActionHandler,
    updatePlayerConfig,
    setPlayerReady,
    getConnectedPlayers,
    clearError: () => setError(null),
    clearHostDisconnected: () => setHostDisconnected(false),
    clearWasKicked: () => setWasKicked(false),
    clearClientDisconnected: () => setClientDisconnected(false)
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
