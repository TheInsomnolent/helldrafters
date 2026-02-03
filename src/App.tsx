import { CheckCircle, RefreshCw, XCircle } from 'lucide-react'
import React, { useEffect, useReducer } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { theme, GlobalStyles, Button, Caption, SPACING } from './styles'
import CardLibrary from './components/CardLibrary'
import ContributorsModal from './components/ContributorsModal'
import EventDisplay from './components/EventDisplay'
import ExplainerModal from './components/ExplainerModal'
import GameFooter from './components/GameFooter'
import GameHeader from './components/GameHeader'
import ExportButton from './components/ExportButton'
import { ItemCard, isArmorCombo, isItem } from './components/ItemCard'
import KickedScreen from './components/KickedScreen'
import LoadingScreen from './components/LoadingScreen'
import MenuScreen from './components/MenuScreen'
import RemoveCardConfirmModal from './components/RemoveCardConfirmModal'
import SacrificeConfirmModal from './components/SacrificeConfirmModal'
import SoloConfigScreen from './components/SoloConfigScreen'
import StratagemReplacementModal from './components/StratagemReplacementModal'
import GameLobby, { addExcludedItemsToSavedConfig } from './components/GameLobby'
import LoadoutDisplay from './components/LoadoutDisplay'
import {
    JoinGameScreen,
    MultiplayerModeSelect,
    MultiplayerStatusBar,
    MultiplayerWaitingRoom,
} from './components/MultiplayerLobby'
import RunHistoryModal from './components/RunHistoryModal'
import { AnalyticsDashboard } from './components/analytics'
import {
    PageWrapper,
    ContentWrapper,
    CenteredContent,
    SectionHeader,
    PhaseSubtitle,
    PhaseTitle,
    TitleSeparator,
    PhaseDescription,
    SectionBox,
    AlertBox,
    AlertTitle,
    AlertSubtitle,
    WaitingMessage,
    WaitingText,
    ItemGrid,
    LoadoutOverview,
    LoadoutLabel,
    LoadoutItems,
    LoadoutSlot,
    LoadoutSlotLabel,
    LoadoutSlotValue,
    ButtonRow,
    ActionButton,
    SkipButton,
    HintText,
    MonoText,
    SacrificeHeader,
    SacrificePenaltyBadge,
    SacrificePenaltyTitle,
    SacrificePenaltySubtext,
    SacrificeCard,
    SacrificeCardSlot,
    SacrificeCardName,
    SacrificeCardRarity,
    SacrificeCardHint,
    EmptyBox,
    EmptyIcon,
    EmptyTitle,
    EmptyDescription,
    FormSectionLabel,
    DifficultyButton,
    PlayerTabs,
    PlayerTab,
    LoadoutField,
    LoadoutFieldLabel,
    LoadoutSelect,
    StratagemGrid,
    StratagemSelect,
    CustomSetupActions,
    ExportRow,
    DifficultyGrid,
    DifficultyLabel,
    SectionBoxSpaced,
    CustomSetupPhaseTitle,
    LoadoutConfigTitle,
    LoadoutFieldSpaced,
    LoadoutSelectColored,
    StratagemGap,
    RequisitionDisplay,
    SacrificeWaitSection,
    SacrificeWaitText,
    FlexButton,
    StartOperationButton,
    EventPageWrapper,
    DashboardMain,
    PlayerRosterGrid,
    ControlsSection,
    ObjectiveCard,
    ObjectiveTitle,
    ObjectiveText,
    MissionStatusCard,
    MissionStatusTitle,
    OperationStatus,
    RatingSection,
    RatingLabel,
    StarRatingGrid,
    StarRatingButton,
    StarIcon,
    RatingHint,
    SamplesSection,
    SamplesGrid,
    SampleColumn,
    SampleHeader,
    SampleIcon,
    SampleLabel,
    SampleInput,
    SampleHint,
    SamplesNote,
    ExtractionSection,
    ExtractionList,
    ExtractionLabel,
    ExtractionCheckbox,
    ExtractionContent,
    ExtractionName,
    ExtractionPenalty,
    ExtractionNote,
    MissionButtonRow,
    MissionFailButton,
    MissionSuccessButton,
    MissionReportHint,
    WaitingForHostBox,
    WaitingForHostText,
    WaitingForHostSubtext,
    DebugSection,
    DebugHeader,
    DebugTitle,
    ResetSeenEventsButton,
    DebugGrid,
    DebugButton,
    DebugButtonTitle,
    DebugButtonSubtext,
    DebugHint,
} from './styles/App.styles'
import { useGamePersistence } from './hooks'
import {
    DIFFICULTY_CONFIG,
    getMissionsForDifficulty,
    STARTING_LOADOUT,
} from './constants/gameConfig'
import { Subfaction } from './constants/balancingConfig'
import { getFactionColors } from './constants/theme'
import { TYPE } from './constants/types'
import { DEFAULT_WARBONDS } from './constants/warbonds'
import { MASTER_DB } from './data/itemsByWarbond'
import * as actions from './state/actions'
import * as types from './state/actionTypes'
import { gameReducer, initialState } from './state/gameReducer'
import * as runAnalytics from './state/analyticsStore'
import {
    applyGainBoosterWithSelection,
    canAffordChoice,
    formatOutcome,
    formatOutcomes,
    needsPlayerChoice,
    processAllOutcomes,
} from './systems/events/eventProcessor'
import {
    EVENT_TYPES,
    EVENTS,
    selectRandomEvent,
    type EventChoice,
    type EventOutcome,
} from './systems/events/events'
import { initializeAnalytics, MultiplayerProvider, useMultiplayer } from './systems/multiplayer'
import { saveRunToHistory } from './systems/persistence/saveManager'
import {
    trackDraftSelection,
    trackEventChoice,
    trackGameEnd,
    trackGameStart,
    trackMissionComplete,
    trackMultiplayerAction,
    trackPageView,
} from './utils/analytics'
import { generateDraftHand, getDraftHandSize, getWeightedPool } from './utils/draftHelpers'
import { ArmorCombo, getArmorComboDisplayName, getItemById } from './utils/itemHelpers'
import { areStratagemSlotsFull, getFirstEmptyStratagemSlot } from './utils/loadoutHelpers'
import type {
    DraftState,
    DraftHandItem,
    Item,
    ItemType,
    Faction,
    SlotType,
    Player,
    Loadout,
} from './types'

// Helper to create a default DraftState with all required properties
const createDraftState = (overrides: Partial<DraftState> = {}): DraftState => ({
    activePlayerIndex: 0,
    roundCards: [],
    isRerolling: false,
    pendingStratagem: null,
    extraDraftRound: 0,
    draftOrder: [],
    isRetrospective: false,
    retrospectivePlayerIndex: null,
    ...overrides,
})

// Extend Window interface to include our custom property
declare global {
    interface Window {
        __boosterOutcome?: unknown
    }
}

// Helper to create a Player with all required fields and sensible defaults
const createPlayer = (
    overrides: Partial<Player> & { id: string; name: string; loadout: Loadout },
): Player => ({
    inventory: [],
    lockedSlots: [],
    disabledWarbonds: [],
    superstoreItems: [],
    warbonds: [...DEFAULT_WARBONDS],
    includeSuperstore: false,
    extracted: true,
    ...overrides,
})

