import { RARITY, TYPE, TAGS } from '../constants/types';

export const MASTER_DB = [
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
