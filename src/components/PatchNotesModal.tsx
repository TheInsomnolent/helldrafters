import React from 'react'
import { X, FileText } from 'lucide-react'
import styled from 'styled-components'
import { getFactionColors } from '../constants/theme'
import packageJson from '../../package.json'
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
    Alert,
    Card,
} from '../styles'
import type { Faction } from '../types'

// ============================================================================
// CUSTOM STYLED COMPONENTS FOR MARKDOWN RENDERING
// ============================================================================

const MarkdownH1 = styled.h1<{ $color: string }>`
    font-size: 32px;
    font-weight: 900;
    color: ${({ $color }) => $color};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 24px;
    margin-top: 0;
`

const MarkdownH2 = styled.h2<{ $color: string }>`
    font-size: 24px;
    font-weight: bold;
    color: ${({ $color }) => $color};
    margin-top: 32px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid ${({ $color }) => `${$color}40`};
`

const MarkdownH3 = styled.h3`
    font-size: 18px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.accentGreen};
    margin-top: 20px;
    margin-bottom: 12px;
`

const MarkdownList = styled.ul`
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.8;
    padding-left: 20px;
    margin-bottom: 16px;
    list-style-type: disc;
`

const MarkdownParagraph = styled.p`
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.8;
    margin-bottom: 12px;
`

const FactionLink = styled.a<{ $color: string }>`
    color: ${({ $color }) => $color};
    text-decoration: underline;
`

interface PatchNotesModalProps {
    isOpen: boolean
    onClose: () => void
    faction?: Faction | string
}

/**
 * Modal component that displays patch notes from CHANGELOG.md
 */
export default function PatchNotesModal({
    isOpen,
    onClose,
    faction = 'terminid',
}: PatchNotesModalProps) {
    const factionColors = getFactionColors(faction)
    const [patchNotes, setPatchNotes] = React.useState('')
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    // Fetch changelog on mount
    React.useEffect(() => {
        if (isOpen) {
            setLoading(true)
            setError(null)

            // Try to fetch CHANGELOG.md from the public directory
            // Use PUBLIC_URL for production builds with homepage setting
            const changelogPath = `${process.env.PUBLIC_URL}/CHANGELOG.md`
            fetch(changelogPath)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Failed to load patch notes')
                    }
                    return response.text()
                })
                .then((text) => {
                    setPatchNotes(text)
                    setLoading(false)
                })
                .catch((err) => {
                    console.error('Error loading patch notes:', err)
                    setError(
                        'Unable to load patch notes. Please check the repository for the latest updates.',
                    )
                    setLoading(false)
                })
        }
    }, [isOpen])

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

    // Parse markdown-style headers and lists for basic formatting
    const formatPatchNotes = (text: string): React.ReactNode[] | null => {
        if (!text) return null

        const lines = text.split('\n')
        const elements: React.ReactNode[] = []
        let listItems: React.ReactNode[] = []

        const flushListItems = () => {
            if (listItems.length > 0) {
                elements.push(
                    <MarkdownList key={`list-${elements.length}`}>{listItems}</MarkdownList>,
                )
                listItems = []
            }
        }

        lines.forEach((line: string, idx: number) => {
            // Skip empty lines
            if (!line.trim()) {
                flushListItems()
                return
            }

            // H1 headers (# Title)
            if (line.startsWith('# ')) {
                flushListItems()
                elements.push(
                    <MarkdownH1 key={`h1-${idx}`} $color={factionColors.PRIMARY}>
                        {line.substring(2)}
                    </MarkdownH1>,
                )
            }
            // H2 headers (## Version)
            else if (line.startsWith('## ')) {
                flushListItems()
                const textContent = line.substring(3)
                elements.push(
                    <MarkdownH2 key={`h2-${idx}`} $color={factionColors.PRIMARY}>
                        {textContent}
                    </MarkdownH2>,
                )
            }
            // H3 headers (### Category)
            else if (line.startsWith('### ')) {
                flushListItems()
                elements.push(<MarkdownH3 key={`h3-${idx}`}>{line.substring(4)}</MarkdownH3>)
            }
            // List items (- Item)
            else if (line.startsWith('- ')) {
                listItems.push(
                    <li key={`li-${idx}`} style={{ marginBottom: '4px' }}>
                        {line.substring(2)}
                    </li>,
                )
            }
            // Regular paragraph text
            else {
                flushListItems()
                // Skip markdown link reference lines (e.g., [Keep a Changelog]: https://keepachangelog.com...)
                // This is for display filtering only, not URL validation/sanitization
                if (!line.startsWith('[') && !line.includes('keepachangelog.com')) {
                    elements.push(<MarkdownParagraph key={`p-${idx}`}>{line}</MarkdownParagraph>)
                }
            }
        })

        flushListItems()
        return elements
    }

    return (
        <ModalBackdrop
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="patchnotes-modal-title"
            aria-describedby="patchnotes-modal-content"
        >
            <ModalContainer
                $size="lg"
                $factionPrimary={factionColors.PRIMARY}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <ModalHeader $factionPrimary={factionColors.PRIMARY} $sticky>
                    <Flex $align="center" $gap="md">
                        <FileText size={28} color={factionColors.PRIMARY} />
                        <ModalTitle
                            $factionColor={factionColors.PRIMARY}
                            id="patchnotes-modal-title"
                        >
                            Patch Notes
                        </ModalTitle>
                    </Flex>
                    <IconButton onClick={onClose} title="Close">
                        <X size={20} />
                    </IconButton>
                </ModalHeader>

                {/* Content */}
                <ModalContent $padding="xxl" id="patchnotes-modal-content">
                    {loading && (
                        <Text $color="muted" style={{ textAlign: 'center', padding: '40px' }}>
                            Loading patch notes...
                        </Text>
                    )}

                    {error && (
                        <Alert $variant="error" style={{ textAlign: 'center' }}>
                            <Text $color="error" style={{ margin: 0 }}>
                                {error}
                            </Text>
                        </Alert>
                    )}

                    {!loading && !error && <div>{formatPatchNotes(patchNotes)}</div>}

                    {/* Footer */}
                    <Card
                        $variant="base"
                        $padding="lg"
                        style={{ marginTop: '32px', textAlign: 'center' }}
                    >
                        <Text $color="muted" style={{ marginBottom: '8px' }}>
                            For the full changelog and detailed information, visit the{' '}
                            <FactionLink
                                href="https://github.com/TheInsomnolent/helldrafters"
                                target="_blank"
                                rel="noopener noreferrer"
                                $color={factionColors.PRIMARY}
                            >
                                GitHub repository
                            </FactionLink>
                        </Text>
                        <Caption>
                            Version: {packageJson.version} | Build:{' '}
                            {process.env.REACT_APP_COMMIT_SHA?.substring(0, 7) || 'dev'}
                        </Caption>
                    </Card>
                </ModalContent>
            </ModalContainer>
        </ModalBackdrop>
    )
}
