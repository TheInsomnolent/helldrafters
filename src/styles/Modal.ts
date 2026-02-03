/**
 * Modal styled-components
 *
 * Components:
 * - ModalBackdrop: Full-screen overlay
 * - ModalContainer: Modal content wrapper
 * - ModalHeader: Header with title and close button
 * - ModalContent: Main content area
 * - ModalFooter: Footer with actions
 */

import styled, { css, keyframes } from 'styled-components'
import { ThemeSpacing } from './theme'

// ============================================================================
// ANIMATIONS
// ============================================================================

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`

const slideIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
`

// ============================================================================
// MODAL BACKDROP
// ============================================================================

export const ModalBackdrop = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: ${({ theme }) => theme.zIndex.modal};
    padding: ${({ theme }) => theme.spacing.xl};
    overflow-y: auto;
    animation: ${fadeIn} 0.2s ease-out;
`

// ============================================================================
// MODAL CONTAINER
// ============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalContainerProps {
    $size?: ModalSize
    $factionPrimary?: string
}

const getModalSize = (size: ModalSize) => {
    switch (size) {
        case 'sm':
            return '500px'
        case 'md':
            return '700px'
        case 'lg':
            return '900px'
        case 'xl':
            return '1100px'
        case 'full':
            return '95vw'
        default:
            return '800px'
    }
}

export const ModalContainer = styled.div<ModalContainerProps>`
    background-color: ${({ theme }) => theme.colors.bgMain};
    border-radius: ${({ theme }) => theme.radii.xxl};
    border: 2px solid ${({ $factionPrimary, theme }) => $factionPrimary || theme.colors.primary};
    max-width: ${({ $size = 'md' }) => getModalSize($size)};
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: ${({ $factionPrimary }) =>
        $factionPrimary ? `0 0 40px ${$factionPrimary}40` : '0 0 40px rgba(245, 198, 66, 0.25)'};
    animation: ${slideIn} 0.2s ease-out;

    /* Custom scrollbar inside modal */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: ${({ theme }) => theme.colors.bgMain};
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.colors.textDisabled};
        border-radius: ${({ theme }) => theme.radii.md};
    }

    &::-webkit-scrollbar-thumb:hover {
        background: ${({ theme }) => theme.colors.textMuted};
    }
`

// ============================================================================
// MODAL HEADER
// ============================================================================

export interface ModalHeaderProps {
    $factionPrimary?: string
    $sticky?: boolean
}

export const ModalHeader = styled.header<ModalHeaderProps>`
    padding: ${({ theme }) => theme.spacing.xl};
    border-bottom: 2px solid
        ${({ $factionPrimary }) =>
            $factionPrimary ? `${$factionPrimary}4D` : 'rgba(100, 116, 139, 0.3)'};
    display: flex;
    justify-content: space-between;
    align-items: center;

    ${({ $sticky, theme }) =>
        $sticky &&
        css`
            position: sticky;
            top: 0;
            background-color: ${theme.colors.bgMain};
            z-index: 1;
        `}
`

// ============================================================================
// MODAL CONTENT
// ============================================================================

export interface ModalContentProps {
    $padding?: ThemeSpacing
}

export const ModalContent = styled.div<ModalContentProps>`
    padding: ${({ $padding, theme }) => ($padding ? theme.spacing[$padding] : theme.spacing.xxl)};
`

// ============================================================================
// MODAL FOOTER
// ============================================================================

export interface ModalFooterProps {
    $sticky?: boolean
}

export const ModalFooter = styled.footer<ModalFooterProps>`
    padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
    border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
    display: flex;
    justify-content: flex-end;
    gap: ${({ theme }) => theme.spacing.md};

    ${({ $sticky, theme }) =>
        $sticky &&
        css`
            position: sticky;
            bottom: 0;
            background-color: ${theme.colors.bgMain};
        `}
`

// ============================================================================
// MODAL TITLE (convenience re-export from Text)
// ============================================================================

export { ModalTitle } from './Text'
