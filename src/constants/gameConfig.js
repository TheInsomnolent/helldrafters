// Game configuration constants

export const STARTING_LOADOUT = {
  primary: null,
  secondary: 's_peacemaker',
  grenade: 'g_he',
  armor: 'a_b01',
  booster: null,
  stratagems: [null, null, null, null]
};

export const DIFFICULTY_CONFIG = [
  { level: 1, name: 'Trivial', reqAT: false },
  { level: 2, name: 'Easy', reqAT: false },
  { level: 3, name: 'Medium', reqAT: false },
  { level: 4, name: 'Challenging', reqAT: true },
  { level: 5, name: 'Hard', reqAT: true },
  { level: 6, name: 'Extreme', reqAT: true },
  { level: 7, name: 'Suicide Mission', reqAT: true },
  { level: 8, name: 'Impossible', reqAT: true },
  { level: 9, name: 'Helldive', reqAT: true },
  { level: 10, name: 'Super Helldive', reqAT: true }
];

/**
 * Endurance Mode Mission Count per Difficulty
 * Maps difficulty level (1-10) to number of missions required to complete the operation
 */
export const ENDURANCE_MISSION_COUNT = {
  1: 1,  // Trivial - 1 mission
  2: 1,  // Easy - 1 mission
  3: 2,  // Medium - 2 missions
  4: 2,  // Challenging - 2 missions
  5: 3,  // Hard - 3 missions
  6: 3,  // Extreme - 3 missions
  7: 3,  // Suicide Mission - 3 missions
  8: 3,  // Impossible - 3 missions
  9: 3,  // Helldive - 3 missions
  10: 3  // Super Helldive - 3 missions
};

/**
 * Get the number of missions required for a given difficulty in Endurance mode
 * @param {number} difficulty - Difficulty level (1-10)
 * @returns {number} - Number of missions required
 */
export function getMissionsForDifficulty(difficulty) {
  return ENDURANCE_MISSION_COUNT[difficulty] || 1;
}
