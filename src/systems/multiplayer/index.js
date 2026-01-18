/**
 * Multiplayer module index - exports all multiplayer functionality
 */

export { 
  initializeFirebase, 
  isFirebaseConfigured, 
  getFirebaseDatabase 
} from './firebaseConfig';

export {
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
  updatePlayerConfig,
  setPlayerReady
} from './lobbyManager';

export {
  CLIENT_ALLOWED_ACTIONS,
  isActionAllowedForClient,
  syncGameState,
  subscribeGameState,
  sendClientAction,
  subscribeClientActions,
  removeClientAction,
  clearAllClientActions,
  getGameState,
  createMultiplayerDispatch
} from './syncManager';

export {
  MultiplayerProvider,
  useMultiplayer,
  useMultiplayerDispatch
} from './MultiplayerContext';
