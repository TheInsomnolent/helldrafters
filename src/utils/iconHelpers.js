/**
 * Icon URL helper functions for generating wiki image URLs
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
 * Icon URL mappings for items that need custom URLs
 * These are items where the name doesn't directly map to the wiki URL
 */
export const CUSTOM_ICON_URLS = {
  // Primary Weapons
  'p_liberator': `${WIKI_BASE_URL}/AR-23_Liberator.png`,
  'p_constitution': `${WIKI_BASE_URL}/R-2124_Constitution.png`,
  'p_punisher': `${WIKI_BASE_URL}/SG-8_Punisher.png`,
  'p_breaker': `${WIKI_BASE_URL}/SG-225_Breaker.png`,
  'p_breaker_sp': `${WIKI_BASE_URL}/SG-225SP_Breaker_Spray%26Pray.png`,
  'p_scythe': `${WIKI_BASE_URL}/LAS-5_Scythe.png`,
  'p_diligence': `${WIKI_BASE_URL}/R-63_Diligence.png`,
  'p_cs': `${WIKI_BASE_URL}/R-63CS_Counter_Sniper.png`,
  'p_defender': `${WIKI_BASE_URL}/SMG-37_Defender.png`,
  'p_lib_pen': `${WIKI_BASE_URL}/AR-23P_Liberator_Penetrator.png`,
  'p_slugger': `${WIKI_BASE_URL}/SG-8S_Slugger.png`,
  'p_scorcher': `${WIKI_BASE_URL}/PLAS-1_Scorcher.png`,
  'p_lib_con': `${WIKI_BASE_URL}/AR-23C_Liberator_Concussive.png`,
  'p_breaker_inc': `${WIKI_BASE_URL}/SG-225IE_Breaker_Incendiary.png`,
  'p_dominator': `${WIKI_BASE_URL}/JAR-5_Dominator.png`,
  'p_sickle': `${WIKI_BASE_URL}/LAS-16_Sickle.png`,
  'p_blitzer': `${WIKI_BASE_URL}/ARC-12_Blitzer.png`,
  'p_punisher_plas': `${WIKI_BASE_URL}/SG-8P_Punisher_Plasma.png`,
  'p_xbow': `${WIKI_BASE_URL}/CB-9_Explosive_Crossbow.png`,
  'p_eruptor': `${WIKI_BASE_URL}/R-36_Eruptor.png`,
  'p_adjudicator': `${WIKI_BASE_URL}/BR-14_Adjudicator.png`,
  'p_purifier': `${WIKI_BASE_URL}/PLAS-101_Purifier.png`,
  'p_pummeler': `${WIKI_BASE_URL}/SMG-72_Pummeler.png`,
  'p_tenderizer': `${WIKI_BASE_URL}/AR-61_Tenderizer.png`,
  'p_lib_carb': `${WIKI_BASE_URL}/AR-23A_Liberator_Carbine.png`,
  'p_cookout': `${WIKI_BASE_URL}/SG-451_Cookout.png`,
  'p_torcher': `${WIKI_BASE_URL}/FLAM-66_Torcher.png`,
  'p_halt': `${WIKI_BASE_URL}/SG-20_Halt.png`,
  'p_reprimand': `${WIKI_BASE_URL}/SMG-32_Reprimand.png`,
  'p_double_edge': `${WIKI_BASE_URL}/LAS-17_Double-Edge_Sickle.png`,
  'p_deadeye': `${WIKI_BASE_URL}/R-6_Deadeye.png`,
  'p_amendment': `${WIKI_BASE_URL}/R-2_Amendment.png`,
  'p_pacifier': `${WIKI_BASE_URL}/AR-32_Pacifier.png`,
  'p_variable': `${WIKI_BASE_URL}/VG-70_Variable.png`,
  'p_coyote': `${WIKI_BASE_URL}/AR-2_Coyote.png`,
  'p_onetwo': `${WIKI_BASE_URL}/AR-GL-21_One-Two.png`,
  'p_ma5c': `${WIKI_BASE_URL}/MA5C_Assault_Rifle.png`,
  'p_m7s': `${WIKI_BASE_URL}/M7S_SMG.png`,
  'p_m90a': `${WIKI_BASE_URL}/M90A_Shotgun.png`,
  'p_sta52': `${WIKI_BASE_URL}/StA-52_Assault_Rifle.png`,
  'p_plas39': `${WIKI_BASE_URL}/PLAS-39_Accelerator_Rifle.png`,
  'p_sta11': `${WIKI_BASE_URL}/StA-11_SMG.png`,
  'p_knight': `${WIKI_BASE_URL}/MP-98_Knight.png`,
  'p_double_freedom': `${WIKI_BASE_URL}/DBS-2_Double_Freedom.png`,
  
  // Secondary Weapons
  's_peacemaker': `${WIKI_BASE_URL}/P-2_Peacemaker.png`,
  's_redeemer': `${WIKI_BASE_URL}/P-19_Redeemer.png`,
  's_senator': `${WIKI_BASE_URL}/P-4_Senator.png`,
  's_dagger': `${WIKI_BASE_URL}/LAS-7_Dagger.png`,
  's_grenapistol': `${WIKI_BASE_URL}/GP-31_Grenade_Pistol.png`,
  's_verdict': `${WIKI_BASE_URL}/P-113_Verdict.png`,
  's_bushwhacker': `${WIKI_BASE_URL}/SG-22_Bushwhacker.png`,
  's_crisper': `${WIKI_BASE_URL}/Crisper.png`,
  's_stimpistol': `${WIKI_BASE_URL}/P-43_Stim_Pistol.png`,
  's_loyalist': `${WIKI_BASE_URL}/PLAS-15_Loyalist.png`,
  's_stun_lance': `${WIKI_BASE_URL}/CQC-19_Stun_Lance.png`,
  's_ultimatum': `${WIKI_BASE_URL}/GP-20_Ultimatum.png`,
  's_talon': `${WIKI_BASE_URL}/LAS-58_Talon.png`,
  's_saber': `${WIKI_BASE_URL}/CQC-2_Saber.png`,
  's_m6c': `${WIKI_BASE_URL}/M6C-SOCOM_Pistol.png`,
  's_stun_baton': `${WIKI_BASE_URL}/CQC-30_Stun_Baton.png`,
  's_combat_hatchet': `${WIKI_BASE_URL}/CQC-5_Combat_Hatchet.png`,
  's_warrant': `${WIKI_BASE_URL}/P-92_Warrant.png`,
  's_machete': `${WIKI_BASE_URL}/CQC-42_Machete.png`,
  
  // Grenades
  'g_he': `${WIKI_BASE_URL}/G-12_High_Explosive.png`,
  'g_frag': `${WIKI_BASE_URL}/G-6_Frag.png`,
  'g_impact': `${WIKI_BASE_URL}/G-16_Impact.png`,
  'g_smoke': `${WIKI_BASE_URL}/G-3_Smoke.png`,
  'g_inc': `${WIKI_BASE_URL}/G-10_Incendiary.png`,
  'g_stun': `${WIKI_BASE_URL}/G-23_Stun.png`,
  'g_thermite': `${WIKI_BASE_URL}/G-123_Thermite.png`,
  'g_inc_imp': `${WIKI_BASE_URL}/G-13_Incendiary_Impact.png`,
  'g_knife': `${WIKI_BASE_URL}/K-2_Throwing_Knife.png`,
  'g_gas': `${WIKI_BASE_URL}/G-4_Gas.png`,
  'g_seeker': `${WIKI_BASE_URL}/G-50_Seeker.png`,
  'g_dynamite': `${WIKI_BASE_URL}/TED-63_Dynamite.png`,
  'g_pyrotech': `${WIKI_BASE_URL}/G-142_Pyrotech.png`,
  'g_urchin': `${WIKI_BASE_URL}/G-109_Urchin.png`,
  'g_arc': `${WIKI_BASE_URL}/G-31_Arc.png`,
  'g_pineapple': `${WIKI_BASE_URL}/G-7_Pineapple.png`,
  
  // Boosters
  'b_space': `${WIKI_BASE_URL}/Hellpod_Space_Optimization.png`,
  'b_stamina': `${WIKI_BASE_URL}/Stamina_Enhancement.png`,
  'b_muscle': `${WIKI_BASE_URL}/Muscle_Enhancement.png`,
  'b_reinforce': `${WIKI_BASE_URL}/Increased_Reinforcement_Budget.png`,
  'b_vitality': `${WIKI_BASE_URL}/Vitality_Enhancement.png`,
  'b_uav': `${WIKI_BASE_URL}/UAV_Recon_Booster.png`,
  'b_flex_reinforce': `${WIKI_BASE_URL}/Flexible_Reinforcement_Budget.png`,
  'b_local': `${WIKI_BASE_URL}/Localization_Confusion.png`,
  'b_expert_pilot': `${WIKI_BASE_URL}/Expert_Extraction_Pilot.png`,
  'b_shock': `${WIKI_BASE_URL}/Motivational_Shocks.png`,
  'b_infusion': `${WIKI_BASE_URL}/Experimental_Infusion.png`,
  'b_firepod': `${WIKI_BASE_URL}/Firebomb_Hellpods.png`,
  'b_dead_sprint': `${WIKI_BASE_URL}/Dead_Sprint.png`,
  'b_armed_pods': `${WIKI_BASE_URL}/Armed_Resupply_Pods.png`,
  'b_sample_extricator': `${WIKI_BASE_URL}/Sample_Extricator.png`,
  'b_sample_scanner': `${WIKI_BASE_URL}/Sample_Scanner.png`,
  'b_stun_pods': `${WIKI_BASE_URL}/Stun_Pods.png`,
  
  // Stratagems - Orbitals
  'st_ops': `${WIKI_BASE_URL}/Orbital_Precision_Strike.png`,
  'st_gatling': `${WIKI_BASE_URL}/Orbital_Gatling_Barrage.png`,
  'st_airburst': `${WIKI_BASE_URL}/Orbital_Airburst_Strike.png`,
  'st_120': `${WIKI_BASE_URL}/Orbital_120MM_HE_Barrage.png`,
  'st_380': `${WIKI_BASE_URL}/Orbital_380MM_HE_Barrage.png`,
  'st_walking': `${WIKI_BASE_URL}/Orbital_Walking_Barrage.png`,
  'st_laser': `${WIKI_BASE_URL}/Orbital_Laser.png`,
  'st_railcannon': `${WIKI_BASE_URL}/Orbital_Railcannon_Strike.png`,
  'st_gas_o': `${WIKI_BASE_URL}/Orbital_Gas_Strike.png`,
  'st_ems_o': `${WIKI_BASE_URL}/Orbital_EMS_Strike.png`,
  'st_smoke_o': `${WIKI_BASE_URL}/Orbital_Smoke_Strike.png`,
  
  // Stratagems - Eagles
  'st_e_strafe': `${WIKI_BASE_URL}/Eagle_Strafing_Run.png`,
  'st_e_airstrike': `${WIKI_BASE_URL}/Eagle_Airstrike.png`,
  'st_e_cluster': `${WIKI_BASE_URL}/Eagle_Cluster_Bomb.png`,
  'st_e_smoke': `${WIKI_BASE_URL}/Eagle_Smoke_Strike.png`,
  'st_e_rockets': `${WIKI_BASE_URL}/Eagle_110MM_Rocket_Pods.png`,
  'st_e_500': `${WIKI_BASE_URL}/Eagle_500KG_Bomb.png`,
  'st_e_napalm': `${WIKI_BASE_URL}/Eagle_Napalm_Airstrike.png`,
  
  // Stratagems - Support Weapons
  'st_mg43': `${WIKI_BASE_URL}/MG-43_Machine_Gun.png`,
  'st_amr': `${WIKI_BASE_URL}/APW-1_Anti-Materiel_Rifle.png`,
  'st_stalwart': `${WIKI_BASE_URL}/M-105_Stalwart.png`,
  'st_eat': `${WIKI_BASE_URL}/EAT-17_Expendable_Anti-Tank.png`,
  'st_rr': `${WIKI_BASE_URL}/GR-8_Recoilless_Rifle.png`,
  'st_flame': `${WIKI_BASE_URL}/FLAM-40_Flamethrower.png`,
  'st_ac': `${WIKI_BASE_URL}/AC-8_Autocannon.png`,
  'st_railgun': `${WIKI_BASE_URL}/RS-422_Railgun.png`,
  'st_spear': `${WIKI_BASE_URL}/FAF-14_Spear.png`,
  'st_laser_can': `${WIKI_BASE_URL}/LAS-98_Laser_Cannon.png`,
  'st_arc': `${WIKI_BASE_URL}/ARC-3_Arc_Thrower.png`,
  'st_quasar': `${WIKI_BASE_URL}/LAS-99_Quasar_Cannon.png`,
  'st_hmg': `${WIKI_BASE_URL}/MG-206_Heavy_Machine_Gun.png`,
  'st_commando': `${WIKI_BASE_URL}/MLS-4X_Commando.png`,
  'st_sterilizer': `${WIKI_BASE_URL}/TX-41_Sterilizer.png`,
  'st_flag': `${WIKI_BASE_URL}/CQC-1_One_True_Flag.png`,
  'st_deescalator': `${WIKI_BASE_URL}/GL-52_De-Escalator.png`,
  'st_epoch': `${WIKI_BASE_URL}/PLAS-45_Epoch.png`,
  'st_speargun': `${WIKI_BASE_URL}/S-11_Speargun.png`,
  'st_eat_napalm': `${WIKI_BASE_URL}/EAT-700_Expendable_Napalm.png`,
  'st_solo_silo': `${WIKI_BASE_URL}/MS-11_Solo_Silo.png`,
  'st_defoliation': `${WIKI_BASE_URL}/CQC-9_Defoliation_Tool.png`,
  'st_maxigun': `${WIKI_BASE_URL}/M-1000_Maxigun.png`,
  
  // Stratagems - Backpacks
  'st_bp_jump': `${WIKI_BASE_URL}/LIFT-850_Jump_Pack.png`,
  'st_bp_supply': `${WIKI_BASE_URL}/B-1_Supply_Pack.png`,
  'st_bp_dog': `${WIKI_BASE_URL}/AX-LAS-5_%22Guard_Dog%22_Rover.png`,
  'st_bp_shield': `${WIKI_BASE_URL}/SH-20_Ballistic_Shield_Backpack.png`,
  'st_bp_ballistic': `${WIKI_BASE_URL}/SH-32_Shield_Generator_Pack.png`,
  'st_bp_rover': `${WIKI_BASE_URL}/AX-LAS-5_%22Guard_Dog%22_Rover.png`,
  'st_bp_dog_breath': `${WIKI_BASE_URL}/AX-TX-13_%22Guard_Dog%22_Dog_Breath.png`,
  'st_bp_directional': `${WIKI_BASE_URL}/SH-51_Directional_Shield.png`,
  'st_bp_hellbomb': `${WIKI_BASE_URL}/NUX-223_Hellbomb.png`,
  'st_bp_hover': `${WIKI_BASE_URL}/LIFT-860_Hover_Pack.png`,
  'st_bp_k9': `${WIKI_BASE_URL}/AX-ARC-3_%22Guard_Dog%22_K-9.png`,
  'st_bp_warp': `${WIKI_BASE_URL}/LIFT-182_Warp_Pack.png`,
  'st_bp_hotdog': `${WIKI_BASE_URL}/AX-FLAM-75_%22Guard_Dog%22_Hot_Dog.png`,
  
  // Stratagems - Sentries
  'st_s_mg': `${WIKI_BASE_URL}/A-MG-43_Machine_Gun_Sentry.png`,
  'st_s_gat': `${WIKI_BASE_URL}/A-G-16_Gatling_Sentry.png`,
  'st_s_mortar': `${WIKI_BASE_URL}/A-M-12_Mortar_Sentry.png`,
  'st_s_ems': `${WIKI_BASE_URL}/A-M-23_EMS_Mortar_Sentry.png`,
  'st_s_ac': `${WIKI_BASE_URL}/A-AC-8_Autocannon_Sentry.png`,
  'st_s_rocket': `${WIKI_BASE_URL}/A-MLS-4X_Rocket_Sentry.png`,
  'st_s_tesla': `${WIKI_BASE_URL}/A-ARC-3_Tesla_Tower.png`,
  'st_s_mines': `${WIKI_BASE_URL}/MD-6_Anti-Personnel_Minefield.png`,
  'st_s_inc_mines': `${WIKI_BASE_URL}/MD-I4_Incendiary_Mines.png`,
  'st_s_at_mines': `${WIKI_BASE_URL}/MD-17_Anti-Tank_Mines.png`,
  'st_s_flame': `${WIKI_BASE_URL}/A-FLAM-40_Flame_Sentry.png`,
  'st_s_at_emp': `${WIKI_BASE_URL}/E-AT-12_Anti-Tank_Emplacement.png`,
  'st_s_laser': `${WIKI_BASE_URL}/A-LAS-98_Laser_Sentry.png`,
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
