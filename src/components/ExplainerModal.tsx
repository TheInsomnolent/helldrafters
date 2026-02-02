import React from 'react'
import { X, Target, Zap, Shield, Star } from 'lucide-react'
import { getFactionColors } from '../constants/theme'
import type { Faction } from '../types'

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
        <div
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
                zIndex: 9999,
                padding: '24px',
                overflowY: 'auto',
            }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="explainer-modal-title"
        >
            <div
                style={{
                    backgroundColor: '#1a2332',
                    borderRadius: '12px',
                    border: `2px solid ${factionColors.PRIMARY}`,
                    maxWidth: '900px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: `0 0 40px ${factionColors.PRIMARY}40`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '24px',
                        borderBottom: `2px solid ${factionColors.PRIMARY}4D`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: '#1a2332',
                        zIndex: 1,
                    }}
                >
                    <h2
                        style={{
                            fontSize: '28px',
                            fontWeight: '900',
                            color: factionColors.PRIMARY,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            margin: 0,
                        }}
                        id="explainer-modal-title"
                    >
                        Mission Briefing
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(100, 116, 139, 0.3)',
                            color: '#94a3b8',
                            border: '1px solid rgba(100, 116, 139, 0.5)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)'
                            e.currentTarget.style.color = '#ef4444'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)'
                            e.currentTarget.style.color = '#94a3b8'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '32px' }}>
                    {/* How to Win */}
                    <Section
                        icon={<Target size={24} />}
                        title="How to Win"
                        color={factionColors.PRIMARY}
                    >
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '12px' }}>
                            Your mission is to <strong>complete all 10 difficulty tiers</strong> (D1
                            through D10). Start at Difficulty 1 with basic equipment and work your
                            way up to Super Helldive difficulty.
                        </p>
                        <ul
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                paddingLeft: '20px',
                                marginBottom: '12px',
                            }}
                        >
                            <li>Complete a mission at your current difficulty</li>
                            <li>Successfully extract (at least one player must extract)</li>
                            <li>Advance to the next difficulty tier</li>
                            <li>Reach and complete Difficulty 10 to achieve victory</li>
                        </ul>
                        <div
                            style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '4px',
                                padding: '12px',
                                marginTop: '12px',
                            }}
                        >
                            <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>
                                <strong>⚠️ Failure Condition:</strong> If you report a mission as
                                failed, your run ends immediately with a Game Over.
                            </p>
                        </div>
                    </Section>

                    {/* How Drafting Works */}
                    <Section
                        icon={<Zap size={24} />}
                        title="How Drafting Works"
                        color={factionColors.PRIMARY}
                    >
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '12px' }}>
                            After each successful mission, players take turns drafting new equipment
                            from a random selection of cards. The draft is your opportunity to build
                            and improve your loadout.
                        </p>

                        <h4
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '16px',
                                marginTop: '16px',
                                marginBottom: '8px',
                            }}
                        >
                            Draft Hand Size
                        </h4>
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '8px' }}>
                            The number of cards offered depends on your mission performance rating
                            (star rating):
                        </p>
                        <ul
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                paddingLeft: '20px',
                                marginBottom: '12px',
                            }}
                        >
                            <li>
                                <strong>1-2 Stars:</strong> 2 cards to choose from
                            </li>
                            <li>
                                <strong>3-4 Stars:</strong> 3 cards to choose from
                            </li>
                            <li>
                                <strong>5 Stars:</strong> 4 cards to choose from
                            </li>
                        </ul>

                        <h4
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '16px',
                                marginTop: '16px',
                                marginBottom: '8px',
                            }}
                        >
                            Draft Actions
                        </h4>
                        <ul
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                paddingLeft: '20px',
                                marginBottom: '12px',
                            }}
                        >
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
                        </ul>

                        <h4
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '16px',
                                marginTop: '16px',
                                marginBottom: '8px',
                            }}
                        >
                            Smart Drafting System
                        </h4>
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '12px' }}>
                            Cards are weighted based on your current loadout needs. If you lack
                            anti-tank weapons, you're more likely to see them offered. The draft
                            adapts to help you build a balanced loadout.
                        </p>
                    </Section>

                    {/* Starting Loadout */}
                    <Section
                        icon={<Shield size={24} />}
                        title="Starting Loadout"
                        color={factionColors.PRIMARY}
                    >
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '12px' }}>
                            Every Helldiver begins with minimal equipment at Difficulty 1:
                        </p>
                        <ul
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                paddingLeft: '20px',
                                marginBottom: '12px',
                            }}
                        >
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
                        </ul>
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '12px' }}>
                            You'll also earn <strong>1 Requisition</strong> per successful mission,
                            which you can spend on rerolling draft hands or locking slots to
                            customize your draft pool.
                        </p>

                        <div
                            style={{
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '4px',
                                padding: '12px',
                                marginTop: '12px',
                            }}
                        >
                            <p style={{ color: '#22c55e', fontSize: '14px', margin: 0 }}>
                                <strong>💡 Tip:</strong> The P-2 Peacemaker and B-01 Tactical cannot
                                be sacrificed—they're your guaranteed minimum equipment.
                            </p>
                        </div>
                    </Section>

                    {/* Samples & Events */}
                    <Section
                        icon={<Star size={24} />}
                        title="How Samples & Events Work Together"
                        color={factionColors.PRIMARY}
                    >
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '12px' }}>
                            Samples collected during missions increase your chance of triggering
                            special events. Events offer high-risk, high-reward choices that can
                            significantly impact your run.
                        </p>

                        <h4
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '16px',
                                marginTop: '16px',
                                marginBottom: '8px',
                            }}
                        >
                            Sample Types & Event Chances
                        </h4>
                        <ul
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                paddingLeft: '20px',
                                marginBottom: '12px',
                            }}
                        >
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
                        </ul>
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '12px' }}>
                            The base event chance starts at 0%. When an event triggers, your
                            accumulated samples are consumed and the chance resets to 0%.
                        </p>

                        <h4
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '16px',
                                marginTop: '16px',
                                marginBottom: '8px',
                            }}
                        >
                            Event Types
                        </h4>
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '8px' }}>
                            Events can offer various outcomes:
                        </p>
                        <ul
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                paddingLeft: '20px',
                                marginBottom: '12px',
                            }}
                        >
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
                        </ul>

                        <div
                            style={{
                                backgroundColor: `${factionColors.PRIMARY}10`,
                                border: `1px solid ${factionColors.PRIMARY}40`,
                                borderRadius: '4px',
                                padding: '12px',
                                marginTop: '12px',
                            }}
                        >
                            <p
                                style={{
                                    color: factionColors.PRIMARY,
                                    fontSize: '14px',
                                    margin: 0,
                                }}
                            >
                                <strong>💎 Strategy:</strong> Collect samples strategically to
                                increase event frequency. Events can dramatically change your run's
                                trajectory—use them wisely!
                            </p>
                        </div>
                    </Section>

                    {/* Additional Mechanics */}
                    <Section
                        icon={<Shield size={24} />}
                        title="Additional Mechanics"
                        color={factionColors.PRIMARY}
                    >
                        <h4
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '16px',
                                marginTop: '16px',
                                marginBottom: '8px',
                            }}
                        >
                            Extraction & Sacrifice
                        </h4>
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '12px' }}>
                            After each mission, mark which players successfully extracted.
                            Non-extracted players may need to sacrifice equipment:
                        </p>
                        <ul
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                paddingLeft: '20px',
                                marginBottom: '12px',
                            }}
                        >
                            <li>
                                <strong>Standard Mode:</strong> If <em>all</em> players fail to
                                extract, everyone must sacrifice one item
                            </li>
                            <li>
                                <strong>Brutality Mode:</strong> <em>Any</em> non-extracted player
                                must sacrifice an item
                            </li>
                        </ul>

                        <h4
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '16px',
                                marginTop: '16px',
                                marginBottom: '8px',
                            }}
                        >
                            Warbond Selection
                        </h4>
                        <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '12px' }}>
                            Before starting, select which warbonds you own. The draft pool only
                            includes equipment from your selected warbonds, ensuring you only see
                            items you can actually use in Helldivers 2.
                        </p>

                        <h4
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '16px',
                                marginTop: '16px',
                                marginBottom: '8px',
                            }}
                        >
                            Game Modes
                        </h4>
                        <ul
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                paddingLeft: '20px',
                                marginBottom: '12px',
                            }}
                        >
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
                        </ul>
                    </Section>

                    {/* Footer */}
                    <div
                        style={{
                            marginTop: '32px',
                            padding: '20px',
                            backgroundColor: 'rgba(100, 116, 139, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(100, 116, 139, 0.3)',
                            textAlign: 'center',
                        }}
                    >
                        <p
                            style={{
                                color: '#94a3b8',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                margin: '0 0 8px 0',
                            }}
                        >
                            FOR DEMOCRACY! FOR MANAGED MAYHEM!
                        </p>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                            Good luck, Helldiver. Super Earth is counting on you.
                        </p>
                    </div>
                </div>
            </div>
        </div>
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
        <div style={{ marginBottom: '32px' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: `2px solid ${color}40`,
                }}
            >
                <div style={{ color }}>{icon}</div>
                <h3
                    style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: 0,
                    }}
                >
                    {title}
                </h3>
            </div>
            <div>{children}</div>
        </div>
    )
}
