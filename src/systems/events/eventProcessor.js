import { OUTCOME_TYPES } from './events';
import { MASTER_DB } from '../../data/itemsByWarbond';
import { TYPE, FACTION } from '../../constants/types';
import { STARTING_LOADOUT } from '../../constants/gameConfig';
import { getFirstEmptyStratagemSlot } from '../../utils/loadoutHelpers';

/**
 * Process a single event outcome and return state updates
 * @param {Object} outcome - The outcome object to process
 * @param {Object} choice - The choice that was made
 * @param {Object} state - Current game state
 * @param {Object} selections - User selections for stratagem/player choices
 * @returns {Object} State updates to apply
 */
export const processEventOutcome = (outcome, choice, state, selections = {}) => {
  const { players, eventPlayerChoice, requisition, lives, currentDiff, gameConfig, burnedCards } = state;
  const updates = {};

  switch (outcome.type) {
    case OUTCOME_TYPES.ADD_REQUISITION:
      updates.requisition = requisition + outcome.value;
      break;

    case OUTCOME_TYPES.SPEND_REQUISITION:
      updates.requisition = Math.max(0, requisition - outcome.value);
      break;

    case OUTCOME_TYPES.GAIN_LIFE:
      updates.lives = lives + outcome.value;
      break;

    case OUTCOME_TYPES.LOSE_LIFE:
      updates.lives = Math.max(0, lives - outcome.value);
      if (updates.lives === 0) {
        updates.triggerGameOver = true;
      }
      break;

    case OUTCOME_TYPES.CHANGE_FACTION:
      const currentFaction = gameConfig?.faction;
      const allFactions = Object.values(FACTION);
      const otherFactions = allFactions.filter(f => f !== currentFaction);
      const randomFaction = otherFactions[Math.floor(Math.random() * otherFactions.length)];
      updates.faction = randomFaction;
      break;

    case OUTCOME_TYPES.EXTRA_DRAFT:
      // Handled by caller - this is informational
      updates.extraDraftCards = outcome.value;
      break;

    case OUTCOME_TYPES.SKIP_DIFFICULTY:
      updates.currentDiff = Math.min(10, currentDiff + outcome.value);
      break;

    case OUTCOME_TYPES.REPLAY_DIFFICULTY:
      updates.currentDiff = Math.max(1, currentDiff - outcome.value);
      break;

    case OUTCOME_TYPES.SACRIFICE_ITEM:
      if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
        const newPlayers = [...players];
        const player = newPlayers[eventPlayerChoice];
        if (player.loadout.stratagems.length > 0) {
          player.loadout.stratagems.pop();
        }
        updates.players = newPlayers;
      }
      break;

    case OUTCOME_TYPES.GAIN_BOOSTER:
      // Generate booster draft instead of directly applying
      updates.needsBoosterSelection = true;
      updates.boosterDraft = generateBoosterDraft(players, gameConfig, state.burnedCards || []);
      updates.boosterOutcome = outcome;
      break;

    case OUTCOME_TYPES.LOSE_ALL_BUT_ONE_LIFE:
      updates.lives = 1;
      break;

    case OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER:
      updates.players = applyDuplicateStratagem(players, eventPlayerChoice, selections);
      break;

    case OUTCOME_TYPES.REDRAFT:
      updates.players = applyRedraft(players, eventPlayerChoice);
      updates.bonusRequisition = calculateRedraftBonus(players[eventPlayerChoice], outcome.value);
      break;

    case OUTCOME_TYPES.SWAP_STRATAGEM_WITH_PLAYER:
      updates.players = applySwapStratagem(players, eventPlayerChoice, selections);
      break;

    case OUTCOME_TYPES.RESTRICT_TO_SINGLE_WEAPON:
      if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
        const newPlayers = [...players];
        const player = newPlayers[eventPlayerChoice];
        
        // Clear all stratagems
        player.loadout.stratagems = [null, null, null, null];
        
        // Keep only one weapon: primary if they have it, otherwise secondary
        if (!player.loadout.primary) {
          player.loadout.primary = null;
        } else {
          player.loadout.secondary = null;
        }
        
        // Set restriction flag
        player.weaponRestricted = true;
        
        updates.players = newPlayers;
      }
      break;

    case OUTCOME_TYPES.REMOVE_ITEM:
      if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
        const newPlayers = [...players];
        const player = newPlayers[eventPlayerChoice];
        if (player.inventory.length > 0) {
          const randomIndex = Math.floor(Math.random() * player.inventory.length);
          const removedItem = player.inventory[randomIndex];
          player.inventory.splice(randomIndex, 1);
          
          // Remove from loadout if equipped
          Object.keys(player.loadout).forEach(slot => {
            if (player.loadout[slot] === removedItem) {
              player.loadout[slot] = null;
            } else if (Array.isArray(player.loadout[slot])) {
              const idx = player.loadout[slot].indexOf(removedItem);
              if (idx !== -1) player.loadout[slot][idx] = null;
            }
          });
        }
        updates.players = newPlayers;
      }
      break;

    default:
      break;
  }

  return updates;
};

