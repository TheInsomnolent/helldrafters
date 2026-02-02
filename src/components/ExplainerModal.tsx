import React from 'react'
import { X, Target, Zap, Shield, Star } from 'lucide-react'
import styled from 'styled-components'
import { getFactionColors } from '../constants/theme'
import {
    ModalBackdrop,
    ModalContainer,
    ModalHeader,
    ModalContent,
    ModalTitle,
    Text,
    Caption,
    IconButton,
    Alert,
    Card,
} from '../styles'
import type { Faction } from '../types'

// ============================================================================
// CUSTOM STYLED COMPONENTS
// ============================================================================

const SectionWrapper = styled.div`
    margin-bottom: 32px;
`

const SectionHeader = styled.div<{ $color: string }>`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid ${({ $color }) => `${$color}40`};
`

const SectionTitle = styled.h3<{ $color: string }>`
    font-size: 20px;
    font-weight: bold;
    color: ${({ $color }) => $color};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
`

const ContentText = styled.p`
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.8;
    margin-bottom: 12px;
`

const ContentList = styled.ul`
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.8;
    padding-left: 20px;
    margin-bottom: 12px;
`

const SubsectionTitle = styled.h4<{ $color: string }>`
    color: ${({ $color }) => $color};
    font-size: 16px;
    margin-top: 16px;
    margin-bottom: 8px;
`

interface ExplainerModalProps {
    isOpen: boolean
    onClose: () => void
    faction?: Faction | string
}

/**
 * Modal component that explains the game mechanics
 */
