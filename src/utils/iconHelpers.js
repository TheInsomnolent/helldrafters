/**
 * Icon URL helper functions for generating wiki image URLs
 * 
 * Wiki URL patterns by item type:
 * - Primary/Secondary Weapons: {WeaponName}_Primary_Weaponry.png or {WeaponName}_Secondary_Weaponry.png
 * - Stratagems: {StratagemName}_Stratagem_Icon.png
 * - Boosters: {BoosterName}_Booster_Icon.svg
 * - Armor: {ArmorName}_Body_Icon.png
 * - Grenades: {GrenadeName}.png (varies)
 */

const WIKI_BASE_URL = 'https://helldivers.wiki.gg/images';

/**
 * Generates a wiki icon URL from an item name
 * Converts item name to wiki format: spaces to underscores, URL encoding for special chars
 * @param {string} name - The item name
 * @returns {string} The wiki icon URL
 */
export const generateIconUrl = (name) => {
  if (!name) return null;
  
  // Replace spaces with underscores and encode special characters
  const wikiName = name
    .replace(/ /g, '_')
    .replace(/&/g, '%26')
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  
  return `${WIKI_BASE_URL}/${wikiName}.png`;
};

/**
 * Icon URL mappings for items
 * Wiki uses various naming conventions, so we map each item ID to its correct URL
 */
