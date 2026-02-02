import { CheckCircle, Crown, LogOut, Settings, Users, X } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { COLORS, getFactionColors, type FactionColorSet } from '../constants/theme'
import { TYPE } from '../constants/types'
import { DEFAULT_WARBONDS, WARBONDS, WARBOND_TYPE, getWarbondById } from '../constants/warbonds'
import { MASTER_DB, SUPERSTORE_ITEMS } from '../data/itemsByWarbond'
import { useMultiplayer } from '../systems/multiplayer'
import { getItemIconUrl } from '../utils/iconHelpers'
import { isDraftFilteringDebugEnabled } from '../constants/gameConfig'
import type { GameConfig, Item, Warbond } from '../types'
import {
    PageContainer,
    Container,
    Title,
    Card,
    Button,
    Input,
    Heading,
    Subheading,
    Label,
    Checkbox,
    Grid,
    Flex,
    SelectableCard,
    ModalBackdrop,
    ModalContainer,
    ModalHeader,
    ModalContent,
    ModalFooter,
    Caption,
    Text,
    WarbondTypeBadge,
} from '../styles'

// ============================================================================
// STYLED COMPONENTS (component-specific only)
// ============================================================================

const HeaderBanner = styled.div`
    background: linear-gradient(
        to right,
        rgba(100, 116, 139, 0.3),
        rgba(100, 116, 139, 0.1),
        rgba(100, 116, 139, 0.3)
    );
    padding: ${({ theme }) => theme.spacing.md};
    margin: 0 auto ${({ theme }) => theme.spacing.xl} auto;
    max-width: 500px;
`

const HeaderBannerText = styled.p`
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.textPrimary};
    text-transform: uppercase;
    letter-spacing: 0.3em;
    margin: 0;
`

const PlayerStatusCard = styled.div<{
    $ready: boolean
    $isCurrent: boolean
    $factionPrimary: string
    $connected?: boolean
}>`
    padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
    background-color: ${({ $ready }) =>
        $ready ? 'rgba(34, 197, 94, 0.2)' : ({ theme }) => theme.colors.bgMain};
    border-radius: ${({ theme }) => theme.radii.md};
    border: 2px solid
        ${({ $ready, $isCurrent, $factionPrimary, theme }) =>
            $ready ? '#22c55e' : $isCurrent ? $factionPrimary : theme.colors.cardBorder};
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};
    opacity: ${({ $connected = true }) => ($connected ? 1 : 0.5)};
`

const PlayerName = styled.span<{ $isCurrent: boolean; $ready: boolean; $factionPrimary: string }>`
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ $isCurrent, $ready, $factionPrimary }) =>
        $isCurrent ? $factionPrimary : $ready ? '#22c55e' : 'white'};
`

const NameButton = styled.button<{ $factionPrimary: string; $disabled?: boolean }>`
    width: 100%;
    padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
    background-color: ${({ theme }) => theme.colors.bgMain};
    border: 2px solid ${({ theme }) => theme.colors.cardBorder};
    border-radius: ${({ theme }) => theme.radii.md};
    font-size: ${({ theme }) => theme.fontSizes['4xl']};
    font-weight: ${({ theme }) => theme.fontWeights.black};
    color: ${({ theme }) => theme.colors.textPrimary};
    text-align: left;
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_NORMAL};
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
    transition: ${({ theme }) => theme.transitions.normal};
    opacity: ${({ $disabled }) => ($disabled ? 0.7 : 1)};

    &:hover:not(:disabled) {
        border-color: ${({ $factionPrimary }) => $factionPrimary};
        color: ${({ $factionPrimary }) => $factionPrimary};
    }
`

const DisabledOverlay = styled.div<{ $showEditButton?: boolean }>`
    opacity: ${({ $showEditButton }) => ($showEditButton ? 0.7 : 1)};
    pointer-events: ${({ $showEditButton }) => ($showEditButton ? 'none' : 'auto')};
`

const SuperstoreCard = styled(Card)`
    padding: ${({ theme }) => theme.spacing.xl};
`

const SuperstoreHeader = styled.div`
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.black};
    color: ${({ theme }) => theme.colors.accentPurple};
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_NORMAL};
    margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const WarbondImage = styled.div<{ $selected: boolean; $borderColor: string }>`
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: ${({ theme }) => theme.radii.md};
    overflow: hidden;
    border: 1px solid
        ${({ $selected, $borderColor }) => ($selected ? $borderColor : 'rgba(100, 116, 139, 0.3)')};
    background-color: rgba(0, 0, 0, 0.3);

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background-color: #000;
    }
`

const WarbondName = styled.div<{ $selected: boolean; $textColor: string }>`
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-size: ${({ theme }) => theme.fontSizes.base};
    color: ${({ $selected, $textColor, theme }) =>
        $selected ? $textColor : theme.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.typography.LETTER_SPACING_NORMAL};
    margin-bottom: ${({ theme }) => theme.spacing.xs};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

