import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Target, Flame, Crosshair, Zap, Skull, Settings, RefreshCw, Users, AlertTriangle, CheckCircle, XCircle, RotateCcw, ChevronRight, Trophy } from 'lucide-react';
import { selectRandomEvent, OUTCOME_TYPES, EVENT_TYPES } from './events';

// --- DATA CONSTANTS ---

const RARITY = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  LEGENDARY: 'Legendary'
};

const TYPE = {
  PRIMARY: 'Primary',
  SECONDARY: 'Secondary',
  GRENADE: 'Grenade',
  STRATAGEM: 'Stratagem',
  BOOSTER: 'Booster',
  ARMOR: 'Armor'
};

const FACTION = {
  BUGS: 'Terminids',
  BOTS: 'Automatons',
  SQUIDS: 'Illuminate'
};

const TAGS = {
  FIRE: 'Fire',
  AT: 'Anti-Tank',
  STUN: 'Stun',
  SMOKE: 'Smoke',
  BACKPACK: 'Backpack',
  SUPPORT_WEAPON: 'Support Weapon',
  PRECISION: 'Precision',
  EXPLOSIVE: 'Explosive',
  DEFENSIVE: 'Defensive'
};

// --- DATABASE ---
// Transcribed from the provided Spec
const MASTER_DB = [
  // --- PRIMARY WEAPONS ---
  { id: 'p_liberator', name: 'AR-23 Liberator', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [] },
  { id: 'p_lib_pen', name: 'AR-23P Liberator Penetrator', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION] },
  { id: 'p_lib_con', name: 'AR-23C Liberator Concussive', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN] },
  { id: 'p_tenderizer', name: 'AR-61 Tenderizer', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION] },
  { id: 'p_adjudicator', name: 'BR-14 Adjudicator', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION] },
  { id: 'p_sta52', name: 'StA-52 Assault Rifle', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [] },
  { id: 'p_coyote', name: 'AR-2 Coyote', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.FIRE] },
  { id: 'p_onetwo', name: 'AR/GL-21 One-Two', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE] },
  
  // Shotguns
  { id: 'p_punisher', name: 'SG-8 Punisher', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [TAGS.STUN] },
  { id: 'p_slugger', name: 'SG-8S Slugger', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.PRECISION] },
  { id: 'p_breaker', name: 'SG-225 Breaker', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'p_breaker_sp', name: 'SG-225SP Breaker Spray&Pray', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [] },
  { id: 'p_breaker_inc', name: 'SG-225IE Breaker Incendiary', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.FIRE] },
  { id: 'p_punisher_plas', name: 'SG-8P Punisher Plasma', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE] },
  { id: 'p_cookout', name: 'SG-451 Cookout', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE, TAGS.STUN] },
  { id: 'p_halt', name: 'SG-20 Halt', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN] },

  // Energy
  { id: 'p_scythe', name: 'LAS-5 Scythe', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [] },
  { id: 'p_sickle', name: 'LAS-16 Sickle', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [] },
  { id: 'p_scorcher', name: 'PLAS-1 Scorcher', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE] },
  { id: 'p_purifier', name: 'PLAS-101 Purifier', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE] },
  { id: 'p_blitzer', name: 'ARC-12 Blitzer', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.STUN] },

  // Marksman
  { id: 'p_diligence', name: 'R-63 Diligence', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [TAGS.PRECISION] },
  { id: 'p_cs', name: 'R-63CS Counter Sniper', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION] },
  { id: 'p_eruptor', name: 'R-36 Eruptor', type: TYPE.PRIMARY, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE] },
  { id: 'p_xbow', name: 'CB-9 Explosive Crossbow', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE] },

  // SMGs
  { id: 'p_knight', name: 'MP-98 Knight', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [] },
  { id: 'p_defender', name: 'SMG-37 Defender', type: TYPE.PRIMARY, rarity: RARITY.COMMON, tags: [] },
  { id: 'p_pummeler', name: 'SMG-72 Pummeler', type: TYPE.PRIMARY, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN] },

  // --- SECONDARY WEAPONS ---
  { id: 's_peacemaker', name: 'P-2 Peacemaker', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [] },
  { id: 's_redeemer', name: 'P-19 Redeemer', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [] },
  { id: 's_senator', name: 'P-4 Senator', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.PRECISION] },
  { id: 's_grenapistol', name: 'GP-31 Grenade Pistol', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE] },
  { id: 's_dagger', name: 'LAS-7 Dagger', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [] },
  { id: 's_verdict', name: 'P-113 Verdict', type: TYPE.SECONDARY, rarity: RARITY.COMMON, tags: [] },
  { id: 's_bushwhacker', name: 'SG-22 Bushwhacker', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN] },
  { id: 's_crisper', name: 'Crisper', type: TYPE.SECONDARY, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE] },
  { id: 's_stimpistol', name: 'P-43 Stim Pistol', type: TYPE.SECONDARY, rarity: RARITY.RARE, tags: [TAGS.DEFENSIVE] },

  // --- GRENADES ---
  { id: 'g_he', name: 'G-12 High Explosive', type: TYPE.GRENADE, rarity: RARITY.COMMON, tags: [TAGS.EXPLOSIVE] },
  { id: 'g_frag', name: 'G-6 Frag', type: TYPE.GRENADE, rarity: RARITY.COMMON, tags: [TAGS.EXPLOSIVE] },
  { id: 'g_impact', name: 'G-16 Impact', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE] },
  { id: 'g_stun', name: 'G-23 Stun', type: TYPE.GRENADE, rarity: RARITY.RARE, tags: [TAGS.STUN] },
  { id: 'g_inc', name: 'G-10 Incendiary', type: TYPE.GRENADE, rarity: RARITY.COMMON, tags: [TAGS.FIRE] },
  { id: 'g_inc_imp', name: 'G-13 Incendiary Impact', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE] },
  { id: 'g_smoke', name: 'G-3 Smoke', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [TAGS.SMOKE] },
  { id: 'g_thermite', name: 'Thermite Grenade', type: TYPE.GRENADE, rarity: RARITY.RARE, tags: [TAGS.AT, TAGS.FIRE] },
  { id: 'g_gas', name: 'Gas Grenade', type: TYPE.GRENADE, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'g_knife', name: 'Throwing Knife', type: TYPE.GRENADE, rarity: RARITY.COMMON, tags: [] },

  // --- STRATAGEMS (Orbitals) ---
  { id: 'st_ops', name: 'Orbital Precision Strike', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.AT, TAGS.PRECISION] },
  { id: 'st_gatling', name: 'Orbital Gatling Barrage', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [] },
  { id: 'st_airburst', name: 'Orbital Airburst Strike', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [] },
  { id: 'st_120', name: 'Orbital 120mm HE Barrage', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE] },
  { id: 'st_380', name: 'Orbital 380mm HE Barrage', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.EXPLOSIVE, TAGS.AT] },
  { id: 'st_walking', name: 'Orbital Walking Barrage', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE] },
  { id: 'st_laser', name: 'Orbital Laser', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.AT, TAGS.FIRE] },
  { id: 'st_railcannon', name: 'Orbital Railcannon Strike', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.AT, TAGS.PRECISION] },
  { id: 'st_napalm_o', name: 'Orbital Napalm Barrage', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.FIRE] },
  { id: 'st_gas_o', name: 'Orbital Gas Strike', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [] },
  { id: 'st_ems_o', name: 'Orbital EMS Strike', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.STUN] },
  { id: 'st_smoke_o', name: 'Orbital Smoke Strike', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.SMOKE] },

  // --- STRATAGEMS (Eagle) ---
  { id: 'st_e_strafe', name: 'Eagle Strafing Run', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [] },
  { id: 'st_e_airstrike', name: 'Eagle Airstrike', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE, TAGS.AT] },
  { id: 'st_e_cluster', name: 'Eagle Cluster Bomb', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'st_e_napalm', name: 'Eagle Napalm Airstrike', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE] },
  { id: 'st_e_smoke', name: 'Eagle Smoke Strike', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.SMOKE] },
  { id: 'st_e_rockets', name: 'Eagle 110mm Rocket Pods', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.AT, TAGS.PRECISION] },
  { id: 'st_e_500', name: 'Eagle 500kg Bomb', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.AT, TAGS.EXPLOSIVE] },

  // --- STRATAGEMS (Support Weapons) ---
  { id: 'st_mg43', name: 'Machine Gun MG-43', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.SUPPORT_WEAPON] },
  { id: 'st_amr', name: 'Anti-Materiel Rifle', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.PRECISION] },
  { id: 'st_stalwart', name: 'Stalwart', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.SUPPORT_WEAPON] },
  { id: 'st_eat', name: 'EAT-17 Expendable Anti-Tank', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT] },
  { id: 'st_rr', name: 'Recoilless Rifle', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT, TAGS.BACKPACK] },
  { id: 'st_flame', name: 'Flamethrower', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.FIRE] },
  { id: 'st_ac', name: 'Autocannon AC-8', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON, TAGS.EXPLOSIVE, TAGS.BACKPACK] },
  { id: 'st_railgun', name: 'Railgun', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT, TAGS.PRECISION] },
  { id: 'st_spear', name: 'Spear', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT, TAGS.BACKPACK] },
  { id: 'st_laser_can', name: 'Laser Cannon', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON] },
  { id: 'st_arc', name: 'Arc Thrower', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON] },
  { id: 'st_quasar', name: 'Quasar Cannon', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT] },
  { id: 'st_hmg', name: 'Heavy Machine Gun', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON] },
  { id: 'st_commando', name: 'Commando', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.SUPPORT_WEAPON, TAGS.AT] },
  { id: 'st_sterilizer', name: 'Sterilizer', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.SUPPORT_WEAPON] },

  // --- STRATAGEMS (Backpacks) ---
  { id: 'st_bp_jump', name: 'Jump Pack', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK] },
  { id: 'st_bp_supply', name: 'Supply Pack', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK] },
  { id: 'st_bp_rover', name: 'Guard Dog Rover', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK, TAGS.FIRE] },
  { id: 'st_bp_dog', name: 'Guard Dog', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.BACKPACK] },
  { id: 'st_bp_shield', name: 'Shield Generator Pack', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.BACKPACK, TAGS.DEFENSIVE] },
  { id: 'st_bp_ballistic', name: 'Ballistic Shield', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.BACKPACK, TAGS.DEFENSIVE] },

  // --- STRATAGEMS (Sentries) ---
  { id: 'st_s_mg', name: 'Machine Gun Sentry', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.DEFENSIVE] },
  { id: 'st_s_gat', name: 'Gatling Sentry', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.DEFENSIVE] },
  { id: 'st_s_mortar', name: 'Mortar Sentry', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.EXPLOSIVE] },
  { id: 'st_s_ems', name: 'EMS Mortar Sentry', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.STUN] },
  { id: 'st_s_ac', name: 'Autocannon Sentry', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.AT] },
  { id: 'st_s_rocket', name: 'Rocket Sentry', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.AT] },
  { id: 'st_s_tesla', name: 'Tesla Tower', type: TYPE.STRATAGEM, rarity: RARITY.RARE, tags: [TAGS.DEFENSIVE] },
  { id: 'st_s_mines', name: 'Anti-Personnel Mines', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.DEFENSIVE] },
  { id: 'st_s_inc_mines', name: 'Incendiary Mines', type: TYPE.STRATAGEM, rarity: RARITY.COMMON, tags: [TAGS.DEFENSIVE, TAGS.FIRE] },
  { id: 'st_s_at_mines', name: 'Anti-Tank Mines', type: TYPE.STRATAGEM, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE, TAGS.AT] },

  // --- ARMOR (Light) ---
  { id: 'a_sc37', name: 'SC-37 Legionnaire', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [] },
  { id: 'a_sc34', name: 'SC-34 Infiltrator', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [] },
  { id: 'a_sc30', name: 'SC-30 Trailblazer Scout', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [] },
  { id: 'a_ce74', name: 'CE-74 Breaker', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [] },
  { id: 'a_fs38', name: 'FS-38 Eradicator', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE] },
  { id: 'a_b08', name: 'B-08 Light Gunner', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [] },
  { id: 'a_ds10', name: 'DS-10 Big Game Hunter', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'a_cm21', name: 'CM-21 Trench Paramedic', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'a_ex00', name: 'EX-00 Prototype X', type: TYPE.ARMOR, rarity: RARITY.RARE, tags: [] },
  { id: 'a_ph9', name: 'PH-9 Predator', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [] },

  // --- ARMOR (Medium) ---
  { id: 'a_b01', name: 'B-01 Tactical', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [] },
  { id: 'a_ce35', name: 'CE-35 Trench Engineer', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [] },
  { id: 'a_cm09', name: 'CM-09 Bonesnapper', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [] },
  { id: 'a_dp40', name: 'DP-40 Hero of the Federation', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'a_sa04', name: 'SA-04 Combat Technician', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'a_sa25', name: 'SA-25 Steel Trooper', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'a_b24', name: 'B-24 Enforcer', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE] },
  { id: 'a_ce81', name: 'CE-81 Juggernaut', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'a_ex03', name: 'EX-03 Prototype 3', type: TYPE.ARMOR, rarity: RARITY.RARE, tags: [] },
  { id: 'a_cw9', name: 'CW-9 White Wolf', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [] },

  // --- ARMOR (Heavy) ---
  { id: 'a_fs05', name: 'FS-05 Marksman', type: TYPE.ARMOR, rarity: RARITY.COMMON, tags: [TAGS.DEFENSIVE] },
  { id: 'a_fs23', name: 'FS-23 Battle Master', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE] },
  { id: 'a_sa32', name: 'SA-32 Dynamo', type: TYPE.ARMOR, rarity: RARITY.RARE, tags: [] },
  { id: 'a_b27', name: 'B-27 Fortified Commando', type: TYPE.ARMOR, rarity: RARITY.RARE, tags: [TAGS.DEFENSIVE] },
  { id: 'a_fs61', name: 'FS-61 Dreadnought', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.DEFENSIVE] },
  { id: 'a_cm17', name: 'CM-17 Butcher', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'a_fs55', name: 'FS-55 Devastator', type: TYPE.ARMOR, rarity: RARITY.RARE, tags: [TAGS.DEFENSIVE] },
  { id: 'a_ce64', name: 'CE-64 Grenadier', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.EXPLOSIVE] },
  { id: 'a_cw36', name: 'CW-36 Winter Warrior', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'a_i44', name: 'I-44 Salamander', type: TYPE.ARMOR, rarity: RARITY.UNCOMMON, tags: [TAGS.FIRE] },

  // --- BOOSTERS ---
  { id: 'b_space', name: 'Hellpod Space Optimization', type: TYPE.BOOSTER, rarity: RARITY.RARE, tags: [] },
  { id: 'b_vitality', name: 'Vitality Enhancement', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'b_uav', name: 'UAV Recon', type: TYPE.BOOSTER, rarity: RARITY.COMMON, tags: [] },
  { id: 'b_stamina', name: 'Stamina Enhancement', type: TYPE.BOOSTER, rarity: RARITY.RARE, tags: [] },
  { id: 'b_muscle', name: 'Muscle Enhancement', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'b_reinforce', name: 'Reinforcement Budget', type: TYPE.BOOSTER, rarity: RARITY.COMMON, tags: [] },
  { id: 'b_local', name: 'Localization Confusion', type: TYPE.BOOSTER, rarity: RARITY.UNCOMMON, tags: [] },
  { id: 'b_shock', name: 'Motivational Shocks', type: TYPE.BOOSTER, rarity: RARITY.COMMON, tags: [] },
  { id: 'b_infusion', name: 'Experimental Infusion', type: TYPE.BOOSTER, rarity: RARITY.RARE, tags: [] },
  { id: 'b_firepod', name: 'Firebomb Hellpods', type: TYPE.BOOSTER, rarity: RARITY.COMMON, tags: [TAGS.FIRE] }
];

