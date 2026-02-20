/**
 * Typography styled-components
 *
 * Components:
 * - Title: Large page titles (72px)
 * - Heading: Section headers (32px)
 * - Subheading: Subsection headers (14px, uppercase)
 * - ModalTitle: Modal header text (28px)
 * - Label: Form/field labels (12px, uppercase)
 * - Text: Body text (14-16px)
 * - Caption: Small hint text (10-11px)
 * - Mono: Monospace text for values
 */

import styled, { css } from 'styled-components'

// ============================================================================
// TYPES
// ============================================================================

export type TextColor =
    | 'primary'
    | 'secondary'
    | 'muted'
    | 'disabled'
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'faction'

export interface TextProps {
    $color?: TextColor
    $factionColor?: string
}

// ============================================================================
// COLOR HELPER
// ============================================================================

const getTextColor = (color: TextColor, factionColor?: string) => {
    switch (color) {
        case 'primary':
            return css`
                color: ${({ theme }) => theme.colors.textPrimary};
            `
        case 'secondary':
            return css`
                color: ${({ theme }) => theme.colors.textSecondary};
            `
        case 'muted':
            return css`
                color: ${({ theme }) => theme.colors.textMuted};
            `
        case 'disabled':
            return css`
                color: ${({ theme }) => theme.colors.textDisabled};
            `
        case 'success':
            return css`
                color: ${({ theme }) => theme.colors.accentGreen};
            `
        case 'error':
            return css`
                color: ${({ theme }) => theme.colors.accentRed};
            `
        case 'warning':
            return css`
                color: #f97316;
            `
        case 'info':
            return css`
                color: ${({ theme }) => theme.colors.accentBlue};
            `
        case 'faction':
            return css`
                color: ${factionColor || (({ theme }) => theme.colors.primary)};
            `
        default:
            return css``
    }
}

// ============================================================================
// TITLE (H1 - Page titles)
// ============================================================================

export interface TitleProps extends TextProps {
    $factionGlow?: string
}

export const Title = styled.h1<TitleProps>`
    font-size: ${({ theme }) => theme.fontSizes['7xl']};
    font-weight: ${({ theme }) => theme.fontWeights.black};
    margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_NORMAL};
    text-transform: uppercase;
    color: ${({ $factionColor, theme }) => $factionColor || theme.colors.primary};
    text-shadow: ${({ $factionGlow }) => $factionGlow || '0 4px 20px rgba(245, 198, 66, 0.3)'};
`

// ============================================================================
// HEADING (H2 - Section headers)
// ============================================================================

export interface HeadingProps extends TextProps {
    $factionGlow?: string
}

export const Heading = styled.h2<HeadingProps>`
    font-size: ${({ theme }) => theme.fontSizes['5xl']};
    font-weight: ${({ theme }) => theme.fontWeights.black};
    margin: 0 0 ${({ theme }) => theme.spacing.xxl} 0;
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_MEDIUM};
    color: ${({ $factionColor, theme }) => $factionColor || theme.colors.primary};
    text-shadow: ${({ $factionGlow }) => $factionGlow || '0 4px 20px rgba(245, 198, 66, 0.3)'};
`

// ============================================================================
// SUBHEADING (H3 - Subsection headers)
// ============================================================================

export interface SubheadingProps extends TextProps {
    $withAccent?: boolean
    $factionColor?: string
}

export const Subheading = styled.h3<SubheadingProps>`
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_MEDIUM};

    ${({ $withAccent, $factionColor, theme }) =>
        $withAccent &&
        css`
            border-left: 4px solid ${$factionColor || theme.colors.primary};
            padding-left: ${theme.spacing.md};
        `}
`

// ============================================================================
// MODAL TITLE
// ============================================================================

export const ModalTitle = styled.h2<TextProps>`
    font-size: ${({ theme }) => theme.fontSizes['4xl']};
    font-weight: ${({ theme }) => theme.fontWeights.black};
    color: ${({ $factionColor, theme }) => $factionColor || theme.colors.primary};
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_NORMAL};
    margin: 0;
`

// ============================================================================
// LABEL (Form/Field labels)
// ============================================================================

export const Label = styled.label<TextProps>`
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_MEDIUM};
    margin-bottom: ${({ theme }) => theme.spacing.md};

    ${({ $color, $factionColor }) => $color && getTextColor($color, $factionColor)}
`

// ============================================================================
// TEXT (Body text)
// ============================================================================

export interface BodyTextProps extends TextProps {
    $size?: 'sm' | 'md' | 'lg'
}

const getTextSize = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
        case 'sm':
            return css`
                font-size: ${({ theme }) => theme.fontSizes.md};
            `
        case 'md':
            return css`
                font-size: ${({ theme }) => theme.fontSizes.base};
            `
        case 'lg':
            return css`
                font-size: ${({ theme }) => theme.fontSizes.lg};
            `
        default:
            return css``
    }
}

export const Text = styled.p<BodyTextProps>`
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.8;
    margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;

    ${({ $size = 'md' }) => getTextSize($size)}
    ${({ $color, $factionColor }) => $color && getTextColor($color, $factionColor)}

    &:last-child {
        margin-bottom: 0;
    }
`

// ============================================================================
// CAPTION (Small hint text)
// ============================================================================

export const Caption = styled.span<TextProps>`
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.5px;

    ${({ $color, $factionColor }) => $color && getTextColor($color, $factionColor)}
`

// ============================================================================
// MONOSPACE TEXT (Stats/Values)
// ============================================================================

export interface MonoProps extends TextProps {
    $size?: 'sm' | 'md' | 'lg'
}

export const Mono = styled.span<MonoProps>`
    font-family: monospace;
    font-weight: ${({ theme }) => theme.fontWeights.bold};

    ${({ $size = 'md' }) => {
        switch ($size) {
            case 'sm':
                return css`
                    font-size: ${({ theme }) => theme.fontSizes.md};
                `
            case 'md':
                return css`
                    font-size: ${({ theme }) => theme.fontSizes.lg};
                `
            case 'lg':
                return css`
                    font-size: ${({ theme }) => theme.fontSizes['2xl']};
                `
            default:
                return css``
        }
    }}

    ${({ $color, $factionColor }) => $color && getTextColor($color, $factionColor)}
`

// ============================================================================
// INLINE STYLES
// ============================================================================

export const Strong = styled.strong`
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.textPrimary};
`