const RequiredOverlay = styled.div<{ $showEdit?: boolean }>`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: ${({ $showEdit }) => ($showEdit ? '50px' : 0)};
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: ${({ theme }) => theme.radii.md};
    pointer-events: none;
`

const RequiredText = styled.span<{ $factionPrimary: string }>`
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ $factionPrimary }) => $factionPrimary};
    text-transform: uppercase;
    letter-spacing: 0.1em;
`

const ItemCheckboxLabel = styled.label<{ $selected: boolean; $isWide?: boolean }>`
    display: flex;
    flex-direction: ${({ $isWide }) => ($isWide ? 'column' : 'row')};
    align-items: ${({ $isWide }) => ($isWide ? 'stretch' : 'center')};
    gap: ${({ theme }) => theme.spacing.sm};
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    background-color: ${({ $selected, theme }) =>
        $selected ? 'rgba(34, 197, 94, 0.1)' : theme.colors.bgMain};
    border-radius: ${({ theme }) => theme.radii.md};
    border: 1px solid
        ${({ $selected, theme }) =>
            $selected ? 'rgba(34, 197, 94, 0.3)' : theme.colors.cardBorder};
    cursor: pointer;
    transition: ${({ theme }) => theme.transitions.normal};
`

const ItemIcon = styled.img<{ $isWide?: boolean; $selected?: boolean }>`
    width: ${({ $isWide }) => ($isWide ? '100%' : '28px')};
    height: ${({ $isWide }) => ($isWide ? '100%' : '28px')};
    max-width: ${({ $isWide }) => ($isWide ? '100%' : undefined)};
    max-height: ${({ $isWide }) => ($isWide ? '100%' : undefined)};
    object-fit: contain;
    flex-shrink: 0;
    opacity: ${({ $selected }) => ($selected ? 1 : 0.5)};
`

const ItemIconContainer = styled.div`
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: ${({ theme }) => theme.radii.md};
    overflow: hidden;
`

const ItemName = styled.div<{ $selected: boolean }>`
    color: ${({ $selected, theme }) => ($selected ? 'white' : theme.colors.textMuted)};
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    line-height: 1.3;
    word-break: break-word;
`

const ItemRarity = styled.div`
    color: ${({ theme }) => theme.colors.textDisabled};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    text-transform: uppercase;
`

const CloseButton = styled.button`
    width: 36px;
    height: 36px;
    border-radius: ${({ theme }) => theme.radii.md};
    background-color: rgba(239, 68, 68, 0.2);
    color: ${({ theme }) => theme.colors.accentRed};
    border: 1px solid #7f1d1d;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
`

const SelectedCount = styled.span`
    margin-left: auto;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.base};
`

interface PlayerConfig {
    name: string
    warbonds: string[]
    includeSuperstore: boolean
    excludedItems: string[]
}

interface GameLobbyProps {
    gameConfig: GameConfig
    onStartRun: (players: PlayerConfig[]) => void
    onCancel: () => void
}

interface PlayerConfigState {
    name: string
    warbonds: string[]
    includeSuperstore: boolean
    excludedItems: string[]
}

interface ItemSelectionModalState {
    warbondId?: string
    superstore?: boolean
}

interface DebugLogEntry {
    timestamp: string
    source: string
    message: string
    data?: unknown
}

/**
 * Lobby Debug Logger for tracking player config sync issues
 */
const lobbyDebugLog = (message: string, data: unknown = null): void => {
    if (!isDraftFilteringDebugEnabled()) return

    const timestamp = new Date().toISOString()
    const logEntry: DebugLogEntry = {
        timestamp,
        source: 'GameLobby',
        message,
    }
    if (data !== null) {
        logEntry.data = data
    }

    // eslint-disable-next-line no-console
    console.log(`[LobbyDebug] ${message}`, data ? JSON.stringify(data, null, 2) : '')

    // Also store in sessionStorage for easy export
    try {
        const existing = JSON.parse(sessionStorage.getItem('lobbyDebugLogs') || '[]')
        existing.push(logEntry)
        // Keep last 500 entries
        if (existing.length > 500) existing.shift()
        sessionStorage.setItem('lobbyDebugLogs', JSON.stringify(existing))
    } catch (e) {
        // Ignore storage errors
    }
}

// Local storage key for saving player configuration
const STORAGE_KEY = 'helldrafters_player_config'

/**
 * Load saved player configuration from local storage
 */
const loadSavedConfig = (): PlayerConfigState | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            return JSON.parse(saved) as PlayerConfigState
        }
    } catch (e) {
        console.warn('Failed to load saved config:', e)
    }
    return null
}

/**
 * Save player configuration to local storage
 */
const saveConfig = (config: PlayerConfigState): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (e) {
        console.warn('Failed to save config:', e)
    }
}

/**
 * Add item(s) to the excluded items list in saved config
 * This persists the exclusion to localStorage so it won't appear in future sessions
 * @param {string|string[]} itemIds - Item ID or array of item IDs to exclude
 */