export default function ExplainerModal({
    isOpen,
    onClose,
    faction = 'terminid',
}: ExplainerModalProps) {
    const factionColors = getFactionColors(faction)

    // Handle escape key to close modal
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <ModalBackdrop
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="explainer-modal-title"
        >
            <ModalContainer
                $size="lg"
                $factionPrimary={factionColors.PRIMARY}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <ModalHeader $factionPrimary={factionColors.PRIMARY} $sticky>
                    <ModalTitle $factionColor={factionColors.PRIMARY} id="explainer-modal-title">
                        Mission Briefing
                    </ModalTitle>
                    <IconButton onClick={onClose} title="Close">
                        <X size={20} />
                    </IconButton>
                </ModalHeader>

                {/* Content */}
                <ModalContent $padding="xxl">
                    {/* How to Win */}
                    <Section
                        icon={<Target size={24} />}
                        title="How to Win"
                        color={factionColors.PRIMARY}
                    >
                        <ContentText>
                            Your mission is to <strong>complete all 10 difficulty tiers</strong> (D1
                            through D10). Start at Difficulty 1 with basic equipment and work your
                            way up to Super Helldive difficulty.
                        </ContentText>
                        <ContentList>
                            <li>Complete a mission at your current difficulty</li>
                            <li>Successfully extract (at least one player must extract)</li>
                            <li>Advance to the next difficulty tier</li>
                            <li>Reach and complete Difficulty 10 to achieve victory</li>
                        </ContentList>
                        <Alert $variant="error" style={{ marginTop: '12px' }}>
                            <Text $color="error" $size="sm" style={{ margin: 0 }}>
                                <strong>⚠️ Failure Condition:</strong> If you report a mission as
                                failed, your run ends immediately with a Game Over.
                            </Text>
                        </Alert>
                    </Section>

                    {/* How Drafting Works */}
                    <Section
                        icon={<Zap size={24} />}
                        title="How Drafting Works"
                        color={factionColors.PRIMARY}
                    >
                        <ContentText>
                            After each successful mission, players take turns drafting new equipment
                            from a random selection of cards. The draft is your opportunity to build
                            and improve your loadout.
                        </ContentText>

                        <SubsectionTitle $color={factionColors.PRIMARY}>
                            Draft Hand Size
                        </SubsectionTitle>
                        <ContentText>
                            The number of cards offered depends on your mission performance rating
                            (star rating):
                        </ContentText>
                        <ContentList>
                            <li>
                                <strong>1-2 Stars:</strong> 2 cards to choose from
                            </li>
                            <li>
                                <strong>3-4 Stars:</strong> 3 cards to choose from
                            </li>
                            <li>
                                <strong>5 Stars:</strong> 4 cards to choose from
                            </li>
                        </ContentList>

                        <SubsectionTitle $color={factionColors.PRIMARY}>
                            Draft Actions
                        </SubsectionTitle>
                        <ContentList>
                            <li>
                                <strong>Pick a Card:</strong> Click on a card to add it to your
                                inventory and auto-equip it
                            </li>
                            <li>
                                <strong>Remove a Card:</strong> Click the × on a card to replace
                                just that card (free). This should only be done to correct a mistake
                                when you don't have access to the drafted item for some reason.
                            </li>
                            <li>
                                <strong>Reroll All:</strong> Spend 1 Requisition to get a completely
                                new hand
                            </li>
                            <li>
                                <strong>Skip Draft:</strong> Pass on drafting if nothing appeals to
                                you
                            </li>
                            <li>
                                <strong>Slot Locking:</strong> Spend Requisition to prevent certain
                                item types from appearing
                            </li>
                        </ContentList>

                        <SubsectionTitle $color={factionColors.PRIMARY}>
                            Smart Drafting System
                        </SubsectionTitle>
                        <ContentText>
                            Cards are weighted based on your current loadout needs. If you lack
                            anti-tank weapons, you're more likely to see them offered. The draft
                            adapts to help you build a balanced loadout.
                        </ContentText>
                    </Section>

                    {/* Starting Loadout */}
                    <Section
                        icon={<Shield size={24} />}
                        title="Starting Loadout"
                        color={factionColors.PRIMARY}
                    >
                        <ContentText>
                            Every Helldiver begins with minimal equipment at Difficulty 1:
                        </ContentText>
                        <ContentList>
                            <li>
                                <strong>Secondary:</strong> P-2 Peacemaker (basic pistol)
                            </li>
                            <li>
                                <strong>Throwable:</strong> G-16 Impact Grenade
                            </li>
                            <li>
                                <strong>Armor:</strong> B-01 Tactical (light armor)
                            </li>
                            <li>
                                <strong>Stratagems:</strong> 4 empty slots to fill through drafting
                            </li>
                        </ContentList>
                        <ContentText>
                            You'll also earn <strong>1 Requisition</strong> per successful mission,
                            which you can spend on rerolling draft hands or locking slots to
                            customize your draft pool.
                        </ContentText>
                        <Alert $variant="success" style={{ marginTop: '12px' }}>
                            <Text $color="success" $size="sm" style={{ margin: 0 }}>
                                <strong>💡 Tip:</strong> The P-2 Peacemaker and B-01 Tactical cannot
                                be sacrificed—they're your guaranteed minimum equipment.
                            </Text>
                        </Alert>
                    </Section>

                    {/* Samples & Events */}
                    <Section
                        icon={<Star size={24} />}
                        title="How Samples & Events Work Together"
                        color={factionColors.PRIMARY}
                    >
                        <ContentText>
                            Samples collected during missions increase your chance of triggering
                            special events. Events offer high-risk, high-reward choices that can
                            significantly impact your run.
                        </ContentText>

                        <SubsectionTitle $color={factionColors.PRIMARY}>
                            Sample Types & Event Chances
                        </SubsectionTitle>
                        <ContentList>
                            <li>
                                <strong style={{ color: '#22c55e' }}>Common Samples:</strong> +1%
                                event chance each
                            </li>
                            <li>
                                <strong style={{ color: '#f97316' }}>Rare Samples:</strong> +2%
                                event chance each
                            </li>
                            <li>
                                <strong style={{ color: '#a855f7' }}>Super Rare Samples:</strong>{' '}
                                +3% event chance each
                            </li>
                        </ContentList>
                        <ContentText>
                            The base event chance starts at 0%. When an event triggers, your
                            accumulated samples are consumed and the chance resets to 0%.
                        </ContentText>

                        <SubsectionTitle $color={factionColors.PRIMARY}>
                            Event Types
                        </SubsectionTitle>
                        <ContentText>Events can offer various outcomes:</ContentText>
                        <ContentList>
                            <li>
                                <strong>Positive:</strong> Gain extra draft picks, requisition, or
                                boosters
                            </li>
                            <li>
                                <strong>Negative:</strong> Lose equipment, face weapon restrictions,
                                or other penalties
                            </li>
                            <li>
                                <strong>Choice-Based:</strong> Pick between multiple options, each
                                with different costs and rewards
                            </li>
                        </ContentList>
                        <Alert $variant="info" style={{ marginTop: '12px' }}>
                            <Text $color="info" $size="sm" style={{ margin: 0 }}>
                                <strong>💎 Strategy:</strong> Collect samples strategically to
                                increase event frequency. Events can dramatically change your run's
                                trajectory—use them wisely!
                            </Text>
                        </Alert>
                    </Section>

                    {/* Additional Mechanics */}
                    <Section
                        icon={<Shield size={24} />}
                        title="Additional Mechanics"
                        color={factionColors.PRIMARY}
                    >
                        <SubsectionTitle $color={factionColors.PRIMARY}>
                            Extraction & Sacrifice
                        </SubsectionTitle>
                        <ContentText>
                            After each mission, mark which players successfully extracted.
                            Non-extracted players may need to sacrifice equipment:
                        </ContentText>
                        <ContentList>
                            <li>
                                <strong>Standard Mode:</strong> If <em>all</em> players fail to
                                extract, everyone must sacrifice one item
                            </li>
                            <li>
                                <strong>Brutality Mode:</strong> <em>Any</em> non-extracted player
                                must sacrifice an item
                            </li>
                        </ContentList>

                        <SubsectionTitle $color={factionColors.PRIMARY}>
                            Warbond Selection
                        </SubsectionTitle>
                        <ContentText>
                            Before starting, select which warbonds you own. The draft pool only
                            includes equipment from your selected warbonds, ensuring you only see
                            items you can actually use in Helldivers 2.
                        </ContentText>

                        <SubsectionTitle $color={factionColors.PRIMARY}>Game Modes</SubsectionTitle>
                        <ContentList>
                            <li>
                                <strong>Global Uniqueness:</strong> Players can't draft the same
                                cards
                            </li>
                            <li>
                                <strong>Burn Cards:</strong> Once seen, a card never appears again
                            </li>
                            <li>
                                <strong>Endless Mode:</strong> Keep playing past Difficulty 10
                            </li>
                            <li>
                                <strong>Custom Start:</strong> Configure starting difficulty and
                                loadouts
                            </li>
                        </ContentList>
                    </Section>

                    {/* Footer */}
                    <Card
                        $variant="base"
                        $padding="lg"
                        style={{ marginTop: '32px', textAlign: 'center' }}
                    >
                        <Text $color="muted" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                            FOR DEMOCRACY! FOR MANAGED MAYHEM!
                        </Text>
                        <Caption>Good luck, Helldiver. Super Earth is counting on you.</Caption>
                    </Card>
                </ModalContent>
            </ModalContainer>
        </ModalBackdrop>
    )
}

interface SectionProps {
    icon: React.ReactNode
    title: string
    color: string
    children: React.ReactNode
}

/**
 * Reusable section component for the explainer
 */
function Section({ icon, title, color, children }: SectionProps) {
    return (
        <SectionWrapper>
            <SectionHeader $color={color}>
                <div style={{ color }}>{icon}</div>
                <SectionTitle $color={color}>{title}</SectionTitle>
            </SectionHeader>
            <div>{children}</div>
        </SectionWrapper>
    )
}
