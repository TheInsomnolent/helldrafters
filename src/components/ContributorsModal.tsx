import { onValue, ref } from 'firebase/database'
import { Crown, Heart, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { getFactionColors } from '../constants/theme'
import { getFirebaseDatabase, isFirebaseConfigured } from '../systems/multiplayer/firebaseConfig'
import type { Faction } from '../types'

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
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: `2px solid ${factionColors.PRIMARY}`,
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: `0 0 30px ${factionColors.PRIMARY}40`,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px',
                        borderBottom: `1px solid ${factionColors.PRIMARY}40`,
                        background: `linear-gradient(135deg, ${factionColors.PRIMARY}20 0%, transparent 100%)`,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Heart size={24} style={{ color: factionColors.PRIMARY }} />
                        <h2
                            style={{
                                margin: 0,
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#f1f5f9',
                            }}
                        >
                            Community Supporters
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <X size={20} color="#f1f5f9" />
                    </button>
                </div>

                {/* Content */}
                <div
                    style={{
                        padding: '20px',
                        overflowY: 'auto',
                        flex: 1,
                    }}
                >
                    {loading && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#94a3b8',
                                fontSize: '16px',
                            }}
                        >
                            Loading supporters...
                        </div>
                    )}

                    {error && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#f87171',
                                fontSize: '16px',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {!loading && !error && contributors.length === 0 && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#94a3b8',
                                fontSize: '16px',
                            }}
                        >
                            No supporters yet. Be the first to support on Ko-Fi!
                        </div>
                    )}

                    {!loading && !error && contributors.length > 0 && (
                        <>
                            <p
                                style={{
                                    color: '#cbd5e1',
                                    fontSize: '14px',
                                    marginBottom: '30px',
                                    textAlign: 'center',
                                }}
                            >
                                Thank you to all our wonderful supporters who help keep this project
                                running!
                            </p>

                            {/* Group contributors by tier */}
                            {['Skull Admiral', 'Space Cadet'].map((tierName) => {
                                const tierContributors = contributors.filter(
                                    (c) => c.tier === tierName,
                                )
                                if (tierContributors.length === 0) return null

                                const badge = getTierBadge(tierName)

                                return (
                                    <div key={tierName} style={{ marginBottom: '40px' }}>
                                        {/* Tier Header */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                marginBottom: '20px',
                                                paddingBottom: '12px',
                                                borderBottom: `2px solid ${badge.borderColor}40`,
                                            }}
                                        >
                                            {/* Tier Image */}
                                            {badge.image && !imageErrors[tierName] ? (
                                                <div
                                                    style={{
                                                        width: '96px',
                                                        height: '96px',
                                                        borderRadius: '12px',
                                                        border: `3px solid ${badge.borderColor}`,
                                                        background: 'rgba(0, 0, 0, 0.4)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        overflow: 'hidden',
                                                    }}
                                                >
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
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        width: '96px',
                                                        height: '96px',
                                                        borderRadius: '12px',
                                                        border: `3px solid ${badge.borderColor}`,
                                                        background: 'rgba(0, 0, 0, 0.4)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {React.cloneElement(
                                                        badge.icon as React.ReactElement<{
                                                            size?: number
                                                        }>,
                                                        { size: 48 },
                                                    )}
                                                </div>
                                            )}

                                            {/* Tier Name */}
                                            <div>
                                                <h3
                                                    style={{
                                                        margin: 0,
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        color: badge.color,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                    }}
                                                >
                                                    {tierName}
                                                </h3>
                                                <div
                                                    style={{
                                                        fontSize: '13px',
                                                        color: '#94a3b8',
                                                        marginTop: '4px',
                                                    }}
                                                >
                                                    {tierContributors.length}{' '}
                                                    {tierContributors.length === 1
                                                        ? 'supporter'
                                                        : 'supporters'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Supporters List */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px',
                                            }}
                                        >
                                            {tierContributors.map((contributor) => (
                                                <div
                                                    key={contributor.id}
                                                    style={{
                                                        background: 'rgba(15, 23, 42, 0.6)',
                                                        border: `2px solid ${badge.borderColor}20`,
                                                        borderRadius: '8px',
                                                        padding: '12px 16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background =
                                                            'rgba(15, 23, 42, 0.8)'
                                                        e.currentTarget.style.borderColor = `${badge.borderColor}60`
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background =
                                                            'rgba(15, 23, 42, 0.6)'
                                                        e.currentTarget.style.borderColor = `${badge.borderColor}20`
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            color: '#f1f5f9',
                                                            fontSize: '16px',
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        {contributor.displayName}
                                                    </div>

                                                    <div
                                                        style={{
                                                            color: badge.color,
                                                            fontSize: '14px',
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        {contributor.monthsSubscribed}{' '}
                                                        {contributor.monthsSubscribed === 1
                                                            ? 'month'
                                                            : 'months'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderTop: `1px solid ${factionColors.PRIMARY}40`,
                        background: 'rgba(15, 23, 42, 0.4)',
                        textAlign: 'center',
                    }}
                >
                    <a
                        href="https://ko-fi.com/theinsomnolent"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: '#ff5e5b',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ff4542'
                            e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ff5e5b'
                            e.currentTarget.style.transform = 'scale(1)'
                        }}
                    >
                        <Heart size={18} />
                        Support on Ko-Fi
                    </a>
                </div>
            </div>
        </div>
    )
}
