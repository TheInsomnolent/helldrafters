import { RARITY, TYPE, TAGS } from '../constants/types';
import { ARMOR_PASSIVE, ARMOR_CLASS } from '../constants/armorPassives';

// This file organizes items by their source warbond for maintainability
// Items without a warbond field default to 'helldivers_mobilize' (base game)

// =============================================================================
// HELLDIVERS MOBILIZE (Standard/Free Warbond)
// =============================================================================
export const HELLDIVERS_MOBILIZE_ITEMS = [
  // PRIMARY WEAPONS
  { id: 'p_liberator', name: 'AR-23 Liberator', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'p_punisher', name: 'SG-8 Punisher', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [TAGS.STUN], warbond: 'helldivers_mobilize' },
  { id: 'p_breaker', name: 'SG-225 Breaker', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'p_breaker_sp', name: 'SG-225SP Breaker Spray&Pray', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'p_scythe', name: 'LAS-5 Scythe', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'p_diligence', name: 'R-63 Diligence', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [TAGS.PRECISION], warbond: 'helldivers_mobilize' },
  { id: 'p_cs', name: 'R-63CS Counter Sniper', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION], warbond: 'helldivers_mobilize' },
  { id: 'p_defender', name: 'SMG-37 Defender', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'p_lib_pen', name: 'AR-23P Liberator Penetrator', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION], warbond: 'helldivers_mobilize' },
  { id: 'p_slugger', name: 'SG-8S Slugger', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.PRECISION], warbond: 'helldivers_mobilize' },
  { id: 'p_scorcher', name: 'PLAS-1 Scorcher', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE], warbond: 'helldivers_mobilize' },

  // SECONDARY WEAPONS
  { id: 's_peacemaker', name: 'P-2 Peacemaker', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 's_redeemer', name: 'P-19 Redeemer', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },

  // GRENADES
  { id: 'g_he', name: 'G-12 High Explosive', type: TYPE.GRENADE, rarity: RARITY.COMMON, tags: [TAGS.EXPLOSIVE], warbond: 'helldivers_mobilize' },
  { id: 'g_frag', name: 'G-6 Frag', type: TYPE.GRENADE, rarity: RARITY.COMMON, tags: [TAGS.EXPLOSIVE], warbond: 'helldivers_mobilize' },
  { id: 'g_impact', name: 'G-16 Impact', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], warbond: 'helldivers_mobilize' },

  // ARMOR
  { id: 'a_sc34', name: 'SC-34 Infiltrator', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.SCOUT, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_fs05', name: 'FS-05 Marksman', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [TAGS.DEFENSIVE], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.FORTIFIED, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_ce35', name: 'CE-35 Trench Engineer', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.ENGINEERING_KIT, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_cm09', name: 'CM-09 Bonesnapper', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.MED_KIT, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_fs23', name: 'FS-23 Battle Master', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.FORTIFIED, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_sc30', name: 'SC-30 Trailblazer Scout', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.SCOUT, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_sa04', name: 'SA-04 Combat Technician', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.SCOUT, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_cm14', name: 'CM-14 Physician', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.MED_KIT, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_dp11', name: 'DP-11 Champion of the People', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.DEMOCRACY_PROTECTS, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_b01', name: 'B-01 Tactical', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.EXTRA_PADDING, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_tr40', name: 'TR-40 Gold Eagle', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize', passive: ARMOR_PASSIVE.EXTRA_PADDING, armorClass: ARMOR_CLASS.MEDIUM },

  // BOOSTERS
  { id: 'b_space', name: 'Hellpod Space Optimization', type: TYPE.BOOSTER, rarity: RARITY.RARE, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'b_stamina', name: 'Stamina Enhancement', type: TYPE.BOOSTER, rarity: RARITY.RARE, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'b_muscle', name: 'Muscle Enhancement', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'b_reinforce', name: 'Reinforcement Budget', type: TYPE.BOOSTER, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'b_vitality', name: 'Vitality Enhancement', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'b_uav', name: 'UAV Recon', type: TYPE.BOOSTER, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },

  // STRATAGEMS (Available to all players)
  { id: 'st_ops', name: 'Orbital Precision Strike', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.AT, TAGS.PRECISION], warbond: 'helldivers_mobilize' },
  { id: 'st_gatling', name: 'Orbital Gatling Barrage', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'st_airburst', name: 'Orbital Airburst Strike', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'st_120', name: 'Orbital 120mm HE Barrage', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], warbond: 'helldivers_mobilize' },
  { id: 'st_380', name: 'Orbital 380mm HE Barrage', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE, TAGS.AT], warbond: 'helldivers_mobilize' },
  { id: 'st_walking', name: 'Orbital Walking Barrage', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], warbond: 'helldivers_mobilize' },
  { id: 'st_laser', name: 'Orbital Laser', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.AT, TAGS.FIRE], warbond: 'helldivers_mobilize' },
  { id: 'st_railcannon', name: 'Orbital Railcannon Strike', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.AT, TAGS.PRECISION], warbond: 'helldivers_mobilize' },
  { id: 'st_gas_o', name: 'Orbital Gas Strike', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'st_ems_o', name: 'Orbital EMS Strike', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN], warbond: 'helldivers_mobilize' },
  { id: 'st_smoke_o', name: 'Orbital Smoke Strike', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.SMOKE], warbond: 'helldivers_mobilize' },
  { id: 'st_e_strafe', name: 'Eagle Strafing Run', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'st_e_airstrike', name: 'Eagle Airstrike', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE, TAGS.AT], warbond: 'helldivers_mobilize' },
  { id: 'st_e_cluster', name: 'Eagle Cluster Bomb', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [], warbond: 'helldivers_mobilize' },
  { id: 'st_e_smoke', name: 'Eagle Smoke Strike', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.SMOKE], warbond: 'helldivers_mobilize' },
  { id: 'st_e_rockets', name: 'Eagle 110mm Rocket Pods', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.AT, TAGS.PRECISION], warbond: 'helldivers_mobilize' },
  { id: 'st_e_500', name: 'Eagle 500kg Bomb', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.AT, TAGS.EXPLOSIVE], warbond: 'helldivers_mobilize' },
  { id: 'st_mg43', name: 'Machine Gun MG-43', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'helldivers_mobilize' },
  { id: 'st_amr', name: 'Anti-Materiel Rifle', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.PRECISION], warbond: 'helldivers_mobilize' },
  { id: 'st_stalwart', name: 'Stalwart', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'helldivers_mobilize' },
  { id: 'st_eat', name: 'EAT-17 Expendable Anti-Tank', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT], warbond: 'helldivers_mobilize' },
  { id: 'st_rr', name: 'Recoilless Rifle', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT, TAGS.BACKPACK], warbond: 'helldivers_mobilize' },
  { id: 'st_flame', name: 'Flamethrower', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.FIRE], warbond: 'helldivers_mobilize' },
  { id: 'st_ac', name: 'Autocannon AC-8', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.EXPLOSIVE, TAGS.BACKPACK], warbond: 'helldivers_mobilize' },
  { id: 'st_railgun', name: 'Railgun', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT, TAGS.PRECISION], warbond: 'helldivers_mobilize' },
  { id: 'st_spear', name: 'Spear', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT, TAGS.BACKPACK], warbond: 'helldivers_mobilize' },
  { id: 'st_laser_can', name: 'Laser Cannon', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'helldivers_mobilize' },
  { id: 'st_arc', name: 'Arc Thrower', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON], warbond: 'helldivers_mobilize' },
  { id: 'st_quasar', name: 'Quasar Cannon', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT], warbond: 'helldivers_mobilize' },
  { id: 'st_hmg', name: 'Heavy Machine Gun', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'helldivers_mobilize' },
  { id: 'st_commando', name: 'Commando', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT], warbond: 'helldivers_mobilize' },
  { id: 'st_bp_jump', name: 'Jump Pack', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK], warbond: 'helldivers_mobilize' },
  { id: 'st_bp_supply', name: 'Supply Pack', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK], warbond: 'helldivers_mobilize' },
  { id: 'st_bp_dog', name: 'Guard Dog', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.BACKPACK], warbond: 'helldivers_mobilize' },
  { id: 'st_bp_shield', name: 'Shield Generator Pack', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.BACKPACK, TAGS.DEFENSIVE], warbond: 'helldivers_mobilize' },
  { id: 'st_bp_ballistic', name: 'Ballistic Shield', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK, TAGS.DEFENSIVE], warbond: 'helldivers_mobilize' },
  { id: 'st_s_mg', name: 'Machine Gun Sentry', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.DEFENSIVE], warbond: 'helldivers_mobilize' },
  { id: 'st_s_gat', name: 'Gatling Sentry', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.DEFENSIVE], warbond: 'helldivers_mobilize' },
  { id: 'st_s_mortar', name: 'Mortar Sentry', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.EXPLOSIVE], warbond: 'helldivers_mobilize' },
  { id: 'st_s_ems', name: 'EMS Mortar Sentry', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.STUN], warbond: 'helldivers_mobilize' },
  { id: 'st_s_ac', name: 'Autocannon Sentry', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.AT], warbond: 'helldivers_mobilize' },
  { id: 'st_s_rocket', name: 'Rocket Sentry', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.AT], warbond: 'helldivers_mobilize' },
  { id: 'st_s_tesla', name: 'Tesla Tower', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.DEFENSIVE], warbond: 'helldivers_mobilize' },
  { id: 'st_s_mines', name: 'Anti-Personnel Mines', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.DEFENSIVE], warbond: 'helldivers_mobilize' },
  { id: 'st_s_inc_mines', name: 'Incendiary Mines', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.DEFENSIVE, TAGS.FIRE], warbond: 'helldivers_mobilize' },
  { id: 'st_s_at_mines', name: 'Anti-Tank Mines', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.AT], warbond: 'helldivers_mobilize' },
  { id: 'g_smoke', name: 'G-3 Smoke', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [TAGS.SMOKE], warbond: 'helldivers_mobilize' },
  { id: 'st_e_napalm', name: 'Eagle Napalm Airstrike', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE], warbond: 'helldivers_mobilize' },
  { id: 'st_bp_rover', name: 'Guard Dog Rover', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK, TAGS.FIRE], warbond: 'helldivers_mobilize' },
];

