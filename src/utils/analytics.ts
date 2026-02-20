/**
 * Firebase Analytics utility for tracking user interactions and events
 *
 * This module provides a centralized way to track user behavior in the app.
 * All analytics calls are safe to use even if Firebase Analytics is not initialized.
 */

import { logEvent } from 'firebase/analytics'
import {
    getFirebaseAnalytics,
    isAnalyticsConsoleLogging,
    isAnalyticsDebugMode,
} from '../systems/multiplayer/firebaseConfig'

/**
 * Analytics event parameters type
 */
type EventParams = Record<string, string | number | boolean | undefined>

/**
 * Safely log an event to Firebase Analytics
 * @param eventName - Name of the event to log
 * @param eventParams - Parameters to include with the event
 */
export const trackEvent = (eventName: string, eventParams: EventParams = {}): void => {
    const analytics = getFirebaseAnalytics()

    // Log to console in development for debugging
    if (isAnalyticsConsoleLogging()) {
        // eslint-disable-next-line no-console
        console.log(`📊 Analytics Event: ${eventName}`, eventParams)
    }

    if (analytics) {
        try {
            // Add debug_mode parameter when in debug mode - this enables DebugView in Firebase Console
            const params = isAnalyticsDebugMode()
                ? { ...eventParams, debug_mode: true }
                : eventParams

            logEvent(analytics, eventName, params)
        } catch (error) {
            console.warn('Failed to log analytics event:', error)
        }
    } else if (isAnalyticsConsoleLogging()) {
        console.warn('⚠️ Analytics not initialized - event not sent to Firebase')
    }
}

/**
 * Track page/screen views
 * @param pageName - Name of the page/screen
 */
export const trackPageView = (pageName: string): void => {
    trackEvent('page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
    })
}

// Game-specific tracking functions

/**
 * Track game start
 * @param gameMode - solo or multiplayer
 * @param difficulty - Game difficulty level
 */
export const trackGameStart = (gameMode: string, difficulty: string | number): void => {
    trackEvent('game_start', {
        game_mode: gameMode,
        difficulty: String(difficulty),
    })
}

/**
 * Track game completion
 * @param gameMode - solo or multiplayer
 * @param missionsCompleted - Number of missions completed
 * @param gameTimeSeconds - Total game duration in seconds
 * @param victory - Whether the game was won
 */
export const trackGameEnd = (
    gameMode: string,
    missionsCompleted: number,
    gameTimeSeconds: number,
    victory: boolean,
): void => {
    trackEvent('game_end', {
        game_mode: gameMode,
        missions_completed: missionsCompleted,
        game_time_seconds: gameTimeSeconds,
        victory,
    })
}

/**
 * Track mission completion
 * @param missionNumber - Current mission number
 * @param difficulty - Mission difficulty
 * @param success - Whether mission was successful
 */
export const trackMissionComplete = (
    missionNumber: number,
    difficulty: string | number,
    success: boolean,
): void => {
    trackEvent('mission_complete', {
        mission_number: missionNumber,
        difficulty: String(difficulty),
        success,
    })
}

/**
 * Track draft selection
 * @param itemType - Type of item drafted (weapon, armor, etc.)
 * @param itemRarity - Rarity of the item
 * @param draftRound - Which draft round this was
 */
export const trackDraftSelection = (
    itemType: string,
    itemRarity: string,
    draftRound: number,
): void => {
    trackEvent('draft_selection', {
        item_type: itemType,
        item_rarity: itemRarity,
        draft_round: draftRound,
    })
}

/**
 * Track event selection (in-game events)
 * @param eventType - Type of event
 * @param choiceId - Which choice was selected
 */
export const trackEventChoice = (eventType: string, choiceId: string): void => {
    trackEvent('event_choice', {
        event_type: eventType,
        choice_id: choiceId,
    })
}

/**
 * Track multiplayer lobby actions
 * @param action - create_lobby, join_lobby, leave_lobby, start_game
 * @param playerCount - Number of players in lobby
 */
export const trackMultiplayerAction = (action: string, playerCount: number | null = null): void => {
    const params: EventParams = { action }
    if (playerCount !== null) {
        params.player_count = playerCount
    }
    trackEvent('multiplayer_action', params)
}

/**

/**
 * Track modal opens
 * @param modalName - Name of the modal
 */
export const trackModalOpen = (modalName: string): void => {
    trackEvent('modal_open', {
        modal_name: modalName,
    })
}
