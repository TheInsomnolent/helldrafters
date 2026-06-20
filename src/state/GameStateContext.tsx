/**
 * GameStateContext
 *
 * Provides a single shared game state reducer across the entire app.
 * Without this, each screen would create its own private `useReducer`,
 * leaving them disconnected from the central game state.
 */

import { createContext, useContext, useReducer } from 'react'
import { gameReducer, initialState, type GameAction } from './gameReducer'
import type { GameState } from '../types'

interface GameStateContextValue {
    state: GameState
    dispatch: React.Dispatch<GameAction>
}

const GameStateContext = createContext<GameStateContextValue | null>(null)

export const GameStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState)

    return (
        <GameStateContext.Provider value={{ state, dispatch }}>
            {children}
        </GameStateContext.Provider>
    )
}

export const useGameState = (): GameStateContextValue => {
    const context = useContext(GameStateContext)
    if (!context) {
        throw new Error('useGameState must be used within a GameStateProvider')
    }
    return context
}