// =============================================================================
// STEELED VETERANS (Premium Warbond)
// =============================================================================
export const STEELED_VETERANS_ITEMS = [
  { id: 'p_lib_con', name: 'AR-23C Liberator Concussive', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN], warbond: 'steeled_veterans' },
  { id: 'p_breaker_inc', name: 'SG-225IE Breaker Incendiary', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.FIRE], warbond: 'steeled_veterans' },
  { id: 'p_dominator', name: 'JAR-5 Dominator', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.PRECISION], warbond: 'steeled_veterans' },
  { id: 's_senator', name: 'P-4 Senator', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION], warbond: 'steeled_veterans' },
  { id: 'g_inc', name: 'G-10 Incendiary', type: TYPE.GRENADE, rarity: RARITY.COMMON, tags: [TAGS.FIRE], warbond: 'steeled_veterans' },
  { id: 'b_flex_reinforce', name: 'Flexible Reinforcement Budget', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [], warbond: 'steeled_veterans' },
  { id: 'a_sa25', name: 'SA-25 Steel Trooper', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'steeled_veterans', passive: ARMOR_PASSIVE.SERVO_ASSISTED, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_sa12', name: 'SA-12 Servo Assisted', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'steeled_veterans', passive: ARMOR_PASSIVE.SERVO_ASSISTED, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_sa32', name: 'SA-32 Dynamo', type: TYPE.ARMOR, rarity: RARITY.RARE, tags: [], warbond: 'steeled_veterans', passive: ARMOR_PASSIVE.SERVO_ASSISTED, armorClass: ARMOR_CLASS.HEAVY },
];

