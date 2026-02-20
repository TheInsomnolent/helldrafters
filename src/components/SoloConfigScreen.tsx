/**
 * SoloConfigScreen Component
 *
 * Game configuration screen for solo play mode.
 * Uses common styled-components for consistent styling.
 */

import React from 'react'
import styled from 'styled-components'
import { getFactionColors, GRADIENTS } from '../constants/theme'
import { PageContainer, Container, Title, Text, Card, Button, Flex } from '../styles'
import GameConfiguration from './GameConfiguration'
import type { GameConfig } from '../types'
import type { Subfaction } from '../constants/balancingConfig'

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeaderSection = styled.div`
    text-align: center;
    margin-bottom: 48px;
`

const HeaderBar = styled.div`
    background: ${GRADIENTS.HEADER_BAR};
    padding: 12px;
    margin: 0 auto;
    max-width: 400px;
`

const HeaderBarText = styled(Text)`
    font-size: 14px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    margin: 0;
`

const ConfigCard = styled(Card)`
    padding: 32px;
    margin-bottom: 32px;
`

// ============================================================================
// COMPONENT
// ============================================================================

interface SoloConfigScreenProps {
    gameConfig: GameConfig
    eventsEnabled: boolean
    onUpdateGameConfig: (updates: Partial<GameConfig>) => void
    onSetSubfaction: (subfaction: Subfaction) => void
    onSetEventsEnabled: (enabled: boolean) => void
    onBack: () => void
    onContinue: () => void
}

const SoloConfigScreen: React.FC<SoloConfigScreenProps> = ({
    gameConfig,
    eventsEnabled,
    onUpdateGameConfig,
    onSetSubfaction,
    onSetEventsEnabled,
    onBack,
    onContinue,
}) => {
    const factionColors = getFactionColors(gameConfig.faction)

    return (
        <PageContainer $padding="lg">
            <Container $maxWidth="sm">
                {/* Header */}
                <HeaderSection>
                    <Title $factionColor={factionColors.PRIMARY} $factionGlow={factionColors.GLOW}>
                        SOLO OPERATION
                    </Title>
                    <HeaderBar>
                        <HeaderBarText>Configure Your Mission</HeaderBarText>
                    </HeaderBar>
                </HeaderSection>

                {/* Game Configuration */}
                <ConfigCard>
                    <GameConfiguration
                        gameConfig={gameConfig}
                        eventsEnabled={eventsEnabled}
                        onUpdateGameConfig={onUpdateGameConfig}
                        onSetSubfaction={onSetSubfaction}
                        onSetEventsEnabled={onSetEventsEnabled}
                        factionColors={factionColors}
                    />
                </ConfigCard>

                {/* Action Buttons */}
                <Flex $gap="lg">
                    <Button $variant="secondary" $size="md" onClick={onBack} style={{ flex: 1 }}>
                        ← BACK TO MENU
                    </Button>
                    <Button
                        $variant="primary"
                        $size="md"
                        $factionPrimary={factionColors.PRIMARY}
                        $factionHover={factionColors.PRIMARY_HOVER}
                        onClick={onContinue}
                        style={{ flex: 2 }}
                    >
                        CONTINUE →
                    </Button>
                </Flex>
            </Container>
        </PageContainer>
    )
}

export default SoloConfigScreen
