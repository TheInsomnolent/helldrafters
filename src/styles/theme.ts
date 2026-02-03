/**
 * Styled-components theme definition
 * Extends the existing theme constants with structured theming for styled-components
 */

import { COLORS, SHADOWS, TYPOGRAPHY, FACTION_COLORS } from '../constants/theme'

// Re-export for convenience
export { COLORS, SHADOWS, TYPOGRAPHY, FACTION_COLORS, getFactionColors } from '../constants/theme'
export type { FactionColorSet } from '../constants/theme'

// ============================================================================
// SPACING SCALE
// ============================================================================

export const SPACING = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
} as const

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const RADII = {
    xs: '2px',
    sm: '3px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    xxl: '12px',
    round: '50%',
} as const

// ============================================================================
// FONT SIZES
// ============================================================================

export const FONT_SIZES = {
    xs: '9px',
    sm: '10px',
    md: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px',
    '5xl': '32px',
    '6xl': '48px',
    '7xl': '72px',
} as const

// ============================================================================
// FONT WEIGHTS
// ============================================================================

export const FONT_WEIGHTS = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
} as const

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const Z_INDEX = {
    base: 0,
    dropdown: 10,
    sticky: 100,
    modal: 1000,
    tooltip: 9999,
} as const

// ============================================================================
// TRANSITIONS
// ============================================================================

export const TRANSITIONS = {
    fast: 'all 0.15s ease',
    normal: 'all 0.2s ease',
    slow: 'all 0.3s ease',
} as const

// ============================================================================
// BREAKPOINTS (for future responsive design)
// ============================================================================

export const BREAKPOINTS = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
} as const

// ============================================================================
// COMPLETE THEME OBJECT
// ============================================================================

export const theme = {
    colors: {
        // Primary
        primary: COLORS.PRIMARY,
        primaryHover: COLORS.PRIMARY_HOVER,
        primaryDark: COLORS.PRIMARY_DARK,

        // Backgrounds
        bgMain: COLORS.BG_MAIN,
        bgGradientStart: COLORS.BG_GRADIENT_START,
        bgGradientEnd: COLORS.BG_GRADIENT_END,

        // Cards
        cardBg: COLORS.CARD_BG,
        cardInner: COLORS.CARD_INNER,
        cardBorder: COLORS.CARD_BORDER,
        cardBorderActive: COLORS.CARD_BORDER_ACTIVE,

        // Text
        textPrimary: COLORS.TEXT_PRIMARY,
        textSecondary: COLORS.TEXT_SECONDARY,
        textMuted: COLORS.TEXT_MUTED,
        textDisabled: COLORS.TEXT_DISABLED,

        // Accent
        accentBlue: COLORS.ACCENT_BLUE,
        accentPurple: COLORS.ACCENT_PURPLE,
        accentRed: COLORS.ACCENT_RED,
        accentGreen: COLORS.ACCENT_GREEN,

        // Rarity
        common: COLORS.COMMON,
        uncommon: COLORS.UNCOMMON,
        rare: COLORS.RARE,
        veryRare: COLORS.VERYRARE,

        // Factions
        terminids: COLORS.TERMINIDS,
        automatons: COLORS.AUTOMATONS,
        illuminate: COLORS.ILLUMINATE,
    },

    spacing: SPACING,
    radii: RADII,
    fontSizes: FONT_SIZES,
    fontWeights: FONT_WEIGHTS,
    typography: TYPOGRAPHY,
    shadows: SHADOWS,
    zIndex: Z_INDEX,
    transitions: TRANSITIONS,
    breakpoints: BREAKPOINTS,
    factionColors: FACTION_COLORS,
} as const

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Theme = typeof theme
export type ThemeSpacing = keyof typeof theme.spacing

// Augment styled-components default theme
declare module 'styled-components' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface DefaultTheme extends Theme {}
}