// --- INITIAL STATE & HELPER LOGIC ---

const STARTING_LOADOUT = {
  primary: null,
  secondary: 's_peacemaker',
  grenade: 'g_he',
  armor: 'a_b01',
  booster: null,
  stratagems: [null, null, null, null]
};

const DIFFICULTY_CONFIG = [
  { level: 1, name: 'Trivial', reqAT: false },
  { level: 2, name: 'Easy', reqAT: false },
  { level: 3, name: 'Medium', reqAT: false }, // Med Penetration ideally, but app focuses on AT check
  { level: 4, name: 'Challenging', reqAT: true }, // Chargers/Hulks appear
  { level: 5, name: 'Hard', reqAT: true },
  { level: 6, name: 'Extreme', reqAT: true },
  { level: 7, name: 'Suicide Mission', reqAT: true },
  { level: 8, name: 'Impossible', reqAT: true },
  { level: 9, name: 'Helldive', reqAT: true },
  { level: 10, name: 'Super Helldive', reqAT: true }
];

export default function HelldiversRoguelite() {
  // --- STATE ---
  const [phase, setPhase] = useState('MENU'); // MENU, CUSTOM_SETUP, DASHBOARD, DRAFT, EVENT, GAMEOVER
  const [gameConfig, setGameConfig] = useState({ playerCount: 1, faction: FACTION.BUGS, starRating: 3, globalUniqueness: true, burnCards: true, customStart: false });
  const [currentDiff, setCurrentDiff] = useState(1);
  const [requisition, setRequisition] = useState(0); // Reroll currency
  const [lives, setLives] = useState(3);
  const [burnedCards, setBurnedCards] = useState([]); // Cards that have been seen (for burn mode)
  const [customSetup, setCustomSetup] = useState({ difficulty: 1, loadouts: [] }); // For custom start mode
  
  // Players array: [{ id: 1, loadout: {...}, inventory: [...] }]
  const [players, setPlayers] = useState([]);
  
  // Draft State
  const [draftState, setDraftState] = useState({
    activePlayerIndex: 0,
    roundCards: [],
    isRerolling: false,
    pendingStratagem: null // Holds stratagem waiting for slot selection
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [disabledWarbonds, setDisabledWarbonds] = useState([]); // For future expansion logic
  const [selectedPlayer, setSelectedPlayer] = useState(0); // For custom setup phase
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventPlayerChoice, setEventPlayerChoice] = useState(null);
  
  // Load game state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('helldraftersGameState');
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.phase && state.phase !== 'MENU') {
          setPhase(state.phase);
          setGameConfig(state.gameConfig || { playerCount: 1, faction: FACTION.BUGS, starRating: 3, globalUniqueness: false, burnCards: false });
          setCurrentDiff(state.currentDiff || 1);
          setRequisition(state.requisition || 0);
          setLives(state.lives || 3);
          setBurnedCards(state.burnedCards || []);
          setPlayers(state.players || []);
          setDraftState(state.draftState || { activePlayerIndex: 0, roundCards: [], isRerolling: false, pendingStratagem: null });
          setEventsEnabled(state.eventsEnabled || false);
          setCurrentEvent(state.currentEvent || null);
          setEventPlayerChoice(state.eventPlayerChoice || null);
        }
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (phase !== 'MENU') {
      try {
        const state = {
          phase,
          gameConfig,
          currentDiff,
          requisition,
          lives,
          burnedCards,
          players,
          draftState,
          eventsEnabled,
          currentEvent,
          eventPlayerChoice
        };
        localStorage.setItem('helldraftersGameState', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save game state:', error);
      }
    } else {
      // Clear saved state when returning to menu
      localStorage.removeItem('helldraftersGameState');
    }
  }, [phase, gameConfig, currentDiff, requisition, lives, burnedCards, players, draftState]);
  
  // Calculate draft hand size based on star rating (1-6 stars -> 2-4 cards)
  const getDraftHandSize = () => {
    const rating = gameConfig.starRating;
    if (rating <= 2) return 2;
    if (rating <= 4) return 3;
    return 4;
  };

  // --- SAVE/LOAD FUNCTIONS ---

  const exportGameState = () => {
    const state = {
      phase,
      gameConfig,
      currentDiff,
      requisition,
      lives,
      burnedCards,
      players,
      draftState,
      eventsEnabled,
      currentEvent,
      eventPlayerChoice,
      customSetup,
      selectedPlayer,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `helldrafters-save-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importGameState = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result);
        
        // Validate the state has required properties
        if (!state.phase || !state.gameConfig || !state.players) {
          alert('Invalid save file format');
          return;
        }

        // Restore all state
        setPhase(state.phase);
        setGameConfig(state.gameConfig);
        setCurrentDiff(state.currentDiff || 1);
        setRequisition(state.requisition || 0);
        setLives(state.lives || 3);
        setBurnedCards(state.burnedCards || []);
        setPlayers(state.players || []);
        setDraftState(state.draftState || { activePlayerIndex: 0, roundCards: [], isRerolling: false, pendingStratagem: null });
        setEventsEnabled(state.eventsEnabled !== undefined ? state.eventsEnabled : true);
        setCurrentEvent(state.currentEvent || null);
        setEventPlayerChoice(state.eventPlayerChoice || null);
        setCustomSetup(state.customSetup || { difficulty: 1, loadouts: [] });
        setSelectedPlayer(state.selectedPlayer || 0);

        alert('Game loaded successfully!');
      } catch (error) {
        console.error('Failed to load game:', error);
        alert('Failed to load save file. File may be corrupted.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // --- INITIALIZATION ---

  const startGame = () => {
    if (gameConfig.customStart) {
      // Go to custom setup screen
      const initialLoadouts = Array.from({ length: gameConfig.playerCount }, () => ({
        primary: STARTING_LOADOUT.primary,
        secondary: STARTING_LOADOUT.secondary,
        grenade: STARTING_LOADOUT.grenade,
        armor: STARTING_LOADOUT.armor,
        booster: STARTING_LOADOUT.booster,
        stratagems: [...STARTING_LOADOUT.stratagems]
      }));
      setCustomSetup({ difficulty: 1, loadouts: initialLoadouts });
      setPhase('CUSTOM_SETUP');
    } else {
      // Normal start
      const newPlayers = Array.from({ length: gameConfig.playerCount }, (_, i) => ({
        id: i + 1,
        name: `Helldiver ${i + 1}`,
        loadout: { 
          primary: STARTING_LOADOUT.primary,
          secondary: STARTING_LOADOUT.secondary,
          grenade: STARTING_LOADOUT.grenade,
          armor: STARTING_LOADOUT.armor,
          booster: STARTING_LOADOUT.booster,
          stratagems: [...STARTING_LOADOUT.stratagems]
        },
        inventory: Object.values(STARTING_LOADOUT).flat().filter(id => id !== null)
      }));
      setPlayers(newPlayers);
      setCurrentDiff(1);
      setRequisition(0); // Start with 0, earn 1 per mission
      setLives(3);
      setBurnedCards([]);
      setPhase('DASHBOARD');
    }
  };

  const startGameFromCustomSetup = () => {
    const newPlayers = customSetup.loadouts.map((loadout, i) => ({
      id: i + 1,
      name: `Helldiver ${i + 1}`,
      loadout: { ...loadout },
      inventory: Object.values(loadout).flat().filter(id => id !== null)
    }));
    setPlayers(newPlayers);
    setCurrentDiff(customSetup.difficulty);
    setRequisition(0);
    setLives(3);
    setBurnedCards([]);
    setPhase('DASHBOARD');
  };

  // --- CORE LOGIC: THE DRAFT DIRECTOR ---

  const getItemById = (id) => MASTER_DB.find(item => item.id === id);

  const getWeightedPool = (player, difficulty) => {
    // 1. Filter out already owned items and boosters (boosters only come from events)
    let candidates = MASTER_DB.filter(item => !player.inventory.includes(item.id) && item.type !== TYPE.BOOSTER);

    // 2. Filter out burned cards (if burn mode enabled)
    if (gameConfig.burnCards) {
      candidates = candidates.filter(item => !burnedCards.includes(item.id));
    }

    // 3. Filter by global uniqueness (if enabled)
    if (gameConfig.globalUniqueness) {
      const allPlayerInventories = players.flatMap(p => p.inventory);
      candidates = candidates.filter(item => !allPlayerInventories.includes(item.id));
    }

    // 4. Faction Weighting
    // If Bugs -> Boost Fire items
    // If Bots -> Boost Precision/Explosive Resistance items (simulated by boosting Precision weapons)
    // We assign a dynamic weight to each candidate
    const weightedCandidates = candidates.map(item => {
      let weight = 10; // Base weight

      // Rarity Weights
      if (item.rarity === RARITY.COMMON) weight += 50;
      if (item.rarity === RARITY.UNCOMMON) weight += 25;
      if (item.rarity === RARITY.RARE) weight += 5;

      // Faction Synergy
      if (gameConfig.faction === FACTION.BUGS && item.tags.includes(TAGS.FIRE)) weight += 30;
      if (gameConfig.faction === FACTION.BOTS && item.tags.includes(TAGS.PRECISION)) weight += 20;
      if (gameConfig.faction === FACTION.SQUIDS && item.tags.includes(TAGS.STUN)) weight += 20;

      // Smart Logic: Need Anti-Tank?
      const playerHasAT = player.inventory.some(invId => {
        const i = getItemById(invId);
        return i && i.tags.includes(TAGS.AT);
      });

      // CRITICAL SOFT-LOCK PREVENTION
      // If we are approaching Diff 4+ and have no AT, massively boost AT weights
      if (difficulty >= 3 && !playerHasAT && item.tags.includes(TAGS.AT)) {
        weight += 500; 
      }

      // Smart Logic: Composition Balance
      // If player has a secondary, reduce weight of secondaries heavily
      // to prevent "3 secondary" hands, but don't eliminate them (upgrades exist)
      if (player.loadout.secondary && item.type === TYPE.SECONDARY) weight = Math.max(1, weight - 40);
      
      // If player has backpack, reduce backpack weight
      const hasBackpack = player.loadout.stratagems.some(sId => {
        const s = getItemById(sId);
        return s && s.tags.includes(TAGS.BACKPACK);
      });
      if (hasBackpack && item.tags.includes(TAGS.BACKPACK)) weight = 0; // Hard lock: Only 1 backpack usually allowed/needed

      return { item, weight };
    });

    return weightedCandidates.filter(c => c.weight > 0);
  };

  const generateDraftHand = (playerIdx) => {
    // Safety check: ensure player exists
    if (!players || !players[playerIdx]) {
      console.warn('Player not found for draft generation');
      return [];
    }
    
    const player = players[playerIdx];
    const pool = getWeightedPool(player, currentDiff);
    const handSize = getDraftHandSize();
    
    // Select cards based on weight
    const hand = [];
    for (let i = 0; i < handSize; i++) {
      if (pool.length === 0) break;
      
      const totalWeight = pool.reduce((sum, c) => sum + c.weight, 0);
      
      // Safety check: if total weight is 0, we can't select anything
      if (totalWeight === 0) {
        console.warn('Pool has no valid weighted items');
        break;
      }
      
      let randomNum = Math.random() * totalWeight;
      
      for (let j = 0; j < pool.length; j++) {
        const poolItem = pool[j];
        // Safety check: ensure pool item exists and has valid structure
        if (!poolItem || !poolItem.item) {
          console.warn('Invalid pool item at index', j);
          continue;
        }
        
        randomNum -= poolItem.weight;
        if (randomNum <= 0) {
          hand.push(poolItem.item);
          // Add to burned cards if burn mode enabled
          if (gameConfig.burnCards) {
            setBurnedCards(prev => [...prev, poolItem.item.id]);
          }
          // Remove from pool to avoid duplicates in same hand
          pool.splice(j, 1); 
          break;
        }
      }
    }
    return hand;
  };

  const startDraftPhase = () => {
    // Safety check: ensure players exist before starting draft
    if (!players || players.length === 0) {
      console.error('Cannot start draft phase: no players available');
      return;
    }
    
    setDraftState({
      activePlayerIndex: 0,
      roundCards: generateDraftHand(0),
      isRerolling: false,
      pendingStratagem: null
    });
    setPhase('DRAFT');
  };

  const handleDraftPick = (item) => {
    const currentPlayerIdx = draftState.activePlayerIndex;
    const updatedPlayers = [...players];
    const player = updatedPlayers[currentPlayerIdx];

    // Special handling for stratagems when slots are full
    if (item.type === TYPE.STRATAGEM) {
      const emptySlot = player.loadout.stratagems.indexOf(null);
      if (emptySlot === -1) {
        // All slots full - show replacement UI
        setDraftState(prev => ({
          ...prev,
          pendingStratagem: item
        }));
        return; // Don't proceed with pick yet
      }
    }

    // Add to inventory
    player.inventory.push(item.id);

    // Auto-Equip Logic
    if (item.type === TYPE.PRIMARY) player.loadout.primary = item.id;
    if (item.type === TYPE.SECONDARY) player.loadout.secondary = item.id;
    if (item.type === TYPE.GRENADE) player.loadout.grenade = item.id;
    if (item.type === TYPE.ARMOR) player.loadout.armor = item.id;
    if (item.type === TYPE.BOOSTER) player.loadout.booster = item.id;
    if (item.type === TYPE.STRATAGEM) {
      // Find empty slot (we know it exists because we checked above)
      const emptySlot = player.loadout.stratagems.indexOf(null);
      player.loadout.stratagems[emptySlot] = item.id;
    }

    setPlayers(updatedPlayers);

    // Next player or Finish
    if (currentPlayerIdx < gameConfig.playerCount - 1) {
      const nextIdx = currentPlayerIdx + 1;
      setDraftState({
        activePlayerIndex: nextIdx,
        roundCards: generateDraftHand(nextIdx),
        isRerolling: false,
        pendingStratagem: null
      });
    } else {
      // Draft complete - check for event
      if (eventsEnabled && Math.random() < 0.4) { // 40% chance
        const event = selectRandomEvent(currentDiff, players.length > 1);
        if (event) {
          setCurrentEvent(event);
          setEventPlayerChoice(null);
          setPhase('EVENT');
          return;
        }
      }
      setPhase('DASHBOARD');
    }
  };

  const handleStratagemReplacement = (slotIndex) => {
    const currentPlayerIdx = draftState.activePlayerIndex;
    const updatedPlayers = [...players];
    const player = updatedPlayers[currentPlayerIdx];
    const item = draftState.pendingStratagem;

    // Add to inventory
    player.inventory.push(item.id);
    
    // Replace the selected slot
    player.loadout.stratagems[slotIndex] = item.id;
    
    setPlayers(updatedPlayers);

    // Next player or Finish
    if (currentPlayerIdx < gameConfig.playerCount - 1) {
      const nextIdx = currentPlayerIdx + 1;
      setDraftState({
        activePlayerIndex: nextIdx,
        roundCards: generateDraftHand(nextIdx),
        isRerolling: false,
        pendingStratagem: null
      });
    } else {
      // Draft complete - check for event
      if (eventsEnabled && Math.random() < 0.4) { // 40% chance
        const event = selectRandomEvent(currentDiff, players.length > 1);
        if (event) {
          setCurrentEvent(event);
          setEventPlayerChoice(null);
          setPhase('EVENT');
          return;
        }
      }
      setPhase('DASHBOARD');
    }
  };

  const rerollDraft = (cost) => {
    if (requisition < cost) return;
    setRequisition(prev => prev - cost);
    setDraftState(prev => ({
      ...prev,
      roundCards: generateDraftHand(prev.activePlayerIndex)
    }));
  };

  const removeCardFromDraft = (cardToRemove) => {
    // Remove single card and replace it with a new one
    const player = players[draftState.activePlayerIndex];
    const pool = getWeightedPool(player, currentDiff);
    
    // Filter out cards already in the current hand
    const availablePool = pool.filter(c => !draftState.roundCards.some(card => card.id === c.item.id));
    
    if (availablePool.length === 0) {
      alert('No more unique cards available!');
      return;
    }
    
    // Pick a new random card
    const totalWeight = availablePool.reduce((sum, c) => sum + c.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let newCard = null;
    
    for (let j = 0; j < availablePool.length; j++) {
      const poolItem = availablePool[j];
      if (!poolItem || !poolItem.item) continue;
      
      randomNum -= poolItem.weight;
      if (randomNum <= 0) {
        newCard = poolItem.item;
        break;
      }
    }
    
    if (newCard) {
      // Add to burned cards if burn mode enabled
      if (gameConfig.burnCards) {
        setBurnedCards(prev => [...prev, newCard.id]);
      }
      
      // Replace the card
      setDraftState(prev => ({
        ...prev,
        roundCards: prev.roundCards.map(card => card.id === cardToRemove.id ? newCard : card)
      }));
    }
  };

  // --- UI COMPONENTS ---

  const RarityBadge = ({ rarity }) => {
    const colors = {
      [RARITY.COMMON]: { bg: '#6b7280', color: 'white' },
      [RARITY.UNCOMMON]: { bg: '#22c55e', color: 'black' },
      [RARITY.RARE]: { bg: '#f97316', color: 'black' },
      [RARITY.LEGENDARY]: { bg: '#9333ea', color: 'white' }
    };
    const style = colors[rarity] || colors[RARITY.COMMON];
    return <span style={{
      fontSize: '10px',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: style.bg,
      color: style.color
    }}>{rarity}</span>;
  };

  const ItemCard = ({ item, onSelect, onRemove }) => (
    <div 
      style={{
        position: 'relative',
        backgroundColor: '#283548',
        border: '2px solid rgba(100, 116, 139, 0.5)',
        padding: '16px',
        borderRadius: '8px',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        height: '256px'
      }}
    >
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item);
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)'}
          title="Remove this card"
        >
          ×
        </button>
      )}
      <div 
        onClick={() => onSelect && onSelect(item)}
        style={{
          cursor: onSelect ? 'pointer' : 'default',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: onRemove ? '32px' : '0'
        }}
        onMouseEnter={(e) => onSelect && (e.currentTarget.parentElement.style.borderColor = '#F5C642')}
        onMouseLeave={(e) => onSelect && (e.currentTarget.parentElement.style.borderColor = 'rgba(100, 116, 139, 0.5)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <RarityBadge rarity={item.rarity} />
          <div style={{ color: '#F5C642', fontSize: '12px', fontFamily: 'monospace', marginRight: onRemove ? '8px' : '0' }}>{item.type}</div>
        </div>
        
        <h3 style={{ color: '#F5C642', fontWeight: 'bold', fontSize: '18px', lineHeight: '1.2', marginBottom: '8px' }}>{item.name}</h3>
        
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
            {item.tags.map(tag => (
              <span key={tag} style={{
                fontSize: '10px',
                backgroundColor: 'rgba(51, 65, 85, 0.5)',
                color: '#cbd5e1',
                padding: '2px 4px',
                borderRadius: '2px',
                border: '1px solid rgba(71, 85, 105, 0.5)'
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(71, 85, 105, 0.5)', textAlign: 'center' }}>
          <span style={{ color: '#F5C642', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px' }}>
            REQUISITION
          </span>
        </div>
      </div>
    </div>
  );

  // --- RENDER PHASES ---

  if (phase === 'GAMEOVER') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1419', padding: '24px' }}>
        <div style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontSize: '80px', marginBottom: '16px' }}>💀</div>
            <h1 style={{ fontSize: '64px', fontWeight: '900', color: '#ef4444', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              KIA
            </h1>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#94a3b8', margin: '0 0 8px 0' }}>
              MISSION FAILED
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.6', margin: '0' }}>
              All Helldivers have been eliminated.
              <br/>
              Super Earth is disappointed in your performance.
            </p>
          </div>

          <div style={{ backgroundColor: '#1a2332', padding: '24px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '32px' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase' }}>
              Final Stats
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Difficulty Reached</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F5C642' }}>{currentDiff}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Requisition Earned</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F5C642' }}>{requisition}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Squad Size</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{players.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Theater</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{gameConfig.faction}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setPhase('MENU')}
            style={{
              width: '100%',
              padding: '20px',
              backgroundColor: '#F5C642',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '900',
              fontSize: '18px',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffd95a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5C642'}
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'MENU') {
    return (
      <div style={{ minHeight: '100vh', padding: '80px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '72px', fontWeight: '900', color: '#F5C642', margin: '0 0 0 0', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            HELLDRAFTERS
          </h1>
          <div style={{ background: 'linear-gradient(to right, #5a5142, #6b6052)', padding: '12px', marginBottom: '60px', maxWidth: '620px', margin: '0 auto 60px auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>
              Roguelite Director
            </h2>
          </div>
          
          <div style={{ backgroundColor: '#283548', padding: '40px', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            
            
            {/* Faction */}
            <div style={{ marginBottom: '40px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px' }}>
                Select Theater of War
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {Object.values(FACTION).map(f => (
                  <button 
                    key={f}
                    onClick={() => setGameConfig({...gameConfig, faction: f})}
                    style={{
                      padding: '16px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s',
                      fontSize: '14px',
                      letterSpacing: '1px',
                      backgroundColor: gameConfig.faction === f ? 'rgba(245, 198, 66, 0.05)' : 'transparent',
                      color: gameConfig.faction === f ? '#F5C642' : '#64748b',
                      border: gameConfig.faction === f ? '2px solid #F5C642' : '1px solid rgba(100, 116, 139, 0.5)',
                      cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Squad Size */}
            <div style={{ marginBottom: '40px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px' }}>
                Squad Size
              </label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                {[1, 2, 3, 4].map(n => (
                  <button 
                    key={n}
                    onClick={() => setGameConfig({...gameConfig, playerCount: n})}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '4px',
                      fontWeight: '900',
                      fontSize: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      backgroundColor: gameConfig.playerCount === n ? '#F5C642' : 'transparent',
                      color: gameConfig.playerCount === n ? 'black' : '#64748b',
                      border: gameConfig.playerCount === n ? '2px solid #F5C642' : '1px solid rgba(100, 116, 139, 0.5)',
                      cursor: 'pointer'
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Mode Options */}
            <div style={{ marginBottom: '40px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
                Game Mode Options
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.globalUniqueness ? 'rgba(245, 198, 66, 0.1)' : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
                  <input 
                    type="checkbox" 
                    checked={gameConfig.globalUniqueness}
                    onChange={(e) => setGameConfig({...gameConfig, globalUniqueness: e.target.checked})}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: '#F5C642', fontWeight: 'bold', fontSize: '14px' }}>Global Card Uniqueness</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Cards drafted by one player cannot appear for other players</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.burnCards ? 'rgba(245, 198, 66, 0.1)' : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
                  <input 
                    type="checkbox" 
                    checked={gameConfig.burnCards}
                    onChange={(e) => setGameConfig({...gameConfig, burnCards: e.target.checked})}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: '#F5C642', fontWeight: 'bold', fontSize: '14px' }}>Burn Cards After Viewing</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Once a card appears in a draft, it cannot appear again this run</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.customStart ? 'rgba(245, 198, 66, 0.1)' : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
                  <input 
                    type="checkbox" 
                    checked={gameConfig.customStart}
                    onChange={(e) => setGameConfig({...gameConfig, customStart: e.target.checked})}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: '#F5C642', fontWeight: 'bold', fontSize: '14px' }}>Custom Start Mode</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Choose starting difficulty and loadouts for each player</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: eventsEnabled ? 'rgba(245, 198, 66, 0.1)' : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
                  <input 
                    type="checkbox" 
                    checked={eventsEnabled}
                    onChange={(e) => setEventsEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: '#F5C642', fontWeight: 'bold', fontSize: '14px' }}>Enable Events</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Random high-risk, high-reward events between missions</div>
                  </div>
                </label>
              </div>
            </div>

            <button 
              onClick={startGame}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#F5C642',
                color: 'black',
                fontWeight: '900',
                fontSize: '18px',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7d058'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5C642'}
            >
              Initialize Operation
            </button>

            {/* Save/Load Section */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(100, 116, 139, 0.3)' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px', textAlign: 'center' }}>
                Save / Load Game
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={exportGameState}
                  style={{
                    padding: '12px',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(100, 116, 139, 0.5)',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#F5C642';
                    e.currentTarget.style.color = '#F5C642';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  Export Game
                </button>
                <label
                  style={{
                    padding: '12px',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(100, 116, 139, 0.5)',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#F5C642';
                    e.currentTarget.style.color = '#F5C642';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  Import Game
                  <input
                    type="file"
                    accept=".json"
                    onChange={importGameState}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', textAlign: 'center', margin: '8px 0 0 0' }}>
                Export saves your current game to a file. Import loads a saved game.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'CUSTOM_SETUP') {
    const updateLoadoutSlot = (playerIdx, slotType, itemId) => {
      const newLoadouts = [...customSetup.loadouts];
      if (slotType === 'stratagem') {
        const slotIndex = parseInt(itemId.split('_')[1]);
        const stratagems = [...newLoadouts[playerIdx].stratagems];
        stratagems[slotIndex] = itemId.split('_')[0];
        newLoadouts[playerIdx] = { ...newLoadouts[playerIdx], stratagems };
      } else {
        newLoadouts[playerIdx] = { ...newLoadouts[playerIdx], [slotType]: itemId };
      }
      setCustomSetup({ ...customSetup, loadouts: newLoadouts });
    };

    const currentLoadout = customSetup.loadouts[selectedPlayer];
    const itemsByType = {
      primary: MASTER_DB.filter(i => i.type === TYPE.PRIMARY),
      secondary: MASTER_DB.filter(i => i.type === TYPE.SECONDARY),
      grenade: MASTER_DB.filter(i => i.type === TYPE.GRENADE),
      armor: MASTER_DB.filter(i => i.type === TYPE.ARMOR),
      booster: MASTER_DB.filter(i => i.type === TYPE.BOOSTER),
      stratagem: MASTER_DB.filter(i => i.type === TYPE.STRATAGEM)
    };

    return (
      <div style={{ minHeight: '100vh', padding: '24px', backgroundColor: '#1a2332' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#F5C642', margin: '0 0 16px 0' }}>
              CUSTOM START SETUP
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Configure starting difficulty and loadouts</p>
          </div>

          {/* Difficulty Selection */}
          <div style={{ backgroundColor: '#283548', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>
              Starting Difficulty
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px' }}>
              {DIFFICULTY_CONFIG.map(diff => (
                <button
                  key={diff.level}
                  onClick={() => setCustomSetup({ ...customSetup, difficulty: diff.level })}
                  style={{
                    padding: '12px 8px',
                    backgroundColor: customSetup.difficulty === diff.level ? '#F5C642' : 'transparent',
                    color: customSetup.difficulty === diff.level ? 'black' : '#cbd5e1',
                    border: customSetup.difficulty === diff.level ? '2px solid #F5C642' : '1px solid rgba(100, 116, 139, 0.5)',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title={diff.name}
                >
                  {diff.level}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '8px', textAlign: 'center', color: '#F5C642', fontSize: '14px' }}>
              {DIFFICULTY_CONFIG[customSetup.difficulty - 1]?.name}
            </div>
          </div>

          {/* Player Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {customSetup.loadouts.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedPlayer(i)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: selectedPlayer === i ? '#F5C642' : '#283548',
                  color: selectedPlayer === i ? 'black' : '#cbd5e1',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Helldiver {i + 1}
              </button>
            ))}
          </div>

          {/* Loadout Editor */}
          <div style={{ backgroundColor: '#283548', padding: '24px', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            <h3 style={{ color: '#F5C642', marginBottom: '16px', fontSize: '18px' }}>Loadout Configuration</h3>
            
            {/* Primary */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Primary</label>
              <select
                value={currentLoadout.primary || ''}
                onChange={(e) => updateLoadoutSlot(selectedPlayer, 'primary', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: '#F5C642',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {itemsByType.primary.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </select>
            </div>

            {/* Secondary */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Secondary</label>
              <select
                value={currentLoadout.secondary || ''}
                onChange={(e) => updateLoadoutSlot(selectedPlayer, 'secondary', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {itemsByType.secondary.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </select>
            </div>

            {/* Grenade */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Grenade</label>
              <select
                value={currentLoadout.grenade || ''}
                onChange={(e) => updateLoadoutSlot(selectedPlayer, 'grenade', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: '#cbd5e1',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {itemsByType.grenade.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </select>
            </div>

            {/* Armor */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Armor</label>
              <select
                value={currentLoadout.armor || ''}
                onChange={(e) => updateLoadoutSlot(selectedPlayer, 'armor', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: '#cbd5e1',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {itemsByType.armor.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </select>
            </div>

            {/* Booster */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Booster</label>
              <select
                value={currentLoadout.booster || ''}
                onChange={(e) => updateLoadoutSlot(selectedPlayer, 'booster', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: '#cbd5e1',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {itemsByType.booster.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </select>
            </div>

            {/* Stratagems */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Stratagems</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[0, 1, 2, 3].map(slotIdx => (
                  <select
                    key={slotIdx}
                    value={currentLoadout.stratagems[slotIdx] || ''}
                    onChange={(e) => {
                      const newStratagems = [...currentLoadout.stratagems];
                      newStratagems[slotIdx] = e.target.value || null;
                      updateLoadoutSlot(selectedPlayer, 'stratagems', newStratagems);
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: '#1f2937',
                      color: 'white',
                      border: '1px solid rgba(100, 116, 139, 0.5)',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="">Slot {slotIdx + 1}: None</option>
                    {itemsByType.stratagem.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <button
              onClick={() => setPhase('MENU')}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: 'rgba(127, 29, 29, 0.3)',
                color: '#ef4444',
                border: '1px solid #7f1d1d',
                borderRadius: '4px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Back to Menu
            </button>
            <button
              onClick={startGameFromCustomSetup}
              style={{
                flex: 2,
                padding: '16px',
                backgroundColor: '#F5C642',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '900',
                fontSize: '18px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Start Operation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'EVENT') {
    if (!currentEvent) {
      setPhase('DRAFT');
      return null;
    }

    const handleEventChoice = (choice) => {
      // Process outcomes
      choice.outcomes.forEach(outcome => {
        processOutcome(outcome, choice);
      });
      
      // After event, proceed to draft
      setCurrentEvent(null);
      setEventPlayerChoice(null);
      startDraftPhase();
    };

    const processOutcome = (outcome, choice) => {
      switch (outcome.type) {
        case OUTCOME_TYPES.ADD_REQUISITION:
          setRequisition(prev => prev + outcome.value);
          break;
        
        case OUTCOME_TYPES.SPEND_REQUISITION:
          setRequisition(prev => Math.max(0, prev - outcome.value));
          break;
        
        case OUTCOME_TYPES.GAIN_LIFE:
          setLives(prev => prev + outcome.value);
          break;
        
        case OUTCOME_TYPES.LOSE_LIFE:
          setLives(prev => {
            const newLives = Math.max(0, prev - outcome.value);
            if (newLives === 0) {
              setTimeout(() => setPhase('GAMEOVER'), 100);
            }
            return newLives;
          });
          break;
        
        case OUTCOME_TYPES.CHANGE_FACTION:
          setGameConfig(prev => ({ ...prev, faction: outcome.value }));
          break;
        
        case OUTCOME_TYPES.EXTRA_DRAFT:
          // Will be handled by adding extra cards to draft
          break;
        
        case OUTCOME_TYPES.SKIP_DIFFICULTY:
          setCurrentDiff(prev => Math.min(10, prev + outcome.value));
          break;
        
        case OUTCOME_TYPES.REPLAY_DIFFICULTY:
          setCurrentDiff(prev => Math.max(1, prev - outcome.value));
          break;
        
        case OUTCOME_TYPES.SACRIFICE_ITEM:
          if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
            // Remove a stratagem from chosen player
            const player = players[eventPlayerChoice];
            if (player.loadout.stratagems.length > 0) {
              const newPlayers = [...players];
              newPlayers[eventPlayerChoice].loadout.stratagems.pop();
              setPlayers(newPlayers);
            }
          }
          break;
        
        case OUTCOME_TYPES.GAIN_BOOSTER:
          if (outcome.targetPlayer === 'choose' && eventPlayerChoice !== null) {
            // Grant a random booster to chosen player
            const boosters = MASTER_DB.filter(item => item.type === TYPE.BOOSTER);
            if (boosters.length > 0) {
              const randomBooster = boosters[Math.floor(Math.random() * boosters.length)];
              const newPlayers = [...players];
              newPlayers[eventPlayerChoice].loadout.booster = randomBooster.id;
              newPlayers[eventPlayerChoice].inventory.push(randomBooster.id);
              setPlayers(newPlayers);
            }
          } else if (!outcome.targetPlayer || outcome.targetPlayer === 'all') {
            // Grant to all players
            const boosters = MASTER_DB.filter(item => item.type === TYPE.BOOSTER);
            if (boosters.length > 0) {
              const randomBooster = boosters[Math.floor(Math.random() * boosters.length)];
              const newPlayers = players.map(p => ({
                ...p,
                loadout: { ...p.loadout, booster: randomBooster.id },
                inventory: [...p.inventory, randomBooster.id]
              }));
              setPlayers(newPlayers);
            }
          }
          break;
        
        case OUTCOME_TYPES.LOSE_ALL_BUT_ONE_LIFE:
          setLives(1);
          break;
        
        case OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER:
          // Only works in multiplayer
          if (players.length > 1 && eventPlayerChoice !== null) {
            const sourcePlayer = players[eventPlayerChoice];
            const availableStratagems = sourcePlayer.loadout.stratagems.filter(s => s !== null);
            
            if (availableStratagems.length > 0) {
              // Pick random stratagem from source player
              const randomStratagem = availableStratagems[Math.floor(Math.random() * availableStratagems.length)];
              
              // Find other players (not self)
              const otherPlayers = players.map((p, idx) => ({ player: p, idx })).filter((_, idx) => idx !== eventPlayerChoice);
              
              if (otherPlayers.length > 0) {
                // Pick random other player
                const targetPlayerData = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
                const newPlayers = [...players];
                
                // Add stratagem to target player
                const emptySlot = newPlayers[targetPlayerData.idx].loadout.stratagems.indexOf(null);
                if (emptySlot !== -1) {
                  newPlayers[targetPlayerData.idx].loadout.stratagems[emptySlot] = randomStratagem;
                  newPlayers[targetPlayerData.idx].inventory.push(randomStratagem);
                  setPlayers(newPlayers);
                }
              }
            }
          }
          break;
        
        case OUTCOME_TYPES.REDRAFT:
          // Discard all items from chosen player, then draft Math.ceil(discardedCount / outcome.value) cards
          if (eventPlayerChoice !== null) {
            const player = players[eventPlayerChoice];
            const discardedCount = player.inventory.length;
            const draftsToGrant = Math.ceil(discardedCount / (outcome.value || 1));
            
            // Clear player's inventory and loadout
            const newPlayers = [...players];
            newPlayers[eventPlayerChoice] = {
              ...player,
              inventory: [STARTING_LOADOUT.secondary, STARTING_LOADOUT.grenade, STARTING_LOADOUT.armor].filter(id => id !== null),
              loadout: {
                primary: STARTING_LOADOUT.primary,
                secondary: STARTING_LOADOUT.secondary,
                grenade: STARTING_LOADOUT.grenade,
                armor: STARTING_LOADOUT.armor,
                booster: STARTING_LOADOUT.booster,
                stratagems: [...STARTING_LOADOUT.stratagems]
              }
            };
            setPlayers(newPlayers);
            
            // Grant extra drafts (this would need to be tracked separately for proper implementation)
            // For now, we'll just give requisition as a proxy
            setRequisition(prev => prev + draftsToGrant);
          }
          break;
        
        default:
          break;
      }
    };

    const canAffordChoice = (choice) => {
      if (choice.requiresRequisition && requisition < choice.requiresRequisition) {
        return false;
      }
      return true;
    };

    const formatOutcome = (outcome) => {
      switch (outcome.type) {
        case OUTCOME_TYPES.ADD_REQUISITION:
          return `+${outcome.value} Requisition`;
        case OUTCOME_TYPES.SPEND_REQUISITION:
          return `-${outcome.value} Requisition`;
        case OUTCOME_TYPES.GAIN_LIFE:
          return `+${outcome.value} Life`;
        case OUTCOME_TYPES.LOSE_LIFE:
          return `-${outcome.value} Life`;
        case OUTCOME_TYPES.LOSE_ALL_BUT_ONE_LIFE:
          return `Lives reduced to 1`;
        case OUTCOME_TYPES.CHANGE_FACTION:
          return `Switch to ${outcome.value}`;
        case OUTCOME_TYPES.EXTRA_DRAFT:
          return `Draft ${outcome.value} extra card${outcome.value > 1 ? 's' : ''}`;
        case OUTCOME_TYPES.SKIP_DIFFICULTY:
          return `Skip ${outcome.value} difficulty level${outcome.value > 1 ? 's' : ''}`;
        case OUTCOME_TYPES.REPLAY_DIFFICULTY:
          return `Replay current difficulty`;
        case OUTCOME_TYPES.SACRIFICE_ITEM:
          return `Remove a ${outcome.value}`;
        case OUTCOME_TYPES.GAIN_BOOSTER:
          const target = outcome.targetPlayer === 'all' ? '(All Helldivers)' : '';
          return `Gain random Booster ${target}`;
        case OUTCOME_TYPES.REMOVE_ITEM:
          return `Remove an item`;
        case OUTCOME_TYPES.GAIN_SPECIFIC_ITEM:
          return `Gain specific item`;
        case OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER:
          return `Copy stratagem to another Helldiver`;
        case OUTCOME_TYPES.REDRAFT:
          return `Redraft: Discard all items, draft ${outcome.value ? Math.ceil(1 / outcome.value) : 1}x per discarded`;
        default:
          return '';
      }
    };

    const formatOutcomes = (outcomes) => {
      if (!outcomes || outcomes.length === 0) return 'No effect';
      return outcomes.map(formatOutcome).filter(o => o).join(', ');
    };

    const needsPlayerChoice = currentEvent.targetPlayer === 'single' && 
      currentEvent.choices && 
      currentEvent.choices.some(c => c.outcomes.some(o => o.targetPlayer === 'choose'));

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a2332', color: '#e0e0e0', padding: '24px' }}>
        {/* Header */}
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          backgroundColor: '#0f1419', 
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #F5C642',
          zIndex: 100
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F5C642' }}>
            EVENT - DIFFICULTY {currentDiff}
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="#F5C642" />
              <span style={{ fontWeight: 'bold' }}>{requisition}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#ff4444" />
              <span style={{ fontWeight: 'bold' }}>{lives} Lives</span>
            </div>
          </div>
        </div>

        {/* Event Content */}
        <div style={{ 
          maxWidth: '800px', 
          margin: '100px auto 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Event Card */}
          <div style={{
            backgroundColor: '#283548',
            border: '2px solid #F5C642',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontSize: '32px', 
              color: '#F5C642', 
              marginBottom: '16px',
              fontWeight: 'bold'
            }}>
              {currentEvent.name}
            </h2>
            <p style={{ 
              fontSize: '18px', 
              lineHeight: '1.6',
              marginBottom: '32px',
              color: '#b0b0b0'
            }}>
              {currentEvent.description}
            </p>

            {/* Player Selection (if needed) */}
            {needsPlayerChoice && eventPlayerChoice === null && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '16px', marginBottom: '12px', color: '#F5C642' }}>
                  Choose a Helldiver:
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {players.map((player, idx) => (
                    <button
                      key={idx}
                      onClick={() => setEventPlayerChoice(idx)}
                      style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: '#1a2332',
                        color: '#F5C642',
                        border: '2px solid #F5C642',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#283548'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a2332'}
                    >
                      HELLDIVER {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Choices */}
            {currentEvent.type === EVENT_TYPES.CHOICE && (!needsPlayerChoice || eventPlayerChoice !== null) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentEvent.choices.map((choice, idx) => {
                  const affordable = canAffordChoice(choice);
                  const outcomeText = formatOutcomes(choice.outcomes);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleEventChoice(choice)}
                      disabled={!affordable}
                      style={{
                        padding: '16px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: affordable ? '#F5C642' : '#555',
                        color: affordable ? '#0f1419' : '#888',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: affordable ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => affordable && (e.target.style.backgroundColor = '#ffd95a')}
                      onMouseLeave={(e) => affordable && (e.target.style.backgroundColor = '#F5C642')}
                    >
                      <div style={{ fontSize: '16px' }}>
                        {choice.text}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 'normal',
                        opacity: 0.85,
                        fontStyle: 'italic'
                      }}>
                        {outcomeText}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Random/Beneficial/Detrimental events auto-proceed */}
            {currentEvent.type !== EVENT_TYPES.CHOICE && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                {currentEvent.outcomes && currentEvent.outcomes.length > 0 && (
                  <div style={{
                    backgroundColor: '#1f2937',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    border: '1px solid rgba(245, 198, 66, 0.3)'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {currentEvent.type === EVENT_TYPES.RANDOM ? 'Possible Outcomes:' : 'Outcome:'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#F5C642' }}>
                      {currentEvent.type === EVENT_TYPES.RANDOM 
                        ? currentEvent.outcomes.map((o, i) => (
                            <div key={i}>
                              {formatOutcome(o)} {o.weight ? `(${o.weight}% chance)` : ''}
                            </div>
                          ))
                        : formatOutcomes(currentEvent.outcomes)
                      }
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (currentEvent.outcomes) {
                      if (currentEvent.type === EVENT_TYPES.RANDOM) {
                        // Pick weighted random outcome
                        const totalWeight = currentEvent.outcomes.reduce((sum, o) => sum + (o.weight || 1), 0);
                        let random = Math.random() * totalWeight;
                        for (const outcome of currentEvent.outcomes) {
                          random -= (outcome.weight || 1);
                          if (random <= 0) {
                            processOutcome(outcome, null);
                            break;
                          }
                        }
                      } else {
                        // Process all outcomes for BENEFICIAL/DETRIMENTAL
                        currentEvent.outcomes.forEach(outcome => {
                          processOutcome(outcome, null);
                        });
                      }
                    }
                    setCurrentEvent(null);
                    setEventPlayerChoice(null);
                    startDraftPhase();
                  }}
                  style={{
                    padding: '16px 32px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    backgroundColor: '#F5C642',
                    color: '#0f1419',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#ffd95a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#F5C642'}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'DRAFT') {
    const player = players[draftState.activePlayerIndex];
    
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
          <button
            onClick={exportGameState}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(100, 116, 139, 0.3)',
              color: '#94a3b8',
              border: '1px solid rgba(100, 116, 139, 0.5)',
              borderRadius: '4px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.5)';
              e.currentTarget.style.color = '#F5C642';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            💾 Export
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel this run? All progress will be lost.')) {
                setPhase('MENU');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(127, 29, 29, 0.3)',
              color: '#ef4444',
              border: '1px solid #7f1d1d',
              borderRadius: '4px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)'}
          >
            <XCircle size={16} />
            Cancel Run
          </button>
        </div>
        
        {/* Stratagem Replacement Modal */}
        {draftState.pendingStratagem && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}>
            <div style={{
              backgroundColor: '#283548',
              borderRadius: '12px',
              border: '2px solid #F5C642',
              padding: '32px',
              maxWidth: '800px',
              width: '100%'
            }}>
              <h2 style={{ color: '#F5C642', fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>
                Replace Stratagem
              </h2>
              <p style={{ color: '#cbd5e1', textAlign: 'center', marginBottom: '24px' }}>
                All stratagem slots are full. Select which stratagem to replace with:
              </p>
              <div style={{ 
                backgroundColor: '#1f2937', 
                padding: '16px', 
                borderRadius: '8px', 
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#F5C642', fontWeight: 'bold', fontSize: '18px' }}>
                  {draftState.pendingStratagem.name}
                </div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                  {draftState.pendingStratagem.rarity}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {player.loadout.stratagems.map((sid, i) => {
                  const stratagem = getItemById(sid);
                  return (
                    <button
                      key={i}
                      onClick={() => handleStratagemReplacement(i)}
                      style={{
                        backgroundColor: '#1f2937',
                        border: '2px solid rgba(100, 116, 139, 0.5)',
                        borderRadius: '8px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F5C642'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)'}
                    >
                      <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Slot {i + 1}
                      </div>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                        {stratagem?.name || 'Empty'}
                      </div>
                      {stratagem && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                          {stratagem.rarity}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setDraftState(prev => ({ ...prev, pendingStratagem: null }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(127, 29, 29, 0.3)',
                  color: '#ef4444',
                  border: '1px solid #7f1d1d',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)'}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ color: '#F5C642', fontSize: '14px', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
              Priority Requisition Authorized
            </h2>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: 'white', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              {player.name} <span style={{ color: '#64748b' }}>//</span> Select Upgrade
            </h1>
            <p style={{ color: '#94a3b8', margin: '0' }}>
              Choose wisely. This equipment is vital for Difficulty {currentDiff + 1}.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${Math.min(draftState.roundCards.length, 4)}, 1fr)`, 
            gap: '24px', 
            marginBottom: '48px' 
          }}>
            {draftState.roundCards.map((item, idx) => (
              <ItemCard key={`${item.id}-${idx}`} item={item} onSelect={handleDraftPick} onRemove={removeCardFromDraft} />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
            <button 
              onClick={() => rerollDraft(1)}
              disabled={requisition < 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 32px',
                borderRadius: '4px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                border: requisition >= 1 ? '2px solid white' : '2px solid #334155',
                backgroundColor: 'transparent',
                color: requisition >= 1 ? 'white' : '#64748b',
                cursor: requisition >= 1 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={20} />
              Reroll All Cards (-1 Req)
            </button>
          </div>
          
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '12px', margin: '0' }}>
              Click the × on a card to remove just that card (free)<br/>
              Or use "Reroll All Cards" to reroll the entire hand
            </p>
          </div>
          
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <span style={{ color: '#F5C642', fontFamily: 'monospace' }}>Current Requisition: {requisition} R</span>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD PHASE
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* HEADER */}
      <div style={{ backgroundColor: '#0f1419', borderBottom: '1px solid rgba(245, 198, 66, 0.3)', padding: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#F5C642', color: 'black', padding: '4px 12px', fontWeight: '900', fontSize: '20px', borderRadius: '4px' }}>
              D{currentDiff}
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: 'white', letterSpacing: '1px', margin: 0 }}>
                {DIFFICULTY_CONFIG[currentDiff-1]?.name}
              </h1>
              <div style={{ fontSize: '12px', color: '#F5C642', fontFamily: 'monospace' }}>Theater: {gameConfig.faction}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F5C642' }}>
              <Trophy size={18} />
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '20px' }}>{requisition}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
              <AlertTriangle size={18} />
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '20px' }}>{lives} Lives</span>
            </div>
            <button
              onClick={exportGameState}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(100, 116, 139, 0.3)',
                color: '#94a3b8',
                border: '1px solid rgba(100, 116, 139, 0.5)',
                borderRadius: '4px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.5)';
                e.currentTarget.style.color = '#F5C642';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              💾 Export
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this run? All progress will be lost.')) {
                  setPhase('MENU');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(127, 29, 29, 0.3)',
                color: '#ef4444',
                border: '1px solid #7f1d1d',
                borderRadius: '4px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)'}
            >
              <XCircle size={16} />
              Cancel Run
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        
        {/* PLAYER ROSTER */}
        <div style={{ display: 'grid', gridTemplateColumns: gameConfig.playerCount > 1 ? 'repeat(auto-fit, minmax(400px, 1fr))' : '1fr', gap: '32px', marginBottom: '48px' }}>
          {players.map(player => (
            <div key={player.id} style={{ backgroundColor: '#283548', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#1f2937', padding: '12px', borderBottom: '1px solid rgba(100, 116, 139, 0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{player.name}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Loadout Active</span>
              </div>
              <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {/* Primary */}
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Primary</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F5C642', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getItemById(player.loadout.primary)?.name}>
                    {getItemById(player.loadout.primary)?.name || 'None'}
                  </div>
                </div>
                {/* Secondary */}
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Secondary</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getItemById(player.loadout.secondary)?.name}>
                    {getItemById(player.loadout.secondary)?.name}
                  </div>
                </div>
                
                {/* Grenade */}
                <div style={{ gridColumn: 'span 2' }}>
                   <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Grenade</div>
                   <div style={{ fontSize: '12px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getItemById(player.loadout.grenade)?.name}</div>
                </div>

                 {/* Armor */}
                 <div style={{ gridColumn: 'span 2' }}>
                   <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Armor</div>
                   <div style={{ fontSize: '12px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getItemById(player.loadout.armor)?.name}</div>
                </div>

                 {/* Booster */}
                 <div style={{ gridColumn: 'span 2' }}>
                   <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Booster</div>
                   <div style={{ fontSize: '12px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getItemById(player.loadout.booster)?.name || 'None'}</div>
                </div>

                 {/* Spacer for better alignment */}
                 <div style={{ gridColumn: 'span 2' }}></div>

                {/* Stratagems */}
                <div style={{ gridColumn: 'span 4', marginTop: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Stratagems</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {player.loadout.stratagems.map((sid, i) => (
                      <div key={i} style={{ backgroundColor: '#1f2937', height: '64px', borderRadius: '4px', border: '1px solid rgba(71, 85, 105, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', textAlign: 'center', position: 'relative' }}>
                        {sid ? (
                           <span style={{ fontSize: '9px', lineHeight: '1.2', color: 'white', fontWeight: '600' }}>{getItemById(sid)?.name}</span>
                        ) : <span style={{ color: '#334155', fontSize: '12px' }}>EMPTY</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '100%', maxWidth: '800px', backgroundColor: '#283548', padding: '24px', borderRadius: '12px', border: '1px solid rgba(100, 116, 139, 0.5)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', marginBottom: '24px' }}>Mission Status Report</h2>
            
            {/* Star Rating Selection */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
                Mission Performance Rating
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '12px' }}>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button 
                    key={n}
                    onClick={() => setGameConfig({...gameConfig, starRating: n})}
                    style={{
                      padding: '16px 8px',
                      borderRadius: '4px',
                      fontWeight: '900',
                      fontSize: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      backgroundColor: gameConfig.starRating === n ? '#F5C642' : 'transparent',
                      color: gameConfig.starRating === n ? 'black' : '#64748b',
                      border: gameConfig.starRating === n ? '2px solid #F5C642' : '1px solid rgba(100, 116, 139, 0.5)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (gameConfig.starRating !== n) {
                        e.currentTarget.style.borderColor = '#64748b';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (gameConfig.starRating !== n) {
                        e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)';
                      }
                    }}
                  >
                    <div>{n}</div>
                    <div style={{ fontSize: '16px' }}>★</div>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                {getDraftHandSize()} equipment cards will be offered
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                   setLives(l => {
                     const newLives = l - 1;
                     if (newLives === 0) {
                       setTimeout(() => setPhase('GAMEOVER'), 100);
                     }
                     return newLives;
                   });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 24px',
                  backgroundColor: 'rgba(127, 29, 29, 0.3)',
                  color: '#ef4444',
                  border: '1px solid #7f1d1d',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)'}
              >
                <XCircle />
                Mission Failed
              </button>

              <button 
                onClick={() => {
                  setRequisition(r => r + 1);
                  if (currentDiff < 10) setCurrentDiff(d => d + 1);
                  startDraftPhase();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 32px',
                  backgroundColor: '#F5C642',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7d058'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5C642'}
              >
                <CheckCircle />
                Mission Success
              </button>
            </div>
            
            <p style={{ marginTop: '16px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace', margin: '16px 0 0 0' }}>
              Report success to earn Requisition & proceed to draft.
              <br/>Reporting failure consumes 1 Life.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}