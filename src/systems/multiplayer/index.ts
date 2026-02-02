/**
 * Multiplayer module index - exports all multiplayer functionality
 */

export {
    initializeFirebase,
    initializeAnalytics,
    isFirebaseConfigured,
    getFirebaseDatabase,
    getFirebaseAnalytics,
    isAnalyticsDebugMode,
    isAnalyticsConsoleLogging,
} from './firebaseConfig'

export {
    generateLobbyId,
    createLobby,
    checkLobby,
    joinLobby,
    leaveLobby,
    kickPlayer,
    kickAllPlayers,
    closeLobby,
    updateLobbyStatus,
    changePlayerSlot,
    subscribeLobby,
    getAvailableSlots,
    updatePlayerConfig,
    setPlayerReady,
} from './lobbyManager'

export type { LobbyData, LobbyPlayer, LobbyInfo, JoinResult, PlayerConfig } from './lobbyManager'

export {
    CLIENT_ALLOWED_ACTIONS,
    isActionAllowedForClient,
    syncGameState,
    subscribeGameState,
    sendClientAction,
    subscribeClientActions,
    removeClientAction,
} from './syncManager'

export type { ClientAction, ActionData } from './syncManager'

export { MultiplayerProvider, useMultiplayer } from './MultiplayerContext'

export type { MultiplayerContextValue } from './MultiplayerContext'
