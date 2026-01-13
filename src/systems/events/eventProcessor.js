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
      // Store extra draft cards in the player who will benefit
      if (eventPlayerChoice !== null) {
        const newPlayers = [...players];
        const player = newPlayers[eventPlayerChoice];
        player.extraDraftCards = (player.extraDraftCards || 0) + outcome.value;
        updates.players = newPlayers;
      }
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
      // Get list of items being liquidated
      const liquidatedItems = getLiquidatedItems(players[eventPlayerChoice]);
      updates.liquidatedItems = liquidatedItems;
      
      if (liquidatedItems.length > 0) {
        // Calculate number of drafts based on liquidated items
        const draftCount = Math.ceil(liquidatedItems.length / (outcome.value || 1));
        
        // Calculate bonus requisition from items being discarded
        updates.bonusRequisition = calculateRedraftBonus(players[eventPlayerChoice], outcome.value);
        
        // Signal that we need to immediately start a redraft for this player
        updates.needsRedraft = true;
        updates.redraftPlayerIndex = eventPlayerChoice;
        updates.redraftCount = draftCount;
        
        // Reset player's inventory and loadout, and store draft count
        const newPlayers = applyRedraft(players, eventPlayerChoice);
        // Store the number of redrafts in the player object
        newPlayers[eventPlayerChoice].redraftRounds = draftCount;
        updates.players = newPlayers;
      }
      break;

    case OUTCOME_TYPES.SWAP_STRATAGEM_WITH_PLAYER:
      updates.players = applySwapStratagem(players, eventPlayerChoice, selections);
      break;

    case OUTCOME_TYPES.RESTRICT_TO_SINGLE_WEAPON:
      if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
        const newPlayers = [...players];
        const player = newPlayers[eventPlayerChoice];
        
        // Save current stratagems for restoration after mission
        player.savedStratagems = [...player.loadout.stratagems];
        
        // Clear all stratagems temporarily
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
        
        // Collect removable items (primary, secondary, grenade, stratagems - not armor or booster)
        const removableItems = [];
        
        if (player.loadout.primary) {
          removableItems.push({ type: 'primary', id: player.loadout.primary, slot: 'primary' });
        }
        if (player.loadout.secondary) {
          removableItems.push({ type: 'secondary', id: player.loadout.secondary, slot: 'secondary' });
        }
        if (player.loadout.grenade) {
          removableItems.push({ type: 'grenade', id: player.loadout.grenade, slot: 'grenade' });
        }
        player.loadout.stratagems.forEach((stratagemId, index) => {
          if (stratagemId) {
            removableItems.push({ type: 'stratagem', id: stratagemId, slot: index });
          }
        });
        
        if (removableItems.length > 0) {
          // Randomly select one to remove
          const randomIndex = Math.floor(Math.random() * removableItems.length);
          const itemToRemove = removableItems[randomIndex];
          
          // Get item name for display
          const item = MASTER_DB.find(i => i.id === itemToRemove.id);
          updates.removedItemName = item ? item.name : 'Unknown Item';
          updates.removedItemType = itemToRemove.type;
          
          // Remove from loadout
          if (itemToRemove.type === 'stratagem') {
            player.loadout.stratagems[itemToRemove.slot] = null;
          } else {
            player.loadout[itemToRemove.slot] = null;
          }
          
          // Remove from inventory
          const invIndex = player.inventory.indexOf(itemToRemove.id);
          if (invIndex !== -1) {
            player.inventory.splice(invIndex, 1);
          }
          
          // Ensure loadout remains valid after removal
          const validated = ensureValidLoadout(player.loadout, player.inventory);
          player.loadout = validated.loadout;
          player.inventory = validated.inventory;
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
 * Ensure loadout has required fallback equipment
 * - If no armor → default to B-01 Tactical
 * - If no primary AND no secondary → default to P-2 Peacemaker
 * - Primaries, grenades, stratagems can be empty
 * - Secondaries can be empty if primary exists
 */
const ensureValidLoadout = (loadout, inventory) => {
  const validLoadout = { ...loadout };
  const validInventory = [...inventory];

  // If no armor, default to B-01 Tactical
  if (!validLoadout.armor) {
    validLoadout.armor = 'a_b01';
    if (!validInventory.includes('a_b01')) {
      validInventory.push('a_b01');
    }
  }

  // If no primary AND no secondary, default to P-2 Peacemaker
  if (!validLoadout.primary && !validLoadout.secondary) {
    validLoadout.secondary = 's_peacemaker';
    if (!validInventory.includes('s_peacemaker')) {
      validInventory.push('s_peacemaker');
    }
  }

  return { loadout: validLoadout, inventory: validInventory };
};

/**
 * Get list of items being liquidated during redraft
 */
const getLiquidatedItems = (player) => {
  if (!player) return [];
  
  const items = [];
  
  // Collect all non-default loadout items
  if (player.loadout.primary && player.loadout.primary !== STARTING_LOADOUT.primary) {
    const item = MASTER_DB.find(i => i.id === player.loadout.primary);
    if (item) items.push(item.name);
  }
  
  // Secondary is only liquidated if it's not the default peacemaker
  if (player.loadout.secondary && player.loadout.secondary !== STARTING_LOADOUT.secondary) {
    const item = MASTER_DB.find(i => i.id === player.loadout.secondary);
    if (item) items.push(item.name);
  }
  
  // Grenade is only liquidated if it's not the default HE grenade
  if (player.loadout.grenade && player.loadout.grenade !== STARTING_LOADOUT.grenade) {
    const item = MASTER_DB.find(i => i.id === player.loadout.grenade);
    if (item) items.push(item.name);
  }
  
  // Armor is only liquidated if it's not the default B-01
  if (player.loadout.armor && player.loadout.armor !== STARTING_LOADOUT.armor) {
    const item = MASTER_DB.find(i => i.id === player.loadout.armor);
    if (item) items.push(item.name);
  }
  
  // Booster
  if (player.loadout.booster) {
    const item = MASTER_DB.find(i => i.id === player.loadout.booster);
    if (item) items.push(item.name);
  }
  
  // Stratagems
  player.loadout.stratagems.forEach(stratagemId => {
    if (stratagemId) {
      const item = MASTER_DB.find(i => i.id === stratagemId);
      if (item) items.push(item.name);
    }
  });
  
  // Inventory items (excluding those already in loadout)
  player.inventory.forEach(itemId => {
    // Skip if already in loadout or is a default item
    const alreadyInLoadout = 
      itemId === player.loadout.primary ||
      itemId === player.loadout.secondary ||
      itemId === player.loadout.grenade ||
      itemId === player.loadout.armor ||
      itemId === player.loadout.booster ||
      player.loadout.stratagems.includes(itemId);
    
    if (!alreadyInLoadout) {
      const item = MASTER_DB.find(i => i.id === itemId);
      if (item) items.push(item.name);
    }
  });
  
  return items;
};

/**
 * Apply redraft outcome
 */
const applyRedraft = (players, eventPlayerChoice) => {
  if (eventPlayerChoice === null) return players;

  const player = players[eventPlayerChoice];
  const newPlayers = [...players];

  const baseLoadout = {
    primary: STARTING_LOADOUT.primary,
    secondary: STARTING_LOADOUT.secondary,
    grenade: STARTING_LOADOUT.grenade,
    armor: STARTING_LOADOUT.armor,
    booster: STARTING_LOADOUT.booster,
    stratagems: [...STARTING_LOADOUT.stratagems]
  };

  const baseInventory = [STARTING_LOADOUT.secondary, STARTING_LOADOUT.grenade, STARTING_LOADOUT.armor].filter(id => id !== null);

  const { loadout, inventory } = ensureValidLoadout(baseLoadout, baseInventory);

  newPlayers[eventPlayerChoice] = {
    ...player,
    inventory,
    loadout
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
 * @param {Array} players - Array of player objects
 * @param {number} eventPlayerChoice - Currently selected player index
 * @returns {boolean} True if choice can be afforded
 */
export const canAffordChoice = (choice, requisition, players = null, eventPlayerChoice = null) => {
  if (choice.requiresRequisition && requisition < choice.requiresRequisition) {
    return false;
  }
  
  // Check if REDRAFT choice has items to sacrifice
  if (choice.outcomes && choice.outcomes.some(o => o.type === OUTCOME_TYPES.REDRAFT)) {
    if (players && eventPlayerChoice !== null && players[eventPlayerChoice]) {
      const liquidatedItems = getLiquidatedItems(players[eventPlayerChoice]);
      if (liquidatedItems.length === 0) {
        return false;
      }
    }
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
