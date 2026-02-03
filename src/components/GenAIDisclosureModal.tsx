import React from 'react'
import { X, Sparkles } from 'lucide-react'
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
    Flex,
    IconButton,
    Card,
} from '../styles'
import type { Faction } from '../types'

// ============================================================================
// CUSTOM STYLED COMPONENTS
// ============================================================================

const ContentCard = styled.div<{ $factionPrimary: string }>`
    background-color: ${({ $factionPrimary }) => `${$factionPrimary}10`};
    border: 2px solid ${({ $factionPrimary }) => `${$factionPrimary}40`};
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: 24px;
    margin-bottom: 24px;
`

const ContentTitle = styled.h3<{ $color: string }>`
    color: ${({ $color }) => $color};
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`

const ContentText = styled.p`
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.8;
    font-size: 15px;
    margin-bottom: 16px;

    &:last-child {
        margin-bottom: 0;
    }
`

const AvatarImage = styled.img<{ $borderColor: string }>`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid ${({ $borderColor }) => $borderColor};
    margin-bottom: 12px;
`

const FactionLink = styled.a<{ $color: string }>`
    color: ${({ $color }) => $color};
    text-decoration: underline;
    font-weight: bold;
`

interface GenAIDisclosureModalProps {
    isOpen: boolean
    onClose: () => void
    faction?: Faction | string
}

/**
 * Modal component that displays Gen AI disclosure
 */
export default function GenAIDisclosureModal({
    isOpen,
    onClose,
    faction = 'terminid',
}: GenAIDisclosureModalProps) {
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
            aria-labelledby="genai-disclosure-modal-title"
        >
            <ModalContainer
                $size="md"
                $factionPrimary={factionColors.PRIMARY}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <ModalHeader $factionPrimary={factionColors.PRIMARY} $sticky>
                    <Flex $align="center" $gap="md">
                        <Sparkles size={28} style={{ color: factionColors.PRIMARY }} />
                        <ModalTitle
                            $factionColor={factionColors.PRIMARY}
                            id="genai-disclosure-modal-title"
                        >
                            Gen AI Disclosure
                        </ModalTitle>
                    </Flex>
                    <IconButton onClick={onClose} title="Close">
                        <X size={20} />
                    </IconButton>
                </ModalHeader>

                {/* Content */}
                <ModalContent $padding="xxl">
                    <ContentCard $factionPrimary={factionColors.PRIMARY}>
                        <ContentTitle $color={factionColors.PRIMARY}>
                            Development Transparency
                        </ContentTitle>
                        <ContentText>
                            As a full-time developer and a fan of Helldivers 2, I built this tool to
                            enhance our community's experience. I want to be transparent that{' '}
                            <strong>
                                Generative AI was used to assist in the creation of this project.
                            </strong>
                        </ContentText>

                        <ContentText>
                            I am acutely aware of the valid concerns regarding AI, including its
                            impact on creative professions, intellectual property, and the
                            environment. However, as a solo hobbyist working in my limited spare
                            time, these tools were the bridge that allowed me to bring this vision
                            to life without burning out.
                        </ContentText>

                        <ContentText>
                            This project is, and will always be,{' '}
                            <strong>a free gift to the community.</strong> My goal isn't to replace
                            human creativity, but to use these new tools to provide a little more
                            joy for our squads. Thank you for understanding and for your support.
                        </ContentText>

                        <ContentText>
                            While some Generative AI tools are used to maintain this project, they
                            are largely used for <strong>bugfixes and icon generation</strong>. This
                            is a one-man, currently self-funded show, and I am not an artist.
                        </ContentText>

                        <ContentText>
                            However, I <em>am</em> a full stack developer, and the vast majority of
                            the{' '}
                            <strong>
                                feature prototyping, hosting, infrastructure work, design work,
                                testing, project management, and code-review of GenAI-developed
                                tasks
                            </strong>{' '}
                            is all done by me.
                        </ContentText>

                        <ContentText>
                            It is a personal goal of mine to prevent this from being AI shovelware,
                            hence my commitment to transparency on this matter. If you would like to
                            explore the development process further and examine what kind of jobs
                            the GenAI has been used for, you are free to visit the{' '}
                            <FactionLink
                                href="https://github.com/TheInsomnolent/helldrafters/issues?q=is%3Aissue"
                                target="_blank"
                                rel="noopener noreferrer"
                                $color={factionColors.PRIMARY}
                            >
                                issue management board
                            </FactionLink>{' '}
                            where I have started to tag all human vs. AI tasks as an effort to
                            increase transparency.
                        </ContentText>
                    </ContentCard>

                    {/* Footer */}
                    <Card $variant="base" $padding="lg" style={{ textAlign: 'center' }}>
                        <Text
                            $color="faction"
                            $factionColor={factionColors.PRIMARY}
                            style={{
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                marginBottom: '24px',
                                marginTop: '24px',
                            }}
                        >
                            Let's spread some managed democracy.
                        </Text>
                        <AvatarImage
                            src={`${process.env.PUBLIC_URL}/griff.jpg`}
                            alt="Griff"
                            $borderColor={factionColors.PRIMARY}
                        />
                        <Text $color="muted" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            Griff
                        </Text>
                        <Caption>Developer & Helldiver</Caption>
                        <Caption>o7</Caption>
                    </Card>
                </ModalContent>
            </ModalContainer>
        </ModalBackdrop>
    )
}
