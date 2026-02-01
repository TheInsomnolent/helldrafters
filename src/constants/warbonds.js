/**
 * Warbond constants and definitions
 */

export const WARBOND_TYPE = {
    STANDARD: 'STANDARD',
    PREMIUM: 'PREMIUM',
    LEGENDARY: 'LEGENDARY',
}

export const WARBONDS = {
    // Standard (Free)
    HELLDIVERS_MOBILIZE: {
        id: 'helldivers_mobilize',
        name: 'Helldivers Mobilize!',
        type: WARBOND_TYPE.STANDARD,
        order: 1,
        image: 'https://helldivers.wiki.gg/images/Helldivers_Mobilize_Warbond_Cover.png',
    },

    // Premium Warbonds (chronological order)
    STEELED_VETERANS: {
        id: 'steeled_veterans',
        name: 'Steeled Veterans',
        type: WARBOND_TYPE.PREMIUM,
        order: 2,
        image: 'https://helldivers.wiki.gg/images/Steeled_Veterans_Premium_Warbond_Cover.png',
    },
    CUTTING_EDGE: {
        id: 'cutting_edge',
        name: 'Cutting Edge',
        type: WARBOND_TYPE.PREMIUM,
        order: 3,
        image: 'https://helldivers.wiki.gg/images/Cutting_Edge_Premium_Warbond_Cover.png',
    },
    DEMOCRATIC_DETONATION: {
        id: 'democratic_detonation',
        name: 'Democratic Detonation',
        type: WARBOND_TYPE.PREMIUM,
        order: 4,
        image: 'https://helldivers.wiki.gg/images/Democratic_Detonation_Premium_Warbond_Cover.png',
    },
    POLAR_PATRIOTS: {
        id: 'polar_patriots',
        name: 'Polar Patriots',
        type: WARBOND_TYPE.PREMIUM,
        order: 5,
        image: 'https://helldivers.wiki.gg/images/Polar_Patriots_Premium_Warbond_Cover.png',
    },
    VIPER_COMMANDOS: {
        id: 'viper_commandos',
        name: 'Viper Commandos',
        type: WARBOND_TYPE.PREMIUM,
        order: 6,
        image: 'https://helldivers.wiki.gg/images/Viper_Commandos_Premium_Warbond_Cover.png',
    },
    FREEDOMS_FLAME: {
        id: 'freedoms_flame',
        name: "Freedom's Flame",
        type: WARBOND_TYPE.PREMIUM,
        order: 7,
        image: 'https://helldivers.wiki.gg/images/Freedom%27s_Flame_Premium_Warbond_Cover.png',
    },
    CHEMICAL_AGENTS: {
        id: 'chemical_agents',
        name: 'Chemical Agents',
        type: WARBOND_TYPE.PREMIUM,
        order: 8,
        image: 'https://helldivers.wiki.gg/images/Chemical_Agents_Premium_Warbond_Cover.png',
    },
    TRUTH_ENFORCERS: {
        id: 'truth_enforcers',
        name: 'Truth Enforcers',
        type: WARBOND_TYPE.PREMIUM,
        order: 9,
        image: 'https://helldivers.wiki.gg/images/Truth_Enforcers_Premium_Warbond_Cover.png',
    },
    URBAN_LEGENDS: {
        id: 'urban_legends',
        name: 'Urban Legends',
        type: WARBOND_TYPE.PREMIUM,
        order: 10,
        image: 'https://helldivers.wiki.gg/images/Urban_Legends_Premium_Warbond_Cover.png',
    },
    SERVANTS_OF_FREEDOM: {
        id: 'servants_of_freedom',
        name: 'Servants of Freedom',
        type: WARBOND_TYPE.PREMIUM,
        order: 11,
        image: 'https://helldivers.wiki.gg/images/Servants_of_Freedom_Premium_Warbond_Cover.png',
    },
    BORDERLINE_JUSTICE: {
        id: 'borderline_justice',
        name: 'Borderline Justice',
        type: WARBOND_TYPE.PREMIUM,
        order: 12,
        image: 'https://helldivers.wiki.gg/images/Borderline_Justice_Premium_Warbond_Cover.png',
    },
    MASTERS_OF_CEREMONY: {
        id: 'masters_of_ceremony',
        name: 'Masters of Ceremony',
        type: WARBOND_TYPE.PREMIUM,
        order: 13,
        image: 'https://helldivers.wiki.gg/images/Masters_of_Ceremony_Premium_Warbond_Cover.png',
    },
    FORCE_OF_LAW: {
        id: 'force_of_law',
        name: 'Force of Law',
        type: WARBOND_TYPE.PREMIUM,
        order: 14,
        image: 'https://helldivers.wiki.gg/images/thumb/Force_of_Law_Premium_Warbond_Cover.png/1920px-Force_of_Law_Premium_Warbond_Cover.png',
    },
    CONTROL_GROUP: {
        id: 'control_group',
        name: 'Control Group',
        type: WARBOND_TYPE.PREMIUM,
        order: 15,
        image: 'https://helldivers.wiki.gg/images/thumb/Control_Group_Premium_Warbond_Cover.png/1920px-Control_Group_Premium_Warbond_Cover.png',
    },
    DUST_DEVILS: {
        id: 'dust_devils',
        name: 'Dust Devils',
        type: WARBOND_TYPE.PREMIUM,
        order: 16,
        image: 'https://helldivers.wiki.gg/images/thumb/Dust_Devils_Premium_Warbond_Cover.png/1920px-Dust_Devils_Premium_Warbond_Cover.png',
    },
    PYTHON_COMMANDOS: {
        id: 'python_commandos',
        name: 'Python Commandos',
        type: WARBOND_TYPE.PREMIUM,
        order: 17,
        image: 'https://helldivers.wiki.gg/images/thumb/Python_Commandos_Premium_Warbond_Cover.png/1920px-Python_Commandos_Premium_Warbond_Cover.png',
    },
    REDACTED_REGIMENT: {
        id: 'redacted_regiment',
        name: 'Redacted Regiment',
        type: WARBOND_TYPE.PREMIUM,
        order: 18,
        image: 'https://helldivers.wiki.gg/images/thumb/Redacted_Regiment_Premium_Warbond_Cover.png/1920px-Redacted_Regiment_Premium_Warbond_Cover.png',
    },

    // Legendary Warbonds
    OBEDIENT_DEMOCRACY: {
        id: 'obedient_democracy_support_troopers',
        name: 'Obedient Democracy Support Troopers',
        type: WARBOND_TYPE.LEGENDARY,
        order: 19,
        image: 'https://helldivers.wiki.gg/images/thumb/Halo_ODST_Legendary_Warbond_Cover.png/1920px-Halo_ODST_Legendary_Warbond_Cover.png',
    },
    RIGHTEOUS_REVENANTS: {
        id: 'righteous_revenants',
        name: 'Righteous Revenants',
        type: WARBOND_TYPE.LEGENDARY,
        order: 20,
        image: 'https://helldivers.wiki.gg/images/Righteous_Revenants_Legendary_Warbond_Cover.png',
    },
}

// Helper to get warbonds by type
export const getWarbondsByType = (type) => Object.values(WARBONDS).filter((wb) => wb.type === type)

// Helper to get all warbonds in order
export const getAllWarbonds = () => Object.values(WARBONDS).sort((a, b) => a.order - b.order)

// Helper to get warbond by id
export const getWarbondById = (id) => Object.values(WARBONDS).find((wb) => wb.id === id)

// Default warbond selections (just the free one)
export const DEFAULT_WARBONDS = [WARBONDS.HELLDIVERS_MOBILIZE.id]
