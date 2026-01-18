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

// Passive descriptions for reference - flavour text from Helldivers wiki
export const ARMOR_PASSIVE_DESCRIPTIONS = {
  [ARMOR_PASSIVE.SERVO_ASSISTED]: '+30% throwing range, +50% limb health',
  [ARMOR_PASSIVE.SCOUT]: 'Markers ping radar every 2 seconds, -30% enemy detection range',
  [ARMOR_PASSIVE.PEAK_PHYSIQUE]: '+100% melee damage, reduced weapon sway when moving',
  [ARMOR_PASSIVE.EXTRA_PADDING]: '+50 armor rating',
  
  [ARMOR_PASSIVE.FORTIFIED]: '50% explosive resistance, -30% recoil when crouching or prone',
  [ARMOR_PASSIVE.DEMOCRACY_PROTECTS]: '50% chance to survive lethal damage, prevents chest bleed damage',
  [ARMOR_PASSIVE.UNFLINCHING]: 'Reduced flinch when damaged, +25 armor, pings enemies on minimap',
  [ARMOR_PASSIVE.BALLISTIC_PADDING]: '+25% chest and explosive resistance, prevents chest bleed damage',
  [ARMOR_PASSIVE.ROCK_SOLID]: '-30% recoil when crouching or prone, +2 grenade capacity',
  
  [ARMOR_PASSIVE.ENGINEERING_KIT]: '-30% recoil when crouching or prone, +2 grenade capacity',
  [ARMOR_PASSIVE.MED_KIT]: '+2 stim capacity, +2 seconds stim duration',
  [ARMOR_PASSIVE.ELECTRICAL_CONDUIT]: '95% arc damage resistance, reduced stun buildup',
  
  [ARMOR_PASSIVE.INFLAMMABLE]: '75% fire damage resistance',
  [ARMOR_PASSIVE.ADVANCED_FILTRATION]: '80% gas damage resistance',
  [ARMOR_PASSIVE.DESERT_STORMER]: '95% acid damage resistance',
  [ARMOR_PASSIVE.ACCLIMATED]: '50% resistance to fire, gas, acid, and electrical damage',
  
  [ARMOR_PASSIVE.INTEGRATED_EXPLOSIVES]: 'Explodes on death, +2 grenade capacity',
  [ARMOR_PASSIVE.GUNSLINGER]: '+40% sidearm reload speed, +50% draw/holster speed, -70% sidearm recoil',
  [ARMOR_PASSIVE.SIEGE_READY]: '+20% primary ammo capacity, +30% primary reload speed',
  [ARMOR_PASSIVE.REINFORCED_EPAULETTES]: '50% chance to prevent limb breaks',
  [ARMOR_PASSIVE.ADRENO_DEFIBRILLATOR]: 'Revives after death, 50% arc resistance, +2s stim duration',
  [ARMOR_PASSIVE.FEET_FIRST]: 'Prevents major leg injuries, +30% radar detection, -50% movement sound',
};