// =============================================================================
// CUTTING EDGE (Premium Warbond)
// =============================================================================
export const CUTTING_EDGE_ITEMS = [
  { id: 'p_sickle', name: 'LAS-16 Sickle', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [], warbond: 'cutting_edge' },
  { id: 'p_blitzer', name: 'ARC-12 Blitzer', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.STUN], warbond: 'cutting_edge' },
  { id: 'p_punisher_plas', name: 'SG-8P Punisher Plasma', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE], warbond: 'cutting_edge' },
  { id: 's_dagger', name: 'LAS-7 Dagger', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [], warbond: 'cutting_edge' },
  { id: 'g_stun', name: 'G-23 Stun', type: TYPE.GRENADE, rarity: RARITY.RARE, tags: [TAGS.STUN], warbond: 'cutting_edge' },
  { id: 'b_local', name: 'Localization Confusion', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [], warbond: 'cutting_edge' },
  { id: 'a_ex03', name: 'EX-03 Prototype 3', type: TYPE.ARMOR, rarity: RARITY.RARE, tags: [], warbond: 'cutting_edge', passive: ARMOR_PASSIVE.ELECTRICAL_CONDUIT, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_ex16', name: 'EX-16 Prototype 16', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'cutting_edge', passive: ARMOR_PASSIVE.ELECTRICAL_CONDUIT, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_ex00', name: 'EX-00 Prototype X', type: TYPE.ARMOR, rarity: RARITY.RARE, tags: [], warbond: 'cutting_edge', passive: ARMOR_PASSIVE.ELECTRICAL_CONDUIT, armorClass: ARMOR_CLASS.LIGHT },
];

