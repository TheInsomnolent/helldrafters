import React from 'react'
import { X, Sparkles } from 'lucide-react'
import { getFactionColors } from '../constants/theme'

/**
 * Modal component that displays Gen AI disclosure
 */
export default function GenAIDisclosureModal({ isOpen, onClose, faction = 'Terminids' }) {
    const factionColors = getFactionColors(faction)

    // Handle escape key to close modal
    React.useEffect(() => {
        const handleEscape = (e) => {
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
            aria-labelledby="genai-disclosure-modal-title"
        >
            <div
                style={{
                    backgroundColor: '#1a2332',
                    borderRadius: '12px',
                    border: `2px solid ${factionColors.PRIMARY}`,
                    maxWidth: '700px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles size={28} style={{ color: factionColors.PRIMARY }} />
                        <h2
                            style={{
                                fontSize: '28px',
                                fontWeight: '900',
                                color: factionColors.PRIMARY,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                margin: 0,
                            }}
                            id="genai-disclosure-modal-title"
                        >
                            Gen AI Disclosure
                        </h2>
                    </div>
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
                    <div
                        style={{
                            backgroundColor: `${factionColors.PRIMARY}10`,
                            border: `2px solid ${factionColors.PRIMARY}40`,
                            borderRadius: '8px',
                            padding: '24px',
                            marginBottom: '24px',
                        }}
                    >
                        <h3
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '18px',
                                fontWeight: 'bold',
                                marginTop: 0,
                                marginBottom: '16px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Development Transparency
                        </h3>
                        <p
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                fontSize: '15px',
                                marginBottom: '16px',
                            }}
                        >
                            As a full-time developer and a fan of Helldivers 2, I built this tool to
                            enhance our community's experience. I want to be transparent that{' '}
                            <strong>
                                Generative AI was used to assist in the creation of this project.
                            </strong>
                        </p>

                        <p
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                fontSize: '15px',
                                marginBottom: '16px',
                            }}
                        >
                            I am acutely aware of the valid concerns regarding AI, including its
                            impact on creative professions, intellectual property, and the
                            environment. However, as a solo hobbyist working in my limited spare
                            time, these tools were the bridge that allowed me to bring this vision
                            to life without burning out.
                        </p>

                        <p
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                fontSize: '15px',
                                marginBottom: '16px',
                            }}
                        >
                            This project is, and will always be,{' '}
                            <strong>a free gift to the community.</strong> My goal isn't to replace
                            human creativity, but to use these new tools to provide a little more
                            joy for our squads. Thank you for understanding and for your support.
                        </p>

                        <p
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                fontSize: '15px',
                                marginBottom: '16px',
                            }}
                        >
                            While some Generative AI tools are used to maintain this project, they
                            are largely used for <strong>bugfixes and icon generation</strong>. This
                            is a one-man, currently self-funded show, and I am not an artist.
                        </p>

                        <p
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                fontSize: '15px',
                                marginBottom: '16px',
                            }}
                        >
                            However, I <em>am</em> a full stack developer, and the vast majority of
                            the{' '}
                            <strong>
                                feature prototyping, hosting, infrastructure work, design work,
                                testing, project management, and code-review of GenAI-developed
                                tasks
                            </strong>{' '}
                            is all done by me.
                        </p>

                        <p
                            style={{
                                color: '#cbd5e1',
                                lineHeight: '1.8',
                                fontSize: '15px',
                                marginBottom: '16px',
                            }}
                        >
                            It is a personal goal of mine to prevent this from being AI shovelware,
                            hence my commitment to transparency on this matter. If you would like to
                            explore the development process further and examine what kind of jobs
                            the GenAI has been used for, you are free to visit the{' '}
                            <a
                                href="https://github.com/TheInsomnolent/helldrafters/issues?q=is%3Aissue"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: factionColors.PRIMARY,
                                    textDecoration: 'underline',
                                    fontWeight: 'bold',
                                }}
                            >
                                issue management board
                            </a>{' '}
                            where I have started to tag all human vs. AI tasks as an effort to
                            increase transparency.
                        </p>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: '20px',
                            backgroundColor: 'rgba(100, 116, 139, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(100, 116, 139, 0.3)',
                            textAlign: 'center',
                        }}
                    >
                        <p
                            style={{
                                color: factionColors.PRIMARY,
                                lineHeight: '1.8',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                marginTop: '24px',
                                marginBottom: '24px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                            }}
                        >
                            Let's spread some managed democracy.
                        </p>
                        <img
                            src={`${process.env.PUBLIC_URL}/griff.jpg`}
                            alt="Griff"
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: `3px solid ${factionColors.PRIMARY}`,
                                marginBottom: '12px',
                            }}
                        />
                        <p
                            style={{
                                color: '#94a3b8',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                margin: '0 0 4px 0',
                            }}
                        >
                            Griff
                        </p>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                            Developer & Helldiver
                        </p>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>o7</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
