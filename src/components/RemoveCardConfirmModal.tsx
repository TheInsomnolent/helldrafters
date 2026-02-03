/**
 * RemoveCardConfirmModal Component
 *
 * Confirmation modal displayed when a player wants to remove a card from their draft hand.
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
import { getArmorComboDisplayName } from '../utils/itemHelpers'
import type { DraftHandItem } from '../types'
import { isArmorCombo, isItem } from './ItemCard'

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const WarningNotice = styled(Card)`
    background-color: #1f2937;
    border: 1px solid rgba(245, 158, 11, 0.3);
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
    color: ${({ theme }) => theme.colors.primary};
    font-size: 18px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    margin: 0;
`

const WarningTitle = styled(Text)`
    color: #f59e0b;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    margin-bottom: 16px;
`

// ============================================================================
// COMPONENT
// ============================================================================

interface RemoveCardConfirmModalProps {
    isOpen: boolean
    pendingCardRemoval: DraftHandItem | null
    onCancel: () => void
    onConfirm: () => void
}

const RemoveCardConfirmModal: React.FC<RemoveCardConfirmModalProps> = ({
    isOpen,
    pendingCardRemoval,
    onCancel,
    onConfirm,
}) => {
    if (!isOpen) return null

    const getCardName = () => {
        if (!pendingCardRemoval) return 'Unknown Item'
        if (isItem(pendingCardRemoval)) return pendingCardRemoval.name
        if (isArmorCombo(pendingCardRemoval)) {
            return getArmorComboDisplayName(
                pendingCardRemoval.passive,
                pendingCardRemoval.armorClass,
            )
        }
        return 'Unknown Item'
    }

    return (
        <ModalBackdrop>
            <ModalContainer $size="md" $factionPrimary="#f59e0b">
                <ModalHeader $factionPrimary="#f59e0b">
                    <ModalTitle $factionColor="#f59e0b">⚠️ Remove Card</ModalTitle>
                </ModalHeader>

                <ModalContent>
                    <WarningNotice>
                        <WarningTitle>⚠️ Important Notice:</WarningTitle>
                        <Text $color="primary" style={{ marginBottom: '12px' }}>
                            This feature should{' '}
                            <strong style={{ color: '#fbbf24' }}>only be used</strong> if you
                            misconfigured your warbonds and do not have access to an item that
                            appeared in your draft.
                        </Text>
                        <Text $color="muted" style={{ fontStyle: 'italic' }}>
                            The card will be replaced with a new random card from your pool. This
                            action cannot be undone.
                        </Text>
                    </WarningNotice>

                    {pendingCardRemoval && (
                        <ItemPreview>
                            <Text $color="muted" style={{ marginBottom: '8px' }}>
                                Removing:
                            </Text>
                            <ItemName>{getCardName()}</ItemName>
                        </ItemPreview>
                    )}

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
                            $variant="primary"
                            $size="md"
                            $factionPrimary="#f59e0b"
                            $factionHover="#d97706"
                            onClick={onConfirm}
                            style={{ flex: 1 }}
                        >
                            Confirm Remove
                        </Button>
                    </Flex>
                </ModalContent>
            </ModalContainer>
        </ModalBackdrop>
    )
}

export default RemoveCardConfirmModal