// =============================================================================
// DEMOCRATIC DETONATION (Premium Warbond)
// =============================================================================
export const DEMOCRATIC_DETONATION_ITEMS = [
  { id: 'p_xbow', name: 'CB-9 Explosive Crossbow', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], warbond: 'democratic_detonation' },
  { id: 'p_eruptor', name: 'R-36 Eruptor', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE], warbond: 'democratic_detonation' },
  { id: 's_grenapistol', name: 'GP-31 Grenade Pistol', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], warbond: 'democratic_detonation' },
  { id: 'g_thermite', name: 'Thermite Grenade', type: TYPE.GRENADE, rarity: RARITY.RARE, tags: [TAGS.AT, TAGS.FIRE], warbond: 'democratic_detonation' },
  { id: 'p_adjudicator', name: 'BR-14 Adjudicator', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION], warbond: 'democratic_detonation' },
  { id: 'b_expert_pilot', name: 'Expert Extraction Pilot', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [], warbond: 'democratic_detonation' },
  { id: 'a_ce27', name: 'CE-27 Ground Breaker', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'democratic_detonation', passive: ARMOR_PASSIVE.ENGINEERING_KIT, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_ce07', name: 'CE-07 Demolition Specialist', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'democratic_detonation', passive: ARMOR_PASSIVE.ENGINEERING_KIT, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_fs55', name: 'FS-55 Devastator', type: TYPE.ARMOR, rarity: RARITY.RARE, tags: [TAGS.DEFENSIVE], warbond: 'democratic_detonation', passive: ARMOR_PASSIVE.FORTIFIED, armorClass: ARMOR_CLASS.HEAVY },
];

// =============================================================================
// POLAR PATRIOTS (Premium Warbond)
// =============================================================================
export const POLAR_PATRIOTS_ITEMS = [
  { id: 'p_purifier', name: 'PLAS-101 Purifier', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], warbond: 'polar_patriots' },
  { id: 'p_pummeler', name: 'SMG-72 Pummeler', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN], warbond: 'polar_patriots' },
  { id: 'p_tenderizer', name: 'AR-61 Tenderizer', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION], warbond: 'polar_patriots' },
  { id: 's_verdict', name: 'P-113 Verdict', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [], warbond: 'polar_patriots' },
  { id: 'g_inc_imp', name: 'G-13 Incendiary Impact', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE], warbond: 'polar_patriots' },
  { id: 'b_shock', name: 'Motivational Shocks', type: TYPE.BOOSTER, rarity: RARITY.COMMON, tags: [], warbond: 'polar_patriots' },
  { id: 'a_cw36', name: 'CW-36 Winter Warrior', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'polar_patriots', passive: ARMOR_PASSIVE.SERVO_ASSISTED, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_cw22', name: 'CW-22 Kodiak', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE], warbond: 'polar_patriots', passive: ARMOR_PASSIVE.FORTIFIED, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_cw4', name: 'CW-4 Arctic Ranger', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'polar_patriots', passive: ARMOR_PASSIVE.SCOUT, armorClass: ARMOR_CLASS.LIGHT },
];

// =============================================================================
// VIPER COMMANDOS (Premium Warbond)
// =============================================================================
export const VIPER_COMMANDOS_ITEMS = [
  { id: 'p_lib_carb', name: 'AR-23A Liberator Carbine', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'viper_commandos' },
  { id: 's_bushwhacker', name: 'SG-22 Bushwhacker', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN], warbond: 'viper_commandos' },
  { id: 'g_knife', name: 'Throwing Knife', type: TYPE.GRENADE, rarity: RARITY.COMMON, tags: [], warbond: 'viper_commandos' },
  { id: 'a_ph9', name: 'PH-9 Predator', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'viper_commandos', passive: ARMOR_PASSIVE.PEAK_PHYSIQUE, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_ph202', name: 'PH-202 Twigsnapper', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'viper_commandos', passive: ARMOR_PASSIVE.PEAK_PHYSIQUE, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'b_infusion', name: 'Experimental Infusion', type: TYPE.BOOSTER, rarity: RARITY.RARE, tags: [], warbond: 'viper_commandos' },
];

// =============================================================================
// FREEDOM'S FLAME (Premium Warbond)
// =============================================================================
export const FREEDOMS_FLAME_ITEMS = [
  { id: 'p_cookout', name: 'SG-451 Cookout', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE, TAGS.STUN], warbond: 'freedoms_flame' },
  { id: 'p_torcher', name: 'FLAM-66 Torcher', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE], warbond: 'freedoms_flame' },
  { id: 's_crisper', name: 'Crisper', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE], warbond: 'freedoms_flame' },
  { id: 'a_i09', name: 'I-09 Heatseeker', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE], warbond: 'freedoms_flame', passive: ARMOR_PASSIVE.INFLAMMABLE, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_i102', name: 'I-102 Draconaught', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE], warbond: 'freedoms_flame', passive: ARMOR_PASSIVE.INFLAMMABLE, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'b_firepod', name: 'Firebomb Hellpods', type: TYPE.BOOSTER, rarity: RARITY.COMMON, tags: [TAGS.FIRE], warbond: 'freedoms_flame' },
];

