import { OUTCOME_TYPES } from '../../events';
import { MASTER_DB } from '../../data/items';
import { TYPE } from '../../constants/types';
import { STARTING_LOADOUT } from '../../constants/gameConfig';
import { getFirstEmptyStratagemSlot } from '../../utils/loadoutHelpers';

/**
 * Process a single event outcome and return state updates
 * @param {Object} outcome - The outcome object to process
 * @param {Object} choice - The choice that was made
 * @param {Object} state - Current game state
 * @returns {Object} State updates to apply
 */
export const processEventOutcome = (outcome, choice, state) => {
  const { players, eventPlayerChoice, requisition, lives, currentDiff } = state;
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
      updates.faction = outcome.value;
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
      updates.players = applyGainBooster(players, outcome, eventPlayerChoice);
      break;

    case OUTCOME_TYPES.LOSE_ALL_BUT_ONE_LIFE:
      updates.lives = 1;
      break;

    case OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER:
      updates.players = applyDuplicateStratagem(players, eventPlayerChoice);
      break;

    case OUTCOME_TYPES.REDRAFT:
      updates.players = applyRedraft(players, eventPlayerChoice);
      updates.bonusRequisition = calculateRedraftBonus(players[eventPlayerChoice], outcome.value);
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
 * @returns {Object} Combined state updates
 */
export const processAllOutcomes = (outcomes, choice, state) => {
  const allUpdates = {};

  outcomes.forEach(outcome => {
    const updates = processEventOutcome(outcome, choice, {
      ...state,
      ...allUpdates // Apply previous updates
    });
    Object.assign(allUpdates, updates);
  });

  return allUpdates;
};

/**
 * Apply gain booster outcome
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
 */
const applyDuplicateStratagem = (players, eventPlayerChoice) => {
  if (players.length <= 1 || eventPlayerChoice === null) return players;

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
      return `Switch to ${outcome.value}`;
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