/**
 * Process all outcomes from a choice
 * @param {Array} outcomes - Array of outcome objects
 * @param {Object} choice - The choice that was made
 * @param {Object} state - Current game state
 * @param {Object} selections - User selections {stratagemSelection, targetPlayerSelection, targetStratagemSelection}
 * @returns {Object} Combined state updates
 */
export const processAllOutcomes = (outcomes, choice, state, selections = {}) => {
  const allUpdates = {};

  // Spend requisition if the choice requires it
  if (choice && choice.requiresRequisition) {
    allUpdates.requisition = Math.max(0, state.requisition - choice.requiresRequisition);
  }

  outcomes.forEach(outcome => {
    const updates = processEventOutcome(outcome, choice, {
      ...state,
      ...allUpdates // Apply previous updates
    }, selections);
    Object.assign(allUpdates, updates);
  });

  return allUpdates;
};

/**
 * Generate a draft of boosters for selection
 * @param {Array} players - Array of player objects
 * @param {Object} gameConfig - Game configuration
 * @param {Array} burnedCards - Array of burned card IDs
 * @returns {Array} Array of 2 random booster IDs
 */
const generateBoosterDraft = (players = [], gameConfig = {}, burnedCards = []) => {
  let boosters = MASTER_DB.filter(item => item.type === TYPE.BOOSTER);
  if (boosters.length === 0) return [];
  
  // Filter out boosters that any player already has (globally unique)
  const existingBoosters = new Set();
  players.forEach(player => {
    if (player.loadout.booster) {
      existingBoosters.add(player.loadout.booster);
    }
  });
  boosters = boosters.filter(b => !existingBoosters.has(b.id));
  
  // Filter out burned cards if burn mode is enabled
  if (gameConfig.burnCards && burnedCards.length > 0) {
    boosters = boosters.filter(b => !burnedCards.includes(b.id));
  }
  
  if (boosters.length === 0) return [];
  
  // Shuffle and take 2
  const shuffled = [...boosters].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(2, shuffled.length)).map(b => b.id);
};

/**
 * Apply gain booster outcome with selection
 * @param {Array} players - Array of player objects
 * @param {Object} outcome - The outcome object
 * @param {number} eventPlayerChoice - The player index
 * @param {string} selectedBoosterId - The selected booster ID
 */
export const applyGainBoosterWithSelection = (players, outcome, eventPlayerChoice, selectedBoosterId) => {
  if (!selectedBoosterId) return players;

  if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
    const newPlayers = [...players];
    newPlayers[eventPlayerChoice].loadout.booster = selectedBoosterId;
    if (!newPlayers[eventPlayerChoice].inventory.includes(selectedBoosterId)) {
      newPlayers[eventPlayerChoice].inventory.push(selectedBoosterId);
    }
    return newPlayers;
  } else if (!outcome.targetPlayer || outcome.targetPlayer === 'all') {
    return players.map(p => ({
      ...p,
      loadout: { ...p.loadout, booster: selectedBoosterId },
      inventory: p.inventory.includes(selectedBoosterId) 
        ? p.inventory 
        : [...p.inventory, selectedBoosterId]
    }));
  }

  return players;
};

