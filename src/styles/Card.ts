/**
 * Card/Panel styled-components
 *
 * Variants:
 * - base: Standard card with background and border
 * - elevated: Card with shadow for emphasis
 * - inner: Inner panel with darker background
 * - selectable: Clickable card with hover/selected states
 */

import styled, { css } from 'styled-components'

// ============================================================================
// TYPES
// ============================================================================

export type CardVariant = 'base' | 'elevated' | 'inner'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'

export interface CardProps {
    $variant?: CardVariant
    $padding?: CardPadding
    $factionBorder?: string
}

export interface SelectableCardProps extends CardProps {
    $selected?: boolean
    $factionPrimary?: string
    $factionShadow?: string
}

// ============================================================================
// PADDING STYLES
// ============================================================================

const getPaddingStyles = (padding: CardPadding) => {
    switch (padding) {
        case 'none':
            return css`
                padding: 0;
            `
        case 'sm':
            return css`
                padding: ${({ theme }) => theme.spacing.sm};
            `
        case 'md':
            return css`
                padding: ${({ theme }) => theme.spacing.lg};
            `
        case 'lg':
            return css`
                padding: ${({ theme }) => theme.spacing.xl};
            `
        case 'xl':
            return css`
                padding: ${({ theme }) => theme.spacing.xxxl};
            `
        default:
            return css``
    }
}

// ============================================================================
// VARIANT STYLES
// ============================================================================

const getVariantStyles = (variant: CardVariant) => {
    switch (variant) {
        case 'base':
            return css`
                background-color: ${({ theme }) => theme.colors.cardBg};
                border: 1px solid ${({ theme }) => theme.colors.cardBorder};
            `
        case 'elevated':
            return css`
                background-color: ${({ theme }) => theme.colors.cardBg};
                border: 1px solid ${({ theme }) => theme.colors.cardBorder};
                box-shadow: ${({ theme }) => theme.shadows.CARD};
            `
        case 'inner':
            return css`
                background-color: ${({ theme }) => theme.colors.cardInner};
                border: 1px solid ${({ theme }) => theme.colors.cardBorder};
            `
        default:
            return css``
    }
}

// ============================================================================
// BASE CARD
// ============================================================================

export const Card = styled.div<CardProps>`
    border-radius: ${({ theme }) => theme.radii.xl};
    overflow: hidden;

    ${({ $variant = 'base' }) => getVariantStyles($variant)}
    ${({ $padding = 'md' }) => getPaddingStyles($padding)}

    ${({ $factionBorder }) =>
        $factionBorder &&
        css`
            border: 2px solid ${$factionBorder};
        `}
`

// ============================================================================
// SELECTABLE CARD
// ============================================================================

export const SelectableCard = styled.button<SelectableCardProps>`
    display: block;
    width: 100%;
    text-align: left;
    border-radius: ${({ theme }) => theme.radii.md};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.normal};
    font-family: inherit;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    text-transform: uppercase;
    font-size: 13px;
    letter-spacing: 0.5px;

    ${({ $padding = 'md' }) => getPaddingStyles($padding)}

    ${({ $selected, $factionPrimary, $factionShadow, theme }) =>
        $selected
            ? css`
                  border: 2px solid ${$factionPrimary || theme.colors.primary};
                  background-color: rgba(0, 0, 0, 0.4);
                  transform: scale(1.02);
                  box-shadow: ${$factionShadow || theme.shadows.GLOW_PRIMARY};
                  color: ${$factionPrimary || theme.colors.primary};
              `
            : css`
                  border: 2px solid ${theme.colors.cardBorder};
                  background-color: ${theme.colors.bgMain};
                  color: ${theme.colors.textDisabled};

                  &:hover {
                      border-color: rgba(100, 116, 139, 0.6);
                      background-color: rgba(0, 0, 0, 0.6);
                      color: ${theme.colors.textMuted};
                  }
              `}

    &:focus {
        outline: none;
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.primary};
        outline-offset: 2px;
    }
`

// ============================================================================
// CARD HEADER
// ============================================================================

export const CardHeader = styled.div`
    background-color: ${({ theme }) => theme.colors.cardInner};
    padding: ${({ theme }) => theme.spacing.md};
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    display: flex;
    justify-content: space-between;
    align-items: center;
`

// ============================================================================
// CARD CONTENT
// ============================================================================

export const CardContent = styled.div<{ $padding?: CardPadding }>`
    ${({ $padding = 'lg' }) => getPaddingStyles($padding)}
`

// ============================================================================
// ALERT/NOTICE BOX
// ============================================================================

export type AlertVariant = 'error' | 'warning' | 'info' | 'success'

export interface AlertProps {
    $variant?: AlertVariant
    $factionPrimary?: string
}

const getAlertVariantStyles = (variant: AlertVariant, factionPrimary?: string) => {
    switch (variant) {
        case 'error':
            return css`
                background-color: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: ${({ theme }) => theme.colors.accentRed};
            `
        case 'warning':
            return css`
                background-color: rgba(249, 115, 22, 0.1);
                border: 1px solid rgba(249, 115, 22, 0.3);
                color: #f97316;
            `
        case 'success':
            return css`
                background-color: rgba(34, 197, 94, 0.1);
                border: 1px solid rgba(34, 197, 94, 0.3);
                color: ${({ theme }) => theme.colors.accentGreen};
            `
        case 'info':
        default:
            return css`
                background-color: ${factionPrimary
                    ? `${factionPrimary}10`
                    : 'rgba(59, 130, 246, 0.1)'};
                border: 2px solid
                    ${factionPrimary ? `${factionPrimary}40` : 'rgba(59, 130, 246, 0.4)'};
                color: ${factionPrimary || 'rgba(59, 130, 246, 1)'};
            `
    }
}

export const Alert = styled.div<AlertProps>`
    border-radius: ${({ theme }) => theme.radii.md};
    padding: ${({ theme }) => theme.spacing.lg};

    ${({ $variant = 'info', $factionPrimary }) => getAlertVariantStyles($variant, $factionPrimary)}
`
