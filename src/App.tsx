import { CheckCircle, XCircle } from 'lucide-react'
import { useEffect, useReducer, useRef, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { AnalyticsDashboard } from './components/analytics'
import CardLibrary from './components/CardLibrary'
import ContributorsModal from './components/ContributorsModal'
import CustomSetup from './components/CustomSetup'
import DraftScreen from './components/DraftScreen'
import EventScreen from './components/EventScreen'
import ExplainerModal from './components/ExplainerModal'
import GameFooter from './components/GameFooter'
import GameHeader from './components/GameHeader'
import GameLobby, { addExcludedItemsToSavedConfig } from './components/GameLobby'
import { isArmorCombo, isItem } from './components/ItemCard'
import KickedScreen from './components/KickedScreen'
import LoadoutDisplay from './components/LoadoutDisplay'
import MenuScreen from './components/MenuScreen'
import {
    JoinGameScreen,
    MultiplayerModeSelect,
    MultiplayerStatusBar,
    MultiplayerWaitingRoom,
} from './components/MultiplayerLobby'
import RunHistoryModal from './components/RunHistoryModal'
import SacrificeScreen from './components/SacrificeScreen'
import SoloConfigScreen from './components/SoloConfigScreen'
import { Subfaction } from './constants/balancingConfig'
import { getMissionsForDifficulty, STARTING_LOADOUT } from './constants/gameConfig'
import { getFactionColors } from './constants/theme'
import { TYPE } from './constants/types'
import { DEFAULT_WARBONDS } from './constants/warbonds'
import { useGamePersistence } from './hooks'
import * as actions from './state/actions'
import * as types from './state/actionTypes'
import * as runAnalytics from './state/analyticsStore'
import { gameReducer, initialState } from './state/gameReducer'
import { GlobalStyles, theme } from './styles'
import {
    ControlsSection,
    DashboardMain,
    DebugButton,
    DebugButtonSubtext,
    DebugButtonTitle,
    DebugGrid,
    DebugHeader,
    DebugHint,
    DebugSection,
    DebugTitle,
    ExtractionCheckbox,
    ExtractionContent,
    ExtractionLabel,
    ExtractionList,
    ExtractionName,
    ExtractionNote,
    ExtractionPenalty,
    ExtractionSection,
    MissionButtonRow,
    MissionFailButton,
    MissionReportHint,
    MissionStatusCard,
    MissionStatusTitle,
    MissionSuccessButton,
    ObjectiveCard,
    ObjectiveText,
    ObjectiveTitle,
    OperationStatus,
    PageWrapper,
    PlayerRosterGrid,
    RatingHint,
    RatingLabel,
    RatingSection,
    ResetSeenEventsButton,
    SampleColumn,
    SampleHeader,
    SampleHint,
    SampleIcon,
    SampleInput,
    SampleLabel,
    SamplesGrid,
    SamplesNote,
    SamplesSection,
    StarIcon,
    StarRatingButton,
    StarRatingGrid,
    WaitingForHostBox,
    WaitingForHostSubtext,
    WaitingForHostText,
} from './styles/App.styles'
import { EVENTS, selectRandomEvent } from './systems/events/events'
import * as eventsV2 from './systems/eventsV2'
import { initializeAnalytics, MultiplayerProvider, useMultiplayer } from './systems/multiplayer'
import { saveRunToHistory } from './systems/persistence/saveManager'
import type { DraftHandItem, Item, ItemType, Loadout, Player, SlotType } from './types'
import {
    trackDraftSelection,
    trackGameEnd,
    trackGameStart,
    trackMissionComplete,
    trackMultiplayerAction,
    trackPageView,
} from './utils/analytics'
import {
    createDraftState,
    generateDraftHand,
    getDraftHandSize,
    getWeightedPool,
} from './utils/draftHelpers'
import { ArmorCombo, getArmorComboDisplayName, getItemById } from './utils/itemHelpers'
import { areStratagemSlotsFull, getFirstEmptyStratagemSlot } from './utils/loadoutHelpers'
import { createPlayer } from './utils/playerHelper'

// Extend Window interface to include our custom property
declare global {
    interface Window {
        __boosterOutcome?: unknown
    }
}

function HelldiversRoguelikeApp() {
    // --- STATE (Using useReducer for complex state management) ---
    const [state, dispatch] = useReducer(gameReducer, initialState)

    // Destructure commonly used state values for easier access
    const {
        phase,
        gameConfig,
        currentDiff,
        currentMission,
        requisition,
        burnedCards,
        players,
        draftState,
        draftHistory,
        sacrificeState,
        eventsEnabled,
        currentEvent,
        seenEvents,
    } = state

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
        lobbyId,
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

    // Get faction-specific colors
    const factionColors = getFactionColors(gameConfig.faction)

    // UI-only state (not part of game state)
    const [selectedPlayer, setSelectedPlayer] = useState(0) // For custom setup phase
    const [multiplayerMode, setMultiplayerMode] = useState<string | null>(null) // null, 'select', 'host', 'join', 'waiting'
    const [initialLobbyCode, setInitialLobbyCode] = useState<string | null>(null) // For auto-populating join from URL

    // Check for ?join=<lobbyId> URL parameter on mount
    useEffect(() => {
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
    const [showExplainer, setShowExplainer] = useState(false) // For explainer modal
    const [showPatchNotes, setShowPatchNotes] = useState(false) // For patch notes modal
    const [showGenAIDisclosure, setShowGenAIDisclosure] = useState(false) // For Gen AI disclosure modal
    const [showContributors, setShowContributors] = useState(false) // For contributors modal
    const [showRemoveCardConfirm, setShowRemoveCardConfirm] = useState(false) // For remove card confirmation modal
    const [pendingCardRemoval, setPendingCardRemoval] = useState<DraftHandItem | null>(null) // Card pending removal
    const [missionSuccessDebouncing, setMissionSuccessDebouncing] = useState(false) // Debounce for mission success button
    const [gameStartTime, setGameStartTime] = useState<number | null>(null) // Track game start time for analytics

    // Analytics state
    const [showRunHistory, setShowRunHistory] = useState(false) // For run history modal
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

    // Subscribe clients to eventsV2 state updates from Firebase
    // This ensures clients stay in sync with the host's event UI state
    useEffect(() => {
        // Only subscribe if:
        // 1. Events are enabled
        // 2. We're in multiplayer mode
        // 3. We have a lobbyId
        if (!eventsEnabled || !isMultiplayer || !lobbyId) {
            return
        }

        console.debug(`[eventsV2] Subscribing to event UI state for lobby ${lobbyId}`)

        const unsubscribe = eventsV2.subscribeEventUIState(lobbyId, (eventUIState) => {
            if (eventUIState) {
                console.debug('[eventsV2] Received event UI state update:', {
                    eventId: eventUIState.eventId,
                    currentStep: eventUIState.currentStep,
                    isComplete: eventUIState.isComplete,
                })
            } else {
                console.debug('[eventsV2] Event UI state cleared (null)')
                // When eventsV2 state is cleared, ensure local event state is also cleared
                // This helps clients catch up when events are completed
                if (currentEvent && !isHost) {
                    console.debug(
                        '[eventsV2] Client clearing local event state due to Firebase state clear',
                    )
                    dispatch(actions.setCurrentEvent(null))
                    dispatch(actions.resetEventSelections())
                }
            }
        })

        return () => {
            console.debug(`[eventsV2] Unsubscribing from event UI state for lobby ${lobbyId}`)
            unsubscribe()
        }
    }, [eventsEnabled, isMultiplayer, lobbyId, isHost, currentEvent, dispatch])

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

                // Initialize eventsV2 state for Firebase sync (always enabled when events are enabled)
                if (eventsEnabled && isMultiplayer && lobbyId && multiplayer.playerId) {
                    console.debug(
                        `[eventsV2] Host initializing event UI state for event ${event.id} in lobby ${lobbyId}`,
                    )
                    // Initialize the new event UI state in Firebase
                    eventsV2
                        .initializeEventUIState(lobbyId, event.id, event, multiplayer.playerId)
                        .then(() => {
                            console.debug(
                                `[eventsV2] Successfully initialized event UI state for event ${event.id}`,
                            )
                        })
                        .catch((error) => {
                            console.error('[eventsV2] Failed to initialize eventsV2 state:', error)
                        })
                }

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
    const draftPickHandlerRef = useRef<((action: MultiplayerAction) => boolean) | null>(null)

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
        return (
            <CustomSetup
                selectedPlayer={selectedPlayer}
                setSelectedPlayer={setSelectedPlayer}
                setGameStartTime={setGameStartTime}
            />
        )
    }

    if (phase === 'EVENT') {
        return <EventScreen getConnectedPlayerIndices={getConnectedPlayerIndices} />
    }

    // SACRIFICE PHASE
    if (phase === 'SACRIFICE') {
        return <SacrificeScreen startDraftPhase={startDraftPhase} />
    }

    if (phase === 'DRAFT') {
        return (
            <DraftScreen
                proceedToNextDraft={proceedToNextDraft}
                handleDraftPick={handleDraftPick}
                handleSkipDraft={handleSkipDraft}
                setPendingCardRemoval={setPendingCardRemoval}
                setShowRemoveCardConfirm={setShowRemoveCardConfirm}
                generateDraftHandForPlayer={generateDraftHandForPlayer}
                showRemoveCardConfirm={showRemoveCardConfirm}
                pendingCardRemoval={pendingCardRemoval}
                confirmRemoveCardFromDraft={confirmRemoveCardFromDraft}
            />
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