// =============================================================================
// CHEMICAL AGENTS (Premium Warbond)
// =============================================================================
export const CHEMICAL_AGENTS_ITEMS = [
  { id: 'g_gas', name: 'Gas Grenade', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [], warbond: 'chemical_agents' },
  { id: 's_stimpistol', name: 'P-43 Stim Pistol', type: TYPE.SECONDARY, rarity: RARITY.RARE, tags: [TAGS.DEFENSIVE], warbond: 'chemical_agents' },
  { id: 'st_sterilizer', name: 'Sterilizer', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'chemical_agents' },
  { id: 'st_bp_dog_breath', name: 'AX/TX-13 "Guard Dog" Dog Breath', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK], warbond: 'chemical_agents' },
  { id: 'a_af50', name: 'AF-50 Noxious Ranger', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'chemical_agents', passive: ARMOR_PASSIVE.ADVANCED_FILTRATION, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_af02', name: 'AF-02 Haz-Master', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'chemical_agents', passive: ARMOR_PASSIVE.ADVANCED_FILTRATION, armorClass: ARMOR_CLASS.MEDIUM },
];

// =============================================================================
// TRUTH ENFORCERS (Premium Warbond)
// =============================================================================
export const TRUTH_ENFORCERS_ITEMS = [
  { id: 'b_dead_sprint', name: 'Dead Sprint', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [], warbond: 'truth_enforcers' },
  { id: 'p_halt', name: 'SG-20 Halt', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN], warbond: 'truth_enforcers' },
  { id: 'p_reprimand', name: 'SMG-32 Reprimand', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'truth_enforcers' },
  { id: 's_loyalist', name: 'PLAS-15 Loyalist', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'truth_enforcers' },
  { id: 'a_uf50', name: 'UF-50 Bloodhound', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'truth_enforcers', passive: ARMOR_PASSIVE.UNFLINCHING, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_uf16', name: 'UF-16 Inspector', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'truth_enforcers', passive: ARMOR_PASSIVE.UNFLINCHING, armorClass: ARMOR_CLASS.LIGHT },
];

// =============================================================================
// URBAN LEGENDS (Premium Warbond)
// =============================================================================
export const URBAN_LEGENDS_ITEMS = [
  { id: 'b_armed_pods', name: 'Armed Resupply Pods', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [], warbond: 'urban_legends' },
  { id: 's_stun_lance', name: 'CQC-19 Stun Lance', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN], warbond: 'urban_legends' },
  { id: 'st_bp_directional', name: 'SH-51 Directional Shield', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK, TAGS.DEFENSIVE], warbond: 'urban_legends' },
  { id: 'st_s_flame', name: 'A/FLAM-40 Flame Sentry', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.FIRE], warbond: 'urban_legends' },
  { id: 'st_s_at_emp', name: 'E/AT-12 Anti-Tank Emplacement', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.AT], warbond: 'urban_legends' },
  { id: 'a_sr24', name: 'SR-24 Street Scout', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'urban_legends', passive: ARMOR_PASSIVE.SIEGE_READY, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_sr18', name: 'SR-18 Roadblock', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE], warbond: 'urban_legends', passive: ARMOR_PASSIVE.SIEGE_READY, armorClass: ARMOR_CLASS.HEAVY },
];

// =============================================================================
// SERVANTS OF FREEDOM (Premium Warbond)
// =============================================================================
export const SERVANTS_OF_FREEDOM_ITEMS = [
  { id: 'p_double_edge', name: 'LAS-17 Double-Edge Sickle', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'servants_of_freedom' },
  { id: 's_ultimatum', name: 'GP-20 Ultimatum', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], warbond: 'servants_of_freedom' },
  { id: 'g_seeker', name: 'G-50 Seeker', type: TYPE.GRENADE, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE], warbond: 'servants_of_freedom' },
  { id: 'st_bp_hellbomb', name: 'Portable Hellbomb', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.BACKPACK, TAGS.EXPLOSIVE], warbond: 'servants_of_freedom' },
  { id: 'a_ie3', name: 'IE-3 Martyr', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], warbond: 'servants_of_freedom', passive: ARMOR_PASSIVE.INTEGRATED_EXPLOSIVES, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_ie12', name: 'IE-12 Righteous', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], warbond: 'servants_of_freedom', passive: ARMOR_PASSIVE.INTEGRATED_EXPLOSIVES, armorClass: ARMOR_CLASS.MEDIUM },
];

// =============================================================================
// BORDERLINE JUSTICE (Premium Warbond)
// =============================================================================
export const BORDERLINE_JUSTICE_ITEMS = [
  { id: 'p_deadeye', name: 'R-6 Deadeye', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION], warbond: 'borderline_justice' },
  { id: 's_talon', name: 'LAS-58 Talon', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION], warbond: 'borderline_justice' },
  { id: 'g_dynamite', name: 'TED-63 Dynamite', type: TYPE.GRENADE, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE], warbond: 'borderline_justice' },
  { id: 'st_bp_hover', name: 'LIFT-860 Hover Pack', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.BACKPACK], warbond: 'borderline_justice' },
  { id: 'b_sample_extricator', name: 'Sample Extricator', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [], warbond: 'borderline_justice' },
  { id: 'a_gs17', name: 'GS-17 Frontier Marshal', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'borderline_justice', passive: ARMOR_PASSIVE.GUNSLINGER, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_gs66', name: 'GS-66 Lawmaker', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'borderline_justice', passive: ARMOR_PASSIVE.GUNSLINGER, armorClass: ARMOR_CLASS.HEAVY },
];

