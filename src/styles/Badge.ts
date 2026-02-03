/**
 * Badge/Tag styled-components
 *
 * Components:
 * - Badge: General purpose badge
 * - WarbondTypeBadge: Warbond type indicator
 * - DifficultyBadge: Difficulty indicator
 */

import styled, { css } from 'styled-components'

// ============================================================================
// TYPES
// ============================================================================

export type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'faction'
export type BadgeSize = 'sm' | 'md' | 'lg'

// ============================================================================
// BADGE
// ============================================================================

export interface BadgeProps {
    $variant?: BadgeVariant
    $size?: BadgeSize
    $factionPrimary?: string
}

const getBadgeVariantStyles = (variant: BadgeVariant, factionPrimary?: string) => {
    switch (variant) {
        case 'success':
            return css`
                background-color: rgba(34, 197, 94, 0.2);
                color: ${({ theme }) => theme.colors.accentGreen};
                border-color: rgba(34, 197, 94, 0.3);
            `
        case 'error':
            return css`
                background-color: rgba(239, 68, 68, 0.2);
                color: ${({ theme }) => theme.colors.accentRed};
                border-color: rgba(239, 68, 68, 0.3);
            `
        case 'warning':
            return css`
                background-color: rgba(249, 115, 22, 0.2);
                color: #f97316;
                border-color: rgba(249, 115, 22, 0.3);
            `
        case 'info':
            return css`
                background-color: rgba(59, 130, 246, 0.2);
                color: ${({ theme }) => theme.colors.accentBlue};
                border-color: rgba(59, 130, 246, 0.3);
            `
        case 'faction':
            return css`
                background-color: ${factionPrimary
                    ? `${factionPrimary}15`
                    : 'rgba(245, 198, 66, 0.15)'};
                color: ${factionPrimary || (({ theme }) => theme.colors.primary)};
                border-color: ${factionPrimary ? `${factionPrimary}40` : 'rgba(245, 198, 66, 0.4)'};
            `
        case 'default':
        default:
            return css`
                background-color: rgba(100, 116, 139, 0.2);
                color: ${({ theme }) => theme.colors.textSecondary};
                border-color: ${({ theme }) => theme.colors.cardBorder};
            `
    }
}

const getBadgeSizeStyles = (size: BadgeSize) => {
    switch (size) {
        case 'sm':
            return css`
                padding: 2px 6px;
                font-size: 9px;
            `
        case 'md':
            return css`
                padding: 4px 8px;
                font-size: 10px;
            `
        case 'lg':
            return css`
                padding: 6px 12px;
                font-size: 12px;
            `
        default:
            return css``
    }
}

export const Badge = styled.span<BadgeProps>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: ${({ theme }) => theme.radii.sm};
    border: 1px solid;
    white-space: nowrap;

    ${({ $size = 'md' }) => getBadgeSizeStyles($size)}
    ${({ $variant = 'default', $factionPrimary }) =>
        getBadgeVariantStyles($variant, $factionPrimary)}
`

// ============================================================================
// WARBOND TYPE BADGE
// ============================================================================

export interface WarbondTypeBadgeProps {
    $type?: 'free' | 'premium' | 'legendary' | 'STANDARD' | 'PREMIUM' | 'LEGENDARY'
}

const getWarbondTypeColor = (
    type: 'free' | 'premium' | 'legendary' | 'STANDARD' | 'PREMIUM' | 'LEGENDARY',
) => {
    switch (type) {
        case 'premium':
        case 'PREMIUM':
            return '#60a5fa'
        case 'legendary':
        case 'LEGENDARY':
            return '#c084fc'
        case 'free':
        case 'STANDARD':
        default:
            return '#64748b'
    }
}

const getWarbondTypeLabel = (
    type: 'free' | 'premium' | 'legendary' | 'STANDARD' | 'PREMIUM' | 'LEGENDARY',
) => {
    switch (type) {
        case 'premium':
        case 'PREMIUM':
            return '● PREMIUM'
        case 'legendary':
        case 'LEGENDARY':
            return '● LEGENDARY'
        case 'free':
        case 'STANDARD':
        default:
            return '● FREE'
    }
}

export const WarbondTypeBadge = styled.span.attrs<WarbondTypeBadgeProps>(({ $type = 'free' }) => ({
    children: getWarbondTypeLabel($type),
}))<WarbondTypeBadgeProps>`
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ $type = 'free' }) => getWarbondTypeColor($type)};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_MEDIUM};
`

// ============================================================================
// DIFFICULTY BADGE
// ============================================================================

export interface DifficultyBadgeProps {
    $factionPrimary?: string
}

export const DifficultyBadge = styled.span<DifficultyBadgeProps>`
    background-color: ${({ $factionPrimary, theme }) => $factionPrimary || theme.colors.primary};
    color: black;
    padding: 4px 12px;
    font-weight: ${({ theme }) => theme.fontWeights.black};
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    border-radius: ${({ theme }) => theme.radii.md};
`