export const CUSTOM_ICON_URLS = {
  // Primary Weapons - using _Primary_Weaponry.png pattern
  'p_liberator': `${WIKI_BASE_URL}/AR-23_Liberator_Primary_Weaponry.png`,
  'p_constitution': `${WIKI_BASE_URL}/R-2124_Constitution_Primary_Weaponry.png`,
  'p_punisher': `${WIKI_BASE_URL}/SG-8_Punisher_Primary_Weaponry.png`,
  'p_breaker': `${WIKI_BASE_URL}/SG-225_Breaker_Primary_Weaponry.png`,
  'p_breaker_sp': `${WIKI_BASE_URL}/SG-225SP_Breaker_Spray%26Pray_Primary_Weaponry.png`,
  'p_scythe': `${WIKI_BASE_URL}/LAS-5_Scythe_Primary_Weaponry.png`,
  'p_diligence': `${WIKI_BASE_URL}/R-63_Diligence_Primary_Weaponry.png`,
  'p_cs': `${WIKI_BASE_URL}/R-63CS_Diligence_Counter_Sniper_Primary_Weaponry.png`,
  'p_defender': `${WIKI_BASE_URL}/SMG-37_Defender_Primary_Weaponry.png`,
  'p_lib_pen': `${WIKI_BASE_URL}/AR-23P_Liberator_Penetrator_Primary_Weaponry.png`,
  'p_slugger': `${WIKI_BASE_URL}/SG-8S_Slugger_Primary_Weaponry.png`,
  'p_scorcher': `${WIKI_BASE_URL}/PLAS-1_Scorcher_Primary_Weaponry.png`,
  'p_lib_con': `${WIKI_BASE_URL}/AR-23C_Liberator_Concussive_Primary_Weaponry.png`,
  'p_breaker_inc': `${WIKI_BASE_URL}/SG-225IE_Breaker_Incendiary_Primary_Weaponry.png`,
  'p_dominator': `${WIKI_BASE_URL}/JAR-5_Dominator_Primary_Weaponry.png`,
  'p_sickle': `${WIKI_BASE_URL}/LAS-16_Sickle_Primary_Weaponry.png`,
  'p_blitzer': `${WIKI_BASE_URL}/ARC-12_Blitzer_Primary_Weaponry.png`,
  'p_punisher_plas': `${WIKI_BASE_URL}/SG-8P_Punisher_Plasma_Primary_Weaponry.png`,
  'p_xbow': `${WIKI_BASE_URL}/CB-9_Exploding_Crossbow_Primary_Weaponry.png`,
  'p_eruptor': `${WIKI_BASE_URL}/R-36_Eruptor_Primary_Weaponry.png`,
  'p_adjudicator': `${WIKI_BASE_URL}/BR-14_Adjudicator_Primary_Weaponry.png`,
  'p_purifier': `${WIKI_BASE_URL}/PLAS-101_Purifier_Primary_Weaponry.png`,
  'p_pummeler': `${WIKI_BASE_URL}/SMG-72_Pummeler_Primary_Weaponry.png`,
  'p_tenderizer': `${WIKI_BASE_URL}/AR-61_Tenderizer_Primary_Weaponry.png`,
  'p_lib_carb': `${WIKI_BASE_URL}/AR-23A_Liberator_Carbine_Primary_Weaponry.png`,
  'p_cookout': `${WIKI_BASE_URL}/SG-451_Cookout_Primary_Weaponry.png`,
  'p_torcher': `${WIKI_BASE_URL}/FLAM-66_Torcher_Primary_Weaponry.png`,
  'p_halt': `${WIKI_BASE_URL}/SG-20_Halt_Primary_Weaponry.png`,
  'p_reprimand': `${WIKI_BASE_URL}/SMG-32_Reprimand_Primary_Weaponry.png`,
  'p_double_edge': `${WIKI_BASE_URL}/LAS-17_Double-Edge_Sickle_Primary_Weaponry.png`,
  'p_deadeye': `${WIKI_BASE_URL}/R-6_Deadeye_Primary_Weaponry.png`,
  'p_amendment': `${WIKI_BASE_URL}/R-2_Amendment_Primary_Weaponry.png`,
  'p_pacifier': `${WIKI_BASE_URL}/thumb/AR-32_Pacifier_Primary_Render.png/300px-AR-32_Pacifier_Primary_Render.png`,
  'p_variable': `${WIKI_BASE_URL}/thumb/VG-70_Variable_Primary_Render.png/300px-VG-70_Variable_Primary_Render.png`,
  'p_coyote': `${WIKI_BASE_URL}/thumb/AR-2_Coyote_Primary_Render.png/300px-AR-2_Coyote_Primary_Render.png`,
  'p_onetwo': `${WIKI_BASE_URL}/thumb/AR-GL-21_One_Two_Primary_Render.png/300px-AR-GL-21_One_Two_Primary_Render.png`,
  'p_ma5c': `${WIKI_BASE_URL}/thumb/MA5C_Assault_Rifle_Primary_Render.png/600px-MA5C_Assault_Rifle_Primary_Render.png`,
  'p_m7s': `${WIKI_BASE_URL}/thumb/M7S_SMG_Primary_Render.png/600px-M7S_SMG_Primary_Render.png`,
  'p_m90a': `${WIKI_BASE_URL}/thumb/M90A_Shotgun_Primary_Render.png/600px-M90A_Shotgun_Primary_Render.png`,
  'p_sta52': `${WIKI_BASE_URL}/StA-52_Assault_Rifle_Primary_Weaponry.png`,
  'p_plas39': `${WIKI_BASE_URL}/PLAS-39_Accelerator_Rifle_Primary_Weaponry.png`,
  'p_sta11': `${WIKI_BASE_URL}/StA-11_SMG_Primary_Weaponry.png`,
  'p_knight': `${WIKI_BASE_URL}/MP-98_Knight_Primary_Weaponry.png`,
  'p_double_freedom': `${WIKI_BASE_URL}/thumb/DBS-2_Shotgun_Primary_Render.png/600px-DBS-2_Shotgun_Primary_Render.png`,
  'p_censor': `${WIKI_BASE_URL}/R-72_Censor_Primary_Weaponry.png`,
  'p_suppressor': `${WIKI_BASE_URL}/AR-59_Suppressor_Primary_Weaponry.png`,
  
  // Secondary Weapons - using _Secondary_Weaponry.png pattern
  's_peacemaker': `${WIKI_BASE_URL}/P-2_Peacemaker_Secondary_Weaponry.png`,
  's_redeemer': `${WIKI_BASE_URL}/P-19_Redeemer_Secondary_Weaponry.png`,
  's_senator': `${WIKI_BASE_URL}/P-4_Senator_Secondary_Weaponry.png`,
  's_dagger': `${WIKI_BASE_URL}/LAS-7_Dagger_Secondary_Weaponry.png`,
  's_grenapistol': `${WIKI_BASE_URL}/GP-31_Grenade_Pistol_Secondary_Weaponry.png`,
  's_verdict': `${WIKI_BASE_URL}/P-113_Verdict_Secondary_Weaponry.png`,
  's_bushwhacker': `${WIKI_BASE_URL}/SG-22_Bushwhacker_Secondary_Weaponry.png`,
  's_crisper': `${WIKI_BASE_URL}/P-72_Crisper_Secondary_Weaponry.png`,
  's_stimpistol': `${WIKI_BASE_URL}/P-11_Stim_Pistol_Secondary_Weaponry.png`,
  's_loyalist': `${WIKI_BASE_URL}/PLAS-15_Loyalist_Secondary_Weaponry.png`,
  's_stun_lance': `${WIKI_BASE_URL}/CQC-19_Stun_Lance_Secondary_Weaponry.png`,
  's_ultimatum': `${WIKI_BASE_URL}/GP-20_Ultimatum_Secondary_Weaponry.png`,
  's_talon': `${WIKI_BASE_URL}/LAS-58_Talon_Secondary_Weaponry.png`,
  's_saber': `${WIKI_BASE_URL}/CQC-2_Saber_Secondary_Weaponry.png`,
  's_m6c': `${WIKI_BASE_URL}/thumb/M6C_SOCOM_Pistol_Secondary_Render.png/600px-M6C_SOCOM_Pistol_Secondary_Render.png`,
  's_stun_baton': `${WIKI_BASE_URL}/CQC-30_Stun_Baton_Secondary_Weaponry.png`,
  's_combat_hatchet': `${WIKI_BASE_URL}/CQC-5_Combat_Hatchet_Secondary_Weaponry.png`,
  's_warrant': `${WIKI_BASE_URL}/thumb/P-92_Warrant_Secondary_Render.png/600px-P-92_Warrant_Secondary_Render.png`,
  's_machete': `${WIKI_BASE_URL}/CQC-42_Machete_Secondary_Weaponry.png`,
  's_re_educator': `${WIKI_BASE_URL}/P-35_Re-Educator_Secondary_Weaponry.png`,
  's_entrenchment': `${WIKI_BASE_URL}/CQC-72_Entrenchment_Tool_Secondary_Weaponry.png`,
  
  // Grenades - wiki uses varying patterns (_Throwable_Weaponry.png, _Throwable_Render.png, or _Throwable_Icon.png)
  'g_he': `${WIKI_BASE_URL}/thumb/G-12_High_Explosive_Throwable_Weaponry.png/300px-G-12_High_Explosive_Throwable_Weaponry.png`,
  'g_frag': `${WIKI_BASE_URL}/thumb/G-6_Frag_Throwable_Weaponry.png/300px-G-6_Frag_Throwable_Weaponry.png`,
  'g_impact': `${WIKI_BASE_URL}/thumb/G-16_Impact_Throwable_Weaponry.png/300px-G-16_Impact_Throwable_Weaponry.png`,
  'g_smoke': `${WIKI_BASE_URL}/thumb/G-3_Smoke_Throwable_Weaponry.png/300px-G-3_Smoke_Throwable_Weaponry.png`,
  'g_inc': `${WIKI_BASE_URL}/thumb/G-10_Incendiary_Throwable_Weaponry.png/300px-G-10_Incendiary_Throwable_Weaponry.png`,
  'g_stun': `${WIKI_BASE_URL}/thumb/G-23_Stun_Throwable_Weaponry.png/300px-G-23_Stun_Throwable_Weaponry.png`,
  'g_thermite': `${WIKI_BASE_URL}/thumb/G-123_Thermite_Throwable_Weaponry.png/300px-G-123_Thermite_Throwable_Weaponry.png`,
  'g_inc_imp': `${WIKI_BASE_URL}/thumb/G-13_Incendiary_Impact_Throwable_Weaponry.png/300px-G-13_Incendiary_Impact_Throwable_Weaponry.png`,
  'g_knife': `${WIKI_BASE_URL}/thumb/K-2_Throwing_Knife_Throwable_Render.png/300px-K-2_Throwing_Knife_Throwable_Render.png`,
  'g_gas': `${WIKI_BASE_URL}/G-4_Gas_Throwable_Icon.png`,
  'g_seeker': `${WIKI_BASE_URL}/thumb/G-50_Seeker_Throwable_Weaponry.png/300px-G-50_Seeker_Throwable_Weaponry.png`,
  'g_dynamite': `${WIKI_BASE_URL}/thumb/TED-63_Dynamite_Throwable_Weaponry.png/300px-TED-63_Dynamite_Throwable_Weaponry.png`,
  'g_pyrotech': `${WIKI_BASE_URL}/thumb/G-142_Pyrotech_Throwable_Weaponry.png/300px-G-142_Pyrotech_Throwable_Weaponry.png`,
  'g_urchin': `${WIKI_BASE_URL}/thumb/G-109_Urchin_Throwable_Render.png/300px-G-109_Urchin_Throwable_Render.png`,
  'g_arc': `${WIKI_BASE_URL}/thumb/G-31_ARC_Throwable_Render.png/300px-G-31_ARC_Throwable_Render.png`,
  'g_pineapple': `${WIKI_BASE_URL}/thumb/G-7_Pineapple_Throwable_Render.png/300px-G-7_Pineapple_Throwable_Render.png`,
  'g_lure_mine': `${WIKI_BASE_URL}/thumb/TM-1_Lure_Mine_Throwable_Icon.png/51px-TM-1_Lure_Mine_Throwable_Icon.png`,
  
  // Boosters - wiki uses _Booster_Icon.svg format
  'b_space': `${WIKI_BASE_URL}/Hellpod_Space_Optimization_Booster_Icon.svg`,
  'b_stamina': `${WIKI_BASE_URL}/Stamina_Enhancement_Booster_Icon.svg`,
  'b_muscle': `${WIKI_BASE_URL}/Muscle_Enhancement_Booster_Icon.svg`,
  'b_reinforce': `${WIKI_BASE_URL}/Increased_Reinforcement_Budget_Booster_Icon.svg`,
  'b_vitality': `${WIKI_BASE_URL}/Vitality_Enhancement_Booster_Icon.svg`,
  'b_uav': `${WIKI_BASE_URL}/UAV_Recon_Booster_Booster_Icon.svg`,
  'b_flex_reinforce': `${WIKI_BASE_URL}/Flexible_Reinforcement_Budget_Booster_Icon.svg`,
  'b_local': `${WIKI_BASE_URL}/Localization_Confusion_Booster_Icon.svg`,
  'b_expert_pilot': `${WIKI_BASE_URL}/Expert_Extraction_Pilot_Booster_Icon.svg`,
  'b_shock': `${WIKI_BASE_URL}/Motivational_Shocks_Booster_Icon.svg`,
  'b_infusion': `${WIKI_BASE_URL}/Experimental_Infusion_Booster_Icon.svg`,
  'b_firepod': `${WIKI_BASE_URL}/Firebomb_Hellpods_Booster_Icon.svg`,
  'b_dead_sprint': `${WIKI_BASE_URL}/Dead_Sprint_Booster_Icon.svg`,
  'b_armed_pods': `${WIKI_BASE_URL}/Armed_Resupply_Pods_Booster_Icon.svg`,
  'b_sample_extricator': `${WIKI_BASE_URL}/Sample_Extricator_Booster_Icon.svg`,
  'b_sample_scanner': `${WIKI_BASE_URL}/Sample_Scanner_Booster_Icon.svg`,
  'b_stun_pods': `${WIKI_BASE_URL}/Stun_Pods_Booster_Icon.svg`,
  'b_concealed_insertion': `${WIKI_BASE_URL}/Concealed_Insertion_Booster_Icon.svg`,
  
  // Stratagems - wiki uses {StratagemName}_Stratagem_Icon.png format
  // Orbitals
  'st_ops': `${WIKI_BASE_URL}/Orbital_Precision_Strike_Stratagem_Icon.png`,
  'st_gatling': `${WIKI_BASE_URL}/Orbital_Gatling_Barrage_Stratagem_Icon.png`,
  'st_airburst': `${WIKI_BASE_URL}/Orbital_Airburst_Strike_Stratagem_Icon.png`,
  'st_120': `${WIKI_BASE_URL}/Orbital_120mm_HE_Barrage_Stratagem_Icon.png`,
  'st_380': `${WIKI_BASE_URL}/Orbital_380mm_HE_Barrage_Stratagem_Icon.png`,
  'st_walking': `${WIKI_BASE_URL}/Orbital_Walking_Barrage_Stratagem_Icon.png`,
  'st_laser': `${WIKI_BASE_URL}/Orbital_Laser_Stratagem_Icon.png`,
  'st_railcannon': `${WIKI_BASE_URL}/Orbital_Railcannon_Strike_Stratagem_Icon.png`,
  'st_gas_o': `${WIKI_BASE_URL}/Orbital_Gas_Strike_Stratagem_Icon.png`,
  'st_ems_o': `${WIKI_BASE_URL}/Orbital_EMS_Strike_Stratagem_Icon.png`,
  'st_smoke_o': `${WIKI_BASE_URL}/Orbital_Smoke_Strike_Stratagem_Icon.png`,
  'st_napalm_o': `${WIKI_BASE_URL}/Orbital_Napalm_Barrage_Stratagem_Icon.png`,
  
  // Eagles
  'st_e_strafe': `${WIKI_BASE_URL}/Eagle_Strafing_Run_Stratagem_Icon.png`,
  'st_e_airstrike': `${WIKI_BASE_URL}/Eagle_Airstrike_Stratagem_Icon.png`,
  'st_e_cluster': `${WIKI_BASE_URL}/Eagle_Cluster_Bomb_Stratagem_Icon.png`,
  'st_e_smoke': `${WIKI_BASE_URL}/Eagle_Smoke_Strike_Stratagem_Icon.png`,
  'st_e_rockets': `${WIKI_BASE_URL}/Eagle_110mm_Rocket_Pods_Stratagem_Icon.png`,
  'st_e_500': `${WIKI_BASE_URL}/Eagle_500kg_Bomb_Stratagem_Icon.png`,
  'st_e_napalm': `${WIKI_BASE_URL}/Eagle_Napalm_Airstrike_Stratagem_Icon.png`,
  
  // Support Weapons - using _Stratagem_Icon.png format
  'st_mg43': `${WIKI_BASE_URL}/Machine_Gun_Stratagem_Icon.png`,
  'st_amr': `${WIKI_BASE_URL}/Anti-Materiel_Rifle_Stratagem_Icon.png`,
  'st_stalwart': `${WIKI_BASE_URL}/Stalwart_Stratagem_Icon.png`,
  'st_eat': `${WIKI_BASE_URL}/Expendable_Anti-Tank_Stratagem_Icon.png`,
  'st_rr': `${WIKI_BASE_URL}/Recoilless_Rifle_Stratagem_Icon.png`,
  'st_flame': `${WIKI_BASE_URL}/Flamethrower_Stratagem_Icon.png`,
  'st_ac': `${WIKI_BASE_URL}/Autocannon_Stratagem_Icon.png`,
  'st_railgun': `${WIKI_BASE_URL}/Railgun_Stratagem_Icon.png`,
  'st_spear': `${WIKI_BASE_URL}/Spear_Stratagem_Icon.png`,
  'st_laser_can': `${WIKI_BASE_URL}/Laser_Cannon_Stratagem_Icon.png`,
  'st_arc': `${WIKI_BASE_URL}/Arc_Thrower_Stratagem_Icon.png`,
  'st_quasar': `${WIKI_BASE_URL}/Quasar_Cannon_Stratagem_Icon.png`,
  'st_hmg': `${WIKI_BASE_URL}/Heavy_Machine_Gun_Stratagem_Icon.png`,
  'st_commando': `${WIKI_BASE_URL}/Commando_Stratagem_Icon.png`,
  'st_sterilizer': `${WIKI_BASE_URL}/Sterilizer_Stratagem_Icon.png`,
  'st_flag': `${WIKI_BASE_URL}/CQC-1_One_True_Flag_Stratagem_Icon.png`,
  'st_deescalator': `${WIKI_BASE_URL}/GL-52_De-Escalator_Stratagem_Icon.png`,
  'st_epoch': `${WIKI_BASE_URL}/PLAS-45_Epoch_Stratagem_Icon.png`,
  'st_speargun': `${WIKI_BASE_URL}/S-11_Speargun_Stratagem_Icon.png`,
  'st_eat_napalm': `${WIKI_BASE_URL}/EAT-700_Expendable_Napalm_Stratagem_Icon.png`,
  'st_solo_silo': `${WIKI_BASE_URL}/MS-11_Stratagem_Icon.png`,
  'st_defoliation': `${WIKI_BASE_URL}/CQC-9_Defoliation_Tool_Stratagem_Icon.png`,
  'st_maxigun': `${WIKI_BASE_URL}/M-1000_Maxigun_Stratagem_Icon.png`,
  'st_airburst_rl': `${WIKI_BASE_URL}/Airburst_Rocket_Launcher_Icon.png`,
  'st_gl': `${WIKI_BASE_URL}/Grenade_Launcher_Stratagem_Icon.png`,
  'st_wasp': `${WIKI_BASE_URL}/StA-X3_W.A.S.P._Launcher_Stratagem_Icon.png`,
  'st_c4': `${WIKI_BASE_URL}/B-MD_C4_Pack_Stratagem_Icon.png`,
  
  // Backpacks
  'st_bp_jump': `${WIKI_BASE_URL}/Jump_Pack_Stratagem_Icon.png`,
  'st_bp_supply': `${WIKI_BASE_URL}/Supply_Pack_Stratagem_Icon.png`,
  'st_bp_dog': `${WIKI_BASE_URL}/Guard_Dog_Stratagem_Icon.png`,
  'st_bp_shield': `${WIKI_BASE_URL}/Shield_Generator_Pack_Stratagem_Icon.png`,
  'st_bp_ballistic': `${WIKI_BASE_URL}/Ballistic_Shield_Backpack_Stratagem_Icon.png`,
  'st_bp_rover': `${WIKI_BASE_URL}/Guard_Dog_Rover_Stratagem_Icon.png`,
  'st_bp_dog_breath': `${WIKI_BASE_URL}/Guard_Dog_Dog_Breath_Stratagem_Icon.png`,
  'st_bp_directional': `${WIKI_BASE_URL}/SH-51_Directional_Shield_Stratagem_Icon.png`,
  'st_bp_hellbomb': `${WIKI_BASE_URL}/Portable_Hellbomb_Stratagem_Icon.png`,
  'st_bp_hover': `${WIKI_BASE_URL}/Hover_Pack_Stratagem_Icon.png`,
  'st_bp_k9': `${WIKI_BASE_URL}/AX_ARC-3_%22Guard_Dog%22_K-9_Stratagem_Icon.png`,
  'st_bp_warp': `${WIKI_BASE_URL}/LIFT-182_Warp_Pack_Stratagem_Icon.png`,
  'st_bp_hotdog': `${WIKI_BASE_URL}/AX_FLAM-75_%E2%80%9CGuard_Dog%E2%80%9D_Hot_Dog_Stratagem_Icon.png`,
  
  // Sentries and Emplacements
  'st_s_mg': `${WIKI_BASE_URL}/Machine_Gun_Sentry_Stratagem_Icon.png`,
  'st_s_gat': `${WIKI_BASE_URL}/Gatling_Sentry_Stratagem_Icon.png`,
  'st_s_mortar': `${WIKI_BASE_URL}/Mortar_Sentry_Stratagem_Icon.png`,
  'st_s_ems': `${WIKI_BASE_URL}/AM-23_EMS_Mortar_Sentry_Stratagem_Icon.png`,
  'st_s_ac': `${WIKI_BASE_URL}/Autocannon_Sentry_Stratagem_Icon.png`,
  'st_s_rocket': `${WIKI_BASE_URL}/Rocket_Sentry_Stratagem_Icon.png`,
  'st_s_tesla': `${WIKI_BASE_URL}/Tesla_Tower_Stratagem_Icon.png`,
  'st_s_mines': `${WIKI_BASE_URL}/Anti-Personnel_Minefield_Stratagem_Icon.png`,
  'st_s_inc_mines': `${WIKI_BASE_URL}/Incendiary_Mines_Stratagem_Icon.png`,
  'st_s_at_mines': `${WIKI_BASE_URL}/MD-17_Anti-Tank_Mines_Stratagem_Icon.png`,
  'st_s_flame': `${WIKI_BASE_URL}/A_FLAM-40_Flame_Sentry_Stratagem_Icon.png`,
  'st_s_at_emp': `${WIKI_BASE_URL}/E_AT-12_Anti-Tank_Emplacement_Stratagem_Icon.png`,
  'st_s_laser': `${WIKI_BASE_URL}/A_LAS-98_Laser_Sentry_Stratagem_Icon.png`,
  'st_s_hmg': `${WIKI_BASE_URL}/HMG_Emplacement_Stratagem_Icon.png`,
  'st_s_shield_relay': `${WIKI_BASE_URL}/Shield_Generator_Relay_Stratagem_Icon.png`,
  'st_s_grenadier': `${WIKI_BASE_URL}/GL-21_Grenadier_Battlement_Stratagem_Icon.png`,
  'st_s_gas_mines': `${WIKI_BASE_URL}/Gas_Minefield_Stratagem_Icon.png`,
  
  // Vehicles and Exosuits
  'st_v_frv': `${WIKI_BASE_URL}/M-102_Fast_Recon_Vehicle_Stratagem_Icon.png`,
  'st_v_patriot': `${WIKI_BASE_URL}/EXO-45_Patriot_Exosuit_Stratagem_Icon.png`,
  'st_v_emancipator': `${WIKI_BASE_URL}/EXO-49_Emancipator_Exosuit_Stratagem_Icon.png`,
  
  // Armor - wiki uses {ArmorName}_Body_Icon.png format
  // Helldivers Mobilize
  'a_sc34': `${WIKI_BASE_URL}/SC-34_Infiltrator_Body_Icon.png`,
  'a_fs05': `${WIKI_BASE_URL}/FS-05_Marksman_Body_Icon.png`,
  'a_ce35': `${WIKI_BASE_URL}/CE-35_Trench_Engineer_Body_Icon.png`,
  'a_cm09': `${WIKI_BASE_URL}/CM-09_Bonesnapper_Body_Icon.png`,
  'a_fs23': `${WIKI_BASE_URL}/FS-23_Battle_Master_Body_Icon.png`,
  'a_sc30': `${WIKI_BASE_URL}/SC-30_Trailblazer_Scout_Body_Icon.png`,
  'a_sa04': `${WIKI_BASE_URL}/SA-04_Combat_Technician_Body_Icon.png`,
  'a_cm14': `${WIKI_BASE_URL}/CM-14_Physician_Body_Icon.png`,
  'a_dp11': `${WIKI_BASE_URL}/DP-11_Champion_of_the_People_Body_Icon.png`,
  'a_b01': `${WIKI_BASE_URL}/B-01_Tactical_Body_Icon.png`,
  'a_tr40': `${WIKI_BASE_URL}/TR-40_Gold_Eagle_Body_Icon.png`,
  'a_dp40': `${WIKI_BASE_URL}/DP-40_Hero_of_the_Federation_Body_Icon.png`,
  // Steeled Veterans
  'a_sa25': `${WIKI_BASE_URL}/SA-25_Steel_Trooper_Body_Icon.png`,
  'a_sa12': `${WIKI_BASE_URL}/SA-12_Servo_Assisted_Body_Icon.png`,
  'a_sa32': `${WIKI_BASE_URL}/SA-32_Dynamo_Body_Icon.png`,
  // Cutting Edge
  'a_ex03': `${WIKI_BASE_URL}/EX-03_Prototype_3_Body_Icon.png`,
  'a_ex16': `${WIKI_BASE_URL}/EX-16_Prototype_16_Body_Icon.png`,
  'a_ex00': `${WIKI_BASE_URL}/EX-00_Prototype_X_Body_Icon.png`,
  // Democratic Detonation
  'a_ce27': `${WIKI_BASE_URL}/CE-27_Ground_Breaker_Body_Icon.png`,
  'a_ce07': `${WIKI_BASE_URL}/CE-07_Demolition_Specialist_Body_Icon.png`,
  'a_fs55': `${WIKI_BASE_URL}/FS-55_Devastator_Body_Icon.png`,
  // Polar Patriots
  'a_cw36': `${WIKI_BASE_URL}/CW-36_Winter_Warrior_Body_Icon.png`,
  'a_cw22': `${WIKI_BASE_URL}/CW-22_Kodiak_Body_Icon.png`,
  'a_cw4': `${WIKI_BASE_URL}/CW-4_Arctic_Ranger_Body_Icon.png`,
  // Viper Commandos
  'a_ph9': `${WIKI_BASE_URL}/PH-9_Predator_Body_Icon.png`,
  'a_ph202': `${WIKI_BASE_URL}/PH-202_Twigsnapper_Body_Icon.png`,
  // Freedom's Flame
  'a_i09': `${WIKI_BASE_URL}/I-09_Heatseeker_Body_Icon.png`,
  'a_i102': `${WIKI_BASE_URL}/I-102_Draconaught_Body_Icon.png`,
  // Chemical Agents
  'a_af50': `${WIKI_BASE_URL}/AF-50_Noxious_Ranger_Body_Icon.png`,
  'a_af02': `${WIKI_BASE_URL}/AF-02_Haz-Master_Body_Icon.png`,
  // Truth Enforcers
  'a_uf50': `${WIKI_BASE_URL}/UF-50_Bloodhound_Body_Icon.png`,
  'a_uf16': `${WIKI_BASE_URL}/UF-16_Inspector_Body_Icon.png`,
  // Urban Legends
  'a_sr24': `${WIKI_BASE_URL}/SR-24_Street_Scout_Body_Icon.png`,
  'a_sr18': `${WIKI_BASE_URL}/SR-18_Roadblock_Body_Icon.png`,
  // Servants of Freedom
  'a_ie3': `${WIKI_BASE_URL}/IE-3_Martyr_Body_Icon.png`,
  'a_ie12': `${WIKI_BASE_URL}/IE-12_Righteous_Body_Icon.png`,
  // Borderline Justice
  'a_gs17': `${WIKI_BASE_URL}/GS-17_Frontier_Marshal_Body_Icon.png`,
  'a_gs66': `${WIKI_BASE_URL}/GS-66_Lawmaker_Body_Icon.png`,
  // Masters of Ceremony
  'a_re2310': `${WIKI_BASE_URL}/RE-2310_Honorary_Guard_Body_Icon.png`,
  'a_re1861': `${WIKI_BASE_URL}/RE-1861_Parade_Commander_Body_Icon.png`,
  // Force of Law
  'a_bp20': `${WIKI_BASE_URL}/BP-20_Correct_Officer_Body_Icon.png`,
  'a_bp32': `${WIKI_BASE_URL}/BP-32_Jackboot_Body_Icon.png`,
  // Control Group
  'a_ad26': `${WIKI_BASE_URL}/AD-26_Bleeding_Edge_Body_Icon.png`,
  'a_ad49': `${WIKI_BASE_URL}/AD-49_Apollonian_Body_Icon.png`,
  // Dust Devils
  'a_ds42': `${WIKI_BASE_URL}/DS-42_Federation%27s_Blade_Body_Icon.png`,
  'a_ds191': `${WIKI_BASE_URL}/DS-191_Scorpion_Body_Icon.png`,
  // Python Commandos
  'a_rs20': `${WIKI_BASE_URL}/RS-20_Constrictor_Body_Icon.png`,
  'a_rs40': `${WIKI_BASE_URL}/RS-40_Beast_of_Prey_Body_Icon.png`,
  // Redacted Regiment
  'a_rs67': `${WIKI_BASE_URL}/RS-89_Shadow_Paragon_Body_Armory.png`,
  'a_rs67ns': `${WIKI_BASE_URL}/RS-67_Null_Cipher_Body_Armory.png`,

  // Halo ODST
  'a_a9': `${WIKI_BASE_URL}/A-9_Helljumper_Body_Icon.png`,
  'a_a35': `${WIKI_BASE_URL}/A-35_Recon_Body_Icon.png`,
  // Righteous Revenants
  'a_ac1': `${WIKI_BASE_URL}/AC-1_Dutiful_Body_Icon.png`,
  'a_ac2': `${WIKI_BASE_URL}/AC-2_Obedient_Body_Icon.png`,
  // Superstore Light Armor
  'a_sc37': `${WIKI_BASE_URL}/SC-37_Legionnaire_Body_Icon.png`,
  'a_ce74': `${WIKI_BASE_URL}/CE-74_Breaker_Body_Icon.png`,
  'a_fs38': `${WIKI_BASE_URL}/FS-38_Eradicator_Body_Icon.png`,
  'a_b08': `${WIKI_BASE_URL}/B-08_Light_Gunner_Body_Icon.png`,
  'a_ds10': `${WIKI_BASE_URL}/DS-10_Big_Game_Hunter_Body_Icon.png`,
  'a_cm21': `${WIKI_BASE_URL}/CM-21_Trench_Paramedic_Body_Icon.png`,
  'a_ce67': `${WIKI_BASE_URL}/CE-67_Titan_Body_Icon.png`,
  'a_fs37': `${WIKI_BASE_URL}/FS-37_Ravager_Body_Icon.png`,
  'a_ie57': `${WIKI_BASE_URL}/IE-57_Hell-Bent_Body_Icon.png`,
  'a_gs11': `${WIKI_BASE_URL}/GS-11_Democracy%27s_Deputy_Body_Icon.png`,
  'a_ad11': `${WIKI_BASE_URL}/AD-11_Livewire_Body_Icon.png`,
  // Superstore Medium Armor
  'a_sc15': `${WIKI_BASE_URL}/SC-15_Drone_Master_Body_Icon.png`,
  'a_b24': `${WIKI_BASE_URL}/B-24_Enforcer_Body_Icon.png`,
  'a_ce81': `${WIKI_BASE_URL}/CE-81_Juggernaut_Body_Icon.png`,
  'a_fs34': `${WIKI_BASE_URL}/FS-34_Exterminator_Body_Icon.png`,
  'a_cm10': `${WIKI_BASE_URL}/CM-10_Clinician_Body_Icon.png`,
  'a_cw9': `${WIKI_BASE_URL}/CW-9_White_Wolf_Body_Icon.png`,
  'a_ph56': `${WIKI_BASE_URL}/PH-56_Jaguar_Body_Icon.png`,
  'a_i92': `${WIKI_BASE_URL}/I-92_Fire_Fighter_Body_Icon.png`,
  'a_af91': `${WIKI_BASE_URL}/AF-91_Field_Chemist_Body_Icon.png`,
  'a_uf84': `${WIKI_BASE_URL}/UF-84_Doubt_Killer_Body_Icon.png`,
  'a_rs6': `${WIKI_BASE_URL}/RS-6_Fiend_Destroyer_Body_Icon.png`,
  // Superstore Heavy Armor
  'a_b27': `${WIKI_BASE_URL}/B-27_Fortified_Commando_Body_Icon.png`,
  'a_fs61': `${WIKI_BASE_URL}/FS-61_Dreadnought_Body_Icon.png`,
  'a_fs11': `${WIKI_BASE_URL}/FS-11_Executioner_Body_Icon.png`,
  'a_cm17': `${WIKI_BASE_URL}/CM-17_Butcher_Body_Icon.png`,
  'a_ce64': `${WIKI_BASE_URL}/CE-64_Grenadier_Body_Icon.png`,
  'a_ce101': `${WIKI_BASE_URL}/CE-101_Guerilla_Gorilla_Body_Icon.png`,
  'a_i44': `${WIKI_BASE_URL}/I-44_Salamander_Body_Icon.png`,
  'a_af52': `${WIKI_BASE_URL}/AF-52_Lockdown_Body_Icon.png`,
  'a_sr64': `${WIKI_BASE_URL}/SR-64_Cinderblock_Body_Icon.png`,
  'a_re824': `${WIKI_BASE_URL}/RE-824_Bearer_of_the_Standard_Body_Icon.png`,
  'a_bp77': `${WIKI_BASE_URL}/BP-77_Grand_Juror_Body_Icon.png`,
};

/**
 * Gets the icon URL for an item
 * First checks custom mappings, then falls back to generated URL
 * @param {Object} item - The item object with id and name
 * @returns {string|null} The icon URL or null
 */
export const getItemIconUrl = (item) => {
  if (!item) return null;
  
  // Check custom mappings first
  if (CUSTOM_ICON_URLS[item.id]) {
    return CUSTOM_ICON_URLS[item.id];
  }
  
  // Fall back to generated URL from name
  return generateIconUrl(item.name);
};
