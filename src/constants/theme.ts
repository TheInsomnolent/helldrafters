/**
 * Centralized theme constants for consistent styling
 */

export const COLORS = {
    // Primary colors
    PRIMARY: '#F5C642',
    PRIMARY_HOVER: '#f7d058',
    PRIMARY_DARK: '#d4a935',

    // Background colors
    BG_MAIN: '#1a2332',
    BG_GRADIENT_START: '#1a2332',
    BG_GRADIENT_END: '#0f1419',

    // Card/Panel colors
    CARD_BG: '#283548',
    CARD_INNER: '#1e293b',
    CARD_BORDER: 'rgba(100, 116, 139, 0.5)',
    CARD_BORDER_ACTIVE: '#F5C642',

    // Text colors
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#cbd5e1',
    TEXT_MUTED: '#94a3b8',
    TEXT_DISABLED: '#64748b',

    // Accent colors
    ACCENT_BLUE: '#3b82f6',
    ACCENT_PURPLE: '#a855f7',
    ACCENT_RED: '#ef4444',
    ACCENT_GREEN: '#22c55e',

    // Rarity colors
    COMMON: '#94a3b8',
    UNCOMMON: '#3b82f6',
    RARE: '#a855f7',
    VERYRARE: '#F5C642',

    // Faction colors
    TERMINIDS: '#e59f61',
    AUTOMATONS: '#cf6559',
    ILLUMINATE: '#b28ac1',
} as const

export interface FactionColorSet {
    PRIMARY: string
    PRIMARY_HOVER: string
    SHADOW: string
    SHADOW_HOVER: string
    GLOW: string
}

// Faction color mapping (maps faction names to their theme colors)
export const FACTION_COLORS: Record<string, FactionColorSet> = {
    terminid: {
        PRIMARY: '#e59f61',
        PRIMARY_HOVER: '#e2914b',
        SHADOW: '0 4px 16px rgba(229, 159, 97, 0.4)',
        SHADOW_HOVER: '0 6px 20px rgba(229, 159, 97, 0.5)',
        GLOW: '0 4px 20px rgba(229, 159, 97, 0.3)',
    },
    automaton: {
        PRIMARY: '#cf6559',
        PRIMARY_HOVER: '#c95245',
        SHADOW: '0 4px 16px rgba(207, 101, 89, 0.4)',
        SHADOW_HOVER: '0 6px 20px rgba(207, 101, 89, 0.5)',
        GLOW: '0 4px 20px rgba(207, 101, 89, 0.3)',
    },
    illuminate: {
        PRIMARY: '#b28ac1',
        PRIMARY_HOVER: '#a779b9',
        SHADOW: '0 4px 16px rgba(178, 138, 193, 0.4)',
        SHADOW_HOVER: '0 6px 20px rgba(178, 138, 193, 0.5)',
        GLOW: '0 4px 20px rgba(178, 138, 193, 0.3)',
    },
}

// Helper function to get faction-specific colors
export const getFactionColors = (factionName: string): FactionColorSet =>
    FACTION_COLORS[factionName] || FACTION_COLORS['terminid']

export const SHADOWS = {
    BUTTON_PRIMARY: '0 4px 16px rgba(245, 198, 66, 0.4)',
    BUTTON_PRIMARY_HOVER: '0 6px 20px rgba(245, 198, 66, 0.5)',
    CARD: '0 8px 32px rgba(0, 0, 0, 0.4)',
    GLOW_PRIMARY: '0 4px 20px rgba(245, 198, 66, 0.3)',
    GLOW_BLUE: '0 4px 20px rgba(59, 130, 246, 0.3)',
    GLOW_PURPLE: '0 4px 20px rgba(168, 85, 247, 0.3)',
    GLOW_GREEN: '0 4px 20px rgba(34, 197, 94, 0.3)',
} as const

export const GRADIENTS = {
    HEADER_BAR: 'linear-gradient(to right, #5a5142, #6b6052)',
    BACKGROUND: 'linear-gradient(to bottom, #1a2332, #0f1419)',
} as const

export const TYPOGRAPHY = {
    LETTER_SPACING_WIDE: '0.3em',
    LETTER_SPACING_MEDIUM: '0.15em',
    LETTER_SPACING_NORMAL: '0.05em',
    LETTER_SPACING_TIGHT: '0.02em',
} as const

export interface ButtonStyle {
    backgroundColor: string
    color: string
    border: string
    fontWeight: string
    textTransform: string
    letterSpacing: string
    cursor: string
    transition: string
    boxShadow?: string
}

export const BUTTON_STYLES: Record<string, ButtonStyle> = {
    PRIMARY: {
        backgroundColor: COLORS.PRIMARY,
        color: 'black',
        border: `2px solid ${COLORS.PRIMARY}`,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: TYPOGRAPHY.LETTER_SPACING_NORMAL,
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: SHADOWS.BUTTON_PRIMARY,
    },
    SECONDARY: {
        backgroundColor: 'transparent',
        color: COLORS.TEXT_MUTED,
        border: `2px solid ${COLORS.CARD_BORDER}`,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: TYPOGRAPHY.LETTER_SPACING_NORMAL,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
}
