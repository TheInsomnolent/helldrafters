/**
 * Core type definitions for Helldrafters
 *
 * This file contains all shared TypeScript types used throughout the application.
 * Types are organized by domain and exported for use in other modules.
 */

// =============================================================================
// ENUMS AND CONSTANT TYPES
// =============================================================================

/**
 * Item rarity levels
 */
export const RARITY = {
    COMMON: 'Common',
    UNCOMMON: 'Uncommon',
    RARE: 'Rare',
    LEGENDARY: 'Legendary',
} as const

export type Rarity = (typeof RARITY)[keyof typeof RARITY]

/**
 * Item types/categories
 */
export const TYPE = {
    PRIMARY: 'Primary',
    SECONDARY: 'Secondary',
    GRENADE: 'Grenade',
    STRATAGEM: 'Stratagem',
    BOOSTER: 'Booster',
    ARMOR: 'Armor',
} as const

export type ItemType = (typeof TYPE)[keyof typeof TYPE]

/**
 * Enemy factions
 */
export const FACTION = {
    BUGS: 'terminid',
    BOTS: 'automaton',
    SQUIDS: 'illuminate',
} as const

export type Faction = (typeof FACTION)[keyof typeof FACTION]

/**
 * Item tags for categorization
 */
export const TAGS = {
    FIRE: 'Fire',
    AT: 'Anti-Tank',
    STUN: 'Stun',
    SMOKE: 'Smoke',
    BACKPACK: 'Backpack',
    SUPPORT_WEAPON: 'Support Weapon',
    PRECISION: 'Precision',
    EXPLOSIVE: 'Explosive',
    DEFENSIVE: 'Defensive',
} as const

export type Tag = (typeof TAGS)[keyof typeof TAGS]

/**
 * Armor weight classes
 */
export const ARMOR_CLASS = {
    LIGHT: 'light',
    MEDIUM: 'medium',
    HEAVY: 'heavy',
} as const

export type ArmorClass = (typeof ARMOR_CLASS)[keyof typeof ARMOR_CLASS]

/**
 * Armor passive abilities
 */
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
} as const

export type ArmorPassive = (typeof ARMOR_PASSIVE)[keyof typeof ARMOR_PASSIVE]

/**
 * Warbond types
 */
export const WARBOND_TYPE = {
    STANDARD: 'STANDARD',
    PREMIUM: 'PREMIUM',
    LEGENDARY: 'LEGENDARY',
} as const

export type WarbondType = (typeof WARBOND_TYPE)[keyof typeof WARBOND_TYPE]

/**
 * Game phases
 */
export type GamePhase =
    | 'MENU'
    | 'LOBBY'
    | 'DRAFT'
    | 'DRAFT_SACRIFICE'
    | 'MISSION'
    | 'MISSION_DEBRIEF'
    | 'MISSION_COMPLETE'
    | 'MISSION_FAILED'
    | 'GAME_OVER'
    | 'VICTORY'
    | 'CUSTOM_SETUP'
    | 'EVENT'
    | 'STRATAGEM_REPLACEMENT'
    | 'FACTION_CHANGE'

/**
 * Slot types for loadout
 */
export type SlotType = 'primary' | 'secondary' | 'grenade' | 'armor' | 'booster' | 'stratagem'

// =============================================================================
// ITEM TYPES
// =============================================================================

/**
 * Base item definition
 */
export interface Item {
    id: string
    name: string
    type: ItemType
    rarity: Rarity
    tags: Tag[]
    warbond: string
}

/**
 * Armor item with additional properties
 */
export interface ArmorItem extends Omit<Item, 'type'> {
    type: 'Armor'
    armorClass: ArmorClass
    passive: ArmorPassive
}

/**
 * Stratagem item with additional properties
 */
export interface StratagemItem extends Omit<Item, 'type'> {
    type: 'Stratagem'
    code?: string
}

/**
 * Booster item
 */
export interface BoosterItem extends Omit<Item, 'type'> {
    type: 'Booster'
}

/**
 * Union type for all item types
 */
export type AnyItem = Item | ArmorItem | StratagemItem | BoosterItem

// =============================================================================
// LOADOUT TYPES
// =============================================================================

/**
 * Player loadout structure
 */
export interface Loadout {
    primary: string | null
    secondary: string | null
    grenade: string | null
    armor: string | null
    booster: string | null
    stratagems: (string | null)[]
}

