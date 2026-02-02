/**
 * Icon container styled-components
 *
 * Components:
 * - ProgressCircle: Circular progress/step indicator
 * - LockButton: Small action button for items
 */

import styled, { css } from 'styled-components'

// ============================================================================
// PROGRESS CIRCLE (Step indicator)
// ============================================================================

export interface ProgressCircleProps {
    $complete?: boolean
    $factionPrimary?: string
    $size?: 'sm' | 'md'
}

export const ProgressCircle = styled.div<ProgressCircleProps>`
    border-radius: 50%;
    border: 2px solid ${({ $factionPrimary, theme }) => $factionPrimary || theme.colors.primary};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: ${({ theme }) => theme.transitions.normal};

    ${({ $size = 'md' }) =>
        $size === 'sm'
            ? css`
                  width: 12px;
                  height: 12px;
              `
            : css`
                  width: 16px;
                  height: 16px;
              `}

    ${({ $complete, $factionPrimary, theme }) =>
        $complete
            ? css`
                  background-color: ${$factionPrimary || theme.colors.primary};
              `
            : css`
                  background-color: transparent;
              `}
`

// ============================================================================
// LOCK BUTTON (Small action button for items)
// ============================================================================

export interface LockButtonProps {
    $locked?: boolean
    $factionPrimary?: string
}

export const LockButton = styled.button<LockButtonProps>`
    padding: 4px;
    min-width: 24px;
    min-height: 24px;
    border-radius: ${({ theme }) => theme.radii.sm};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.normal};
    display: flex;
    align-items: center;
    justify-content: center;

    ${({ $locked, $factionPrimary, theme }) =>
        $locked
            ? css`
                  background-color: ${$factionPrimary
                      ? `${$factionPrimary}20`
                      : 'rgba(245, 198, 66, 0.2)'};
                  border: 1px solid
                      ${$factionPrimary ? `${$factionPrimary}60` : 'rgba(245, 198, 66, 0.6)'};
                  color: ${$factionPrimary || theme.colors.primary};
              `
            : css`
                  background-color: transparent;
                  border: 1px solid ${theme.colors.cardBorder};
                  color: ${theme.colors.textMuted};

                  &:hover {
                      background-color: rgba(100, 116, 139, 0.2);
                      color: ${theme.colors.textSecondary};
                  }
              `}

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`
