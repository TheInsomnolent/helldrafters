/**
 * Warbond constants and definitions
 */

export const WARBOND_TYPE = {
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  LEGENDARY: 'LEGENDARY'
};

export const WARBONDS = {
  // Standard (Free)
  HELLDIVERS_MOBILIZE: {
    id: 'helldivers_mobilize',
    name: 'Helldivers Mobilize!',
    type: WARBOND_TYPE.STANDARD,
    order: 1,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/a/a6/Helldivers_Mobilize%21_Warbond_Icon.png'
  },

  // Premium Warbonds (chronological order)
  STEELED_VETERANS: {
    id: 'steeled_veterans',
    name: 'Steeled Veterans',
    type: WARBOND_TYPE.PREMIUM,
    order: 2,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/5/5c/Steeled_Veterans_Warbond_Icon.png'
  },
  CUTTING_EDGE: {
    id: 'cutting_edge',
    name: 'Cutting Edge',
    type: WARBOND_TYPE.PREMIUM,
    order: 3,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/8/8f/Cutting_Edge_Warbond_Icon.png'
  },
  DEMOCRATIC_DETONATION: {
    id: 'democratic_detonation',
    name: 'Democratic Detonation',
    type: WARBOND_TYPE.PREMIUM,
    order: 4,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/3/3e/Democratic_Detonation_Warbond_Icon.png'
  },
  POLAR_PATRIOTS: {
    id: 'polar_patriots',
    name: 'Polar Patriots',
    type: WARBOND_TYPE.PREMIUM,
    order: 5,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/f/f0/Polar_Patriots_Warbond_Icon.png'
  },
  VIPER_COMMANDOS: {
    id: 'viper_commandos',
    name: 'Viper Commandos',
    type: WARBOND_TYPE.PREMIUM,
    order: 6,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/b/b5/Viper_Commandos_Warbond_Icon.png'
  },
  FREEDOMS_FLAME: {
    id: 'freedoms_flame',
    name: "Freedom's Flame",
    type: WARBOND_TYPE.PREMIUM,
    order: 7,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/2/2c/Freedom%27s_Flame_Warbond_Icon.png'
  },
  CHEMICAL_AGENTS: {
    id: 'chemical_agents',
    name: 'Chemical Agents',
    type: WARBOND_TYPE.PREMIUM,
    order: 8,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/d/d0/Chemical_Agents_Warbond_Icon.png'
  },
  TRUTH_ENFORCERS: {
    id: 'truth_enforcers',
    name: 'Truth Enforcers',
    type: WARBOND_TYPE.PREMIUM,
    order: 9,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/9/9a/Truth_Enforcers_Warbond_Icon.png'
  },
  URBAN_LEGENDS: {
    id: 'urban_legends',
    name: 'Urban Legends',
    type: WARBOND_TYPE.PREMIUM,
    order: 10,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/a/a5/Urban_Legends_Warbond_Icon.png'
  },
  SERVANTS_OF_FREEDOM: {
    id: 'servants_of_freedom',
    name: 'Servants of Freedom',
    type: WARBOND_TYPE.PREMIUM,
    order: 11,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/7/7e/Servants_of_Freedom_Warbond_Icon.png'
  },
  BORDERLINE_JUSTICE: {
    id: 'borderline_justice',
    name: 'Borderline Justice',
    type: WARBOND_TYPE.PREMIUM,
    order: 12,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/c/c9/Borderline_Justice_Warbond_Icon.png'
  },
  MASTERS_OF_CEREMONY: {
    id: 'masters_of_ceremony',
    name: 'Masters of Ceremony',
    type: WARBOND_TYPE.PREMIUM,
    order: 13,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/1/1f/Masters_of_Ceremony_Warbond_Icon.png'
  },
  FORCE_OF_LAW: {
    id: 'force_of_law',
    name: 'Force of Law',
    type: WARBOND_TYPE.PREMIUM,
    order: 14,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/e/e0/Force_of_Law_Warbond_Icon.png'
  },
  CONTROL_GROUP: {
    id: 'control_group',
    name: 'Control Group',
    type: WARBOND_TYPE.PREMIUM,
    order: 15,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/4/4a/Control_Group_Warbond_Icon.png'
  },
  DUST_DEVILS: {
    id: 'dust_devils',
    name: 'Dust Devils',
    type: WARBOND_TYPE.PREMIUM,
    order: 16,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/2/28/Dust_Devils_Warbond_Icon.png'
  },
  PYTHON_COMMANDOS: {
    id: 'python_commandos',
    name: 'Python Commandos',
    type: WARBOND_TYPE.PREMIUM,
    order: 17,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/5/57/Python_Commandos_Warbond_Icon.png'
  },

  // Legendary Warbonds
  OBEDIENT_DEMOCRACY: {
    id: 'obedient_democracy',
    name: 'Obedient Democracy Support Troopers',
    type: WARBOND_TYPE.LEGENDARY,
    order: 18,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/a/ab/Obedient_Democracy_Support_Troopers_Warbond_Icon.png'
  },
  RIGHTEOUS_REVENANTS: {
    id: 'righteous_revenants',
    name: 'Righteous Revenants',
    type: WARBOND_TYPE.LEGENDARY,
    order: 19,
    image: 'https://static.wikia.nocookie.net/helldivers_gamepedia/images/d/d9/Righteous_Revenants_Warbond_Icon.png'
  }
};

// Helper to get warbonds by type
export const getWarbondsByType = (type) => {
  return Object.values(WARBONDS).filter(wb => wb.type === type);
};

// Helper to get all warbonds in order
export const getAllWarbonds = () => {
  return Object.values(WARBONDS).sort((a, b) => a.order - b.order);
};

// Helper to get warbond by id
export const getWarbondById = (id) => {
  return Object.values(WARBONDS).find(wb => wb.id === id);
};

// Default warbond selections (just the free one)
export const DEFAULT_WARBONDS = [WARBONDS.HELLDIVERS_MOBILIZE.id];
