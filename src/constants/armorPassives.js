// =============================================================================
// ARMOR CLASSIFICATION
// =============================================================================
export const ARMOR_CLASS = {
  LIGHT: 'light',    // 50 armor, 550 speed, 125 stamina regen
  MEDIUM: 'medium',  // 100 armor, 500 speed, 100 stamina regen
  HEAVY: 'heavy',    // 150 armor, 450 speed, 50 stamina regen
};

// =============================================================================
// ARMOR PASSIVES
// =============================================================================
// Comprehensive list of all armor passive effects in Helldivers 2

export const ARMOR_PASSIVE = {
  // Movement & Mobility
  SERVO_ASSISTED: 'servo_assisted',
  SCOUT: 'scout',
  PEAK_PHYSIQUE: 'peak_physique',
  EXTRA_PADDING: 'extra_padding',
  
  // Defense & Protection
  FORTIFIED: 'fortified',
  DEMOCRACY_PROTECTS: 'democracy_protects',
  UNFLINCHING: 'unflinching',
  BALLISTIC_PADDING: 'ballistic_padding',
  ROCK_SOLID: 'rock_solid',
  
  // Engineering & Support
  ENGINEERING_KIT: 'engineering_kit',
  MED_KIT: 'med_kit',
  ELECTRICAL_CONDUIT: 'electrical_conduit',
  
  // Environmental Protection
  INFLAMMABLE: 'inflammable',
  ADVANCED_FILTRATION: 'advanced_filtration',
  DESERT_STORMER: 'desert_stormer',
  ACCLIMATED: 'acclimated',
  
  // Combat Effects
  INTEGRATED_EXPLOSIVES: 'integrated_explosives',
  GUNSLINGER: 'gunslinger',
  SIEGE_READY: 'siege_ready',
  REINFORCED_EPAULETTES: 'reinforced_epaulettes',
  ADRENO_DEFIBRILLATOR: 'adreno_defibrillator',
  FEET_FIRST: 'feet_first',
};

// Passive descriptions for reference
export const ARMOR_PASSIVE_DESCRIPTIONS = {
  [ARMOR_PASSIVE.SERVO_ASSISTED]: 'Increases movement speed while moving with heavy or support weapons',
  [ARMOR_PASSIVE.SCOUT]: 'Increases movement speed',
  [ARMOR_PASSIVE.PEAK_PHYSIQUE]: 'Increases movement speed when crouching',
  [ARMOR_PASSIVE.EXTRA_PADDING]: 'Increases armor rating',
  
  [ARMOR_PASSIVE.FORTIFIED]: 'Reduces damage from explosions',
  [ARMOR_PASSIVE.DEMOCRACY_PROTECTS]: 'Increased chance to survive a lethal hit',
  [ARMOR_PASSIVE.UNFLINCHING]: 'Reduces flinching when taking damage',
  [ARMOR_PASSIVE.BALLISTIC_PADDING]: 'Reduces limb damage',
  [ARMOR_PASSIVE.ROCK_SOLID]: 'Reduces recoil when crouching or prone',
  
  [ARMOR_PASSIVE.ENGINEERING_KIT]: 'Call-in time for Sentries, Emplacements & Hellbombs reduced by 50%',
  [ARMOR_PASSIVE.MED_KIT]: 'Increases Stim capacity by 2',
  [ARMOR_PASSIVE.ELECTRICAL_CONDUIT]: 'Reduces arc damage taken by 95%',
  
  [ARMOR_PASSIVE.INFLAMMABLE]: 'Reduces fire damage taken by 75%',
  [ARMOR_PASSIVE.ADVANCED_FILTRATION]: 'Reduces gas damage taken by 95%',
  [ARMOR_PASSIVE.DESERT_STORMER]: 'Reduces acid damage taken by 95%',
  [ARMOR_PASSIVE.ACCLIMATED]: 'Reduces extreme temperature damage by 95%',
  
  [ARMOR_PASSIVE.INTEGRATED_EXPLOSIVES]: 'Grenades inflict 50% more damage',
  [ARMOR_PASSIVE.GUNSLINGER]: 'Increases reload speed and draw speed for pistols',
  [ARMOR_PASSIVE.SIEGE_READY]: 'Reduces damage taken when stationary',
  [ARMOR_PASSIVE.REINFORCED_EPAULETTES]: 'Reduces melee damage taken by 50%',
  [ARMOR_PASSIVE.ADRENO_DEFIBRILLATOR]: 'Increases health regeneration rate',
  [ARMOR_PASSIVE.FEET_FIRST]: 'Reduces Hellpod scatter distance and landing impact radius',
};
