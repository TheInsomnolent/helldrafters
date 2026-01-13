/**
 * Create a save state object from current game state
 * @param {Object} state - Current game state
 * @returns {Object} Serializable save state
 */
export const createSaveState = (state) => {
  return {
    phase: state.phase,
    gameConfig: state.gameConfig,
    currentDiff: state.currentDiff,
    requisition: state.requisition,
    lives: state.lives,
    samples: state.samples,
    burnedCards: state.burnedCards,
    players: state.players,
    draftState: state.draftState,
    eventsEnabled: state.eventsEnabled,
    currentEvent: state.currentEvent,
    eventPlayerChoice: state.eventPlayerChoice,
    seenEvents: state.seenEvents,
    customSetup: state.customSetup,
    selectedPlayer: state.selectedPlayer,
    exportedAt: new Date().toISOString()
  };
};

/**
 * Validate a loaded save state
 * @param {Object} state - The state object to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export const validateSaveState = (state) => {
  if (!state) {
    return { valid: false, error: 'Save state is null or undefined' };
  }

  if (!state.phase) {
    return { valid: false, error: 'Save state missing phase' };
  }

  if (!state.gameConfig) {
    return { valid: false, error: 'Save state missing gameConfig' };
  }

  if (!state.players) {
    return { valid: false, error: 'Save state missing players' };
  }

  return { valid: true, error: null };
};

/**
 * Export game state as a downloadable JSON file
 * @param {Object} state - Current game state
 */
export const exportGameStateToFile = (state) => {
  const saveState = createSaveState(state);
  const dataStr = JSON.stringify(saveState, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `helldrafters-save-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse and validate a save file
 * @param {File} file - The file to parse
 * @returns {Promise<Object>} Parsed and validated save state
 */
export const parseSaveFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result);
        const validation = validateSaveState(state);
        
        if (!validation.valid) {
          reject(new Error(validation.error));
          return;
        }
        
        resolve(state);
      } catch (error) {
        reject(new Error('Failed to parse save file. File may be corrupted.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Normalize loaded state to ensure all fields exist
 * @param {Object} loadedState - The loaded state
 * @returns {Object} Normalized state with defaults for missing fields
 */
export const normalizeLoadedState = (loadedState) => {
  return {
    phase: loadedState.phase,
    gameConfig: loadedState.gameConfig,
    currentDiff: loadedState.currentDiff || 1,
    requisition: loadedState.requisition || 0,
    lives: loadedState.lives || 3,
    samples: loadedState.samples || { common: 0, rare: 0, superRare: 0 },
    burnedCards: loadedState.burnedCards || [],
    players: loadedState.players || [],
    draftState: loadedState.draftState || {
      activePlayerIndex: 0,
      roundCards: [],
      isRerolling: false,
      pendingStratagem: null
    },
    eventsEnabled: loadedState.eventsEnabled !== undefined ? loadedState.eventsEnabled : true,
    currentEvent: loadedState.currentEvent || null,
    eventPlayerChoice: loadedState.eventPlayerChoice || null,
    seenEvents: loadedState.seenEvents || [],
    customSetup: loadedState.customSetup || { difficulty: 1, loadouts: [] },
    selectedPlayer: loadedState.selectedPlayer || 0
  };
};
