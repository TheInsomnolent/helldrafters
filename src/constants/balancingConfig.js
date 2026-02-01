/**
 * Dynamic Balancing Configuration
 *
 * This file defines balancing parameters that adjust game difficulty based on:
 * - Player count (more players = easier due to more items available)
 * - Enemy subfaction (different enemy variants have different difficulty levels)
 */

// =============================================================================
// SUBFACTION DEFINITIONS
// =============================================================================

export const SUBFACTION = {
    // Terminid Variants
    BUGS_VANILLA: 'bugs_vanilla',
    BUGS_PREDATOR: 'bugs_predator',
    BUGS_SPORE_BURST: 'bugs_spore_burst',
    BUGS_RUPTURE: 'bugs_rupture',

    // Automaton Variants
    BOTS_VANILLA: 'bots_vanilla',
    BOTS_JET_BRIGADE: 'bots_jet_brigade',
    BOTS_INCINERATION_CORE: 'bots_incineration_core',

    // Illuminate Variants
    SQUIDS_VANILLA: 'squids_vanilla',
}

export const SUBFACTION_CONFIG = {
    // Terminid Subfactions
    [SUBFACTION.BUGS_VANILLA]: {
        name: 'Standard',
        description: 'Standard bug forces',
        reqMultiplier: 1.0,
        rareWeightMultiplier: 1.0,
    },
    [SUBFACTION.BUGS_SPORE_BURST]: {
        name: 'Spore Burst Strain',
        description: 'Explosive spore variants',
        reqMultiplier: 1.1,
        rareWeightMultiplier: 1.1,
    },
    [SUBFACTION.BUGS_PREDATOR]: {
        name: 'Predator Strain',
        description: 'Fast, aggressive hunters',
        reqMultiplier: 1.2,
        rareWeightMultiplier: 1.2,
    },
    [SUBFACTION.BUGS_RUPTURE]: {
        name: 'Rupture Strain',
        description: 'Highly armored burst variants',
        reqMultiplier: 1.3,
        rareWeightMultiplier: 1.3,
    },

    // Automaton Subfactions
    [SUBFACTION.BOTS_VANILLA]: {
        name: 'Standard',
        description: 'Standard automaton forces',
        reqMultiplier: 1.0,
        rareWeightMultiplier: 1.0,
    },
    [SUBFACTION.BOTS_JET_BRIGADE]: {
        name: 'Jet Brigade',
        description: 'Airborne assault units',
        reqMultiplier: 1.2,
        rareWeightMultiplier: 1.2,
    },
    [SUBFACTION.BOTS_INCINERATION_CORE]: {
        name: 'Incineration Core',
        description: 'Fire-focused bot variant',
        reqMultiplier: 1.3,
        rareWeightMultiplier: 1.3,
    },

    // Illuminate Subfactions
    [SUBFACTION.SQUIDS_VANILLA]: {
        name: 'Standard',
        description: 'Standard illuminate forces',
        reqMultiplier: 1.0,
        rareWeightMultiplier: 1.0,
    },
}

// =============================================================================
// PLAYER COUNT SCALING
// =============================================================================

/**
 * Requisition scaling by player count
 * More players = easier game = less requisition needed
 * Each player should earn requisition independently based on their perspective
 */
export const PLAYER_COUNT_REQ_SCALING = {
    1: 1.0, // Solo - baseline
    2: 0.8, // 2 players - 20% reduction
    3: 0.6, // 3 players - 40% reduction
    4: 0.5, // 4 players - 50% reduction
}

/**
 * Rare/Legendary item weight scaling by player count
 * More players = more items seen = reduce rare frequency to maintain scarcity
 * Formula: base rare weight * (0.7 ^ (playerCount - 1))
 * Applies to both RARE (base weight 5) and LEGENDARY (base weight 2) tiers
 */
export const RARE_WEIGHT_SCALING_BASE = 0.7

// =============================================================================
// SLOT LOCKING CONFIGURATION
// =============================================================================

/**
 * Cost in requisition to lock a draft slot (prevent specific item type from appearing)
 * Scales with player count - solo/duo pay 3 req, 3-4 players pay 2 req
 * Each player pays independently
 */
export const SLOT_LOCK_COST = {
    1: 3, // Solo - 3 req
    2: 3, // 2 players - 3 req
    3: 2, // 3 players - 2 req
    4: 2, // 4 players - 2 req
}

/**
 * Maximum number of slot types that can be locked simultaneously
 */
export const MAX_LOCKED_SLOTS = 3

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate requisition multiplier based on player count and subfaction
 * @param {number} playerCount - Number of players (1-4)
 * @param {string} subfaction - Enemy subfaction identifier
 * @returns {number} - Combined multiplier for requisition awards
 */
export function getRequisitionMultiplier(playerCount, subfaction) {
    const playerMultiplier = PLAYER_COUNT_REQ_SCALING[playerCount] || 1.0
    const subfactionMultiplier = SUBFACTION_CONFIG[subfaction]?.reqMultiplier || 1.0

    return playerMultiplier * subfactionMultiplier
}

/**
 * Calculate rare/legendary item weight multiplier based on player count and subfaction
 * @param {number} playerCount - Number of players (1-4)
 * @param {string} subfaction - Enemy subfaction identifier
 * @returns {number} - Combined multiplier for rare and legendary item weights
 */
export function getRareWeightMultiplier(playerCount, subfaction) {
    // Player count scaling: each additional player reduces rare frequency
    const playerMultiplier = Math.pow(RARE_WEIGHT_SCALING_BASE, playerCount - 1)

    // Subfaction scaling: harder enemies increase rare frequency
    const subfactionMultiplier = SUBFACTION_CONFIG[subfaction]?.rareWeightMultiplier || 1.0

    return playerMultiplier * subfactionMultiplier
}

/**
 * Get default subfaction for a given faction
 * @param {string} faction - Main faction (terminid, automaton, illuminate)
 * @returns {string} - Default subfaction identifier
 */
export function getDefaultSubfaction(faction) {
    switch (faction) {
        case 'terminid':
            return SUBFACTION.BUGS_VANILLA
        case 'automaton':
            return SUBFACTION.BOTS_VANILLA
        case 'illuminate':
            return SUBFACTION.SQUIDS_VANILLA
        default:
            return SUBFACTION.BUGS_VANILLA
    }
}

/**
 * Get all subfactions for a given main faction
 * @param {string} faction - Main faction (terminid, automaton, illuminate)
 * @returns {Array<string>} - Array of subfaction identifiers
 */
export function getSubfactionsForFaction(faction) {
    switch (faction) {
        case 'terminid':
            return [
                SUBFACTION.BUGS_VANILLA,
                SUBFACTION.BUGS_PREDATOR,
                SUBFACTION.BUGS_SPORE_BURST,
                SUBFACTION.BUGS_RUPTURE,
            ]
        case 'automaton':
            return [
                SUBFACTION.BOTS_VANILLA,
                SUBFACTION.BOTS_JET_BRIGADE,
                SUBFACTION.BOTS_INCINERATION_CORE,
            ]
        case 'illuminate':
            return [SUBFACTION.SQUIDS_VANILLA]
        default:
            return [SUBFACTION.BUGS_VANILLA]
    }
}

/**
 * Calculate slot lock cost based on player count
 * @param {number} playerCount - Number of players (1-4)
 * @returns {number} - Cost in requisition to lock a slot
 */
export function getSlotLockCost(playerCount) {
    return SLOT_LOCK_COST[playerCount] || 3
}