function HelldiversRoguelikeApp() {
    // --- STATE (Using useReducer for complex state management) ---
    const [state, dispatch] = useReducer(gameReducer, initialState)

    // Multiplayer context
    const multiplayer = useMultiplayer()
    const {
        isMultiplayer,
        isHost,
        hostGame,
        joinGame,
        startMultiplayerGame,
        syncState,
        disconnect,
        setDispatch,
        hostDisconnected,
        clearHostDisconnected,
        wasKicked,
        clearWasKicked,
        clientDisconnected,
        clearClientDisconnected,
        playerSlot,
        sendAction,
        setActionHandler,
        lobbyData,
        firebaseReady,
    } = multiplayer

    // Register dispatch with multiplayer context
    useEffect(() => {
        // Cast dispatch to match ClientAction interface - GameAction is compatible
        setDispatch(
            dispatch as unknown as (action: {
                type: string
                payload?: Record<string, unknown>
            }) => void,
        )
    }, [dispatch, setDispatch])

    // Handle host disconnect - return all clients to main menu
    useEffect(() => {
        if (hostDisconnected && !isHost) {
            // Don't override if player was kicked - let them see the kicked screen
            if (!wasKicked) {
                // Host disconnected/closed the lobby - return to main menu
                dispatch(actions.setPhase('MENU'))
                setMultiplayerMode(null)
            }
            clearHostDisconnected()
        } else if (hostDisconnected && isHost) {
            // This shouldn't happen (host set their own flag), but clear it anyway
            clearHostDisconnected()
        }
    }, [hostDisconnected, isHost, wasKicked, clearHostDisconnected])

    // Handle client intentional disconnect - return to menu
    useEffect(() => {
        if (clientDisconnected) {
            // Don't override if player was kicked - let them see the kicked screen
            if (!wasKicked) {
                dispatch(actions.setPhase('MENU'))
                setMultiplayerMode(null)
            }
            clearClientDisconnected()
        }
    }, [clientDisconnected, wasKicked, clearClientDisconnected])

    // Handle being kicked - show kicked screen
    useEffect(() => {
        if (wasKicked) {
            dispatch(actions.setPhase('KICKED'))
            setMultiplayerMode(null)
        }
    }, [wasKicked])

    // Destructure commonly used state values for easier access
    const {
        phase,
        gameConfig,
        currentDiff,
        currentMission,
        requisition,
        burnedCards,
        customSetup,
        players,
        draftState,
        draftHistory,
        sacrificeState,
        eventsEnabled,
        currentEvent,
        eventPlayerChoice,
        eventSourcePlayerSelection,
        eventStratagemSelection,
        eventTargetPlayerSelection,
        eventTargetStratagemSelection,
        eventBoosterDraft,
        eventBoosterSelection,
        eventSpecialDraft,
        eventSpecialDraftType,
        eventSpecialDraftSelections,
        eventSelectedChoice,
        pendingFaction,
        pendingSubfactionSelection,
        seenEvents,
    } = state

    // Get faction-specific colors
    const factionColors = getFactionColors(gameConfig.faction)

    // UI-only state (not part of game state)
    const [selectedPlayer, setSelectedPlayer] = React.useState(0) // For custom setup phase
    const [multiplayerMode, setMultiplayerMode] = React.useState<string | null>(null) // null, 'select', 'host', 'join', 'waiting'
    const [initialLobbyCode, setInitialLobbyCode] = React.useState<string | null>(null) // For auto-populating join from URL

    // Check for ?join=<lobbyId> URL parameter on mount
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const joinCode = urlParams.get('join')
        if (joinCode && firebaseReady) {
            // Auto-navigate to join screen with the lobby code
            setInitialLobbyCode(joinCode)
            setMultiplayerMode('join')
            // Clean up the URL without reloading
            const newUrl = window.location.pathname + window.location.hash
            window.history.replaceState({}, '', newUrl)
        }
    }, [firebaseReady])
    const [showExplainer, setShowExplainer] = React.useState(false) // For explainer modal
    const [showPatchNotes, setShowPatchNotes] = React.useState(false) // For patch notes modal
    const [showGenAIDisclosure, setShowGenAIDisclosure] = React.useState(false) // For Gen AI disclosure modal
    const [showContributors, setShowContributors] = React.useState(false) // For contributors modal
    const [showRemoveCardConfirm, setShowRemoveCardConfirm] = React.useState(false) // For remove card confirmation modal
    const [showSacrificeConfirm, setShowSacrificeConfirm] = React.useState(false) // For sacrifice confirmation modal
    const [pendingSacrificeItem, setPendingSacrificeItem] = React.useState<
        (Item & { slot: string }) | null
    >(null) // Item pending sacrifice
    const [pendingCardRemoval, setPendingCardRemoval] = React.useState<DraftHandItem | null>(null) // Card pending removal
    const [missionSuccessDebouncing, setMissionSuccessDebouncing] = React.useState(false) // Debounce for mission success button
    const [gameStartTime, setGameStartTime] = React.useState<number | null>(null) // Track game start time for analytics

    // Analytics state
    const [showRunHistory, setShowRunHistory] = React.useState(false) // For run history modal
    // Note: runAnalyticsData is now stored in game state (state.runAnalyticsData) so it syncs to clients

    // Game persistence (save/load functionality)
    const { exportGameState, importGameState, fileInputRef } = useGamePersistence({
        state,
        dispatch,
        firebaseReady,
        hostGame,
        startMultiplayerGame,
        syncState,
        setSelectedPlayer,
        setGameStartTime,
        loadGameStateAction: actions.loadGameState,
    })

    // Track app initialization - initialize analytics first, then track page view
    useEffect(() => {
        const initAndTrack = async () => {
            // Initialize analytics first (this ensures Firebase is ready before tracking)
            await initializeAnalytics()
            // Now track the page view
            trackPageView('Helldrafters Main Menu')
        }
        initAndTrack()
    }, [])

    // Sync state to clients when host and in multiplayer mode
    useEffect(() => {
        if (isMultiplayer && isHost && phase !== 'MENU') {
            syncState(state)
        }
    }, [isMultiplayer, isHost, state, phase, syncState])

    // Handle new player joining mid-game (host only)
    // When a new player joins into a slot that doesn't have a loadout, create one for them
    useEffect(() => {
        if (!isMultiplayer || !isHost || !lobbyData?.players) return

        // Only handle mid-game joins (not during lobby or menu)
        if (phase === 'MENU' || phase === 'LOBBY' || !players || players.length === 0) return

        // Don't interrupt an ongoing draft (including retrospective drafts)
        if (phase === 'DRAFT') return

        // Get currently connected players from lobby
        const lobbyPlayers = Object.values(lobbyData.players).filter(
            (p: { connected?: boolean }) => p.connected !== false,
        )

        // Check if any connected lobby player doesn't have a corresponding game player
        const newPlayersNeeded = lobbyPlayers.filter((lobbyPlayer: { slot: number }) => {
            const existingGamePlayer = players.find((p) => p.id === String(lobbyPlayer.slot + 1))
            return !existingGamePlayer
        })

        if (newPlayersNeeded.length > 0) {
            // Add new players with default loadouts
            const updatedPlayers: Player[] = [...players]

            newPlayersNeeded.forEach(
                (lobbyPlayer: {
                    slot: number
                    name?: string
                    warbonds?: string[]
                    includeSuperstore?: boolean
                    excludedItems?: string[]
                }) => {
                    // IMPORTANT: Use warbond config from lobby data if available, otherwise use defaults
                    // This ensures late-joiners still have proper warbond filtering
                    // If lobbyPlayer.warbonds is undefined/null, use DEFAULT_WARBONDS (not empty array)
                    // Empty array would skip filtering entirely, causing all items to appear
                    const playerWarbonds =
                        lobbyPlayer.warbonds && lobbyPlayer.warbonds.length > 0
                            ? lobbyPlayer.warbonds
                            : [...DEFAULT_WARBONDS]
                    const playerIncludeSuperstore = lobbyPlayer.includeSuperstore || false
                    const playerExcludedItems = lobbyPlayer.excludedItems || []

                    // Calculate number of catch-up drafts based on current difficulty
                    // Late joiners need (currentDiff - 1) catch-up drafts to match other players
                    // This is deterministic based on current game state, not historical draftHistory
                    const catchUpDraftsNeeded = currentDiff > 1 ? currentDiff - 1 : 0

                    const newPlayer = createPlayer({
                        id: String(lobbyPlayer.slot + 1),
                        name: lobbyPlayer.name || `Helldiver ${lobbyPlayer.slot + 1}`,
                        loadout: {
                            primary: STARTING_LOADOUT.primary,
                            secondary: STARTING_LOADOUT.secondary,
                            grenade: STARTING_LOADOUT.grenade,
                            armor: STARTING_LOADOUT.armor,
                            booster: STARTING_LOADOUT.booster,
                            stratagems: [...STARTING_LOADOUT.stratagems],
                        },
                        inventory: Object.values(STARTING_LOADOUT)
                            .flat()
                            .filter((id): id is string => id !== null),
                        warbonds: playerWarbonds,
                        includeSuperstore: playerIncludeSuperstore,
                        excludedItems: playerExcludedItems,
                        weaponRestricted: false,
                        needsRetrospectiveDraft: catchUpDraftsNeeded > 0, // Flag if they need to catch up
                        catchUpDraftsRemaining: catchUpDraftsNeeded, // Track how many catch-up drafts needed
                    })
                    updatedPlayers.push(newPlayer)

                    // Register late-joining player in analytics so they appear in end-of-run stats
                    runAnalytics.registerLatePlayer(newPlayer)
                },
            )

            // Sort by player id to maintain order
            updatedPlayers.sort((a, b) => Number(a.id) - Number(b.id))

            dispatch(actions.setPlayers(updatedPlayers))
            dispatch(actions.updateGameConfig({ playerCount: updatedPlayers.length }))

            // If late-joiner needs catch-up drafts, start retrospective draft for the first new player
            if (phase === 'DASHBOARD') {
                const newPlayerIndex = updatedPlayers.findIndex(
                    (p) => p.needsRetrospectiveDraft && (p.catchUpDraftsRemaining ?? 0) > 0,
                )
                if (newPlayerIndex !== -1) {
                    // Start retrospective draft phase
                    const retroPlayer = updatedPlayers[newPlayerIndex]

                    // Use current game config for retrospective drafts
                    // The difficulty progresses: 1, 2, 3, ... based on how many they've completed
                    const retrospectiveDraftNumber =
                        (retroPlayer.retrospectiveDraftsCompleted || 0) + 1
                    const retroDifficulty = retrospectiveDraftNumber // Difficulty 1 for first catch-up, 2 for second, etc.
                    const retroStarRating = Math.min(Math.ceil(retroDifficulty / 2), 5) // Approximate star rating

                    const handSize = getDraftHandSize(retroStarRating)
                    const playerLockedSlots = retroPlayer.lockedSlots || []

                    const retroHand = generateDraftHand(
                        retroPlayer,
                        retroDifficulty,
                        gameConfig,
                        burnedCards,
                        updatedPlayers,
                        (cardId) => dispatch(actions.addBurnedCard(cardId)),
                        handSize,
                        playerLockedSlots,
                    )

                    // Initialize retrospective draft progress
                    const initPlayers = [...updatedPlayers]
                    initPlayers[newPlayerIndex] = {
                        ...retroPlayer,
                        retrospectiveDraftsCompleted: 0,
                    }
                    dispatch(actions.setPlayers(initPlayers))

                    dispatch(actions.startRetrospectiveDraft(newPlayerIndex))
                    dispatch(
                        actions.setDraftState({
                            activePlayerIndex: newPlayerIndex,
                            roundCards: retroHand,
                            isRerolling: false,
                            pendingStratagem: null,
                            extraDraftRound: 0,
                            draftOrder: [newPlayerIndex],
                            isRetrospective: true,
                            retrospectivePlayerIndex: newPlayerIndex,
                        }),
                    )
                    dispatch(actions.setPhase('DRAFT'))
                }
            }
            // Note: State will be synced to clients automatically via the existing syncState effect
        }
    }, [
        isMultiplayer,
        isHost,
        lobbyData,
        phase,
        players,
        dispatch,
        draftHistory,
        burnedCards,
        gameConfig,
        currentDiff,
    ])

    // Save game state to localStorage whenever it changes (for crash recovery)
    useEffect(() => {
        if (phase !== 'MENU') {
            try {
                localStorage.setItem('helldraftersGameState', JSON.stringify(state))
            } catch (error) {
                console.error('Failed to save game state:', error)
            }
        } else {
            // Clear saved state when returning to menu
            localStorage.removeItem('helldraftersGameState')
        }
    }, [state, phase])

    // Scroll to top whenever phase changes (with smooth behavior for accessibility)
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [phase])

    // Helper to calculate max stars based on difficulty
    // D1-D2: max 2 stars, D3-D4: max 3 stars, D5-D6: max 4 stars, D7+: max 5 stars
    const getMaxStarsForDifficulty = (diff: number) => {
        if (diff <= 2) return 2
        if (diff <= 4) return 3
        if (diff <= 6) return 4
        return 5
    }

    // Default star rating to max allowed when entering DASHBOARD phase
    useEffect(() => {
        if (phase === 'DASHBOARD') {
            const maxStars = getMaxStarsForDifficulty(currentDiff)
            dispatch(actions.updateGameConfig({ starRating: maxStars }))
        }
    }, [phase, currentDiff, dispatch])

    // --- INITIALIZATION ---

    const startGame = () => {
        // Solo mode: set player count to 1 and go to config
        dispatch(actions.updateGameConfig({ playerCount: 1 }))
        dispatch(actions.setPhase('SOLO_CONFIG'))
        trackMultiplayerAction('start_solo_mode')
    }

    // Type for player configuration from lobby - matches GameLobby's PlayerConfig
    type LobbyPlayerConfig = {
        name: string
        warbonds: string[]
        includeSuperstore: boolean
        excludedItems: string[]
    }

    const startGameFromLobby = (lobbyPlayers: LobbyPlayerConfig[]) => {
        if (gameConfig.customStart) {
            // Go to custom setup screen with configured players
            const initialLoadouts = Array.from(
                { length: gameConfig.playerCount },
                (): Loadout => ({
                    primary: STARTING_LOADOUT.primary,
                    secondary: STARTING_LOADOUT.secondary,
                    grenade: STARTING_LOADOUT.grenade,
                    armor: STARTING_LOADOUT.armor,
                    booster: STARTING_LOADOUT.booster,
                    stratagems: [...STARTING_LOADOUT.stratagems],
                }),
            )
            dispatch(actions.setCustomSetup({ difficulty: 1, loadouts: initialLoadouts }))

            // Create players with warbond selections
            const newPlayers = lobbyPlayers.map((lp, i) =>
                createPlayer({
                    id: String(i + 1),
                    name: lp.name,
                    loadout: initialLoadouts[i],
                    inventory: Object.values(initialLoadouts[i])
                        .flat()
                        .filter((id): id is string => id !== null),
                    warbonds: lp.warbonds,
                    includeSuperstore: lp.includeSuperstore,
                    excludedItems: lp.excludedItems,
                    weaponRestricted: false,
                }),
            )
            dispatch(actions.setPlayers(newPlayers))
            dispatch(actions.setPhase('CUSTOM_SETUP'))
        } else {
            // Normal start with configured players
            const newPlayers = lobbyPlayers.map((lp, i) =>
                createPlayer({
                    id: String(i + 1),
                    name: lp.name,
                    loadout: {
                        primary: STARTING_LOADOUT.primary,
                        secondary: STARTING_LOADOUT.secondary,
                        grenade: STARTING_LOADOUT.grenade,
                        armor: STARTING_LOADOUT.armor,
                        booster: STARTING_LOADOUT.booster,
                        stratagems: [...STARTING_LOADOUT.stratagems],
                    },
                    inventory: Object.values(STARTING_LOADOUT)
                        .flat()
                        .filter((id): id is string => id !== null),
                    warbonds: lp.warbonds,
                    includeSuperstore: lp.includeSuperstore,
                    excludedItems: lp.excludedItems || [],
                    weaponRestricted: false,
                }),
            )
            dispatch(actions.setPlayers(newPlayers))
            dispatch(actions.setDifficulty(1))
            dispatch(actions.setRequisition(0)) // Start with 0, earn 1 per mission
            dispatch(actions.setBurnedCards([]))
            dispatch(actions.setDraftHistory([])) // Reset draft history for new game
            dispatch(actions.setPhase('DASHBOARD'))
            setGameStartTime(Date.now())
            trackGameStart(isMultiplayer ? 'multiplayer' : 'solo', 1)

            // Initialize run analytics
            runAnalytics.initializeAnalytics(gameConfig, newPlayers)
            dispatch(actions.setRunAnalyticsData(null))
        }
    }

    const startGameFromCustomSetup = () => {
        const newPlayers = customSetup.loadouts.map((loadout: Loadout, i: number) =>
            createPlayer({
                id: String(i + 1),
                name: `Helldiver ${i + 1}`,
                loadout: { ...loadout },
                inventory: Object.values(loadout)
                    .flat()
                    .filter((id): id is string => id !== null),
                weaponRestricted: false,
            }),
        )
        dispatch(actions.setPlayers(newPlayers))
        dispatch(actions.setDifficulty(customSetup.difficulty))
        dispatch(actions.setRequisition(0))
        setGameStartTime(Date.now())
        trackGameStart(isMultiplayer ? 'multiplayer' : 'solo', customSetup.difficulty)
        dispatch(actions.setBurnedCards([]))
        dispatch(actions.setPhase('DASHBOARD'))

        // Initialize run analytics
        runAnalytics.initializeAnalytics(gameConfig, newPlayers)
        dispatch(actions.setRunAnalyticsData(null))
    }

    // --- CORE LOGIC: THE DRAFT DIRECTOR ---

    // Helper to check if a player at a given index is connected in multiplayer
    // Returns false if:
    // 1. Player is in lobby but connected === false (disconnected)
    // 2. Player is NOT in lobby at all (kicked or never joined)
    const isPlayerConnected = (playerIdx: number): boolean => {
        if (!isMultiplayer) return true
        if (!lobbyData?.players) return true
        const lobbyPlayer = Object.values(lobbyData.players).find(
            (p: { slot: number }) => p.slot === playerIdx,
        )
        // If no lobby player found for this slot, they're not connected (kicked)
        if (!lobbyPlayer) return false
        // If lobby player exists, check their connected status
        return (lobbyPlayer as { connected?: boolean }).connected !== false
    }

    // Get indices of connected players for draft order
    const getConnectedPlayerIndices = (): number[] => {
        if (!isMultiplayer) {
            return Array.from({ length: gameConfig.playerCount }, (_, i) => i)
        }
        if (!lobbyData?.players) {
            return Array.from({ length: gameConfig.playerCount }, (_, i) => i)
        }
        return Array.from({ length: gameConfig.playerCount }, (_, i) => i).filter((idx) =>
            isPlayerConnected(idx),
        )
    }

    const generateDraftHandForPlayer = (playerIdx: number): DraftHandItem[] => {
        if (!players || !players[playerIdx]) {
            return []
        }

        const player = players[playerIdx]
        const handSize = getDraftHandSize(gameConfig.starRating)
        const playerLockedSlots = player.lockedSlots || []

        return generateDraftHand(
            player,
            currentDiff,
            gameConfig,
            burnedCards,
            players,
            (cardId) => dispatch(actions.addBurnedCard(cardId)),
            handSize,
            playerLockedSlots,
        )
    }

    const startDraftPhase = () => {
        // Safety check: ensure players exist before starting draft
        if (!players || players.length === 0) {
            console.error('Cannot start draft phase: no players available')
            return
        }

        // Restore stratagems and clear restrictions for players who completed their restricted mission
        const updatedPlayers = players.map((player) => {
            if (player.weaponRestricted && player.savedStratagems) {
                return {
                    ...player,
                    loadout: {
                        ...player.loadout,
                        stratagems: [...player.savedStratagems],
                    },
                    weaponRestricted: false,
                    savedStratagems: undefined,
                }
            }
            return player
        })

        if (JSON.stringify(updatedPlayers) !== JSON.stringify(players)) {
            dispatch(actions.setPlayers(updatedPlayers))
        }

        // Generate randomized draft order for this round, filtering out disconnected players in multiplayer
        const connectedIndices = getConnectedPlayerIndices()

        // If no players are connected, skip directly to dashboard
        if (connectedIndices.length === 0) {
            // eslint-disable-next-line no-console
            console.log('No connected players, skipping draft phase')
            dispatch(actions.setPhase('DASHBOARD'))
            return
        }

        // Randomize only connected players using Fisher-Yates shuffle
        const draftOrder = [...connectedIndices]
        for (let i = draftOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[draftOrder[i], draftOrder[j]] = [draftOrder[j], draftOrder[i]]
        }
        const firstPlayerIdx = draftOrder[0]

        dispatch(
            actions.setDraftState(
                createDraftState({
                    activePlayerIndex: firstPlayerIdx,
                    roundCards: generateDraftHandForPlayer(firstPlayerIdx),
                    isRerolling: false,
                    pendingStratagem: null,
                    extraDraftRound: 0,
                    draftOrder,
                }),
            ),
        )
        dispatch(actions.setPhase('DRAFT'))
    }

    /**
     * Check if a random event should trigger based on samples collected.
     * If an event triggers, dispatches the necessary state updates and returns true.
     * Otherwise returns false.
     */
    const tryTriggerRandomEvent = () => {
        if (!eventsEnabled) return false

        const baseChance = 0.0
        const sampleBonus =
            state.samples.common * 0.01 + state.samples.rare * 0.02 + state.samples.superRare * 0.03
        const totalChance = Math.min(1.0, baseChance + sampleBonus)

        if (Math.random() < totalChance) {
            const event = selectRandomEvent(currentDiff, players.length > 1, seenEvents, players)
            if (event) {
                dispatch(actions.resetSamples())
                dispatch(actions.addSeenEvent(event.id))
                // Reset all event selections before setting new event to prevent stale state
                dispatch(actions.resetEventSelections())
                dispatch(actions.setCurrentEvent(event))
                dispatch(actions.setPhase('EVENT'))
                return true
            }
        }
        return false
    }

    const proceedToNextDraft = (updatedPlayers: Player[]) => {
        const currentPlayerIdx = draftState.activePlayerIndex
        const currentPlayer = updatedPlayers[currentPlayerIdx]
        const currentExtraRound = draftState.extraDraftRound || 0

        // RETROSPECTIVE DRAFT HANDLING
        // Check if we're in retrospective draft mode
        if (draftState.isRetrospective && draftState.retrospectivePlayerIndex !== null) {
            const retroPlayerIdx = draftState.retrospectivePlayerIndex
            const retroPlayer = updatedPlayers[retroPlayerIdx]

            // Count how many retrospective drafts this player has completed
            const completedRetroDrafts = (retroPlayer.retrospectiveDraftsCompleted || 0) + 1

            // Get the total catch-up drafts needed (deterministic based on lobby difficulty)
            const totalCatchUpNeeded = retroPlayer.catchUpDraftsRemaining || 0

            // Update player's retrospective draft progress
            const progressedPlayers = [...updatedPlayers]
            progressedPlayers[retroPlayerIdx] = {
                ...retroPlayer,
                retrospectiveDraftsCompleted: completedRetroDrafts,
            }
            dispatch(actions.setPlayers(progressedPlayers))

            // Check if there are more catch-up drafts to complete
            if (completedRetroDrafts < totalCatchUpNeeded) {
                // Continue with next retrospective draft
                // Difficulty progresses: 1, 2, 3, ... based on which catch-up draft this is
                const nextDraftNumber = completedRetroDrafts + 1
                const nextDifficulty = nextDraftNumber
                const nextStarRating = Math.min(Math.ceil(nextDifficulty / 2), 5)

                const handSize = getDraftHandSize(nextStarRating)
                const playerLockedSlots = progressedPlayers[retroPlayerIdx].lockedSlots || []

                const retroHand = generateDraftHand(
                    progressedPlayers[retroPlayerIdx],
                    nextDifficulty,
                    gameConfig,
                    burnedCards,
                    progressedPlayers,
                    (cardId) => dispatch(actions.addBurnedCard(cardId)),
                    handSize,
                    playerLockedSlots,
                )

                dispatch(
                    actions.setDraftState({
                        activePlayerIndex: retroPlayerIdx,
                        roundCards: retroHand,
                        isRerolling: false,
                        pendingStratagem: null,
                        extraDraftRound: 0,
                        draftOrder: [retroPlayerIdx],
                        isRetrospective: true,
                        retrospectivePlayerIndex: retroPlayerIdx,
                    }),
                )
                return
            } else {
                // Retrospective draft complete - clear flags and return to dashboard
                const completedPlayers = [...progressedPlayers]
                completedPlayers[retroPlayerIdx] = {
                    ...completedPlayers[retroPlayerIdx],
                    needsRetrospectiveDraft: false,
                    retrospectiveDraftsCompleted: undefined,
                    catchUpDraftsRemaining: undefined,
                }
                dispatch(actions.setPlayers(completedPlayers))
                dispatch(
                    actions.setDraftState({
                        ...draftState,
                        isRetrospective: false,
                        retrospectivePlayerIndex: null,
                    }),
                )
                dispatch(actions.setPhase('DASHBOARD'))
                return
            }
        }

        // Check if current player has more redraft rounds to complete
        if (currentPlayer.redraftRounds && currentPlayer.redraftRounds > 1) {
            const remainingRounds = currentPlayer.redraftRounds - 1
            const clearedPlayers = [...updatedPlayers]
            clearedPlayers[currentPlayerIdx] = { ...currentPlayer, redraftRounds: remainingRounds }
            dispatch(actions.setPlayers(clearedPlayers))

            // Continue with next redraft round for same player
            dispatch(
                actions.setDraftState(
                    createDraftState({
                        activePlayerIndex: currentPlayerIdx,
                        roundCards: generateDraftHandForPlayer(currentPlayerIdx),
                        isRerolling: false,
                        pendingStratagem: null,
                        extraDraftRound: 0,
                        isRedrafting: true,
                        draftOrder: draftState.draftOrder,
                    }),
                ),
            )
            return
        }

        // Clear redraft rounds for this player
        if (currentPlayer.redraftRounds) {
            const clearedPlayers = [...updatedPlayers]
            clearedPlayers[currentPlayerIdx] = { ...currentPlayer, redraftRounds: 0 }
            dispatch(actions.setPlayers(clearedPlayers))

            // After redraft completes, go back to dashboard
            dispatch(actions.setPhase('DASHBOARD'))
            return
        }

        // Check if current player has more extra drafts to complete
        if (currentPlayer.extraDraftCards && currentExtraRound < currentPlayer.extraDraftCards) {
            // Continue with next extra draft for same player
            dispatch(
                actions.setDraftState(
                    createDraftState({
                        activePlayerIndex: currentPlayerIdx,
                        roundCards: generateDraftHandForPlayer(currentPlayerIdx),
                        isRerolling: false,
                        pendingStratagem: null,
                        extraDraftRound: currentExtraRound + 1,
                        draftOrder: draftState.draftOrder,
                    }),
                ),
            )
            return
        }

        // Clear extra draft cards for this player
        if (currentPlayer.extraDraftCards) {
            const clearedPlayers = [...updatedPlayers]
            clearedPlayers[currentPlayerIdx] = { ...currentPlayer, extraDraftCards: 0 }
            dispatch(actions.setPlayers(clearedPlayers))
        }

        // Move to next connected player in draft order or complete
        const draftOrder = draftState.draftOrder || []
        const currentPositionInOrder = draftOrder.indexOf(currentPlayerIdx)

        // Find next connected player in the draft order
        let nextIdx = null
        for (let i = currentPositionInOrder + 1; i < draftOrder.length; i++) {
            const candidateIdx = draftOrder[i]
            if (isPlayerConnected(candidateIdx)) {
                nextIdx = candidateIdx
                break
            }
        }

        if (nextIdx !== null) {
            // Move to next connected player in the draft order
            dispatch(
                actions.setDraftState(
                    createDraftState({
                        activePlayerIndex: nextIdx,
                        roundCards: generateDraftHandForPlayer(nextIdx),
                        isRerolling: false,
                        pendingStratagem: null,
                        extraDraftRound: 0,
                        draftOrder,
                    }),
                ),
            )
        } else {
            // Draft complete
            // Record draft history (only for normal drafts, not retrospective)
            if (!draftState.isRetrospective) {
                dispatch(
                    actions.addDraftHistory({
                        difficulty: currentDiff,
                        starRating: gameConfig.starRating,
                    }),
                )

                // Record draft complete for analytics - per player
                updatedPlayers.forEach((p: { name: string }, idx: number) => {
                    runAnalytics.recordDraftComplete(
                        String(idx),
                        p.name,
                        '', // itemId - not applicable for batch record
                        '', // slot - not applicable for batch record
                        currentDiff,
                    )
                })

                // Check if any players need retrospective drafts (newly joined players)
                const playerNeedingRetro = updatedPlayers.findIndex(
                    (p: Player) => p.needsRetrospectiveDraft && (p.catchUpDraftsRemaining || 0) > 0,
                )
                if (playerNeedingRetro !== -1) {
                    // Start retrospective draft for the first player who needs it
                    const retroPlayer = updatedPlayers[playerNeedingRetro]

                    // Use deterministic difficulty progression: 1, 2, 3, ...
                    const retrospectiveDraftNumber =
                        (retroPlayer.retrospectiveDraftsCompleted || 0) + 1
                    const retroDifficulty = retrospectiveDraftNumber
                    const retroStarRating = Math.min(Math.ceil(retroDifficulty / 2), 5)

                    const handSize = getDraftHandSize(retroStarRating)
                    const playerLockedSlots = retroPlayer.lockedSlots || []

                    const retroHand = generateDraftHand(
                        retroPlayer,
                        retroDifficulty,
                        gameConfig,
                        burnedCards,
                        updatedPlayers,
                        (cardId) => dispatch(actions.addBurnedCard(cardId)),
                        handSize,
                        playerLockedSlots,
                    )

                    // Initialize retrospective draft progress
                    const initPlayers = [...updatedPlayers]
                    initPlayers[playerNeedingRetro] = {
                        ...retroPlayer,
                        retrospectiveDraftsCompleted: 0,
                    }
                    dispatch(actions.setPlayers(initPlayers))

                    dispatch(
                        actions.setDraftState({
                            activePlayerIndex: playerNeedingRetro,
                            roundCards: retroHand,
                            isRerolling: false,
                            pendingStratagem: null,
                            extraDraftRound: 0,
                            draftOrder: [playerNeedingRetro],
                            isRetrospective: true,
                            retrospectivePlayerIndex: playerNeedingRetro,
                        }),
                    )
                    return
                }
            }

            // Check for event
            if (tryTriggerRandomEvent()) {
                return
            }
            dispatch(actions.setPhase('DASHBOARD'))
        }
    }

    const handleSkipDraft = () => {
        // In multiplayer as client, send action to host instead of processing locally
        if (isMultiplayer && !isHost) {
            sendAction({
                type: 'SKIP_DRAFT',
                payload: {
                    playerIndex: draftState.activePlayerIndex,
                },
            })
            return
        }

        // Burn all cards shown in this draft hand (if burn mode enabled)
        if (gameConfig.burnCards && draftState.roundCards) {
            draftState.roundCards.forEach((card) => {
                if (isArmorCombo(card)) {
                    // Armor combo - burn all armor pieces
                    card.items.forEach((armor: { id: string }) =>
                        dispatch(actions.addBurnedCard(armor.id)),
                    )
                } else if (isItem(card)) {
                    // Regular item
                    dispatch(actions.addBurnedCard(card.id))
                }
            })
        }

        proceedToNextDraft(players)
    }

    const handleDraftPick = (item: DraftHandItem) => {
        const currentPlayerIdx = draftState.activePlayerIndex

        // In multiplayer, only the player whose turn it is can draft
        if (isMultiplayer && playerSlot !== currentPlayerIdx) {
            return
        }

        // In multiplayer as client, send action to host instead of processing locally
        if (isMultiplayer && !isHost) {
            sendAction({
                type: types.DRAFT_PICK,
                payload: {
                    playerIndex: currentPlayerIdx,
                    item,
                },
            })
            return
        }

        const updatedPlayers = [...players]
        const player = updatedPlayers[currentPlayerIdx]

        // Guard: ensure player exists and has loadout
        if (!player || !player.loadout) {
            console.error('handleDraftPick: Invalid player or loadout', {
                currentPlayerIdx,
                player,
            })
            return
        }

        // Check if this is an armor combo
        const itemIsArmorCombo = isArmorCombo(item)

        if (itemIsArmorCombo) {
            // Add all armor variants to inventory
            item.items.forEach((armor: Item) => {
                player.inventory.push(armor.id)
            })

            // Auto-equip the first armor in the combo
            player.loadout.armor = item.items[0].id
        } else {
            // Special handling for stratagems when slots are full
            if ((item as Item).type === TYPE.STRATAGEM) {
                if (areStratagemSlotsFull(player.loadout)) {
                    // All slots full - show replacement UI
                    dispatch(
                        actions.updateDraftState({
                            pendingStratagem: item as unknown as import('./types').StratagemItem,
                        }),
                    )
                    return // Don't proceed with pick yet
                }
            }
            // Add to inventory
            player.inventory.push((item as Item).id)

            // Auto-Equip Logic
            const itemAsItem = item as Item
            if (itemAsItem.type === TYPE.PRIMARY) player.loadout.primary = itemAsItem.id
            if (itemAsItem.type === TYPE.SECONDARY) player.loadout.secondary = itemAsItem.id
            if (itemAsItem.type === TYPE.GRENADE) player.loadout.grenade = itemAsItem.id
            if (itemAsItem.type === TYPE.ARMOR) player.loadout.armor = itemAsItem.id
            if (itemAsItem.type === TYPE.BOOSTER) player.loadout.booster = itemAsItem.id
            if (itemAsItem.type === TYPE.STRATAGEM) {
                // Find empty slot (we know it exists because we checked above)
                const emptySlot = getFirstEmptyStratagemSlot(player.loadout)
                player.loadout.stratagems[emptySlot] = itemAsItem.id
            }
        }

        dispatch(actions.setPlayers(updatedPlayers))

        // Determine the slot type and item ID for analytics
        const slotType = itemIsArmorCombo ? TYPE.ARMOR : (item as Item).type
        const itemId = itemIsArmorCombo ? item.items[0].id : (item as Item).id

        // Record loadout change for analytics
        runAnalytics.recordLoadoutChange(
            String(currentPlayerIdx),
            player.name || `Helldiver ${currentPlayerIdx + 1}`,
            { ...player.loadout },
            slotType,
            itemId,
            `Draft pick: ${itemIsArmorCombo ? getArmorComboDisplayName(item.passive, item.armorClass) : (item as Item).name || 'Unknown item'}`,
        )

        // Burn all cards shown in this draft hand (if burn mode enabled)
        if (gameConfig.burnCards && draftState.roundCards) {
            draftState.roundCards.forEach((card) => {
                if (isArmorCombo(card)) {
                    // Armor combo - burn all armor pieces
                    card.items.forEach((armor: { id: string }) =>
                        dispatch(actions.addBurnedCard(armor.id)),
                    )
                } else if (isItem(card)) {
                    // Regular item
                    dispatch(actions.addBurnedCard(card.id))
                }
            })
        }

        // Track draft selection
        trackDraftSelection(
            isArmorCombo(item) ? TYPE.ARMOR : (item as Item).type || 'unknown',
            isArmorCombo(item) ? 'Common' : (item as Item).rarity || 'unknown',
            currentDiff,
        )

        // Next player, extra draft, or finish
        proceedToNextDraft(updatedPlayers)
    }

    const handleStratagemReplacement = (slotIndex: number) => {
        const currentPlayerIdx = draftState.activePlayerIndex

        // In multiplayer, only the player whose turn it is can select replacement
        if (isMultiplayer && playerSlot !== currentPlayerIdx) {
            console.warn('Not your turn to select replacement', { playerSlot, currentPlayerIdx })
            return
        }

        // In multiplayer as client, send action to host instead of processing locally
        if (isMultiplayer && !isHost) {
            sendAction({
                type: types.STRATAGEM_REPLACEMENT,
                payload: {
                    playerIndex: currentPlayerIdx,
                    slotIndex,
                },
            })
            return
        }

        const updatedPlayers = [...players]
        const player = updatedPlayers[currentPlayerIdx]
        const item = draftState.pendingStratagem

        // Guard: ensure we have a pending stratagem
        if (!item) {
            console.error('handleStratagemReplacement: No pending stratagem', {
                currentPlayerIdx,
                slotIndex,
            })
            return
        }

        // Add to inventory
        player.inventory.push(item.id)

        // Replace the selected slot
        player.loadout.stratagems[slotIndex] = item.id

        dispatch(actions.setPlayers(updatedPlayers))
        dispatch(actions.updateDraftState({ pendingStratagem: null }))

        // Record loadout change for analytics
        runAnalytics.recordLoadoutChange(
            String(currentPlayerIdx),
            player.name || `Helldiver ${currentPlayerIdx + 1}`,
            { ...player.loadout },
            `stratagems`,
            item.id,
            `Replaced stratagem slot ${slotIndex + 1}: ${item.name || 'Unknown'}`,
        )

        // Next player, extra draft, or finish
        proceedToNextDraft(updatedPlayers)
    }

    // Type for multiplayer action handler
    type MultiplayerAction = {
        type: string
        payload?: {
            playerIndex?: number
            item?: DraftHandItem
            slotIndex?: number
            cost?: number
            itemId?: string
            itemIdsToExclude?: string[]
            cardToRemove?: DraftHandItem
            extracted?: boolean
            playerId?: number
            slotType?: string
            [key: string]: unknown
        }
    }

    // Ref to hold the draft pick handler for multiplayer (avoids stale closure issues)
    const draftPickHandlerRef = React.useRef<((action: MultiplayerAction) => boolean) | null>(null)

    // Update the ref whenever dependencies change
    draftPickHandlerRef.current = (action: MultiplayerAction) => {
        if (action.type === types.DRAFT_PICK) {
            const { playerIndex, item } = action.payload || {}

            if (playerIndex === undefined || !item) {
                console.error('DRAFT_PICK: Missing playerIndex or item')
                return true
            }

            // Process the draft pick for this player
            const updatedPlayers = [...players]
            const player = updatedPlayers[playerIndex]

            if (!player || !player.loadout) {
                console.error('DRAFT_PICK: Invalid player', {
                    playerIndex,
                    playersLength: players.length,
                })
                return true // Consumed the action
            }

            // Check if this is an armor combo
            const itemIsArmorCombo = isArmorCombo(item)

            if (itemIsArmorCombo) {
                item.items.forEach((armor: Item) => {
                    player.inventory.push(armor.id)
                })
                player.loadout.armor = item.items[0].id
            } else {
                // Special handling for stratagems when slots are full
                if ((item as Item).type === TYPE.STRATAGEM) {
                    if (areStratagemSlotsFull(player.loadout)) {
                        // Set pending stratagem to trigger modal for player to choose which slot to replace
                        dispatch(
                            actions.updateDraftState({
                                pendingStratagem:
                                    item as unknown as import('./types').StratagemItem,
                            }),
                        )
                        return true // Action was handled, wait for STRATAGEM_REPLACEMENT action
                    }
                }

                player.inventory.push((item as Item).id)

                // Auto-Equip Logic
                const itemAsItem = item as Item
                if (itemAsItem.type === TYPE.PRIMARY) player.loadout.primary = itemAsItem.id
                if (itemAsItem.type === TYPE.SECONDARY) player.loadout.secondary = itemAsItem.id
                if (itemAsItem.type === TYPE.GRENADE) player.loadout.grenade = itemAsItem.id
                if (itemAsItem.type === TYPE.ARMOR) player.loadout.armor = itemAsItem.id
                if (itemAsItem.type === TYPE.BOOSTER) player.loadout.booster = itemAsItem.id
                if (itemAsItem.type === TYPE.STRATAGEM) {
                    const emptySlot = getFirstEmptyStratagemSlot(player.loadout)
                    player.loadout.stratagems[emptySlot] = itemAsItem.id
                }
            }

            dispatch(actions.setPlayers(updatedPlayers))

            // Record loadout change for analytics
            runAnalytics.recordLoadoutChange(
                String(playerIndex),
                player.name || `Helldiver ${playerIndex + 1}`,
                { ...player.loadout },
                itemIsArmorCombo ? TYPE.ARMOR : (item as Item).type || 'armor',
                itemIsArmorCombo ? item.items[0].id : (item as Item).id,
                `Draft pick: ${itemIsArmorCombo ? 'Armor combo' : (item as Item).name || 'Unknown item'}`,
            )

            proceedToNextDraft(updatedPlayers)
            return true // Action was handled
        }

        // Handle stratagem replacement from clients
        if (action.type === types.STRATAGEM_REPLACEMENT) {
            const payload = action.payload || {}
            const playerIndex = payload.playerIndex
            const slotIndex = payload.slotIndex
            const updatedPlayers = [...players]
            const player = playerIndex !== undefined ? updatedPlayers[playerIndex] : undefined

            if (!player || !player?.loadout || !draftState.pendingStratagem) {
                console.error('STRATAGEM_REPLACEMENT: Invalid state', {
                    playerIndex,
                    slotIndex,
                    hasPlayer: !!player,
                    hasLoadout: !!player?.loadout,
                    hasPendingStratagem: !!draftState.pendingStratagem,
                })
                return true
            }

            const item = draftState.pendingStratagem

            // Add to inventory
            player.inventory.push(item.id)

            // Replace the selected slot
            player.loadout.stratagems[slotIndex as number] = item.id

            dispatch(actions.setPlayers(updatedPlayers))
            dispatch(actions.updateDraftState({ pendingStratagem: null }))

            // Record loadout change for analytics
            runAnalytics.recordLoadoutChange(
                String(playerIndex ?? 0),
                player.name || `Helldiver ${(playerIndex ?? 0) + 1}`,
                { ...player.loadout },
                'stratagems',
                item.id,
                `Replaced stratagem slot ${(slotIndex as number) + 1}: ${item.name || 'Unknown'}`,
            )

            proceedToNextDraft(updatedPlayers)
            return true
        }

        // Handle extraction status toggle from clients
        if (action.type === types.SET_PLAYER_EXTRACTED) {
            const { playerIndex, extracted } = action.payload || {}
            dispatch(
                actions.setPlayerExtracted({
                    playerIndex: playerIndex as number,
                    extracted: extracted as boolean,
                }),
            )
            return true
        }

        // Handle skip draft from clients
        if (action.type === 'SKIP_DRAFT') {
            proceedToNextDraft(players)
            return true
        }

        // Handle draft reroll from clients
        if (action.type === 'DRAFT_REROLL') {
            const { cost } = action.payload || {}
            if (requisition < (cost as number)) return true // Action consumed but rejected
            dispatch(actions.spendRequisition(cost as number))
            dispatch(
                actions.updateDraftState({
                    roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex),
                }),
            )
            return true
        }

        // Handle remove card from clients
        if (action.type === 'REMOVE_CARD') {
            const { cardToRemove, itemIdsToExclude } = action.payload || {}
            const playerIdx = draftState.activePlayerIndex
            const player = players[playerIdx]

            // Update player's excludedItems with the items sent from client
            if (itemIdsToExclude && (itemIdsToExclude as string[]).length > 0) {
                const currentExcluded = player?.excludedItems || []
                const newExcluded = [
                    ...new Set([...currentExcluded, ...(itemIdsToExclude as string[])]),
                ]
                dispatch(
                    actions.setPlayerExcludedItems({
                        playerIndex: playerIdx,
                        excludedItems: newExcluded,
                    }),
                )
            }

            const playerLockedSlots = player?.lockedSlots || []

            // Use updated excluded items for pool
            const updatedExcluded = itemIdsToExclude
                ? [
                      ...new Set([
                          ...(player?.excludedItems || []),
                          ...(itemIdsToExclude as string[]),
                      ]),
                  ]
                : player?.excludedItems || []
            const updatedPlayer = { ...player, excludedItems: updatedExcluded }
            const pool = getWeightedPool(
                updatedPlayer,
                currentDiff,
                gameConfig,
                burnedCards,
                players,
                playerLockedSlots,
            )

            // Check if the card to remove is an armor combo
            const cardToRemoveTyped = cardToRemove as DraftHandItem | undefined
            const isRemovingArmorCombo = cardToRemoveTyped && isArmorCombo(cardToRemoveTyped)

            // Filter out cards already in the current hand
            const availablePool = pool.filter((poolEntry) => {
                if (poolEntry.isArmorCombo) {
                    return !draftState.roundCards.some(
                        (card) =>
                            isArmorCombo(card) &&
                            card.passive === poolEntry.armorCombo?.passive &&
                            card.armorClass === poolEntry.armorCombo?.armorClass,
                    )
                } else {
                    return !draftState.roundCards.some(
                        (card) =>
                            (isItem(card) && card.id === poolEntry.item?.id) ||
                            (isArmorCombo(card) &&
                                card.items.some((armor: Item) => armor.id === poolEntry.item?.id)),
                    )
                }
            })

            if (availablePool.length === 0) {
                return true // No cards available, action consumed
            }

            // Pick a new random card
            const totalWeight = availablePool.reduce((sum, c) => sum + c.weight, 0)
            let randomNum = Math.random() * totalWeight
            let newCard = null

            for (let j = 0; j < availablePool.length; j++) {
                const poolItem = availablePool[j]
                if (!poolItem) continue

                randomNum -= poolItem.weight
                if (randomNum <= 0) {
                    newCard = poolItem.isArmorCombo ? poolItem.armorCombo : poolItem.item
                    break
                }
            }

            if (newCard) {
                // Add to burned cards if burn mode enabled
                if (gameConfig.burnCards) {
                    if (isArmorCombo(newCard)) {
                        newCard.items.forEach((armor: Item) =>
                            dispatch(actions.addBurnedCard(armor.id)),
                        )
                    } else {
                        dispatch(actions.addBurnedCard((newCard as Item).id))
                    }
                }

                // Replace the card
                dispatch(
                    actions.updateDraftState({
                        roundCards: draftState.roundCards.map((card) => {
                            if (isRemovingArmorCombo && cardToRemoveTyped) {
                                const cardRemoveAsCombo = cardToRemoveTyped as ArmorCombo
                                if (
                                    isArmorCombo(card) &&
                                    card.passive === cardRemoveAsCombo.passive &&
                                    card.armorClass === cardRemoveAsCombo.armorClass
                                ) {
                                    return newCard as DraftHandItem
                                }
                            } else if (cardToRemoveTyped) {
                                if (isItem(card) && card.id === (cardToRemoveTyped as Item).id) {
                                    return newCard as DraftHandItem
                                }
                            }
                            return card
                        }),
                    }),
                )
            }

            return true // Action handled
        }

        // Handle sacrifice item from clients
        if (action.type === types.SACRIFICE_ITEM) {
            const payload = action.payload || {}
            const playerIndex = payload.playerIndex as number | undefined
            const itemId = payload.itemId as string | undefined

            if (playerIndex === undefined || !itemId) {
                console.error('SACRIFICE_ITEM: Missing playerIndex or itemId')
                return true
            }

            // Apply sacrifice to the players array
            const updatedPlayers = players.map((player, idx) => {
                if (idx !== playerIndex) return player

                // Remove from inventory
                const newInventory = player.inventory.filter((id) => id !== itemId)

                // Remove from loadout if equipped
                const newLoadout = {
                    ...player.loadout,
                    stratagems: [...player.loadout.stratagems],
                }

                if (newLoadout.primary === itemId) newLoadout.primary = null
                if (newLoadout.secondary === itemId) {
                    newLoadout.secondary = 's_peacemaker'
                    if (!newInventory.includes('s_peacemaker')) {
                        newInventory.push('s_peacemaker')
                    }
                }
                if (newLoadout.grenade === itemId) {
                    newLoadout.grenade = 'g_he'
                    if (!newInventory.includes('g_he')) {
                        newInventory.push('g_he')
                    }
                }
                if (newLoadout.armor === itemId) {
                    newLoadout.armor = 'a_b01'
                    if (!newInventory.includes('a_b01')) {
                        newInventory.push('a_b01')
                    }
                }
                if (newLoadout.booster === itemId) newLoadout.booster = null

                // Remove stratagem from all slots that match
                for (let i = 0; i < newLoadout.stratagems.length; i++) {
                    if (newLoadout.stratagems[i] === itemId) {
                        newLoadout.stratagems[i] = null
                    }
                }

                return {
                    ...player,
                    inventory: newInventory,
                    loadout: newLoadout,
                }
            })

            // Move to next player who needs to sacrifice, or end sacrifice phase
            const currentIndex = sacrificeState.sacrificesRequired.indexOf(playerIndex)
            const nextIndex = currentIndex + 1

            if (nextIndex < sacrificeState.sacrificesRequired.length) {
                // Move to next player
                const nextPlayerIndex = sacrificeState.sacrificesRequired[nextIndex]
                dispatch(actions.setPlayers(updatedPlayers))
                dispatch(
                    actions.updateSacrificeState({
                        activePlayerIndex: nextPlayerIndex,
                    }),
                )
            } else {
                // All sacrifices complete - reset extraction status and move to draft
                const resetPlayers = updatedPlayers.map((p) => ({ ...p, extracted: true }))
                dispatch(actions.setPlayers(resetPlayers))
                startDraftPhase()
            }

            return true // Action handled
        }

        return false // Action not handled
    }

    // Register action handler for multiplayer client actions (host only)
    // Re-register when phase changes to DRAFT to ensure reconnecting clients work
    useEffect(() => {
        if (isMultiplayer && isHost) {
            setActionHandler((action) => {
                // Use the ref to get the latest handler
                if (draftPickHandlerRef.current) {
                    return draftPickHandlerRef.current(action)
                }
                return false
            })
        }

        return () => {
            if (isMultiplayer && isHost) {
                setActionHandler(null)
            }
        }
    }, [isMultiplayer, isHost, setActionHandler, phase])

    const rerollDraft = (cost: number) => {
        if (requisition < cost) return

        // In multiplayer as client, send action to host instead of processing locally
        if (isMultiplayer && !isHost) {
            sendAction({
                type: 'DRAFT_REROLL',
                payload: {
                    cost,
                    playerIndex: draftState.activePlayerIndex,
                },
            })
            return
        }

        dispatch(actions.spendRequisition(cost))

        // Record requisition spend for analytics
        const playerName =
            players[draftState.activePlayerIndex]?.name ||
            `Helldiver ${draftState.activePlayerIndex + 1}`
        runAnalytics.recordRequisitionChange(-cost, playerName, 'Draft Reroll')
        runAnalytics.recordRerollUsed(
            String(draftState.activePlayerIndex),
            playerName,
            currentDiff,
            cost,
        )

        dispatch(
            actions.updateDraftState({
                roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex),
            }),
        )
    }

    const handleLockSlot = (playerId: string, slotType: SlotType) => {
        const { getSlotLockCost, MAX_LOCKED_SLOTS } = require('./constants/balancingConfig')
        const slotLockCost = getSlotLockCost(gameConfig.playerCount)
        const player = players.find((p) => p.id === playerId)
        const playerLockedSlots = player?.lockedSlots || []

        if (requisition < slotLockCost) return
        if (playerLockedSlots.length >= MAX_LOCKED_SLOTS) return
        if (playerLockedSlots.includes(slotType as ItemType)) return

        dispatch(actions.spendRequisition(slotLockCost))

        // Record requisition spend for analytics
        const playerName = player?.name || 'Unknown Player'
        runAnalytics.recordRequisitionChange(-slotLockCost, playerName, `Lock ${slotType} Slot`)

        dispatch(actions.lockPlayerDraftSlot({ playerId, slotType: slotType as ItemType }))

        // Regenerate current hand if this is the active player
        if (phase === 'DRAFT' && players[draftState.activePlayerIndex]?.id === playerId) {
            dispatch(
                actions.updateDraftState({
                    roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex),
                }),
            )
        }
    }

    const handleUnlockSlot = (playerId: string, slotType: SlotType) => {
        const player = players.find((p) => p.id === playerId)
        const playerLockedSlots = player?.lockedSlots || []

        if (!playerLockedSlots.includes(slotType as ItemType)) return

        // Confirm unlock action
        if (
            !window.confirm(
                `Unlock ${slotType} slot? This will allow ${slotType} items to appear in future drafts.`,
            )
        ) {
            return
        }

        dispatch(actions.unlockPlayerDraftSlot({ playerId, slotType: slotType as ItemType }))

        // Regenerate current hand if this is the active player
        if (phase === 'DRAFT' && players[draftState.activePlayerIndex]?.id === playerId) {
            dispatch(
                actions.updateDraftState({
                    roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex),
                }),
            )
        }
    }

    const handleSacrifice = (item: Item) => {
        // Sacrifice the item for the current active player
        const playerIndex = sacrificeState.activePlayerIndex
        // eslint-disable-next-line no-console
        console.log(
            'Sacrificing item',
            item.id,
            'for player index',
            playerIndex,
            'player:',
            players[playerIndex]?.name,
        )

        // In multiplayer as client, send action to host instead of processing locally
        if (isMultiplayer && !isHost) {
            sendAction({
                type: types.SACRIFICE_ITEM,
                payload: {
                    playerIndex,
                    itemId: item.id,
                },
            })
            return
        }

        // Apply sacrifice to the players array
        const itemId = item.id
        const updatedPlayers = players.map((player, idx) => {
            if (idx !== playerIndex) return player

            // Remove from inventory
            const newInventory = player.inventory.filter((id) => id !== itemId)

            // Remove from loadout if equipped
            const newLoadout = {
                ...player.loadout,
                stratagems: [...player.loadout.stratagems],
            }

            if (newLoadout.primary === itemId) newLoadout.primary = null
            if (newLoadout.secondary === itemId) {
                newLoadout.secondary = 's_peacemaker'
                if (!newInventory.includes('s_peacemaker')) {
                    newInventory.push('s_peacemaker')
                }
            }
            if (newLoadout.grenade === itemId) {
                newLoadout.grenade = 'g_he'
                if (!newInventory.includes('g_he')) {
                    newInventory.push('g_he')
                }
            }
            if (newLoadout.armor === itemId) {
                newLoadout.armor = 'a_b01'
                if (!newInventory.includes('a_b01')) {
                    newInventory.push('a_b01')
                }
            }
            if (newLoadout.booster === itemId) newLoadout.booster = null

            // Remove stratagem from all slots that match
            for (let i = 0; i < newLoadout.stratagems.length; i++) {
                if (newLoadout.stratagems[i] === itemId) {
                    newLoadout.stratagems[i] = null
                }
            }

            return {
                ...player,
                inventory: newInventory,
                loadout: newLoadout,
            }
        })

        // Move to next player who needs to sacrifice, or end sacrifice phase
        const currentIndex = sacrificeState.sacrificesRequired.indexOf(playerIndex)
        const nextIndex = currentIndex + 1

        // eslint-disable-next-line no-console
        console.log(
            'Current position in sacrifice queue:',
            currentIndex,
            'Next:',
            nextIndex,
            'Total required:',
            sacrificeState.sacrificesRequired,
        )

        if (nextIndex < sacrificeState.sacrificesRequired.length) {
            // Move to next player
            const nextPlayerIndex = sacrificeState.sacrificesRequired[nextIndex]
            // eslint-disable-next-line no-console
            console.log('Moving to next player index:', nextPlayerIndex)
            dispatch(actions.setPlayers(updatedPlayers))
            dispatch(
                actions.updateSacrificeState({
                    activePlayerIndex: nextPlayerIndex,
                }),
            )
        } else {
            // All sacrifices complete - reset extraction status and move to draft
            // eslint-disable-next-line no-console
            console.log('All sacrifices complete, moving to draft')
            const resetPlayers = updatedPlayers.map((p) => ({ ...p, extracted: true }))
            dispatch(actions.setPlayers(resetPlayers))
            startDraftPhase()
        }
    }

    const removeCardFromDraft = (cardToRemove: DraftHandItem) => {
        // Show confirmation modal first
        setPendingCardRemoval(cardToRemove)
        setShowRemoveCardConfirm(true)
    }

    const confirmRemoveCardFromDraft = () => {
        const cardToRemove = pendingCardRemoval as DraftHandItem | null
        if (!cardToRemove) return

        // Close modal and clear pending card
        setShowRemoveCardConfirm(false)
        setPendingCardRemoval(null)

        // Check if the card to remove is an armor combo
        const isRemovingArmorCombo = isArmorCombo(cardToRemove)

        // Get the item ID(s) to exclude - for armor combos, exclude all armor variants
        const itemIdsToExclude = isRemovingArmorCombo
            ? cardToRemove.items.map((armor: Item) => armor.id)
            : [(cardToRemove as Item).id]

        // Update the player's excludedItems in game state
        const player = players[draftState.activePlayerIndex]
        const currentExcluded = player.excludedItems || []
        const newExcluded = [...new Set([...currentExcluded, ...itemIdsToExclude])]
        dispatch(
            actions.setPlayerExcludedItems({
                playerIndex: draftState.activePlayerIndex,
                excludedItems: newExcluded,
            }),
        )

        // Also update localStorage so this persists across sessions
        addExcludedItemsToSavedConfig(itemIdsToExclude)

        // In multiplayer as client, send action to host instead of processing locally
        if (isMultiplayer && !isHost) {
            sendAction({
                type: 'REMOVE_CARD',
                payload: {
                    playerIndex: draftState.activePlayerIndex,
                    cardToRemove,
                    itemIdsToExclude,
                },
            })
            return
        }

        // Remove single card and replace it with a new one
        const playerLockedSlots = player.lockedSlots || []

        // Use the updated excluded items for pool generation
        const updatedPlayer = { ...player, excludedItems: newExcluded }
        const pool = getWeightedPool(
            updatedPlayer,
            currentDiff,
            gameConfig,
            burnedCards,
            players,
            playerLockedSlots,
        )

        // Filter out cards already in the current hand
        const availablePool = pool.filter((poolEntry) => {
            // Check if this pool entry matches any card in hand
            if (poolEntry.isArmorCombo) {
                // For armor combos, compare passive and armorClass
                return !draftState.roundCards.some(
                    (card) =>
                        card.passive === poolEntry.armorCombo.passive &&
                        card.armorClass === poolEntry.armorCombo?.armorClass,
                )
            } else {
                // For regular items, compare ID
                return !draftState.roundCards.some(
                    (card) =>
                        (isItem(card) && card.id === poolEntry.item?.id) ||
                        (isArmorCombo(card) &&
                            card.items.some((armor: Item) => armor.id === poolEntry.item?.id)),
                )
            }
        })

        if (availablePool.length === 0) {
            alert('No more unique cards available!')
            return
        }

        // Pick a new random card
        const totalWeight = availablePool.reduce((sum, c) => sum + c.weight, 0)
        let randomNum = Math.random() * totalWeight
        let newCard: DraftHandItem | null = null

        for (let j = 0; j < availablePool.length; j++) {
            const poolItem = availablePool[j]
            if (!poolItem) continue

            randomNum -= poolItem.weight
            if (randomNum <= 0) {
                newCard = (
                    poolItem.isArmorCombo ? poolItem.armorCombo : poolItem.item
                ) as DraftHandItem
                break
            }
        }

        if (newCard) {
            // Add to burned cards if burn mode enabled
            if (gameConfig.burnCards) {
                if (isArmorCombo(newCard)) {
                    // Armor combo - burn all variants
                    newCard.items.forEach((armor: Item) =>
                        dispatch(actions.addBurnedCard(armor.id)),
                    )
                } else {
                    // Regular item
                    dispatch(actions.addBurnedCard((newCard as Item).id))
                }
            }

            // Replace the card (compare properly for both armor combos and regular items)
            dispatch(
                actions.updateDraftState({
                    roundCards: draftState.roundCards.map((card) => {
                        // Check if this is the card to remove
                        if (isRemovingArmorCombo) {
                            // Compare armor combos by passive and armorClass
                            if (
                                isArmorCombo(card) &&
                                card.passive === (cardToRemove as ArmorCombo).passive &&
                                card.armorClass === (cardToRemove as ArmorCombo).armorClass
                            ) {
                                return newCard as DraftHandItem
                            }
                        } else {
                            // Compare regular items by ID
                            if (isItem(card) && card.id === (cardToRemove as Item).id) {
                                return newCard
                            }
                        }
                        return card
                    }),
                }),
            )

            // State sync to other players happens automatically through the useEffect
            // that watches state changes and calls syncState(state)
        }
    }

    // --- RENDER PHASES ---

    if (phase === 'VICTORY') {
        const handleReturnToMenu = () => {
            runAnalytics.clearAnalytics()
            dispatch(actions.setRunAnalyticsData(null))
            dispatch(actions.setPhase('MENU'))
        }

        return (
            <AnalyticsDashboard
                analyticsData={state.runAnalyticsData}
                outcome="victory"
                faction={gameConfig.faction}
                subfaction={gameConfig.subfaction}
                players={players}
                onClose={handleReturnToMenu}
                onViewHistory={() => setShowRunHistory(true)}
            />
        )
    }

    if (phase === 'GAMEOVER') {
        const handleReturnToMenu = () => {
            runAnalytics.clearAnalytics()
            dispatch(actions.setRunAnalyticsData(null))
            dispatch(actions.setPhase('MENU'))
        }

        return (
            <AnalyticsDashboard
                analyticsData={state.runAnalyticsData}
                outcome="defeat"
                faction={gameConfig.faction}
                subfaction={gameConfig.subfaction}
                players={players}
                onClose={handleReturnToMenu}
                onViewHistory={() => setShowRunHistory(true)}
            />
        )
    }

    // Kicked screen - shown when host kicks the player
    if (phase === 'KICKED') {
        return (
            <KickedScreen
                faction={gameConfig.faction}
                onReturnToMenu={() => {
                    clearWasKicked()
                    dispatch(actions.setPhase('MENU'))
                }}
            />
        )
    }

    // Multiplayer mode selection screens
    if (phase === 'MENU' && multiplayerMode === 'select') {
        return (
            <MultiplayerModeSelect
                gameConfig={gameConfig}
                onHost={async () => {
                    // Create lobby and go to waiting room
                    trackMultiplayerAction('create_lobby')
                    const newLobbyId = await hostGame('Host', gameConfig)
                    if (newLobbyId) {
                        setMultiplayerMode('waiting')
                    }
                }}
                onJoin={() => setMultiplayerMode('join')}
                onBack={() => setMultiplayerMode(null)}
            />
        )
    }

    if (phase === 'MENU' && multiplayerMode === 'join') {
        return (
            <JoinGameScreen
                gameConfig={gameConfig}
                initialLobbyCode={initialLobbyCode || ''}
                onJoinLobby={async (joinLobbyId, name, slot) => {
                    const success = await joinGame(joinLobbyId, name, slot)
                    if (success) {
                        setInitialLobbyCode(null) // Clear after successful join
                        setMultiplayerMode('waiting')
                    }
                }}
                onBack={() => {
                    setInitialLobbyCode(null) // Clear when going back
                    setMultiplayerMode('select')
                }}
            />
        )
    }

    if (phase === 'MENU' && multiplayerMode === 'waiting') {
        return (
            <MultiplayerWaitingRoom
                gameConfig={gameConfig}
                eventsEnabled={eventsEnabled}
                onUpdateGameConfig={(updates) => dispatch(actions.updateGameConfig(updates))}
                onSetSubfaction={(subfaction) => dispatch(actions.setSubfaction(subfaction))}
                onSetEventsEnabled={(enabled) => dispatch(actions.setEventsEnabled(enabled))}
                onStartGame={async (actualPlayerCount) => {
                    // Host starts the multiplayer game and proceeds to lobby configuration
                    // Update the player count to match how many actually joined
                    dispatch(actions.updateGameConfig({ playerCount: actualPlayerCount }))
                    await startMultiplayerGame()
                    dispatch(actions.setPhase('LOBBY'))
                }}
                onLeave={async () => {
                    await disconnect()
                    setMultiplayerMode(null)
                }}
            />
        )
    }

    if (phase === 'MENU') {
        return (
            <MenuScreen
                faction={gameConfig.faction}
                onStartSolo={startGame}
                onStartMultiplayer={() => setMultiplayerMode('select')}
                onLoadGame={() => fileInputRef.current?.click()}
                fileInputRef={fileInputRef}
                onImportGameState={importGameState}
                showExplainer={showExplainer}
                setShowExplainer={setShowExplainer}
                showPatchNotes={showPatchNotes}
                setShowPatchNotes={setShowPatchNotes}
                showGenAIDisclosure={showGenAIDisclosure}
                setShowGenAIDisclosure={setShowGenAIDisclosure}
                showContributors={showContributors}
                setShowContributors={setShowContributors}
                showRunHistory={showRunHistory}
                setShowRunHistory={setShowRunHistory}
                showRemoveCardConfirm={showRemoveCardConfirm}
                setShowRemoveCardConfirm={setShowRemoveCardConfirm}
                pendingCardRemoval={pendingCardRemoval}
                setPendingCardRemoval={setPendingCardRemoval}
                confirmRemoveCardFromDraft={confirmRemoveCardFromDraft}
            />
        )
    }

    // SOLO_CONFIG PHASE - Game configuration for solo play
    if (phase === 'SOLO_CONFIG') {
        return (
            <SoloConfigScreen
                gameConfig={gameConfig}
                eventsEnabled={eventsEnabled}
                onUpdateGameConfig={(updates) => dispatch(actions.updateGameConfig(updates))}
                onSetSubfaction={(subfaction) => dispatch(actions.setSubfaction(subfaction))}
                onSetEventsEnabled={(enabled) => dispatch(actions.setEventsEnabled(enabled))}
                onBack={() => dispatch(actions.setPhase('MENU'))}
                onContinue={() => dispatch(actions.setPhase('LOBBY'))}
            />
        )
    }

    if (phase === 'LOBBY') {
        return (
            <GameLobby
                gameConfig={gameConfig}
                onStartRun={startGameFromLobby}
                onCancel={() => dispatch(actions.setPhase('MENU'))}
            />
        )
    }

    if (phase === 'CUSTOM_SETUP') {
        // In multiplayer, only the host can configure custom setup
        // Clients should wait for the host to finish
        if (isMultiplayer && !isHost) {
            return (
                <LoadingScreen
                    title="HOST CONFIGURING CUSTOM START"
                    subtitle="Please wait while the host configures the starting difficulty and loadouts..."
                    factionColors={factionColors}
                />
            )
        }

        // Safety check: ensure customSetup.loadouts exists before proceeding
        if (!customSetup || !customSetup.loadouts) {
            return <LoadingScreen title="LOADING..." factionColors={factionColors} />
        }

        const updateLoadoutSlot = (playerIdx: number, slotType: string, itemId: string | null) => {
            const newLoadouts = [...customSetup.loadouts]
            if (slotType === 'stratagem' && itemId) {
                const slotIndex = parseInt(itemId.split('_')[1])
                const stratagems = [...newLoadouts[playerIdx].stratagems]
                stratagems[slotIndex] = itemId.split('_')[0]
                newLoadouts[playerIdx] = { ...newLoadouts[playerIdx], stratagems }
            } else {
                newLoadouts[playerIdx] = { ...newLoadouts[playerIdx], [slotType]: itemId }
            }
            dispatch(actions.updateCustomSetup({ loadouts: newLoadouts }))
        }

        const currentLoadout = customSetup.loadouts[selectedPlayer]
        const itemsByType = {
            primary: MASTER_DB.filter((i) => i.type === TYPE.PRIMARY),
            secondary: MASTER_DB.filter((i) => i.type === TYPE.SECONDARY),
            grenade: MASTER_DB.filter((i) => i.type === TYPE.GRENADE),
            armor: MASTER_DB.filter((i) => i.type === TYPE.ARMOR),
            booster: MASTER_DB.filter((i) => i.type === TYPE.BOOSTER),
            stratagem: MASTER_DB.filter((i) => i.type === TYPE.STRATAGEM),
        }

        return (
            <PageWrapper $withPadding>
                <CenteredContent>
                    <SectionHeader $center $marginBottom={SPACING.xxl}>
                        <CustomSetupPhaseTitle $color={factionColors.PRIMARY}>
                            CUSTOM START SETUP
                        </CustomSetupPhaseTitle>
                        <PhaseDescription>
                            Configure starting difficulty and loadouts
                        </PhaseDescription>
                    </SectionHeader>

                    {/* Difficulty Selection */}
                    <SectionBoxSpaced $marginBottom={SPACING.xl}>
                        <FormSectionLabel>Starting Difficulty</FormSectionLabel>
                        <DifficultyGrid>
                            {DIFFICULTY_CONFIG.map((diff) => (
                                <DifficultyButton
                                    key={diff.level}
                                    onClick={() =>
                                        dispatch(
                                            actions.updateCustomSetup({ difficulty: diff.level }),
                                        )
                                    }
                                    $selected={customSetup.difficulty === diff.level}
                                    $factionColor={factionColors.PRIMARY}
                                    title={diff.name}
                                >
                                    {diff.level}
                                </DifficultyButton>
                            ))}
                        </DifficultyGrid>
                        <DifficultyLabel $color={factionColors.PRIMARY}>
                            {DIFFICULTY_CONFIG[customSetup.difficulty - 1]?.name}
                        </DifficultyLabel>
                    </SectionBoxSpaced>

                    {/* Player Tabs */}
                    <PlayerTabs>
                        {customSetup.loadouts.map((_, i) => (
                            <PlayerTab
                                key={i}
                                onClick={() => setSelectedPlayer(i)}
                                $active={selectedPlayer === i}
                                $factionColor={factionColors.PRIMARY}
                            >
                                Helldiver {i + 1}
                            </PlayerTab>
                        ))}
                    </PlayerTabs>

                    {/* Loadout Editor */}
                    <SectionBox>
                        <LoadoutConfigTitle $color={factionColors.PRIMARY}>
                            Loadout Configuration
                        </LoadoutConfigTitle>

                        {/* Primary */}
                        <LoadoutFieldSpaced $marginBottom={SPACING.lg}>
                            <LoadoutFieldLabel>Primary</LoadoutFieldLabel>
                            <LoadoutSelectColored
                                value={currentLoadout.primary || ''}
                                onChange={(e) =>
                                    updateLoadoutSlot(
                                        selectedPlayer,
                                        'primary',
                                        e.target.value || null,
                                    )
                                }
                                $color={factionColors.PRIMARY}
                            >
                                <option value="">None</option>
                                {itemsByType.primary.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.rarity})
                                    </option>
                                ))}
                            </LoadoutSelectColored>
                        </LoadoutFieldSpaced>

                        {/* Secondary */}
                        <LoadoutFieldSpaced $marginBottom={SPACING.lg}>
                            <LoadoutFieldLabel>Secondary</LoadoutFieldLabel>
                            <LoadoutSelect
                                value={currentLoadout.secondary || ''}
                                onChange={(e) =>
                                    updateLoadoutSlot(
                                        selectedPlayer,
                                        'secondary',
                                        e.target.value || null,
                                    )
                                }
                            >
                                <option value="">None</option>
                                {itemsByType.secondary.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.rarity})
                                    </option>
                                ))}
                            </LoadoutSelect>
                        </LoadoutFieldSpaced>

                        {/* Grenade */}
                        <LoadoutFieldSpaced $marginBottom={SPACING.lg}>
                            <LoadoutFieldLabel>Grenade</LoadoutFieldLabel>
                            <LoadoutSelect
                                value={currentLoadout.grenade || ''}
                                onChange={(e) =>
                                    updateLoadoutSlot(
                                        selectedPlayer,
                                        'grenade',
                                        e.target.value || null,
                                    )
                                }
                            >
                                <option value="">None</option>
                                {itemsByType.grenade.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.rarity})
                                    </option>
                                ))}
                            </LoadoutSelect>
                        </LoadoutFieldSpaced>

                        {/* Armor */}
                        <LoadoutFieldSpaced $marginBottom={SPACING.lg}>
                            <LoadoutFieldLabel>Armor</LoadoutFieldLabel>
                            <LoadoutSelect
                                value={currentLoadout.armor || ''}
                                onChange={(e) =>
                                    updateLoadoutSlot(
                                        selectedPlayer,
                                        'armor',
                                        e.target.value || null,
                                    )
                                }
                            >
                                <option value="">None</option>
                                {itemsByType.armor.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.rarity})
                                    </option>
                                ))}
                            </LoadoutSelect>
                        </LoadoutFieldSpaced>

                        {/* Booster */}
                        <LoadoutFieldSpaced $marginBottom={SPACING.lg}>
                            <LoadoutFieldLabel>Booster</LoadoutFieldLabel>
                            <LoadoutSelect
                                value={currentLoadout.booster || ''}
                                onChange={(e) =>
                                    updateLoadoutSlot(
                                        selectedPlayer,
                                        'booster',
                                        e.target.value || null,
                                    )
                                }
                            >
                                <option value="">None</option>
                                {itemsByType.booster.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.rarity})
                                    </option>
                                ))}
                            </LoadoutSelect>
                        </LoadoutFieldSpaced>

                        {/* Stratagems */}
                        <LoadoutField>
                            <LoadoutFieldLabel>Stratagems</LoadoutFieldLabel>
                            <StratagemGrid>
                                {[0, 1, 2, 3].map((slotIdx) => (
                                    <StratagemSelect
                                        key={slotIdx}
                                        value={currentLoadout.stratagems[slotIdx] || ''}
                                        onChange={(e) => {
                                            const newStratagems = [...currentLoadout.stratagems]
                                            newStratagems[slotIdx] = e.target.value || null
                                            // Update stratagems directly on loadout
                                            const newLoadouts = [...customSetup.loadouts]
                                            newLoadouts[selectedPlayer] = {
                                                ...newLoadouts[selectedPlayer],
                                                stratagems: newStratagems,
                                            }
                                            dispatch(
                                                actions.updateCustomSetup({
                                                    loadouts: newLoadouts,
                                                }),
                                            )
                                        }}
                                    >
                                        <option value="">Slot {slotIdx + 1}: None</option>
                                        {itemsByType.stratagem.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </StratagemSelect>
                                ))}
                            </StratagemGrid>
                        </LoadoutField>
                    </SectionBox>

                    {/* Action Buttons */}
                    <CustomSetupActions>
                        <FlexButton
                            onClick={() => dispatch(actions.setPhase('MENU'))}
                            $variant="danger"
                        >
                            Back to Menu
                        </FlexButton>
                        <StartOperationButton onClick={startGameFromCustomSetup} $variant="primary">
                            Start Operation
                        </StartOperationButton>
                    </CustomSetupActions>
                </CenteredContent>
            </PageWrapper>
        )
    }

    if (phase === 'EVENT') {
        if (!currentEvent) {
            dispatch(actions.setPhase('DRAFT'))
            return null
        }

        const handleEventChoice = (choice?: EventChoice) => {
            // Track event choice
            trackEventChoice(currentEvent?.type || 'unknown', choice?.text || 'unknown')

            // Record event for analytics
            runAnalytics.recordGameEvent(
                currentEvent?.id || 'unknown',
                currentEvent?.name || 'Unknown Event',
                currentEvent?.type || 'unknown',
                choice?.text || 'Unknown Choice',
                currentDiff,
                players.map((p) => p.id),
            )

            // Process outcomes using the event processor with selections
            // Transform our StratagemSelection types to EventSelections format
            const selections: import('./systems/events/eventProcessor').EventSelections = {
                sourcePlayerSelection: eventSourcePlayerSelection,
                stratagemSelection: eventStratagemSelection
                    ? {
                          stratagemId: eventStratagemSelection.stratagemId,
                          stratagemSlotIndex: eventStratagemSelection.stratagemSlotIndex,
                      }
                    : undefined,
                targetPlayerSelection: eventTargetPlayerSelection,
                targetStratagemSelection: eventTargetStratagemSelection
                    ? {
                          stratagemSlotIndex: eventTargetStratagemSelection.stratagemSlotIndex,
                      }
                    : undefined,
            }

            const updates = processAllOutcomes(
                choice?.outcomes || [],
                choice || null,
                {
                    players,
                    eventPlayerChoice,
                    requisition,
                    currentDiff,
                    gameConfig,
                    burnedCards,
                },
                selections,
            )

            // Check if we need booster selection
            if (updates.needsBoosterSelection && updates.boosterDraft) {
                dispatch(actions.setEventBoosterDraft(updates.boosterDraft))
                // Store the outcome for later application
                window.__boosterOutcome = updates.boosterOutcome

                // Burn both booster options shown in the draft
                if (updates.burnBoosterDraft && updates.burnBoosterDraft.length > 0) {
                    updates.burnBoosterDraft.forEach((boosterId) => {
                        dispatch(actions.addBurnedCard(boosterId))
                    })
                }

                return // Don't close event yet, wait for booster selection
            }

            // Check if we need subfaction selection
            if (updates.needsSubfactionSelection && updates.pendingFaction) {
                dispatch(actions.setPendingFaction(updates.pendingFaction as Faction))
                return // Don't close event yet, wait for subfaction selection
            }

            // Check if we need special draft (throwable or secondary for all players)
            if (updates.needsSpecialDraft && updates.specialDraftType) {
                // Generate draft pool based on type
                const itemType =
                    updates.specialDraftType === 'throwable' ? TYPE.GRENADE : TYPE.SECONDARY
                let availableItems = MASTER_DB.filter((item) => item.type === itemType)

                // Filter out burned cards if burn mode is enabled
                if (gameConfig.burnCards && burnedCards.length > 0) {
                    availableItems = availableItems.filter((item) => !burnedCards.includes(item.id))
                }

                // For throwables, enforce global uniqueness (each must be different across all players)
                if (updates.specialDraftType === 'throwable' && gameConfig.globalUniqueness) {
                    const existingThrowables = new Set()
                    players.forEach((player) => {
                        if (player.loadout.grenade) {
                            existingThrowables.add(player.loadout.grenade)
                        }
                    })
                    availableItems = availableItems.filter(
                        (item) => !existingThrowables.has(item.id),
                    )
                }

                // Set up special draft state
                dispatch(actions.setEventSpecialDraft(availableItems))
                dispatch(actions.setEventSpecialDraftType(updates.specialDraftType))
                dispatch(
                    actions.setEventSpecialDraftSelections(new Array(players.length).fill(null)),
                )

                // Apply player updates (armor changes)
                if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players))

                return // Don't close event yet, wait for all players to select
            }

            // Apply state updates
            if (updates.requisition !== undefined)
                dispatch(actions.setRequisition(updates.requisition))
            if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players))
            if (updates.currentDiff !== undefined)
                dispatch(actions.setDifficulty(updates.currentDiff))
            if (updates.faction !== undefined || updates.subfaction !== undefined) {
                const configUpdates: { faction?: Faction; subfaction?: string } = {}
                if (updates.faction !== undefined)
                    configUpdates.faction = updates.faction as Faction
                if (updates.subfaction !== undefined && updates.subfaction !== null)
                    configUpdates.subfaction = updates.subfaction
                dispatch(actions.updateGameConfig(configUpdates))
            }
            if (updates.bonusRequisition !== undefined)
                dispatch(actions.addRequisition(updates.bonusRequisition))

            // Handle burned cards from transformation
            if (updates.newBurnedCards && updates.newBurnedCards.length > 0) {
                updates.newBurnedCards.forEach((cardId) => dispatch(actions.addBurnedCard(cardId)))
            }

            // Display transformed slots
            if (updates.transformedSlots && updates.transformedSlots.length > 0) {
                const transformedSlots = updates.transformedSlots
                const transformList = transformedSlots
                    .map(
                        (t) =>
                            `${t.slot.replace('_', ' ').toUpperCase()}: ${t.oldItem} → ${t.newItem}`,
                    )
                    .join('\n• ')
                setTimeout(() => {
                    alert(
                        `Quantum Reconfiguration Complete!\n\n${transformedSlots.length} item${transformedSlots.length > 1 ? 's' : ''} transformed:\n\n• ${transformList}`,
                    )
                }, 100)
            }

            // Check if we need to immediately start a redraft
            if (updates.needsRedraft && updates.redraftPlayerIndex !== undefined) {
                // Show liquidated items message
                if (updates.liquidatedItems && updates.liquidatedItems.length > 0) {
                    const liquidatedItems = updates.liquidatedItems
                    const itemsList = liquidatedItems.join('\n• ')
                    const draftCount = updates.redraftCount || 1
                    setTimeout(() => {
                        alert(
                            `Assets Liquidated (${liquidatedItems.length} items):\n\n• ${itemsList}\n\nYou will now complete ${draftCount} draft round${draftCount > 1 ? 's' : ''} to rebuild your loadout.`,
                        )
                    }, 100)
                }

                // Close event
                dispatch(actions.setCurrentEvent(null))
                dispatch(actions.resetEventSelections())

                // Get the updated players
                const updatedPlayers = updates.players || players

                // Start first draft round for the redrafting player
                const redraftPlayer = updatedPlayers[updates.redraftPlayerIndex]
                const playerLockedSlots = redraftPlayer?.lockedSlots || []
                const redraftHand = generateDraftHand(
                    redraftPlayer,
                    currentDiff,
                    gameConfig,
                    burnedCards,
                    updatedPlayers,
                    (cardId) => dispatch(actions.addBurnedCard(cardId)),
                    getDraftHandSize(gameConfig.starRating),
                    playerLockedSlots,
                )

                dispatch(
                    actions.setDraftState(
                        createDraftState({
                            activePlayerIndex: updates.redraftPlayerIndex,
                            roundCards: redraftHand,
                            isRerolling: false,
                            pendingStratagem: null,
                            extraDraftRound: 0,
                            isRedrafting: true, // Flag to indicate this is a redraft
                            draftOrder: [updates.redraftPlayerIndex], // Single player redraft
                        }),
                    ),
                )
                dispatch(actions.setPhase('DRAFT'))
                return
            }

            // Display removed item notification
            if (updates.removedItemName) {
                const itemType =
                    updates.removedItemType === 'stratagem'
                        ? 'Stratagem'
                        : updates.removedItemType === 'primary'
                          ? 'Primary Weapon'
                          : updates.removedItemType === 'secondary'
                            ? 'Secondary Weapon'
                            : 'Grenade'
                setTimeout(() => {
                    alert(
                        `Equipment Confiscated: ${updates.removedItemName} (${itemType}) has been removed from your loadout.`,
                    )
                }, 100)
            }

            // Display gained item notification (single player)
            if (updates.gainedItemName) {
                setTimeout(() => {
                    alert(
                        `Equipment Acquired: ${updates.gainedItemName} has been added to your loadout!`,
                    )
                }, 100)
            }

            // Display gained items notification (multiple players)
            if (updates.gainedItems && updates.gainedItems.length > 0) {
                const gainedItems = updates.gainedItems
                setTimeout(() => {
                    const itemList = gainedItems
                        .map((item) => `${state.players[item.playerIndex].name}: ${item.itemName}`)
                        .join('\n')
                    alert(`Equipment Acquired:\n${itemList}`)
                }, 100)
            }

            // Handle game over
            if (updates.triggerGameOver) {
                // Finalize and save run analytics
                const analyticsSnapshot = runAnalytics.finalizeRun('defeat', state)
                dispatch(actions.setRunAnalyticsData(analyticsSnapshot))
                saveRunToHistory(analyticsSnapshot)

                setTimeout(() => dispatch(actions.setPhase('GAMEOVER')), 100)
                return
            }

            // After event, proceed to dashboard
            dispatch(actions.setCurrentEvent(null))
            dispatch(actions.resetEventSelections())
            dispatch(actions.setPhase('DASHBOARD'))
        }

        const handleAutoContinue = () => {
            // Handle booster selection confirmation
            if (eventBoosterDraft && eventBoosterSelection) {
                const outcome = window.__boosterOutcome as EventOutcome
                const newPlayers = applyGainBoosterWithSelection(
                    players,
                    outcome,
                    eventPlayerChoice,
                    eventBoosterSelection,
                )
                dispatch(actions.setPlayers(newPlayers))

                // Clean up and close event
                window.__boosterOutcome = null
                dispatch(actions.setCurrentEvent(null))
                dispatch(actions.resetEventSelections())
                dispatch(actions.setPhase('DASHBOARD'))
                return
            }

            // Handle special draft completion (all players have selected)
            if (eventSpecialDraft && eventSpecialDraftType) {
                // Check if all players have their selections stored
                const allPlayersSelected =
                    Array.isArray(eventSpecialDraftSelections) &&
                    eventSpecialDraftSelections.length === players.length &&
                    eventSpecialDraftSelections.every(
                        (selection) => selection !== null && selection !== undefined,
                    )

                if (!allPlayersSelected) {
                    return
                }

                const newPlayers = [...players]
                const selections = eventSpecialDraftSelections

                // Apply selections and burn cards
                selections.forEach((itemId, playerIndex) => {
                    if (eventSpecialDraftType === 'throwable') {
                        newPlayers[playerIndex].loadout.grenade = itemId
                    } else if (eventSpecialDraftType === 'secondary') {
                        newPlayers[playerIndex].loadout.secondary = itemId
                    }

                    // Burn the selected card if burn mode is enabled
                    if (gameConfig.burnCards) {
                        dispatch(actions.addBurnedCard(itemId))
                    }
                })

                dispatch(actions.setPlayers(newPlayers))

                // Clean up
                dispatch(actions.setCurrentEvent(null))
                dispatch(actions.resetEventSelections())
                dispatch(actions.setPhase('DASHBOARD'))
                return
            }

            if (currentEvent.outcomes) {
                let outcomesToProcess: EventOutcome[] = []

                if (currentEvent.type === EVENT_TYPES.RANDOM) {
                    // Pick weighted random outcome
                    const totalWeight = currentEvent.outcomes.reduce(
                        (sum, o) => sum + (o.weight || 1),
                        0,
                    )
                    let random = Math.random() * totalWeight
                    for (const outcome of currentEvent.outcomes) {
                        random -= outcome.weight || 1
                        if (random <= 0) {
                            outcomesToProcess = [outcome]
                            break
                        }
                    }
                } else {
                    // Process all outcomes for BENEFICIAL/DETRIMENTAL
                    outcomesToProcess = currentEvent.outcomes
                }

                // Process outcomes using the event processor
                const updates = processAllOutcomes(outcomesToProcess, null, {
                    players,
                    eventPlayerChoice,
                    requisition,
                    currentDiff,
                    gameConfig,
                    burnedCards,
                })

                // Apply state updates
                if (updates.requisition !== undefined)
                    dispatch(actions.setRequisition(updates.requisition))
                if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players))
                if (updates.currentDiff !== undefined)
                    dispatch(actions.setDifficulty(updates.currentDiff))
                if (updates.faction !== undefined || updates.subfaction !== undefined) {
                    const configUpdates: { faction?: Faction; subfaction?: string } = {}
                    if (updates.faction !== undefined)
                        configUpdates.faction = updates.faction as Faction
                    if (updates.subfaction !== undefined && updates.subfaction !== null)
                        configUpdates.subfaction = updates.subfaction
                    dispatch(actions.updateGameConfig(configUpdates))
                }

                // Handle game over
                if (updates.triggerGameOver) {
                    // Finalize and save run analytics
                    const analyticsSnapshot = runAnalytics.finalizeRun('defeat', state)
                    dispatch(actions.setRunAnalyticsData(analyticsSnapshot))
                    saveRunToHistory(analyticsSnapshot)

                    setTimeout(() => dispatch(actions.setPhase('GAMEOVER')), 100)
                    return
                }
            }

            dispatch(actions.setCurrentEvent(null))
            dispatch(actions.resetEventSelections())
            dispatch(actions.setPhase('DASHBOARD'))
        }

        const handleSkipEvent = () => {
            // Emergency skip for beta testing - helps escape soft-locks
            dispatch(actions.setCurrentEvent(null))
            dispatch(actions.resetEventSelections())
            dispatch(actions.setPhase('DASHBOARD'))
        }

        return (
            <EventPageWrapper>
                {/* MULTIPLAYER STATUS BAR */}
                {isMultiplayer && (
                    <MultiplayerStatusBar gameConfig={gameConfig} onDisconnect={disconnect} />
                )}

                <EventDisplay
                    currentEvent={currentEvent}
                    eventPlayerChoice={eventPlayerChoice}
                    eventSourcePlayerSelection={eventSourcePlayerSelection}
                    eventStratagemSelection={eventStratagemSelection}
                    eventTargetPlayerSelection={eventTargetPlayerSelection}
                    eventTargetStratagemSelection={eventTargetStratagemSelection}
                    eventBoosterDraft={eventBoosterDraft}
                    eventBoosterSelection={eventBoosterSelection}
                    eventSpecialDraft={eventSpecialDraft}
                    eventSpecialDraftType={eventSpecialDraftType}
                    eventSpecialDraftSelections={eventSpecialDraftSelections}
                    eventSelectedChoice={eventSelectedChoice}
                    pendingFaction={pendingFaction}
                    pendingSubfactionSelection={pendingSubfactionSelection as Subfaction | null}
                    players={players}
                    currentDiff={currentDiff}
                    requisition={requisition}
                    isHost={!isMultiplayer || isHost}
                    isMultiplayer={isMultiplayer}
                    playerSlot={playerSlot}
                    needsPlayerChoice={needsPlayerChoice}
                    canAffordChoice={canAffordChoice}
                    formatOutcome={formatOutcome}
                    formatOutcomes={formatOutcomes}
                    connectedPlayerIndices={isMultiplayer ? getConnectedPlayerIndices() : null}
                    onPlayerChoice={(choice) => dispatch(actions.setEventPlayerChoice(choice))}
                    onEventChoice={handleEventChoice}
                    onAutoContinue={handleAutoContinue}
                    onSkipEvent={handleSkipEvent}
                    onSourcePlayerSelection={(playerIndex) =>
                        dispatch(actions.setEventSourcePlayerSelection(playerIndex))
                    }
                    onStratagemSelection={(selection) =>
                        dispatch(actions.setEventStratagemSelection(selection))
                    }
                    onTargetPlayerSelection={(playerIndex) =>
                        dispatch(actions.setEventTargetPlayerSelection(playerIndex))
                    }
                    onTargetStratagemSelection={(selection) =>
                        dispatch(actions.setEventTargetStratagemSelection(selection))
                    }
                    onBoosterSelection={(boosterId) =>
                        dispatch(actions.setEventBoosterSelection(boosterId))
                    }
                    onEventSelectedChoice={(choice) =>
                        dispatch(actions.setEventSelectedChoice(choice))
                    }
                    onSubfactionSelection={(subfaction) => {
                        // Only host can select subfaction in multiplayer
                        if (isMultiplayer && !isHost) return
                        dispatch(actions.setPendingSubfactionSelection(subfaction))
                    }}
                    onConfirmSubfaction={() => {
                        // Only host can confirm subfaction in multiplayer
                        if (isMultiplayer && !isHost) return

                        // Apply the faction and subfaction change
                        dispatch(
                            actions.updateGameConfig({
                                faction: pendingFaction ?? undefined,
                                subfaction: pendingSubfactionSelection ?? undefined,
                            }),
                        )
                        // Close the event
                        dispatch(actions.setCurrentEvent(null))
                        dispatch(actions.setEventPlayerChoice(null))
                        dispatch(actions.resetEventSelections())
                        dispatch(actions.setPhase('DASHBOARD'))
                    }}
                    onSpecialDraftSelection={(playerIndex, itemId) => {
                        if (isMultiplayer && playerSlot !== playerIndex) {
                            return
                        }

                        if (isMultiplayer && !isHost) {
                            sendAction({
                                type: 'SET_EVENT_SPECIAL_DRAFT_SELECTION',
                                payload: {
                                    playerIndex,
                                    itemId,
                                },
                            })
                            return
                        }

                        dispatch(actions.setEventSpecialDraftSelection({ playerIndex, itemId }))
                    }}
                    onConfirmSelections={handleEventChoice}
                />
            </EventPageWrapper>
        )
    }

    // SACRIFICE PHASE
    if (phase === 'SACRIFICE') {
        const playerIndex = sacrificeState.activePlayerIndex
        const player = players[playerIndex]

        // In multiplayer, check if it's this player's turn to sacrifice
        const isMyTurn = !isMultiplayer || playerSlot === sacrificeState.activePlayerIndex

        // eslint-disable-next-line no-console
        console.log('SACRIFICE PHASE RENDER:', {
            playerIndex,
            playerName: player?.name,
            isMultiplayer,
            playerSlot,
            activePlayerIndex: sacrificeState.activePlayerIndex,
            isMyTurn,
            showSacrificeConfirm,
            pendingSacrificeItem,
        })

        if (!player) {
            console.error(
                'SACRIFICE: Invalid player index',
                playerIndex,
                'players:',
                players.length,
            )
            return <div>Error: Invalid player state</div>
        }

        const sacrificableItems: (Item & { slot: string })[] = []

        // Collect all sacrificable items from player's loadout
        // Cannot sacrifice P2-Peacemaker (s_peacemaker) or B-01 Tactical (a_b01)
        if (player.loadout.primary) {
            const item = getItemById(player.loadout.primary)
            if (item) sacrificableItems.push({ ...item, slot: 'Primary' })
        }

        if (player.loadout.secondary && player.loadout.secondary !== 's_peacemaker') {
            const item = getItemById(player.loadout.secondary)
            if (item) sacrificableItems.push({ ...item, slot: 'Secondary' })
        }

        if (player.loadout.grenade && player.loadout.grenade !== 'g_he') {
            const item = getItemById(player.loadout.grenade)
            if (item) sacrificableItems.push({ ...item, slot: 'Grenade' })
        }

        if (player.loadout.armor && player.loadout.armor !== 'a_b01') {
            const item = getItemById(player.loadout.armor)
            if (item) sacrificableItems.push({ ...item, slot: 'Armor' })
        }

        if (player.loadout.booster) {
            const item = getItemById(player.loadout.booster)
            if (item) sacrificableItems.push({ ...item, slot: 'Booster' })
        }

        player.loadout.stratagems.forEach((sid, idx) => {
            if (sid) {
                const item = getItemById(sid)
                if (item) sacrificableItems.push({ ...item, slot: `Stratagem ${idx + 1}` })
            }
        })

        return (
            <PageWrapper $withPadding style={{ display: 'flex', flexDirection: 'column' }}>
                <ExportRow>
                    <ExportButton onClick={exportGameState} factionColors={factionColors} />
                </ExportRow>

                <CenteredContent>
                    <SacrificeHeader>
                        <SacrificePenaltyBadge>
                            <SacrificePenaltyTitle>
                                ⚠️ EXTRACTION FAILURE PENALTY
                            </SacrificePenaltyTitle>
                            <SacrificePenaltySubtext>
                                Equipment Lost in Combat Zone
                            </SacrificePenaltySubtext>
                        </SacrificePenaltyBadge>

                        <PhaseTitle>
                            {player.name} <TitleSeparator>//</TitleSeparator> Sacrifice Item
                        </PhaseTitle>
                        <PhaseDescription>
                            Select one item from your loadout to sacrifice (minimum gear protected)
                        </PhaseDescription>
                    </SacrificeHeader>

                    {sacrificableItems.length === 0 ? (
                        <EmptyBox>
                            <EmptyIcon>🛡️</EmptyIcon>
                            <EmptyTitle $color={factionColors.PRIMARY}>
                                No Items to Sacrifice
                            </EmptyTitle>
                            <EmptyDescription>
                                You only have minimum required equipment (P2-Peacemaker & B-01
                                Tactical).
                            </EmptyDescription>
                            <Button
                                onClick={() => {
                                    // Skip this player - move to next or end sacrifice phase
                                    const currentIndex = sacrificeState.sacrificesRequired.indexOf(
                                        sacrificeState.activePlayerIndex,
                                    )
                                    const nextIndex = currentIndex + 1

                                    if (nextIndex < sacrificeState.sacrificesRequired.length) {
                                        dispatch(
                                            actions.updateSacrificeState({
                                                activePlayerIndex:
                                                    sacrificeState.sacrificesRequired[nextIndex],
                                            }),
                                        )
                                    } else {
                                        const resetPlayers = players.map((p) => ({
                                            ...p,
                                            extracted: true,
                                        }))
                                        dispatch(actions.setPlayers(resetPlayers))
                                        startDraftPhase()
                                    }
                                }}
                                $variant="primary"
                                style={{ marginTop: '24px' }}
                            >
                                Continue
                            </Button>
                        </EmptyBox>
                    ) : (
                        <ItemGrid
                            $columns={Math.min(sacrificableItems.length, 4)}
                            $disabled={!isMyTurn}
                        >
                            {sacrificableItems.map((item, idx) => (
                                <SacrificeCard
                                    key={`${item.id}-${idx}`}
                                    onClick={() => {
                                        // eslint-disable-next-line no-console
                                        console.log('Sacrifice card clicked!', {
                                            item,
                                            isMyTurn,
                                            showSacrificeConfirm,
                                        })
                                        if (!isMyTurn) {
                                            // eslint-disable-next-line no-console
                                            console.log('Not my turn, returning')
                                            return
                                        }
                                        // eslint-disable-next-line no-console
                                        console.log(
                                            'Setting pending sacrifice item and showing modal',
                                        )
                                        setPendingSacrificeItem(item)
                                        setShowSacrificeConfirm(true)
                                        // eslint-disable-next-line no-console
                                        console.log('State update calls completed')
                                    }}
                                    $interactive={isMyTurn}
                                >
                                    <SacrificeCardSlot>{item.slot}</SacrificeCardSlot>
                                    <SacrificeCardName>{item.name}</SacrificeCardName>
                                    <SacrificeCardRarity>{item.rarity}</SacrificeCardRarity>
                                    <SacrificeCardHint>Click to sacrifice</SacrificeCardHint>
                                </SacrificeCard>
                            ))}
                        </ItemGrid>
                    )}
                    {!isMyTurn && (
                        <SacrificeWaitSection>
                            <SacrificeWaitText>
                                Waiting for {player.name} to sacrifice an item...
                            </SacrificeWaitText>
                            <Caption>Please wait for your turn</Caption>
                        </SacrificeWaitSection>
                    )}
                </CenteredContent>

                {/* Sacrifice Item Confirmation Modal */}
                <SacrificeConfirmModal
                    isOpen={showSacrificeConfirm}
                    pendingSacrificeItem={pendingSacrificeItem}
                    onCancel={() => {
                        setShowSacrificeConfirm(false)
                        setPendingSacrificeItem(null)
                    }}
                    onConfirm={() => {
                        if (pendingSacrificeItem) {
                            handleSacrifice(pendingSacrificeItem)
                        }
                        setShowSacrificeConfirm(false)
                        setPendingSacrificeItem(null)
                    }}
                />
            </PageWrapper>
        )
    }

    if (phase === 'DRAFT') {
        const player = players[draftState.activePlayerIndex]

        // In multiplayer, check if it's this player's turn to draft
        const isMyTurn = !isMultiplayer || playerSlot === draftState.activePlayerIndex

        return (
            <PageWrapper>
                {/* MULTIPLAYER STATUS BAR */}
                {isMultiplayer && (
                    <MultiplayerStatusBar gameConfig={gameConfig} onDisconnect={disconnect} />
                )}

                <ContentWrapper>
                    <ExportRow>
                        <ExportButton onClick={exportGameState} factionColors={factionColors} />
                    </ExportRow>

                    {/* Stratagem Replacement Modal */}
                    <StratagemReplacementModal
                        isOpen={!!draftState.pendingStratagem}
                        pendingStratagem={draftState.pendingStratagem}
                        player={player}
                        factionColors={factionColors}
                        onSelectSlot={handleStratagemReplacement}
                        onCancel={() =>
                            dispatch(actions.updateDraftState({ pendingStratagem: null }))
                        }
                    />

                    <CenteredContent>
                        <SectionHeader $center $marginBottom="40px">
                            {draftState.isRetrospective && (
                                <AlertBox $variant="info">
                                    <AlertTitle $color="#3b82f6">
                                        🔄 RETROSPECTIVE DRAFT{' '}
                                        {(player.retrospectiveDraftsCompleted || 0) + 1}/
                                        {player.catchUpDraftsRemaining || draftHistory.length}
                                    </AlertTitle>
                                    <AlertSubtitle>
                                        Catching up on past mission rewards • No rerolls available
                                    </AlertSubtitle>
                                </AlertBox>
                            )}
                            {draftState.extraDraftRound > 0 && (
                                <AlertBox
                                    $variant="success"
                                    style={{
                                        backgroundColor: `${factionColors.PRIMARY}20`,
                                        borderColor: factionColors.PRIMARY,
                                    }}
                                >
                                    <AlertTitle $color={factionColors.PRIMARY}>
                                        🎁 BONUS DRAFT {draftState.extraDraftRound}/
                                        {player.extraDraftCards || 0}
                                    </AlertTitle>
                                    <AlertSubtitle>Priority Access Equipment</AlertSubtitle>
                                </AlertBox>
                            )}
                            {draftState.isRedrafting && (player.redraftRounds ?? 0) > 0 && (
                                <AlertBox $variant="error">
                                    <AlertTitle $color={factionColors.PRIMARY}>
                                        🔄 ASSET REINVESTMENT
                                    </AlertTitle>
                                    <AlertSubtitle>
                                        Draft {player.redraftRounds} of {player.redraftRounds}{' '}
                                        Remaining
                                    </AlertSubtitle>
                                </AlertBox>
                            )}
                            <PhaseSubtitle $color={factionColors.PRIMARY}>
                                Priority Requisition Authorized
                            </PhaseSubtitle>
                            <PhaseTitle>
                                {player.name} <TitleSeparator>//</TitleSeparator> Select Upgrade
                            </PhaseTitle>
                            <PhaseDescription>
                                Choose wisely. This equipment is vital for Difficulty {currentDiff}.
                            </PhaseDescription>
                        </SectionHeader>

                        {/* Current Loadout Overview */}
                        <LoadoutOverview>
                            <LoadoutLabel>{player.name}'s Current Loadout</LoadoutLabel>
                            <LoadoutItems>
                                {/* Primary */}
                                <LoadoutSlot>
                                    <LoadoutSlotLabel>Primary</LoadoutSlotLabel>
                                    <LoadoutSlotValue
                                        $hasItem={!!player.loadout.primary}
                                        $color={
                                            player.loadout.primary
                                                ? factionColors.PRIMARY
                                                : undefined
                                        }
                                    >
                                        {player.loadout.primary
                                            ? getItemById(player.loadout.primary)?.name || '—'
                                            : '—'}
                                    </LoadoutSlotValue>
                                </LoadoutSlot>

                                {/* Stratagems */}
                                <LoadoutSlot>
                                    <LoadoutSlotLabel>Stratagems</LoadoutSlotLabel>
                                    <StratagemGap>
                                        {player.loadout.stratagems.map((sid, i) => {
                                            const strat = sid ? getItemById(sid) : null
                                            return (
                                                <LoadoutSlotValue
                                                    key={i}
                                                    $hasItem={!!strat}
                                                    title={strat?.name || 'Empty'}
                                                >
                                                    {strat?.name || '—'}
                                                </LoadoutSlotValue>
                                            )
                                        })}
                                    </StratagemGap>
                                </LoadoutSlot>

                                {/* Secondary */}
                                <LoadoutSlot>
                                    <LoadoutSlotLabel>Secondary</LoadoutSlotLabel>
                                    <LoadoutSlotValue $hasItem={!!player.loadout.secondary}>
                                        {player.loadout.secondary
                                            ? getItemById(player.loadout.secondary)?.name || '—'
                                            : '—'}
                                    </LoadoutSlotValue>
                                </LoadoutSlot>

                                {/* Grenade */}
                                <LoadoutSlot>
                                    <LoadoutSlotLabel>Grenade</LoadoutSlotLabel>
                                    <LoadoutSlotValue $hasItem={!!player.loadout.grenade}>
                                        {player.loadout.grenade
                                            ? getItemById(player.loadout.grenade)?.name || '—'
                                            : '—'}
                                    </LoadoutSlotValue>
                                </LoadoutSlot>

                                {/* Armor */}
                                <LoadoutSlot>
                                    <LoadoutSlotLabel>Armor</LoadoutSlotLabel>
                                    <LoadoutSlotValue $hasItem={!!player.loadout.armor}>
                                        {player.loadout.armor
                                            ? getItemById(player.loadout.armor)?.name || '—'
                                            : '—'}
                                    </LoadoutSlotValue>
                                </LoadoutSlot>

                                {/* Booster */}
                                {player.loadout.booster && (
                                    <LoadoutSlot>
                                        <LoadoutSlotLabel>Booster</LoadoutSlotLabel>
                                        <LoadoutSlotValue $hasItem $special>
                                            {getItemById(player.loadout.booster)?.name || '—'}
                                        </LoadoutSlotValue>
                                    </LoadoutSlot>
                                )}
                            </LoadoutItems>
                        </LoadoutOverview>

                        {/* Filter out any null/undefined items that may have been stripped during sync */}
                        {(() => {
                            const validCards = (draftState.roundCards || []).filter(
                                (item): item is DraftHandItem =>
                                    item !== null &&
                                    item !== undefined &&
                                    (isItem(item)
                                        ? Boolean(item.id || item.name)
                                        : Boolean(item.passive)),
                            )
                            return (
                                <ItemGrid
                                    $columns={Math.min(validCards.length, 4)}
                                    $disabled={!isMyTurn}
                                >
                                    {validCards.map((item, idx) => (
                                        <ItemCard
                                            key={`${isItem(item) ? item.id : item.passive}-${idx}`}
                                            item={item}
                                            factionColors={factionColors}
                                            onSelect={isMyTurn ? handleDraftPick : undefined}
                                            onRemove={isMyTurn ? removeCardFromDraft : undefined}
                                            shouldPulse={isMyTurn}
                                            animationDelay={idx * 0.2}
                                        />
                                    ))}
                                </ItemGrid>
                            )
                        })()}

                        {/* Not your turn message */}
                        {!isMyTurn && (
                            <WaitingMessage>
                                <WaitingText>Waiting for {player.name} to draft...</WaitingText>
                            </WaitingMessage>
                        )}

                        {/* Only show draft controls if it's your turn */}
                        {isMyTurn && (
                            <>
                                <ButtonRow>
                                    {/* Disable rerolling during retrospective drafts */}
                                    {!draftState.isRetrospective && (
                                        <ActionButton
                                            onClick={() => rerollDraft(1)}
                                            disabled={requisition < 1}
                                            $variant="outline"
                                            $disabled={requisition < 1}
                                        >
                                            <RefreshCw size={20} />
                                            Reroll All Cards (-1 Req)
                                        </ActionButton>
                                    )}
                                    <SkipButton onClick={handleSkipDraft}>Skip Draft</SkipButton>
                                </ButtonRow>

                                <HintText $center $marginTop={SPACING.lg}>
                                    Click the × on a card to remove just that card (free)
                                    <br />
                                    Or use "Reroll All Cards" to reroll the entire hand
                                </HintText>
                            </>
                        )}

                        <RequisitionDisplay>
                            <MonoText $color={factionColors.PRIMARY}>
                                Current Requisition: {Math.floor(requisition)} R
                            </MonoText>
                        </RequisitionDisplay>
                    </CenteredContent>
                </ContentWrapper>

                {/* Remove Card Confirmation Modal */}
                <RemoveCardConfirmModal
                    isOpen={showRemoveCardConfirm}
                    pendingCardRemoval={pendingCardRemoval}
                    onCancel={() => {
                        setShowRemoveCardConfirm(false)
                        setPendingCardRemoval(null)
                    }}
                    onConfirm={confirmRemoveCardFromDraft}
                />
            </PageWrapper>
        )
    }

    // DASHBOARD PHASE
    return (
        <PageWrapper $withFooterMargin>
            {/* MULTIPLAYER STATUS BAR */}
            {isMultiplayer && (
                <MultiplayerStatusBar gameConfig={gameConfig} onDisconnect={disconnect} />
            )}

            {/* HEADER */}
            <GameHeader
                currentDiff={currentDiff}
                currentMission={currentMission}
                enduranceMode={gameConfig.enduranceMode}
                requisition={requisition}
                faction={gameConfig.faction}
                subfaction={gameConfig.subfaction as Subfaction}
                samples={state.samples}
                onExport={exportGameState}
                onHelp={() => setShowExplainer(true)}
            />

            {/* MAIN CONTENT */}
            <DashboardMain>
                {/* PLAYER ROSTER */}
                <PlayerRosterGrid $playerCount={gameConfig.playerCount}>
                    {players.map((player, index) => {
                        const {
                            getSlotLockCost,
                            MAX_LOCKED_SLOTS,
                        } = require('./constants/balancingConfig')
                        // In multiplayer, only allow the current player to lock their own slots
                        const isCurrentPlayer = !isMultiplayer || playerSlot === index
                        // Get connection status from lobby data if in multiplayer
                        const lobbyPlayer =
                            isMultiplayer && lobbyData?.players
                                ? Object.values(lobbyData.players).find((p) => p.slot === index)
                                : null
                        // Player is connected if: not multiplayer, or lobby player exists and is connected
                        const isConnected =
                            !isMultiplayer || (lobbyPlayer && lobbyPlayer.connected !== false)

                        // In multiplayer, hide loadouts for players not in the lobby (kicked)
                        // Only hide if we have lobbyData.players (so we know they're actually kicked, not just loading)
                        if (isMultiplayer && lobbyData?.players && !lobbyPlayer) {
                            return null
                        }

                        return (
                            <LoadoutDisplay
                                key={player.id}
                                player={player}
                                getItemById={getItemById}
                                getArmorComboDisplayName={getArmorComboDisplayName}
                                faction={gameConfig.faction}
                                requisition={requisition}
                                slotLockCost={getSlotLockCost(gameConfig.playerCount)}
                                maxLockedSlots={MAX_LOCKED_SLOTS}
                                onLockSlot={isCurrentPlayer ? handleLockSlot : undefined}
                                onUnlockSlot={isCurrentPlayer ? handleUnlockSlot : undefined}
                                isConnected={isConnected ?? undefined}
                                isMultiplayer={isMultiplayer}
                            />
                        )
                    })}
                </PlayerRosterGrid>

                {/* CONTROLS */}
                <ControlsSection>
                    {/* Mission Objective Header */}
                    <ObjectiveCard $factionColor={factionColors.PRIMARY}>
                        <ObjectiveTitle $color={factionColors.PRIMARY}>
                            📍 Current Objective
                        </ObjectiveTitle>
                        <ObjectiveText>
                            Complete a mission at Difficulty {currentDiff}
                            {gameConfig.enduranceMode &&
                                ` (Operation: ${currentMission}/${getMissionsForDifficulty(currentDiff)})`}
                        </ObjectiveText>
                    </ObjectiveCard>

                    <MissionStatusCard>
                        <MissionStatusTitle>Mission Status Report</MissionStatusTitle>
                        {gameConfig.enduranceMode && (
                            <OperationStatus $color={factionColors.PRIMARY}>
                                Operation Status: Mission {currentMission}/
                                {getMissionsForDifficulty(currentDiff)}
                            </OperationStatus>
                        )}

                        {/* Star Rating Selection */}
                        <RatingSection $disabled={isMultiplayer && !isHost}>
                            <RatingLabel>Mission Performance Rating</RatingLabel>
                            <StarRatingGrid $disabled={isMultiplayer && !isHost}>
                                {[1, 2, 3, 4, 5].map((n) => {
                                    const maxStars = getMaxStarsForDifficulty(currentDiff)
                                    const isDisabled = n > maxStars || (isMultiplayer && !isHost)

                                    return (
                                        <StarRatingButton
                                            key={n}
                                            onClick={() =>
                                                !isDisabled &&
                                                dispatch(
                                                    actions.updateGameConfig({ starRating: n }),
                                                )
                                            }
                                            disabled={isDisabled}
                                            $selected={gameConfig.starRating === n}
                                            $disabled={isDisabled}
                                            $factionColor={factionColors.PRIMARY}
                                        >
                                            <div>{n}</div>
                                            <StarIcon>★</StarIcon>
                                        </StarRatingButton>
                                    )
                                })}
                            </StarRatingGrid>
                            <RatingHint>
                                {getDraftHandSize(gameConfig.starRating)} equipment cards will be
                                offered
                            </RatingHint>
                        </RatingSection>

                        {/* Samples Collected */}
                        <SamplesSection $disabled={isMultiplayer && !isHost}>
                            <RatingLabel>
                                Samples Collected This Mission{' '}
                                {isMultiplayer && !isHost && (
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            color: '#64748b',
                                            fontWeight: 'normal',
                                        }}
                                    >
                                        (Host only)
                                    </span>
                                )}
                            </RatingLabel>
                            <SamplesGrid>
                                {/* Common Samples */}
                                <SampleColumn>
                                    <SampleHeader>
                                        <SampleIcon
                                            src="https://helldivers.wiki.gg/images/Common_Sample_Logo.svg"
                                            alt="Common"
                                        />
                                        <SampleLabel $color="#22c55e">Common</SampleLabel>
                                    </SampleHeader>
                                    <SampleInput
                                        type="number"
                                        min="0"
                                        max="999"
                                        defaultValue="0"
                                        id="commonSamples"
                                        disabled={isMultiplayer && !isHost}
                                        $borderColor="#22c55e"
                                        $disabled={isMultiplayer && !isHost}
                                    />
                                    <SampleHint>+1% event chance each</SampleHint>
                                </SampleColumn>

                                {/* Rare Samples */}
                                <SampleColumn>
                                    <SampleHeader>
                                        <SampleIcon
                                            src="https://helldivers.wiki.gg/images/Rare_Sample_Logo.svg"
                                            alt="Rare"
                                        />
                                        <SampleLabel $color="#f97316">Rare</SampleLabel>
                                    </SampleHeader>
                                    <SampleInput
                                        type="number"
                                        min="0"
                                        max="999"
                                        defaultValue="0"
                                        id="rareSamples"
                                        disabled={isMultiplayer && !isHost}
                                        $borderColor="#f97316"
                                        $disabled={isMultiplayer && !isHost}
                                    />
                                    <SampleHint>+2% event chance each</SampleHint>
                                </SampleColumn>

                                {/* Super Rare Samples */}
                                <SampleColumn>
                                    <SampleHeader>
                                        <SampleIcon
                                            src="https://helldivers.wiki.gg/images/Super_Sample_Logo.svg"
                                            alt="Super Rare"
                                        />
                                        <SampleLabel $color="#a855f7">Super Rare</SampleLabel>
                                    </SampleHeader>
                                    <SampleInput
                                        type="number"
                                        min="0"
                                        max="999"
                                        defaultValue="0"
                                        id="superRareSamples"
                                        disabled={isMultiplayer && !isHost}
                                        $borderColor="#a855f7"
                                        $disabled={isMultiplayer && !isHost}
                                    />
                                    <SampleHint>+3% event chance each</SampleHint>
                                </SampleColumn>
                            </SamplesGrid>
                            <SamplesNote>
                                Samples increase the chance of random events. Event chance resets to
                                base 0% when an event occurs.
                            </SamplesNote>
                        </SamplesSection>

                        {/* Extraction Status */}
                        <ExtractionSection>
                            <RatingLabel>Extraction Status</RatingLabel>
                            <ExtractionList>
                                {players.map((player, idx) => {
                                    // In multiplayer, clients can only toggle their own extraction status
                                    const canToggle = !isMultiplayer || isHost || idx === playerSlot

                                    const handleExtractionChange = (checked: boolean) => {
                                        if (!canToggle) return

                                        // Record death for analytics when player fails to extract
                                        if (!checked) {
                                            runAnalytics.recordPlayerDeath(
                                                player.id,
                                                player.name || `Player ${idx + 1}`,
                                                currentDiff,
                                                currentMission,
                                                'Failed to extract',
                                            )
                                        }

                                        // In multiplayer as client, send action to host
                                        if (isMultiplayer && !isHost) {
                                            sendAction({
                                                type: 'SET_PLAYER_EXTRACTED',
                                                payload: { playerIndex: idx, extracted: checked },
                                            })
                                        } else {
                                            dispatch(
                                                actions.setPlayerExtracted({
                                                    playerIndex: idx,
                                                    extracted: checked,
                                                }),
                                            )
                                        }
                                    }

                                    return (
                                        <ExtractionLabel
                                            key={player.id}
                                            $extracted={player.extracted !== false}
                                            $canToggle={canToggle}
                                        >
                                            <ExtractionCheckbox
                                                type="checkbox"
                                                checked={player.extracted !== false}
                                                onChange={(e) =>
                                                    handleExtractionChange(e.target.checked)
                                                }
                                                disabled={!canToggle}
                                                $canToggle={canToggle}
                                            />
                                            <ExtractionContent>
                                                <ExtractionName
                                                    $extracted={player.extracted !== false}
                                                >
                                                    {player.name} extracted
                                                </ExtractionName>
                                                {!player.extracted && gameConfig.brutalityMode && (
                                                    <ExtractionPenalty>
                                                        Must sacrifice item
                                                    </ExtractionPenalty>
                                                )}
                                                {!player.extracted &&
                                                    !gameConfig.brutalityMode &&
                                                    players.every((p) => !p.extracted) && (
                                                        <ExtractionPenalty>
                                                            TPK - Must sacrifice item
                                                        </ExtractionPenalty>
                                                    )}
                                            </ExtractionContent>
                                        </ExtractionLabel>
                                    )
                                })}
                            </ExtractionList>
                            <ExtractionNote>
                                {gameConfig.brutalityMode
                                    ? 'Brutality Mode: Non-extracted Helldivers must sacrifice equipment'
                                    : 'If all Helldivers fail to extract, all must sacrifice equipment'}
                            </ExtractionNote>
                        </ExtractionSection>

                        {/* Mission outcome buttons - only host can control in multiplayer */}
                        {!isMultiplayer || isHost ? (
                            <>
                                <MissionButtonRow>
                                    <MissionFailButton
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    'Mission Failed? This will end your run permanently. Are you sure?',
                                                )
                                            ) {
                                                try {
                                                    // Finalize and save run analytics
                                                    const analyticsSnapshot =
                                                        runAnalytics.finalizeRun('defeat', state)
                                                    dispatch(
                                                        actions.setRunAnalyticsData(
                                                            analyticsSnapshot,
                                                        ),
                                                    )
                                                    saveRunToHistory(analyticsSnapshot)

                                                    dispatch(actions.setPhase('GAMEOVER'))
                                                } catch (error) {
                                                    console.error(
                                                        'Error in mission failed handler:',
                                                        error,
                                                    )
                                                    // Still transition to GAMEOVER even if analytics fails
                                                    dispatch(actions.setPhase('GAMEOVER'))
                                                }
                                            }
                                        }}
                                    >
                                        <XCircle />
                                        Mission Failed
                                    </MissionFailButton>

                                    <MissionSuccessButton
                                        onClick={() => {
                                            // Debounce: prevent multiple clicks
                                            if (missionSuccessDebouncing) return

                                            // Set debounce state
                                            setMissionSuccessDebouncing(true)
                                            setTimeout(
                                                () => setMissionSuccessDebouncing(false),
                                                3000,
                                            ) // 3 second debounce

                                            // Scroll to top of page
                                            window.scrollTo({ top: 0, behavior: 'smooth' })

                                            // Collect samples from input fields
                                            const commonSamples = parseInt(
                                                (
                                                    document.getElementById(
                                                        'commonSamples',
                                                    ) as HTMLInputElement | null
                                                )?.value || '0',
                                                10,
                                            )
                                            const rareSamples = parseInt(
                                                (
                                                    document.getElementById(
                                                        'rareSamples',
                                                    ) as HTMLInputElement | null
                                                )?.value || '0',
                                                10,
                                            )
                                            const superRareSamples = parseInt(
                                                (
                                                    document.getElementById(
                                                        'superRareSamples',
                                                    ) as HTMLInputElement | null
                                                )?.value || '0',
                                                10,
                                            )

                                            // Add samples to total
                                            dispatch(
                                                actions.addSamples({
                                                    common: commonSamples,
                                                    rare: rareSamples,
                                                    superRare: superRareSamples,
                                                }),
                                            )

                                            // Record sample change for analytics (pass cumulative totals)
                                            runAnalytics.recordSampleChange(
                                                {
                                                    common: state.samples.common + commonSamples,
                                                    rare: state.samples.rare + rareSamples,
                                                    superRare:
                                                        state.samples.superRare + superRareSamples,
                                                },
                                                'mission_complete',
                                                `Collected from difficulty ${currentDiff} mission`,
                                            )

                                            // Clear input fields
                                            const commonInput = document.getElementById(
                                                'commonSamples',
                                            ) as HTMLInputElement | null
                                            const rareInput = document.getElementById(
                                                'rareSamples',
                                            ) as HTMLInputElement | null
                                            const superRareInput = document.getElementById(
                                                'superRareSamples',
                                            ) as HTMLInputElement | null
                                            if (commonInput) commonInput.value = '0'
                                            if (rareInput) rareInput.value = '0'
                                            if (superRareInput) superRareInput.value = '0'

                                            // Clear weapon restrictions from all players
                                            const updatedPlayers = players.map((p) => ({
                                                ...p,
                                                weaponRestricted: false,
                                            }))
                                            dispatch(actions.setPlayers(updatedPlayers))

                                            // Check if sacrifice is required (processed at end of each mission)
                                            let sacrificesRequired: number[] = []

                                            if (gameConfig.brutalityMode) {
                                                // Brutality mode: any non-extracted player must sacrifice
                                                sacrificesRequired = players
                                                    .map((p, idx) => ({ player: p, idx }))
                                                    .filter(({ player }) => !player.extracted)
                                                    .map(({ idx }) => idx)
                                            } else {
                                                // Non-brutality: only if ALL players failed to extract
                                                const allFailed = players.every((p) => !p.extracted)
                                                if (allFailed) {
                                                    sacrificesRequired = players.map(
                                                        (_, idx) => idx,
                                                    )
                                                }
                                            }

                                            // Endurance Mode logic
                                            if (gameConfig.enduranceMode) {
                                                const missionsRequired =
                                                    getMissionsForDifficulty(currentDiff)
                                                const isOperationComplete =
                                                    currentMission >= missionsRequired

                                                // Record mission complete for analytics (endurance mode)
                                                const starRating = Math.min(
                                                    Math.ceil(currentDiff / 2),
                                                    5,
                                                )
                                                const extractedCount = players.filter(
                                                    (p) => p.extracted,
                                                ).length
                                                runAnalytics.recordMissionComplete(
                                                    currentMission,
                                                    currentDiff,
                                                    starRating,
                                                    extractedCount,
                                                    players.length,
                                                )

                                                if (isOperationComplete) {
                                                    // Operation complete - give draft rewards and advance difficulty
                                                    const {
                                                        getRequisitionMultiplier,
                                                    } = require('./constants/balancingConfig')
                                                    const reqMultiplier = getRequisitionMultiplier(
                                                        gameConfig.playerCount,
                                                        gameConfig.subfaction,
                                                    )
                                                    const reqGained = 1 * reqMultiplier
                                                    dispatch(actions.addRequisition(reqGained))

                                                    // Record requisition gain for analytics
                                                    runAnalytics.recordRequisitionChange(
                                                        reqGained,
                                                        'System',
                                                        'Operation Complete Reward',
                                                    )

                                                    // Reset mission counter for next difficulty
                                                    dispatch(actions.setCurrentMission(1))

                                                    // Check for victory condition
                                                    if (
                                                        currentDiff === 10 &&
                                                        !gameConfig.endlessMode
                                                    ) {
                                                        const gameTimeSeconds = gameStartTime
                                                            ? Math.floor(
                                                                  (Date.now() - gameStartTime) /
                                                                      1000,
                                                              )
                                                            : 0
                                                        trackGameEnd(
                                                            isMultiplayer ? 'multiplayer' : 'solo',
                                                            currentMission,
                                                            gameTimeSeconds,
                                                            true,
                                                        )

                                                        // Finalize and save run analytics
                                                        const analyticsSnapshot =
                                                            runAnalytics.finalizeRun(
                                                                'victory',
                                                                state,
                                                            )
                                                        dispatch(
                                                            actions.setRunAnalyticsData(
                                                                analyticsSnapshot,
                                                            ),
                                                        )
                                                        saveRunToHistory(analyticsSnapshot)

                                                        dispatch(actions.setPhase('VICTORY'))
                                                        return
                                                    }

                                                    if (currentDiff < 10)
                                                        dispatch(
                                                            actions.setDifficulty(currentDiff + 1),
                                                        )

                                                    // Route to SACRIFICE, EVENT, or DRAFT based on operation end
                                                    if (sacrificesRequired.length > 0) {
                                                        dispatch(
                                                            actions.setSacrificeState({
                                                                activePlayerIndex:
                                                                    sacrificesRequired[0],
                                                                sacrificesRequired,
                                                            }),
                                                        )
                                                        dispatch(actions.setPhase('SACRIFICE'))
                                                    } else {
                                                        startDraftPhase()
                                                    }
                                                } else {
                                                    // Mission complete but operation continues - process penalties and events, but NO draft
                                                    dispatch(
                                                        actions.setCurrentMission(
                                                            currentMission + 1,
                                                        ),
                                                    )

                                                    // Process sacrifice if required (end of each mission)
                                                    if (sacrificesRequired.length > 0) {
                                                        dispatch(
                                                            actions.setSacrificeState({
                                                                activePlayerIndex:
                                                                    sacrificesRequired[0],
                                                                sacrificesRequired,
                                                            }),
                                                        )
                                                        dispatch(actions.setPhase('SACRIFICE'))
                                                    } else {
                                                        // Check for event (can occur at end of each mission)
                                                        if (tryTriggerRandomEvent()) {
                                                            return
                                                        }
                                                        // No event - stay on dashboard for next mission
                                                        // Reset extraction status for next mission
                                                        const resetPlayers = players.map((p) => ({
                                                            ...p,
                                                            extracted: true,
                                                        }))
                                                        dispatch(actions.setPlayers(resetPlayers))
                                                    }
                                                }
                                            } else {
                                                // Standard mode - original logic
                                                const {
                                                    getRequisitionMultiplier,
                                                } = require('./constants/balancingConfig')
                                                const reqMultiplier = getRequisitionMultiplier(
                                                    gameConfig.playerCount,
                                                    gameConfig.subfaction,
                                                )
                                                const reqGained = 1 * reqMultiplier
                                                dispatch(actions.addRequisition(reqGained))

                                                // Record requisition gain for analytics
                                                runAnalytics.recordRequisitionChange(
                                                    reqGained,
                                                    'System',
                                                    'Mission Complete Reward',
                                                )

                                                // Record mission complete for analytics
                                                const starRating = Math.min(
                                                    Math.ceil(currentDiff / 2),
                                                    5,
                                                )
                                                const extractedCount = players.filter(
                                                    (p) => p.extracted,
                                                ).length
                                                runAnalytics.recordMissionComplete(
                                                    currentMission,
                                                    currentDiff,
                                                    starRating,
                                                    extractedCount,
                                                    players.length,
                                                )

                                                // Track mission complete
                                                trackMissionComplete(
                                                    currentMission,
                                                    currentDiff,
                                                    true,
                                                )

                                                // Check for victory condition
                                                if (currentDiff === 10 && !gameConfig.endlessMode) {
                                                    const gameTimeSeconds = gameStartTime
                                                        ? Math.floor(
                                                              (Date.now() - gameStartTime) / 1000,
                                                          )
                                                        : 0
                                                    trackGameEnd(
                                                        isMultiplayer ? 'multiplayer' : 'solo',
                                                        currentMission,
                                                        gameTimeSeconds,
                                                        true,
                                                    )

                                                    // Finalize and save run analytics
                                                    const analyticsSnapshot =
                                                        runAnalytics.finalizeRun('victory', state)
                                                    dispatch(
                                                        actions.setRunAnalyticsData(
                                                            analyticsSnapshot,
                                                        ),
                                                    )
                                                    saveRunToHistory(analyticsSnapshot)

                                                    dispatch(actions.setPhase('VICTORY'))
                                                    return
                                                }

                                                if (currentDiff < 10)
                                                    dispatch(actions.setDifficulty(currentDiff + 1))

                                                // Route to SACRIFICE or DRAFT
                                                if (sacrificesRequired.length > 0) {
                                                    dispatch(
                                                        actions.setSacrificeState({
                                                            activePlayerIndex:
                                                                sacrificesRequired[0],
                                                            sacrificesRequired,
                                                        }),
                                                    )
                                                    dispatch(actions.setPhase('SACRIFICE'))
                                                } else {
                                                    startDraftPhase()
                                                }
                                            }
                                        }}
                                        disabled={missionSuccessDebouncing}
                                        $disabled={missionSuccessDebouncing}
                                    >
                                        <CheckCircle />
                                        {missionSuccessDebouncing
                                            ? 'Processing...'
                                            : 'Mission Success'}
                                    </MissionSuccessButton>
                                </MissionButtonRow>

                                <MissionReportHint>
                                    Report success to earn Requisition & proceed to draft.
                                </MissionReportHint>
                            </>
                        ) : (
                            <WaitingForHostBox>
                                <WaitingForHostText>
                                    ⏳ Waiting for host to report mission outcome...
                                </WaitingForHostText>
                                <WaitingForHostSubtext>
                                    Toggle your extraction status above while waiting.
                                </WaitingForHostSubtext>
                            </WaitingForHostBox>
                        )}
                    </MissionStatusCard>

                    {/* Debug Events Mode UI */}
                    {gameConfig.debugEventsMode && (
                        <DebugSection>
                            <DebugHeader>
                                <DebugTitle>🔧 Debug: Manual Event Trigger</DebugTitle>
                                <ResetSeenEventsButton
                                    onClick={() => dispatch(actions.resetSeenEvents())}
                                >
                                    Reset Seen Events
                                </ResetSeenEventsButton>
                            </DebugHeader>
                            <DebugGrid>
                                {EVENTS.map((event) => (
                                    <DebugButton
                                        key={event.id}
                                        onClick={() => {
                                            dispatch(actions.addSeenEvent(event.id))
                                            // Reset all event selections before setting new event to prevent stale state
                                            dispatch(actions.resetEventSelections())
                                            dispatch(actions.setCurrentEvent(event))
                                            dispatch(actions.setPhase('EVENT'))
                                        }}
                                        disabled={seenEvents.includes(event.id)}
                                        $seen={seenEvents.includes(event.id)}
                                    >
                                        <DebugButtonTitle>{event.name}</DebugButtonTitle>
                                        <DebugButtonSubtext>
                                            {event.id}{' '}
                                            {seenEvents.includes(event.id) ? '(SEEN)' : ''}
                                        </DebugButtonSubtext>
                                    </DebugButton>
                                ))}
                            </DebugGrid>
                            <DebugHint>
                                Events marked as SEEN have already been triggered this run
                            </DebugHint>
                        </DebugSection>
                    )}
                </ControlsSection>
            </DashboardMain>

            {/* FOOTER */}
            <GameFooter />

            {/* Explainer Modal */}
            <ExplainerModal
                isOpen={showExplainer}
                onClose={() => setShowExplainer(false)}
                faction={gameConfig.faction}
            />

            {/* Contributors Modal */}
            <ContributorsModal
                isOpen={showContributors}
                onClose={() => setShowContributors(false)}
                faction={gameConfig.faction}
            />

            {/* Run History Modal */}
            <RunHistoryModal isOpen={showRunHistory} onClose={() => setShowRunHistory(false)} />
        </PageWrapper>
    )
}

// Wrapper component that provides multiplayer context
export default function HelldiversRoguelike() {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            <HashRouter>
                <MultiplayerProvider>
                    <Routes>
                        <Route path="card-library" element={<CardLibrary />} />
                        <Route path="/" element={<HelldiversRoguelikeApp />} />
                    </Routes>
                </MultiplayerProvider>
            </HashRouter>
        </ThemeProvider>
    )
}
