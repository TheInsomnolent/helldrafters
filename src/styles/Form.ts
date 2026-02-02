/**
 * Form styled-components
 *
 * Components:
 * - Input: Text input field
 * - Checkbox: Styled checkbox
 * - CheckboxLabel: Checkbox with label container
 * - FormGroup: Form field wrapper
 */

import styled, { css } from 'styled-components'

// ============================================================================
// INPUT
// ============================================================================

export interface InputProps {
    $size?: 'sm' | 'md' | 'lg'
    $error?: boolean
    $factionPrimary?: string
    $factionShadow?: string
}

const getInputSize = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
        case 'sm':
            return css`
                padding: 8px 12px;
                font-size: 14px;
            `
        case 'md':
            return css`
                padding: 16px;
                font-size: 16px;
            `
        case 'lg':
            return css`
                padding: 20px 24px;
                font-size: 28px;
                font-weight: 900;
            `
        default:
            return css``
    }
}

export const Input = styled.input<InputProps>`
    width: 100%;
    background-color: ${({ theme }) => theme.colors.bgMain};
    border: 2px solid
        ${({ $error, theme }) => ($error ? theme.colors.accentRed : theme.colors.cardBorder)};
    border-radius: ${({ theme }) => theme.radii.md};
    color: ${({ theme }) => theme.colors.textPrimary};
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_NORMAL};
    outline: none;
    transition: ${({ theme }) => theme.transitions.normal};

    ${({ $size = 'md' }) => getInputSize($size)}

    &::placeholder {
        color: ${({ theme }) => theme.colors.textDisabled};
        text-transform: none;
    }

    &:focus {
        border-color: ${({ $factionPrimary, theme }) => $factionPrimary || theme.colors.primary};
        box-shadow: ${({ $factionShadow }) =>
            $factionShadow || '0 4px 20px rgba(245, 198, 66, 0.3)'};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`

// ============================================================================
// CHECKBOX
// ============================================================================

export interface CheckboxProps {
    $factionPrimary?: string
    $size?: 'sm' | 'md' | 'lg'
}

const getCheckboxSize = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
        case 'sm':
            return css`
                width: 16px;
                height: 16px;
            `
        case 'md':
            return css`
                width: 20px;
                height: 20px;
            `
        case 'lg':
            return css`
                width: 24px;
                height: 24px;
            `
        default:
            return css``
    }
}

export const Checkbox = styled.input.attrs({ type: 'checkbox' })<CheckboxProps>`
    cursor: pointer;
    accent-color: ${({ $factionPrimary, theme }) => $factionPrimary || theme.colors.primary};

    ${({ $size = 'md' }) => getCheckboxSize($size)}

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`

// ============================================================================
// CHECKBOX LABEL (Checkbox with clickable label area)
// ============================================================================

export interface CheckboxLabelProps {
    $selected?: boolean
    $factionPrimary?: string
}

export const CheckboxLabel = styled.label<CheckboxLabelProps>`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};
    cursor: pointer;
    padding: ${({ theme }) => theme.spacing.md};
    border-radius: ${({ theme }) => theme.radii.md};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    transition: ${({ theme }) => theme.transitions.normal};

    ${({ $selected, $factionPrimary }) =>
        $selected
            ? css`
                  background-color: ${$factionPrimary
                      ? `${$factionPrimary}1A`
                      : 'rgba(245, 198, 66, 0.1)'};
              `
            : css`
                  background-color: transparent;

                  &:hover {
                      background-color: rgba(100, 116, 139, 0.1);
                  }
              `}
`
