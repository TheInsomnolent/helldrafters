/**
 * MultiplayerLobby - Component for hosting/joining multiplayer games
 */

import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Copy, Check, Users, Crown, Wifi, WifiOff, RefreshCw, Link } from 'lucide-react'
import { COLORS, SHADOWS, getFactionColors } from '../constants/theme'
import { useMultiplayer, type LobbyInfo, type LobbyPlayer } from '../systems/multiplayer'
import { trackMultiplayerAction } from '../utils/analytics'
import GameConfiguration from './GameConfiguration'
import type { GameConfig } from '../types'
import type { Subfaction } from '../constants/balancingConfig'
import {
    PageContainer,
    Container,
    Title,
    Heading,
    Card,
    Button,
    Input,
    Label,
    Flex,
    Grid,
    Text,
    Caption,
    Alert,
    SelectableCard,
    Strong,
} from '../styles'

// ============================================================================
// STYLED COMPONENTS (component-specific only)
// ============================================================================

const HeaderBanner = styled.div`
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
    margin: 0 auto;
    max-width: 400px;
    border-top: 1px solid rgba(100, 116, 139, 0.3);
    border-bottom: 1px solid rgba(100, 116, 139, 0.3);
`

const HeaderBannerText = styled.p`
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.textPrimary};
    text-transform: uppercase;
    letter-spacing: 0.3em;
    margin: 0;
`

const ModeCard = styled(SelectableCard)<{ $accentColor?: string }>`
    padding: 48px 32px;
    text-align: center;

    &:hover {
        border-color: ${({ $accentColor, theme }) => $accentColor || theme.colors.primary};
        transform: translateY(-4px);
        box-shadow: ${({ $accentColor }) =>
            $accentColor ? `0 0 20px ${$accentColor}40` : SHADOWS.GLOW_PRIMARY};
    }
`

const ModeIcon = styled.div<{ $color?: string }>`
    color: ${({ $color, theme }) => $color || theme.colors.primary};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ModeTitle = styled.h2<{ $color?: string }>`
    font-size: 28px;
    font-weight: ${({ theme }) => theme.fontWeights.black};
    color: ${({ $color, theme }) => $color || theme.colors.primary};
    margin-bottom: ${({ theme }) => theme.spacing.md};
    text-transform: uppercase;
`

const LobbyCodeBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.lg};
    background-color: ${({ theme }) => theme.colors.bgMain};
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
    border-radius: ${({ theme }) => theme.radii.md};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.normal};
    flex-wrap: wrap;
`

const LobbyCode = styled.code<{ $visible?: boolean; $factionPrimary?: string }>`
    font-size: 18px;
    font-family: monospace;
    color: ${({ $visible, $factionPrimary, theme }) =>
        $visible ? $factionPrimary || theme.colors.primary : theme.colors.textDisabled};
    letter-spacing: 0.05em;
    filter: ${({ $visible }) => ($visible ? 'none' : 'blur(8px)')};
    transition: ${({ theme }) => theme.transitions.normal};
    user-select: ${({ $visible }) => ($visible ? 'text' : 'none')};
`

const PlayerSlotCard = styled.div<{
    $active?: boolean
    $isCurrentPlayer?: boolean
    $factionPrimary?: string
}>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({ theme }) => theme.spacing.lg} 20px;
    background-color: ${({ theme }) => theme.colors.bgMain};
    border-radius: ${({ theme }) => theme.radii.md};
    border: 2px solid
        ${({ $active, $isCurrentPlayer, $factionPrimary, theme }) =>
            $active
                ? $isCurrentPlayer
                    ? $factionPrimary || theme.colors.primary
                    : theme.colors.cardBorder
                : 'rgba(100, 116, 139, 0.3)'};
    opacity: ${({ $active }) => ($active ? 1 : 0.5)};
`

const SlotButton = styled.button<{
    $selected?: boolean
    $factionColor?: string
    $hasDisconnected?: boolean
}>`
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
    background-color: ${({ $selected, $factionColor, theme }) =>
        $selected ? $factionColor || theme.colors.primary : theme.colors.bgMain};
    color: ${({ $selected }) => ($selected ? 'black' : 'white')};
    border: 2px solid
        ${({ $selected, $factionColor, $hasDisconnected, theme }) =>
            $selected
                ? $factionColor || theme.colors.primary
                : $hasDisconnected
                  ? '#f59e0b'
                  : theme.colors.cardBorder};
    border-radius: ${({ theme }) => theme.radii.md};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.normal};
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    &:hover {
        border-color: ${({ $factionColor }) => $factionColor || COLORS.ACCENT_BLUE};
    }
`

const SlotButtonLabel = styled.span<{ $selected?: boolean }>`
    font-size: 10px;
    color: ${({ $selected }) => ($selected ? 'rgba(0,0,0,0.6)' : '#f59e0b')};
    font-weight: normal;
