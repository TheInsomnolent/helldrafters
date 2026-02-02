import type { Loadout } from '../types'

/**
 * Get the first empty stratagem slot index
 * @param loadout - Player's loadout object
 * @returns Index of first empty slot, or -1 if all full
 */
export const getFirstEmptyStratagemSlot = (loadout: Loadout): number => {
    if (!loadout || !loadout.stratagems || !Array.isArray(loadout.stratagems)) {
        return -1
    }
    return loadout.stratagems.indexOf(null)
}

/**
 * Check if stratagem slots are full
 * @param loadout - Player's loadout object
 * @returns True if all stratagem slots are occupied
 */
export const areStratagemSlotsFull = (loadout: Loadout): boolean => {
    if (!loadout || !loadout.stratagems || !Array.isArray(loadout.stratagems)) {
        return true // Treat invalid loadout as full to prevent errors
    }
    return getFirstEmptyStratagemSlot(loadout) === -1
}
