import { onValue, ref } from 'firebase/database'
import { Crown, Heart, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { getFactionColors } from '../constants/theme'
import { getFirebaseDatabase, isFirebaseConfigured } from '../systems/multiplayer/firebaseConfig'
import {
    ModalBackdrop,
    ModalContainer,
    ModalHeader,
    ModalContent,
    ModalFooter,
    Heading,
    Text,
    Caption,
    Flex,
    IconButton,
} from '../styles'
import type { Faction } from '../types'

// ============================================================================
// CUSTOM STYLED COMPONENTS
// ============================================================================

const TierSection = styled.div`
    margin-bottom: 40px;
`

const TierHeader = styled.div<{ $borderColor: string }>`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid ${({ $borderColor }) => `${$borderColor}40`};
`

const TierBadgeBox = styled.div<{ $borderColor: string }>`
    width: 96px;
    height: 96px;
    border-radius: ${({ theme }) => theme.radii.xl};
    border: 3px solid ${({ $borderColor }) => $borderColor};
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
`

const TierName = styled.h3<{ $color: string }>`
    margin: 0;
    font-size: 24px;
    font-weight: bold;
    color: ${({ $color }) => $color};
    text-transform: uppercase;
    letter-spacing: 0.5px;
`

const ContributorCard = styled.div<{ $borderColor: string }>`
    background: rgba(15, 23, 42, 0.6);
    border: 2px solid ${({ $borderColor }) => `${$borderColor}20`};
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s;

    &:hover {
        background: rgba(15, 23, 42, 0.8);
        border-color: ${({ $borderColor }) => `${$borderColor}60`};
    }
`

const KofiButton = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #ff5e5b;
    color: white;
    text-decoration: none;
    border-radius: ${({ theme }) => theme.radii.md};
    font-weight: bold;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
        background: #ff4542;
        transform: scale(1.05);
    }
