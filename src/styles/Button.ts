/**
 * Button styled-components
 *
 * Variants:
 * - primary: Yellow/gold themed CTA button
 * - secondary: Gray/muted outline button
 * - danger: Red themed destructive action
 * - success: Green themed positive action
 * - ghost: Transparent with hover effect
 *
 * Sizes:
 * - sm: Small buttons (padding: 8px 16px)
 * - md: Medium buttons (padding: 12px 24px)
 * - lg: Large buttons (padding: 16px 48px)
 *
 * Special:
 * - icon: Square icon-only button
 */

import styled, { css, DefaultTheme } from 'styled-components'

// ============================================================================
// TYPES
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'tinted'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
    $variant?: ButtonVariant
    $size?: ButtonSize
    $fullWidth?: boolean
    $factionPrimary?: string
    $factionHover?: string
    $factionShadow?: string
    /** Custom accent color for tinted variant (hex color) */
    $accentColor?: string
}

// ============================================================================
// VARIANT STYLES
// ============================================================================

const getVariantStyles = (
    variant: ButtonVariant,
    theme: DefaultTheme,
    factionPrimary?: string,
    factionHover?: string,
    factionShadow?: string,
    accentColor?: string,
) => {
    const primary = factionPrimary || theme.colors.primary
    const hover = factionHover || theme.colors.primaryHover
    const shadow = factionShadow || theme.shadows.BUTTON_PRIMARY

    switch (variant) {
        case 'primary':
            return css`
                background-color: ${primary};
                color: black;
                border: 2px solid ${primary};
                box-shadow: ${shadow};

                &:hover:not(:disabled) {
                    background-color: ${hover};
                    border-color: ${hover};
                    transform: translateY(-2px);
                    box-shadow: ${shadow.replace('0.4', '0.5')};
                }

                &:active:not(:disabled) {
                    transform: translateY(0);
                }
            `

        case 'secondary':
            return css`
                background-color: transparent;
                color: ${theme.colors.textMuted};
                border: 2px solid ${theme.colors.cardBorder};

                &:hover:not(:disabled) {
                    border-color: ${theme.colors.textDisabled};
                    color: ${theme.colors.textSecondary};
                }
            `

        case 'danger':
            return css`
                background-color: rgba(239, 68, 68, 0.1);
                color: ${theme.colors.accentRed};
                border: 2px solid #7f1d1d;

                &:hover:not(:disabled) {
                    background-color: rgba(239, 68, 68, 0.2);
                    border-color: ${theme.colors.accentRed};
                }
            `

        case 'success':
            return css`
                background-color: ${theme.colors.accentGreen};
                color: white;
                border: 2px solid ${theme.colors.accentGreen};

                &:hover:not(:disabled) {
                    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
                    transform: translateY(-2px);
                }

                &:active:not(:disabled) {
                    transform: translateY(0);
                }
            `

        case 'ghost':
            return css`
                background-color: rgba(100, 116, 139, 0.3);
                color: ${theme.colors.textMuted};
                border: 1px solid ${theme.colors.cardBorder};

                &:hover:not(:disabled) {
                    background-color: rgba(100, 116, 139, 0.5);
                    color: ${factionPrimary || theme.colors.textSecondary};
                }
            `

        case 'tinted': {
            // Parse hex color to RGB for rgba() usage
            const color = accentColor || theme.colors.textMuted
            const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                return result
                    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
                    : '100, 116, 139'
            }
            const rgb = hexToRgb(color)
            return css`
                background-color: rgba(${rgb}, 0.1);
                color: ${color};
                border: 1px solid rgba(${rgb}, 0.3);

                &:hover:not(:disabled) {
                    background-color: rgba(${rgb}, 0.2);
                    border-color: ${color};
                }
            `
        }

        default:
            return css``
    }
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const getSizeStyles = (size: ButtonSize) => {
    switch (size) {
        case 'sm':
            return css`
                padding: 8px 16px;
                font-size: 12px;
            `
        case 'md':
            return css`
                padding: 12px 24px;
                font-size: 14px;
            `
        case 'lg':
            return css`
                padding: 16px 48px;
                font-size: 16px;
            `
        default:
            return css``
    }
}

// ============================================================================
// BASE BUTTON
// ============================================================================

export const Button = styled.button<ButtonProps>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.sm};
    font-weight: ${({ theme }) => theme.fontWeights.black};
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_NORMAL};
    border-radius: ${({ theme }) => theme.radii.md};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.normal};
    white-space: nowrap;

    ${({ $size = 'md' }) => getSizeStyles($size)}

    ${({
        $variant = 'primary',
        theme,
        $factionPrimary,
        $factionHover,
        $factionShadow,
        $accentColor,
    }) =>
        getVariantStyles(
            $variant,
            theme,
            $factionPrimary,
            $factionHover,
            $factionShadow,
            $accentColor,
        )}

    ${({ $fullWidth }) =>
        $fullWidth &&
        css`
            width: 100%;
        `}

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    &:focus {
        outline: none;
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.primary};
        outline-offset: 2px;
    }
`

// ============================================================================
// ICON BUTTON
// ============================================================================

export interface IconButtonProps {
    $size?: 'sm' | 'md' | 'lg'
    $variant?: 'ghost' | 'danger'
}

const getIconButtonSize = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
        case 'sm':
            return css`
                width: 28px;
                height: 28px;
                font-size: 14px;
            `
        case 'md':
            return css`
                width: 36px;
                height: 36px;
                font-size: 16px;
            `
        case 'lg':
            return css`
                width: 44px;
                height: 44px;
                font-size: 20px;
            `
        default:
            return css``
    }
}

export const IconButton = styled.button<IconButtonProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radii.md};
    background-color: rgba(100, 116, 139, 0.3);
    color: ${({ theme }) => theme.colors.textMuted};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.normal};
    padding: 0;

    ${({ $size = 'md' }) => getIconButtonSize($size)}

    ${({ $variant, theme }) =>
        $variant === 'danger'
            ? css`
                  &:hover:not(:disabled) {
                      background-color: rgba(239, 68, 68, 0.3);
                      color: ${theme.colors.accentRed};
                      border-color: ${theme.colors.accentRed};
                  }
              `
            : css`
                  &:hover:not(:disabled) {
                      background-color: rgba(100, 116, 139, 0.5);
                      color: ${theme.colors.textSecondary};
                  }
              `}

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    &:focus {
        outline: none;
    }
`

// ============================================================================
// LINK BUTTON (anchor styled as button)
// ============================================================================

export interface LinkButtonProps {
    $variant?: ButtonVariant
    $size?: ButtonSize
    $accentColor?: string
}

export const LinkButton = styled.a<LinkButtonProps>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.sm};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    text-transform: uppercase;
    text-decoration: none;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_NORMAL};
    border-radius: ${({ theme }) => theme.radii.md};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.normal};
    white-space: nowrap;

    ${({ $size = 'md' }) => getSizeStyles($size)}

    ${({ $variant = 'tinted', theme, $accentColor }) => {
        // For tinted variant, use accent color
        if ($variant === 'tinted' && $accentColor) {
            const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                return result
                    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
                    : '100, 116, 139'
            }
            const rgb = hexToRgb($accentColor)
            return css`
                background-color: rgba(${rgb}, 0.1);
                color: ${$accentColor};
                border: 1px solid rgba(${rgb}, 0.3);

                &:hover {
                    background-color: rgba(${rgb}, 0.2);
                    border-color: ${$accentColor};
                }
            `
        }
        // Fall back to standard variant styles
        return getVariantStyles($variant, theme)
    }}
`
