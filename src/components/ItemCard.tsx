/**
 * ItemCard Component
 *
 * Displays a draft item card with item details, warbond info, and action buttons.
 * Used in the draft phase and other item selection contexts.
 */

import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import { ARMOR_PASSIVE_DESCRIPTIONS } from '../constants/armorPassives'
import type { FactionColorSet } from '../constants/theme'
import { TYPE, RARITY, type Rarity } from '../constants/types'
import { getWarbondById } from '../constants/warbonds'
import { getItemIconUrl } from '../utils/iconHelpers'
import type { ArmorCombo } from '../utils/itemHelpers'
import type { Item, DraftHandItem } from '../types'
import { Flex } from '../styles'

// Type guard for ArmorCombo (has items array)
const isArmorCombo = (item: DraftHandItem): item is ArmorCombo =>
    'items' in item && Array.isArray((item as ArmorCombo).items)

// Type guard for regular Item (has id string directly)
const isItem = (item: DraftHandItem): item is Item =>
    'id' in item && typeof (item as Item).id === 'string' && !('items' in item)

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

// Pulsating glow animation (similar to HELLDRAFTERS title)
const pulseGlow = keyframes`
    0% {
        box-shadow: 0 0 0 rgba(245, 198, 66, 0);
    }
    25% {
        box-shadow: 0 0 20px rgba(245, 198, 66, 0.5), 0 0 40px rgba(245, 198, 66, 0.3);
    }
    50% {
        box-shadow: 0 0 0 rgba(245, 198, 66, 0);
    }
    100% {
        box-shadow: 0 0 0 rgba(245, 198, 66, 0);
    }
`

const CardContainer = styled.div<{
    $factionPrimary?: string
    $shouldPulse?: boolean
    $animationDelay?: number
}>`
    position: relative;
    background-color: ${({ theme }) => theme.colors.cardBg};
    border: 2px solid rgba(100, 116, 139, 0.5);
    padding: ${({ theme }) => theme.spacing.lg};
    border-radius: ${({ theme }) => theme.radii.lg};
    transition: ${({ theme }) => theme.transitions.normal};
    display: flex;
    flex-direction: column;
    min-height: 320px;
    width: 280px;
    flex-shrink: 0;

    ${({ $shouldPulse, $animationDelay = 0 }) =>
        $shouldPulse &&
        css`
            animation: ${pulseGlow} 2s ease-in-out infinite;
            animation-delay: ${$animationDelay}s;
        `}

    &:hover {
        border-color: ${({ $factionPrimary }) => $factionPrimary || 'rgba(100, 116, 139, 0.5)'};
    }
`

const RemoveButton = styled.button`
    position: absolute;
    top: ${({ theme }) => theme.spacing.sm};
    right: ${({ theme }) => theme.spacing.sm};
    width: 28px;
    height: 28px;
    border-radius: ${({ theme }) => theme.radii.sm};
    background-color: rgba(239, 68, 68, 0.8);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    z-index: 10;
    transition: ${({ theme }) => theme.transitions.normal};

    &:hover {
        background-color: rgba(239, 68, 68, 1);
    }
`

const CardContent = styled.div<{ $clickable?: boolean; $hasRemoveButton?: boolean }>`
    cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    padding-top: ${({ $hasRemoveButton }) => ($hasRemoveButton ? '32px' : '0')};
`

const ItemType = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.textDisabled};
    text-transform: uppercase;
    letter-spacing: 1px;
`

const ItemIcon = styled.img`
    width: 64px;
    height: 64px;
    object-fit: contain;
`

const ItemName = styled.h3<{ $factionColor?: string }>`
    color: ${({ $factionColor, theme }) => $factionColor || theme.colors.primary};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-size: ${({ theme }) => theme.fontSizes.lg};
    margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
    text-align: center;
`

const PassiveBox = styled.div`
    background-color: rgba(100, 116, 139, 0.2);
    padding: ${({ theme }) => theme.spacing.sm};
    border-radius: ${({ theme }) => theme.radii.sm};
    margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const PassiveName = styled.div<{ $factionColor?: string }>`
    font-size: 11px;
    color: ${({ $factionColor, theme }) => $factionColor || theme.colors.primary};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    margin-bottom: 4px;
    text-transform: capitalize;
`

const PassiveDescription = styled.div`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.textSecondary};
`

const TagContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: ${({ theme }) => theme.spacing.sm};
    justify-content: center;
`

const Tag = styled.span`
    font-size: 9px;
    padding: 2px 6px;
    background-color: rgba(100, 116, 139, 0.3);
    border-radius: 2px;
    color: ${({ theme }) => theme.colors.textSecondary};
    text-transform: uppercase;
`

const SourceFooter = styled.div`
    margin-top: auto;
    text-align: center;
    padding-top: ${({ theme }) => theme.spacing.sm};
    border-top: 1px solid rgba(100, 116, 139, 0.3);
`

const SourceText = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.textDisabled};
`

// Rarity badge colors
const RARITY_COLORS: Record<Rarity, { bg: string; color: string }> = {
    [RARITY.COMMON]: { bg: '#6b7280', color: 'white' },
    [RARITY.UNCOMMON]: { bg: '#22c55e', color: 'black' },
    [RARITY.RARE]: { bg: '#f97316', color: 'black' },
    [RARITY.LEGENDARY]: { bg: '#9333ea', color: 'white' },
}

