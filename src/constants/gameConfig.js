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
