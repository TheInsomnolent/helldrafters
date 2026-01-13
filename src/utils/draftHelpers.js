import { getItemById, anyItemHasTag } from './itemHelpers';
import { RARITY, TAGS, TYPE, FACTION } from '../constants/types';
import { MASTER_DB } from '../data/items';

/**
 * Calculate draft hand size based on mission star rating
 * @param {number} starRating - Mission star rating (1-6)
 * @returns {number} Number of cards to show (2-4)
 */
export const getDraftHandSize = (starRating) => {
  if (starRating <= 2) return 2;
  if (starRating <= 4) return 3;
  return 4;
};

/**
 * Get weighted pool of available items for a player
 * @param {Object} player - Player object with inventory and loadout
 * @param {number} difficulty - Current difficulty level
 * @param {Object} gameConfig - Game configuration
 * @param {string[]} burnedCards - Array of burned card IDs
 * @param {Object[]} allPlayers - All players (for global uniqueness)
 * @returns {Object[]} Array of {item, weight} objects
 */
export const getWeightedPool = (player, difficulty, gameConfig, burnedCards = [], allPlayers = []) => {
  // 1. Filter out already owned items and boosters (boosters only come from events)
  let candidates = MASTER_DB.filter(item => 
    !player.inventory.includes(item.id) && item.type !== TYPE.BOOSTER
  );

  // 2. Filter out burned cards (if burn mode enabled)
  if (gameConfig.burnCards) {
    candidates = candidates.filter(item => !burnedCards.includes(item.id));
  }

  // 3. Filter by global uniqueness (if enabled)
  if (gameConfig.globalUniqueness) {
    const allPlayerInventories = allPlayers.flatMap(p => p.inventory);
    candidates = candidates.filter(item => !allPlayerInventories.includes(item.id));
  }

  // 4. Faction Weighting
  const weightedCandidates = candidates.map(item => {
    let weight = 10; // Base weight

    // Rarity Weights
    if (item.rarity === RARITY.COMMON) weight += 50;
    if (item.rarity === RARITY.UNCOMMON) weight += 25;
    if (item.rarity === RARITY.RARE) weight += 5;

    // Faction Synergy
    if (gameConfig.faction === FACTION.BUGS && item.tags.includes(TAGS.FIRE)) weight += 30;
    if (gameConfig.faction === FACTION.BOTS && item.tags.includes(TAGS.PRECISION)) weight += 20;
    if (gameConfig.faction === FACTION.SQUIDS && item.tags.includes(TAGS.STUN)) weight += 20;

    // Smart Logic: Need Anti-Tank?
    const playerHasAT = anyItemHasTag(player.inventory, TAGS.AT);

    // CRITICAL SOFT-LOCK PREVENTION
    // If we are approaching Diff 4+ and have no AT, massively boost AT weights
    if (difficulty >= 3 && !playerHasAT && item.tags.includes(TAGS.AT)) {
      weight += 500;
    }

    // Smart Logic: Composition Balance
    // If player has a secondary, reduce weight of secondaries heavily
    if (player.loadout.secondary && item.type === TYPE.SECONDARY) {
      weight = Math.max(1, weight - 40);
    }

    // If player has backpack, reduce backpack weight
    const hasBackpack = player.loadout.stratagems.some(sId => {
      const s = getItemById(sId);
      return s && s.tags.includes(TAGS.BACKPACK);
    });
    if (hasBackpack && item.tags.includes(TAGS.BACKPACK)) {
      weight = 0; // Hard lock: Only 1 backpack usually allowed/needed
    }

    return { item, weight };
  });

  return weightedCandidates.filter(c => c.weight > 0);
};

/**
 * Generate a draft hand for a player
 * @param {Object} player - Player object
 * @param {number} difficulty - Current difficulty level
 * @param {Object} gameConfig - Game configuration
 * @param {string[]} burnedCards - Array of burned card IDs
 * @param {Object[]} allPlayers - All players
 * @param {Function} onBurnCard - Callback when a card is burned (optional)
 * @returns {Object[]} Array of item objects for the draft hand
 */
export const generateDraftHand = (
  player,
  difficulty,
  gameConfig,
  burnedCards = [],
  allPlayers = [],
  onBurnCard = null
) => {
  if (!player) {
    console.warn('Player not found for draft generation');
    return [];
  }

  const pool = getWeightedPool(player, difficulty, gameConfig, burnedCards, allPlayers);
  const handSize = getDraftHandSize(gameConfig.starRating);

  const hand = [];
  for (let i = 0; i < handSize; i++) {
    if (pool.length === 0) break;

    const totalWeight = pool.reduce((sum, c) => sum + c.weight, 0);

    // Safety check: if total weight is 0, we can't select anything
    if (totalWeight === 0) {
      console.warn('Pool has no valid weighted items');
      break;
    }

    let randomNum = Math.random() * totalWeight;

    for (let j = 0; j < pool.length; j++) {
      const poolItem = pool[j];
      
      // Safety check: ensure pool item exists and has valid structure
      if (!poolItem || !poolItem.item) {
        console.warn('Invalid pool item at index', j);
        continue;
      }

      randomNum -= poolItem.weight;
      if (randomNum <= 0) {
        hand.push(poolItem.item);
        
        // Burn card if enabled
        if (gameConfig.burnCards && onBurnCard) {
          onBurnCard(poolItem.item.id);
        }
        
        // Remove from pool to avoid duplicates in same hand
        pool.splice(j, 1);
        break;
      }
    }
  }
  
  return hand;
};