/**
 * Apply gain booster outcome (legacy - for random selection fallback)
 */
const applyGainBooster = (players, outcome, eventPlayerChoice) => {
  const boosters = MASTER_DB.filter(item => item.type === TYPE.BOOSTER);
  if (boosters.length === 0) return players;

  const randomBooster = boosters[Math.floor(Math.random() * boosters.length)];

  if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
    const newPlayers = [...players];
    newPlayers[eventPlayerChoice].loadout.booster = randomBooster.id;
    newPlayers[eventPlayerChoice].inventory.push(randomBooster.id);
    return newPlayers;
  } else if (!outcome.targetPlayer || outcome.targetPlayer === 'all') {
    return players.map(p => ({
      ...p,
      loadout: { ...p.loadout, booster: randomBooster.id },
      inventory: [...p.inventory, randomBooster.id]
    }));
  }

  return players;
};

/**
 * Apply duplicate stratagem outcome
 * @param {Array} players - Array of player objects
 * @param {number} eventPlayerChoice - The source player index
 * @param {Object} selections - User selections {stratagemSelection, targetPlayerSelection, targetStratagemSelection}
 */
const applyDuplicateStratagem = (players, eventPlayerChoice, selections = {}) => {
  if (players.length <= 1 || eventPlayerChoice === null) return players;

  const { stratagemSelection, targetPlayerSelection, targetStratagemSelection } = selections;

  // If we have selections, use them
  if (stratagemSelection && targetPlayerSelection !== null && targetPlayerSelection !== undefined) {
    const newPlayers = [...players];
    const { stratagemId } = stratagemSelection;
    
    // Check if we have a target stratagem selection (for overwrite)
    if (targetStratagemSelection) {
      // Overwrite the selected slot
      const { stratagemSlotIndex } = targetStratagemSelection;
      newPlayers[targetPlayerSelection].loadout.stratagems[stratagemSlotIndex] = stratagemId;
      if (!newPlayers[targetPlayerSelection].inventory.includes(stratagemId)) {
        newPlayers[targetPlayerSelection].inventory.push(stratagemId);
      }
    } else {
      // Find first empty slot and add there
      const emptySlot = getFirstEmptyStratagemSlot(newPlayers[targetPlayerSelection].loadout);
      if (emptySlot !== -1) {
        newPlayers[targetPlayerSelection].loadout.stratagems[emptySlot] = stratagemId;
        if (!newPlayers[targetPlayerSelection].inventory.includes(stratagemId)) {
          newPlayers[targetPlayerSelection].inventory.push(stratagemId);
        }
      }
    }

    return newPlayers;
  }

  // Fallback to random selection (old behavior)
  const sourcePlayer = players[eventPlayerChoice];
  const availableStratagems = sourcePlayer.loadout.stratagems.filter(s => s !== null);

  if (availableStratagems.length === 0) return players;

  const randomStratagem = availableStratagems[Math.floor(Math.random() * availableStratagems.length)];
  const otherPlayers = players.map((p, idx) => ({ player: p, idx })).filter((_, idx) => idx !== eventPlayerChoice);

  if (otherPlayers.length === 0) return players;

  const targetPlayerData = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
  const newPlayers = [...players];
  const emptySlot = getFirstEmptyStratagemSlot(newPlayers[targetPlayerData.idx].loadout);

  if (emptySlot !== -1) {
    newPlayers[targetPlayerData.idx].loadout.stratagems[emptySlot] = randomStratagem;
    newPlayers[targetPlayerData.idx].inventory.push(randomStratagem);
  }

  return newPlayers;
};

/**
 * Apply redraft outcome
 */
const applyRedraft = (players, eventPlayerChoice) => {
  if (eventPlayerChoice === null) return players;

  const player = players[eventPlayerChoice];
  const newPlayers = [...players];

  newPlayers[eventPlayerChoice] = {
    ...player,
    inventory: [STARTING_LOADOUT.secondary, STARTING_LOADOUT.grenade, STARTING_LOADOUT.armor].filter(id => id !== null),
    loadout: {
      primary: STARTING_LOADOUT.primary,
      secondary: STARTING_LOADOUT.secondary,
      grenade: STARTING_LOADOUT.grenade,
      armor: STARTING_LOADOUT.armor,
      booster: STARTING_LOADOUT.booster,
      stratagems: [...STARTING_LOADOUT.stratagems]
    }
  };

  return newPlayers;
};

