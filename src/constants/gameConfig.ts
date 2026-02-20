/**
 * Game configuration constants
 */
import type { Loadout, DifficultyConfig } from '../types'

/**
 * Debug flag for draft filtering/superstore logging
 * Set to true to enable verbose logging for debugging item filtering issues
 * Can also be enabled via localStorage: localStorage.setItem('DEBUG_DRAFT_FILTERING', 'true')
 */
export const DEBUG_DRAFT_FILTERING: boolean = (() => {
    try {
        return localStorage.getItem('DEBUG_DRAFT_FILTERING') === 'true'
    } catch {
        return false
    }
})()

/**
 * Helper to check if draft filtering debug is enabled
 * Checks both the constant and localStorage at runtime
 */
export const isDraftFilteringDebugEnabled = (): boolean => {
    try {
        return DEBUG_DRAFT_FILTERING || localStorage.getItem('DEBUG_DRAFT_FILTERING') === 'true'
    } catch {
        return DEBUG_DRAFT_FILTERING
    }
}

export const STARTING_LOADOUT: Loadout = {
    primary: null,
    secondary: 's_peacemaker',
    grenade: 'g_he',
    armor: 'a_b01',
    booster: null,
    stratagems: [null, null, null, null],
}

export const DIFFICULTY_CONFIG: DifficultyConfig[] = [
    { level: 1, name: 'Trivial', reqAT: false },
    { level: 2, name: 'Easy', reqAT: false },
    { level: 3, name: 'Medium', reqAT: false },
    { level: 4, name: 'Challenging', reqAT: true },
    { level: 5, name: 'Hard', reqAT: true },
    { level: 6, name: 'Extreme', reqAT: true },
    { level: 7, name: 'Suicide Mission', reqAT: true },
    { level: 8, name: 'Impossible', reqAT: true },
    { level: 9, name: 'Helldive', reqAT: true },
    { level: 10, name: 'Super Helldive', reqAT: true },
]

/**
 * Endurance Mode Mission Count per Difficulty
 * Maps difficulty level (1-10) to number of missions required to complete the operation
 */
export const ENDURANCE_MISSION_COUNT: Record<number, number> = {
    1: 1, // Trivial - 1 mission
    2: 1, // Easy - 1 mission
    3: 2, // Medium - 2 missions
    4: 2, // Challenging - 2 missions
    5: 3, // Hard - 3 missions
    6: 3, // Extreme - 3 missions
    7: 3, // Suicide Mission - 3 missions
    8: 3, // Impossible - 3 missions
    9: 3, // Helldive - 3 missions
    10: 3, // Super Helldive - 3 missions
}

/**
 * Get the number of missions required for a given difficulty in Endurance mode
 * @param difficulty - Difficulty level (1-10)
 * @returns Number of missions required
 */
export function getMissionsForDifficulty(difficulty: number): number {
    return ENDURANCE_MISSION_COUNT[difficulty] || 1
}
