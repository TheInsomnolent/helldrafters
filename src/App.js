import { Bug, CheckCircle, MessageSquare, RefreshCw, Users, XCircle } from 'lucide-react'
import React, { useEffect, useReducer } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import CardLibrary from './components/CardLibrary'
import ContributorsModal from './components/ContributorsModal'
import EventDisplay from './components/EventDisplay'
import ExplainerModal from './components/ExplainerModal'
import GameConfiguration from './components/GameConfiguration'
import GameFooter from './components/GameFooter'
import GameHeader from './components/GameHeader'
import GameLobby, { addExcludedItemsToSavedConfig } from './components/GameLobby'
import GenAIDisclosureModal from './components/GenAIDisclosureModal'
import LoadoutDisplay from './components/LoadoutDisplay'
import {
    JoinGameScreen,
    MultiplayerModeSelect,
    MultiplayerStatusBar,
    MultiplayerWaitingRoom,
} from './components/MultiplayerLobby'
import PatchNotesModal from './components/PatchNotesModal'
import RarityWeightDebug from './components/RarityWeightDebug'
import RunHistoryModal from './components/RunHistoryModal'
import { AnalyticsDashboard } from './components/analytics'
import { ARMOR_PASSIVE_DESCRIPTIONS } from './constants/armorPassives'
import {
    DIFFICULTY_CONFIG,
    getMissionsForDifficulty,
    STARTING_LOADOUT,
} from './constants/gameConfig'
import { BUTTON_STYLES, COLORS, getFactionColors, GRADIENTS, SHADOWS } from './constants/theme'
import { RARITY, TYPE } from './constants/types'
import { DEFAULT_WARBONDS, getWarbondById } from './constants/warbonds'
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
import { EVENT_TYPES, EVENTS, selectRandomEvent } from './systems/events/events'
import { initializeAnalytics, MultiplayerProvider, useMultiplayer } from './systems/multiplayer'
import {
    exportGameStateToFile,
    normalizeLoadedState,
    parseSaveFile,
    saveRunToHistory,
} from './systems/persistence/saveManager'
import {
    trackDraftSelection,
    trackEventChoice,
    trackGameEnd,
    trackGameStart,
    trackMissionComplete,
    trackModalOpen,
    trackMultiplayerAction,
    trackPageView,
} from './utils/analytics'
import { generateDraftHand, getDraftHandSize, getWeightedPool } from './utils/draftHelpers'
import { getItemIconUrl } from './utils/iconHelpers'
import { getArmorComboDisplayName, getItemById } from './utils/itemHelpers'
import { areStratagemSlotsFull, getFirstEmptyStratagemSlot } from './utils/loadoutHelpers'

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
        setDispatch(dispatch)
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
    const [multiplayerMode, setMultiplayerMode] = React.useState(null) // null, 'select', 'host', 'join', 'waiting'
    const [initialLobbyCode, setInitialLobbyCode] = React.useState(null) // For auto-populating join from URL

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
    const [pendingSacrificeItem, setPendingSacrificeItem] = React.useState(null) // Item pending sacrifice
    const [pendingCardRemoval, setPendingCardRemoval] = React.useState(null) // Card pending removal
    const [missionSuccessDebouncing, setMissionSuccessDebouncing] = React.useState(false) // Debounce for mission success button
    const [gameStartTime, setGameStartTime] = React.useState(null) // Track game start time for analytics

    // Analytics state
    const [showRunHistory, setShowRunHistory] = React.useState(false) // For run history modal
    // Note: runAnalyticsData is now stored in game state (state.runAnalyticsData) so it syncs to clients

    // Ref for the hidden file input
    const fileInputRef = React.useRef(null)

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
        const lobbyPlayers = Object.values(lobbyData.players).filter((p) => p.connected !== false)

        // Check if any connected lobby player doesn't have a corresponding game player
        const newPlayersNeeded = lobbyPlayers.filter((lobbyPlayer) => {
            const existingGamePlayer = players.find((p) => p.id === lobbyPlayer.slot + 1)
            return !existingGamePlayer
        })

        if (newPlayersNeeded.length > 0) {
            // Add new players with default loadouts
            const updatedPlayers = [...players]

            newPlayersNeeded.forEach((lobbyPlayer) => {
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

                const newPlayer = {
                    id: lobbyPlayer.slot + 1,
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
                        .filter((id) => id !== null),
                    warbonds: playerWarbonds,
                    includeSuperstore: playerIncludeSuperstore,
                    excludedItems: playerExcludedItems,
                    weaponRestricted: false,
                    lockedSlots: [],
                    extracted: true,
                    needsRetrospectiveDraft: catchUpDraftsNeeded > 0, // Flag if they need to catch up
                    catchUpDraftsRemaining: catchUpDraftsNeeded, // Track how many catch-up drafts needed
                }
                updatedPlayers.push(newPlayer)

                // Register late-joining player in analytics so they appear in end-of-run stats
                runAnalytics.registerLatePlayer(newPlayer)
            })

            // Sort by player id to maintain order
            updatedPlayers.sort((a, b) => a.id - b.id)

            dispatch(actions.setPlayers(updatedPlayers))
            dispatch(actions.updateGameConfig({ playerCount: updatedPlayers.length }))

            // If late-joiner needs catch-up drafts, start retrospective draft for the first new player
            if (phase === 'DASHBOARD') {
                const newPlayerIndex = updatedPlayers.findIndex(
                    (p) => p.needsRetrospectiveDraft && p.catchUpDraftsRemaining > 0,
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

    // --- SAVE/LOAD FUNCTIONS ---

    const exportGameState = () => {
        exportGameStateToFile(state)
    }

    // Import functionality for loading JSON save files
    const importGameState = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            const loadedState = await parseSaveFile(file)
            const normalizedState = normalizeLoadedState(loadedState)

            // Check if this is a multiplayer game (more than 1 player)
            const isMultiplayerGame = normalizedState.gameConfig?.playerCount > 1

            if (isMultiplayerGame && firebaseReady) {
                // Create a multiplayer lobby for loaded multiplayer game
                const hostName = prompt('Enter your name for multiplayer:', 'Host') || 'Host'
                const newLobbyId = await hostGame(hostName, normalizedState.gameConfig)

                if (newLobbyId) {
                    // Start the multiplayer game (this sets up action subscription)
                    await startMultiplayerGame(newLobbyId, true)

                    // Load the game state
                    dispatch(actions.loadGameState(normalizedState))
                    setSelectedPlayer(normalizedState.selectedPlayer || 0)

                    // Initialize analytics for loaded game
                    runAnalytics.initializeAnalytics(
                        normalizedState.gameConfig,
                        normalizedState.players,
                    )
                    setGameStartTime(Date.now())

                    // Sync the loaded state to all clients
                    await syncState(normalizedState)

                    alert(
                        `Multiplayer game loaded! Share this lobby ID with other players:\n${newLobbyId}\n\nOther players can join mid-game.`,
                    )
                } else {
                    alert('Failed to create multiplayer lobby. Loading as solo game instead.')
                    // Fall back to solo loading
                    dispatch(actions.loadGameState(normalizedState))
                    setSelectedPlayer(normalizedState.selectedPlayer || 0)

                    // Initialize analytics for loaded game
                    runAnalytics.initializeAnalytics(
                        normalizedState.gameConfig,
                        normalizedState.players,
                    )
                    setGameStartTime(Date.now())
                }
            } else {
                // Single player game or Firebase not ready - load normally
                dispatch(actions.loadGameState(normalizedState))
                setSelectedPlayer(normalizedState.selectedPlayer || 0)

                // Initialize analytics for loaded game
                runAnalytics.initializeAnalytics(
                    normalizedState.gameConfig,
                    normalizedState.players,
                )
                setGameStartTime(Date.now())

                if (isMultiplayerGame && !firebaseReady) {
                    alert(
                        'Game loaded successfully!\n\nNote: This is a multiplayer save but Firebase is not configured. Loading as solo game.',
                    )
                } else {
                    alert('Game loaded successfully!')
                }
            }
        } catch (error) {
            console.error('Failed to load game:', error)
            alert(error.message || 'Failed to load save file. File may be corrupted.')
        }

        event.target.value = '' // Reset input
    }

    // --- INITIALIZATION ---

    const startGame = () => {
        // Solo mode: set player count to 1 and go to config
        dispatch(actions.updateGameConfig({ playerCount: 1 }))
        dispatch(actions.setPhase('SOLO_CONFIG'))
        trackMultiplayerAction('start_solo_mode')
    }

    const startGameFromLobby = (lobbyPlayers) => {
        if (gameConfig.customStart) {
            // Go to custom setup screen with configured players
            const initialLoadouts = Array.from({ length: gameConfig.playerCount }, () => ({
                primary: STARTING_LOADOUT.primary,
                secondary: STARTING_LOADOUT.secondary,
                grenade: STARTING_LOADOUT.grenade,
                armor: STARTING_LOADOUT.armor,
                booster: STARTING_LOADOUT.booster,
                stratagems: [...STARTING_LOADOUT.stratagems],
            }))
            dispatch(actions.setCustomSetup({ difficulty: 1, loadouts: initialLoadouts }))

            // Create players with warbond selections
            const newPlayers = lobbyPlayers.map((lp, i) => ({
                id: i + 1,
                name: lp.name,
                loadout: initialLoadouts[i],
                inventory: Object.values(initialLoadouts[i])
                    .flat()
                    .filter((id) => id !== null),
                warbonds: lp.warbonds,
                includeSuperstore: lp.includeSuperstore,
                excludedItems: lp.excludedItems || [],
                weaponRestricted: false,
                lockedSlots: [],
                extracted: true,
            }))
            dispatch(actions.setPlayers(newPlayers))
            dispatch(actions.setPhase('CUSTOM_SETUP'))
        } else {
            // Normal start with configured players
            const newPlayers = lobbyPlayers.map((lp, i) => ({
                id: i + 1,
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
                    .filter((id) => id !== null),
                warbonds: lp.warbonds,
                includeSuperstore: lp.includeSuperstore,
                excludedItems: lp.excludedItems || [],
                weaponRestricted: false,
                lockedSlots: [],
                extracted: true,
            }))
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
        const newPlayers = customSetup.loadouts.map((loadout, i) => ({
            id: i + 1,
            name: `Helldiver ${i + 1}`,
            loadout: { ...loadout },
            inventory: Object.values(loadout)
                .flat()
                .filter((id) => id !== null),
            weaponRestricted: false,
            lockedSlots: [],
            extracted: true,
        }))
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
    const isPlayerConnected = (playerIdx) => {
        if (!isMultiplayer) return true
        if (!lobbyData?.players) return true
        const lobbyPlayer = Object.values(lobbyData.players).find((p) => p.slot === playerIdx)
        // If no lobby player found for this slot, they're not connected (kicked)
        if (!lobbyPlayer) return false
        // If lobby player exists, check their connected status
        return lobbyPlayer.connected !== false
    }

    // Get indices of connected players for draft order
    const getConnectedPlayerIndices = () => {
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

    const generateDraftHandForPlayer = (playerIdx) => {
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
            actions.setDraftState({
                activePlayerIndex: firstPlayerIdx,
                roundCards: generateDraftHandForPlayer(firstPlayerIdx),
                isRerolling: false,
                pendingStratagem: null,
                extraDraftRound: 0,
                draftOrder,
            }),
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

    const proceedToNextDraft = (updatedPlayers) => {
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
                actions.setDraftState({
                    activePlayerIndex: currentPlayerIdx,
                    roundCards: generateDraftHandForPlayer(currentPlayerIdx),
                    isRerolling: false,
                    pendingStratagem: null,
                    extraDraftRound: 0,
                    isRedrafting: true,
                    draftOrder: draftState.draftOrder,
                }),
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
                actions.setDraftState({
                    activePlayerIndex: currentPlayerIdx,
                    roundCards: generateDraftHandForPlayer(currentPlayerIdx),
                    isRerolling: false,
                    pendingStratagem: null,
                    extraDraftRound: currentExtraRound + 1,
                    draftOrder: draftState.draftOrder,
                }),
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
                actions.setDraftState({
                    activePlayerIndex: nextIdx,
                    roundCards: generateDraftHandForPlayer(nextIdx),
                    isRerolling: false,
                    pendingStratagem: null,
                    extraDraftRound: 0,
                    draftOrder,
                }),
            )
        } else {
            // Draft complete
            // Record draft history (only for normal drafts, not retrospective)
            if (!draftState.isRetrospective) {
                dispatch(actions.addDraftHistory(currentDiff, gameConfig.starRating))

                // Record draft complete for analytics
                runAnalytics.recordDraftComplete(
                    currentDiff,
                    updatedPlayers.map((p) => ({
                        index: updatedPlayers.indexOf(p),
                        name: p.name,
                        loadout: p.loadout,
                    })),
                )

                // Check if any players need retrospective drafts (newly joined players)
                const playerNeedingRetro = updatedPlayers.findIndex(
                    (p) => p.needsRetrospectiveDraft && (p.catchUpDraftsRemaining || 0) > 0,
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
                if (card.items && card.passive) {
                    // Armor combo - burn all armor pieces
                    card.items.forEach((armor) => dispatch(actions.addBurnedCard(armor.id)))
                } else if (card.id) {
                    // Regular item
                    dispatch(actions.addBurnedCard(card.id))
                }
            })
        }

        proceedToNextDraft(players)
    }

    const handleDraftPick = (item) => {
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
        const isArmorCombo = item && item.items && item.passive && item.armorClass

        if (isArmorCombo) {
            // Add all armor variants to inventory
            item.items.forEach((armor) => {
                player.inventory.push(armor.id)
            })

            // Auto-equip the first armor in the combo
            player.loadout.armor = item.items[0].id
        } else {
            // Special handling for stratagems when slots are full
            if (item.type === TYPE.STRATAGEM) {
                if (areStratagemSlotsFull(player.loadout)) {
                    // All slots full - show replacement UI
                    dispatch(
                        actions.updateDraftState({
                            pendingStratagem: item,
                        }),
                    )
                    return // Don't proceed with pick yet
                }
            }

            // Add to inventory
            player.inventory.push(item.id)

            // Auto-Equip Logic
            if (item.type === TYPE.PRIMARY) player.loadout.primary = item.id
            if (item.type === TYPE.SECONDARY) player.loadout.secondary = item.id
            if (item.type === TYPE.GRENADE) player.loadout.grenade = item.id
            if (item.type === TYPE.ARMOR) player.loadout.armor = item.id
            if (item.type === TYPE.BOOSTER) player.loadout.booster = item.id
            if (item.type === TYPE.STRATAGEM) {
                // Find empty slot (we know it exists because we checked above)
                const emptySlot = getFirstEmptyStratagemSlot(player.loadout)
                player.loadout.stratagems[emptySlot] = item.id
            }
        }

        dispatch(actions.setPlayers(updatedPlayers))

        // Determine the slot type and item ID for analytics
        const slotType = item.type || 'armor'
        const itemId = isArmorCombo ? item.items[0].id : item.id

        // Record loadout change for analytics
        runAnalytics.recordLoadoutChange(
            currentPlayerIdx,
            player.name || `Helldiver ${currentPlayerIdx + 1}`,
            { ...player.loadout },
            slotType,
            itemId,
            `Draft pick: ${item.name || (isArmorCombo ? getArmorComboDisplayName(item) : 'Unknown item')}`,
        )

        // Burn all cards shown in this draft hand (if burn mode enabled)
        if (gameConfig.burnCards && draftState.roundCards) {
            draftState.roundCards.forEach((card) => {
                if (card.items && card.passive) {
                    // Armor combo - burn all armor pieces
                    card.items.forEach((armor) => dispatch(actions.addBurnedCard(armor.id)))
                } else if (card.id) {
                    // Regular item
                    dispatch(actions.addBurnedCard(card.id))
                }
            })
        }

        // Track draft selection
        trackDraftSelection(
            item.type || (isArmorCombo ? TYPE.ARMOR : 'unknown'),
            item.rarity || 'unknown',
            draftState.roundNumber || 1,
        )

        // Next player, extra draft, or finish
        proceedToNextDraft(updatedPlayers)
    }

    const handleStratagemReplacement = (slotIndex) => {
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
            currentPlayerIdx,
            player.name || `Helldiver ${currentPlayerIdx + 1}`,
            { ...player.loadout },
            `stratagems`,
            item.id,
            `Replaced stratagem slot ${slotIndex + 1}: ${item.name || 'Unknown'}`,
        )

        // Next player, extra draft, or finish
        proceedToNextDraft(updatedPlayers)
    }

    // Ref to hold the draft pick handler for multiplayer (avoids stale closure issues)
    const draftPickHandlerRef = React.useRef(null)

    // Update the ref whenever dependencies change
    draftPickHandlerRef.current = (action) => {
        if (action.type === types.DRAFT_PICK) {
            const { playerIndex, item } = action.payload

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
            const isArmorCombo = item && item.items && item.passive && item.armorClass

            if (isArmorCombo) {
                item.items.forEach((armor) => {
                    player.inventory.push(armor.id)
                })
                player.loadout.armor = item.items[0].id
            } else {
                // Special handling for stratagems when slots are full
                if (item.type === TYPE.STRATAGEM) {
                    if (areStratagemSlotsFull(player.loadout)) {
                        // Set pending stratagem to trigger modal for player to choose which slot to replace
                        dispatch(
                            actions.updateDraftState({
                                pendingStratagem: item,
                            }),
                        )
                        return true // Action was handled, wait for STRATAGEM_REPLACEMENT action
                    }
                }

                player.inventory.push(item.id)

                // Auto-Equip Logic
                if (item.type === TYPE.PRIMARY) player.loadout.primary = item.id
                if (item.type === TYPE.SECONDARY) player.loadout.secondary = item.id
                if (item.type === TYPE.GRENADE) player.loadout.grenade = item.id
                if (item.type === TYPE.ARMOR) player.loadout.armor = item.id
                if (item.type === TYPE.BOOSTER) player.loadout.booster = item.id
                if (item.type === TYPE.STRATAGEM) {
                    const emptySlot = getFirstEmptyStratagemSlot(player.loadout)
                    player.loadout.stratagems[emptySlot] = item.id
                }
            }

            dispatch(actions.setPlayers(updatedPlayers))

            // Record loadout change for analytics
            runAnalytics.recordLoadoutChange(
                playerIndex,
                player.name || `Helldiver ${playerIndex + 1}`,
                { ...player.loadout },
                item.type || 'armor',
                isArmorCombo ? item.items[0].id : item.id,
                `Draft pick: ${item.name || (isArmorCombo ? 'Armor combo' : 'Unknown item')}`,
            )

            proceedToNextDraft(updatedPlayers)
            return true // Action was handled
        }

        // Handle stratagem replacement from clients
        if (action.type === types.STRATAGEM_REPLACEMENT) {
            const { playerIndex, slotIndex } = action.payload
            const updatedPlayers = [...players]
            const player = updatedPlayers[playerIndex]

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
            player.loadout.stratagems[slotIndex] = item.id

            dispatch(actions.setPlayers(updatedPlayers))
            dispatch(actions.updateDraftState({ pendingStratagem: null }))

            // Record loadout change for analytics
            runAnalytics.recordLoadoutChange(
                playerIndex,
                player.name || `Helldiver ${playerIndex + 1}`,
                { ...player.loadout },
                'stratagems',
                item.id,
                `Replaced stratagem slot ${slotIndex + 1}: ${item.name || 'Unknown'}`,
            )

            proceedToNextDraft(updatedPlayers)
            return true
        }

        // Handle extraction status toggle from clients
        if (action.type === types.SET_PLAYER_EXTRACTED) {
            const { playerIndex, extracted } = action.payload
            dispatch(actions.setPlayerExtracted(playerIndex, extracted))
            return true
        }

        // Handle skip draft from clients
        if (action.type === 'SKIP_DRAFT') {
            proceedToNextDraft(players)
            return true
        }

        // Handle draft reroll from clients
        if (action.type === 'DRAFT_REROLL') {
            const { cost } = action.payload
            if (requisition < cost) return true // Action consumed but rejected
            dispatch(actions.spendRequisition(cost))
            dispatch(
                actions.updateDraftState({
                    roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex),
                }),
            )
            return true
        }

        // Handle remove card from clients
        if (action.type === 'REMOVE_CARD') {
            const { cardToRemove, itemIdsToExclude } = action.payload
            const playerIdx = draftState.activePlayerIndex
            const player = players[playerIdx]

            // Update player's excludedItems with the items sent from client
            if (itemIdsToExclude && itemIdsToExclude.length > 0) {
                const currentExcluded = player?.excludedItems || []
                const newExcluded = [...new Set([...currentExcluded, ...itemIdsToExclude])]
                dispatch(actions.setPlayerExcludedItems(playerIdx, newExcluded))
            }

            const playerLockedSlots = player?.lockedSlots || []

            // Use updated excluded items for pool
            const updatedExcluded = itemIdsToExclude
                ? [...new Set([...(player?.excludedItems || []), ...itemIdsToExclude])]
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
            const isRemovingArmorCombo = cardToRemove && cardToRemove.items && cardToRemove.passive

            // Filter out cards already in the current hand
            const availablePool = pool.filter((poolEntry) => {
                if (poolEntry.isArmorCombo) {
                    return !draftState.roundCards.some(
                        (card) =>
                            card.passive === poolEntry.armorCombo.passive &&
                            card.armorClass === poolEntry.armorCombo.armorClass,
                    )
                } else {
                    return !draftState.roundCards.some(
                        (card) =>
                            card.id === poolEntry.item?.id ||
                            (card.items &&
                                card.items.some((armor) => armor.id === poolEntry.item?.id)),
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
                    if (newCard.items && newCard.passive) {
                        newCard.items.forEach((armor) => dispatch(actions.addBurnedCard(armor.id)))
                    } else {
                        dispatch(actions.addBurnedCard(newCard.id))
                    }
                }

                // Replace the card
                dispatch(
                    actions.updateDraftState({
                        roundCards: draftState.roundCards.map((card) => {
                            if (isRemovingArmorCombo) {
                                if (
                                    card.passive === cardToRemove.passive &&
                                    card.armorClass === cardToRemove.armorClass
                                ) {
                                    return newCard
                                }
                            } else {
                                if (card.id === cardToRemove.id) {
                                    return newCard
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
            const { playerIndex, itemId } = action.payload

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

    const rerollDraft = (cost) => {
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
        runAnalytics.recordRerollUsed(draftState.activePlayerIndex, cost)

        dispatch(
            actions.updateDraftState({
                roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex),
            }),
        )
    }

    const handleLockSlot = (playerId, slotType) => {
        const { getSlotLockCost, MAX_LOCKED_SLOTS } = require('./constants/balancingConfig')
        const slotLockCost = getSlotLockCost(gameConfig.playerCount)
        const player = players.find((p) => p.id === playerId)
        const playerLockedSlots = player?.lockedSlots || []

        if (requisition < slotLockCost) return
        if (playerLockedSlots.length >= MAX_LOCKED_SLOTS) return
        if (playerLockedSlots.includes(slotType)) return

        dispatch(actions.spendRequisition(slotLockCost))

        // Record requisition spend for analytics
        const playerName = player?.name || 'Unknown Player'
        runAnalytics.recordRequisitionChange(-slotLockCost, playerName, `Lock ${slotType} Slot`)

        dispatch(actions.lockPlayerDraftSlot(playerId, slotType))

        // Regenerate current hand if this is the active player
        if (phase === 'DRAFT' && players[draftState.activePlayerIndex]?.id === playerId) {
            dispatch(
                actions.updateDraftState({
                    roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex),
                }),
            )
        }
    }

    const handleUnlockSlot = (playerId, slotType) => {
        const player = players.find((p) => p.id === playerId)
        const playerLockedSlots = player?.lockedSlots || []

        if (!playerLockedSlots.includes(slotType)) return

        // Confirm unlock action
        if (
            !window.confirm(
                `Unlock ${slotType} slot? This will allow ${slotType} items to appear in future drafts.`,
            )
        ) {
            return
        }

        dispatch(actions.unlockPlayerDraftSlot(playerId, slotType))

        // Regenerate current hand if this is the active player
        if (phase === 'DRAFT' && players[draftState.activePlayerIndex]?.id === playerId) {
            dispatch(
                actions.updateDraftState({
                    roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex),
                }),
            )
        }
    }

    const handleSacrifice = (item) => {
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

    const removeCardFromDraft = (cardToRemove) => {
        // Show confirmation modal first
        setPendingCardRemoval(cardToRemove)
        setShowRemoveCardConfirm(true)
    }

    const confirmRemoveCardFromDraft = () => {
        const cardToRemove = pendingCardRemoval
        if (!cardToRemove) return

        // Close modal and clear pending card
        setShowRemoveCardConfirm(false)
        setPendingCardRemoval(null)

        // Check if the card to remove is an armor combo
        const isRemovingArmorCombo = cardToRemove && cardToRemove.items && cardToRemove.passive

        // Get the item ID(s) to exclude - for armor combos, exclude all armor variants
        const itemIdsToExclude = isRemovingArmorCombo
            ? cardToRemove.items.map((armor) => armor.id)
            : [cardToRemove.id]

        // Update the player's excludedItems in game state
        const player = players[draftState.activePlayerIndex]
        const currentExcluded = player.excludedItems || []
        const newExcluded = [...new Set([...currentExcluded, ...itemIdsToExclude])]
        dispatch(actions.setPlayerExcludedItems(draftState.activePlayerIndex, newExcluded))

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
                        card.armorClass === poolEntry.armorCombo.armorClass,
                )
            } else {
                // For regular items, compare ID
                return !draftState.roundCards.some(
                    (card) =>
                        card.id === poolEntry.item?.id ||
                        (card.items && card.items.some((armor) => armor.id === poolEntry.item?.id)),
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
                if (newCard.items && newCard.passive) {
                    // Armor combo - burn all variants
                    newCard.items.forEach((armor) => dispatch(actions.addBurnedCard(armor.id)))
                } else {
                    // Regular item
                    dispatch(actions.addBurnedCard(newCard.id))
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
                                card.passive === cardToRemove.passive &&
                                card.armorClass === cardToRemove.armorClass
                            ) {
                                return newCard
                            }
                        } else {
                            // Compare regular items by ID
                            if (card.id === cardToRemove.id) {
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

    // --- UI COMPONENTS ---

    const RarityBadge = ({ rarity }) => {
        const colors = {
            [RARITY.COMMON]: { bg: '#6b7280', color: 'white' },
            [RARITY.UNCOMMON]: { bg: '#22c55e', color: 'black' },
            [RARITY.RARE]: { bg: '#f97316', color: 'black' },
            [RARITY.LEGENDARY]: { bg: '#9333ea', color: 'white' },
        }
        const style = colors[rarity] || colors[RARITY.COMMON]
        return (
            <span
                style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: style.bg,
                    color: style.color,
                }}
            >
                {rarity}
            </span>
        )
    }

    const ItemCard = ({ item, onSelect, onRemove }) => {
        // Guard: if item is undefined, don't render
        if (!item) {
            console.debug('[ItemCard] Skipping null item')
            return null
        }

        // Check if this is an armor combo (has 'items' array and 'passive' property)
        const isArmorCombo =
            item.items &&
            Array.isArray(item.items) &&
            item.items.length > 0 &&
            item.passive &&
            item.armorClass

        console.debug('[ItemCard] Rendering item:', {
            name: item.name,
            id: item.id,
            passive: item.passive,
            isArmorCombo,
            itemsLength: item.items?.length,
            items: item.items,
        })

        // Guard: for regular items, require name; for armor combos, require items with names
        if (!isArmorCombo && !item.name) {
            console.debug('[ItemCard] Skipping - not armor combo and no name')
            return null
        }

        // For armor combos, use the first item as representative for display
        const displayItem = isArmorCombo ? item.items[0] : item

        // Guard: if displayItem is invalid, don't render
        if (!displayItem || !displayItem.name) {
            console.debug('[ItemCard] Skipping - displayItem invalid:', displayItem)
            return null
        }

        // For armor combos, create a slash-delimited name
        const displayName = isArmorCombo
            ? item.items.map((armor) => armor?.name || 'Unknown').join(' / ')
            : item.name

        let armorPassiveDescription = null
        let armorPassiveKey = null
        const isArmorItem = isArmorCombo || item?.type === TYPE.ARMOR
        if (isArmorItem) {
            armorPassiveKey = item.passive
            if (armorPassiveKey) {
                const description = ARMOR_PASSIVE_DESCRIPTIONS[armorPassiveKey]
                if (!description && process.env.NODE_ENV === 'development') {
                    const armorIdentifier = isArmorCombo
                        ? displayName
                        : item.name || item.id || 'unknown armor'
                    console.warn(
                        `Missing armor passive description for ${armorPassiveKey} (${armorIdentifier})`,
                    )
                }
                armorPassiveDescription = description || 'Passive effect details unavailable.'
            }
        }

        // Get warbond info for display
        const warbondId = displayItem.warbond
        const isSuperstore = displayItem.superstore
        const warbondInfo = warbondId ? getWarbondById(warbondId) : null
        const sourceName = isSuperstore ? 'Superstore' : warbondInfo?.name || 'Unknown'
        const tags = displayItem.tags || []

        // Show armor class in tags
        const armorClass = item.armorClass
            ? item.armorClass.slice(0, 1).toUpperCase() + item.armorClass.slice(1)
            : null
        if (armorClass && !tags.includes(armorClass)) {
            tags.push(armorClass)
        }

        // Get item icon URL - use helper function
        const iconUrl = getItemIconUrl(displayItem)

        return (
            <div
                style={{
                    position: 'relative',
                    backgroundColor: '#283548',
                    border: '2px solid rgba(100, 116, 139, 0.5)',
                    padding: '16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '280px',
                    width: '280px',
                    flexShrink: 0,
                }}
            >
                {onRemove && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove(item)
                        }}
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            zIndex: 10,
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 1)')
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)')
                        }
                        title="Remove this card"
                    >
                        ×
                    </button>
                )}
                <div
                    onClick={() => onSelect && onSelect(item)}
                    style={{
                        cursor: onSelect ? 'pointer' : 'default',
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        paddingTop: onRemove ? '32px' : '0',
                    }}
                    onMouseEnter={(e) =>
                        onSelect &&
                        (e.currentTarget.parentElement.style.borderColor = factionColors.PRIMARY)
                    }
                    onMouseLeave={(e) =>
                        onSelect &&
                        (e.currentTarget.parentElement.style.borderColor =
                            'rgba(100, 116, 139, 0.5)')
                    }
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '8px',
                        }}
                    >
                        <RarityBadge rarity={displayItem.rarity} />
                        <div
                            style={{
                                color: factionColors.PRIMARY,
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                marginRight: onRemove ? '8px' : '0',
                            }}
                        >
                            {displayItem.type}
                            {isArmorCombo ? ` (×${item.items.length})` : ''}
                        </div>
                    </div>

                    {/* Item Icon */}
                    {iconUrl && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: '12px',
                                height: '80px',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '4px',
                                padding: '8px',
                            }}
                        >
                            <img
                                src={iconUrl}
                                alt={displayName}
                                style={{
                                    maxHeight: '100%',
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none'
                                }}
                            />
                        </div>
                    )}

                    <h3
                        style={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: isArmorCombo ? '14px' : '18px',
                            lineHeight: '1.2',
                            marginBottom: '4px',
                            wordBreak: 'break-word',
                        }}
                    >
                        {displayName}
                    </h3>

                    {/* Warbond Source */}
                    <div
                        style={{
                            fontSize: '10px',
                            color: isSuperstore ? '#c084fc' : '#60a5fa',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px',
                        }}
                    >
                        {sourceName}
                    </div>

                    <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(displayItem.tags || []).map((tag) => (
                                <span
                                    key={tag}
                                    style={{
                                        fontSize: '10px',
                                        backgroundColor: 'rgba(51, 65, 85, 0.5)',
                                        color: '#cbd5e1',
                                        padding: '2px 4px',
                                        borderRadius: '2px',
                                        border: '1px solid rgba(71, 85, 105, 0.5)',
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                        {armorPassiveDescription && (
                            <div style={{ marginTop: '10px' }}>
                                <div
                                    style={{
                                        color: '#94a3b8',
                                        fontSize: '9px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                    }}
                                >
                                    Armor Passive - {armorPassiveKey}
                                </div>
                                <div
                                    style={{
                                        color: '#cbd5e1',
                                        fontSize: '11px',
                                        lineHeight: '1.4',
                                        marginTop: '4px',
                                    }}
                                >
                                    {armorPassiveDescription}
                                </div>
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid rgba(71, 85, 105, 0.5)',
                            textAlign: 'center',
                        }}
                    >
                        <span
                            style={{
                                color: factionColors.PRIMARY,
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                fontSize: '14px',
                            }}
                        >
                            REQUISITION
                        </span>
                    </div>
                </div>
            </div>
        )
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
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0f1419',
                    padding: '24px',
                }}
            >
                <div style={{ maxWidth: '500px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ fontSize: '80px', marginBottom: '16px' }}>🚫</div>
                        <h1
                            style={{
                                fontSize: '48px',
                                fontWeight: '900',
                                color: '#ef4444',
                                margin: '0 0 16px 0',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            REMOVED FROM SQUAD
                        </h1>
                        <p
                            style={{
                                fontSize: '18px',
                                color: '#94a3b8',
                                lineHeight: '1.6',
                                margin: '0',
                            }}
                        >
                            The host has removed you from the game session.
                            <br />
                            <br />
                            You can rejoin using the same lobby code if the host allows it.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            clearWasKicked()
                            dispatch(actions.setPhase('MENU'))
                        }}
                        style={{
                            width: '100%',
                            padding: '20px',
                            backgroundColor: factionColors.PRIMARY,
                            color: 'black',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: '900',
                            fontSize: '18px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = factionColors.PRIMARY_HOVER)
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = factionColors.PRIMARY)
                        }
                    >
                        Return to Menu
                    </button>
                </div>
            </div>
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
                initialLobbyCode={initialLobbyCode}
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
            <div style={{ minHeight: '100vh', padding: '80px 24px' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                    <h1
                        style={{
                            fontSize: '72px',
                            fontWeight: '900',
                            color: factionColors.PRIMARY,
                            margin: '0 0 0 0',
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                        }}
                    >
                        HELLDRAFTERS
                    </h1>
                    <div style={{ margin: '20px auto' }}>
                        <img
                            src={`${process.env.PUBLIC_URL}/logo.png`}
                            alt="Helldrafters Logo"
                            style={{
                                width: '200px',
                                height: 'auto',
                                display: 'block',
                                margin: '0 auto',
                            }}
                        />
                    </div>
                    <div
                        style={{
                            background: 'linear-gradient(to right, #5a5142, #6b6052)',
                            padding: '12px',
                            marginBottom: '60px',
                            maxWidth: '620px',
                            margin: '0 auto 60px auto',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: 'white',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3em',
                                margin: 0,
                            }}
                        >
                            Roguelike Director
                        </h2>
                    </div>

                    <div
                        style={{
                            backgroundColor: '#283548',
                            padding: '40px',
                            borderRadius: '8px',
                            border: '1px solid rgba(100, 116, 139, 0.5)',
                        }}
                    >
                        {/* Hidden file input for loading saves */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".json"
                            onChange={importGameState}
                            style={{ display: 'none' }}
                        />

                        {/* Start Buttons */}
                        <div
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
                        >
                            <button
                                onClick={startGame}
                                style={{
                                    ...BUTTON_STYLES.PRIMARY,
                                    width: '100%',
                                    padding: '16px',
                                    fontSize: '16px',
                                    letterSpacing: '0.15em',
                                    borderRadius: '4px',
                                    border: 'none',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = COLORS.PRIMARY_HOVER
                                    e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY_HOVER
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = COLORS.PRIMARY
                                    e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY
                                }}
                            >
                                Solo
                            </button>

                            <button
                                onClick={() => setMultiplayerMode('select')}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    fontSize: '16px',
                                    letterSpacing: '0.15em',
                                    borderRadius: '4px',
                                    border: `2px solid ${COLORS.ACCENT_BLUE}`,
                                    backgroundColor: 'transparent',
                                    color: COLORS.ACCENT_BLUE,
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = `${COLORS.ACCENT_BLUE}20`
                                    e.currentTarget.style.boxShadow = SHADOWS.GLOW_BLUE
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                <Users size={18} />
                                Multiplayer
                            </button>
                        </div>

                        {/* Load Game Button */}
                        <div style={{ marginTop: '12px' }}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    letterSpacing: '0.1em',
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.CARD_BORDER}`,
                                    backgroundColor: 'transparent',
                                    color: COLORS.TEXT_MUTED,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.TEXT_SECONDARY
                                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY
                                    e.currentTarget.style.backgroundColor =
                                        'rgba(100, 116, 139, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.CARD_BORDER
                                    e.currentTarget.style.color = COLORS.TEXT_MUTED
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                Load Game
                            </button>
                        </div>

                        {/* Past Runs Button */}
                        <div style={{ marginTop: '12px' }}>
                            <button
                                onClick={() => {
                                    trackModalOpen('run_history')
                                    setShowRunHistory(true)
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    letterSpacing: '0.1em',
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.CARD_BORDER}`,
                                    backgroundColor: 'transparent',
                                    color: COLORS.TEXT_MUTED,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.ACCENT_PURPLE
                                    e.currentTarget.style.color = COLORS.ACCENT_PURPLE
                                    e.currentTarget.style.backgroundColor = `${COLORS.ACCENT_PURPLE}10`
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.CARD_BORDER
                                    e.currentTarget.style.color = COLORS.TEXT_MUTED
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>📊</span> Past Runs
                            </button>
                        </div>

                        {/* Help Button */}
                        <div style={{ marginTop: '12px' }}>
                            <button
                                onClick={() => {
                                    trackModalOpen('explainer')
                                    setShowExplainer(true)
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    letterSpacing: '0.1em',
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.CARD_BORDER}`,
                                    backgroundColor: 'transparent',
                                    color: COLORS.TEXT_MUTED,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = factionColors.PRIMARY
                                    e.currentTarget.style.color = factionColors.PRIMARY
                                    e.currentTarget.style.backgroundColor = `${factionColors.PRIMARY}10`
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.CARD_BORDER
                                    e.currentTarget.style.color = COLORS.TEXT_MUTED
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>📖</span> How to Play
                            </button>
                        </div>

                        {/* Patch Notes Button */}
                        <div style={{ marginTop: '12px' }}>
                            <button
                                onClick={() => {
                                    trackModalOpen('patch_notes')
                                    setShowPatchNotes(true)
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    letterSpacing: '0.1em',
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.CARD_BORDER}`,
                                    backgroundColor: 'transparent',
                                    color: COLORS.TEXT_MUTED,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = factionColors.PRIMARY
                                    e.currentTarget.style.color = factionColors.PRIMARY
                                    e.currentTarget.style.backgroundColor = `${factionColors.PRIMARY}10`
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.CARD_BORDER
                                    e.currentTarget.style.color = COLORS.TEXT_MUTED
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>📝</span> Patch Notes
                            </button>
                        </div>

                        {/* Report Bug/Feedback Button */}
                        <div style={{ marginTop: '12px' }}>
                            <a
                                href="https://github.com/TheInsomnolent/helldrafters/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    letterSpacing: '0.1em',
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.CARD_BORDER}`,
                                    backgroundColor: 'transparent',
                                    color: COLORS.TEXT_MUTED,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    textDecoration: 'none',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.TEXT_SECONDARY
                                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY
                                    e.currentTarget.style.backgroundColor =
                                        'rgba(100, 116, 139, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.CARD_BORDER
                                    e.currentTarget.style.color = COLORS.TEXT_MUTED
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <Bug size={16} /> Report Bug/Feedback
                            </a>
                        </div>

                        {/* Community Discussions Button */}
                        <div style={{ marginTop: '12px' }}>
                            <a
                                href="https://github.com/TheInsomnolent/helldrafters/discussions"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    letterSpacing: '0.1em',
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.CARD_BORDER}`,
                                    backgroundColor: 'transparent',
                                    color: COLORS.TEXT_MUTED,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    textDecoration: 'none',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#a78bfa'
                                    e.currentTarget.style.color = '#a78bfa'
                                    e.currentTarget.style.backgroundColor =
                                        'rgba(139, 92, 246, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.CARD_BORDER
                                    e.currentTarget.style.color = COLORS.TEXT_MUTED
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <MessageSquare size={16} /> Discussions
                            </a>
                        </div>

                        {/* Gen AI Disclosure Button */}
                        <div style={{ marginTop: '12px' }}>
                            <button
                                onClick={() => {
                                    trackModalOpen('genai_disclosure')
                                    setShowGenAIDisclosure(true)
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    letterSpacing: '0.1em',
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.CARD_BORDER}`,
                                    backgroundColor: 'transparent',
                                    color: COLORS.TEXT_MUTED,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = factionColors.PRIMARY
                                    e.currentTarget.style.color = factionColors.PRIMARY
                                    e.currentTarget.style.backgroundColor = `${factionColors.PRIMARY}10`
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.CARD_BORDER
                                    e.currentTarget.style.color = COLORS.TEXT_MUTED
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>✨</span> Gen AI Disclosure
                            </button>
                        </div>

                        {/* Contributors Button */}
                        <div style={{ marginTop: '12px' }}>
                            <button
                                onClick={() => {
                                    // eslint-disable-next-line no-console
                                    console.log(
                                        'Contributors button clicked, showContributors:',
                                        showContributors,
                                    )
                                    trackModalOpen('contributors')
                                    setShowContributors(true)
                                    // eslint-disable-next-line no-console
                                    console.log('setShowContributors(true) called')
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    letterSpacing: '0.1em',
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.CARD_BORDER}`,
                                    backgroundColor: 'transparent',
                                    color: COLORS.TEXT_MUTED,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#ff5e5b'
                                    e.currentTarget.style.color = '#ff5e5b'
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 94, 91, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.CARD_BORDER
                                    e.currentTarget.style.color = COLORS.TEXT_MUTED
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>❤️</span> Community Supporters
                            </button>
                        </div>

                        {/* Code Contributors Button */}
                        <div style={{ marginTop: '12px' }}>
                            <a
                                href="https://github.com/TheInsomnolent/helldrafters/graphs/contributors"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    letterSpacing: '0.1em',
                                    borderRadius: '4px',
                                    border: `1px solid ${COLORS.CARD_BORDER}`,
                                    backgroundColor: 'transparent',
                                    color: COLORS.TEXT_MUTED,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    textDecoration: 'none',
                                    boxSizing: 'border-box',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#a78bfa'
                                    e.currentTarget.style.color = '#a78bfa'
                                    e.currentTarget.style.backgroundColor =
                                        'rgba(139, 92, 246, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = COLORS.CARD_BORDER
                                    e.currentTarget.style.color = COLORS.TEXT_MUTED
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <Users size={16} /> Contributors
                            </a>
                        </div>

                        {/* Build Info */}
                        <div
                            style={{
                                marginTop: '24px',
                                paddingTop: '24px',
                                borderTop: '1px solid rgba(100, 116, 139, 0.3)',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '10px',
                                    color: '#475569',
                                    fontFamily: 'monospace',
                                }}
                            >
                                {process.env.REACT_APP_BUILD_TIME && (
                                    <div>Build: {process.env.REACT_APP_BUILD_TIME}</div>
                                )}
                                {process.env.REACT_APP_COMMIT_SHA && (
                                    <div>
                                        Commit: {process.env.REACT_APP_COMMIT_SHA.substring(0, 7)}
                                    </div>
                                )}
                                {!process.env.REACT_APP_BUILD_TIME &&
                                    !process.env.REACT_APP_COMMIT_SHA && (
                                        <div>Local Development Build</div>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* Debug Rarity Weight Visualization */}
                    {gameConfig.debugRarityWeights && (
                        <div style={{ marginTop: '40px' }}>
                            <RarityWeightDebug gameConfig={gameConfig} />
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <GameFooter />

                {/* Remove Card Confirmation Modal */}
                {showRemoveCardConfirm && (
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
                            zIndex: 2000,
                            padding: '24px',
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#283548',
                                borderRadius: '12px',
                                border: '3px solid #f59e0b',
                                padding: '32px',
                                maxWidth: '600px',
                                width: '100%',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                            }}
                        >
                            <h2
                                style={{
                                    color: '#f59e0b',
                                    fontSize: '28px',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    marginBottom: '24px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                ⚠️ Remove Card
                            </h2>

                            <div
                                style={{
                                    backgroundColor: '#1f2937',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    marginBottom: '24px',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                            >
                                <p
                                    style={{
                                        color: '#cbd5e1',
                                        fontSize: '16px',
                                        lineHeight: '1.6',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <strong style={{ color: '#f59e0b' }}>
                                        ⚠️ Important Notice:
                                    </strong>
                                </p>
                                <p
                                    style={{
                                        color: '#cbd5e1',
                                        fontSize: '15px',
                                        lineHeight: '1.6',
                                        marginBottom: '12px',
                                    }}
                                >
                                    This feature should{' '}
                                    <strong style={{ color: '#fbbf24' }}>only be used</strong> if
                                    you misconfigured your warbonds and do not have access to an
                                    item that appeared in your draft.
                                </p>
                                <p
                                    style={{
                                        color: '#94a3b8',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    The card will be replaced with a new random card from your pool.
                                    This action cannot be undone.
                                </p>
                            </div>

                            {pendingCardRemoval && (
                                <div
                                    style={{
                                        backgroundColor: '#1f2937',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        marginBottom: '24px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <p
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: '14px',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        Removing:
                                    </p>
                                    <p
                                        style={{
                                            color: '#F5C642',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {pendingCardRemoval.name ||
                                            (pendingCardRemoval.passive &&
                                            pendingCardRemoval.armorClass
                                                ? getArmorComboDisplayName(
                                                      pendingCardRemoval.passive,
                                                      pendingCardRemoval.armorClass,
                                                      null,
                                                  )
                                                : 'Unknown Item')}
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => {
                                        setShowRemoveCardConfirm(false)
                                        setPendingCardRemoval(null)
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px 24px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderRadius: '6px',
                                        border: '2px solid #64748b',
                                        backgroundColor: 'transparent',
                                        color: '#cbd5e1',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            'rgba(100, 116, 139, 0.2)'
                                        e.currentTarget.style.borderColor = '#94a3b8'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.borderColor = '#64748b'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRemoveCardFromDraft}
                                    style={{
                                        flex: 1,
                                        padding: '14px 24px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderRadius: '6px',
                                        border: '2px solid #f59e0b',
                                        backgroundColor: '#f59e0b',
                                        color: '#1f2937',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#d97706'
                                        e.currentTarget.style.borderColor = '#d97706'
                                        e.currentTarget.style.transform = 'translateY(-1px)'
                                        e.currentTarget.style.boxShadow =
                                            '0 4px 12px rgba(245, 158, 11, 0.4)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f59e0b'
                                        e.currentTarget.style.borderColor = '#f59e0b'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    Confirm Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Explainer Modal */}
                <ExplainerModal
                    isOpen={showExplainer}
                    onClose={() => setShowExplainer(false)}
                    faction={gameConfig.faction}
                />

                {/* Patch Notes Modal */}
                <PatchNotesModal
                    isOpen={showPatchNotes}
                    onClose={() => setShowPatchNotes(false)}
                    faction={gameConfig.faction}
                />

                {/* Gen AI Disclosure Modal */}
                <GenAIDisclosureModal
                    isOpen={showGenAIDisclosure}
                    onClose={() => setShowGenAIDisclosure(false)}
                    faction={gameConfig.faction}
                />

                {/* Contributors Modal */}
                <ContributorsModal
                    isOpen={showContributors}
                    onClose={() => setShowContributors(false)}
                    faction={gameConfig.faction}
                />

                {/* Run History Modal */}
                <RunHistoryModal
                    isOpen={showRunHistory}
                    onClose={() => setShowRunHistory(false)}
                    faction={gameConfig.faction}
                />
            </div>
        )
    }

    // SOLO_CONFIG PHASE - Game configuration for solo play
    if (phase === 'SOLO_CONFIG') {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: GRADIENTS.BACKGROUND,
                    color: 'white',
                    padding: '80px 24px',
                }}
            >
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <h1
                            style={{
                                fontSize: '48px',
                                fontWeight: '900',
                                color: factionColors.PRIMARY,
                                margin: '0 0 8px 0',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                textShadow: factionColors.GLOW,
                            }}
                        >
                            SOLO OPERATION
                        </h1>
                        <div
                            style={{
                                background: GRADIENTS.HEADER_BAR,
                                padding: '12px',
                                margin: '0 auto',
                                maxWidth: '400px',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3em',
                                    margin: 0,
                                }}
                            >
                                Configure Your Mission
                            </p>
                        </div>
                    </div>

                    {/* Game Configuration */}
                    <div
                        style={{
                            backgroundColor: COLORS.CARD_BG,
                            padding: '32px',
                            borderRadius: '8px',
                            border: `1px solid ${COLORS.CARD_BORDER}`,
                            marginBottom: '32px',
                        }}
                    >
                        <GameConfiguration
                            gameConfig={gameConfig}
                            eventsEnabled={eventsEnabled}
                            onUpdateGameConfig={(updates) =>
                                dispatch(actions.updateGameConfig(updates))
                            }
                            onSetSubfaction={(subfaction) =>
                                dispatch(actions.setSubfaction(subfaction))
                            }
                            onSetEventsEnabled={(enabled) =>
                                dispatch(actions.setEventsEnabled(enabled))
                            }
                            factionColors={factionColors}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button
                            onClick={() => dispatch(actions.setPhase('MENU'))}
                            style={{
                                flex: 1,
                                padding: '16px',
                                backgroundColor: 'transparent',
                                color: COLORS.TEXT_MUTED,
                                border: `2px solid ${COLORS.CARD_BORDER}`,
                                borderRadius: '4px',
                                fontWeight: '900',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = COLORS.TEXT_DISABLED
                                e.currentTarget.style.color = COLORS.TEXT_SECONDARY
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = COLORS.CARD_BORDER
                                e.currentTarget.style.color = COLORS.TEXT_MUTED
                            }}
                        >
                            ← BACK TO MENU
                        </button>
                        <button
                            onClick={() => dispatch(actions.setPhase('LOBBY'))}
                            style={{
                                ...BUTTON_STYLES.PRIMARY,
                                flex: 2,
                                padding: '16px',
                                fontSize: '16px',
                                letterSpacing: '0.15em',
                            }}
                        >
                            CONTINUE →
                        </button>
                    </div>
                </div>
            </div>
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
                <div style={{ minHeight: '100vh', padding: '24px', backgroundColor: '#1a2332' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginTop: '120px' }}>
                            <h1
                                style={{
                                    fontSize: '48px',
                                    fontWeight: '900',
                                    color: factionColors.PRIMARY,
                                    margin: '0 0 16px 0',
                                }}
                            >
                                HOST CONFIGURING CUSTOM START
                            </h1>
                            <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '18px' }}>
                                Please wait while the host configures the starting difficulty and
                                loadouts...
                            </p>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    marginTop: '32px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: factionColors.PRIMARY,
                                        animation: 'pulse 1.5s infinite',
                                    }}
                                />
                                <div
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: factionColors.PRIMARY,
                                        animation: 'pulse 1.5s infinite 0.2s',
                                    }}
                                />
                                <div
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: factionColors.PRIMARY,
                                        animation: 'pulse 1.5s infinite 0.4s',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
                </div>
            )
        }

        // Safety check: ensure customSetup.loadouts exists before proceeding
        if (!customSetup || !customSetup.loadouts) {
            return (
                <div style={{ minHeight: '100vh', padding: '24px', backgroundColor: '#1a2332' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginTop: '120px' }}>
                            <h1
                                style={{
                                    fontSize: '48px',
                                    fontWeight: '900',
                                    color: factionColors.PRIMARY,
                                    margin: '0 0 16px 0',
                                }}
                            >
                                LOADING...
                            </h1>
                        </div>
                    </div>
                </div>
            )
        }

        const updateLoadoutSlot = (playerIdx, slotType, itemId) => {
            const newLoadouts = [...customSetup.loadouts]
            if (slotType === 'stratagem') {
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
            <div style={{ minHeight: '100vh', padding: '24px', backgroundColor: '#1a2332' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h1
                            style={{
                                fontSize: '48px',
                                fontWeight: '900',
                                color: factionColors.PRIMARY,
                                margin: '0 0 16px 0',
                            }}
                        >
                            CUSTOM START SETUP
                        </h1>
                        <p style={{ color: '#94a3b8', margin: 0 }}>
                            Configure starting difficulty and loadouts
                        </p>
                    </div>

                    {/* Difficulty Selection */}
                    <div
                        style={{
                            backgroundColor: '#283548',
                            padding: '24px',
                            borderRadius: '8px',
                            marginBottom: '24px',
                            border: '1px solid rgba(100, 116, 139, 0.5)',
                        }}
                    >
                        <label
                            style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#94a3b8',
                                textTransform: 'uppercase',
                                marginBottom: '16px',
                            }}
                        >
                            Starting Difficulty
                        </label>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(10, 1fr)',
                                gap: '8px',
                            }}
                        >
                            {DIFFICULTY_CONFIG.map((diff) => (
                                <button
                                    key={diff.level}
                                    onClick={() =>
                                        dispatch(
                                            actions.updateCustomSetup({ difficulty: diff.level }),
                                        )
                                    }
                                    style={{
                                        padding: '12px 8px',
                                        backgroundColor:
                                            customSetup.difficulty === diff.level
                                                ? factionColors.PRIMARY
                                                : 'transparent',
                                        color:
                                            customSetup.difficulty === diff.level
                                                ? 'black'
                                                : '#cbd5e1',
                                        border:
                                            customSetup.difficulty === diff.level
                                                ? `2px solid ${factionColors.PRIMARY}`
                                                : '1px solid rgba(100, 116, 139, 0.5)',
                                        borderRadius: '4px',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    title={diff.name}
                                >
                                    {diff.level}
                                </button>
                            ))}
                        </div>
                        <div
                            style={{
                                marginTop: '8px',
                                textAlign: 'center',
                                color: factionColors.PRIMARY,
                                fontSize: '14px',
                            }}
                        >
                            {DIFFICULTY_CONFIG[customSetup.difficulty - 1]?.name}
                        </div>
                    </div>

                    {/* Player Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        {customSetup.loadouts.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedPlayer(i)}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor:
                                        selectedPlayer === i ? factionColors.PRIMARY : '#283548',
                                    color: selectedPlayer === i ? 'black' : '#cbd5e1',
                                    border: '1px solid rgba(100, 116, 139, 0.5)',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Helldiver {i + 1}
                            </button>
                        ))}
                    </div>

                    {/* Loadout Editor */}
                    <div
                        style={{
                            backgroundColor: '#283548',
                            padding: '24px',
                            borderRadius: '8px',
                            border: '1px solid rgba(100, 116, 139, 0.5)',
                        }}
                    >
                        <h3
                            style={{
                                color: factionColors.PRIMARY,
                                marginBottom: '16px',
                                fontSize: '18px',
                            }}
                        >
                            Loadout Configuration
                        </h3>

                        {/* Primary */}
                        <div style={{ marginBottom: '16px' }}>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11px',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                }}
                            >
                                Primary
                            </label>
                            <select
                                value={currentLoadout.primary || ''}
                                onChange={(e) =>
                                    updateLoadoutSlot(
                                        selectedPlayer,
                                        'primary',
                                        e.target.value || null,
                                    )
                                }
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#1f2937',
                                    color: factionColors.PRIMARY,
                                    border: '1px solid rgba(100, 116, 139, 0.5)',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">None</option>
                                {itemsByType.primary.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.rarity})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Secondary */}
                        <div style={{ marginBottom: '16px' }}>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11px',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                }}
                            >
                                Secondary
                            </label>
                            <select
                                value={currentLoadout.secondary || ''}
                                onChange={(e) =>
                                    updateLoadoutSlot(
                                        selectedPlayer,
                                        'secondary',
                                        e.target.value || null,
                                    )
                                }
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#1f2937',
                                    color: 'white',
                                    border: '1px solid rgba(100, 116, 139, 0.5)',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">None</option>
                                {itemsByType.secondary.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.rarity})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Grenade */}
                        <div style={{ marginBottom: '16px' }}>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11px',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                }}
                            >
                                Grenade
                            </label>
                            <select
                                value={currentLoadout.grenade || ''}
                                onChange={(e) =>
                                    updateLoadoutSlot(
                                        selectedPlayer,
                                        'grenade',
                                        e.target.value || null,
                                    )
                                }
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#1f2937',
                                    color: '#cbd5e1',
                                    border: '1px solid rgba(100, 116, 139, 0.5)',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">None</option>
                                {itemsByType.grenade.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.rarity})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Armor */}
                        <div style={{ marginBottom: '16px' }}>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11px',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                }}
                            >
                                Armor
                            </label>
                            <select
                                value={currentLoadout.armor || ''}
                                onChange={(e) =>
                                    updateLoadoutSlot(
                                        selectedPlayer,
                                        'armor',
                                        e.target.value || null,
                                    )
                                }
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#1f2937',
                                    color: '#cbd5e1',
                                    border: '1px solid rgba(100, 116, 139, 0.5)',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">None</option>
                                {itemsByType.armor.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.rarity})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Booster */}
                        <div style={{ marginBottom: '16px' }}>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11px',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                }}
                            >
                                Booster
                            </label>
                            <select
                                value={currentLoadout.booster || ''}
                                onChange={(e) =>
                                    updateLoadoutSlot(
                                        selectedPlayer,
                                        'booster',
                                        e.target.value || null,
                                    )
                                }
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#1f2937',
                                    color: '#cbd5e1',
                                    border: '1px solid rgba(100, 116, 139, 0.5)',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">None</option>
                                {itemsByType.booster.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.rarity})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stratagems */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11px',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                }}
                            >
                                Stratagems
                            </label>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '8px',
                                }}
                            >
                                {[0, 1, 2, 3].map((slotIdx) => (
                                    <select
                                        key={slotIdx}
                                        value={currentLoadout.stratagems[slotIdx] || ''}
                                        onChange={(e) => {
                                            const newStratagems = [...currentLoadout.stratagems]
                                            newStratagems[slotIdx] = e.target.value || null
                                            updateLoadoutSlot(
                                                selectedPlayer,
                                                'stratagems',
                                                newStratagems,
                                            )
                                        }}
                                        style={{
                                            padding: '8px',
                                            backgroundColor: '#1f2937',
                                            color: 'white',
                                            border: '1px solid rgba(100, 116, 139, 0.5)',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                        }}
                                    >
                                        <option value="">Slot {slotIdx + 1}: None</option>
                                        {itemsByType.stratagem.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                        <button
                            onClick={() => dispatch(actions.setPhase('MENU'))}
                            style={{
                                flex: 1,
                                padding: '16px',
                                backgroundColor: 'rgba(127, 29, 29, 0.3)',
                                color: '#ef4444',
                                border: '1px solid #7f1d1d',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            Back to Menu
                        </button>
                        <button
                            onClick={startGameFromCustomSetup}
                            style={{
                                ...BUTTON_STYLES.PRIMARY,
                                flex: 2,
                                padding: '16px',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '18px',
                                letterSpacing: '0.1em',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_HOVER
                                e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY_HOVER
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = COLORS.PRIMARY
                                e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY
                            }}
                        >
                            Start Operation
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (phase === 'EVENT') {
        if (!currentEvent) {
            dispatch(actions.setPhase('DRAFT'))
            return null
        }

        const handleEventChoice = (choice) => {
            // Track event choice
            trackEventChoice(currentEvent?.type || 'unknown', choice.id || 'unknown')

            // Record event for analytics
            runAnalytics.recordGameEvent(
                currentEvent?.id || 'unknown',
                currentEvent?.name || 'Unknown Event',
                currentEvent?.type || 'unknown',
                choice.text || 'Unknown Choice',
                formatOutcomes(choice.outcomes),
            )

            // Process outcomes using the event processor with selections
            const selections = {
                sourcePlayerSelection: eventSourcePlayerSelection,
                stratagemSelection: eventStratagemSelection,
                targetPlayerSelection: eventTargetPlayerSelection,
                targetStratagemSelection: eventTargetStratagemSelection,
            }

            const updates = processAllOutcomes(
                choice.outcomes,
                choice,
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
                dispatch(actions.setPendingFaction(updates.pendingFaction))
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
                const configUpdates = {}
                if (updates.faction !== undefined) configUpdates.faction = updates.faction
                if (updates.subfaction !== undefined) configUpdates.subfaction = updates.subfaction
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
                const transformList = updates.transformedSlots
                    .map(
                        (t) =>
                            `${t.slot.replace('_', ' ').toUpperCase()}: ${t.oldItem} → ${t.newItem}`,
                    )
                    .join('\n• ')
                setTimeout(() => {
                    alert(
                        `Quantum Reconfiguration Complete!\n\n${updates.transformedSlots.length} item${updates.transformedSlots.length > 1 ? 's' : ''} transformed:\n\n• ${transformList}`,
                    )
                }, 100)
            }

            // Check if we need to immediately start a redraft
            if (updates.needsRedraft && updates.redraftPlayerIndex !== undefined) {
                // Show liquidated items message
                if (updates.liquidatedItems && updates.liquidatedItems.length > 0) {
                    const itemsList = updates.liquidatedItems.join('\n• ')
                    const draftCount = updates.redraftCount || 1
                    setTimeout(() => {
                        alert(
                            `Assets Liquidated (${updates.liquidatedItems.length} items):\n\n• ${itemsList}\n\nYou will now complete ${draftCount} draft round${draftCount > 1 ? 's' : ''} to rebuild your loadout.`,
                        )
                    }, 100)
                }

                // Close event
                dispatch(actions.setCurrentEvent(null))
                dispatch(actions.resetEventSelections())

                // Start first draft round for the redrafting player
                const redraftPlayer = updates.players[updates.redraftPlayerIndex]
                const playerLockedSlots = redraftPlayer?.lockedSlots || []
                const redraftHand = generateDraftHand(
                    redraftPlayer,
                    currentDiff,
                    gameConfig,
                    burnedCards,
                    updates.players,
                    (cardId) => dispatch(actions.addBurnedCard(cardId)),
                    getDraftHandSize(gameConfig.starRating),
                    playerLockedSlots,
                )

                dispatch(
                    actions.setDraftState({
                        activePlayerIndex: updates.redraftPlayerIndex,
                        roundCards: redraftHand,
                        isRerolling: false,
                        pendingStratagem: null,
                        extraDraftRound: 0,
                        isRedrafting: true, // Flag to indicate this is a redraft
                        draftOrder: [updates.redraftPlayerIndex], // Single player redraft
                    }),
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
                setTimeout(() => {
                    const itemList = updates.gainedItems
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
                const outcome = window.__boosterOutcome
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
                let outcomesToProcess = []

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
                    const configUpdates = {}
                    if (updates.faction !== undefined) configUpdates.faction = updates.faction
                    if (updates.subfaction !== undefined)
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
            <div style={{ minHeight: '100vh' }}>
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
                    pendingSubfactionSelection={pendingSubfactionSelection}
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
                                faction: pendingFaction,
                                subfaction: pendingSubfactionSelection,
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

                        dispatch(actions.setEventSpecialDraftSelection(playerIndex, itemId))
                    }}
                    onConfirmSelections={handleEventChoice}
                />
            </div>
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

        const sacrificableItems = []

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
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '16px',
                        gap: '12px',
                    }}
                >
                    <button
                        onClick={exportGameState}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: 'rgba(100, 116, 139, 0.3)',
                            color: '#94a3b8',
                            border: '1px solid rgba(100, 116, 139, 0.5)',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.5)'
                            e.currentTarget.style.color = factionColors.PRIMARY
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)'
                            e.currentTarget.style.color = '#94a3b8'
                        }}
                    >
                        💾 Export
                    </button>
                </div>

                <div
                    style={{
                        width: '100%',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div
                            style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                border: '2px solid rgba(239, 68, 68, 0.5)',
                                borderRadius: '8px',
                                padding: '16px 32px',
                                marginBottom: '24px',
                                display: 'inline-block',
                            }}
                        >
                            <div
                                style={{
                                    color: '#ef4444',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                ⚠️ EXTRACTION FAILURE PENALTY
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
                                Equipment Lost in Combat Zone
                            </div>
                        </div>

                        <h1
                            style={{
                                fontSize: '36px',
                                fontWeight: '900',
                                color: 'white',
                                textTransform: 'uppercase',
                                margin: '0 0 8px 0',
                            }}
                        >
                            {player.name} <span style={{ color: '#64748b' }}>//</span> Sacrifice
                            Item
                        </h1>
                        <p style={{ color: '#94a3b8', margin: '0' }}>
                            Select one item from your loadout to sacrifice (minimum gear protected)
                        </p>
                    </div>

                    {sacrificableItems.length === 0 ? (
                        <div
                            style={{
                                backgroundColor: '#283548',
                                padding: '40px',
                                borderRadius: '12px',
                                border: '1px solid rgba(100, 116, 139, 0.5)',
                                textAlign: 'center',
                                maxWidth: '600px',
                            }}
                        >
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
                            <h3
                                style={{
                                    color: factionColors.PRIMARY,
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    marginBottom: '8px',
                                }}
                            >
                                No Items to Sacrifice
                            </h3>
                            <p style={{ color: '#94a3b8', margin: 0 }}>
                                You only have minimum required equipment (P2-Peacemaker & B-01
                                Tactical).
                            </p>
                            <button
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
                                style={{
                                    ...BUTTON_STYLES.PRIMARY,
                                    marginTop: '24px',
                                    padding: '12px 32px',
                                    border: 'none',
                                    borderRadius: '4px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = COLORS.PRIMARY_HOVER
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = COLORS.PRIMARY
                                }}
                            >
                                Continue
                            </button>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${Math.min(sacrificableItems.length, 4)}, 1fr)`,
                                gap: '24px',
                                marginBottom: '48px',
                                width: '100%',
                                opacity: isMyTurn ? 1 : 0.6,
                                pointerEvents: isMyTurn ? 'auto' : 'none',
                            }}
                        >
                            {sacrificableItems.map((item, idx) => (
                                <div
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
                                    style={{
                                        backgroundColor: '#283548',
                                        border: '2px solid rgba(239, 68, 68, 0.5)',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        cursor: isMyTurn ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#ef4444'
                                        e.currentTarget.style.backgroundColor = '#1f2937'
                                        e.currentTarget.style.transform = 'translateY(-4px)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
                                        e.currentTarget.style.backgroundColor = '#283548'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        {item.slot}
                                    </div>
                                    <div
                                        style={{
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                        }}
                                    >
                                        {item.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        {item.rarity}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            color: '#ef4444',
                                            fontStyle: 'italic',
                                            marginTop: 'auto',
                                        }}
                                    >
                                        Click to sacrifice
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!isMyTurn && (
                        <div
                            style={{
                                backgroundColor: '#283548',
                                padding: '24px',
                                borderRadius: '12px',
                                border: '1px solid rgba(100, 116, 139, 0.5)',
                                textAlign: 'center',
                                marginTop: '24px',
                            }}
                        >
                            <div
                                style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '8px' }}
                            >
                                Waiting for {player.name} to sacrifice an item...
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                                Please wait for your turn
                            </div>
                        </div>
                    )}
                </div>

                {/* Sacrifice Item Confirmation Modal */}
                {showSacrificeConfirm && pendingSacrificeItem && (
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
                            zIndex: 2000,
                            padding: '24px',
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#283548',
                                borderRadius: '12px',
                                border: '3px solid #ef4444',
                                padding: '32px',
                                maxWidth: '600px',
                                width: '100%',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                            }}
                        >
                            <h2
                                style={{
                                    color: '#ef4444',
                                    fontSize: '28px',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    marginBottom: '24px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                ⚠️ Sacrifice Item
                            </h2>

                            <div
                                style={{
                                    backgroundColor: '#1f2937',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    marginBottom: '24px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                }}
                            >
                                <p
                                    style={{
                                        color: '#cbd5e1',
                                        fontSize: '16px',
                                        lineHeight: '1.6',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <strong style={{ color: '#ef4444' }}>
                                        ⚠️ Extraction Failure Penalty
                                    </strong>
                                </p>
                                <p
                                    style={{
                                        color: '#cbd5e1',
                                        fontSize: '15px',
                                        lineHeight: '1.6',
                                        marginBottom: '0',
                                    }}
                                >
                                    This item will be{' '}
                                    <strong style={{ color: '#fca5a5' }}>
                                        permanently removed
                                    </strong>{' '}
                                    from your inventory and loadout. This action cannot be undone.
                                </p>
                            </div>

                            <div
                                style={{
                                    backgroundColor: '#1f2937',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginBottom: '24px',
                                    textAlign: 'center',
                                }}
                            >
                                <p
                                    style={{
                                        color: '#94a3b8',
                                        fontSize: '14px',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Sacrificing:
                                </p>
                                <p
                                    style={{
                                        color: '#ef4444',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        marginBottom: '4px',
                                    }}
                                >
                                    {pendingSacrificeItem.name}
                                </p>
                                <p style={{ color: '#64748b', fontSize: '14px' }}>
                                    {pendingSacrificeItem.slot} • {pendingSacrificeItem.rarity}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => {
                                        // eslint-disable-next-line no-console
                                        console.log('Cancel button clicked')
                                        setShowSacrificeConfirm(false)
                                        setPendingSacrificeItem(null)
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px 24px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderRadius: '6px',
                                        border: '2px solid #64748b',
                                        backgroundColor: 'transparent',
                                        color: '#cbd5e1',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            'rgba(100, 116, 139, 0.2)'
                                        e.currentTarget.style.borderColor = '#94a3b8'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.borderColor = '#64748b'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // eslint-disable-next-line no-console
                                        console.log('Confirm sacrifice button clicked')
                                        handleSacrifice(pendingSacrificeItem)
                                        setShowSacrificeConfirm(false)
                                        setPendingSacrificeItem(null)
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px 24px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderRadius: '6px',
                                        border: '2px solid #ef4444',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#dc2626'
                                        e.currentTarget.style.borderColor = '#dc2626'
                                        e.currentTarget.style.transform = 'translateY(-1px)'
                                        e.currentTarget.style.boxShadow =
                                            '0 4px 12px rgba(239, 68, 68, 0.4)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#ef4444'
                                        e.currentTarget.style.borderColor = '#ef4444'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    Confirm Sacrifice
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (phase === 'DRAFT') {
        const player = players[draftState.activePlayerIndex]

        // In multiplayer, check if it's this player's turn to draft
        const isMyTurn = !isMultiplayer || playerSlot === draftState.activePlayerIndex

        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* MULTIPLAYER STATUS BAR */}
                {isMultiplayer && (
                    <MultiplayerStatusBar gameConfig={gameConfig} onDisconnect={disconnect} />
                )}

                <div style={{ padding: '24px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginBottom: '16px',
                            gap: '12px',
                        }}
                    >
                        <button
                            onClick={exportGameState}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                backgroundColor: 'rgba(100, 116, 139, 0.3)',
                                color: '#94a3b8',
                                border: '1px solid rgba(100, 116, 139, 0.5)',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.5)'
                                e.currentTarget.style.color = factionColors.PRIMARY
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)'
                                e.currentTarget.style.color = '#94a3b8'
                            }}
                        >
                            💾 Export
                        </button>
                    </div>

                    {/* Stratagem Replacement Modal */}
                    {draftState.pendingStratagem && (
                        <div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000,
                                padding: '24px',
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: '#283548',
                                    borderRadius: '12px',
                                    border: `2px solid ${factionColors.PRIMARY}`,
                                    padding: '32px',
                                    maxWidth: '800px',
                                    width: '100%',
                                }}
                            >
                                <h2
                                    style={{
                                        color: factionColors.PRIMARY,
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        marginBottom: '16px',
                                    }}
                                >
                                    Replace Stratagem
                                </h2>
                                <p
                                    style={{
                                        color: '#cbd5e1',
                                        textAlign: 'center',
                                        marginBottom: '24px',
                                    }}
                                >
                                    All stratagem slots are full. Select which stratagem to replace
                                    with:
                                </p>
                                <div
                                    style={{
                                        backgroundColor: '#1f2937',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        marginBottom: '24px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            color: factionColors.PRIMARY,
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                        }}
                                    >
                                        {draftState.pendingStratagem.name}
                                    </div>
                                    <div
                                        style={{
                                            color: '#64748b',
                                            fontSize: '12px',
                                            marginTop: '4px',
                                        }}
                                    >
                                        {draftState.pendingStratagem.rarity}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '16px',
                                        marginBottom: '24px',
                                    }}
                                >
                                    {player.loadout.stratagems.map((sid, i) => {
                                        const stratagem = getItemById(sid)
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleStratagemReplacement(i)}
                                                style={{
                                                    backgroundColor: '#1f2937',
                                                    border: '2px solid rgba(100, 116, 139, 0.5)',
                                                    borderRadius: '8px',
                                                    padding: '16px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'left',
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.borderColor =
                                                        factionColors.PRIMARY)
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.borderColor =
                                                        'rgba(100, 116, 139, 0.5)')
                                                }
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '10px',
                                                        color: '#64748b',
                                                        textTransform: 'uppercase',
                                                        marginBottom: '4px',
                                                    }}
                                                >
                                                    Slot {i + 1}
                                                </div>
                                                <div
                                                    style={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        fontSize: '14px',
                                                    }}
                                                >
                                                    {stratagem?.name || 'Empty'}
                                                </div>
                                                {stratagem && (
                                                    <div
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#94a3b8',
                                                            marginTop: '4px',
                                                        }}
                                                    >
                                                        {stratagem.rarity}
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={() =>
                                        dispatch(
                                            actions.updateDraftState({ pendingStratagem: null }),
                                        )
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: 'rgba(127, 29, 29, 0.3)',
                                        color: '#ef4444',
                                        border: '1px solid #7f1d1d',
                                        borderRadius: '4px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.backgroundColor =
                                            'rgba(127, 29, 29, 0.5)')
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.backgroundColor =
                                            'rgba(127, 29, 29, 0.3)')
                                    }
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div
                        style={{
                            width: '100%',
                            maxWidth: '1200px',
                            margin: '0 auto',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            {draftState.isRetrospective && (
                                <div
                                    style={{
                                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                        border: '2px solid rgba(59, 130, 246, 0.4)',
                                        borderRadius: '8px',
                                        padding: '12px 24px',
                                        marginBottom: '16px',
                                        display: 'inline-block',
                                    }}
                                >
                                    <div
                                        style={{
                                            color: '#3b82f6',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        🔄 RETROSPECTIVE DRAFT{' '}
                                        {(player.retrospectiveDraftsCompleted || 0) + 1}/
                                        {player.catchUpDraftsRemaining || draftHistory.length}
                                    </div>
                                    <div
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: '11px',
                                            marginTop: '4px',
                                        }}
                                    >
                                        Catching up on past mission rewards • No rerolls available
                                    </div>
                                </div>
                            )}
                            {draftState.extraDraftRound > 0 && (
                                <div
                                    style={{
                                        backgroundColor: `${factionColors.PRIMARY}20`,
                                        border: `2px solid ${factionColors.PRIMARY}`,
                                        borderRadius: '8px',
                                        padding: '12px 24px',
                                        marginBottom: '16px',
                                        display: 'inline-block',
                                    }}
                                >
                                    <div
                                        style={{
                                            color: factionColors.PRIMARY,
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        🎁 BONUS DRAFT {draftState.extraDraftRound}/
                                        {player.extraDraftCards || 0}
                                    </div>
                                    <div
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: '11px',
                                            marginTop: '4px',
                                        }}
                                    >
                                        Priority Access Equipment
                                    </div>
                                </div>
                            )}
                            {draftState.isRedrafting && player.redraftRounds > 0 && (
                                <div
                                    style={{
                                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                        border: '2px solid rgba(239, 68, 68, 0.4)',
                                        borderRadius: '8px',
                                        padding: '12px 24px',
                                        marginBottom: '16px',
                                        display: 'inline-block',
                                    }}
                                >
                                    <div
                                        style={{
                                            color: factionColors.PRIMARY,
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        🔄 ASSET REINVESTMENT
                                    </div>
                                    <div
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: '11px',
                                            marginTop: '4px',
                                        }}
                                    >
                                        Draft {player.redraftRounds} of {player.redraftRounds}{' '}
                                        Remaining
                                    </div>
                                </div>
                            )}
                            <h2
                                style={{
                                    color: factionColors.PRIMARY,
                                    fontSize: '14px',
                                    fontFamily: 'monospace',
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                    letterSpacing: '1px',
                                }}
                            >
                                Priority Requisition Authorized
                            </h2>
                            <h1
                                style={{
                                    fontSize: '36px',
                                    fontWeight: '900',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    margin: '0 0 8px 0',
                                }}
                            >
                                {player.name} <span style={{ color: '#64748b' }}>//</span> Select
                                Upgrade
                            </h1>
                            <p style={{ color: '#94a3b8', margin: '0' }}>
                                Choose wisely. This equipment is vital for Difficulty {currentDiff}.
                            </p>
                        </div>

                        {/* Current Loadout Overview */}
                        <div
                            style={{
                                backgroundColor: 'rgba(40, 53, 72, 0.5)',
                                borderRadius: '8px',
                                padding: '16px 24px',
                                marginBottom: '32px',
                                border: '1px solid rgba(100, 116, 139, 0.3)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '12px',
                                }}
                            >
                                {player.name}'s Current Loadout
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '24px',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                }}
                            >
                                {/* Primary */}
                                <div style={{ textAlign: 'center' }}>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#94a3b8',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Primary
                                    </div>
                                    <div
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: player.loadout.primary
                                                ? 'rgba(100, 116, 139, 0.3)'
                                                : 'rgba(100, 116, 139, 0.1)',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            color: player.loadout.primary
                                                ? factionColors.PRIMARY
                                                : '#64748b',
                                        }}
                                    >
                                        {player.loadout.primary
                                            ? getItemById(player.loadout.primary)?.name || '—'
                                            : '—'}
                                    </div>
                                </div>

                                {/* Stratagems */}
                                <div style={{ textAlign: 'center' }}>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#94a3b8',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Stratagems
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {player.loadout.stratagems.map((sid, i) => {
                                            const strat = sid ? getItemById(sid) : null
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: strat
                                                            ? 'rgba(100, 116, 139, 0.3)'
                                                            : 'rgba(100, 116, 139, 0.1)',
                                                        borderRadius: '4px',
                                                        fontSize: '10px',
                                                        color: strat ? '#cbd5e1' : '#64748b',
                                                        maxWidth: '80px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                    title={strat?.name || 'Empty'}
                                                >
                                                    {strat?.name || '—'}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Secondary */}
                                <div style={{ textAlign: 'center' }}>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#94a3b8',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Secondary
                                    </div>
                                    <div
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: player.loadout.secondary
                                                ? 'rgba(100, 116, 139, 0.3)'
                                                : 'rgba(100, 116, 139, 0.1)',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            color: player.loadout.secondary ? '#cbd5e1' : '#64748b',
                                        }}
                                    >
                                        {player.loadout.secondary
                                            ? getItemById(player.loadout.secondary)?.name || '—'
                                            : '—'}
                                    </div>
                                </div>

                                {/* Grenade */}
                                <div style={{ textAlign: 'center' }}>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#94a3b8',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Grenade
                                    </div>
                                    <div
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: player.loadout.grenade
                                                ? 'rgba(100, 116, 139, 0.3)'
                                                : 'rgba(100, 116, 139, 0.1)',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            color: player.loadout.grenade ? '#cbd5e1' : '#64748b',
                                        }}
                                    >
                                        {player.loadout.grenade
                                            ? getItemById(player.loadout.grenade)?.name || '—'
                                            : '—'}
                                    </div>
                                </div>

                                {/* Armor */}
                                <div style={{ textAlign: 'center' }}>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#94a3b8',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Armor
                                    </div>
                                    <div
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: player.loadout.armor
                                                ? 'rgba(100, 116, 139, 0.3)'
                                                : 'rgba(100, 116, 139, 0.1)',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            color: player.loadout.armor ? '#cbd5e1' : '#64748b',
                                        }}
                                    >
                                        {player.loadout.armor
                                            ? getItemById(player.loadout.armor)?.name || '—'
                                            : '—'}
                                    </div>
                                </div>

                                {/* Booster */}
                                {player.loadout.booster && (
                                    <div style={{ textAlign: 'center' }}>
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                color: '#94a3b8',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            Booster
                                        </div>
                                        <div
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                color: '#22c55e',
                                            }}
                                        >
                                            {getItemById(player.loadout.booster)?.name || '—'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Filter out any null/undefined items that may have been stripped during sync */}
                        {(() => {
                            const validCards = (draftState.roundCards || []).filter(
                                (item) => item && (item.id || item.name || item.passive),
                            )
                            return (
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${Math.min(validCards.length, 4)}, 1fr)`,
                                        gap: '24px',
                                        marginBottom: '48px',
                                        opacity: isMyTurn ? 1 : 0.6,
                                        pointerEvents: isMyTurn ? 'auto' : 'none',
                                    }}
                                >
                                    {validCards.map((item, idx) => (
                                        <ItemCard
                                            key={`${item.id || item.name || item.passive}-${idx}`}
                                            item={item}
                                            onSelect={isMyTurn ? handleDraftPick : null}
                                            onRemove={isMyTurn ? removeCardFromDraft : null}
                                        />
                                    ))}
                                </div>
                            )
                        })()}

                        {/* Not your turn message */}
                        {!isMyTurn && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginBottom: '32px',
                                    padding: '16px 32px',
                                    backgroundColor: 'rgba(100, 116, 139, 0.2)',
                                    border: '2px solid rgba(100, 116, 139, 0.4)',
                                    borderRadius: '8px',
                                    display: 'inline-block',
                                    margin: '0 auto 32px auto',
                                }}
                            >
                                <div
                                    style={{
                                        color: '#94a3b8',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Waiting for {player.name} to draft...
                                </div>
                            </div>
                        )}

                        {/* Only show draft controls if it's your turn */}
                        {isMyTurn && (
                            <>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '24px',
                                    }}
                                >
                                    {/* Disable rerolling during retrospective drafts */}
                                    {!draftState.isRetrospective && (
                                        <button
                                            onClick={() => rerollDraft(1)}
                                            disabled={requisition < 1}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px 32px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                border:
                                                    requisition >= 1
                                                        ? '2px solid white'
                                                        : '2px solid #334155',
                                                backgroundColor: 'transparent',
                                                color: requisition >= 1 ? 'white' : '#64748b',
                                                cursor:
                                                    requisition >= 1 ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <RefreshCw size={20} />
                                            Reroll All Cards (-1 Req)
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSkipDraft}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 32px',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            border: '2px solid #64748b',
                                            backgroundColor: 'transparent',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#94a3b8'
                                            e.currentTarget.style.color = 'white'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#64748b'
                                            e.currentTarget.style.color = '#94a3b8'
                                        }}
                                    >
                                        Skip Draft
                                    </button>
                                </div>

                                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0' }}>
                                        Click the × on a card to remove just that card (free)
                                        <br />
                                        Or use "Reroll All Cards" to reroll the entire hand
                                    </p>
                                </div>
                            </>
                        )}

                        <div style={{ marginTop: '32px', textAlign: 'center' }}>
                            <span style={{ color: factionColors.PRIMARY, fontFamily: 'monospace' }}>
                                Current Requisition: {Math.floor(requisition)} R
                            </span>
                        </div>
                    </div>
                </div>

                {/* Remove Card Confirmation Modal */}
                {showRemoveCardConfirm && (
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
                            zIndex: 2000,
                            padding: '24px',
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#283548',
                                borderRadius: '12px',
                                border: '3px solid #f59e0b',
                                padding: '32px',
                                maxWidth: '600px',
                                width: '100%',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                            }}
                        >
                            <h2
                                style={{
                                    color: '#f59e0b',
                                    fontSize: '28px',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    marginBottom: '24px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                ⚠️ Remove Card
                            </h2>

                            <div
                                style={{
                                    backgroundColor: '#1f2937',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    marginBottom: '24px',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                            >
                                <p
                                    style={{
                                        color: '#cbd5e1',
                                        fontSize: '16px',
                                        lineHeight: '1.6',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <strong style={{ color: '#f59e0b' }}>
                                        ⚠️ Important Notice:
                                    </strong>
                                </p>
                                <p
                                    style={{
                                        color: '#cbd5e1',
                                        fontSize: '15px',
                                        lineHeight: '1.6',
                                        marginBottom: '12px',
                                    }}
                                >
                                    This feature should{' '}
                                    <strong style={{ color: '#fbbf24' }}>only be used</strong> if
                                    you misconfigured your warbonds and do not have access to an
                                    item that appeared in your draft.
                                </p>
                                <p
                                    style={{
                                        color: '#94a3b8',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    The card will be replaced with a new random card from your pool.
                                    This action cannot be undone.
                                </p>
                            </div>

                            {pendingCardRemoval && (
                                <div
                                    style={{
                                        backgroundColor: '#1f2937',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        marginBottom: '24px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <p
                                        style={{
                                            color: '#94a3b8',
                                            fontSize: '14px',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        Removing:
                                    </p>
                                    <p
                                        style={{
                                            color: '#F5C642',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {pendingCardRemoval.name ||
                                            (pendingCardRemoval.passive &&
                                            pendingCardRemoval.armorClass
                                                ? getArmorComboDisplayName(
                                                      pendingCardRemoval.passive,
                                                      pendingCardRemoval.armorClass,
                                                      null,
                                                  )
                                                : 'Unknown Item')}
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => {
                                        setShowRemoveCardConfirm(false)
                                        setPendingCardRemoval(null)
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px 24px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderRadius: '6px',
                                        border: '2px solid #64748b',
                                        backgroundColor: 'transparent',
                                        color: '#cbd5e1',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            'rgba(100, 116, 139, 0.2)'
                                        e.currentTarget.style.borderColor = '#94a3b8'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.borderColor = '#64748b'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRemoveCardFromDraft}
                                    style={{
                                        flex: 1,
                                        padding: '14px 24px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderRadius: '6px',
                                        border: '2px solid #f59e0b',
                                        backgroundColor: '#f59e0b',
                                        color: '#1f2937',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#d97706'
                                        e.currentTarget.style.borderColor = '#d97706'
                                        e.currentTarget.style.transform = 'translateY(-1px)'
                                        e.currentTarget.style.boxShadow =
                                            '0 4px 12px rgba(245, 158, 11, 0.4)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f59e0b'
                                        e.currentTarget.style.borderColor = '#f59e0b'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    Confirm Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // DASHBOARD PHASE
    return (
        <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
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
                subfaction={gameConfig.subfaction}
                samples={state.samples}
                onExport={exportGameState}
                onHelp={() => setShowExplainer(true)}
            />

            {/* MAIN CONTENT */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
                {/* PLAYER ROSTER */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            gameConfig.playerCount > 1
                                ? 'repeat(auto-fit, minmax(400px, 1fr))'
                                : '1fr',
                        gap: '32px',
                        marginBottom: '48px',
                    }}
                >
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
                                isConnected={isConnected}
                                isMultiplayer={isMultiplayer}
                            />
                        )
                    })}
                </div>

                {/* CONTROLS */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                    }}
                >
                    {/* Mission Objective Header */}
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '800px',
                            backgroundColor: `${factionColors.PRIMARY}20`,
                            padding: '20px',
                            borderRadius: '8px',
                            border: `2px solid ${factionColors.PRIMARY}`,
                            textAlign: 'center',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: factionColors.PRIMARY,
                                textTransform: 'uppercase',
                                margin: 0,
                                letterSpacing: '1px',
                            }}
                        >
                            📍 Current Objective
                        </h2>
                        <p
                            style={{
                                fontSize: '16px',
                                color: 'white',
                                margin: '12px 0 0 0',
                                fontWeight: 'bold',
                            }}
                        >
                            Complete a mission at Difficulty {currentDiff}
                            {gameConfig.enduranceMode &&
                                ` (Operation: ${currentMission}/${getMissionsForDifficulty(currentDiff)})`}
                        </p>
                    </div>

                    <div
                        style={{
                            width: '100%',
                            maxWidth: '800px',
                            backgroundColor: '#283548',
                            padding: '24px',
                            borderRadius: '12px',
                            border: '1px solid rgba(100, 116, 139, 0.5)',
                            textAlign: 'center',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: 'white',
                                textTransform: 'uppercase',
                                marginBottom: '8px',
                            }}
                        >
                            Mission Status Report
                        </h2>
                        {gameConfig.enduranceMode && (
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: factionColors.PRIMARY,
                                    fontFamily: 'monospace',
                                    marginBottom: '16px',
                                    fontWeight: 'bold',
                                }}
                            >
                                Operation Status: Mission {currentMission}/
                                {getMissionsForDifficulty(currentDiff)}
                            </div>
                        )}

                        {/* Star Rating Selection */}
                        <div
                            style={{
                                marginBottom: '32px',
                                opacity: !isMultiplayer || isHost ? 1 : 0.6,
                            }}
                        >
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    marginBottom: '16px',
                                }}
                            >
                                Mission Performance Rating
                            </label>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    gap: '12px',
                                    marginBottom: '12px',
                                    pointerEvents: !isMultiplayer || isHost ? 'auto' : 'none',
                                }}
                            >
                                {[1, 2, 3, 4, 5].map((n) => {
                                    // Calculate max allowed stars based on current difficulty
                                    // D1-D2: max 2 stars, D3-D4: max 3 stars, D5-D6: max 4 stars, D7+: max 5 stars
                                    const getMaxStarsForDifficulty = (diff) => {
                                        if (diff <= 2) return 2
                                        if (diff <= 4) return 3
                                        if (diff <= 6) return 4
                                        return 5
                                    }

                                    const maxStars = getMaxStarsForDifficulty(currentDiff)
                                    const isDisabled = n > maxStars || (isMultiplayer && !isHost)

                                    return (
                                        <button
                                            key={n}
                                            onClick={() =>
                                                !isDisabled &&
                                                dispatch(
                                                    actions.updateGameConfig({ starRating: n }),
                                                )
                                            }
                                            disabled={isDisabled}
                                            style={{
                                                padding: '16px 8px',
                                                borderRadius: '4px',
                                                fontWeight: '900',
                                                fontSize: '24px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s',
                                                backgroundColor:
                                                    gameConfig.starRating === n
                                                        ? factionColors.PRIMARY
                                                        : 'transparent',
                                                color: isDisabled
                                                    ? '#334155'
                                                    : gameConfig.starRating === n
                                                      ? 'black'
                                                      : '#64748b',
                                                border:
                                                    gameConfig.starRating === n
                                                        ? `2px solid ${factionColors.PRIMARY}`
                                                        : isDisabled
                                                          ? '1px solid #1e293b'
                                                          : '1px solid rgba(100, 116, 139, 0.5)',
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                opacity: isDisabled ? 0.4 : 1,
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isDisabled && gameConfig.starRating !== n) {
                                                    e.currentTarget.style.borderColor = '#64748b'
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isDisabled && gameConfig.starRating !== n) {
                                                    e.currentTarget.style.borderColor =
                                                        'rgba(100, 116, 139, 0.5)'
                                                }
                                            }}
                                        >
                                            <div>{n}</div>
                                            <div style={{ fontSize: '16px' }}>★</div>
                                        </button>
                                    )
                                })}
                            </div>
                            <p
                                style={{
                                    fontSize: '11px',
                                    color: '#64748b',
                                    fontStyle: 'italic',
                                    margin: 0,
                                }}
                            >
                                {getDraftHandSize()} equipment cards will be offered
                            </p>
                        </div>

                        {/* Samples Collected */}
                        <div
                            style={{
                                marginBottom: '32px',
                                opacity: !isMultiplayer || isHost ? 1 : 0.6,
                            }}
                        >
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    marginBottom: '12px',
                                }}
                            >
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
                            </label>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '16px',
                                    marginBottom: '8px',
                                }}
                            >
                                {/* Common Samples */}
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <img
                                            src="https://helldivers.wiki.gg/images/Common_Sample_Logo.svg"
                                            alt="Common"
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#22c55e',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Common
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="999"
                                        defaultValue="0"
                                        id="commonSamples"
                                        disabled={isMultiplayer && !isHost}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #22c55e',
                                            borderRadius: '4px',
                                            color: '#22c55e',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            fontFamily: 'monospace',
                                            cursor:
                                                !isMultiplayer || isHost ? 'text' : 'not-allowed',
                                        }}
                                    />
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#64748b',
                                            marginTop: '4px',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        +1% event chance each
                                    </div>
                                </div>

                                {/* Rare Samples */}
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <img
                                            src="https://helldivers.wiki.gg/images/Rare_Sample_Logo.svg"
                                            alt="Rare"
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#f97316',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Rare
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="999"
                                        defaultValue="0"
                                        id="rareSamples"
                                        disabled={isMultiplayer && !isHost}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #f97316',
                                            borderRadius: '4px',
                                            color: '#f97316',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            fontFamily: 'monospace',
                                            cursor:
                                                !isMultiplayer || isHost ? 'text' : 'not-allowed',
                                        }}
                                    />
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#64748b',
                                            marginTop: '4px',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        +2% event chance each
                                    </div>
                                </div>

                                {/* Super Rare Samples */}
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <img
                                            src="https://helldivers.wiki.gg/images/Super_Sample_Logo.svg"
                                            alt="Super Rare"
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#a855f7',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Super Rare
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="999"
                                        defaultValue="0"
                                        id="superRareSamples"
                                        disabled={isMultiplayer && !isHost}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #a855f7',
                                            borderRadius: '4px',
                                            color: '#a855f7',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            fontFamily: 'monospace',
                                            cursor:
                                                !isMultiplayer || isHost ? 'text' : 'not-allowed',
                                        }}
                                    />
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#64748b',
                                            marginTop: '4px',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        +3% event chance each
                                    </div>
                                </div>
                            </div>
                            <p
                                style={{
                                    fontSize: '11px',
                                    color: '#94a3b8',
                                    fontStyle: 'italic',
                                    margin: '8px 0 0 0',
                                    textAlign: 'center',
                                }}
                            >
                                Samples increase the chance of random events. Event chance resets to
                                base 0% when an event occurs.
                            </p>
                        </div>

                        {/* Extraction Status */}
                        <div style={{ marginBottom: '32px' }}>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    marginBottom: '16px',
                                }}
                            >
                                Extraction Status
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {players.map((player, idx) => {
                                    // In multiplayer, clients can only toggle their own extraction status
                                    const canToggle = !isMultiplayer || isHost || idx === playerSlot

                                    const handleExtractionChange = (checked) => {
                                        if (!canToggle) return

                                        // Record death for analytics when player fails to extract
                                        if (!checked) {
                                            runAnalytics.recordPlayerDeath(
                                                idx,
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
                                            dispatch(actions.setPlayerExtracted(idx, checked))
                                        }
                                    }

                                    return (
                                        <label
                                            key={player.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                cursor: canToggle ? 'pointer' : 'not-allowed',
                                                padding: '10px 16px',
                                                backgroundColor: player.extracted
                                                    ? 'rgba(34, 197, 94, 0.1)'
                                                    : 'rgba(239, 68, 68, 0.1)',
                                                borderRadius: '4px',
                                                border: `1px solid ${player.extracted ? '#22c55e' : '#ef4444'}`,
                                                transition: 'all 0.2s',
                                                opacity: canToggle ? 1 : 0.7,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={player.extracted !== false}
                                                onChange={(e) =>
                                                    handleExtractionChange(e.target.checked)
                                                }
                                                disabled={!canToggle}
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    cursor: canToggle ? 'pointer' : 'not-allowed',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: player.extracted
                                                            ? '#22c55e'
                                                            : '#ef4444',
                                                        fontWeight: 'bold',
                                                        fontSize: '14px',
                                                    }}
                                                >
                                                    {player.name} extracted
                                                </span>
                                                {!player.extracted && gameConfig.brutalityMode && (
                                                    <span
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#ef4444',
                                                            fontStyle: 'italic',
                                                        }}
                                                    >
                                                        Must sacrifice item
                                                    </span>
                                                )}
                                                {!player.extracted &&
                                                    !gameConfig.brutalityMode &&
                                                    players.every((p) => !p.extracted) && (
                                                        <span
                                                            style={{
                                                                fontSize: '11px',
                                                                color: '#ef4444',
                                                                fontStyle: 'italic',
                                                            }}
                                                        >
                                                            TPK - Must sacrifice item
                                                        </span>
                                                    )}
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                            <p
                                style={{
                                    fontSize: '11px',
                                    color: '#94a3b8',
                                    fontStyle: 'italic',
                                    margin: '8px 0 0 0',
                                    textAlign: 'center',
                                }}
                            >
                                {gameConfig.brutalityMode
                                    ? 'Brutality Mode: Non-extracted Helldivers must sacrifice equipment'
                                    : 'If all Helldivers fail to extract, all must sacrifice equipment'}
                            </p>
                        </div>

                        {/* Mission outcome buttons - only host can control in multiplayer */}
                        {!isMultiplayer || isHost ? (
                            <>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '16px',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <button
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
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '16px 24px',
                                            backgroundColor: 'rgba(127, 29, 29, 0.3)',
                                            color: '#ef4444',
                                            border: '1px solid #7f1d1d',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor =
                                                'rgba(127, 29, 29, 0.5)')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor =
                                                'rgba(127, 29, 29, 0.3)')
                                        }
                                    >
                                        <XCircle />
                                        Mission Failed
                                    </button>

                                    <button
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
                                                document.getElementById('commonSamples')?.value ||
                                                    '0',
                                                10,
                                            )
                                            const rareSamples = parseInt(
                                                document.getElementById('rareSamples')?.value ||
                                                    '0',
                                                10,
                                            )
                                            const superRareSamples = parseInt(
                                                document.getElementById('superRareSamples')
                                                    ?.value || '0',
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
                                            if (document.getElementById('commonSamples'))
                                                document.getElementById('commonSamples').value = '0'
                                            if (document.getElementById('rareSamples'))
                                                document.getElementById('rareSamples').value = '0'
                                            if (document.getElementById('superRareSamples'))
                                                document.getElementById('superRareSamples').value =
                                                    '0'

                                            // Clear weapon restrictions from all players
                                            const updatedPlayers = players.map((p) => ({
                                                ...p,
                                                weaponRestricted: false,
                                            }))
                                            dispatch(actions.setPlayers(updatedPlayers))

                                            // Check if sacrifice is required (processed at end of each mission)
                                            let sacrificesRequired = []

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
                                        style={{
                                            ...BUTTON_STYLES.PRIMARY,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '16px 32px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            letterSpacing: '2px',
                                            opacity: missionSuccessDebouncing ? 0.5 : 1,
                                            cursor: missionSuccessDebouncing
                                                ? 'not-allowed'
                                                : 'pointer',
                                            pointerEvents: missionSuccessDebouncing
                                                ? 'none'
                                                : 'auto',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!missionSuccessDebouncing) {
                                                e.currentTarget.style.backgroundColor =
                                                    COLORS.PRIMARY_HOVER
                                                e.currentTarget.style.boxShadow =
                                                    SHADOWS.BUTTON_PRIMARY_HOVER
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!missionSuccessDebouncing) {
                                                e.currentTarget.style.backgroundColor =
                                                    COLORS.PRIMARY
                                                e.currentTarget.style.boxShadow =
                                                    SHADOWS.BUTTON_PRIMARY
                                            }
                                        }}
                                    >
                                        <CheckCircle />
                                        {missionSuccessDebouncing
                                            ? 'Processing...'
                                            : 'Mission Success'}
                                    </button>
                                </div>

                                <p
                                    style={{
                                        marginTop: '16px',
                                        fontSize: '12px',
                                        color: '#64748b',
                                        fontFamily: 'monospace',
                                        margin: '16px 0 0 0',
                                    }}
                                >
                                    Report success to earn Requisition & proceed to draft.
                                </p>
                            </>
                        ) : (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '24px',
                                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(100, 116, 139, 0.3)',
                                }}
                            >
                                <p style={{ color: '#94a3b8', margin: 0 }}>
                                    ⏳ Waiting for host to report mission outcome...
                                </p>
                                <p style={{ color: '#64748b', fontSize: '12px', marginTop: '8px' }}>
                                    Toggle your extraction status above while waiting.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Debug Events Mode UI */}
                    {gameConfig.debugEventsMode && (
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '800px',
                                backgroundColor: '#1a2332',
                                padding: '24px',
                                borderRadius: '12px',
                                border: '2px solid #ef4444',
                                marginTop: '24px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '16px',
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: '#ef4444',
                                        textTransform: 'uppercase',
                                        margin: 0,
                                    }}
                                >
                                    🔧 Debug: Manual Event Trigger
                                </h3>
                                <button
                                    onClick={() => dispatch(actions.resetSeenEvents())}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        textTransform: 'uppercase',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.backgroundColor = '#dc2626')
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.backgroundColor = '#ef4444')
                                    }
                                >
                                    Reset Seen Events
                                </button>
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '12px',
                                }}
                            >
                                {EVENTS.map((event) => (
                                    <button
                                        key={event.id}
                                        onClick={() => {
                                            dispatch(actions.addSeenEvent(event.id))
                                            // Reset all event selections before setting new event to prevent stale state
                                            dispatch(actions.resetEventSelections())
                                            dispatch(actions.setCurrentEvent(event))
                                            dispatch(actions.setPhase('EVENT'))
                                        }}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: seenEvents.includes(event.id)
                                                ? '#374151'
                                                : '#283548',
                                            color: seenEvents.includes(event.id)
                                                ? '#6b7280'
                                                : '#cbd5e1',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            cursor: seenEvents.includes(event.id)
                                                ? 'not-allowed'
                                                : 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'left',
                                            opacity: seenEvents.includes(event.id) ? 0.5 : 1,
                                        }}
                                        disabled={seenEvents.includes(event.id)}
                                        onMouseEnter={(e) => {
                                            if (!seenEvents.includes(event.id)) {
                                                e.currentTarget.style.borderColor = '#ef4444'
                                                e.currentTarget.style.backgroundColor = '#374151'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!seenEvents.includes(event.id)) {
                                                e.currentTarget.style.borderColor =
                                                    'rgba(239, 68, 68, 0.3)'
                                                e.currentTarget.style.backgroundColor = '#283548'
                                            }
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: 'bold',
                                                marginBottom: '4px',
                                                fontSize: '12px',
                                            }}
                                        >
                                            {event.name}
                                        </div>
                                        <div style={{ fontSize: '9px', color: '#64748b' }}>
                                            {event.id}{' '}
                                            {seenEvents.includes(event.id) ? '(SEEN)' : ''}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <p
                                style={{
                                    fontSize: '10px',
                                    color: '#64748b',
                                    marginTop: '12px',
                                    textAlign: 'center',
                                    fontStyle: 'italic',
                                }}
                            >
                                Events marked as SEEN have already been triggered this run
                            </p>
                        </div>
                    )}
                </div>
            </div>

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
            <RunHistoryModal
                isOpen={showRunHistory}
                onClose={() => setShowRunHistory(false)}
                faction={gameConfig.faction}
            />
        </div>
    )
}

// Wrapper component that provides multiplayer context
export default function HelldiversRoguelike() {
    return (
        <HashRouter>
            <MultiplayerProvider>
                <Routes>
                    <Route path="card-library" element={<CardLibrary />} />
                    <Route path="/" element={<HelldiversRoguelikeApp />} />
                </Routes>
            </MultiplayerProvider>
        </HashRouter>
    )
}