/**
 * Calculate bonus requisition from redraft
 */
const calculateRedraftBonus = (player, divisionValue) => {
  if (!player) return 0;
  const discardedCount = player.inventory.length;
  return Math.ceil(discardedCount / (divisionValue || 1));
};

/**
 * Apply swap stratagem outcome
 * @param {Array} players - Array of player objects
 * @param {number} eventPlayerChoice - The source player index
 * @param {Object} selections - User selections {stratagemSelection, targetPlayerSelection, targetStratagemSelection}
 */
const applySwapStratagem = (players, eventPlayerChoice, selections = {}) => {
  if (players.length <= 1 || eventPlayerChoice === null) return players;

  const { stratagemSelection, targetPlayerSelection, targetStratagemSelection } = selections;

  // If we have all selections, use them
  if (stratagemSelection && targetPlayerSelection !== null && targetPlayerSelection !== undefined && targetStratagemSelection) {
    const newPlayers = [...players];
    const { stratagemSlotIndex } = stratagemSelection;
    const { stratagemSlotIndex: targetStratagemSlotIndex } = targetStratagemSelection;

    // Perform swap
    const temp = newPlayers[eventPlayerChoice].loadout.stratagems[stratagemSlotIndex];
    newPlayers[eventPlayerChoice].loadout.stratagems[stratagemSlotIndex] = 
      newPlayers[targetPlayerSelection].loadout.stratagems[targetStratagemSlotIndex];
    newPlayers[targetPlayerSelection].loadout.stratagems[targetStratagemSlotIndex] = temp;

    return newPlayers;
  }

  // If we have partial selections (old behavior for duplicate), use them
  if (stratagemSelection && targetPlayerSelection !== null && targetPlayerSelection !== undefined) {
    const newPlayers = [...players];
    const { stratagemSlotIndex, stratagemId } = stratagemSelection;
    
    // Find target player's stratagem to swap (first non-null stratagem)
    const targetStratagems = newPlayers[targetPlayerSelection].loadout.stratagems
      .map((s, idx) => ({ stratagem: s, idx }))
      .filter(s => s.stratagem !== null);

    if (targetStratagems.length === 0) return players;

    // Use first available stratagem from target player
    const targetStratData = targetStratagems[0];

    // Perform swap
    const temp = newPlayers[eventPlayerChoice].loadout.stratagems[stratagemSlotIndex];
    newPlayers[eventPlayerChoice].loadout.stratagems[stratagemSlotIndex] = 
      newPlayers[targetPlayerSelection].loadout.stratagems[targetStratData.idx];
    newPlayers[targetPlayerSelection].loadout.stratagems[targetStratData.idx] = temp;

    return newPlayers;
  }

  // Fallback to random selection (old behavior)
  const sourcePlayer = players[eventPlayerChoice];
  const availableStratagems = sourcePlayer.loadout.stratagems
    .map((s, idx) => ({ stratagem: s, idx }))
    .filter(s => s.stratagem !== null);

  if (availableStratagems.length === 0) return players;

  const otherPlayers = players.map((p, idx) => ({ player: p, idx })).filter((_, idx) => idx !== eventPlayerChoice);
  if (otherPlayers.length === 0) return players;

  const targetPlayerData = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
  const targetStratagems = targetPlayerData.player.loadout.stratagems
    .map((s, idx) => ({ stratagem: s, idx }))
    .filter(s => s.stratagem !== null);

  if (targetStratagems.length === 0) return players;

  // Pick random stratagems to swap
  const sourceStratData = availableStratagems[Math.floor(Math.random() * availableStratagems.length)];
  const targetStratData = targetStratagems[Math.floor(Math.random() * targetStratagems.length)];

  const newPlayers = [...players];
  const temp = newPlayers[eventPlayerChoice].loadout.stratagems[sourceStratData.idx];
  newPlayers[eventPlayerChoice].loadout.stratagems[sourceStratData.idx] = 
    newPlayers[targetPlayerData.idx].loadout.stratagems[targetStratData.idx];
  newPlayers[targetPlayerData.idx].loadout.stratagems[targetStratData.idx] = temp;

  return newPlayers;
};