`

interface Contributor {
    id: string
    displayName: string
    tier: 'Skull Admiral' | 'Space Cadet' | string
    monthsSubscribed: number
    isPublic?: boolean
}

interface TierBadge {
    name: string
    image: string | null
    icon: React.ReactElement
    color: string
    borderColor: string
}

interface ContributorsModalProps {
    isOpen: boolean
    onClose: () => void
    faction?: Faction | string
}

/**
 * Modal component that displays Ko-Fi supporters/contributors
 *
 * Displays subscribers with their tier badges and subscription duration
 */
export default function ContributorsModal({
    isOpen,
    onClose,
    faction = 'terminid',
}: ContributorsModalProps) {
    const factionColors = getFactionColors(faction)
    const [contributors, setContributors] = useState<Contributor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

    // Fetch contributors from Firebase
    useEffect(() => {
        if (!isOpen) return

        setLoading(true)
        setError(null)

        // Check if Firebase is configured
        if (!isFirebaseConfigured()) {
            setError('Firebase is not configured. Multiplayer features are disabled.')
            setLoading(false)
            return
        }

        try {
            const db = getFirebaseDatabase()
            const contributorsRef = ref(db, 'contributors')

            onValue(
                contributorsRef,
                (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val() as Record<string, Omit<Contributor, 'id'>>

                        // Convert to array and filter for public contributors only
                        const contributorList: Contributor[] = Object.entries(data)
                            .map(([id, contributor]) => ({
                                id,
                                ...contributor,
                            }))
                            .filter((c) => c.isPublic !== false) // Only show public contributors
                            .sort((a, b) => {
                                // Sort by tier (Skull Admiral first), then by months subscribed
                                const tierOrder: Record<string, number> = {
                                    'Skull Admiral': 0,
                                    'Space Cadet': 1,
                                    Unknown: 2,
                                }
                                const tierDiff = (tierOrder[a.tier] || 2) - (tierOrder[b.tier] || 2)
                                if (tierDiff !== 0) return tierDiff

                                return (b.monthsSubscribed || 0) - (a.monthsSubscribed || 0)
                            })

                        setContributors(contributorList)
                    } else {
                        setContributors([])
                    }
                    setLoading(false)
                },
                (err) => {
                    console.error('Error loading contributors:', err)
                    setError('Unable to load contributors at this time.')
                    setLoading(false)
                },
            )
        } catch (err) {
            console.error('Error setting up contributors listener:', err)
            setError('Firebase is not initialized. Please refresh the page.')
            setLoading(false)
        }
    }, [isOpen])

    // Handle escape key to close modal
    useEffect(() => {
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

    // Get tier badge icon and image
    const getTierBadge = (tier: string): TierBadge => {
        if (tier === 'Skull Admiral') {
            return {
                name: 'Skull Admiral',
                image: 'Skull Admiral.jpg',
                icon: <Crown size={16} style={{ color: '#fbbf24' }} />,
                color: '#fbbf24',
                borderColor: '#f59e0b',
            }
        } else if (tier === 'Space Cadet') {
            return {
                name: 'Space Cadet',
                image: 'Space Cadet.jpg',
                icon: <Heart size={16} style={{ color: '#3b82f6' }} />,
                color: '#3b82f6',
                borderColor: '#2563eb',
            }
        }
        return {
            name: 'Supporter',
            image: null,
            icon: <Heart size={16} style={{ color: '#94a3b8' }} />,
            color: '#94a3b8',
            borderColor: '#64748b',
        }
    }

    return (
        <ModalBackdrop onClick={onClose}>
            <ModalContainer
                $size="lg"
                $factionPrimary={factionColors.PRIMARY}
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <ModalHeader $factionPrimary={factionColors.PRIMARY}>
                    <Flex $align="center" $gap="md">
                        <Heart size={24} style={{ color: factionColors.PRIMARY }} />
                        <Heading style={{ margin: 0, fontSize: '24px' }}>
                            Community Supporters
                        </Heading>
                    </Flex>
                    <IconButton onClick={onClose} title="Close">
                        <X size={20} />
                    </IconButton>
                </ModalHeader>

                {/* Content */}
                <ModalContent $padding="xl" style={{ flex: 1, overflowY: 'auto' }}>
                    {loading && (
                        <Text $color="muted" style={{ textAlign: 'center', padding: '40px' }}>
                            Loading supporters...
                        </Text>
                    )}

                    {error && (
                        <Text $color="error" style={{ textAlign: 'center', padding: '40px' }}>
                            {error}
                        </Text>
                    )}

                    {!loading && !error && contributors.length === 0 && (
                        <Text $color="muted" style={{ textAlign: 'center', padding: '40px' }}>
                            No supporters yet. Be the first to support on Ko-Fi!
                        </Text>
                    )}

                    {!loading && !error && contributors.length > 0 && (
                        <>
                            <Text
                                $color="secondary"
                                style={{ marginBottom: '30px', textAlign: 'center' }}
                            >
                                Thank you to all our wonderful supporters who help keep this project
                                running!
                            </Text>

                            {/* Group contributors by tier */}
                            {['Skull Admiral', 'Space Cadet'].map((tierName) => {
                                const tierContributors = contributors.filter(
                                    (c) => c.tier === tierName,
                                )
                                if (tierContributors.length === 0) return null

                                const badge = getTierBadge(tierName)

                                return (
                                    <TierSection key={tierName}>
                                        {/* Tier Header */}
                                        <TierHeader $borderColor={badge.borderColor}>
                                            {/* Tier Image */}
                                            <TierBadgeBox $borderColor={badge.borderColor}>
                                                {badge.image && !imageErrors[tierName] ? (
                                                    <img
                                                        src={`${process.env.PUBLIC_URL}/${badge.image}`}
                                                        alt={badge.name}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                        onError={() => {
                                                            setImageErrors((prev) => ({
                                                                ...prev,
                                                                [tierName]: true,
                                                            }))
                                                        }}
                                                    />
                                                ) : (
                                                    React.cloneElement(
                                                        badge.icon as React.ReactElement<{
                                                            size?: number
                                                        }>,
                                                        { size: 48 },
                                                    )
                                                )}
                                            </TierBadgeBox>

                                            {/* Tier Name */}
                                            <div>
                                                <TierName $color={badge.color}>{tierName}</TierName>
                                                <Caption style={{ marginTop: '4px' }}>
                                                    {tierContributors.length}{' '}
                                                    {tierContributors.length === 1
                                                        ? 'supporter'
                                                        : 'supporters'}
                                                </Caption>
                                            </div>
                                        </TierHeader>

                                        {/* Supporters List */}
                                        <Flex $direction="column" $gap="md">
                                            {tierContributors.map((contributor) => (
                                                <ContributorCard
                                                    key={contributor.id}
                                                    $borderColor={badge.borderColor}
                                                >
                                                    <Text
                                                        style={{
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        {contributor.displayName}
                                                    </Text>

                                                    <Text
                                                        style={{
                                                            color: badge.color,
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        {contributor.monthsSubscribed}{' '}
                                                        {contributor.monthsSubscribed === 1
                                                            ? 'month'
                                                            : 'months'}
                                                    </Text>
                                                </ContributorCard>
                                            ))}
                                        </Flex>
                                    </TierSection>
                                )
                            })}
                        </>
                    )}
                </ModalContent>

                {/* Footer */}
                <ModalFooter style={{ justifyContent: 'center' }}>
                    <KofiButton
                        href="https://ko-fi.com/theinsomnolent"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Heart size={18} />
                        Support on Ko-Fi
                    </KofiButton>
                </ModalFooter>
            </ModalContainer>
        </ModalBackdrop>
    )
}
