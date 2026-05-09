import { CheckCircle, XCircle } from 'lucide-react'
import { useReducer, useState } from 'react'
import {
    getRequisitionMultiplier,
    getSlotLockCost,
    MAX_LOCKED_SLOTS,
    Subfaction,
} from 'src/constants/balancingConfig'
import { getMissionsForDifficulty } from 'src/constants/gameConfig'
import { useGamePersistence } from 'src/hooks'
import { gameReducer, initialState } from 'src/state/gameReducer'
import { getFactionColors } from 'src/styles'
import { EVENTS } from 'src/systems/events/events'
import { useMultiplayer } from 'src/systems/multiplayer'
import { saveRunToHistory } from 'src/systems/persistence/saveManager'
import { DraftHandItem, ItemType, SlotType } from 'src/types'
import { trackGameEnd, trackMissionComplete } from 'src/utils/analytics'
import { getMaxStarsForDifficulty } from 'src/utils/dashboardHelper'
import { getDraftHandSize } from 'src/utils/draftHelpers'
import { getArmorComboDisplayName, getItemById } from 'src/utils/itemHelpers'
import * as actions from '../state/actions'
import * as runAnalytics from '../state/analyticsStore'
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
} from '../styles/App.styles'
import GameHeader from './GameHeader'
import LoadoutDisplay from './LoadoutDisplay'
import { MultiplayerStatusBar } from './MultiplayerLobby'

interface DashboardScreenProps {
    setShowExplainer: (show: boolean) => void
    generateDraftHandForPlayer: (playerIndex: number) => DraftHandItem[]
    gameStartTime: number | null
    startDraftPhase: () => void
    tryTriggerRandomEvent: () => boolean
    children?: React.ReactNode
}

export default function DashboardScreen({
    setShowExplainer,
    generateDraftHandForPlayer,
    gameStartTime,
    startDraftPhase,
    tryTriggerRandomEvent,
    children,
}: DashboardScreenProps) {
    // --- STATE (Using useReducer for complex state management) ---
    const [state, dispatch] = useReducer(gameReducer, initialState)

    // Destructure commonly used state values for easier access
    const {
        phase,
        gameConfig,
        currentDiff,
        currentMission,
        requisition,
        players,
        draftState,
        seenEvents,
    } = state

    // Multiplayer context
    const multiplayer = useMultiplayer()
    const {
        isMultiplayer,
        isHost,
        hostGame,
        startMultiplayerGame,
        syncState,
        disconnect,
        playerSlot,
        sendAction,
        lobbyData,
        firebaseReady,
    } = multiplayer

    const { exportGameState } = useGamePersistence({
        state,
        dispatch,
        firebaseReady,
        hostGame,
        startMultiplayerGame,
        syncState,
        loadGameStateAction: actions.loadGameState,
    })

    const [missionSuccessDebouncing, setMissionSuccessDebouncing] = useState(false) // Debounce for mission success button

    const factionColors = getFactionColors(gameConfig.faction)

    const handleLockSlot = (playerId: string, slotType: SlotType) => {
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

            {children}
        </PageWrapper>
    )
}