/**
 * Check if a choice can be afforded
 * @param {Object} choice - The choice object
 * @param {number} requisition - Current requisition amount
 * @returns {boolean} True if choice can be afforded
 */
export const canAffordChoice = (choice, requisition) => {
  if (choice.requiresRequisition && requisition < choice.requiresRequisition) {
    return false;
  }
  return true;
};

/**
 * Format a single outcome for display
 * @param {Object} outcome - The outcome to format
 * @returns {string} Formatted outcome text
 */
export const formatOutcome = (outcome) => {
  switch (outcome.type) {
    case OUTCOME_TYPES.ADD_REQUISITION:
      return `+${outcome.value} Requisition`;
    case OUTCOME_TYPES.SPEND_REQUISITION:
      return `-${outcome.value} Requisition`;
    case OUTCOME_TYPES.GAIN_LIFE:
      return `+${outcome.value} Life`;
    case OUTCOME_TYPES.LOSE_LIFE:
      return `-${outcome.value} Life`;
    case OUTCOME_TYPES.LOSE_ALL_BUT_ONE_LIFE:
      return `Lives reduced to 1`;
    case OUTCOME_TYPES.CHANGE_FACTION:
      return `Switch to different theater`;
    case OUTCOME_TYPES.EXTRA_DRAFT:
      return `Draft ${outcome.value} extra card${outcome.value > 1 ? 's' : ''}`;
    case OUTCOME_TYPES.SKIP_DIFFICULTY:
      return `Skip ${outcome.value} difficulty level${outcome.value > 1 ? 's' : ''}`;
    case OUTCOME_TYPES.REPLAY_DIFFICULTY:
      return `Replay current difficulty`;
    case OUTCOME_TYPES.SACRIFICE_ITEM:
      return `Remove a ${outcome.value}`;
    case OUTCOME_TYPES.GAIN_BOOSTER:
      const target = outcome.targetPlayer === 'all' ? '(All Helldivers)' : '';
      return `Gain random Booster ${target}`;
    case OUTCOME_TYPES.REMOVE_ITEM:
      return `Remove an item`;
    case OUTCOME_TYPES.GAIN_SPECIFIC_ITEM:
      return `Gain specific item`;
    case OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER:
      return `Copy stratagem to another Helldiver`;
    case OUTCOME_TYPES.SWAP_STRATAGEM_WITH_PLAYER:
      return `Swap stratagem with another Helldiver`;
    case OUTCOME_TYPES.RESTRICT_TO_SINGLE_WEAPON:
      return `Use only 1 weapon next mission (no stratagems)`;
    case OUTCOME_TYPES.REDRAFT:
      return `Redraft: Discard all items, draft ${outcome.value ? Math.ceil(1 / outcome.value) : 1}x per discarded`;
    default:
      return '';
  }
};

/**
 * Format multiple outcomes for display
 * @param {Array} outcomes - Array of outcome objects
 * @returns {string} Formatted outcomes text
 */
export const formatOutcomes = (outcomes) => {
  if (!outcomes || outcomes.length === 0) return 'No effect';
  return outcomes.map(formatOutcome).filter(o => o).join(', ');
};

/**
 * Check if an event needs player choice
 * @param {Object} event - The event object
 * @returns {boolean} True if player choice is needed
 */
export const needsPlayerChoice = (event) => {
  return event.targetPlayer === 'single' && 
    event.choices && 
    event.choices.some(c => c.outcomes.some(o => o.targetPlayer === 'choose'));
};

/**
 * Check if an outcome requires stratagem/player selection dialogue
 * @param {Object} outcome - The outcome object
 * @returns {boolean} True if selection dialogue is needed
 */
export const needsSelectionDialogue = (outcome) => {
  return outcome.type === OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER ||
         outcome.type === OUTCOME_TYPES.SWAP_STRATAGEM_WITH_PLAYER;
};
