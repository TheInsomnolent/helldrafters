/**
 * useGamePersistence Hook
 *
 * Custom hook for handling game save/load functionality.
 * Provides utilities for exporting and importing game state.
 */

import { useCallback, useRef } from 'react'
import {
    exportGameStateToFile,
    normalizeLoadedState,
    parseSaveFile,
} from '../systems/persistence/saveManager'
import * as runAnalytics from '../state/analyticsStore'
import type { GameState, GameConfig } from '../types'
import type { GameAction } from '../state/gameReducer'

interface UseGamePersistenceOptions {
    state: GameState
    dispatch: React.Dispatch<GameAction>
    firebaseReady?: boolean
    hostGame?: (hostName: string, gameConfig: GameConfig) => Promise<string | null>
    startMultiplayerGame?: (lobbyId: string, isHost: boolean) => Promise<void>
    syncState?: (state: Partial<GameState>) => Promise<void>
    setSelectedPlayer?: (index: number) => void
    setGameStartTime?: (time: number) => void
    loadGameStateAction: (state: Partial<GameState>) => GameAction
}

interface UseGamePersistenceReturn {
    exportGameState: () => void
    importGameState: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    triggerFileInput: () => void
    fileInputRef: React.RefObject<HTMLInputElement | null>
}

/**
 * Hook for managing game persistence (save/load functionality)
 */
export const useGamePersistence = ({
    state,
    dispatch,
    firebaseReady = false,
    hostGame,
    startMultiplayerGame,
    syncState,
    setSelectedPlayer,
    setGameStartTime,
    loadGameStateAction,
}: UseGamePersistenceOptions): UseGamePersistenceReturn => {
    const fileInputRef = useRef<HTMLInputElement>(null)

    /**
     * Export the current game state to a JSON file
     */
    const exportGameState = useCallback(() => {
        exportGameStateToFile(state)
    }, [state])

    /**
     * Trigger the hidden file input for importing saves
     */
    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    /**
     * Import game state from a JSON file
     */
    const importGameState = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            if (!file) return

            try {
                const loadedState = await parseSaveFile(file)
                const normalizedState = normalizeLoadedState(loadedState)

                // Check if this is a multiplayer game (more than 1 player)
                const isMultiplayerGame = normalizedState.gameConfig?.playerCount > 1

                if (
                    isMultiplayerGame &&
                    firebaseReady &&
                    hostGame &&
                    startMultiplayerGame &&
                    syncState
                ) {
                    // Create a multiplayer lobby for loaded multiplayer game
                    const hostName = prompt('Enter your name for multiplayer:', 'Host') || 'Host'
                    const newLobbyId = await hostGame(hostName, normalizedState.gameConfig)

                    if (newLobbyId) {
                        // Start the multiplayer game
                        await startMultiplayerGame(newLobbyId, true)

                        // Load the game state
                        dispatch(loadGameStateAction(normalizedState))
                        setSelectedPlayer?.(normalizedState.selectedPlayer || 0)

                        // Initialize analytics for loaded game
                        runAnalytics.initializeAnalytics(
                            normalizedState.gameConfig,
                            normalizedState.players,
                        )
                        setGameStartTime?.(Date.now())

                        // Sync the loaded state to all clients
                        await syncState(normalizedState)

                        alert(
                            `Multiplayer game loaded! Share this lobby ID with other players:\n${newLobbyId}\n\nOther players can join mid-game.`,
                        )
                    } else {
                        alert('Failed to create multiplayer lobby. Loading as solo game instead.')
                        // Fall back to solo loading
                        dispatch(loadGameStateAction(normalizedState))
                        setSelectedPlayer?.(normalizedState.selectedPlayer || 0)

                        // Initialize analytics for loaded game
                        runAnalytics.initializeAnalytics(
                            normalizedState.gameConfig,
                            normalizedState.players,
                        )
                        setGameStartTime?.(Date.now())
                    }
                } else {
                    // Single player game or Firebase not ready - load normally
                    dispatch(loadGameStateAction(normalizedState))
                    setSelectedPlayer?.(normalizedState.selectedPlayer || 0)

                    // Initialize analytics for loaded game
                    runAnalytics.initializeAnalytics(
                        normalizedState.gameConfig,
                        normalizedState.players,
                    )
                    setGameStartTime?.(Date.now())

                    if (isMultiplayerGame && !firebaseReady) {
                        alert(
                            'Game loaded successfully!\n\nNote: This is a multiplayer save but Firebase is not configured. Loading as solo game.',
                        )
                    } else {
                        alert('Game loaded successfully!')
                    }
                }
            } catch (error) {
                console.error('Failed to load game:', error)
                alert(
                    (error instanceof Error ? error.message : String(error)) ||
                        'Failed to load save file. File may be corrupted.',
                )
            }

            // Reset input
            event.target.value = ''
        },
        [
            dispatch,
            firebaseReady,
            hostGame,
            startMultiplayerGame,
            syncState,
            setSelectedPlayer,
            setGameStartTime,
            loadGameStateAction,
        ],
    )

    return {
        exportGameState,
        importGameState,
        triggerFileInput,
        fileInputRef,
    }
}