/**
 * Armor combo for display (helmet/body/cape combinations)
 */
export interface ArmorCombo {
    armorId: string
    helmetId?: string
    capeId?: string
}

// =============================================================================
// PLAYER TYPES
// =============================================================================

/**
 * Player state
 */
export interface Player {
    id: string
    name: string
    loadout: Loadout
    lockedSlots: SlotType[]
    inventory: string[]
    disabledWarbonds: string[]
    superstoreItems: string[]
    excludedItems: string[]
    extracted: boolean
}

// =============================================================================
// GAME STATE TYPES
// =============================================================================

/**
 * Game configuration options
 */
export interface GameConfig {
    playerCount: number
    faction: Faction
    subfaction: string
    starRating: number
    globalUniqueness: boolean
    burnCards: boolean
    customStart: boolean
    endlessMode: boolean
    enduranceMode: boolean
    debugEventsMode: boolean
    debugRarityWeights: boolean
    brutalityMode: boolean
}

/**
 * Draft state during card selection
 */
export interface DraftState {
    activePlayerIndex: number
    roundCards: Item[]
    isRerolling: boolean
    pendingStratagem: StratagemItem | null
    extraDraftRound: number
    draftOrder: number[]
    isRetrospective: boolean
    retrospectivePlayerIndex: number | null
}

/**
 * Sacrifice state when players must discard items
 */
export interface SacrificeState {
    activePlayerIndex: number
    sacrificesRequired: number[]
}

/**
 * Sample resources
 */
export interface Samples {
    common: number
    rare: number
    superRare: number
}

/**
 * Custom setup configuration
 */
export interface CustomSetup {
    difficulty: number
    loadouts: Loadout[]
}

/**
 * Stratagem selection for events
 */
export interface StratagemSelection {
    sourcePlayerIndex: number
    stratagemSlotIndex: number
    stratagemId: string
}

/**
 * Draft history record
 */
export interface DraftHistoryRecord {
    difficulty: number
    starRating: number
}

/**
 * Complete game state
 */
export interface GameState {
    phase: GamePhase
    gameConfig: GameConfig
    currentDiff: number
    currentMission: number
    requisition: number
    samples: Samples
    players: Player[]
    draftState: DraftState
    draftHistory: DraftHistoryRecord[]
    sacrificeState: SacrificeState
    burnedCards: string[]
    customSetup: CustomSetup
    selectedPlayer: number
    eventsEnabled: boolean
    currentEvent: GameEvent | null
    eventPlayerChoice: number | null
    eventSelectedChoice: EventChoice | null
    eventSourcePlayerSelection: number | null
    eventStratagemSelection: StratagemSelection | null
    eventTargetPlayerSelection: number | null
    eventTargetStratagemSelection: StratagemSelection | null
    eventBoosterDraft: string[] | null
    eventBoosterSelection: string | null
    eventSpecialDraft: Item[] | null
    eventSpecialDraftType: 'throwable' | 'secondary' | null
    eventSpecialDraftSelections: string[] | null
    pendingFaction: Faction | null
    pendingSubfactionSelection: string | null
    seenEvents: string[]
    settingsOpen: boolean
    disabledWarbonds: string[]
    runAnalyticsData: RunAnalyticsData | null
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Event choice option
 */
export interface EventChoice {
    id: string
    text: string
    effect?: string
    disabled?: boolean
    disabledReason?: string
}

/**
 * Game event definition
 */
export interface GameEvent {
    id: string
    title: string
    description: string
    choices: EventChoice[]
    type?: string
    requiresPlayerSelection?: boolean
    requiresStratagemSelection?: boolean
    faction?: Faction
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

/**
 * Run analytics data for end-of-game stats
 */
export interface RunAnalyticsData {
    // Add specific analytics fields as needed
    [key: string]: unknown
}

// =============================================================================
// WARBOND TYPES
// =============================================================================

/**
 * Warbond definition
 */
export interface Warbond {
    id: string
    name: string
    type: WarbondType
    order: number
    image?: string
}

// =============================================================================
// DIFFICULTY TYPES
// =============================================================================

/**
 * Difficulty level configuration
 */
export interface DifficultyConfig {
    level: number
    name: string
    reqAT: boolean
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Function type for getting item by ID
 */
export type GetItemById = (id: string) => Item | undefined

/**
 * Function type for getting armor combo display name
 */
export type GetArmorComboDisplayName = (armorId: string) => string
