/**
 * Firebase Analytics utility for tracking user interactions and events
 * 
 * This module provides a centralized way to track user behavior in the app.
 * All analytics calls are safe to use even if Firebase Analytics is not initialized.
 */

import { logEvent, setUserProperties } from 'firebase/analytics';
import { getFirebaseAnalytics } from '../systems/multiplayer/firebaseConfig';

/**
 * Safely log an event to Firebase Analytics
 * @param {string} eventName - Name of the event to log
 * @param {object} eventParams - Parameters to include with the event
 */
export const trackEvent = (eventName, eventParams = {}) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    try {
      logEvent(analytics, eventName, eventParams);
    } catch (error) {
      console.warn('Failed to log analytics event:', error);
    }
  }
};

/**
 * Track page/screen views
 * @param {string} pageName - Name of the page/screen
 */
export const trackPageView = (pageName) => {
  trackEvent('page_view', {
    page_title: pageName,
    page_location: window.location.href,
    page_path: window.location.pathname
  });
};

/**
 * Set user properties for analytics segmentation
 * @param {object} properties - User properties to set
 */
export const setAnalyticsUserProperties = (properties) => {
  const analytics = getFirebaseAnalytics();
  if (analytics) {
    try {
      setUserProperties(analytics, properties);
    } catch (error) {
      console.warn('Failed to set user properties:', error);
    }
  }
};

// Game-specific tracking functions

/**
 * Track game start
 * @param {string} gameMode - solo or multiplayer
 * @param {string} difficulty - Game difficulty level
 */
export const trackGameStart = (gameMode, difficulty) => {
  trackEvent('game_start', {
    game_mode: gameMode,
    difficulty: difficulty
  });
};

/**
 * Track game completion
 * @param {string} gameMode - solo or multiplayer
 * @param {number} missionsCompleted - Number of missions completed
 * @param {number} gameTimeSeconds - Total game duration in seconds
 * @param {boolean} victory - Whether the game was won
 */
export const trackGameEnd = (gameMode, missionsCompleted, gameTimeSeconds, victory) => {
  trackEvent('game_end', {
    game_mode: gameMode,
    missions_completed: missionsCompleted,
    game_time_seconds: gameTimeSeconds,
    victory: victory
  });
};

/**
 * Track mission completion
 * @param {number} missionNumber - Current mission number
 * @param {string} difficulty - Mission difficulty
 * @param {boolean} success - Whether mission was successful
 */
export const trackMissionComplete = (missionNumber, difficulty, success) => {
  trackEvent('mission_complete', {
    mission_number: missionNumber,
    difficulty: difficulty,
    success: success
  });
};

/**
 * Track draft selection
 * @param {string} itemType - Type of item drafted (weapon, armor, etc.)
 * @param {string} itemRarity - Rarity of the item
 * @param {number} draftRound - Which draft round this was
 */
export const trackDraftSelection = (itemType, itemRarity, draftRound) => {
  trackEvent('draft_selection', {
    item_type: itemType,
    item_rarity: itemRarity,
    draft_round: draftRound
  });
};

/**
 * Track event selection (in-game events)
 * @param {string} eventType - Type of event
 * @param {string} choiceId - Which choice was selected
 */
export const trackEventChoice = (eventType, choiceId) => {
  trackEvent('event_choice', {
    event_type: eventType,
    choice_id: choiceId
  });
};

/**
 * Track multiplayer lobby actions
 * @param {string} action - create_lobby, join_lobby, leave_lobby, start_game
 * @param {number} playerCount - Number of players in lobby
 */
export const trackMultiplayerAction = (action, playerCount = null) => {
  const params = { action: action };
  if (playerCount !== null) {
    params.player_count = playerCount;
  }
  trackEvent('multiplayer_action', params);
};

/**
 * Track errors
 * @param {string} errorType - Type of error
 * @param {string} errorMessage - Error message
 * @param {string} context - Where the error occurred
 */
export const trackError = (errorType, errorMessage, context) => {
  trackEvent('app_error', {
    error_type: errorType,
    error_message: errorMessage,
    context: context
  });
};

/**
 * Track modal opens
 * @param {string} modalName - Name of the modal
 */
export const trackModalOpen = (modalName) => {
  trackEvent('modal_open', {
    modal_name: modalName
  });
};

/**
 * Track settings changes
 * @param {string} setting - Setting that was changed
 * @param {any} value - New value
 */
export const trackSettingChange = (setting, value) => {
  trackEvent('setting_change', {
    setting: setting,
    value: String(value)
  });
};

/**
 * Track loadout actions
 * @param {string} action - equip, unequip, swap
 * @param {string} itemType - Type of item
 */
export const trackLoadoutAction = (action, itemType) => {
  trackEvent('loadout_action', {
    action: action,
    item_type: itemType
  });
};
