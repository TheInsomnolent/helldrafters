/**
 * Share Panel Component
 *
 * Provides social sharing functionality and screenshot capture
 */

import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import html2canvas from 'html2canvas'
import { COLORS } from '../../constants/theme'
import { Card, Text, Flex, Button, Alert } from '../../styles'
import type { AnalyticsStore } from '../../state/analyticsStore'

type Outcome = 'victory' | 'defeat'

interface ShareMessage {
    type: 'success' | 'error'
    text: string
}

interface SharePanelProps {
    targetRef: React.RefObject<HTMLDivElement | null>
    runData: AnalyticsStore | null
    outcome: Outcome
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ChartCard = styled(Card)`
    background-color: ${({ theme }) => theme.colors.cardInner};
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: ${({ theme }) => theme.spacing.lg};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const ChartTitle = styled.h3`
    color: ${({ theme }) => theme.colors.textPrimary};
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    gap: 8px;
`

const ShareButton = styled(Button)<{ $accentColor: string }>`
    padding: 12px 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 12px;
    background-color: ${({ $accentColor }) => `${$accentColor}15`};
    border: 1px solid ${({ $accentColor }) => $accentColor};
    color: ${({ $accentColor }) => $accentColor};

    &:hover:not(:disabled) {
        background-color: ${({ $accentColor }) => `${$accentColor}25`};
    }

    &:disabled {
        opacity: 0.6;
    }
`

const SharePanel = ({ targetRef, runData, outcome }: SharePanelProps): React.ReactElement => {
    const [isCapturing, setIsCapturing] = useState(false)
    const [shareMessage, setShareMessage] = useState<ShareMessage | null>(null)

    // Generate share text
    const getShareText = () => {
        const emoji = outcome === 'victory' ? '🏆' : '💀'
        const statusText = outcome === 'victory' ? 'VICTORY' : 'DEFEAT'
        const difficulty = runData?.finalStats?.finalDifficulty || 1
        const players = runData?.finalStats?.playerCount || 1
        const duration = runData?.finalStats?.duration || 0
        const durationMin = Math.floor(duration / 60000)

        return `${emoji} HELLDRAFTERS ${statusText} ${emoji}

🎯 Difficulty: ${difficulty}/10
👥 Squad Size: ${players}
⏱️ Duration: ${durationMin} minutes

Spread Democracy! 🦅
#Helldrafters #Helldivers2`
    }

    // Screenshot to clipboard
    const captureScreenshot = useCallback(async () => {
        if (!targetRef?.current) {
            setShareMessage({ type: 'error', text: 'Nothing to capture!' })
            return
        }

        setIsCapturing(true)
        setShareMessage(null)

        try {
            const canvas = await html2canvas(targetRef.current, {
                backgroundColor: COLORS.BG_MAIN,
                scale: 2, // Higher quality
                logging: false,
                useCORS: true,
                allowTaint: true,
            })

            // Convert to blob and copy to clipboard
            canvas.toBlob(async (blob) => {
                if (!blob) return
                try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                    setShareMessage({ type: 'success', text: 'Screenshot copied to clipboard!' })
                } catch (_clipboardError) {
                    // Fallback: download the image
                    const link = document.createElement('a')
                    link.download = `helldrafters-${outcome}-${Date.now()}.png`
                    link.href = canvas.toDataURL('image/png')
                    link.click()
                    setShareMessage({ type: 'success', text: 'Screenshot downloaded!' })
                }
            }, 'image/png')
        } catch (error) {
            console.error('Screenshot capture failed:', error)
            setShareMessage({ type: 'error', text: 'Failed to capture screenshot' })
        } finally {
            setIsCapturing(false)
        }
    }, [targetRef, outcome])

    // Share to Twitter/X
    const shareToTwitter = () => {
        const text = encodeURIComponent(getShareText())
        window.open(
            `https://twitter.com/intent/tweet?text=${text}`,
            '_blank',
            'width=550,height=420',
        )
    }

    // Clear message after timeout
    React.useEffect(() => {
        if (shareMessage) {
            const timer = setTimeout(() => setShareMessage(null), 3000)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [shareMessage])

    return (
        <ChartCard>
            <ChartTitle>
                <span style={{ fontSize: '18px' }}>📤</span>
                Share Your Run
            </ChartTitle>

            <Flex $gap="sm" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {/* Screenshot button */}
                <ShareButton
                    $accentColor={COLORS.ACCENT_BLUE}
                    onClick={captureScreenshot}
                    disabled={isCapturing}
                >
                    <span style={{ fontSize: '16px' }}>📸</span>
                    {isCapturing ? 'Capturing...' : 'Screenshot'}
                </ShareButton>

                {/* Twitter/X button */}
                <ShareButton $accentColor="#1DA1F2" onClick={shareToTwitter}>
                    <span style={{ fontSize: '16px' }}>𝕏</span>
                    Twitter/X
                </ShareButton>
            </Flex>

            {/* Status message */}
            {shareMessage && (
                <Alert
                    $variant={shareMessage.type === 'success' ? 'success' : 'error'}
                    style={{ marginTop: '12px', textAlign: 'center' }}
                >
                    <Text $size="sm">{shareMessage.text}</Text>
                </Alert>
            )}
        </ChartCard>
    )
}

export default SharePanel
