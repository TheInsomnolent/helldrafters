import { getItemById, anyItemHasTag } from './itemHelpers'
import { TAGS } from '../constants/types'

/**
 * Check if a player's loadout has Anti-Tank capability
 * @param {Object} loadout - Player's loadout object
 * @param {string[]} inventory - Player's inventory array
 * @returns {boolean} True if player has AT capability
 */
export const hasAntiTank = (loadout, inventory) => {
    // Check loadout items
    const loadoutItems = [
        loadout.primary,
        loadout.secondary,
        loadout.grenade,
        ...loadout.stratagems,
    ].filter((id) => id !== null)

    return anyItemHasTag(loadoutItems, TAGS.AT) || anyItemHasTag(inventory, TAGS.AT)
}

/**
 * Check if a player has a backpack equipped
 * @param {Object} loadout - Player's loadout object
 * @returns {boolean} True if player has a backpack equipped
 */
export const hasBackpack = (loadout) =>
    loadout.stratagems.some((sId) => {
        const s = getItemById(sId)
        return s && s.tags.includes(TAGS.BACKPACK)
    })

/**
 * Check if a loadout meets difficulty requirements
 * @param {Object} loadout - Player's loadout object
 * @param {string[]} inventory - Player's inventory array
 * @param {Object} difficultyConfig - Difficulty configuration object
 * @returns {Object} {valid: boolean, missingRequirements: string[]}
 */
export const validateLoadoutForDifficulty = (loadout, inventory, difficultyConfig) => {
    const missingRequirements = []

    if (difficultyConfig.reqAT && !hasAntiTank(loadout, inventory)) {
        missingRequirements.push('Anti-Tank capability required')
    }

    return {
        valid: missingRequirements.length === 0,
        missingRequirements,
    }
}

/**
 * Get the first empty stratagem slot index
 * @param {Object} loadout - Player's loadout object
 * @returns {number} Index of first empty slot, or -1 if all full
 */
export const getFirstEmptyStratagemSlot = (loadout) => {
    if (!loadout || !loadout.stratagems || !Array.isArray(loadout.stratagems)) {
        return -1
    }
    return loadout.stratagems.indexOf(null)
}

/**
 * Check if stratagem slots are full
 * @param {Object} loadout - Player's loadout object
 * @returns {boolean} True if all stratagem slots are occupied
 */
export const areStratagemSlotsFull = (loadout) => {
    if (!loadout || !loadout.stratagems || !Array.isArray(loadout.stratagems)) {
        return true // Treat invalid loadout as full to prevent errors
    }
    return getFirstEmptyStratagemSlot(loadout) === -1
}

/**
 * Count occupied stratagem slots
 * @param {Object} loadout - Player's loadout object
 * @returns {number} Number of occupied stratagem slots
 */
export const countOccupiedStratagemSlots = (loadout) => {
    if (!loadout || !loadout.stratagems || !Array.isArray(loadout.stratagems)) {
        return 0
    }
    return loadout.stratagems.filter((s) => s !== null).length
}

/**
 * Check if adding a new backpack would conflict with existing backpack
 * @param {Object} loadout - Player's loadout object
 * @param {string} newItemId - ID of the item to add
 * @returns {boolean} True if there would be a conflict
 */
export const wouldBackpackConflict = (loadout, newItemId) => {
    const newItem = getItemById(newItemId)
    if (!newItem || !newItem.tags.includes(TAGS.BACKPACK)) {
        return false
    }
    return hasBackpack(loadout)
}