`

const SlotLabel = styled.span`
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.textMuted};
    min-width: 60px;
`

const PlayerBadge = styled.div<{ $isHost?: boolean; $factionColor?: string }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: ${({ theme }) => theme.colors.bgMain};
    border-radius: ${({ theme }) => theme.radii.md};
    border: 1px solid
        ${({ $isHost, $factionColor, theme }) =>
            $isHost ? $factionColor || theme.colors.primary : theme.colors.cardBorder};
`

const PlayerBadgeLabel = styled.span<{ $factionPrimary?: string }>`
    font-size: 10px;
    padding: 2px 8px;
    background-color: ${({ $factionPrimary }) => `${$factionPrimary}30`};
    color: ${({ $factionPrimary, theme }) => $factionPrimary || theme.colors.primary};
    border-radius: ${({ theme }) => theme.radii.md};
`

const StatusBar = styled.div<{ $accentColor?: string }>`
    background-color: rgba(15, 23, 42, 0.95);
    border-bottom: 2px solid ${({ $accentColor, theme }) => $accentColor || theme.colors.primary};
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing.lg};
    position: sticky;
    top: 0;
    z-index: ${({ theme }) => theme.zIndex.sticky};
`

const StatusLabel = styled.span<{ $color?: string }>`
    font-size: 11px;
    font-weight: ${({ theme }) => theme.fontWeights.black};
    color: ${({ $color, theme }) => $color || theme.colors.primary};
    text-transform: uppercase;
    letter-spacing: 0.1em;
`

const PlayerTag = styled.div<{
    $variant?: 'host' | 'player' | 'disconnected'
    $factionPrimary?: string
}>`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.radii.md};
    background-color: ${({ $variant, $factionPrimary }) =>
        $variant === 'disconnected'
            ? 'rgba(239, 68, 68, 0.2)'
            : $variant === 'host'
              ? `${$factionPrimary}20`
              : 'rgba(59, 130, 246, 0.2)'};
    color: ${({ $variant, $factionPrimary, theme }) =>
        $variant === 'disconnected'
            ? theme.colors.accentRed
            : $variant === 'host'
              ? $factionPrimary || theme.colors.primary
              : theme.colors.accentBlue};
    opacity: ${({ $variant }) => ($variant === 'disconnected' ? 0.7 : 1)};
`

const CopyButton = styled.button<{ $copied?: boolean; $primary?: boolean; $factionColor?: string }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background-color: ${({ $copied, $primary, $factionColor }) =>
        $copied ? '#22c55e' : $primary ? $factionColor || COLORS.ACCENT_BLUE : 'transparent'};
    color: ${({ $copied, $primary }) => ($copied || $primary ? 'white' : COLORS.TEXT_MUTED)};
    border: 1px solid
        ${({ $copied, $primary, $factionColor }) =>
            $copied
                ? '#22c55e'
                : $primary
                  ? $factionColor || COLORS.ACCENT_BLUE
                  : COLORS.CARD_BORDER};
    border-radius: ${({ theme }) => theme.radii.md};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.fast};
    font-weight: ${({ $primary }) => ($primary ? 'bold' : 'normal')};

    &:hover {
        background-color: ${({ $copied, $primary, $factionColor }) =>
            $copied
                ? '#22c55e'
                : $primary
                  ? $factionColor || COLORS.ACCENT_BLUE
                  : 'rgba(100, 116, 139, 0.1)'};
    }
`

const SmallButton = styled.button<{ $variant?: 'danger' | 'primary' | 'ghost' }>`
    padding: 4px 12px;
    background-color: transparent;
    color: ${({ $variant }) =>
        $variant === 'danger'
            ? '#ef4444'
            : $variant === 'primary'
              ? COLORS.ACCENT_BLUE
              : COLORS.TEXT_MUTED};
    border: 1px solid
        ${({ $variant }) =>
            $variant === 'danger'
                ? '#7f1d1d'
                : $variant === 'primary'
                  ? COLORS.ACCENT_BLUE
                  : COLORS.CARD_BORDER};
    border-radius: ${({ theme }) => theme.radii.md};
    font-size: 12px;
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.fast};

    &:hover {
        background-color: ${({ $variant }) =>
            $variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
        border-color: ${({ $variant }) => ($variant === 'danger' ? '#ef4444' : COLORS.ACCENT_BLUE)};
    }
`

const DisconnectButton = styled.button`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: ${({ theme }) => theme.radii.md};
    color: #ef4444;
    font-size: 10px;
    font-weight: ${({ theme }) => theme.fontWeights.black};
    text-transform: uppercase;
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.fast};

    &:hover {
        background-color: rgba(239, 68, 68, 0.2);
        border-color: #ef4444;
    }
