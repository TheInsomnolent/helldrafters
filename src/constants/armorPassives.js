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
  REDUCED_SIGNATURE: 'reduced_signature',
};

// Passive descriptions for reference - flavour text from Helldivers wiki
export const ARMOR_PASSIVE_DESCRIPTIONS = {
  [ARMOR_PASSIVE.SERVO_ASSISTED]: 'Increases throwing range by 30%. Provides +50% limb health.',
  [ARMOR_PASSIVE.SCOUT]: 'Markers placed on the map will generate radar scans every 2.0s. Reduces range at which enemies can detect the wearer by 30%.',
  [ARMOR_PASSIVE.PEAK_PHYSIQUE]: 'Increases melee damage by 100%. Improves weapons handling with less drag on weapon movement.',
  [ARMOR_PASSIVE.EXTRA_PADDING]: 'Provides a higher armor rating.',
  
  [ARMOR_PASSIVE.FORTIFIED]: 'Further reduces recoil when crouching or prone by 30%. Provides 50% resistance to explosive damage.',
  [ARMOR_PASSIVE.DEMOCRACY_PROTECTS]: '50% chance to not die when taking lethal damage. Prevents all damage from bleeding if chest hemorrhages.',
  [ARMOR_PASSIVE.UNFLINCHING]: 'Helps prevent Helldivers from flinching when hit. Provides a higher armor rating. Markers placed on the map will generate radar scans every 2.0s.',
  [ARMOR_PASSIVE.BALLISTIC_PADDING]: 'Provides 25% resistance to chest damage. Provides 25% resistance to explosive damage. Prevents all damage from bleeding if chest hemorrhages.',
  [ARMOR_PASSIVE.ROCK_SOLID]: 'Helps prevent Helldivers from ragdolling when hit. Increases melee damage by 100%.',
  
  [ARMOR_PASSIVE.ENGINEERING_KIT]: 'Further reduces recoil when crouching or prone by 30%. Increases initial inventory and holding capacity of throwables by +2.',
  [ARMOR_PASSIVE.MED_KIT]: 'Increases initial inventory and holding capacity of stims by +2. Increases stim effect duration by 2.0s.',
  [ARMOR_PASSIVE.ELECTRICAL_CONDUIT]: 'Provides 95% resistance to arc damage.',
  
  [ARMOR_PASSIVE.INFLAMMABLE]: 'Provides 75% damage resistance to fire, allowing bearer to rest assured in their inflammability.',
  [ARMOR_PASSIVE.ADVANCED_FILTRATION]: 'Provides 80% resistance to gas damage and effects.',
  [ARMOR_PASSIVE.DESERT_STORMER]: 'Provides 40% resistance to fire, gas, acid, and electrical damage. Increases throwing range by 20%.',
  [ARMOR_PASSIVE.ACCLIMATED]: 'Provides 50% resistance to fire, gas, acid, and electrical damage.',
  
  [ARMOR_PASSIVE.INTEGRATED_EXPLOSIVES]: 'Armor explodes 1.5s after the wearer dies. Increases initial inventory and holding capacity of throwables by +2.',
  [ARMOR_PASSIVE.GUNSLINGER]: 'Increases sidearms reload speed by 40%. Sidearm draw/holster speed increased by 50%. Sidearm recoil reduced by 70%.',
  [ARMOR_PASSIVE.SIEGE_READY]: 'Increases reload speed of primary weapons by 30%. Increases ammo capacity of all weapons by 20%. Does not affect weapon backpacks.',
  [ARMOR_PASSIVE.REINFORCED_EPAULETTES]: 'Increases reload speed of primary weapons by 30%. Gives wearer a 50% chance to avoid grievous limb injury. Increases melee damage by 50%.',
  [ARMOR_PASSIVE.ADRENO_DEFIBRILLATOR]: 'Provides one-time, short-lived resuscitation upon death, given that the Helldiver\'s body is still intact. Increases stim effect duration by 2.0s. Provides 50% resistance to arc damage.',
  [ARMOR_PASSIVE.FEET_FIRST]: 'Wearer makes 50% less noise when moving. Increases point-of-interest identification range by 30%. Provides immunity to leg injuries.',
  [ARMOR_PASSIVE.REDUCED_SIGNATURE]: "Wearer makes 50% less noise when moving. Reduces range at which enemies can detect the wearer by 40%."
};
