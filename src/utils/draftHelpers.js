import { getRareWeightMultiplier } from '../constants/balancingConfig';
import { FACTION, RARITY, TAGS, TYPE } from '../constants/types';
import { MASTER_DB } from '../data/itemsByWarbond';
import { anyItemHasTag, getItemById, getUniqueArmorCombos, hasArmorCombo, playerHasAccessToArmorCombo } from './itemHelpers';
import { isDraftFilteringDebugEnabled } from '../constants/gameConfig';

/**
 * Draft Filtering Debug Logger
 * Logs detailed information about pool filtering for debugging superstore/warbond issues
 */
const draftDebugLog = (message, data = null) => {
  if (!isDraftFilteringDebugEnabled()) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    ...(data && { data })
  };
  
  console.log(`[DraftDebug] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  
  // Also store in sessionStorage for easy export
  try {
    const existing = JSON.parse(sessionStorage.getItem('draftDebugLogs') || '[]');
    existing.push(logEntry);
    // Keep last 500 entries to prevent memory issues
    if (existing.length > 500) existing.shift();
    sessionStorage.setItem('draftDebugLogs', JSON.stringify(existing));
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Diversity penalty multiplier for draft hand generation
 * Each occurrence of a type beyond the first reduces weight by this factor
 * Lower values create stronger diversity (0.1 = 90% reduction per occurrence)
 */
const DIVERSITY_PENALTY_MULTIPLIER = 0.1;

/**
 * Generate a randomized order for draft picks
 * @param {number} playerCount - Number of players in the game
 * @returns {number[]} Array of player indices in randomized order
 */
export const generateRandomDraftOrder = (playerCount) => {
  // Create array of indices [0, 1, 2, ...]
  const order = Array.from({ length: playerCount }, (_, i) => i);
  
  // Fisher-Yates shuffle algorithm
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  
  return order;
};

/**
 * Calculate draft hand size based on mission star rating
 * @param {number} starRating - Mission star rating (1-5)
 * @returns {number} Number of cards to show (2-4)
 */
export const getDraftHandSize = (starRating) => {
  if (starRating <= 2) return 2;
  if (starRating <= 4) return 3;
  return 4;
};

/**
 * Get weighted pool of available items for a player
 * @param {Object} player - Player object with inventory, loadout, warbonds, includeSuperstore, and excludedItems
 * @param {number} difficulty - Current difficulty level
 * @param {Object} gameConfig - Game configuration
 * @param {string[]} burnedCards - Array of burned card IDs
 * @param {Object[]} allPlayers - All players (for global uniqueness)
 * @param {string[]} lockedSlots - Array of TYPE values that are locked from draft
 * @returns {Object[]} Array of {item, weight} objects (or {armorCombo, weight} for armor)
 */
export const getWeightedPool = (player, difficulty, gameConfig, burnedCards = [], allPlayers = [], lockedSlots = []) => {
  // === DEBUG: Log player filtering config at entry ===
  draftDebugLog('getWeightedPool called', {
    playerId: player?.id,
    playerName: player?.name,
    warbonds: player?.warbonds,
    warbondsType: typeof player?.warbonds,
    warbondsLength: player?.warbonds?.length,
    includeSuperstore: player?.includeSuperstore,
    includeSuperstoreType: typeof player?.includeSuperstore,
    excludedItems: player?.excludedItems,
    excludedItemsLength: player?.excludedItems?.length,
    inventoryCount: player?.inventory?.length,
    difficulty,
    globalUniqueness: gameConfig?.globalUniqueness,
    burnCards: gameConfig?.burnCards
  });

  // 1. Filter out already owned items and boosters (boosters only come from events)
  let candidates = MASTER_DB.filter(item => 
    !player.inventory.includes(item.id) && item.type !== TYPE.BOOSTER
  );

  draftDebugLog('After initial filter (owned + boosters)', {
    candidateCount: candidates.length,
    removedCount: MASTER_DB.length - candidates.length
  });

  // 2. Filter by player's enabled warbonds and superstore access
  if (player.warbonds && player.warbonds.length > 0) {
    const beforeWarbondFilter = candidates.length;
    
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

    // === DEBUG: Log superstore items that passed/failed filtering ===
    const superstoreItemsInPool = candidates.filter(item => item.superstore);
    draftDebugLog('After warbond/superstore filter', {
      beforeCount: beforeWarbondFilter,
      afterCount: candidates.length,
      removedCount: beforeWarbondFilter - candidates.length,
      superstoreItemsIncluded: superstoreItemsInPool.length,
      superstoreItemIds: superstoreItemsInPool.map(i => i.id),
      playerIncludeSuperstore: player.includeSuperstore,
      playerWarbonds: player.warbonds
    });
  } else {
    // === DEBUG: Log when warbond filtering is SKIPPED ===
    draftDebugLog('WARNING: Warbond filtering SKIPPED', {
      reason: !player.warbonds ? 'warbonds is falsy' : 'warbonds is empty array',
      warbondsValue: player.warbonds,
      warbondsType: typeof player.warbonds,
      candidateCount: candidates.length,
      superstoreItemsInPool: candidates.filter(item => item.superstore).length
    });
  }

  // 2.5. Filter out excluded items (items the player doesn't own)
  if (player.excludedItems && player.excludedItems.length > 0) {
    const beforeExcludeFilter = candidates.length;
    candidates = candidates.filter(item => !player.excludedItems.includes(item.id));
    
    draftDebugLog('After excludedItems filter', {
      beforeCount: beforeExcludeFilter,
      afterCount: candidates.length,
      removedCount: beforeExcludeFilter - candidates.length,
      excludedItemsUsed: player.excludedItems.length
    });
  }

  // 3. Filter out burned cards (if burn mode enabled)
  if (gameConfig.burnCards) {
    candidates = candidates.filter(item => !burnedCards.includes(item.id));
  }

  // 3.5. Filter out locked slot types
  if (lockedSlots && lockedSlots.length > 0) {
    candidates = candidates.filter(item => !lockedSlots.includes(item.type));
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
    
    // Check if player has access to at least one armor in this combo (excluding excluded items)
    return playerHasAccessToArmorCombo(combo, player.warbonds, player.includeSuperstore, player.excludedItems || []);
  });

  // 6. Apply weights to non-armor items
  const rareMultiplier = getRareWeightMultiplier(gameConfig.playerCount, gameConfig.subfaction);
  
  const weightedNonArmor = nonArmorCandidates.map(item => {
    let weight = 10; // Base weight

    // Rarity Weights (with dynamic rare multiplier)
    if (item.rarity === RARITY.COMMON) weight += 50;
    if (item.rarity === RARITY.UNCOMMON) weight += 25;
    if (item.rarity === RARITY.RARE) weight += Math.round(5 * rareMultiplier);
    if (item.rarity === RARITY.LEGENDARY) weight += Math.round(2 * rareMultiplier);

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
    if (representativeItem.rarity === RARITY.RARE) weight += Math.round(5 * rareMultiplier);
    if (representativeItem.rarity === RARITY.LEGENDARY) weight += Math.round(2 * rareMultiplier);
    
    // Apply any armor-specific faction synergy based on tags
    if (gameConfig.faction === FACTION.BUGS && representativeItem.tags.includes(TAGS.FIRE)) weight += 30;
    if (gameConfig.faction === FACTION.BOTS && representativeItem.tags.includes(TAGS.PRECISION)) weight += 20;
    if (gameConfig.faction === FACTION.SQUIDS && representativeItem.tags.includes(TAGS.STUN)) weight += 20;
    
    return { armorCombo: combo, weight, isArmorCombo: true };
  });

  // Combine both pools
  const combinedPool = [...weightedNonArmor, ...weightedArmor];
  
  const filteredPool = combinedPool.filter(c => c.weight > 0);
  
  // === DEBUG: Log final pool summary ===
  draftDebugLog('getWeightedPool final result', {
    playerId: player?.id,
    playerName: player?.name,
    totalPoolSize: filteredPool.length,
    armorCombos: weightedArmor.length,
    nonArmorItems: weightedNonArmor.filter(i => i.weight > 0).length,
    superstoreItemsInFinalPool: filteredPool.filter(p => !p.isArmorCombo && p.item?.superstore).map(p => p.item.id),
    superstoreArmorCombosInFinalPool: filteredPool.filter(p => p.isArmorCombo && p.armorCombo?.items?.some(a => a.superstore)).length
  });
  
  return filteredPool;
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
 * @param {string[]} lockedSlots - Array of TYPE values that are locked from draft
 * @returns {Object[]} Array of item objects or armor combo objects for the draft hand
 */
export const generateDraftHand = (
  player,
  difficulty,
  gameConfig,
  burnedCards = [],
  allPlayers = [],
  onBurnCard = null,
  customHandSize = null,
  lockedSlots = []
) => {
  if (!player) {
    console.warn('[Draft] Player not found for draft generation');
    return [];
  }

  console.log(`[Draft] Generating hand for player ${player.id || player.name}`, {
    difficulty,
    burnCards: gameConfig.burnCards,
    burnedCardsCount: burnedCards.length,
    lockedSlots,
    playerInventoryCount: player.inventory?.length || 0
  });

  const pool = getWeightedPool(player, difficulty, gameConfig, burnedCards, allPlayers, lockedSlots);
  const handSize = customHandSize !== null ? customHandSize : getDraftHandSize(gameConfig.starRating);

  console.log(`[Draft] Pool size: ${pool.length}, Hand size: ${handSize}`);
  
  // Log pool composition
  const armorCombos = pool.filter(p => p.isArmorCombo);
  const regularItems = pool.filter(p => !p.isArmorCombo);
  console.log(`[Draft] Pool composition: ${armorCombos.length} armor combos, ${regularItems.length} regular items`);

  const hand = [];
  const typeCount = {}; // Track how many of each type we've drafted
  
  for (let i = 0; i < handSize; i++) {
    if (pool.length === 0) {
      console.warn(`[Draft] Pool exhausted after ${i} cards`);
      break;
    }

    // Apply diversity penalty: reduce weight of types that already appear in hand
    // This prevents drafts with all items of the same type (e.g., 4 armors)
    const adjustedPool = pool.map(poolItem => {
      const itemType = poolItem.isArmorCombo ? TYPE.ARMOR : poolItem.item.type;
      const countOfType = typeCount[itemType] || 0;
      
      // For hand sizes of 3+, apply penalties to prevent more than 2 of same type
      // Penalty: reduce weight by 90% for each occurrence beyond the first
      let adjustedWeight = poolItem.weight;
      if (handSize >= 3 && countOfType > 0) {
        adjustedWeight = Math.max(1, poolItem.weight * Math.pow(DIVERSITY_PENALTY_MULTIPLIER, countOfType));
      }
      
      return { ...poolItem, adjustedWeight };
    });

    const totalWeight = adjustedPool.reduce((sum, c) => sum + c.adjustedWeight, 0);

    // Safety check: if total weight is 0, we can't select anything
    if (totalWeight === 0) {
      console.warn('[Draft] Pool has no valid weighted items');
      break;
    }

    let randomNum = Math.random() * totalWeight;
    let selectedPoolIndex = -1;

    for (let j = 0; j < adjustedPool.length; j++) {
      const poolItem = adjustedPool[j];
      
      // Safety check: ensure pool item exists and has valid structure
      if (!poolItem) {
        console.warn('[Draft] Invalid pool item at index', j);
        continue;
      }

      randomNum -= poolItem.adjustedWeight;
      if (randomNum <= 0) {
        selectedPoolIndex = j;
        
        // Add either item or armor combo to hand
        if (poolItem.isArmorCombo) {
          console.log(`[Draft] Selected armor combo: ${poolItem.armorCombo.passive} (${poolItem.armorCombo.armorClass})`, {
            itemCount: poolItem.armorCombo.items?.length,
            weight: poolItem.weight,
            adjustedWeight: poolItem.adjustedWeight
          });
          hand.push(poolItem.armorCombo);
          typeCount[TYPE.ARMOR] = (typeCount[TYPE.ARMOR] || 0) + 1;
        } else {
          console.log(`[Draft] Selected item: ${poolItem.item?.name || 'Unknown'}`, {
            id: poolItem.item?.id,
            type: poolItem.item?.type,
            weight: poolItem.weight,
            adjustedWeight: poolItem.adjustedWeight
          });
          hand.push(poolItem.item);
          typeCount[poolItem.item.type] = (typeCount[poolItem.item.type] || 0) + 1;
        }
        
        // Burn card if enabled (for armor combos, burn the first item as representative)
        if (gameConfig.burnCards && onBurnCard) {
          if (poolItem.isArmorCombo) {
            poolItem.armorCombo.items.forEach(armor => onBurnCard(armor.id));
          } else {
            onBurnCard(poolItem.item.id);
          }
        }
        
        break;
      }
    }
    
    // Remove selected item from pool to avoid duplicates in same hand
    if (selectedPoolIndex !== -1) {
      pool.splice(selectedPoolIndex, 1);
    }
  }
  
  console.log(`[Draft] Final hand size: ${hand.length}`, hand.map(h => h.name || `${h.passive} (${h.armorClass})`));
  
  return hand;
};