// =============================================================================
// MASTERS OF CEREMONY (Premium Warbond)
// =============================================================================
export const MASTERS_OF_CEREMONY_ITEMS = [
  { id: 'p_amendment', name: 'R-2 Amendment', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION], warbond: 'masters_of_ceremony' },
  { id: 's_saber', name: 'CQC-2 Saber', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'masters_of_ceremony' },
  { id: 'g_pyrotech', name: 'G-142 Pyrotech', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE], warbond: 'masters_of_ceremony' },
  { id: 'b_sample_scanner', name: 'Sample Scanner', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [], warbond: 'masters_of_ceremony' },
  { id: 'a_re2310', name: 'RE-2310 Honorary Guard', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'masters_of_ceremony', passive: ARMOR_PASSIVE.REINFORCED_EPAULETTES, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_re1861', name: 'RE-1861 Parade Commander', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'masters_of_ceremony', passive: ARMOR_PASSIVE.REINFORCED_EPAULETTES, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'st_flag', name: 'CQC-1 One True Flag', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'masters_of_ceremony' },
];

// =============================================================================
// FORCE OF LAW (Premium Warbond)
// =============================================================================
export const FORCE_OF_LAW_ITEMS = [
  { id: 'p_pacifier', name: 'AR-32 Pacifier', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN], warbond: 'force_of_law' },
  { id: 'g_urchin', name: 'G-109 Urchin', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [], warbond: 'force_of_law' },
  { id: 'b_stun_pods', name: 'Stun Pods', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN], warbond: 'force_of_law' },
  { id: 'a_bp20', name: 'BP-20 Correct Officer', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'force_of_law', passive: ARMOR_PASSIVE.BALLISTIC_PADDING, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_bp32', name: 'BP-32 Jackboot', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'force_of_law', passive: ARMOR_PASSIVE.BALLISTIC_PADDING, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'st_deescalator', name: 'GL-52 De-Escalator', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'force_of_law' },
  { id: 'st_bp_k9', name: 'AX/ARC-3 "Guard Dog" K-9', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK], warbond: 'force_of_law' },
];

// =============================================================================
// CONTROL GROUP (Premium Warbond)
// =============================================================================
export const CONTROL_GROUP_ITEMS = [
  { id: 'p_variable', name: 'VG-70 Variable', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'control_group' },
  { id: 'g_arc', name: 'G-31 Arc', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN], warbond: 'control_group' },
  { id: 'a_ad26', name: 'AD-26 Bleeding Edge', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'control_group', passive: ARMOR_PASSIVE.ADRENO_DEFIBRILLATOR, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_ad49', name: 'AD-49 Apollonian', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'control_group', passive: ARMOR_PASSIVE.ADRENO_DEFIBRILLATOR, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'st_epoch', name: 'PLAS-45 Epoch', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'control_group' },
  { id: 'st_s_laser', name: 'A/LAS-98 Laser Sentry', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE], warbond: 'control_group' },
  { id: 'st_bp_warp', name: 'LIFT-182 Warp Pack', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.BACKPACK], warbond: 'control_group' },
];

// =============================================================================
// DUST DEVILS (Premium Warbond)
// =============================================================================
export const DUST_DEVILS_ITEMS = [
  { id: 'p_coyote', name: 'AR-2 Coyote', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.FIRE], warbond: 'dust_devils' },
  { id: 'g_pineapple', name: 'G-7 Pineapple', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], warbond: 'dust_devils' },
  { id: 'a_ds42', name: 'DS-42 Federation\'s Blade', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'dust_devils', passive: ARMOR_PASSIVE.DESERT_STORMER, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_ds191', name: 'DS-191 Scorpion', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'dust_devils', passive: ARMOR_PASSIVE.DESERT_STORMER, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'st_speargun', name: 'S-11 Speargun', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'dust_devils' },
  { id: 'st_eat_napalm', name: 'EAT-700 Expendable Napalm', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.FIRE], warbond: 'dust_devils' },
  { id: 'st_solo_silo', name: 'MS-11 Solo Silo', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'dust_devils' },
];

