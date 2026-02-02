/**
 * Layout styled-components
 *
 * Components:
 * - Flex: Flexible flexbox container
 * - Grid: CSS Grid container
 * - Container: Max-width content container
 * - PageContainer: Full-page wrapper with background
 * - Divider: Section divider
 * - HeaderBar: Sticky header bar
 */

import styled, { css } from 'styled-components'
import { ThemeSpacing } from './theme'

// ============================================================================
// FLEX CONTAINER
// ============================================================================

export interface FlexProps {
    $direction?: 'row' | 'column'
    $align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
    $justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
    $gap?: ThemeSpacing
    $wrap?: boolean
    $inline?: boolean
}

const getAlignValue = (align: FlexProps['$align']) => {
    switch (align) {
        case 'start':
            return 'flex-start'
        case 'end':
            return 'flex-end'
        default:
            return align
    }
}

const getJustifyValue = (justify: FlexProps['$justify']) => {
    switch (justify) {
        case 'start':
            return 'flex-start'
        case 'end':
            return 'flex-end'
        case 'between':
            return 'space-between'
        case 'around':
            return 'space-around'
        case 'evenly':
            return 'space-evenly'
        default:
            return justify
    }
}

export const Flex = styled.div<FlexProps>`
    display: ${({ $inline }) => ($inline ? 'inline-flex' : 'flex')};
    flex-direction: ${({ $direction = 'row' }) => $direction};
    align-items: ${({ $align = 'stretch' }) => getAlignValue($align)};
    justify-content: ${({ $justify = 'start' }) => getJustifyValue($justify)};
    gap: ${({ $gap, theme }) => ($gap ? theme.spacing[$gap] : '0')};
    flex-wrap: ${({ $wrap }) => ($wrap ? 'wrap' : 'nowrap')};
`

// ============================================================================
// GRID CONTAINER
// ============================================================================

export interface GridProps {
    $columns?: number | 'auto-fill' | 'auto-fit'
    $minWidth?: string
    $gap?: ThemeSpacing
    $rowGap?: ThemeSpacing
    $columnGap?: ThemeSpacing
}

export const Grid = styled.div<GridProps>`
    display: grid;
    gap: ${({ $gap, theme }) => ($gap ? theme.spacing[$gap] : theme.spacing.lg)};

    ${({ $rowGap, theme }) =>
        $rowGap &&
        css`
            row-gap: ${theme.spacing[$rowGap]};
        `}

    ${({ $columnGap, theme }) =>
        $columnGap &&
        css`
            column-gap: ${theme.spacing[$columnGap]};
        `}

    ${({ $columns, $minWidth = '280px' }) => {
        if (typeof $columns === 'number') {
            return css`
                grid-template-columns: repeat(${$columns}, 1fr);
            `
        }
        if ($columns === 'auto-fill' || $columns === 'auto-fit') {
            return css`
                grid-template-columns: repeat(${$columns}, minmax(${$minWidth}, 1fr));
            `
        }
        // Default to auto-fill
        return css`
            grid-template-columns: repeat(auto-fill, minmax(${$minWidth}, 1fr));
        `
    }}
`

// ============================================================================
// CONTAINER (Max-width wrapper)
// ============================================================================

export interface ContainerProps {
    $maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const getMaxWidth = (size: ContainerProps['$maxWidth']) => {
    switch (size) {
        case 'sm':
            return '600px'
        case 'md':
            return '800px'
        case 'lg':
            return '1024px'
        case 'xl':
            return '1200px'
        case 'full':
            return '100%'
        default:
            return '1200px'
    }
}

export const Container = styled.div<ContainerProps>`
    max-width: ${({ $maxWidth = 'xl' }) => getMaxWidth($maxWidth)};
    margin: 0 auto;
    width: 100%;
`

// ============================================================================
// PAGE CONTAINER (Full-page wrapper)
// ============================================================================

export interface PageContainerProps {
    $padding?: ThemeSpacing
}

export const PageContainer = styled.div<PageContainerProps>`
    min-height: 100vh;
    background: linear-gradient(
        to bottom,
        ${({ theme }) => theme.colors.bgGradientStart},
        ${({ theme }) => theme.colors.bgGradientEnd}
    );
    color: ${({ theme }) => theme.colors.textPrimary};
    padding: ${({ $padding, theme }) => ($padding ? theme.spacing[$padding] : '80px 24px')};
`

// ============================================================================
// HEADER BAR (Sticky header)
// ============================================================================

export interface HeaderBarProps {
    $factionPrimary?: string
}

export const HeaderBar = styled.header<HeaderBarProps>`
    background-color: ${({ theme }) => theme.colors.bgGradientEnd};
    border-bottom: 1px solid
        ${({ $factionPrimary }) =>
            $factionPrimary ? `${$factionPrimary}4D` : 'rgba(100, 116, 139, 0.3)'};
    padding: ${({ theme }) => theme.spacing.lg};
    position: sticky;
    top: 0;
    z-index: ${({ theme }) => theme.zIndex.sticky};
`