export const addExcludedItemsToSavedConfig = (itemIds: string | string[]): string[] | null => {
    try {
        const ids = Array.isArray(itemIds) ? itemIds : [itemIds]
        const config = loadSavedConfig() || {
            name: '',
            warbonds: [],
            includeSuperstore: false,
            excludedItems: [],
        }
        const currentExcluded = config.excludedItems || []

        // Add new items, avoiding duplicates
        const newExcluded = [...new Set([...currentExcluded, ...ids])]

        saveConfig({
            ...config,
            excludedItems: newExcluded,
        })

        // eslint-disable-next-line no-console
        console.log(
            '[Config] Added excluded items to saved config:',
            ids,
            'Total excluded:',
            newExcluded.length,
        )
        return newExcluded
    } catch (e) {
        console.warn('Failed to add excluded items to saved config:', e)
        return null
    }
}

/**
 * GameLobby component for configuring players before starting a run
 */
export default function GameLobby({
    gameConfig,
    onStartRun,
    onCancel,
}: GameLobbyProps): React.ReactElement {
    const factionColors = getFactionColors(gameConfig.faction)
    const {
        isMultiplayer,
        isHost,
        lobbyData,
        playerSlot,
        playerName: mpPlayerName,
        disconnect,
        updatePlayerConfig,
        setPlayerReady,
    } = useMultiplayer()

    // Load saved config or use defaults
    const savedConfig = loadSavedConfig()

    // For solo mode, initialize with 1 player
    // For multiplayer, each player only configures their own slot
    const [myConfig, setMyConfig] = useState<PlayerConfigState>({
        name: mpPlayerName || savedConfig?.name || 'Helldiver',
        warbonds: savedConfig?.warbonds || [...DEFAULT_WARBONDS],
        includeSuperstore: savedConfig?.includeSuperstore || false,
        excludedItems: savedConfig?.excludedItems || [],
    })

    const [isReady, setIsReady] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [itemSelectionModal, setItemSelectionModal] = useState<ItemSelectionModalState | null>(
        null,
    )

    // Track if we've done initial name sync to avoid loops
    const initialNameSyncDone = React.useRef(false)

    // Check if all players are ready (in multiplayer)
    const allPlayersReady = useCallback(() => {
        if (!isMultiplayer) return isReady
        if (!lobbyData?.players) return false

        const players = Object.values(lobbyData.players)
        return players.length > 0 && players.every((p) => p.ready)
    }, [isMultiplayer, lobbyData, isReady])

    // Update player name from multiplayer context on initial load only
    useEffect(() => {
        if (isMultiplayer && mpPlayerName && !initialNameSyncDone.current) {
            initialNameSyncDone.current = true
            setMyConfig((prev) => ({ ...prev, name: mpPlayerName }))
        }
    }, [isMultiplayer, mpPlayerName])

    // Save config to local storage whenever it changes
    useEffect(() => {
        saveConfig(myConfig)
    }, [myConfig])

    // Sync ready state and config to multiplayer lobby
    useEffect(() => {
        if (isMultiplayer && updatePlayerConfig) {
            lobbyDebugLog('Syncing player config to Firebase', {
                playerSlot,
                name: myConfig.name,
                warbonds: myConfig.warbonds,
                warbondsLength: myConfig.warbonds?.length,
                includeSuperstore: myConfig.includeSuperstore,
                excludedItems: myConfig.excludedItems,
                excludedItemsLength: myConfig.excludedItems?.length,
                ready: isReady,
            })

            updatePlayerConfig({
                name: myConfig.name,
                warbonds: myConfig.warbonds,
                includeSuperstore: myConfig.includeSuperstore,
                excludedItems: myConfig.excludedItems,
                ready: isReady,
            })
        }
    }, [isMultiplayer, updatePlayerConfig, myConfig, isReady, playerSlot])

    // Auto-start when all players are ready (host initiates)
    useEffect(() => {
        if (isMultiplayer && isHost && allPlayersReady() && lobbyData?.players) {
            // === DEBUG: Log raw lobby data before transformation ===
            lobbyDebugLog('MULTIPLAYER GAME START - Raw lobby data', {
                lobbyPlayers: lobbyData.players,
                playerCount: Object.keys(lobbyData.players).length,
            })

            // Build players array from lobby data
            const players = Object.values(lobbyData.players)
                .sort((a, b) => a.slot - b.slot)
                .map((p, index) => {
                    const playerConfig = {
                        name: p.name,
                        warbonds: p.warbonds || [...DEFAULT_WARBONDS],
                        includeSuperstore: p.includeSuperstore || false,
                        excludedItems: p.excludedItems || [],
                    }

                    // === DEBUG: Log each player's config transformation ===
                    lobbyDebugLog(`Player ${index + 1} config transformation`, {
                        slot: p.slot,
                        rawName: p.name,
                        rawWarbonds: p.warbonds,
                        rawWarbondsType: typeof p.warbonds,
                        rawWarbondsLength: p.warbonds?.length,
                        rawIncludeSuperstore: p.includeSuperstore,
                        rawIncludeSuperstoreType: typeof p.includeSuperstore,
                        rawExcludedItems: p.excludedItems,
                        rawExcludedItemsLength: p.excludedItems?.length,
                        // Transformed values
                        transformedWarbonds: playerConfig.warbonds,
                        transformedIncludeSuperstore: playerConfig.includeSuperstore,
                        transformedExcludedItems: playerConfig.excludedItems,
                        // Flags for potential issues
                        warbondsUsedDefault: !p.warbonds,
                        includeSuperstoreUsedDefault:
                            p.includeSuperstore === undefined || p.includeSuperstore === null,
                        excludedItemsUsedDefault: !p.excludedItems,
                    })

                    return playerConfig
                })

            // === DEBUG: Log final players array ===
            lobbyDebugLog('MULTIPLAYER GAME START - Final players array', {
                playerCount: players.length,
                players: players.map((p, i) => ({
                    index: i,
                    name: p.name,
                    warbondsCount: p.warbonds?.length,
                    includeSuperstore: p.includeSuperstore,
                    excludedItemsCount: p.excludedItems?.length,
                })),
            })

            // Small delay to ensure UI shows all ready
            setTimeout(() => {
                onStartRun(players)
            }, 500)
        }
    }, [isMultiplayer, isHost, allPlayersReady, lobbyData, onStartRun])

    const updateMyConfig = (updates: Partial<PlayerConfigState>): void => {
        setMyConfig((prev) => ({ ...prev, ...updates }))
        // When config changes, unready the player
        if (isReady) {
            setIsReady(false)
        }
    }

    const toggleWarbond = (warbondId: string): void => {
        const newWarbonds = myConfig.warbonds.includes(warbondId)
            ? myConfig.warbonds.filter((id: string) => id !== warbondId)
            : [...myConfig.warbonds, warbondId]

        updateMyConfig({ warbonds: newWarbonds })
    }

    const handleEditItems = (warbondId: string): void => {
        setItemSelectionModal({ warbondId })
    }

    const handleEditSuperstoreItems = (): void => {
        setItemSelectionModal({ superstore: true })
    }

    const handleSaveExcludedItems = (newExcluded: string[]): void => {
        // Merge with existing excluded items, removing items from the current warbond/superstore first
        const currentWarbondId = itemSelectionModal?.warbondId
        const isSuperstore = itemSelectionModal?.superstore

        // Get items that should be managed by this modal
        const managedItems = isSuperstore
            ? SUPERSTORE_ITEMS
            : MASTER_DB.filter(
                  (item) => item.warbond === currentWarbondId && item.type !== TYPE.BOOSTER,
              )
        const managedIds = new Set(managedItems.map((i) => i.id))

        // Keep excluded items from other warbonds/superstore, add new exclusions
        const otherExcluded = myConfig.excludedItems.filter((id: string) => !managedIds.has(id))
        const updatedExcluded = [...otherExcluded, ...newExcluded]

        updateMyConfig({ excludedItems: updatedExcluded })
    }

    const handleReadyToggle = (): void => {
        const newReady = !isReady
        setIsReady(newReady)

        if (isMultiplayer && setPlayerReady) {
            setPlayerReady(newReady)
        }
    }

    const handleSoloStart = () => {
        // Solo mode - just start with current config
        lobbyDebugLog('SOLO GAME START', {
            name: myConfig.name,
            warbonds: myConfig.warbonds,
            warbondsLength: myConfig.warbonds?.length,
            includeSuperstore: myConfig.includeSuperstore,
            excludedItems: myConfig.excludedItems,
            excludedItemsLength: myConfig.excludedItems?.length,
        })
        onStartRun([myConfig])
    }

    const handleExitLobby = async () => {
        if (isMultiplayer && disconnect) {
            await disconnect()
        }
        onCancel()
    }

    const standardWarbonds = Object.values(WARBONDS).filter(
        (wb) => wb.type === WARBOND_TYPE.STANDARD,
    )
    const premiumWarbonds = Object.values(WARBONDS).filter((wb) => wb.type === WARBOND_TYPE.PREMIUM)
    const legendaryWarbonds = Object.values(WARBONDS).filter(
        (wb) => wb.type === WARBOND_TYPE.LEGENDARY,
    )

    // Get all players' configs for display in multiplayer (sorted by slot)
    const allPlayers =
        isMultiplayer && lobbyData?.players
            ? Object.values(lobbyData.players).sort((a, b) => a.slot - b.slot)
            : []

    return (
        <PageContainer>
            <Container $maxWidth="xl">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Title $factionColor={factionColors.PRIMARY} $factionGlow={factionColors.GLOW}>
                        {isMultiplayer ? 'SQUAD LOADOUT' : 'LOADOUT SETUP'}
                    </Title>
                    <HeaderBanner>
                        <HeaderBannerText>
                            {isMultiplayer ? 'Configure Your Warbonds' : 'Select Your Equipment'}
                        </HeaderBannerText>
                    </HeaderBanner>
                </div>

                {/* Action Buttons - Moved to top */}
                <Flex $justify="between" $gap="lg" style={{ marginBottom: '32px' }}>
                    {/* Exit/Back Button */}
                    <Button $variant="danger" onClick={handleExitLobby}>
                        <LogOut size={18} />
                        {isMultiplayer ? 'EXIT LOBBY' : 'BACK TO MENU'}
                    </Button>

                    {/* Ready / Start Button */}
                    {isMultiplayer ? (
                        <Button
                            $variant={isReady ? 'success' : 'primary'}
                            $size="lg"
                            $factionPrimary={factionColors.PRIMARY}
                            $factionHover={factionColors.PRIMARY_HOVER}
                            $factionShadow={factionColors.SHADOW}
                            onClick={handleReadyToggle}
                        >
                            {isReady ? (
                                <>
                                    <CheckCircle size={20} />
                                    READY! (CLICK TO UNREADY)
                                </>
                            ) : (
                                <>
                                    READY UP <CheckCircle size={20} />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            $variant="primary"
                            $size="lg"
                            $factionPrimary={factionColors.PRIMARY}
                            $factionHover={factionColors.PRIMARY_HOVER}
                            $factionShadow={factionColors.SHADOW}
                            onClick={handleSoloStart}
                        >
                            START RUN <CheckCircle size={20} />
                        </Button>
                    )}
                </Flex>

                {/* Multiplayer: Show all players' status in slot order */}
                {isMultiplayer && allPlayers.length > 0 && (
                    <Card $variant="base" $padding="lg" style={{ marginBottom: '32px' }}>
                        <Flex $align="center" $gap="sm" style={{ marginBottom: '16px' }}>
                            <Users size={16} />
                            <Label style={{ margin: 0 }}>SQUAD STATUS</Label>
                        </Flex>
                        <Flex $wrap $gap="md">
                            {allPlayers.map((player) => {
                                const isCurrentPlayer = player.slot === playerSlot
                                const playerReady: boolean = isCurrentPlayer
                                    ? isReady
                                    : (player.ready ?? false)
                                const playerName = isCurrentPlayer ? myConfig.name : player.name

                                return (
                                    <PlayerStatusCard
                                        key={player.slot}
                                        $ready={playerReady}
                                        $isCurrent={isCurrentPlayer}
                                        $factionPrimary={factionColors.PRIMARY}
                                        $connected={player.connected}
                                    >
                                        {player.isHost && (
                                            <Crown
                                                size={16}
                                                style={{ color: factionColors.PRIMARY }}
                                            />
                                        )}
                                        <PlayerName
                                            $isCurrent={isCurrentPlayer}
                                            $ready={playerReady}
                                            $factionPrimary={factionColors.PRIMARY}
                                        >
                                            {playerName}
                                        </PlayerName>
                                        {isCurrentPlayer && <Caption $color="muted">(YOU)</Caption>}
                                        {playerReady && (
                                            <CheckCircle size={16} style={{ color: '#22c55e' }} />
                                        )}
                                        {!player.connected && (
                                            <Caption $color="error">(DISCONNECTED)</Caption>
                                        )}
                                    </PlayerStatusCard>
                                )
                            })}
                        </Flex>
                    </Card>
                )}

                {/* Player Configuration */}
                <Card $variant="elevated" $padding="xl" style={{ marginBottom: '32px' }}>
                    {/* Player Name */}
                    <div style={{ marginBottom: '48px' }}>
                        <Label>● HELLDIVER DESIGNATION</Label>
                        {editingName ? (
                            <Input
                                $size="lg"
                                $factionPrimary={factionColors.PRIMARY}
                                $factionShadow={factionColors.GLOW}
                                value={myConfig.name}
                                onChange={(e) => updateMyConfig({ name: e.target.value })}
                                onBlur={() => setEditingName(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                                autoFocus
                                maxLength={30}
                            />
                        ) : (
                            <NameButton
                                onClick={() => setEditingName(true)}
                                disabled={isReady}
                                $factionPrimary={factionColors.PRIMARY}
                                $disabled={isReady}
                            >
                                {myConfig.name}
                            </NameButton>
                        )}
                    </div>

                    {/* Warbond Selection */}
                    <DisabledOverlay $showEditButton={isReady}>
                        <Heading
                            $factionColor={factionColors.PRIMARY}
                            $factionGlow={factionColors.GLOW}
                            style={{ fontSize: '32px' }}
                        >
                            ▸ SELECT WARBONDS
                        </Heading>

                        {/* Standard Warbonds */}
                        <div style={{ marginBottom: '32px' }}>
                            <Subheading $withAccent $factionColor={factionColors.PRIMARY}>
                                STANDARD (FREE)
                            </Subheading>
                            <Grid $columns="auto-fill" $minWidth="280px" $gap="md">
                                {standardWarbonds.map((wb) => (
                                    <WarbondCard
                                        key={wb.id}
                                        warbond={wb}
                                        selected={myConfig.warbonds.includes(wb.id)}
                                        onToggle={() => toggleWarbond(wb.id)}
                                        onEditItems={handleEditItems}
                                        disabled={wb.id === 'helldivers_mobilize'} // Always include
                                        factionColors={factionColors}
                                    />
                                ))}
                            </Grid>
                        </div>

                        {/* Premium Warbonds */}
                        <div style={{ marginBottom: '32px' }}>
                            <Subheading $withAccent $factionColor={COLORS.ACCENT_BLUE}>
                                PREMIUM WARBONDS
                            </Subheading>
                            <Grid $columns="auto-fill" $minWidth="280px" $gap="md">
                                {premiumWarbonds.map((wb) => (
                                    <WarbondCard
                                        key={wb.id}
                                        warbond={wb}
                                        selected={myConfig.warbonds.includes(wb.id)}
                                        onToggle={() => toggleWarbond(wb.id)}
                                        onEditItems={handleEditItems}
                                        factionColors={factionColors}
                                    />
                                ))}
                            </Grid>
                        </div>

                        {/* Legendary Warbonds */}
                        <div style={{ marginBottom: '32px' }}>
                            <Subheading $withAccent $factionColor={COLORS.ACCENT_PURPLE}>
                                LEGENDARY WARBONDS
                            </Subheading>
                            <Grid $columns="auto-fill" $minWidth="280px" $gap="md">
                                {legendaryWarbonds.map((wb) => (
                                    <WarbondCard
                                        key={wb.id}
                                        warbond={wb}
                                        selected={myConfig.warbonds.includes(wb.id)}
                                        onToggle={() => toggleWarbond(wb.id)}
                                        onEditItems={handleEditItems}
                                        factionColors={factionColors}
                                    />
                                ))}
                            </Grid>
                        </div>

                        {/* Superstore Toggle */}
                        <SuperstoreCard $variant="inner" $padding="lg">
                            <Flex $align="center" $justify="between">
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        flex: 1,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <SuperstoreHeader>
                                            ▸ INCLUDE SUPERSTORE ITEMS
                                        </SuperstoreHeader>
                                        <Text $color="muted" $size="sm" style={{ margin: 0 }}>
                                            Allow items from the rotating Superstore in drafts
                                        </Text>
                                    </div>
                                    <Checkbox
                                        $size="lg"
                                        $factionPrimary={COLORS.ACCENT_PURPLE}
                                        checked={myConfig.includeSuperstore}
                                        onChange={(e) =>
                                            updateMyConfig({ includeSuperstore: e.target.checked })
                                        }
                                    />
                                </label>
                            </Flex>
                            {myConfig.includeSuperstore && (
                                <Button
                                    $variant="ghost"
                                    $size="sm"
                                    $fullWidth
                                    onClick={handleEditSuperstoreItems}
                                    style={{ marginTop: '16px' }}
                                >
                                    <Settings size={16} />
                                    Customize Superstore Items
                                </Button>
                            )}
                        </SuperstoreCard>
                    </DisabledOverlay>
                </Card>

                {/* Action Buttons - Bottom (duplicate of top buttons) */}
                <Flex $justify="between" $gap="lg" style={{ marginTop: '32px' }}>
                    {/* Exit/Back Button */}
                    <Button $variant="danger" onClick={handleExitLobby}>
                        <LogOut size={18} />
                        {isMultiplayer ? 'EXIT LOBBY' : 'BACK TO MENU'}
                    </Button>

                    {/* Ready / Start Button */}
                    {isMultiplayer ? (
                        <Button
                            $variant={isReady ? 'success' : 'primary'}
                            $size="lg"
                            $factionPrimary={factionColors.PRIMARY}
                            $factionHover={factionColors.PRIMARY_HOVER}
                            $factionShadow={factionColors.SHADOW}
                            onClick={handleReadyToggle}
                        >
                            {isReady ? (
                                <>
                                    <CheckCircle size={20} />
                                    READY! (CLICK TO UNREADY)
                                </>
                            ) : (
                                <>
                                    READY UP <CheckCircle size={20} />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            $variant="primary"
                            $size="lg"
                            $factionPrimary={factionColors.PRIMARY}
                            $factionHover={factionColors.PRIMARY_HOVER}
                            $factionShadow={factionColors.SHADOW}
                            onClick={handleSoloStart}
                        >
                            START RUN <CheckCircle size={20} />
                        </Button>
                    )}
                </Flex>

                {/* Item Selection Modal */}
                {itemSelectionModal && (
                    <ItemSelectionModal
                        warbondId={itemSelectionModal.warbondId ?? null}
                        isSuperstore={itemSelectionModal.superstore ?? false}
                        excludedItems={myConfig.excludedItems}
                        onSave={handleSaveExcludedItems}
                        onClose={() => setItemSelectionModal(null)}
                        factionColors={factionColors}
                    />
                )}
            </Container>
        </PageContainer>
    )
}

interface WarbondCardProps {
    warbond: Warbond
    selected: boolean
    onToggle: () => void
    onEditItems: (warbondId: string) => void
    disabled?: boolean
    factionColors: FactionColorSet
}

// Warbond selection card component
function WarbondCard({
    warbond,
    selected,
    onToggle,
    onEditItems,
    disabled = false,
    factionColors,
}: WarbondCardProps): React.ReactElement {
    const getBorderColor = (): string => {
        if (disabled) return COLORS.CARD_BORDER
        if (selected) {
            if (warbond.type === WARBOND_TYPE.LEGENDARY) return COLORS.ACCENT_PURPLE
            if (warbond.type === WARBOND_TYPE.PREMIUM) return COLORS.ACCENT_BLUE
            return factionColors.PRIMARY
        }
        return COLORS.CARD_BORDER
    }

    const getGlowColor = (): string => {
        if (warbond.type === WARBOND_TYPE.LEGENDARY) return `0 0 20px ${COLORS.ACCENT_PURPLE}40`
        if (warbond.type === WARBOND_TYPE.PREMIUM) return `0 0 20px ${COLORS.ACCENT_BLUE}40`
        return factionColors.GLOW
    }

    const getTextColor = (): string => {
        if (warbond.type === WARBOND_TYPE.LEGENDARY) return '#c084fc'
        if (warbond.type === WARBOND_TYPE.PREMIUM) return '#60a5fa'
        return factionColors.PRIMARY
    }

    const handleCardClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        // Don't toggle if clicking on the edit button
        if ((e.target as HTMLElement).closest('[data-edit-button]')) return
        if (!disabled) {
            onToggle()
        }
    }

    return (
        <SelectableCard
            $selected={selected}
            $factionPrimary={getBorderColor()}
            $factionShadow={selected ? getGlowColor() : undefined}
            $padding="md"
            onClick={handleCardClick}
            style={{
                position: 'relative',
                textAlign: 'left',
                cursor: disabled ? 'default' : 'pointer',
            }}
        >
            <Flex $direction="column" $gap="md">
                {/* Warbond Info */}
                <Flex $align="center" $justify="between" $gap="md">
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <WarbondName $selected={selected} $textColor={getTextColor()}>
                            {warbond.name}
                        </WarbondName>
                        <WarbondTypeBadge $type={warbond.type} />
                    </div>

                    {/* Checkmark */}
                    {selected && (
                        <CheckCircle style={{ color: getTextColor(), flexShrink: 0 }} size={20} />
                    )}
                </Flex>

                {/* Warbond Image - 16:9 aspect ratio */}
                {warbond.image && (
                    <WarbondImage $selected={selected} $borderColor={getBorderColor()}>
                        <img
                            src={warbond.image}
                            alt={warbond.name}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                if (target.parentElement) {
                                    target.parentElement.innerHTML =
                                        '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 12px; font-weight: bold;">IMAGE UNAVAILABLE</div>'
                                }
                            }}
                        />
                    </WarbondImage>
                )}

                {/* Edit Items Button - only show when selected */}
                {selected && onEditItems && (
                    <Button
                        data-edit-button
                        $variant="ghost"
                        $size="sm"
                        $fullWidth
                        onClick={(e) => {
                            e.stopPropagation()
                            onEditItems(warbond.id)
                        }}
                        style={{ position: 'relative', zIndex: 10 }}
                    >
                        <Settings size={14} />
                        Customize Items
                    </Button>
                )}
            </Flex>
            {disabled && (
                <RequiredOverlay $showEdit={selected}>
                    <RequiredText $factionPrimary={factionColors.PRIMARY}>● REQUIRED</RequiredText>
                </RequiredOverlay>
            )}
        </SelectableCard>
    )
}

interface ItemSelectionModalProps {
    warbondId: string | null
    isSuperstore: boolean
    excludedItems: string[]
    onSave: (excludedItems: string[]) => void
    onClose: () => void
    factionColors: FactionColorSet
}

// Item selection modal component
function ItemSelectionModal({
    warbondId,
    isSuperstore,
    excludedItems,
    onSave,
    onClose,
    factionColors,
}: ItemSelectionModalProps): React.ReactElement {
    const [localExcluded, setLocalExcluded] = useState<Set<string>>(new Set(excludedItems))

    // Get items for this warbond or superstore
    const items = isSuperstore
        ? SUPERSTORE_ITEMS
        : MASTER_DB.filter((item) => item.warbond === warbondId && item.type !== TYPE.BOOSTER)

    const warbondInfo = warbondId ? getWarbondById(warbondId) : null
    const title = isSuperstore ? 'Superstore Items' : warbondInfo?.name || 'Items'

    // Group items by type
    const itemsByType: Record<string, Item[]> = items.reduce(
        (acc: Record<string, Item[]>, item) => {
            if (!acc[item.type]) acc[item.type] = []
            acc[item.type].push(item)
            return acc
        },
        {},
    )

    const toggleItem = (itemId: string): void => {
        setLocalExcluded((prev) => {
            const next = new Set(prev)
            if (next.has(itemId)) {
                next.delete(itemId)
            } else {
                next.add(itemId)
            }
            return next
        })
    }

    const selectAll = () => {
        setLocalExcluded(new Set())
    }

    const deselectAll = () => {
        setLocalExcluded(new Set(items.map((i) => i.id)))
    }

    const handleSave = () => {
        onSave(Array.from(localExcluded))
        onClose()
    }

    const includedCount = items.length - localExcluded.size

    return (
        <ModalBackdrop>
            <ModalContainer $size="lg" $factionPrimary={factionColors.PRIMARY}>
                {/* Header */}
                <ModalHeader $factionPrimary={factionColors.PRIMARY}>
                    <div>
                        <Heading
                            $factionColor={factionColors.PRIMARY}
                            style={{ fontSize: '24px', margin: 0 }}
                        >
                            {title}
                        </Heading>
                        <Text $color="muted" $size="sm" style={{ margin: '8px 0 0 0' }}>
                            Select items you own. Unchecked items won't appear in drafts.
                        </Text>
                    </div>
                    <CloseButton onClick={onClose}>
                        <X size={20} />
                    </CloseButton>
                </ModalHeader>

                {/* Quick actions */}
                <Flex
                    $align="center"
                    $gap="md"
                    style={{
                        padding: '16px 24px',
                        borderBottom: `1px solid ${COLORS.CARD_BORDER}`,
                    }}
                >
                    <Button $variant="success" $size="sm" onClick={selectAll}>
                        Select All
                    </Button>
                    <Button $variant="danger" $size="sm" onClick={deselectAll}>
                        Deselect All
                    </Button>
                    <SelectedCount>
                        {includedCount} / {items.length} items selected
                    </SelectedCount>
                </Flex>

                {/* Items list */}
                <ModalContent style={{ padding: '24px' }}>
                    {Object.entries(itemsByType).map(([type, typeItems]) => (
                        <div key={type} style={{ marginBottom: '24px' }}>
                            <Subheading $withAccent $factionColor={factionColors.PRIMARY}>
                                {type}
                            </Subheading>
                            <Grid $columns="auto-fill" $minWidth="200px" $gap="sm">
                                {typeItems.map((item) => {
                                    const isIncluded = !localExcluded.has(item.id)
                                    const iconUrl = getItemIconUrl(item)
                                    const isWideAspect =
                                        item.type === TYPE.PRIMARY || item.type === TYPE.SECONDARY

                                    return (
                                        <ItemCheckboxLabel
                                            key={item.id}
                                            $selected={isIncluded}
                                            $isWide={isWideAspect}
                                        >
                                            {/* Top row: checkbox and text */}
                                            <Flex
                                                $align="center"
                                                $gap="sm"
                                                style={{ flex: isWideAspect ? undefined : 1 }}
                                            >
                                                <Checkbox
                                                    $size="md"
                                                    $factionPrimary="#22c55e"
                                                    checked={isIncluded}
                                                    onChange={() => toggleItem(item.id)}
                                                />
                                                {/* Show square icons inline for non-weapons */}
                                                {iconUrl && !isWideAspect && (
                                                    <ItemIcon
                                                        src={iconUrl}
                                                        alt=""
                                                        $selected={isIncluded}
                                                        onError={(e) => {
                                                            ;(
                                                                e.target as HTMLImageElement
                                                            ).style.display = 'none'
                                                        }}
                                                    />
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <ItemName $selected={isIncluded}>
                                                        {item.name}
                                                    </ItemName>
                                                    <ItemRarity>{item.rarity}</ItemRarity>
                                                </div>
                                            </Flex>
                                            {/* Weapon images below text for wide aspect ratio */}
                                            {iconUrl && isWideAspect && (
                                                <ItemIconContainer>
                                                    <ItemIcon
                                                        src={iconUrl}
                                                        alt=""
                                                        $isWide
                                                        $selected={isIncluded}
                                                        onError={(e) => {
                                                            const target =
                                                                e.target as HTMLImageElement
                                                            if (target.parentElement) {
                                                                target.parentElement.style.display =
                                                                    'none'
                                                            }
                                                        }}
                                                    />
                                                </ItemIconContainer>
                                            )}
                                        </ItemCheckboxLabel>
                                    )
                                })}
                            </Grid>
                        </div>
                    ))}
                </ModalContent>

                {/* Footer */}
                <ModalFooter>
                    <Button $variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        $variant="primary"
                        $factionPrimary={factionColors.PRIMARY}
                        onClick={handleSave}
                    >
                        Save Selection
                    </Button>
                </ModalFooter>
            </ModalContainer>
        </ModalBackdrop>
    )
}
