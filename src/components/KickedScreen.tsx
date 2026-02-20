/**
 * KickedScreen Component
 *
 * Displayed when a player is removed from a multiplayer game session by the host.
 * Uses common styled-components for consistent styling.
 */

import React from 'react'
import styled from 'styled-components'
import { getFactionColors } from '../constants/theme'
import { PageContainer, Title, Text, Button } from '../styles'
import type { Faction } from '../types'

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ContentWrapper = styled.div`
    max-width: 500px;
    text-align: center;
`

const IconEmoji = styled.div`
    font-size: 80px;
    margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ErrorTitle = styled(Title)`
    color: ${({ theme }) => theme.colors.accentRed};
    text-shadow: none;
    margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const MessageText = styled(Text)`
    font-size: ${({ theme }) => theme.fontSizes.xl};
    line-height: 1.6;
    margin-bottom: ${({ theme }) => theme.spacing.xxxl};
`

// ============================================================================
// COMPONENT
// ============================================================================

interface KickedScreenProps {
    faction: Faction
    onReturnToMenu: () => void
}

const KickedScreen: React.FC<KickedScreenProps> = ({ faction, onReturnToMenu }) => {
    const factionColors = getFactionColors(faction)

    return (
        <PageContainer
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <ContentWrapper>
                <div style={{ marginBottom: '40px' }}>
                    <IconEmoji>🚫</IconEmoji>
                    <ErrorTitle>REMOVED FROM SQUAD</ErrorTitle>
                    <MessageText $color="secondary">
                        The host has removed you from the game session.
                        <br />
                        <br />
                        You can rejoin using the same lobby code if the host allows it.
                    </MessageText>
                </div>

                <Button
                    $variant="primary"
                    $size="lg"
                    $factionPrimary={factionColors.PRIMARY}
                    $factionHover={factionColors.PRIMARY_HOVER}
                    onClick={onReturnToMenu}
                    style={{ width: '100%' }}
                >
                    Return to Menu
                </Button>
            </ContentWrapper>
        </PageContainer>
    )
}

export default KickedScreen