`

const KickButton = styled.button`
    margin-left: 4px;
    padding: 0 4px;
    background-color: transparent;
    color: #ef4444;
    border: none;
    border-radius: 2px;
    font-size: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: ${({ theme }) => theme.transitions.fast};

    &:hover {
        opacity: 1;
    }
`

const LobbyCodeButton = styled.button`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background-color: rgba(100, 116, 139, 0.2);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: ${({ theme }) => theme.radii.md};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.fast};
`

const LobbyCodeSmall = styled.code<{ $visible?: boolean }>`
    font-size: 11px;
    color: ${({ $visible, theme }) =>
        $visible ? theme.colors.textSecondary : theme.colors.textDisabled};
    font-family: monospace;
    filter: ${({ $visible }) => ($visible ? 'none' : 'blur(4px)')};
    transition: filter 0.2s;
    user-select: ${({ $visible }) => ($visible ? 'text' : 'none')};
`

/**
 * Generate a shareable join link for a lobby
 * @param {string} lobbyId - The lobby UUID
 * @returns {string} The full shareable URL
 */
function generateJoinLink(lobbyId: string): string {
    const baseUrl = window.location.origin + window.location.pathname
    return `${baseUrl}?join=${lobbyId}`
}

interface MultiplayerModeSelectProps {
    gameConfig: GameConfig
    onHost: () => void
    onJoin: () => void
    onBack: () => void
}

/**
 * Host/Join selection screen
 */
export function MultiplayerModeSelect({
    gameConfig,
    onHost,
    onJoin,
    onBack,
}: MultiplayerModeSelectProps): React.ReactElement {
    const factionColors = getFactionColors(gameConfig.faction)
    const { firebaseReady, error, clearError } = useMultiplayer()

    if (!firebaseReady) {
        return (
            <PageContainer>
                <Container $maxWidth="sm" style={{ textAlign: 'center' }}>
                    <Heading $factionColor="#ef4444" style={{ fontSize: '48px' }}>
                        MULTIPLAYER UNAVAILABLE
                    </Heading>
                    <Text $color="muted" style={{ marginBottom: '32px' }}>
                        Firebase is not configured. Please add your Firebase configuration to enable
                        multiplayer features.
                    </Text>
                    <Caption style={{ marginBottom: '48px' }}>
                        See src/systems/multiplayer/firebaseConfig.js for setup instructions.
                    </Caption>
                    <Button $variant="secondary" onClick={onBack}>
                        ← BACK TO MENU
                    </Button>
                </Container>
            </PageContainer>
        )
    }

    return (
        <PageContainer>
            <Container $maxWidth="md">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <Title $factionColor={factionColors.PRIMARY} $factionGlow={factionColors.GLOW}>
                        MULTIPLAYER
                    </Title>
                    <HeaderBanner>
                        <HeaderBannerText>Squad Up</HeaderBannerText>
                    </HeaderBanner>
                </div>

                {error && (
                    <Alert $variant="error" style={{ marginBottom: '32px' }}>
                        <Flex $justify="between" $align="center">
                            <span>{error}</span>
                            <button
                                onClick={clearError}
                                style={{
                                    color: '#ef4444',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                ✕
                            </button>
                        </Flex>
                    </Alert>
                )}

                {/* Options */}
                <Grid $columns={2} $gap="xl" style={{ marginBottom: '48px' }}>
                    {/* Host Game */}
                    <ModeCard
                        $accentColor={factionColors.PRIMARY}
                        onClick={() => {
                            trackMultiplayerAction('select_host')
                            onHost()
                        }}
                    >
                        <ModeIcon $color={factionColors.PRIMARY}>
                            <Crown size={64} />
                        </ModeIcon>
                        <ModeTitle $color={factionColors.PRIMARY}>HOST GAME</ModeTitle>
                        <Text $color="muted">Create a new lobby and invite your squad</Text>
                    </ModeCard>

                    {/* Join Game */}
                    <ModeCard
                        $accentColor={COLORS.ACCENT_BLUE}
                        onClick={() => {
                            trackMultiplayerAction('select_join')
                            onJoin()
                        }}
                    >
                        <ModeIcon $color={COLORS.ACCENT_BLUE}>
                            <Users size={64} />
                        </ModeIcon>
                        <ModeTitle $color={COLORS.ACCENT_BLUE}>JOIN GAME</ModeTitle>
                        <Text $color="muted">Enter a lobby code to join your squad</Text>
                    </ModeCard>
                </Grid>

                {/* Back button */}
                <div style={{ textAlign: 'center' }}>
                    <Button $variant="secondary" onClick={onBack}>
                        ← BACK TO MENU
                    </Button>
                </div>
            </Container>
        </PageContainer>
    )
}

interface JoinGameScreenProps {
    gameConfig: GameConfig
    initialLobbyCode: string
    onJoinLobby: (lobbyId: string, name: string, slot: number) => void
    onBack: () => void
}

/**
 * Join game screen - enter lobby code
 */
export function JoinGameScreen({
    gameConfig,
    initialLobbyCode,
    onJoinLobby,
    onBack,
}: JoinGameScreenProps): React.ReactElement {
    const factionColors = getFactionColors(gameConfig.faction)
    const { checkLobbyExists, error, clearError } = useMultiplayer()

    // Load saved player name from localStorage
    // Initialize lobbyCode from initialLobbyCode if provided (from URL param)
    const [lobbyCode, setLobbyCode] = useState<string>(initialLobbyCode || '')
    const [playerName, setPlayerName] = useState<string>(() => {
        try {
            return localStorage.getItem('helldrafters_mp_name') || ''
        } catch {
            return ''
        }
    })
    const [checking, setChecking] = useState(false)
    const [lobbyInfo, setLobbyInfo] = useState<LobbyInfo | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

    // Track if we've already checked this code to avoid duplicate checks
    const lastCheckedCode = useRef<string>('')

    // UUID v4 pattern
    const isValidUUID = (str: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
    }

    // Auto-check lobby when a valid UUID is entered/pasted
    useEffect(() => {
        const trimmedCode = lobbyCode.trim()

        // Only auto-check if it looks like a valid UUID and we haven't checked it yet
        if (isValidUUID(trimmedCode) && trimmedCode !== lastCheckedCode.current && !checking) {
            lastCheckedCode.current = trimmedCode

            // Run the check
            const autoCheck = async () => {
                setChecking(true)
                clearError()

                const info = await checkLobbyExists(trimmedCode)
                setLobbyInfo(info)
                setChecking(false)

                // For new games, auto-select the next sequential slot
                if (info && !info.isLoadedGame) {
                    const players = info.players || {}
                    const takenSlots = Object.values(players).map((p) => p.slot)
                    for (let i = 0; i < 4; i++) {
                        if (!takenSlots.includes(i)) {
                            setSelectedSlot(i)
                            break
                        }
                    }
                } else {
                    setSelectedSlot(null)
                }
            }

            autoCheck()
        }
    }, [lobbyCode, checking, checkLobbyExists, clearError])

    const handleCheckLobby = async () => {
        if (!lobbyCode.trim()) return

        setChecking(true)
        clearError()

        const info = await checkLobbyExists(lobbyCode.trim())
        setLobbyInfo(info)
        setChecking(false)

        // For new games, auto-select the next sequential slot
        if (info && !info.isLoadedGame) {
            const players = info.players || {}
            const takenSlots = Object.values(players).map((p) => p.slot)
            // Find the first available slot sequentially
            for (let i = 0; i < 4; i++) {
                if (!takenSlots.includes(i)) {
                    setSelectedSlot(i)
                    break
                }
            }
        } else {
            setSelectedSlot(null)
        }
    }

    const getAvailableSlots = () => {
        if (!lobbyInfo) return []
        const totalSlots = 4 // Always allow up to 4 players in multiplayer (dynamic)
        const players = lobbyInfo.players || {}

        // A slot is available if:
        // 1. No player is in that slot, OR
        // 2. The player in that slot is disconnected (connected === false)
        const available = []
        for (let i = 0; i < totalSlots; i++) {
            const playerInSlot = Object.values(players).find((p) => p.slot === i)
            // Slot is available if no player or player is disconnected
            if (!playerInSlot || playerInSlot.connected === false) {
                available.push(i)
            }
        }
        return available
    }

    // Get info about disconnected players by slot (for UI indication)
    const getDisconnectedPlayerInSlot = (slot: number): LobbyPlayer | undefined => {
        if (!lobbyInfo?.players) return undefined
        const player = Object.values(lobbyInfo.players).find(
            (p) => p.slot === slot && p.connected === false,
        )
        return player
    }

    // Check if slot selection should be shown (only for loaded games)
    const showSlotSelection = lobbyInfo?.isLoadedGame

    const handleJoin = () => {
        if (playerName.trim() && selectedSlot !== null) {
            // Save player name to localStorage for next time
            try {
                localStorage.setItem('helldrafters_mp_name', playerName.trim())
            } catch (e) {
                // Ignore localStorage errors
            }
            trackMultiplayerAction('join_lobby')
            onJoinLobby(lobbyCode.trim(), playerName.trim(), selectedSlot)
        }
    }

    const availableSlots = getAvailableSlots()

    return (
        <PageContainer>
            <Container $maxWidth="sm">
                {/* Header */}
                <Flex $direction="column" $align="center" style={{ marginBottom: '48px' }}>
                    <Heading $factionColor={COLORS.ACCENT_BLUE}>JOIN GAME</Heading>
                    <Text $color="muted">Enter the lobby code shared by your host</Text>
                </Flex>

                {error && (
                    <Alert $variant="error" style={{ marginBottom: '24px' }}>
                        {error}
                    </Alert>
                )}

                {/* Lobby Code Input */}
                <div style={{ marginBottom: '32px' }}>
                    <Label>LOBBY CODE</Label>
                    <Flex $gap="md">
                        <Input
                            type="text"
                            value={lobbyCode}
                            onChange={(e) => {
                                setLobbyCode(e.target.value)
                                setLobbyInfo(null)
                                setSelectedSlot(null)
                            }}
                            placeholder="Enter lobby code (UUID)"
                            style={{ flex: 1 }}
                        />
                        <Button onClick={handleCheckLobby} disabled={!lobbyCode.trim() || checking}>
                            {checking ? <RefreshCw size={20} className="spin" /> : 'CHECK'}
                        </Button>
                    </Flex>
                </div>

                {/* Lobby Info */}
                {lobbyInfo && (
                    <Card style={{ marginBottom: '32px', padding: '24px' }}>
                        <Heading
                            as="h3"
                            $factionColor={factionColors.PRIMARY}
                            style={{ marginBottom: '16px' }}
                        >
                            LOBBY FOUND
                        </Heading>

                        {/* Current Players */}
                        <div style={{ marginBottom: '24px' }}>
                            <Caption>PLAYERS IN LOBBY</Caption>
                            <Flex $wrap $gap="sm" style={{ marginTop: '8px' }}>
                                {Object.values(lobbyInfo.players || {}).map((p) => (
                                    <PlayerBadge
                                        key={p.id}
                                        $isHost={p.isHost}
                                        $factionColor={factionColors.PRIMARY}
                                    >
                                        {p.isHost && (
                                            <Crown
                                                size={14}
                                                style={{ color: factionColors.PRIMARY }}
                                            />
                                        )}
                                        <span
                                            style={{
                                                color: p.connected ? 'white' : COLORS.TEXT_DISABLED,
                                            }}
                                        >
                                            {p.name}
                                        </span>
                                        <Caption>(Slot {p.slot + 1})</Caption>
                                    </PlayerBadge>
                                ))}
                            </Flex>
                        </div>

                        {/* Player Name */}
                        <div style={{ marginBottom: '24px' }}>
                            <Label>YOUR NAME</Label>
                            <Input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Enter your helldiver name"
                                maxLength={30}
                            />
                        </div>

                        {/* Slot Selection - only show for loaded/saved games */}
                        {showSlotSelection && (
                            <div style={{ marginBottom: '24px' }}>
                                <Label>SELECT YOUR SLOT</Label>
                                <Text
                                    $size="sm"
                                    $color="secondary"
                                    style={{ marginBottom: '12px' }}
                                >
                                    This is a saved game. Select which helldiver slot you want to
                                    play as.
                                </Text>
                                {availableSlots.length === 0 ? (
                                    <Text $color="error">No slots available - lobby is full</Text>
                                ) : (
                                    <Flex $wrap $gap="md">
                                        {availableSlots.map((slot) => {
                                            const disconnectedPlayer =
                                                getDisconnectedPlayerInSlot(slot)
                                            return (
                                                <SlotButton
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    $selected={selectedSlot === slot}
                                                    $factionColor={factionColors.PRIMARY}
                                                    $hasDisconnected={!!disconnectedPlayer}
                                                >
                                                    <span>Slot {slot + 1}</span>
                                                    {disconnectedPlayer && (
                                                        <SlotButtonLabel
                                                            $selected={selectedSlot === slot}
                                                        >
                                                            (Rejoin as {disconnectedPlayer.name})
                                                        </SlotButtonLabel>
                                                    )}
                                                </SlotButton>
                                            )
                                        })}
                                    </Flex>
                                )}
                            </div>
                        )}

                        {/* Auto-assigned slot message for new games */}
                        {!showSlotSelection && selectedSlot !== null && (
                            <Alert $variant="info" style={{ marginBottom: '24px' }}>
                                <Strong style={{ color: factionColors.PRIMARY }}>
                                    You will join as Helldiver {selectedSlot + 1}
                                </Strong>
                            </Alert>
                        )}

                        {/* Join Button */}
                        <Button
                            onClick={handleJoin}
                            disabled={!playerName.trim() || selectedSlot === null}
                            $fullWidth
                        >
                            JOIN LOBBY
                        </Button>
                    </Card>
                )}

                {/* No lobby found message */}
                {lobbyCode && !checking && !lobbyInfo && !error && (
                    <Alert
                        $variant="error"
                        style={{ marginBottom: '32px', textAlign: 'center', padding: '24px' }}
                    >
                        <Text $color="error">Lobby not found. Check the code and try again.</Text>
                    </Alert>
                )}

                {/* Back button */}
                <Flex $justify="center">
                    <Button $variant="ghost" onClick={onBack}>
                        ← BACK
                    </Button>
                </Flex>
            </Container>
        </PageContainer>
    )
}

interface MultiplayerWaitingRoomProps {
    gameConfig: GameConfig
    eventsEnabled: boolean
    onUpdateGameConfig: (config: Partial<GameConfig>) => void
    onSetSubfaction: (subfaction: Subfaction) => void
    onSetEventsEnabled: (enabled: boolean) => void
    onStartGame: (playerCount: number) => void
    onLeave: () => void
    isConfiguring?: boolean
}

/**
 * Multiplayer waiting room - shown after host creates or player joins
 */
export function MultiplayerWaitingRoom({
    gameConfig,
    eventsEnabled,
    onUpdateGameConfig,
    onSetSubfaction,
    onSetEventsEnabled,
    onStartGame,
    onLeave,
    isConfiguring = false,
}: MultiplayerWaitingRoomProps): React.ReactElement {
    const factionColors = getFactionColors(gameConfig.faction)
    const { isHost, lobbyId, lobbyData, playerSlot, disconnect, changeSlot, kickPlayerFromLobby } =
        useMultiplayer()
    const [copied, setCopied] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)
    const [changingSlot, setChangingSlot] = useState(false)
    const [lobbyCodeVisible, setLobbyCodeVisible] = useState(false)

    const copyLobbyCode = (): void => {
        if (lobbyId) navigator.clipboard.writeText(lobbyId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const copyJoinLink = (): void => {
        if (lobbyId) {
            const link = generateJoinLink(lobbyId)
            navigator.clipboard.writeText(link)
        }
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
    }

    const allPlayers = lobbyData?.players ? Object.values(lobbyData.players) : []
    const players = allPlayers.filter((p) => p.connected !== false) // Only show connected players
    const maxPlayers = 4 // Always allow up to 4 players in multiplayer
    const canStart = players.length >= 1 // Can start with at least 1 player (the host)

    // Calculate available slots for slot switching
    const takenSlots = players.map((p) => p.slot)
    const availableSlotsForSwitch: number[] = []
    for (let i = 0; i < maxPlayers; i++) {
        if (!takenSlots.includes(i)) {
            availableSlotsForSwitch.push(i)
        }
    }

    const handleChangeSlot = async (newSlot: number): Promise<void> => {
        setChangingSlot(true)
        await changeSlot(newSlot)
        setChangingSlot(false)
    }

    const handleKickPlayer = async (playerIdToKick: string): Promise<void> => {
        if (
            window.confirm(
                'Are you sure you want to kick this player? They can rejoin with the lobby code.',
            )
        ) {
            await kickPlayerFromLobby(playerIdToKick)
        }
    }

    const handleLeave = async (): Promise<void> => {
        trackMultiplayerAction('leave_lobby', players.length)
        await disconnect()
        onLeave()
    }

    const handleStartGame = (): void => {
        // Track multiplayer game start
        trackMultiplayerAction('start_game', players.length)
        // Pass the actual number of players that joined
        onStartGame(players.length)
    }

    // If host is configuring warbonds, show minimal waiting UI
    if (isConfiguring) {
        return <></> // Let the parent handle the lobby display
    }

    return (
        <PageContainer>
            <Container $maxWidth="md">
                {/* Header */}
                <Flex $direction="column" $align="center" style={{ marginBottom: '48px' }}>
                    <Title $factionColor={factionColors.PRIMARY}>
                        {isHost ? 'HOSTING GAME' : 'WAITING FOR HOST'}
                    </Title>
                    <Text $color="muted">
                        {isHost
                            ? 'Share the lobby code with your squad'
                            : 'Waiting for host to start the game...'}
                    </Text>
                </Flex>

                {/* Lobby Code - Hidden until hover for streaming mode */}
                <Card style={{ marginBottom: '32px', padding: '32px', textAlign: 'center' }}>
                    <Caption style={{ marginBottom: '8px' }}>
                        LOBBY CODE {!lobbyCodeVisible && '(hover to reveal)'}
                    </Caption>
                    <LobbyCodeBox
                        onMouseEnter={() => setLobbyCodeVisible(true)}
                        onMouseLeave={() => setLobbyCodeVisible(false)}
                    >
                        <LobbyCode
                            $visible={lobbyCodeVisible}
                            $factionPrimary={factionColors.PRIMARY}
                        >
                            {lobbyId}
                        </LobbyCode>
                        <Flex $gap="sm">
                            <CopyButton onClick={copyLobbyCode} $copied={copied}>
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy Code'}
                            </CopyButton>
                            <CopyButton
                                onClick={copyJoinLink}
                                $copied={copiedLink}
                                $primary={!copiedLink}
                                $factionColor={factionColors.PRIMARY}
                            >
                                {copiedLink ? <Check size={16} /> : <Link size={16} />}
                                {copiedLink ? 'Copied!' : 'Copy Link'}
                            </CopyButton>
                        </Flex>
                    </LobbyCodeBox>
                    <Caption style={{ marginTop: '8px', color: COLORS.TEXT_DISABLED }}>
                        Hidden for streaming - hover to reveal. Share the link for easy joining!
                    </Caption>
                </Card>

                {/* Players List */}
                <Card style={{ marginBottom: '32px', padding: '32px' }}>
                    <Heading
                        as="h3"
                        $factionColor={factionColors.PRIMARY}
                        style={{ marginBottom: '24px' }}
                    >
                        SQUAD ({players.length}/{maxPlayers})
                    </Heading>

                    <Grid $gap="md">
                        {Array.from({ length: maxPlayers }, (_, i) => {
                            const player = players.find((p) => p.slot === i)
                            const isCurrentPlayer = player && player.slot === playerSlot

                            return (
                                <PlayerSlotCard
                                    key={i}
                                    $active={!!player}
                                    $isCurrentPlayer={isCurrentPlayer}
                                    $factionPrimary={factionColors.PRIMARY}
                                >
                                    <Flex $align="center" $gap="md">
                                        <SlotLabel>SLOT {i + 1}</SlotLabel>
                                        {player ? (
                                            <>
                                                <Strong>{player.name}</Strong>
                                                {player.isHost && (
                                                    <Crown
                                                        size={16}
                                                        style={{ color: factionColors.PRIMARY }}
                                                    />
                                                )}
                                                {isCurrentPlayer && (
                                                    <PlayerBadgeLabel
                                                        $factionPrimary={factionColors.PRIMARY}
                                                    >
                                                        YOU
                                                    </PlayerBadgeLabel>
                                                )}
                                            </>
                                        ) : (
                                            <Text $color="disabled" style={{ fontStyle: 'italic' }}>
                                                Waiting for player...
                                            </Text>
                                        )}
                                    </Flex>

                                    <Flex $align="center" $gap="sm">
                                        {player &&
                                            (player.connected ? (
                                                <Wifi size={16} style={{ color: '#22c55e' }} />
                                            ) : (
                                                <WifiOff size={16} style={{ color: '#ef4444' }} />
                                            ))}
                                        {/* Host can kick disconnected players to free up their slot */}
                                        {isHost &&
                                            player &&
                                            !player.isHost &&
                                            !player.connected && (
                                                <SmallButton
                                                    $variant="danger"
                                                    onClick={() => handleKickPlayer(player.id)}
                                                    title="Kick this player to free up their slot for rejoining"
                                                >
                                                    Kick
                                                </SmallButton>
                                            )}
                                        {!player && !isHost && (
                                            <SmallButton
                                                $variant="primary"
                                                onClick={() => handleChangeSlot(i)}
                                                disabled={changingSlot}
                                            >
                                                Switch Here
                                            </SmallButton>
                                        )}
                                    </Flex>
                                </PlayerSlotCard>
                            )
                        })}
                    </Grid>
                </Card>

                {/* Game Configuration - Host Only */}
                {isHost && (
                    <Card style={{ marginBottom: '32px', padding: '32px' }}>
                        <Heading
                            as="h3"
                            $factionColor={factionColors.PRIMARY}
                            style={{ marginBottom: '24px' }}
                        >
                            GAME CONFIGURATION
                        </Heading>
                        <GameConfiguration
                            gameConfig={gameConfig}
                            eventsEnabled={eventsEnabled}
                            onUpdateGameConfig={onUpdateGameConfig}
                            onSetSubfaction={onSetSubfaction}
                            onSetEventsEnabled={onSetEventsEnabled}
                            factionColors={factionColors}
                        />
                    </Card>
                )}

                {/* Action Buttons */}
                <Flex $justify="between" $gap="lg">
                    <Button $variant="danger" onClick={handleLeave}>
                        {isHost ? 'CLOSE LOBBY' : 'LEAVE LOBBY'}
                    </Button>

                    {isHost && (
                        <Button
                            onClick={handleStartGame}
                            disabled={!canStart}
                            $factionPrimary={factionColors.PRIMARY}
                        >
                            {canStart
                                ? `START WITH ${players.length} PLAYER${players.length > 1 ? 'S' : ''} →`
                                : 'WAITING FOR HOST...'}
                        </Button>
                    )}
                </Flex>
            </Container>
        </PageContainer>
    )
}

/**
 * MultiplayerStatusBar - Shows during active multiplayer game
 * Displays lobby code, connected players, and host status
 */
interface MultiplayerStatusBarProps {
    gameConfig: GameConfig
    onDisconnect: () => void
}

export function MultiplayerStatusBar({
    gameConfig,
    onDisconnect,
}: MultiplayerStatusBarProps): React.ReactElement {
    const { isHost, lobbyId, connectedPlayers, playerSlot, playerId, kickPlayerFromLobby } =
        useMultiplayer()
    const [copied, setCopied] = useState(false)
    const [lobbyCodeVisible, setLobbyCodeVisible] = useState(false)
    const factionColors = getFactionColors(gameConfig?.faction || 'terminid')

    const copyJoinLink = () => {
        if (!lobbyId) return
        const link = generateJoinLink(lobbyId)
        navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Format lobby ID for display (show first 8 chars)
    const displayLobbyId = lobbyId ? `${lobbyId.substring(0, 8)}...` : ''
    // Count only actually connected players (not those who disconnected)
    const actuallyConnected = (connectedPlayers || []).filter((p) => p.connected !== false)
    const playerCount = actuallyConnected.length
    const expectedPlayers = gameConfig?.playerCount || 4

    return (
        <StatusBar $accentColor={isHost ? factionColors.PRIMARY : COLORS.ACCENT_BLUE}>
            {/* Left: Multiplayer Status */}
            <Flex $align="center" $gap="lg">
                {/* Connection Status */}
                <Flex $align="center" $gap="sm">
                    <Wifi size={16} style={{ color: '#22c55e' }} />
                    <StatusLabel $color={isHost ? factionColors.PRIMARY : COLORS.ACCENT_BLUE}>
                        {isHost ? '👑 HOST' : `PLAYER ${(playerSlot ?? 0) + 1}`}
                    </StatusLabel>
                </Flex>

                {/* Lobby Code - Hidden until hover for streaming mode */}
                <Flex
                    $align="center"
                    $gap="sm"
                    onMouseEnter={() => setLobbyCodeVisible(true)}
                    onMouseLeave={() => setLobbyCodeVisible(false)}
                >
                    <Caption>Lobby:</Caption>
                    <LobbyCodeButton
                        onClick={copyJoinLink}
                        title={
                            lobbyCodeVisible
                                ? `Copy join link for lobby: ${lobbyId}`
                                : 'Hover to reveal, click to copy join link'
                        }
                    >
                        <LobbyCodeSmall $visible={lobbyCodeVisible}>
                            {displayLobbyId}
                        </LobbyCodeSmall>
                        {copied ? (
                            <Check size={12} style={{ color: '#22c55e' }} />
                        ) : (
                            <Link size={12} style={{ color: COLORS.TEXT_DISABLED }} />
                        )}
                    </LobbyCodeButton>
                </Flex>

                {/* Player Count */}
                <Flex $align="center" $gap="xs">
                    <Users size={14} style={{ color: COLORS.TEXT_MUTED }} />
                    <Text $size="sm" $color="secondary">
                        {playerCount}/{expectedPlayers}
                    </Text>
                </Flex>
            </Flex>

            {/* Right: Player Names & Disconnect */}
            <Flex $align="center" $gap="lg">
                {/* Connected Player Names */}
                <Flex $align="center" $gap="sm">
                    {Object.values(connectedPlayers || {}).map((player, idx) => (
                        <PlayerTag
                            key={player.id || idx}
                            $variant={
                                player.connected === false
                                    ? 'disconnected'
                                    : player.isHost
                                      ? 'host'
                                      : 'player'
                            }
                            $factionPrimary={factionColors.PRIMARY}
                            style={{ fontWeight: player.id === playerId ? '900' : '600' }}
                        >
                            {player.isHost && (
                                <Crown
                                    size={10}
                                    style={{ marginRight: '2px', verticalAlign: 'middle' }}
                                />
                            )}
                            {player.connected === false && (
                                <WifiOff
                                    size={10}
                                    style={{ marginRight: '2px', verticalAlign: 'middle' }}
                                />
                            )}
                            <span>{player.name || `Player ${(player.slot ?? 0) + 1}`}</span>
                            {/* Kick button for host (only shows for non-host players) */}
                            {isHost && !player.isHost && (
                                <KickButton
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (
                                            window.confirm(
                                                `Kick ${player.name || 'this player'}? They can rejoin with the lobby code.`,
                                            )
                                        ) {
                                            kickPlayerFromLobby(player.id)
                                        }
                                    }}
                                    title={`Kick ${player.name || 'player'}`}
                                >
                                    ✕
                                </KickButton>
                            )}
                        </PlayerTag>
                    ))}
                </Flex>

                {/* Disconnect Button */}
                <DisconnectButton onClick={onDisconnect}>
                    <WifiOff size={12} />
                    {isHost ? 'END SESSION' : 'DISCONNECT'}
                </DisconnectButton>
            </Flex>
        </StatusBar>
    )
}

// Named exports only - no default export needed
