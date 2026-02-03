/**
 * Stratagem codes - Directional inputs for each stratagem
 * Based on Helldivers 2 stratagem call-in system
 * Directions: U=Up, D=Down, L=Left, R=Right
 */

export type Direction = 'U' | 'D' | 'L' | 'R'

export interface StratagemCode {
    name: string
    code: Direction[]
}

export const STRATAGEM_CODES: Record<string, StratagemCode> = {
    // OFFENSIVE - ORBITAL
    st_ops: { name: 'Orbital Precision Strike', code: ['R', 'R', 'U'] },
    st_gatling: { name: 'Orbital Gatling Barrage', code: ['R', 'D', 'L', 'U', 'U'] },
    st_airburst: { name: 'Orbital Airburst Strike', code: ['R', 'R', 'R'] },
    st_120: { name: 'Orbital 120mm HE Barrage', code: ['R', 'R', 'D', 'L', 'R', 'D'] },
    st_380: { name: 'Orbital 380mm HE Barrage', code: ['R', 'D', 'U', 'U', 'L', 'D', 'D'] },
    st_walking: { name: 'Orbital Walking Barrage', code: ['R', 'D', 'R', 'D', 'R', 'D'] },
    st_laser: { name: 'Orbital Laser', code: ['R', 'D', 'U', 'R', 'D'] },
    st_railcannon: { name: 'Orbital Railcannon Strike', code: ['R', 'U', 'D', 'D', 'R'] },
    st_gas_o: { name: 'Orbital Gas Strike', code: ['R', 'R', 'D', 'R'] },
    st_ems_o: { name: 'Orbital EMS Strike', code: ['R', 'R', 'L', 'D'] },
    st_smoke_o: { name: 'Orbital Smoke Strike', code: ['R', 'R', 'D', 'U'] },

    // OFFENSIVE - EAGLE
    st_e_strafe: { name: 'Eagle Strafing Run', code: ['U', 'R', 'R'] },
    st_e_airstrike: { name: 'Eagle Airstrike', code: ['U', 'R', 'D', 'R'] },
    st_e_cluster: { name: 'Eagle Cluster Bomb', code: ['U', 'R', 'D', 'D', 'R'] },
    st_e_smoke: { name: 'Eagle Smoke Strike', code: ['U', 'R', 'U', 'D'] },
    st_e_rockets: { name: 'Eagle 110mm Rocket Pods', code: ['U', 'R', 'U', 'L'] },
    st_e_500: { name: 'Eagle 500kg Bomb', code: ['U', 'R', 'D', 'D', 'D'] },
    st_e_napalm: { name: 'Eagle Napalm Airstrike', code: ['U', 'R', 'D', 'U'] },

    // DEFENSIVE - BACKPACKS
    st_bp_jump: { name: 'Jump Pack', code: ['D', 'U', 'U', 'D', 'U'] },
    st_bp_supply: { name: 'Supply Pack', code: ['D', 'L', 'D', 'U', 'U', 'D'] },
    st_bp_dog: { name: 'Guard Dog', code: ['D', 'U', 'L', 'U', 'R', 'D'] },
    st_bp_shield: { name: 'Shield Generator Pack', code: ['D', 'U', 'L', 'R', 'L', 'R'] },
    st_bp_ballistic: { name: 'Ballistic Shield', code: ['D', 'L', 'D', 'D', 'U', 'L'] },
    st_bp_dog_laser: { name: 'Guard Dog Rover', code: ['D', 'U', 'L', 'U', 'R', 'R'] },

    // DEFENSIVE - SENTRIES
    st_s_mg: { name: 'Machine Gun Sentry', code: ['D', 'U', 'R', 'R', 'U'] },
    st_s_gat: { name: 'Gatling Sentry', code: ['D', 'U', 'R', 'L'] },
    st_s_mortar: { name: 'Mortar Sentry', code: ['D', 'U', 'R', 'R', 'D'] },
    st_s_ems: { name: 'EMS Mortar Sentry', code: ['D', 'U', 'R', 'D', 'R'] },
    st_s_ac: { name: 'Autocannon Sentry', code: ['D', 'U', 'R', 'U', 'L', 'U'] },
    st_s_rocket: { name: 'Rocket Sentry', code: ['D', 'U', 'R', 'R', 'L'] },
    st_s_tesla: { name: 'Tesla Tower', code: ['D', 'U', 'R', 'U', 'L', 'R'] },
    st_s_mines: { name: 'Anti-Personnel Mines', code: ['D', 'L', 'U', 'R'] },

    // SUPPORT WEAPONS
    st_mg43: { name: 'Machine Gun MG-43', code: ['D', 'L', 'D', 'U', 'R'] },
    st_amr: { name: 'Anti-Materiel Rifle', code: ['D', 'L', 'R', 'U', 'D'] },
    st_stalwart: { name: 'Stalwart', code: ['D', 'L', 'D', 'U', 'U', 'L'] },
    st_eat: { name: 'EAT-17 Expendable Anti-Tank', code: ['D', 'D', 'L', 'U', 'R'] },
    st_rr: { name: 'Recoilless Rifle', code: ['D', 'L', 'R', 'R', 'L'] },
    st_flame: { name: 'Flamethrower', code: ['D', 'L', 'U', 'D', 'U'] },
    st_ac: { name: 'Autocannon AC-8', code: ['D', 'L', 'D', 'U', 'U', 'R'] },
    st_railgun: { name: 'Railgun', code: ['D', 'R', 'D', 'U', 'L', 'R'] },
    st_spear: { name: 'Spear', code: ['D', 'D', 'U', 'D', 'D'] },
    st_laser_can: { name: 'Laser Cannon', code: ['D', 'L', 'D', 'U', 'L'] },
    st_arc: { name: 'Arc Thrower', code: ['D', 'R', 'D', 'U', 'L', 'L'] },
    st_quasar: { name: 'Quasar Cannon', code: ['D', 'D', 'U', 'L', 'R'] },
    st_hmg: { name: 'Heavy Machine Gun', code: ['D', 'L', 'U', 'D', 'D'] },
    st_commando: { name: 'Commando', code: ['D', 'L', 'U', 'D', 'R'] },
    st_grenade_launcher: { name: 'Grenade Launcher', code: ['D', 'L', 'U', 'L', 'D'] },
    st_las_guard: { name: 'LAS-98 Laser Cannon', code: ['D', 'L', 'D', 'U', 'L'] },
}

// Get array of all stratagem IDs that have codes defined
export const getStratagemIds = (): string[] => Object.keys(STRATAGEM_CODES)

// Get a random stratagem
export const getRandomStratagem = (): { id: string } & StratagemCode => {
    const ids = getStratagemIds()
    const randomId = ids[Math.floor(Math.random() * ids.length)]
    return { id: randomId, ...STRATAGEM_CODES[randomId] }
}

// Direction symbols for display
export const DIRECTION_SYMBOLS: Record<Direction, string> = {
    U: '▲',
    D: '▼',
    L: '◄',
    R: '►',
}

// Arrow key to direction mapping
export const KEY_TO_DIRECTION: Record<string, Direction> = {
    ArrowUp: 'U',
    ArrowDown: 'D',
    ArrowLeft: 'L',
    ArrowRight: 'R',
    w: 'U',
    W: 'U',
    s: 'D',
    S: 'D',
    a: 'L',
    A: 'L',
    d: 'R',
    D: 'R',
}