const RarityBadgeStyled = styled.span<{ $rarity: Rarity }>`
    font-size: 10px;
    text-transform: uppercase;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.radii.sm};
    ${({ $rarity }) => {
        const colors = RARITY_COLORS[$rarity] || RARITY_COLORS[RARITY.COMMON]
        return css`
            background-color: ${colors.bg};
            color: ${colors.color};
        `
    }}
`

// ============================================================================
// RARITY BADGE SUB-COMPONENT
// ============================================================================

interface RarityBadgeProps {
    rarity: Rarity
}

const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity }) => (
    <RarityBadgeStyled $rarity={rarity}>{rarity}</RarityBadgeStyled>
)

interface ItemCardProps {
    item: DraftHandItem
    factionColors: FactionColorSet
    onSelect?: (item: DraftHandItem) => void
    onRemove?: (item: DraftHandItem) => void
    shouldPulse?: boolean
    animationDelay?: number
}

const ItemCard: React.FC<ItemCardProps> = ({
    item,
    factionColors,
    onSelect,
    onRemove,
    shouldPulse = false,
    animationDelay = 0,
}) => {
    // Guard: if item is undefined, don't render
    if (!item) {
        return null
    }

    // Check if this is an armor combo using the type guard
    const isArmorComboItem = isArmorCombo(item)

    // Guard: for regular items, require name; for armor combos, require items with names
    if (!isArmorComboItem && isItem(item) && !item.name) {
        return null
    }

    // For armor combos, use the first item as representative for display
    const displayItem = isArmorComboItem ? item.items[0] : (item as Item)

    // Guard: if displayItem is invalid, don't render
    if (!displayItem || !displayItem.name) {
        return null
    }

    // For armor combos, create a slash-delimited name
    const displayName = isArmorComboItem
        ? item.items.map((armor: Item) => armor?.name || 'Unknown').join(' / ')
        : displayItem.name

    let armorPassiveDescription = null
    let armorPassiveKey = null
    const isArmorItem = isArmorComboItem || displayItem?.type === TYPE.ARMOR
    if (isArmorItem) {
        armorPassiveKey = isArmorComboItem
            ? item.passive
            : (item as Item & { passive?: string }).passive
        if (armorPassiveKey) {
            const description = ARMOR_PASSIVE_DESCRIPTIONS[armorPassiveKey]
            armorPassiveDescription = description || 'Passive effect details unavailable.'
        }
    }

    // Get warbond info for display
    const warbondId = displayItem.warbond
    const isSuperstore = displayItem.superstore
    const warbondInfo = warbondId ? getWarbondById(warbondId) : null
    const sourceName = isSuperstore ? 'Superstore' : warbondInfo?.name || 'Unknown'
    const tags: string[] = [...(displayItem.tags || [])]

    // Show armor class in tags
    const armorClass = isArmorComboItem ? item.armorClass : undefined
    const armorClassDisplay = armorClass
        ? armorClass.slice(0, 1).toUpperCase() + armorClass.slice(1)
        : null
    if (armorClassDisplay && !tags.includes(armorClassDisplay)) {
        tags.push(armorClassDisplay)
    }

    // Get item icon URL - use helper function
    const iconUrl = getItemIconUrl(displayItem)

    return (
        <CardContainer
            $factionPrimary={onSelect ? factionColors.PRIMARY : undefined}
            $shouldPulse={shouldPulse}
            $animationDelay={animationDelay}
        >
            {onRemove && (
                <RemoveButton
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove(item)
                    }}
                    title="Remove this card"
                >
                    ×
                </RemoveButton>
            )}
            <CardContent
                onClick={() => onSelect && onSelect(item)}
                $clickable={!!onSelect}
                $hasRemoveButton={!!onRemove}
            >
                {/* Header with type and rarity */}
                <Flex $justify="between" $align="center" style={{ marginBottom: '12px' }}>
                    <ItemType>{isArmorComboItem ? TYPE.ARMOR : displayItem.type}</ItemType>
                    <RarityBadge rarity={displayItem.rarity as Rarity} />
                </Flex>

                {/* Item Icon */}
                {iconUrl && (
                    <Flex $justify="center" style={{ marginBottom: '12px' }}>
                        <ItemIcon
                            src={iconUrl}
                            alt={displayName}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                            }}
                        />
                    </Flex>
                )}

                {/* Item Name */}
                <ItemName $factionColor={factionColors.PRIMARY}>{displayName}</ItemName>

                {/* Armor Passive */}
                {armorPassiveKey && (
                    <PassiveBox>
                        <PassiveName $factionColor={factionColors.PRIMARY}>
                            {armorPassiveKey.replace(/_/g, ' ')}
                        </PassiveName>
                        {armorPassiveDescription && (
                            <PassiveDescription>{armorPassiveDescription}</PassiveDescription>
                        )}
                    </PassiveBox>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                    <TagContainer>
                        {tags.map((tag, i) => (
                            <Tag key={i}>{tag}</Tag>
                        ))}
                    </TagContainer>
                )}

                {/* Source/Warbond */}
                <SourceFooter>
                    <SourceText>{sourceName}</SourceText>
                </SourceFooter>
            </CardContent>
        </CardContainer>
    )
}

export { ItemCard, RarityBadge, isArmorCombo, isItem }
