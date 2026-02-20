/**
 * SacrificeConfirmModal Component
 *
 * Confirmation modal displayed when a player selects an item to sacrifice
 * after failing to extract from a mission.
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
    Flex,
    Card,
} from '../styles'
import type { Item } from '../types'

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const WarningNotice = styled(Card)`
    background-color: #1f2937;
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 20px;
    margin-bottom: 24px;
`

const ItemPreview = styled(Card)`
    background-color: #1f2937;
    padding: 16px;
    margin-bottom: 24px;
    text-align: center;
`

const ItemName = styled.p`
    color: ${({ theme }) => theme.colors.accentRed};
    font-size: 18px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    margin: 0 0 4px 0;
`

const ItemDetails = styled(Text)`
    color: ${({ theme }) => theme.colors.textDisabled};
`

const WarningTitle = styled(Text)`
    color: ${({ theme }) => theme.colors.accentRed};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    margin-bottom: 16px;
`

// ============================================================================
// COMPONENT
// ============================================================================

interface SacrificeConfirmModalProps {
    isOpen: boolean
    pendingSacrificeItem: (Item & { slot: string }) | null
    onCancel: () => void
    onConfirm: () => void
}

const SacrificeConfirmModal: React.FC<SacrificeConfirmModalProps> = ({
    isOpen,
    pendingSacrificeItem,
    onCancel,
    onConfirm,
}) => {
    if (!isOpen || !pendingSacrificeItem) return null

    return (
        <ModalBackdrop>
            <ModalContainer $size="md" $factionPrimary="#ef4444">
                <ModalHeader $factionPrimary="#ef4444">
                    <ModalTitle $factionColor="#ef4444">⚠️ Sacrifice Item</ModalTitle>
                </ModalHeader>

                <ModalContent>
                    <WarningNotice>
                        <WarningTitle>⚠️ Extraction Failure Penalty</WarningTitle>
                        <Text $color="primary">
                            This item will be{' '}
                            <strong style={{ color: '#fca5a5' }}>permanently removed</strong> from
                            your inventory and loadout. This action cannot be undone.
                        </Text>
                    </WarningNotice>

                    <ItemPreview>
                        <Text $color="muted" style={{ marginBottom: '8px' }}>
                            Sacrificing:
                        </Text>
                        <ItemName>{pendingSacrificeItem.name}</ItemName>
                        <ItemDetails>
                            {pendingSacrificeItem.slot} • {pendingSacrificeItem.rarity}
                        </ItemDetails>
                    </ItemPreview>

                    <Flex $gap="md">
                        <Button
                            $variant="secondary"
                            $size="md"
                            onClick={onCancel}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            $variant="danger"
                            $size="md"
                            onClick={onConfirm}
                            style={{ flex: 1 }}
                        >
                            Confirm Sacrifice
                        </Button>
                    </Flex>
                </ModalContent>
            </ModalContainer>
        </ModalBackdrop>
    )
}

export default SacrificeConfirmModal
