/**
 * StratagemReplacementModal Component
 *
 * Modal displayed when a player drafts a stratagem but all slots are full.
 * Allows selecting which existing stratagem to replace.
 * Uses common styled-components for consistent modal styling.
 */

import React from 'react'
import styled from 'styled-components'
import {
    ModalBackdrop,
    ModalContainer,
    ModalHeader,
    ModalContent,
    ModalTitle,
    Text,
    Button,
    Grid,
    Card,
} from '../styles'
import { getItemById } from '../utils/itemHelpers'
import type { FactionColorSet } from '../constants/theme'
import type { Item, Player } from '../types'

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const PendingItemPreview = styled(Card)`
    background-color: #1f2937;
    padding: 16px;
    margin-bottom: 24px;
    text-align: center;
`

const SlotButton = styled.button<{ $factionPrimary?: string }>`
    background-color: #1f2937;
    border: 2px solid rgba(100, 116, 139, 0.5);
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: ${({ theme }) => theme.spacing.lg};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.normal};
    text-align: left;

    &:hover {
        border-color: ${({ $factionPrimary, theme }) => $factionPrimary || theme.colors.primary};
    }
`

const SlotLabel = styled.div`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.textDisabled};
    text-transform: uppercase;
    margin-bottom: 4px;
`

const SlotName = styled.div`
    color: white;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-size: 14px;
`

const SlotRarity = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-top: 4px;
`

const ItemName = styled.div<{ $factionColor?: string }>`
    color: ${({ $factionColor, theme }) => $factionColor || theme.colors.primary};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-size: 18px;
`

const ItemRarity = styled.div`
    color: ${({ theme }) => theme.colors.textDisabled};
    font-size: 12px;
    margin-top: 4px;
`

// ============================================================================
// COMPONENT
// ============================================================================

interface StratagemReplacementModalProps {
    isOpen: boolean
    pendingStratagem: Item | null
    player: Player
    factionColors: FactionColorSet
    onSelectSlot: (slotIndex: number) => void
    onCancel: () => void
}

const StratagemReplacementModal: React.FC<StratagemReplacementModalProps> = ({
    isOpen,
    pendingStratagem,
    player,
    factionColors,
    onSelectSlot,
    onCancel,
}) => {
    if (!isOpen || !pendingStratagem) return null

    return (
        <ModalBackdrop>
            <ModalContainer $size="lg" $factionPrimary={factionColors.PRIMARY}>
                <ModalHeader $factionPrimary={factionColors.PRIMARY}>
                    <ModalTitle $factionColor={factionColors.PRIMARY}>Replace Stratagem</ModalTitle>
                </ModalHeader>

                <ModalContent>
                    <Text $color="primary" style={{ textAlign: 'center', marginBottom: '24px' }}>
                        All stratagem slots are full. Select which stratagem to replace with:
                    </Text>

                    <PendingItemPreview>
                        <ItemName $factionColor={factionColors.PRIMARY}>
                            {pendingStratagem.name}
                        </ItemName>
                        <ItemRarity>{pendingStratagem.rarity}</ItemRarity>
                    </PendingItemPreview>

                    <Grid $columns={2} $gap="lg" style={{ marginBottom: '24px' }}>
                        {player.loadout.stratagems.map((sid, i) => {
                            const stratagem = sid ? getItemById(sid) : undefined
                            return (
                                <SlotButton
                                    key={i}
                                    onClick={() => onSelectSlot(i)}
                                    $factionPrimary={factionColors.PRIMARY}
                                >
                                    <SlotLabel>Slot {i + 1}</SlotLabel>
                                    <SlotName>{stratagem?.name || 'Empty'}</SlotName>
                                    {stratagem && <SlotRarity>{stratagem.rarity}</SlotRarity>}
                                </SlotButton>
                            )
                        })}
                    </Grid>

                    <Button
                        $variant="danger"
                        $size="sm"
                        onClick={onCancel}
                        style={{ width: '100%' }}
                    >
                        Cancel
                    </Button>
                </ModalContent>
            </ModalContainer>
        </ModalBackdrop>
    )
}

export default StratagemReplacementModal
