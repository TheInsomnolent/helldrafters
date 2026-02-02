/**
 * LoadingScreen Component
 *
 * Simple loading screen with animated dots.
 * Uses common styled-components for consistent styling.
 */

import React from 'react'
import styled, { keyframes } from 'styled-components'
import { PageContainer, Container, Title, Text, Flex } from '../styles'
import type { FactionColorSet } from '../constants/theme'

// ============================================================================
// ANIMATIONS
// ============================================================================

const pulse = keyframes`
    0%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
    }
    50% {
        opacity: 1;
        transform: scale(1.2);
    }
`

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const LoadingDot = styled.div<{ $factionColor: string; $delay?: string }>`
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${({ $factionColor }) => $factionColor};
    animation: ${pulse} 1.5s infinite;
    animation-delay: ${({ $delay }) => $delay || '0s'};
`

const CenteredContent = styled.div`
    text-align: center;
    margin-top: 120px;
`

// ============================================================================
// COMPONENT
// ============================================================================

interface LoadingScreenProps {
    title: string
    subtitle?: string
    factionColors: FactionColorSet
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ title, subtitle, factionColors }) => (
    <PageContainer>
        <Container $maxWidth="lg">
            <CenteredContent>
                <Title $factionColor={factionColors.PRIMARY} $factionGlow={factionColors.GLOW}>
                    {title}
                </Title>
                {subtitle && (
                    <Text
                        $color="secondary"
                        $size="lg"
                        style={{ marginBottom: '32px', fontSize: '18px' }}
                    >
                        {subtitle}
                    </Text>
                )}
                <Flex $justify="center" $gap="md" style={{ marginTop: '32px' }}>
                    <LoadingDot $factionColor={factionColors.PRIMARY} />
                    <LoadingDot $factionColor={factionColors.PRIMARY} $delay="0.2s" />
                    <LoadingDot $factionColor={factionColors.PRIMARY} $delay="0.4s" />
                </Flex>
            </CenteredContent>
        </Container>
    </PageContainer>
)

export default LoadingScreen
