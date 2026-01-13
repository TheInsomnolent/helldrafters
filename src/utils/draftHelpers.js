import { getItemById, anyItemHasTag, getUniqueArmorCombos, playerHasAccessToArmorCombo, hasArmorCombo } from './itemHelpers';
import { RARITY, TAGS, TYPE, FACTION } from '../constants/types';
import { MASTER_DB } from '../data/itemsByWarbond';

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
 * @param {Object} player - Player object with inventory, loadout, warbonds, and includeSuperstore
 * @param {number} difficulty - Current difficulty level
 * @param {Object} gameConfig - Game configuration
 * @param {string[]} burnedCards - Array of burned card IDs
 * @param {Object[]} allPlayers - All players (for global uniqueness)
 * @returns {Object[]} Array of {item, weight} objects (or {armorCombo, weight} for armor)
 */
export const getWeightedPool = (player, difficulty, gameConfig, burnedCards = [], allPlayers = []) => {
  // 1. Filter out already owned items and boosters (boosters only come from events)
  let candidates = MASTER_DB.filter(item => 
    !player.inventory.includes(item.id) && item.type !== TYPE.BOOSTER
  );

  // 2. Filter by player's enabled warbonds and superstore access
  if (player.warbonds && player.warbonds.length > 0) {
    candidates = candidates.filter(item => {
      // Include items from enabled warbonds
      if (item.warbond && player.warbonds.includes(item.warbond)) {
        return true;
      }
      // Include superstore items if player has access
      if (item.superstore && player.includeSuperstore) {
        return true;
      }
      // Exclude items with warbond/superstore tags that aren't accessible
      return !item.warbond && !item.superstore;
    });
  }

  // 3. Filter out burned cards (if burn mode enabled)
  if (gameConfig.burnCards) {
    candidates = candidates.filter(item => !burnedCards.includes(item.id));
  }

  // 4. Filter by global uniqueness (if enabled)
  if (gameConfig.globalUniqueness) {
    const allPlayerInventories = allPlayers.flatMap(p => p.inventory);
    candidates = candidates.filter(item => !allPlayerInventories.includes(item.id));
  }

  // 5. SPECIAL HANDLING FOR ARMOR: Group by passive/armorClass combos
  const armorCandidates = candidates.filter(item => item.type === TYPE.ARMOR);
  const nonArmorCandidates = candidates.filter(item => item.type !== TYPE.ARMOR);
  
  // Get unique armor combos
  const armorCombos = getUniqueArmorCombos(armorCandidates);
  
  // Filter out armor combos already owned or not accessible
  const availableArmorCombos = armorCombos.filter(combo => {
    // Check if player already has this combo
    const alreadyOwned = hasArmorCombo(player.inventory, combo.passive, combo.armorClass);
    if (alreadyOwned) return false;
    
    // Check if player has access to at least one armor in this combo
    return playerHasAccessToArmorCombo(combo, player.warbonds, player.includeSuperstore);
  });

  // 6. Apply weights to non-armor items
  const weightedNonArmor = nonArmorCandidates.map(item => {
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

    return { item, weight, isArmorCombo: false };
  });

  // 7. Apply weights to armor combos
  const weightedArmor = availableArmorCombos.map(combo => {
    let weight = 10; // Base weight
    
    // Use the first item's rarity as representative (all in combo should be similar)
    const representativeItem = combo.items[0];
    if (representativeItem.rarity === RARITY.COMMON) weight += 50;
    if (representativeItem.rarity === RARITY.UNCOMMON) weight += 25;
    if (representativeItem.rarity === RARITY.RARE) weight += 5;
    
    // Apply any armor-specific faction synergy based on tags
    if (gameConfig.faction === FACTION.BUGS && representativeItem.tags.includes(TAGS.FIRE)) weight += 30;
    if (gameConfig.faction === FACTION.BOTS && representativeItem.tags.includes(TAGS.PRECISION)) weight += 20;
    if (gameConfig.faction === FACTION.SQUIDS && representativeItem.tags.includes(TAGS.STUN)) weight += 20;
    
    return { armorCombo: combo, weight, isArmorCombo: true };
  });

  // Combine both pools
  const combinedPool = [...weightedNonArmor, ...weightedArmor];
  
  return combinedPool.filter(c => c.weight > 0);
};

/**
 * Generate a draft hand for a player
 * @param {Object} player - Player object
 * @param {number} difficulty - Current difficulty level
 * @param {Object} gameConfig - Game configuration
 * @param {string[]} burnedCards - Array of burned card IDs
 * @param {Object[]} allPlayers - All players
 * @param {Function} onBurnCard - Callback when a card is burned (optional)
 * @param {number} customHandSize - Optional custom hand size override
 * @returns {Object[]} Array of item objects or armor combo objects for the draft hand
 */
export const generateDraftHand = (
  player,
  difficulty,
  gameConfig,
  burnedCards = [],
  allPlayers = [],
  onBurnCard = null,
  customHandSize = null
) => {
  if (!player) {
    console.warn('Player not found for draft generation');
    return [];
  }

  const pool = getWeightedPool(player, difficulty, gameConfig, burnedCards, allPlayers);
  const handSize = customHandSize !== null ? customHandSize : getDraftHandSize(gameConfig.starRating);

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
      if (!poolItem) {
        console.warn('Invalid pool item at index', j);
        continue;
      }

      randomNum -= poolItem.weight;
      if (randomNum <= 0) {
        // Add either item or armor combo to hand
        if (poolItem.isArmorCombo) {
          hand.push(poolItem.armorCombo);
        } else {
          hand.push(poolItem.item);
        }
        
        // Burn card if enabled (for armor combos, burn the first item as representative)
        if (gameConfig.burnCards && onBurnCard) {
          if (poolItem.isArmorCombo) {
            poolItem.armorCombo.items.forEach(armor => onBurnCard(armor.id));
          } else {
            onBurnCard(poolItem.item.id);
          }
        }
        
        // Remove from pool to avoid duplicates in same hand
        pool.splice(j, 1);
        break;
      }
    }
  }
  
  return hand;
};