// =============================================================================
// PYTHON COMMANDOS (Premium Warbond)
// =============================================================================
export const PYTHON_COMMANDOS_ITEMS = [
  { id: 'p_onetwo', name: 'AR/GL-21 One-Two', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE], warbond: 'python_commandos' },
  { id: 'a_rs20', name: 'RS-20 Constrictor', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'python_commandos', passive: ARMOR_PASSIVE.ROCK_SOLID, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_rs40', name: 'RS-40 Beast of Prey', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'python_commandos', passive: ARMOR_PASSIVE.ROCK_SOLID, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'st_bp_hotdog', name: 'AX/FLAM-75 "Guard Dog" Hot Dog', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK, TAGS.FIRE], warbond: 'python_commandos' },
  { id: 'st_defoliation', name: 'CQC-9 Defoliation Tool', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON], warbond: 'python_commandos' },
  { id: 'st_maxigun', name: 'M-1000 Maxigun', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON], warbond: 'python_commandos' },
];

// =============================================================================
// HALO: ODST (Legendary Warbond)
// =============================================================================
export const OBEDIENT_DEMOCRACY_SUPPORT_TROOPERS_ITEMS = [
  { id: 'p_ma5c', name: 'MA5C Assault Rifle', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'obedient_democracy_support_troopers' },
  { id: 'p_m7s', name: 'M7S SMG', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'obedient_democracy_support_troopers' },
  { id: 'p_m90a', name: 'M90A Shotgun', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'obedient_democracy_support_troopers' },
  { id: 's_m6c', name: 'M6C/SOCOM Pistol', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'obedient_democracy_support_troopers' },
  { id: 'a_a9', name: 'A-9 Helljumper', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'obedient_democracy_support_troopers', passive: ARMOR_PASSIVE.FEET_FIRST, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_a35', name: 'A-35 Recon', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'obedient_democracy_support_troopers', passive: ARMOR_PASSIVE.FEET_FIRST, armorClass: ARMOR_CLASS.MEDIUM },
];

// =============================================================================
// RIGHTEOUS REVENANTS (Legendary Warbond - Killzone)
// =============================================================================
export const RIGHTEOUS_REVENANTS_ITEMS = [
  { id: 'p_sta52', name: 'StA-52 Assault Rifle', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [], warbond: 'righteous_revenants' },
  { id: 'p_plas39', name: 'PLAS-39 Accelerator Rifle', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'righteous_revenants' },
  { id: 'p_sta11', name: 'StA-11 SMG', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], warbond: 'righteous_revenants' },
  { id: 'a_ac1', name: 'AC-1 Dutiful', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'righteous_revenants', passive: ARMOR_PASSIVE.ACCLIMATED, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_ac2', name: 'AC-2 Obedient', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'righteous_revenants', passive: ARMOR_PASSIVE.ACCLIMATED, armorClass: ARMOR_CLASS.MEDIUM },
];

// =============================================================================
// PREMIUM_EDITION (Pseudo Warbond)
// =============================================================================
export const PREMIUM_EDITION_ITEMS = [
  { id: 'p_knight', name: 'MP-98 Knight', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [], warbond: 'premium_edition' },
  { id: 'a_dp40', name: 'DP-40 Hero of the Federation', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], warbond: 'premium_edition', passive: ARMOR_PASSIVE.DEMOCRACY_PROTECTS, armorClass: ARMOR_CLASS.MEDIUM },
];

// =============================================================================
// SUPERSTORE ITEMS (Available for Super Credits)
// =============================================================================
export const SUPERSTORE_ITEMS = [
  // PRIMARY WEAPONS
  { id: 'p_double_freedom', name: 'DBS-2 Double Freedom', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [], superstore: true },
  
  // SECONDARY WEAPONS
  { id: 's_stun_baton', name: 'CQC-30 Stun Baton', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [TAGS.STUN], superstore: true },
  { id: 's_combat_hatchet', name: 'CQC-5 Combat Hatchet', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [], superstore: true },
  { id: 's_warrant', name: 'P-92 Warrant', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [], superstore: true },
  { id: 's_machete', name: 'CQC-42 Machete', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [], superstore: true },
  
  // Armor - Light
  { id: 'a_sc37', name: 'SC-37 Legionnaire', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.SERVO_ASSISTED, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_ce74', name: 'CE-74 Breaker', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.ENGINEERING_KIT, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_fs38', name: 'FS-38 Eradicator', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE], superstore: true, passive: ARMOR_PASSIVE.FORTIFIED, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_b08', name: 'B-08 Light Gunner', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.EXTRA_PADDING, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_ds10', name: 'DS-10 Big Game Hunter', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.DESERT_STORMER, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_cm21', name: 'CM-21 Trench Paramedic', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.MED_KIT, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_ce67', name: 'CE-67 Titan', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.ENGINEERING_KIT, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_fs37', name: 'FS-37 Ravager', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.ENGINEERING_KIT, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_ie57', name: 'IE-57 Hell-Bent', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], superstore: true, passive: ARMOR_PASSIVE.INTEGRATED_EXPLOSIVES, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_gs11', name: 'GS-11 Democracy\'s Deputy', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.GUNSLINGER, armorClass: ARMOR_CLASS.LIGHT },
  { id: 'a_ad11', name: 'AD-11 Livewire', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.ADRENO_DEFIBRILLATOR, armorClass: ARMOR_CLASS.LIGHT },
  
  // Armor - Medium
  { id: 'a_sc15', name: 'SC-15 Drone Master', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.ENGINEERING_KIT, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_b24', name: 'B-24 Enforcer', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE], superstore: true, passive: ARMOR_PASSIVE.FORTIFIED, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_ce81', name: 'CE-81 Juggernaut', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.ENGINEERING_KIT, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_fs34', name: 'FS-34 Exterminator', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE], superstore: true, passive: ARMOR_PASSIVE.FORTIFIED, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_cm10', name: 'CM-10 Clinician', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.MED_KIT, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_cw9', name: 'CW-9 White Wolf', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.EXTRA_PADDING, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_ph56', name: 'PH-56 Jaguar', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.PEAK_PHYSIQUE, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_i92', name: 'I-92 Fire Fighter', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE], superstore: true, passive: ARMOR_PASSIVE.INFLAMMABLE, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_af91', name: 'AF-91 Field Chemist', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.ADVANCED_FILTRATION, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_uf84', name: 'UF-84 Doubt Killer', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.UNFLINCHING, armorClass: ARMOR_CLASS.MEDIUM },
  { id: 'a_rs6', name: 'RS-6 Fiend Destroyer', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.ROCK_SOLID, armorClass: ARMOR_CLASS.MEDIUM },
  
  // Armor - Heavy
  { id: 'a_b27', name: 'B-27 Fortified Commando', type: TYPE.ARMOR, rarity: RARITY.RARE, tags: [TAGS.DEFENSIVE], superstore: true, passive: ARMOR_PASSIVE.EXTRA_PADDING, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_fs61', name: 'FS-61 Dreadnought', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE], superstore: true, passive: ARMOR_PASSIVE.SERVO_ASSISTED, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_fs11', name: 'FS-11 Executioner', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE], superstore: true, passive: ARMOR_PASSIVE.FORTIFIED, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_cm17', name: 'CM-17 Butcher', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.MED_KIT, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_ce64', name: 'CE-64 Grenadier', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE], superstore: true, passive: ARMOR_PASSIVE.ENGINEERING_KIT, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_ce101', name: 'CE-101 Guerilla Gorilla', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.ENGINEERING_KIT, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_i44', name: 'I-44 Salamander', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE], superstore: true, passive: ARMOR_PASSIVE.INFLAMMABLE, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_af52', name: 'AF-52 Lockdown', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.ADVANCED_FILTRATION, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_sr64', name: 'SR-64 Cinderblock', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.SIEGE_READY, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_re824', name: 'RE-824 Bearer of the Standard', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.REINFORCED_EPAULETTES, armorClass: ARMOR_CLASS.HEAVY },
  { id: 'a_bp77', name: 'BP-77 Grand Juror', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [], superstore: true, passive: ARMOR_PASSIVE.BALLISTIC_PADDING, armorClass: ARMOR_CLASS.HEAVY },
];

// =============================================================================
// MASTER DATABASE (Flattened for compatibility)
// =============================================================================
export const MASTER_DB = [
  ...HELLDIVERS_MOBILIZE_ITEMS,
  ...STEELED_VETERANS_ITEMS,
  ...CUTTING_EDGE_ITEMS,
  ...DEMOCRATIC_DETONATION_ITEMS,
  ...POLAR_PATRIOTS_ITEMS,
  ...VIPER_COMMANDOS_ITEMS,
  ...FREEDOMS_FLAME_ITEMS,
  ...CHEMICAL_AGENTS_ITEMS,
  ...TRUTH_ENFORCERS_ITEMS,
  ...URBAN_LEGENDS_ITEMS,
  ...SERVANTS_OF_FREEDOM_ITEMS,
  ...BORDERLINE_JUSTICE_ITEMS,
  ...MASTERS_OF_CEREMONY_ITEMS,
  ...FORCE_OF_LAW_ITEMS,
  ...CONTROL_GROUP_ITEMS,
  ...DUST_DEVILS_ITEMS,
  ...PYTHON_COMMANDOS_ITEMS,
  ...OBEDIENT_DEMOCRACY_SUPPORT_TROOPERS_ITEMS,
  ...RIGHTEOUS_REVENANTS_ITEMS,
  ...PREMIUM_EDITION_ITEMS,
  ...SUPERSTORE_ITEMS,
];
