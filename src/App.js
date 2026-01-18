import React, { useReducer, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Users } from 'lucide-react';
import { selectRandomEvent, EVENT_TYPES, EVENTS } from './systems/events/events';
import { RARITY, TYPE } from './constants/types';
import { MASTER_DB } from './data/itemsByWarbond';
import { STARTING_LOADOUT, DIFFICULTY_CONFIG } from './constants/gameConfig';
import { ARMOR_PASSIVE_DESCRIPTIONS } from './constants/armorPassives';
import { getItemById } from './utils/itemHelpers';
import { getDraftHandSize, getWeightedPool, generateDraftHand, generateRandomDraftOrder } from './utils/draftHelpers';
import { areStratagemSlotsFull, getFirstEmptyStratagemSlot } from './utils/loadoutHelpers';
import { getArmorComboDisplayName } from './utils/itemHelpers';
import { getItemIconUrl } from './utils/iconHelpers';
import { processAllOutcomes, canAffordChoice, formatOutcome, formatOutcomes, needsPlayerChoice, applyGainBoosterWithSelection } from './systems/events/eventProcessor';
import { exportGameStateToFile, parseSaveFile, normalizeLoadedState } from './systems/persistence/saveManager';
import GameHeader from './components/GameHeader';
import GameFooter from './components/GameFooter';
import EventDisplay from './components/EventDisplay';
import LoadoutDisplay from './components/LoadoutDisplay';
import GameLobby from './components/GameLobby';
import GameConfiguration from './components/GameConfiguration';
import RarityWeightDebug from './components/RarityWeightDebug';
import ExplainerModal from './components/ExplainerModal';
import { MultiplayerModeSelect, JoinGameScreen, MultiplayerWaitingRoom, MultiplayerStatusBar } from './components/MultiplayerLobby';
import { MultiplayerProvider, useMultiplayer } from './systems/multiplayer';
import { gameReducer, initialState } from './state/gameReducer';
import * as actions from './state/actions';
import * as types from './state/actionTypes';
import { COLORS, SHADOWS, BUTTON_STYLES, GRADIENTS, getFactionColors } from './constants/theme';
import { getWarbondById } from './constants/warbonds';

// --- DATA CONSTANTS (imported from modules) ---









// --- INITIAL STATE & HELPER LOGIC ---



function HelldiversRogueliteApp() {
  // --- STATE (Using useReducer for complex state management) ---
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Multiplayer context
  const multiplayer = useMultiplayer();
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
    playerSlot,
    sendAction,
    setActionHandler
  } = multiplayer;
  
  // Register dispatch with multiplayer context
  useEffect(() => {
    setDispatch(dispatch);
  }, [dispatch, setDispatch]);
  
  // Handle host disconnect - show game over for clients
  useEffect(() => {
    const currentPhase = state.phase;
    if (hostDisconnected && !isHost && currentPhase !== 'MENU' && currentPhase !== 'GAMEOVER') {
      // Host disconnected during an active game - show game over
      dispatch(actions.setPhase('GAMEOVER'));
      setMultiplayerMode(null);
      clearHostDisconnected();
    } else if (hostDisconnected) {
      // Host disconnected during lobby/menu - just clear and return to menu
      setMultiplayerMode(null);
      clearHostDisconnected();
    }
  }, [hostDisconnected, isHost, state.phase, clearHostDisconnected]);
  
  // Destructure commonly used state values for easier access
  const {
    phase,
    gameConfig,
    currentDiff,
    requisition,
    burnedCards,
    customSetup,
    players,
    draftState,
    sacrificeState,
    eventsEnabled,
    currentEvent,
    eventPlayerChoice,
    eventStratagemSelection,
    eventTargetPlayerSelection,
    eventTargetStratagemSelection,
    eventBoosterDraft,
    eventBoosterSelection,
    eventSpecialDraft,
    eventSpecialDraftType,
    eventSpecialDraftSelections,
    pendingFaction,
    pendingSubfactionSelection,
    seenEvents
  } = state;
  
  // Get faction-specific colors
  const factionColors = getFactionColors(gameConfig.faction);
  
  // UI-only state (not part of game state)
  const [selectedPlayer, setSelectedPlayer] = React.useState(0); // For custom setup phase
  const [multiplayerMode, setMultiplayerMode] = React.useState(null); // null, 'select', 'host', 'join', 'waiting'
  const [showExplainer, setShowExplainer] = React.useState(false); // For explainer modal
  
  // Ref for the hidden file input
  const fileInputRef = React.useRef(null);
  
  // Sync state to clients when host and in multiplayer mode
  useEffect(() => {
    if (isMultiplayer && isHost && phase !== 'MENU') {
      syncState(state);
    }
  }, [isMultiplayer, isHost, state, phase, syncState]);

  // Save game state to localStorage whenever it changes (for crash recovery)
  useEffect(() => {
    if (phase !== 'MENU') {
      try {
        localStorage.setItem('helldraftersGameState', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save game state:', error);
      }
    } else {
      // Clear saved state when returning to menu
      localStorage.removeItem('helldraftersGameState');
    }
  }, [state, phase]);

  // --- SAVE/LOAD FUNCTIONS ---

  const exportGameState = () => {
    exportGameStateToFile(state);
  };

  // Import functionality for loading JSON save files
  const importGameState = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const loadedState = await parseSaveFile(file);
      const normalizedState = normalizeLoadedState(loadedState);

      // Restore all state
      dispatch(actions.loadGameState(normalizedState));
      setSelectedPlayer(normalizedState.selectedPlayer || 0);

      alert('Game loaded successfully!');
    } catch (error) {
      console.error('Failed to load game:', error);
      alert(error.message || 'Failed to load save file. File may be corrupted.');
    }
    
    event.target.value = ''; // Reset input
  };

  // --- INITIALIZATION ---

  const startGame = () => {
    // Solo mode: set player count to 1 and go to config
    dispatch(actions.updateGameConfig({ playerCount: 1 }));
    dispatch(actions.setPhase('SOLO_CONFIG'));
  };

  const startGameFromLobby = (lobbyPlayers) => {
    if (gameConfig.customStart) {
      // Go to custom setup screen with configured players
      const initialLoadouts = Array.from({ length: gameConfig.playerCount }, () => ({
        primary: STARTING_LOADOUT.primary,
        secondary: STARTING_LOADOUT.secondary,
        grenade: STARTING_LOADOUT.grenade,
        armor: STARTING_LOADOUT.armor,
        booster: STARTING_LOADOUT.booster,
        stratagems: [...STARTING_LOADOUT.stratagems]
      }));
      dispatch(actions.setCustomSetup({ difficulty: 1, loadouts: initialLoadouts }));
      
      // Create players with warbond selections
      const newPlayers = lobbyPlayers.map((lp, i) => ({
        id: i + 1,
        name: lp.name,
        loadout: initialLoadouts[i],
        inventory: Object.values(initialLoadouts[i]).flat().filter(id => id !== null),
        warbonds: lp.warbonds,
        includeSuperstore: lp.includeSuperstore,
        excludedItems: lp.excludedItems || [],
        weaponRestricted: false,
        lockedSlots: [],
        extracted: true
      }));
      dispatch(actions.setPlayers(newPlayers));
      dispatch(actions.setPhase('CUSTOM_SETUP'));
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
          stratagems: [...STARTING_LOADOUT.stratagems]
        },
        inventory: Object.values(STARTING_LOADOUT).flat().filter(id => id !== null),
        warbonds: lp.warbonds,
        includeSuperstore: lp.includeSuperstore,
        excludedItems: lp.excludedItems || [],
        weaponRestricted: false,
        lockedSlots: [],
        extracted: true
      }));
      dispatch(actions.setPlayers(newPlayers));
      dispatch(actions.setDifficulty(1));
      dispatch(actions.setRequisition(0)); // Start with 0, earn 1 per mission
      dispatch(actions.setBurnedCards([]));
      dispatch(actions.setPhase('DASHBOARD'));
    }
  };

  const startGameFromCustomSetup = () => {
    const newPlayers = customSetup.loadouts.map((loadout, i) => ({
      id: i + 1,
      name: `Helldiver ${i + 1}`,
      loadout: { ...loadout },
      inventory: Object.values(loadout).flat().filter(id => id !== null),
      weaponRestricted: false,
      lockedSlots: [],
      extracted: true
    }));
    dispatch(actions.setPlayers(newPlayers));
    dispatch(actions.setDifficulty(customSetup.difficulty));
    dispatch(actions.setRequisition(0));
    dispatch(actions.setBurnedCards([]));
    dispatch(actions.setPhase('DASHBOARD'));
  };

  // --- CORE LOGIC: THE DRAFT DIRECTOR ---

  const generateDraftHandForPlayer = (playerIdx) => {
    if (!players || !players[playerIdx]) {
      return [];
    }
    
    const player = players[playerIdx];
    const handSize = getDraftHandSize(gameConfig.starRating);
    const playerLockedSlots = player.lockedSlots || [];

    return generateDraftHand(
      player,
      currentDiff,
      gameConfig,
      burnedCards,
      players,
      (cardId) => dispatch(actions.addBurnedCard(cardId)),
      handSize,
      playerLockedSlots
    );
  };

  const startDraftPhase = () => {
    // Safety check: ensure players exist before starting draft
    if (!players || players.length === 0) {
      console.error('Cannot start draft phase: no players available');
      return;
    }
    
    // Restore stratagems and clear restrictions for players who completed their restricted mission
    const updatedPlayers = players.map(player => {
      if (player.weaponRestricted && player.savedStratagems) {
        return {
          ...player,
          loadout: {
            ...player.loadout,
            stratagems: [...player.savedStratagems]
          },
          weaponRestricted: false,
          savedStratagems: undefined
        };
      }
      return player;
    });
    
    if (JSON.stringify(updatedPlayers) !== JSON.stringify(players)) {
      dispatch(actions.setPlayers(updatedPlayers));
    }
    
    // Generate randomized draft order for this round
    const draftOrder = generateRandomDraftOrder(gameConfig.playerCount);
    const firstPlayerIdx = draftOrder[0];
    
    dispatch(actions.setDraftState({
      activePlayerIndex: firstPlayerIdx,
      roundCards: generateDraftHandForPlayer(firstPlayerIdx),
      isRerolling: false,
      pendingStratagem: null,
      extraDraftRound: 0,
      draftOrder: draftOrder
    }));
    dispatch(actions.setPhase('DRAFT'));
  };

  const proceedToNextDraft = (updatedPlayers) => {
    const currentPlayerIdx = draftState.activePlayerIndex;
    const currentPlayer = updatedPlayers[currentPlayerIdx];
    const currentExtraRound = draftState.extraDraftRound || 0;
    
    // Check if current player has more redraft rounds to complete
    if (currentPlayer.redraftRounds && currentPlayer.redraftRounds > 1) {
      const remainingRounds = currentPlayer.redraftRounds - 1;
      const clearedPlayers = [...updatedPlayers];
      clearedPlayers[currentPlayerIdx] = { ...currentPlayer, redraftRounds: remainingRounds };
      dispatch(actions.setPlayers(clearedPlayers));
      
      // Continue with next redraft round for same player
      dispatch(actions.setDraftState({
        activePlayerIndex: currentPlayerIdx,
        roundCards: generateDraftHandForPlayer(currentPlayerIdx),
        isRerolling: false,
        pendingStratagem: null,
        extraDraftRound: 0,
        isRedrafting: true,
        draftOrder: draftState.draftOrder
      }));
      return;
    }
    
    // Clear redraft rounds for this player
    if (currentPlayer.redraftRounds) {
      const clearedPlayers = [...updatedPlayers];
      clearedPlayers[currentPlayerIdx] = { ...currentPlayer, redraftRounds: 0 };
      dispatch(actions.setPlayers(clearedPlayers));
      
      // After redraft completes, go back to dashboard
      dispatch(actions.setPhase('DASHBOARD'));
      return;
    }
    
    // Check if current player has more extra drafts to complete
    if (currentPlayer.extraDraftCards && currentExtraRound < currentPlayer.extraDraftCards) {
      // Continue with next extra draft for same player
      dispatch(actions.setDraftState({
        activePlayerIndex: currentPlayerIdx,
        roundCards: generateDraftHandForPlayer(currentPlayerIdx),
        isRerolling: false,
        pendingStratagem: null,
        extraDraftRound: currentExtraRound + 1,
        draftOrder: draftState.draftOrder
      }));
      return;
    }
    
    // Clear extra draft cards for this player
    if (currentPlayer.extraDraftCards) {
      const clearedPlayers = [...updatedPlayers];
      clearedPlayers[currentPlayerIdx] = { ...currentPlayer, extraDraftCards: 0 };
      dispatch(actions.setPlayers(clearedPlayers));
    }
    
    // Move to next player in draft order or complete
    const draftOrder = draftState.draftOrder || [];
    const currentPositionInOrder = draftOrder.indexOf(currentPlayerIdx);
    
    if (currentPositionInOrder >= 0 && currentPositionInOrder < draftOrder.length - 1) {
      // Move to next player in the draft order
      const nextIdx = draftOrder[currentPositionInOrder + 1];
      dispatch(actions.setDraftState({
        activePlayerIndex: nextIdx,
        roundCards: generateDraftHandForPlayer(nextIdx),
        isRerolling: false,
        pendingStratagem: null,
        extraDraftRound: 0,
        draftOrder: draftOrder
      }));
    } else {
      // Draft complete - check for event
      if (eventsEnabled) {
        const baseChance = 0.0;
        const sampleBonus = (
          (state.samples.common * 0.01) +
          (state.samples.rare * 0.02) +
          (state.samples.superRare * 0.03)
        );
        const totalChance = Math.min(1.0, baseChance + sampleBonus);

        if (Math.random() < totalChance) {
          const event = selectRandomEvent(currentDiff, players.length > 1, seenEvents, players);
          if (event) {
            dispatch(actions.resetSamples());
            dispatch(actions.addSeenEvent(event.id));
            dispatch(actions.setCurrentEvent(event));
            dispatch(actions.setEventPlayerChoice(null));
            dispatch(actions.setPhase('EVENT'));
            return;
          }
        }
      }
      dispatch(actions.setPhase('DASHBOARD'));
    }
  };

  const handleSkipDraft = () => {
    // In multiplayer as client, send action to host instead of processing locally
    if (isMultiplayer && !isHost) {
      sendAction({
        type: 'SKIP_DRAFT',
        payload: {
          playerIndex: draftState.activePlayerIndex
        }
      });
      return;
    }
    proceedToNextDraft(players);
  };

  const handleDraftPick = (item) => {
    const currentPlayerIdx = draftState.activePlayerIndex;
    
    // In multiplayer, only the player whose turn it is can draft
    if (isMultiplayer && playerSlot !== currentPlayerIdx) {
      console.log('Not your turn to draft', { playerSlot, currentPlayerIdx });
      return;
    }
    
    // In multiplayer as client, send action to host instead of processing locally
    if (isMultiplayer && !isHost) {
      sendAction({
        type: types.DRAFT_PICK,
        payload: {
          playerIndex: currentPlayerIdx,
          item: item
        }
      });
      return;
    }
    
    const updatedPlayers = [...players];
    const player = updatedPlayers[currentPlayerIdx];

    // Guard: ensure player exists and has loadout
    if (!player || !player.loadout) {
      console.error('handleDraftPick: Invalid player or loadout', { currentPlayerIdx, player });
      return;
    }

    // Check if this is an armor combo
    const isArmorCombo = item && item.items && item.passive && item.armorClass;

    if (isArmorCombo) {
      // Add all armor variants to inventory
      item.items.forEach(armor => {
        player.inventory.push(armor.id);
      });
      
      // Auto-equip the first armor in the combo
      player.loadout.armor = item.items[0].id;
    } else {
      // Special handling for stratagems when slots are full
      if (item.type === TYPE.STRATAGEM) {
        if (areStratagemSlotsFull(player.loadout)) {
          // All slots full - show replacement UI
          dispatch(actions.updateDraftState({
            pendingStratagem: item
          }));
          return; // Don't proceed with pick yet
        }
      }

      // Add to inventory
      player.inventory.push(item.id);

      // Auto-Equip Logic
      if (item.type === TYPE.PRIMARY) player.loadout.primary = item.id;
      if (item.type === TYPE.SECONDARY) player.loadout.secondary = item.id;
      if (item.type === TYPE.GRENADE) player.loadout.grenade = item.id;
      if (item.type === TYPE.ARMOR) player.loadout.armor = item.id;
      if (item.type === TYPE.BOOSTER) player.loadout.booster = item.id;
      if (item.type === TYPE.STRATAGEM) {
        // Find empty slot (we know it exists because we checked above)
        const emptySlot = getFirstEmptyStratagemSlot(player.loadout);
        player.loadout.stratagems[emptySlot] = item.id;
      }
    }

    dispatch(actions.setPlayers(updatedPlayers));

    // Next player, extra draft, or finish
    proceedToNextDraft(updatedPlayers);
  };

  const handleStratagemReplacement = (slotIndex) => {
    const currentPlayerIdx = draftState.activePlayerIndex;
    
    // In multiplayer, only the player whose turn it is can select replacement
    if (isMultiplayer && playerSlot !== currentPlayerIdx) {
      console.warn('Not your turn to select replacement', { playerSlot, currentPlayerIdx });
      return;
    }
    
    // In multiplayer as client, send action to host instead of processing locally
    if (isMultiplayer && !isHost) {
      sendAction({
        type: types.STRATAGEM_REPLACEMENT,
        payload: {
          playerIndex: currentPlayerIdx,
          slotIndex: slotIndex
        }
      });
      return;
    }
    
    const updatedPlayers = [...players];
    const player = updatedPlayers[currentPlayerIdx];
    const item = draftState.pendingStratagem;
    
    // Guard: ensure we have a pending stratagem
    if (!item) {
      console.error('handleStratagemReplacement: No pending stratagem', { currentPlayerIdx, slotIndex });
      return;
    }

    // Add to inventory
    player.inventory.push(item.id);
    
    // Replace the selected slot
    player.loadout.stratagems[slotIndex] = item.id;
    
    dispatch(actions.setPlayers(updatedPlayers));
    dispatch(actions.updateDraftState({ pendingStratagem: null }));

    // Next player, extra draft, or finish
    proceedToNextDraft(updatedPlayers);
  };

  // Ref to hold the draft pick handler for multiplayer (avoids stale closure issues)
  const draftPickHandlerRef = React.useRef(null);
  
  // Update the ref whenever dependencies change
  draftPickHandlerRef.current = (action) => {
    if (action.type === types.DRAFT_PICK) {
      const { playerIndex, item } = action.payload;
      
      // Process the draft pick for this player
      const updatedPlayers = [...players];
      const player = updatedPlayers[playerIndex];
      
      if (!player || !player.loadout) {
        console.error('DRAFT_PICK: Invalid player', { playerIndex });
        return true; // Consumed the action
      }
      
      // Check if this is an armor combo
      const isArmorCombo = item && item.items && item.passive && item.armorClass;

      if (isArmorCombo) {
        item.items.forEach(armor => {
          player.inventory.push(armor.id);
        });
        player.loadout.armor = item.items[0].id;
      } else {
        // Special handling for stratagems when slots are full
        if (item.type === TYPE.STRATAGEM) {
          if (areStratagemSlotsFull(player.loadout)) {
            // Set pending stratagem to trigger modal for player to choose which slot to replace
            dispatch(actions.updateDraftState({
              pendingStratagem: item
            }));
            return true; // Action was handled, wait for STRATAGEM_REPLACEMENT action
          }
        }

        player.inventory.push(item.id);

        // Auto-Equip Logic
        if (item.type === TYPE.PRIMARY) player.loadout.primary = item.id;
        if (item.type === TYPE.SECONDARY) player.loadout.secondary = item.id;
        if (item.type === TYPE.GRENADE) player.loadout.grenade = item.id;
        if (item.type === TYPE.ARMOR) player.loadout.armor = item.id;
        if (item.type === TYPE.BOOSTER) player.loadout.booster = item.id;
        if (item.type === TYPE.STRATAGEM) {
          const emptySlot = getFirstEmptyStratagemSlot(player.loadout);
          player.loadout.stratagems[emptySlot] = item.id;
        }
      }

      dispatch(actions.setPlayers(updatedPlayers));
      proceedToNextDraft(updatedPlayers);
      return true; // Action was handled
    }
    
    // Handle stratagem replacement from clients
    if (action.type === types.STRATAGEM_REPLACEMENT) {
      const { playerIndex, slotIndex } = action.payload;
      const updatedPlayers = [...players];
      const player = updatedPlayers[playerIndex];
      
      if (!player || !player?.loadout || !draftState.pendingStratagem) {
        console.error('STRATAGEM_REPLACEMENT: Invalid state', { 
          playerIndex, 
          slotIndex, 
          hasPlayer: !!player, 
          hasLoadout: !!player?.loadout,
          hasPendingStratagem: !!draftState.pendingStratagem
        });
        return true;
      }
      
      const item = draftState.pendingStratagem;
      
      // Add to inventory
      player.inventory.push(item.id);
      
      // Replace the selected slot
      player.loadout.stratagems[slotIndex] = item.id;
      
      dispatch(actions.setPlayers(updatedPlayers));
      dispatch(actions.updateDraftState({ pendingStratagem: null }));
      proceedToNextDraft(updatedPlayers);
      return true;
    }
    
    // Handle extraction status toggle from clients
    if (action.type === types.SET_PLAYER_EXTRACTED) {
      const { playerIndex, extracted } = action.payload;
      dispatch(actions.setPlayerExtracted(playerIndex, extracted));
      return true;
    }
    
    // Handle skip draft from clients
    if (action.type === 'SKIP_DRAFT') {
      proceedToNextDraft(players);
      return true;
    }
    
    // Handle draft reroll from clients
    if (action.type === 'DRAFT_REROLL') {
      const { cost } = action.payload;
      if (requisition < cost) return true; // Action consumed but rejected
      dispatch(actions.spendRequisition(cost));
      dispatch(actions.updateDraftState({
        roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex)
      }));
      return true;
    }
    
    return false; // Action not handled
  };

  // Register action handler for multiplayer client actions (host only)
  useEffect(() => {
    if (isMultiplayer && isHost) {
      setActionHandler((action) => {
        // Use the ref to get the latest handler
        if (draftPickHandlerRef.current) {
          return draftPickHandlerRef.current(action);
        }
        return false;
      });
    }
    
    return () => {
      if (isMultiplayer && isHost) {
        setActionHandler(null);
      }
    };
  }, [isMultiplayer, isHost, setActionHandler]);

  const rerollDraft = (cost) => {
    if (requisition < cost) return;
    
    // In multiplayer as client, send action to host instead of processing locally
    if (isMultiplayer && !isHost) {
      sendAction({
        type: 'DRAFT_REROLL',
        payload: {
          cost: cost,
          playerIndex: draftState.activePlayerIndex
        }
      });
      return;
    }
    
    dispatch(actions.spendRequisition(cost));
    dispatch(actions.updateDraftState({
      roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex)
    }));
  };

  const handleLockSlot = (playerId, slotType) => {
    const { getSlotLockCost, MAX_LOCKED_SLOTS } = require('./constants/balancingConfig');
    const slotLockCost = getSlotLockCost(gameConfig.playerCount);
    const player = players.find(p => p.id === playerId);
    const playerLockedSlots = player?.lockedSlots || [];
    
    if (requisition < slotLockCost) return;
    if (playerLockedSlots.length >= MAX_LOCKED_SLOTS) return;
    if (playerLockedSlots.includes(slotType)) return;
    
    dispatch(actions.spendRequisition(slotLockCost));
    dispatch(actions.lockPlayerDraftSlot(playerId, slotType));
    
    // Regenerate current hand if this is the active player
    if (phase === 'DRAFT' && players[draftState.activePlayerIndex]?.id === playerId) {
      dispatch(actions.updateDraftState({
        roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex)
      }));
    }
  };

  const handleUnlockSlot = (playerId, slotType) => {
    const player = players.find(p => p.id === playerId);
    const playerLockedSlots = player?.lockedSlots || [];
    
    if (!playerLockedSlots.includes(slotType)) return;
    
    // Confirm unlock action
    if (!window.confirm(`Unlock ${slotType} slot? This will allow ${slotType} items to appear in future drafts.`)) {
      return;
    }
    
    dispatch(actions.unlockPlayerDraftSlot(playerId, slotType));
    
    // Regenerate current hand if this is the active player
    if (phase === 'DRAFT' && players[draftState.activePlayerIndex]?.id === playerId) {
      dispatch(actions.updateDraftState({
        roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex)
      }));
    }
  };

  const removeCardFromDraft = (cardToRemove) => {
    // Remove single card and replace it with a new one
    const player = players[draftState.activePlayerIndex];
    const playerLockedSlots = player.lockedSlots || [];
    const pool = getWeightedPool(player, currentDiff, gameConfig, burnedCards, players, playerLockedSlots);
    
    // Check if the card to remove is an armor combo
    const isRemovingArmorCombo = cardToRemove && cardToRemove.items && cardToRemove.passive;
    
    // Filter out cards already in the current hand
    const availablePool = pool.filter(poolEntry => {
      // Check if this pool entry matches any card in hand
      if (poolEntry.isArmorCombo) {
        // For armor combos, compare passive and armorClass
        return !draftState.roundCards.some(card => 
          card.passive === poolEntry.armorCombo.passive && 
          card.armorClass === poolEntry.armorCombo.armorClass
        );
      } else {
        // For regular items, compare ID
        return !draftState.roundCards.some(card => 
          card.id === poolEntry.item?.id || 
          (card.items && card.items.some(armor => armor.id === poolEntry.item?.id))
        );
      }
    });
    
    if (availablePool.length === 0) {
      alert('No more unique cards available!');
      return;
    }
    
    // Pick a new random card
    const totalWeight = availablePool.reduce((sum, c) => sum + c.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let newCard = null;
    
    for (let j = 0; j < availablePool.length; j++) {
      const poolItem = availablePool[j];
      if (!poolItem) continue;
      
      randomNum -= poolItem.weight;
      if (randomNum <= 0) {
        newCard = poolItem.isArmorCombo ? poolItem.armorCombo : poolItem.item;
        break;
      }
    }
    
    if (newCard) {
      // Add to burned cards if burn mode enabled
      if (gameConfig.burnCards) {
        if (newCard.items && newCard.passive) {
          // Armor combo - burn all variants
          newCard.items.forEach(armor => dispatch(actions.addBurnedCard(armor.id)));
        } else {
          // Regular item
          dispatch(actions.addBurnedCard(newCard.id));
        }
      }
      
      // Replace the card (compare properly for both armor combos and regular items)
      dispatch(actions.updateDraftState({
        roundCards: draftState.roundCards.map(card => {
          // Check if this is the card to remove
          if (isRemovingArmorCombo) {
            // Compare armor combos by passive and armorClass
            if (card.passive === cardToRemove.passive && card.armorClass === cardToRemove.armorClass) {
              return newCard;
            }
          } else {
            // Compare regular items by ID
            if (card.id === cardToRemove.id) {
              return newCard;
            }
          }
          return card;
        })
      }));
    }
  };

  // --- UI COMPONENTS ---

  const RarityBadge = ({ rarity }) => {
    const colors = {
      [RARITY.COMMON]: { bg: '#6b7280', color: 'white' },
      [RARITY.UNCOMMON]: { bg: '#22c55e', color: 'black' },
      [RARITY.RARE]: { bg: '#f97316', color: 'black' },
      [RARITY.LEGENDARY]: { bg: '#9333ea', color: 'white' }
    };
    const style = colors[rarity] || colors[RARITY.COMMON];
    return <span style={{
      fontSize: '10px',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: style.bg,
      color: style.color
    }}>{rarity}</span>;
  };

  const ItemCard = ({ item, onSelect, onRemove }) => {
    // Guard: if item is undefined, don't render
    if (!item) {
      console.log('[ItemCard] Skipping null item');
      return null;
    }
    
    // Check if this is an armor combo (has 'items' array and 'passive' property)
    const isArmorCombo = item.items && Array.isArray(item.items) && item.items.length > 0 && item.passive && item.armorClass;
    
    console.log('[ItemCard] Rendering item:', { 
      name: item.name, 
      id: item.id, 
      passive: item.passive, 
      isArmorCombo,
      itemsLength: item.items?.length,
      items: item.items
    });
    
    // Guard: for regular items, require name; for armor combos, require items with names
    if (!isArmorCombo && !item.name) {
      console.log('[ItemCard] Skipping - not armor combo and no name');
      return null;
    }
    
    // For armor combos, use the first item as representative for display
    const displayItem = isArmorCombo ? item.items[0] : item;
    
    // Guard: if displayItem is invalid, don't render
    if (!displayItem || !displayItem.name) {
      console.log('[ItemCard] Skipping - displayItem invalid:', displayItem);
      return null;
    }
    
    // For armor combos, create a slash-delimited name
    const displayName = isArmorCombo 
      ? item.items.map(armor => armor?.name || 'Unknown').join(' / ')
      : item.name;

    let armorPassiveDescription = null;
    const isArmorItem = isArmorCombo || item?.type === TYPE.ARMOR;
    if (isArmorItem) {
      const armorPassiveKey = item.passive;
      if (armorPassiveKey) {
        const description = ARMOR_PASSIVE_DESCRIPTIONS[armorPassiveKey];
        if (!description && process.env.NODE_ENV === 'development') {
          const armorIdentifier = isArmorCombo ? displayName : (item.name || item.id || 'unknown armor');
          console.warn(`Missing armor passive description for ${armorPassiveKey} (${armorIdentifier})`);
        }
        armorPassiveDescription = description || 'Passive effect details unavailable.';
      }
    }
    
    // Get warbond info for display
    const warbondId = displayItem.warbond;
    const isSuperstore = displayItem.superstore;
    const warbondInfo = warbondId ? getWarbondById(warbondId) : null;
    const sourceName = isSuperstore ? 'Superstore' : (warbondInfo?.name || 'Unknown');
    
    // Get item icon URL - use helper function
    const iconUrl = getItemIconUrl(displayItem);
    
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
          flexShrink: 0
        }}
      >
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item);
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
              zIndex: 10
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)'}
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
            paddingTop: onRemove ? '32px' : '0'
          }}
          onMouseEnter={(e) => onSelect && (e.currentTarget.parentElement.style.borderColor = factionColors.PRIMARY)}
          onMouseLeave={(e) => onSelect && (e.currentTarget.parentElement.style.borderColor = 'rgba(100, 116, 139, 0.5)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <RarityBadge rarity={displayItem.rarity} />
            <div style={{ color: factionColors.PRIMARY, fontSize: '12px', fontFamily: 'monospace', marginRight: onRemove ? '8px' : '0' }}>
              {displayItem.type}{isArmorCombo ? ` (×${item.items.length})` : ''}
            </div>
          </div>
          
          {/* Item Icon */}
          {iconUrl && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              marginBottom: '12px',
              height: '80px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              padding: '8px'
            }}>
              <img 
                src={iconUrl} 
                alt={displayName}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <h3 style={{ 
            color: 'white', 
            fontWeight: 'bold', 
            fontSize: isArmorCombo ? '14px' : '18px', 
            lineHeight: '1.2', 
            marginBottom: '4px',
            wordBreak: 'break-word'
          }}>
            {displayName}
          </h3>
          
          {/* Warbond Source */}
          <div style={{ 
            fontSize: '10px', 
            color: isSuperstore ? '#c084fc' : '#60a5fa', 
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            {sourceName}
          </div>
          
          <div style={{ flexGrow: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {(displayItem.tags || []).map(tag => (
                <span key={tag} style={{
                  fontSize: '10px',
                  backgroundColor: 'rgba(51, 65, 85, 0.5)',
                  color: '#cbd5e1',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  border: '1px solid rgba(71, 85, 105, 0.5)'
                }}>
                  {tag}
                </span>
              ))}
            </div>
            {armorPassiveDescription && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Armor Passive
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: '1.4', marginTop: '4px' }}>
                  {armorPassiveDescription}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(71, 85, 105, 0.5)', textAlign: 'center' }}>
            <span style={{ color: factionColors.PRIMARY, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px' }}>
              REQUISITION
            </span>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER PHASES ---

  if (phase === 'VICTORY') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f1419 0%, #1a2f3a 50%, #0f1419 100%)', padding: '24px' }}>
        <div style={{ maxWidth: '900px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontSize: '80px', marginBottom: '16px' }}>🎖️</div>
            <h1 style={{ fontSize: '64px', fontWeight: '900', color: factionColors.PRIMARY, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: factionColors.GLOW }}>
              DEMOCRACY MANIFESTED
            </h1>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e', margin: '0 0 8px 0' }}>
              OPERATION COMPLETE
            </h2>
            <p style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: '1.8', margin: '0', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
              Your squad has successfully completed all 10 difficulty tiers.
              <br/>
              Super Earth salutes your unwavering dedication to Liberty and Freedom.
              <br/>
              <span style={{ color: factionColors.PRIMARY, fontWeight: 'bold' }}>Managed Democracy prevails!</span>
            </p>
          </div>

          {/* Final Stats */}
          <div style={{ backgroundColor: 'rgba(26, 35, 50, 0.8)', padding: '24px', borderRadius: '8px', border: `2px solid ${factionColors.PRIMARY}66`, marginBottom: '32px' }}>
            <div style={{ fontSize: '14px', color: factionColors.PRIMARY, marginBottom: '16px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              Mission Statistics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Difficulty Cleared</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: factionColors.PRIMARY }}>D10</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Super Helldive</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Requisition</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>{Math.floor(requisition)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Theater</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginTop: '8px' }}>{gameConfig.faction}</div>
              </div>
            </div>
          </div>

          {/* Final Loadouts */}
          <div style={{ backgroundColor: 'rgba(26, 35, 50, 0.8)', padding: '24px', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)', marginBottom: '32px' }}>
            <div style={{ fontSize: '14px', color: factionColors.PRIMARY, marginBottom: '20px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              Final Loadouts
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: players.length > 2 ? 'repeat(2, 1fr)' : 'repeat(' + players.length + ', 1fr)', gap: '16px' }}>
              {players.map((player, idx) => {
                const loadout = player.loadout;
                const primaryItem = getItemById(loadout.primary);
                const secondaryItem = getItemById(loadout.secondary);
                const grenadeItem = getItemById(loadout.grenade);
                const armorItem = getItemById(loadout.armor);
                const boosterItem = getItemById(loadout.booster);
                const stratagems = loadout.stratagems.map(s => getItemById(s)).filter(Boolean);

                return (
                  <div key={idx} style={{ backgroundColor: 'rgba(40, 53, 72, 0.6)', padding: '16px', borderRadius: '6px', border: `1px solid ${factionColors.PRIMARY}4D` }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: factionColors.PRIMARY, marginBottom: '12px', textAlign: 'left' }}>
                      {player.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', textAlign: 'left', lineHeight: '1.8' }}>
                      <div><span style={{ color: '#94a3b8' }}>Primary:</span> {primaryItem?.name || 'None'}</div>
                      <div><span style={{ color: '#94a3b8' }}>Secondary:</span> {secondaryItem?.name || 'None'}</div>
                      <div><span style={{ color: '#94a3b8' }}>Grenade:</span> {grenadeItem?.name || 'None'}</div>
                      <div><span style={{ color: '#94a3b8' }}>Armor:</span> {armorItem?.name || 'None'}</div>
                      {boosterItem && <div><span style={{ color: '#94a3b8' }}>Booster:</span> {boosterItem.name}</div>}
                      {stratagems.length > 0 && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(100, 116, 139, 0.3)' }}>
                          <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Stratagems:</div>
                          {stratagems.map((s, i) => <div key={i}>• {s.name}</div>)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => dispatch(actions.setPhase('MENU'))}
            style={{
              width: '100%',
              maxWidth: '400px',
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
              boxShadow: factionColors.SHADOW
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = factionColors.PRIMARY_HOVER;
              e.currentTarget.style.boxShadow = factionColors.SHADOW_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = factionColors.PRIMARY;
              e.currentTarget.style.boxShadow = factionColors.SHADOW;
            }}
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'GAMEOVER') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1419', padding: '24px' }}>
        <div style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontSize: '80px', marginBottom: '16px' }}>💀</div>
            <h1 style={{ fontSize: '64px', fontWeight: '900', color: '#ef4444', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              DISHONORABLE DISCHARGE
            </h1>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#94a3b8', margin: '0 0 8px 0' }}>
              MISSION FAILED
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.6', margin: '0' }}>
              Your squad has been eliminated.
              <br/>
              Super Earth revokes your citizenship and Helldivers status.
              <br/>
              You have brought shame to Democracy.
            </p>
          </div>

          <div style={{ backgroundColor: '#1a2332', padding: '24px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '32px' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase' }}>
              Final Stats
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Difficulty Reached</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: factionColors.PRIMARY }}>{currentDiff}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Requisition Earned</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: factionColors.PRIMARY }}>{Math.floor(requisition)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Squad Size</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{players.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Theater</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{gameConfig.faction}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => dispatch(actions.setPhase('MENU'))}
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
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = factionColors.PRIMARY_HOVER}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = factionColors.PRIMARY}
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  // Multiplayer mode selection screens
  if (phase === 'MENU' && multiplayerMode === 'select') {
    return (
      <MultiplayerModeSelect
        gameConfig={gameConfig}
        onHost={async () => {
          // Create lobby and go to waiting room
          const newLobbyId = await hostGame('Host', gameConfig);
          if (newLobbyId) {
            setMultiplayerMode('waiting');
          }
        }}
        onJoin={() => setMultiplayerMode('join')}
        onBack={() => setMultiplayerMode(null)}
      />
    );
  }

  if (phase === 'MENU' && multiplayerMode === 'join') {
    return (
      <JoinGameScreen
        gameConfig={gameConfig}
        onJoinLobby={async (joinLobbyId, name, slot) => {
          const success = await joinGame(joinLobbyId, name, slot);
          if (success) {
            setMultiplayerMode('waiting');
          }
        }}
        onBack={() => setMultiplayerMode('select')}
      />
    );
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
          dispatch(actions.updateGameConfig({ playerCount: actualPlayerCount }));
          await startMultiplayerGame();
          dispatch(actions.setPhase('LOBBY'));
        }}
        onLeave={async () => {
          await disconnect();
          setMultiplayerMode(null);
        }}
      />
    );
  }

  if (phase === 'MENU') {
    return (
      <div style={{ minHeight: '100vh', padding: '80px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '72px', fontWeight: '900', color: factionColors.PRIMARY, margin: '0 0 0 0', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            HELLDRAFTERS
          </h1>
          <div style={{ margin: '20px auto' }}>
            <img 
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Helldrafters Logo" 
              style={{ width: '200px', height: 'auto', display: 'block', margin: '0 auto' }}
            />
          </div>
          <div style={{ background: 'linear-gradient(to right, #5a5142, #6b6052)', padding: '12px', marginBottom: '60px', maxWidth: '620px', margin: '0 auto 60px auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>
              Roguelite Director
            </h2>
          </div>
          
          <div style={{ backgroundColor: '#283548', padding: '40px', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            
            {/* Hidden file input for loading saves */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={importGameState}
              style={{ display: 'none' }}
            />
            
            {/* Start Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                onClick={startGame}
                style={{
                  ...BUTTON_STYLES.PRIMARY,
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  letterSpacing: '0.15em',
                  borderRadius: '4px',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.PRIMARY_HOVER;
                  e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
                  e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY;
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
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.ACCENT_BLUE}20`;
                  e.currentTarget.style.boxShadow = SHADOWS.GLOW_BLUE;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
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
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.TEXT_SECONDARY;
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
                  e.currentTarget.style.color = COLORS.TEXT_MUTED;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Load Game
              </button>
            </div>
            
            {/* Help Button */}
            <div style={{ marginTop: '12px' }}>
              <button 
                onClick={() => setShowExplainer(true)}
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
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = factionColors.PRIMARY;
                  e.currentTarget.style.color = factionColors.PRIMARY;
                  e.currentTarget.style.backgroundColor = `${factionColors.PRIMARY}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
                  e.currentTarget.style.color = COLORS.TEXT_MUTED;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>📖</span> How to Play
              </button>
            </div>

            {/* Build Info */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(100, 116, 139, 0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace' }}>
                {process.env.REACT_APP_BUILD_TIME && (
                  <div>Build: {process.env.REACT_APP_BUILD_TIME}</div>
                )}
                {process.env.REACT_APP_COMMIT_SHA && (
                  <div>Commit: {process.env.REACT_APP_COMMIT_SHA.substring(0, 7)}</div>
                )}
                {!process.env.REACT_APP_BUILD_TIME && !process.env.REACT_APP_COMMIT_SHA && (
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
        
        {/* Explainer Modal */}
        <ExplainerModal 
          isOpen={showExplainer} 
          onClose={() => setShowExplainer(false)}
          faction={gameConfig.faction}
        />
      </div>
    );
  }

  // SOLO_CONFIG PHASE - Game configuration for solo play
  if (phase === 'SOLO_CONFIG') {
    return (
      <div style={{ minHeight: '100vh', background: GRADIENTS.BACKGROUND, color: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: '900', 
              color: factionColors.PRIMARY, 
              margin: '0 0 8px 0', 
              letterSpacing: '0.05em', 
              textTransform: 'uppercase', 
              textShadow: factionColors.GLOW 
            }}>
              SOLO OPERATION
            </h1>
            <div style={{ background: GRADIENTS.HEADER_BAR, padding: '12px', margin: '0 auto', maxWidth: '400px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>
                Configure Your Mission
              </p>
            </div>
          </div>

          {/* Game Configuration */}
          <div style={{ backgroundColor: COLORS.CARD_BG, padding: '32px', borderRadius: '8px', border: `1px solid ${COLORS.CARD_BORDER}`, marginBottom: '32px' }}>
            <GameConfiguration
              gameConfig={gameConfig}
              eventsEnabled={eventsEnabled}
              onUpdateGameConfig={(updates) => dispatch(actions.updateGameConfig(updates))}
              onSetSubfaction={(subfaction) => dispatch(actions.setSubfaction(subfaction))}
              onSetEventsEnabled={(enabled) => dispatch(actions.setEventsEnabled(enabled))}
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
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.TEXT_DISABLED;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
                e.currentTarget.style.color = COLORS.TEXT_MUTED;
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
                letterSpacing: '0.15em'
              }}
            >
              CONTINUE →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'LOBBY') {
    return (
      <GameLobby
        gameConfig={gameConfig}
        onStartRun={startGameFromLobby}
        onCancel={() => dispatch(actions.setPhase('MENU'))}
      />
    );
  }

  if (phase === 'CUSTOM_SETUP') {
    const updateLoadoutSlot = (playerIdx, slotType, itemId) => {
      const newLoadouts = [...customSetup.loadouts];
      if (slotType === 'stratagem') {
        const slotIndex = parseInt(itemId.split('_')[1]);
        const stratagems = [...newLoadouts[playerIdx].stratagems];
        stratagems[slotIndex] = itemId.split('_')[0];
        newLoadouts[playerIdx] = { ...newLoadouts[playerIdx], stratagems };
      } else {
        newLoadouts[playerIdx] = { ...newLoadouts[playerIdx], [slotType]: itemId };
      }
      dispatch(actions.updateCustomSetup({ loadouts: newLoadouts }));
    };

    const currentLoadout = customSetup.loadouts[selectedPlayer];
    const itemsByType = {
      primary: MASTER_DB.filter(i => i.type === TYPE.PRIMARY),
      secondary: MASTER_DB.filter(i => i.type === TYPE.SECONDARY),
      grenade: MASTER_DB.filter(i => i.type === TYPE.GRENADE),
      armor: MASTER_DB.filter(i => i.type === TYPE.ARMOR),
      booster: MASTER_DB.filter(i => i.type === TYPE.BOOSTER),
      stratagem: MASTER_DB.filter(i => i.type === TYPE.STRATAGEM)
    };

    return (
      <div style={{ minHeight: '100vh', padding: '24px', backgroundColor: '#1a2332' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: factionColors.PRIMARY, margin: '0 0 16px 0' }}>
              CUSTOM START SETUP
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Configure starting difficulty and loadouts</p>
          </div>

          {/* Difficulty Selection */}
          <div style={{ backgroundColor: '#283548', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>
              Starting Difficulty
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px' }}>
              {DIFFICULTY_CONFIG.map(diff => (
                <button
                  key={diff.level}
                  onClick={() => dispatch(actions.updateCustomSetup({ difficulty: diff.level }))}
                  style={{
                    padding: '12px 8px',
                    backgroundColor: customSetup.difficulty === diff.level ? factionColors.PRIMARY : 'transparent',
                    color: customSetup.difficulty === diff.level ? 'black' : '#cbd5e1',
                    border: customSetup.difficulty === diff.level ? `2px solid ${factionColors.PRIMARY}` : '1px solid rgba(100, 116, 139, 0.5)',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title={diff.name}
                >
                  {diff.level}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '8px', textAlign: 'center', color: factionColors.PRIMARY, fontSize: '14px' }}>
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
                  backgroundColor: selectedPlayer === i ? factionColors.PRIMARY : '#283548',
                  color: selectedPlayer === i ? 'black' : '#cbd5e1',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Helldiver {i + 1}
              </button>
            ))}
          </div>

          {/* Loadout Editor */}
          <div style={{ backgroundColor: '#283548', padding: '24px', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            <h3 style={{ color: factionColors.PRIMARY, marginBottom: '16px', fontSize: '18px' }}>Loadout Configuration</h3>
            
            {/* Primary */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Primary</label>
              <select
                value={currentLoadout.primary || ''}
                onChange={(e) => updateLoadoutSlot(selectedPlayer, 'primary', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: factionColors.PRIMARY,
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {itemsByType.primary.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </select>
            </div>

            {/* Secondary */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Secondary</label>
              <select
                value={currentLoadout.secondary || ''}
                onChange={(e) => updateLoadoutSlot(selectedPlayer, 'secondary', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {itemsByType.secondary.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </select>
            </div>

            {/* Grenade */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Grenade</label>
              <select
                value={currentLoadout.grenade || ''}
                onChange={(e) => updateLoadoutSlot(selectedPlayer, 'grenade', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: '#cbd5e1',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {itemsByType.grenade.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </select>
            </div>

            {/* Armor */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Armor</label>
              <select
                value={currentLoadout.armor || ''}
                onChange={(e) => updateLoadoutSlot(selectedPlayer, 'armor', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: '#cbd5e1',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {itemsByType.armor.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </select>
            </div>

            {/* Booster */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Booster</label>
              <select
                value={currentLoadout.booster || ''}
                onChange={(e) => updateLoadoutSlot(selectedPlayer, 'booster', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: '#cbd5e1',
                  border: '1px solid rgba(100, 116, 139, 0.5)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {itemsByType.booster.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.rarity})</option>
                ))}
              </select>
            </div>

            {/* Stratagems */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Stratagems</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[0, 1, 2, 3].map(slotIdx => (
                  <select
                    key={slotIdx}
                    value={currentLoadout.stratagems[slotIdx] || ''}
                    onChange={(e) => {
                      const newStratagems = [...currentLoadout.stratagems];
                      newStratagems[slotIdx] = e.target.value || null;
                      updateLoadoutSlot(selectedPlayer, 'stratagems', newStratagems);
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: '#1f2937',
                      color: 'white',
                      border: '1px solid rgba(100, 116, 139, 0.5)',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="">Slot {slotIdx + 1}: None</option>
                    {itemsByType.stratagem.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
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
                transition: 'all 0.2s'
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
                letterSpacing: '0.1em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_HOVER;
                e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
                e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY;
              }}
            >
              Start Operation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'EVENT') {
    if (!currentEvent) {
      dispatch(actions.setPhase('DRAFT'));
      return null;
    }

    const handleEventChoice = (choice) => {
      // Process outcomes using the event processor with selections
      const selections = {
        stratagemSelection: eventStratagemSelection,
        targetPlayerSelection: eventTargetPlayerSelection,
        targetStratagemSelection: eventTargetStratagemSelection
      };

      const updates = processAllOutcomes(choice.outcomes, choice, {
        players,
        eventPlayerChoice,
        requisition,
        currentDiff,
        gameConfig,
        burnedCards
      }, selections);

      // Check if we need booster selection
      if (updates.needsBoosterSelection && updates.boosterDraft) {
        dispatch(actions.setEventBoosterDraft(updates.boosterDraft));
        // Store the outcome for later application
        window.__boosterOutcome = updates.boosterOutcome;
        
        // Burn both booster options shown in the draft
        if (updates.burnBoosterDraft && updates.burnBoosterDraft.length > 0) {
          updates.burnBoosterDraft.forEach(boosterId => {
            dispatch(actions.addBurnedCard(boosterId));
          });
        }
        
        return; // Don't close event yet, wait for booster selection
      }

      // Check if we need subfaction selection
      if (updates.needsSubfactionSelection && updates.pendingFaction) {
        dispatch(actions.setPendingFaction(updates.pendingFaction));
        return; // Don't close event yet, wait for subfaction selection
      }

      // Check if we need special draft (throwable or secondary for all players)
      if (updates.needsSpecialDraft && updates.specialDraftType) {
        // Generate draft pool based on type
        const itemType = updates.specialDraftType === 'throwable' ? TYPE.GRENADE : TYPE.SECONDARY;
        let availableItems = MASTER_DB.filter(item => item.type === itemType);
        
        // Filter out burned cards if burn mode is enabled
        if (gameConfig.burnCards && burnedCards.length > 0) {
          availableItems = availableItems.filter(item => !burnedCards.includes(item.id));
        }
        
        // For throwables, enforce global uniqueness (each must be different across all players)
        if (updates.specialDraftType === 'throwable' && gameConfig.globalUniqueness) {
          const existingThrowables = new Set();
          players.forEach(player => {
            if (player.loadout.grenade) {
              existingThrowables.add(player.loadout.grenade);
            }
          });
          availableItems = availableItems.filter(item => !existingThrowables.has(item.id));
        }
        
        // Set up special draft state
        dispatch(actions.setEventSpecialDraft(availableItems));
        dispatch(actions.setEventSpecialDraftType(updates.specialDraftType));
        dispatch(actions.setEventSpecialDraftSelections(new Array(players.length).fill(null)));
        
        // Apply player updates (armor changes)
        if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players));
        
        return; // Don't close event yet, wait for all players to select
      }

      // Apply state updates
      if (updates.requisition !== undefined) dispatch(actions.setRequisition(updates.requisition));
      if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players));
      if (updates.currentDiff !== undefined) dispatch(actions.setDifficulty(updates.currentDiff));
      if (updates.faction !== undefined || updates.subfaction !== undefined) {
        const configUpdates = {};
        if (updates.faction !== undefined) configUpdates.faction = updates.faction;
        if (updates.subfaction !== undefined) configUpdates.subfaction = updates.subfaction;
        dispatch(actions.updateGameConfig(configUpdates));
      }
      if (updates.bonusRequisition !== undefined) dispatch(actions.addRequisition(updates.bonusRequisition));
      
      // Handle burned cards from transformation
      if (updates.newBurnedCards && updates.newBurnedCards.length > 0) {
        updates.newBurnedCards.forEach(cardId => dispatch(actions.addBurnedCard(cardId)));
      }
      
      // Display transformed slots
      if (updates.transformedSlots && updates.transformedSlots.length > 0) {
        const transformList = updates.transformedSlots.map(t => 
          `${t.slot.replace('_', ' ').toUpperCase()}: ${t.oldItem} → ${t.newItem}`
        ).join('\n• ');
        setTimeout(() => {
          alert(`Quantum Reconfiguration Complete!\n\n${updates.transformedSlots.length} item${updates.transformedSlots.length > 1 ? 's' : ''} transformed:\n\n• ${transformList}`);
        }, 100);
      }
      
      // Check if we need to immediately start a redraft
      if (updates.needsRedraft && updates.redraftPlayerIndex !== undefined) {
        // Show liquidated items message
        if (updates.liquidatedItems && updates.liquidatedItems.length > 0) {
          const itemsList = updates.liquidatedItems.join('\n• ');
          const draftCount = updates.redraftCount || 1;
          setTimeout(() => {
            alert(`Assets Liquidated (${updates.liquidatedItems.length} items):\n\n• ${itemsList}\n\nYou will now complete ${draftCount} draft round${draftCount > 1 ? 's' : ''} to rebuild your loadout.`);
          }, 100);
        }
        
        // Close event
        dispatch(actions.setCurrentEvent(null));
        dispatch(actions.setEventPlayerChoice(null));
        dispatch(actions.resetEventSelections());
        
        // Start first draft round for the redrafting player
        const redraftPlayer = updates.players[updates.redraftPlayerIndex];
        const playerLockedSlots = redraftPlayer?.lockedSlots || [];
        const redraftHand = generateDraftHand(
          redraftPlayer,
          currentDiff,
          gameConfig,
          burnedCards,
          updates.players,
          (cardId) => dispatch(actions.addBurnedCard(cardId)),
          getDraftHandSize(gameConfig.starRating),
          playerLockedSlots
        );
        
        dispatch(actions.setDraftState({
          activePlayerIndex: updates.redraftPlayerIndex,
          roundCards: redraftHand,
          isRerolling: false,
          pendingStratagem: null,
          extraDraftRound: 0,
          isRedrafting: true,  // Flag to indicate this is a redraft
          draftOrder: [updates.redraftPlayerIndex] // Single player redraft
        }));
        dispatch(actions.setPhase('DRAFT'));
        return;
      }
      
      // Display removed item notification
      if (updates.removedItemName) {
        const itemType = updates.removedItemType === 'stratagem' ? 'Stratagem' : 
                        updates.removedItemType === 'primary' ? 'Primary Weapon' :
                        updates.removedItemType === 'secondary' ? 'Secondary Weapon' : 'Grenade';
        setTimeout(() => {
          alert(`Equipment Confiscated: ${updates.removedItemName} (${itemType}) has been removed from your loadout.`);
        }, 100);
      }
      
      // Display gained item notification (single player)
      if (updates.gainedItemName) {
        setTimeout(() => {
          alert(`Equipment Acquired: ${updates.gainedItemName} has been added to your loadout!`);
        }, 100);
      }
      
      // Display gained items notification (multiple players)
      if (updates.gainedItems && updates.gainedItems.length > 0) {
        setTimeout(() => {
          const itemList = updates.gainedItems
            .map(item => `${state.players[item.playerIndex].name}: ${item.itemName}`)
            .join('\n');
          alert(`Equipment Acquired:\n${itemList}`);
        }, 100);
      }
      
      // Handle game over
      if (updates.triggerGameOver) {
        setTimeout(() => dispatch(actions.setPhase('GAMEOVER')), 100);
        return;
      }
      
      // After event, proceed to dashboard
      dispatch(actions.setCurrentEvent(null));
      dispatch(actions.setEventPlayerChoice(null));
      dispatch(actions.resetEventSelections());
      dispatch(actions.setPhase('DASHBOARD'));
    };

    const handleAutoContinue = () => {
      // Handle booster selection confirmation
      if (eventBoosterDraft && eventBoosterSelection) {
        const outcome = window.__boosterOutcome;
        const newPlayers = applyGainBoosterWithSelection(players, outcome, eventPlayerChoice, eventBoosterSelection);
        dispatch(actions.setPlayers(newPlayers));
        
        // Clean up and close event
        window.__boosterOutcome = null;
        dispatch(actions.setCurrentEvent(null));
        dispatch(actions.setEventPlayerChoice(null));
        dispatch(actions.resetEventSelections());
        dispatch(actions.setPhase('DASHBOARD'));
        return;
      }
      
      // Handle special draft completion (all players have selected)
      if (eventSpecialDraft && eventSpecialDraftType) {
        // Check if all players have their selections stored
        const allPlayersSelected = Array.isArray(eventSpecialDraftSelections) && 
                                   eventSpecialDraftSelections.length === players.length &&
                                   eventSpecialDraftSelections.every(selection => selection !== null && selection !== undefined);
        
        if (!allPlayersSelected) {
          return;
        }

        const newPlayers = [...players];
        const selections = eventSpecialDraftSelections;
        
        // Apply selections and burn cards
        selections.forEach((itemId, playerIndex) => {
          if (eventSpecialDraftType === 'throwable') {
            newPlayers[playerIndex].loadout.grenade = itemId;
          } else if (eventSpecialDraftType === 'secondary') {
            newPlayers[playerIndex].loadout.secondary = itemId;
          }
          
          // Burn the selected card if burn mode is enabled
          if (gameConfig.burnCards) {
            dispatch(actions.addBurnedCard(itemId));
          }
        });
        
        dispatch(actions.setPlayers(newPlayers));
        
        // Clean up
        dispatch(actions.setCurrentEvent(null));
        dispatch(actions.setEventPlayerChoice(null));
        dispatch(actions.resetEventSelections());
        dispatch(actions.setPhase('DASHBOARD'));
        return;
      }
      
      if (currentEvent.outcomes) {
        let outcomesToProcess = [];
        
        if (currentEvent.type === EVENT_TYPES.RANDOM) {
          // Pick weighted random outcome
          const totalWeight = currentEvent.outcomes.reduce((sum, o) => sum + (o.weight || 1), 0);
          let random = Math.random() * totalWeight;
          for (const outcome of currentEvent.outcomes) {
            random -= (outcome.weight || 1);
            if (random <= 0) {
              outcomesToProcess = [outcome];
              break;
            }
          }
        } else {
          // Process all outcomes for BENEFICIAL/DETRIMENTAL
          outcomesToProcess = currentEvent.outcomes;
        }
        
        // Process outcomes using the event processor
        const updates = processAllOutcomes(outcomesToProcess, null, {
          players,
          eventPlayerChoice,
          requisition,
          currentDiff,
          gameConfig,
          burnedCards
        });

        // Apply state updates
        if (updates.requisition !== undefined) dispatch(actions.setRequisition(updates.requisition));
        if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players));
        if (updates.currentDiff !== undefined) dispatch(actions.setDifficulty(updates.currentDiff));
      if (updates.faction !== undefined || updates.subfaction !== undefined) {
        const configUpdates = {};
        if (updates.faction !== undefined) configUpdates.faction = updates.faction;
        if (updates.subfaction !== undefined) configUpdates.subfaction = updates.subfaction;
        dispatch(actions.updateGameConfig(configUpdates));
      }
        
        // Handle game over
        if (updates.triggerGameOver) {
          setTimeout(() => dispatch(actions.setPhase('GAMEOVER')), 100);
          return;
        }
      }
      
      dispatch(actions.setCurrentEvent(null));
      dispatch(actions.setEventPlayerChoice(null));
      dispatch(actions.resetEventSelections());
      dispatch(actions.setPhase('DASHBOARD'));
    };

    return (
      <div style={{ minHeight: '100vh' }}>
        {/* MULTIPLAYER STATUS BAR */}
        {isMultiplayer && (
          <MultiplayerStatusBar 
            gameConfig={gameConfig} 
            onDisconnect={disconnect}
          />
        )}
        
        <EventDisplay
        currentEvent={currentEvent}
        eventPlayerChoice={eventPlayerChoice}
        eventStratagemSelection={eventStratagemSelection}
        eventTargetPlayerSelection={eventTargetPlayerSelection}
        eventTargetStratagemSelection={eventTargetStratagemSelection}
        eventBoosterDraft={eventBoosterDraft}
        eventBoosterSelection={eventBoosterSelection}
        eventSpecialDraft={eventSpecialDraft}
        eventSpecialDraftType={eventSpecialDraftType}
        eventSpecialDraftSelections={eventSpecialDraftSelections}
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
        onPlayerChoice={(choice) => dispatch(actions.setEventPlayerChoice(choice))}
        onEventChoice={handleEventChoice}
        onAutoContinue={handleAutoContinue}
        onStratagemSelection={(selection) => dispatch(actions.setEventStratagemSelection(selection))}
        onTargetPlayerSelection={(playerIndex) => dispatch(actions.setEventTargetPlayerSelection(playerIndex))}
        onTargetStratagemSelection={(selection) => dispatch(actions.setEventTargetStratagemSelection(selection))}
        onBoosterSelection={(boosterId) => dispatch(actions.setEventBoosterSelection(boosterId))}
        onSubfactionSelection={(subfaction) => dispatch(actions.setPendingSubfactionSelection(subfaction))}
        onConfirmSubfaction={() => {
          // Apply the faction and subfaction change
          dispatch(actions.updateGameConfig({ 
            faction: pendingFaction,
            subfaction: pendingSubfactionSelection
          }));
          // Close the event
          dispatch(actions.setCurrentEvent(null));
          dispatch(actions.setEventPlayerChoice(null));
          dispatch(actions.resetEventSelections());
          dispatch(actions.setPhase('DASHBOARD'));
        }}
        onSpecialDraftSelection={(playerIndex, itemId) => {
          if (isMultiplayer && playerSlot !== playerIndex) {
            return;
          }

          if (isMultiplayer && !isHost) {
            sendAction({
              type: 'SET_EVENT_SPECIAL_DRAFT_SELECTION',
              payload: {
                playerIndex,
                itemId
              }
            });
            return;
          }

          dispatch(actions.setEventSpecialDraftSelection(playerIndex, itemId));
        }}
        onConfirmSelections={handleEventChoice}
      />
      </div>
    );
  }

  // SACRIFICE PHASE
  if (phase === 'SACRIFICE') {
    const playerIndex = sacrificeState.activePlayerIndex;
    const player = players[playerIndex];
    
    if (!player) {
      console.error('SACRIFICE: Invalid player index', playerIndex, 'players:', players.length);
      return <div>Error: Invalid player state</div>;
    }
    
    const sacrificableItems = [];
    
    // Collect all sacrificable items from player's loadout
    // Cannot sacrifice P2-Peacemaker (s_peacemaker) or B-01 Tactical (a_b01)
    if (player.loadout.primary) {
      const item = getItemById(player.loadout.primary);
      if (item) sacrificableItems.push({ ...item, slot: 'Primary' });
    }
    
    if (player.loadout.secondary && player.loadout.secondary !== 's_peacemaker') {
      const item = getItemById(player.loadout.secondary);
      if (item) sacrificableItems.push({ ...item, slot: 'Secondary' });
    }
    
    if (player.loadout.grenade && player.loadout.grenade !== 'g_he') {
      const item = getItemById(player.loadout.grenade);
      if (item) sacrificableItems.push({ ...item, slot: 'Grenade' });
    }
    
    if (player.loadout.armor && player.loadout.armor !== 'a_b01') {
      const item = getItemById(player.loadout.armor);
      if (item) sacrificableItems.push({ ...item, slot: 'Armor' });
    }
    
    if (player.loadout.booster) {
      const item = getItemById(player.loadout.booster);
      if (item) sacrificableItems.push({ ...item, slot: 'Booster' });
    }
    
    player.loadout.stratagems.forEach((sid, idx) => {
      if (sid) {
        const item = getItemById(sid);
        if (item) sacrificableItems.push({ ...item, slot: `Stratagem ${idx + 1}` });
      }
    });
    
    const handleSacrifice = (item) => {
      // Sacrifice the item for the current active player
      const playerIndex = sacrificeState.activePlayerIndex;
      console.log('Sacrificing item', item.id, 'for player index', playerIndex, 'player:', players[playerIndex]?.name);
      
      // Apply sacrifice to the players array
      const itemId = item.id;
      const updatedPlayers = players.map((player, idx) => {
        if (idx !== playerIndex) return player;
        
        // Remove from inventory
        let newInventory = player.inventory.filter(id => id !== itemId);
        
        // Remove from loadout if equipped
        const newLoadout = { 
          ...player.loadout,
          stratagems: [...player.loadout.stratagems]
        };
        
        if (newLoadout.primary === itemId) newLoadout.primary = null;
        if (newLoadout.secondary === itemId) {
          newLoadout.secondary = 's_peacemaker';
          if (!newInventory.includes('s_peacemaker')) {
            newInventory.push('s_peacemaker');
          }
        }
        if (newLoadout.grenade === itemId) {
          newLoadout.grenade = 'g_he';
          if (!newInventory.includes('g_he')) {
            newInventory.push('g_he');
          }
        }
        if (newLoadout.armor === itemId) {
          newLoadout.armor = 'a_b01';
          if (!newInventory.includes('a_b01')) {
            newInventory.push('a_b01');
          }
        }
        if (newLoadout.booster === itemId) newLoadout.booster = null;
        
        // Remove stratagem from all slots that match
        for (let i = 0; i < newLoadout.stratagems.length; i++) {
          if (newLoadout.stratagems[i] === itemId) {
            newLoadout.stratagems[i] = null;
          }
        }
        
        return {
          ...player,
          inventory: newInventory,
          loadout: newLoadout
        };
      });
      
      // Move to next player who needs to sacrifice, or end sacrifice phase
      const currentIndex = sacrificeState.sacrificesRequired.indexOf(playerIndex);
      const nextIndex = currentIndex + 1;
      
      console.log('Current position in sacrifice queue:', currentIndex, 'Next:', nextIndex, 'Total required:', sacrificeState.sacrificesRequired);
      
      if (nextIndex < sacrificeState.sacrificesRequired.length) {
        // Move to next player
        const nextPlayerIndex = sacrificeState.sacrificesRequired[nextIndex];
        console.log('Moving to next player index:', nextPlayerIndex);
        dispatch(actions.setPlayers(updatedPlayers));
        dispatch(actions.updateSacrificeState({
          activePlayerIndex: nextPlayerIndex
        }));
      } else {
        // All sacrifices complete - reset extraction status and move to draft
        console.log('All sacrifices complete, moving to draft');
        const resetPlayers = updatedPlayers.map(p => ({ ...p, extracted: true }));
        dispatch(actions.setPlayers(resetPlayers));
        startDraftPhase();
      }
    };
    
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
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
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.5)';
              e.currentTarget.style.color = factionColors.PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            💾 Export
          </button>
        </div>
        
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '8px',
              padding: '16px 32px',
              marginBottom: '24px',
              display: 'inline-block'
            }}>
              <div style={{ color: '#ef4444', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ⚠️ EXTRACTION FAILURE PENALTY
              </div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
                Equipment Lost in Combat Zone
              </div>
            </div>
            
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: 'white', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              {player.name} <span style={{ color: '#64748b' }}>{'//'}</span> Sacrifice Item
            </h1>
            <p style={{ color: '#94a3b8', margin: '0' }}>
              Select one item from your loadout to sacrifice (minimum gear protected)
            </p>
          </div>

          {sacrificableItems.length === 0 ? (
            <div style={{ 
              backgroundColor: '#283548', 
              padding: '40px', 
              borderRadius: '12px', 
              border: '1px solid rgba(100, 116, 139, 0.5)',
              textAlign: 'center',
              maxWidth: '600px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
              <h3 style={{ color: factionColors.PRIMARY, fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                No Items to Sacrifice
              </h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>
                You only have minimum required equipment (P2-Peacemaker & B-01 Tactical).
              </p>
              <button
                onClick={() => {
                  // Skip this player - move to next or end sacrifice phase
                  const currentIndex = sacrificeState.sacrificesRequired.indexOf(sacrificeState.activePlayerIndex);
                  const nextIndex = currentIndex + 1;
                  
                  if (nextIndex < sacrificeState.sacrificesRequired.length) {
                    dispatch(actions.updateSacrificeState({
                      activePlayerIndex: sacrificeState.sacrificesRequired[nextIndex]
                    }));
                  } else {
                    const resetPlayers = players.map(p => ({ ...p, extracted: true }));
                    dispatch(actions.setPlayers(resetPlayers));
                    startDraftPhase();
                  }
                }}
                style={{
                  ...BUTTON_STYLES.PRIMARY,
                  marginTop: '24px',
                  padding: '12px 32px',
                  border: 'none',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.PRIMARY_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
                }}
              >
                Continue
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${Math.min(sacrificableItems.length, 4)}, 1fr)`, 
              gap: '24px', 
              marginBottom: '48px',
              width: '100%'
            }}>
              {sacrificableItems.map((item, idx) => (
                <div 
                  key={`${item.id}-${idx}`}
                  onClick={() => {
                    if (window.confirm(`Sacrifice ${item.name}? This item will be permanently removed from your inventory and loadout.`)) {
                      handleSacrifice(item);
                    }
                  }}
                  style={{
                    backgroundColor: '#283548',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '12px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.backgroundColor = '#1f2937';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    e.currentTarget.style.backgroundColor = '#283548';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {item.slot}
                  </div>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {item.rarity}
                  </div>
                  <div style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic', marginTop: 'auto' }}>
                    Click to sacrifice
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'DRAFT') {
    const player = players[draftState.activePlayerIndex];
    
    // In multiplayer, check if it's this player's turn to draft
    const isMyTurn = !isMultiplayer || (playerSlot === draftState.activePlayerIndex);
    
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* MULTIPLAYER STATUS BAR */}
        {isMultiplayer && (
          <MultiplayerStatusBar 
            gameConfig={gameConfig} 
            onDisconnect={disconnect}
          />
        )}
        
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
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
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.5)';
              e.currentTarget.style.color = factionColors.PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            💾 Export
          </button>
        </div>
        
        {/* Stratagem Replacement Modal */}
        {draftState.pendingStratagem && (
          <div style={{
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
            padding: '24px'
          }}>
            <div style={{
              backgroundColor: '#283548',
              borderRadius: '12px',
              border: `2px solid ${factionColors.PRIMARY}`,
              padding: '32px',
              maxWidth: '800px',
              width: '100%'
            }}>
              <h2 style={{ color: factionColors.PRIMARY, fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>
                Replace Stratagem
              </h2>
              <p style={{ color: '#cbd5e1', textAlign: 'center', marginBottom: '24px' }}>
                All stratagem slots are full. Select which stratagem to replace with:
              </p>
              <div style={{ 
                backgroundColor: '#1f2937', 
                padding: '16px', 
                borderRadius: '8px', 
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '18px' }}>
                  {draftState.pendingStratagem.name}
                </div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                  {draftState.pendingStratagem.rarity}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {player.loadout.stratagems.map((sid, i) => {
                  const stratagem = getItemById(sid);
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
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = factionColors.PRIMARY}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)'}
                    >
                      <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Slot {i + 1}
                      </div>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                        {stratagem?.name || 'Empty'}
                      </div>
                      {stratagem && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                          {stratagem.rarity}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => dispatch(actions.updateDraftState({ pendingStratagem: null }))}
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
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)'}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            {(draftState.extraDraftRound > 0) && (
              <div style={{
                backgroundColor: factionColors.PRIMARY + '20',
                border: `2px solid ${factionColors.PRIMARY}`,
                borderRadius: '8px',
                padding: '12px 24px',
                marginBottom: '16px',
                display: 'inline-block'
              }}>
                <div style={{ color: factionColors.PRIMARY, fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  🎁 BONUS DRAFT {draftState.extraDraftRound}/{player.extraDraftCards || 0}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                  Priority Access Equipment
                </div>
              </div>
            )}
            {(draftState.isRedrafting && player.redraftRounds > 0) && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '12px 24px',
                marginBottom: '16px',
                display: 'inline-block'
              }}>
                <div style={{ color: factionColors.PRIMARY, fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  🔄 ASSET REINVESTMENT
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                  Draft {player.redraftRounds} of {player.redraftRounds} Remaining
                </div>
              </div>
            )}
            <h2 style={{ color: factionColors.PRIMARY, fontSize: '14px', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
              Priority Requisition Authorized
            </h2>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: 'white', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              {player.name} <span style={{ color: '#64748b' }}>{'//'}</span> Select Upgrade
            </h1>
            <p style={{ color: '#94a3b8', margin: '0' }}>
              Choose wisely. This equipment is vital for Difficulty {currentDiff}.
            </p>
          </div>

          {/* Current Loadout Overview */}
          <div style={{ 
            backgroundColor: 'rgba(40, 53, 72, 0.5)', 
            borderRadius: '8px', 
            padding: '16px 24px', 
            marginBottom: '32px',
            border: '1px solid rgba(100, 116, 139, 0.3)'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#64748b', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              marginBottom: '12px'
            }}>
              {player.name}'s Current Loadout
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* Primary */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Primary</div>
                <div style={{ 
                  padding: '4px 8px', 
                  backgroundColor: player.loadout.primary ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.1)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: player.loadout.primary ? factionColors.PRIMARY : '#64748b'
                }}>
                  {player.loadout.primary ? getItemById(player.loadout.primary)?.name || '—' : '—'}
                </div>
              </div>
              
              {/* Stratagems */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Stratagems</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {player.loadout.stratagems.map((sid, i) => {
                    const strat = sid ? getItemById(sid) : null;
                    return (
                      <div key={i} style={{ 
                        padding: '4px 8px', 
                        backgroundColor: strat ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.1)',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: strat ? '#cbd5e1' : '#64748b',
                        maxWidth: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={strat?.name || 'Empty'}>
                        {strat?.name || '—'}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Secondary */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Secondary</div>
                <div style={{ 
                  padding: '4px 8px', 
                  backgroundColor: player.loadout.secondary ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.1)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: player.loadout.secondary ? '#cbd5e1' : '#64748b'
                }}>
                  {player.loadout.secondary ? getItemById(player.loadout.secondary)?.name || '—' : '—'}
                </div>
              </div>
              
              {/* Grenade */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Grenade</div>
                <div style={{ 
                  padding: '4px 8px', 
                  backgroundColor: player.loadout.grenade ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.1)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: player.loadout.grenade ? '#cbd5e1' : '#64748b'
                }}>
                  {player.loadout.grenade ? getItemById(player.loadout.grenade)?.name || '—' : '—'}
                </div>
              </div>
              
              {/* Armor */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Armor</div>
                <div style={{ 
                  padding: '4px 8px', 
                  backgroundColor: player.loadout.armor ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.1)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: player.loadout.armor ? '#cbd5e1' : '#64748b'
                }}>
                  {player.loadout.armor ? getItemById(player.loadout.armor)?.name || '—' : '—'}
                </div>
              </div>
              
              {/* Booster */}
              {player.loadout.booster && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Booster</div>
                  <div style={{ 
                    padding: '4px 8px', 
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#22c55e'
                  }}>
                    {getItemById(player.loadout.booster)?.name || '—'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filter out any null/undefined items that may have been stripped during sync */}
          {(() => {
            const validCards = (draftState.roundCards || []).filter(item => item && (item.id || item.name || item.passive));
            console.log('[Draft Render] Round cards:', draftState.roundCards);
            console.log('[Draft Render] Valid cards:', validCards);
            return (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${Math.min(validCards.length, 4)}, 1fr)`, 
                gap: '24px', 
                marginBottom: '48px',
                opacity: isMyTurn ? 1 : 0.6,
                pointerEvents: isMyTurn ? 'auto' : 'none'
              }}>
                {validCards.map((item, idx) => (
                  <ItemCard 
                    key={`${item.id || item.name || item.passive}-${idx}`} 
                    item={item} 
                    onSelect={isMyTurn ? handleDraftPick : null} 
                    onRemove={isMyTurn ? removeCardFromDraft : null} 
                  />
                ))}
              </div>
            );
          })()}

          {/* Not your turn message */}
          {!isMyTurn && (
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '32px',
              padding: '16px 32px',
              backgroundColor: 'rgba(100, 116, 139, 0.2)',
              border: '2px solid rgba(100, 116, 139, 0.4)',
              borderRadius: '8px',
              display: 'inline-block',
              margin: '0 auto 32px auto'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Waiting for {player.name} to draft...
              </div>
            </div>
          )}

          {/* Only show draft controls if it's your turn */}
          {isMyTurn && (<>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
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
                border: requisition >= 1 ? '2px solid white' : '2px solid #334155',
                backgroundColor: 'transparent',
                color: requisition >= 1 ? 'white' : '#64748b',
                cursor: requisition >= 1 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={20} />
              Reroll All Cards (-1 Req)
            </button>
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
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#64748b';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              Skip Draft
            </button>
          </div>
          
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '0' }}>
                Click the × on a card to remove just that card (free)<br/>
                Or use "Reroll All Cards" to reroll the entire hand
              </p>
            </div>
          </>)}
          
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <span style={{ color: factionColors.PRIMARY, fontFamily: 'monospace' }}>Current Requisition: {Math.floor(requisition)} R</span>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // DASHBOARD PHASE
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* MULTIPLAYER STATUS BAR */}
      {isMultiplayer && (
        <MultiplayerStatusBar 
          gameConfig={gameConfig} 
          onDisconnect={disconnect}
        />
      )}
      
      {/* HEADER */}
      <GameHeader 
        currentDiff={currentDiff}
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
        <div style={{ display: 'grid', gridTemplateColumns: gameConfig.playerCount > 1 ? 'repeat(auto-fit, minmax(400px, 1fr))' : '1fr', gap: '32px', marginBottom: '48px' }}>
          {players.map((player, index) => {
            const { getSlotLockCost, MAX_LOCKED_SLOTS } = require('./constants/balancingConfig');
            // In multiplayer, only allow the current player to lock their own slots
            const isCurrentPlayer = !isMultiplayer || (playerSlot === index);
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
              />
            );
          })}
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '100%', maxWidth: '800px', backgroundColor: '#283548', padding: '24px', borderRadius: '12px', border: '1px solid rgba(100, 116, 139, 0.5)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', marginBottom: '24px' }}>Mission Status Report</h2>
            
            {/* Star Rating Selection */}
            <div style={{ marginBottom: '32px', opacity: (!isMultiplayer || isHost) ? 1 : 0.6 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
                Mission Performance Rating
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '12px', pointerEvents: (!isMultiplayer || isHost) ? 'auto' : 'none' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button 
                    key={n}
                    onClick={() => dispatch(actions.updateGameConfig({ starRating: n }))}
                    disabled={isMultiplayer && !isHost}
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
                      backgroundColor: gameConfig.starRating === n ? factionColors.PRIMARY : 'transparent',
                      color: gameConfig.starRating === n ? 'black' : '#64748b',
                      border: gameConfig.starRating === n ? `2px solid ${factionColors.PRIMARY}` : '1px solid rgba(100, 116, 139, 0.5)',
                      cursor: (!isMultiplayer || isHost) ? 'pointer' : 'not-allowed'
                    }}
                    onMouseEnter={(e) => {
                      if (gameConfig.starRating !== n && (!isMultiplayer || isHost)) {
                        e.currentTarget.style.borderColor = '#64748b';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (gameConfig.starRating !== n && (!isMultiplayer || isHost)) {
                        e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)';
                      }
                    }}
                  >
                    <div>{n}</div>
                    <div style={{ fontSize: '16px' }}>★</div>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                {getDraftHandSize()} equipment cards will be offered
              </p>
            </div>
            
            {/* Samples Collected */}
            <div style={{ marginBottom: '32px', opacity: (!isMultiplayer || isHost) ? 1 : 0.6 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
                Samples Collected This Mission {isMultiplayer && !isHost && <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>(Host only)</span>}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '8px' }}>
                {/* Common Samples */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <img 
                      src="https://helldivers.wiki.gg/images/Common_Sample_Logo.svg" 
                      alt="Common" 
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#22c55e', textTransform: 'uppercase' }}>
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
                      cursor: (!isMultiplayer || isHost) ? 'text' : 'not-allowed'
                    }}
                  />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                    +1% event chance each
                  </div>
                </div>
                
                {/* Rare Samples */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <img 
                      src="https://helldivers.wiki.gg/images/Rare_Sample_Logo.svg" 
                      alt="Rare" 
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f97316', textTransform: 'uppercase' }}>
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
                      cursor: (!isMultiplayer || isHost) ? 'text' : 'not-allowed'
                    }}
                  />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                    +2% event chance each
                  </div>
                </div>
                
                {/* Super Rare Samples */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <img 
                      src="https://helldivers.wiki.gg/images/Super_Sample_Logo.svg" 
                      alt="Super Rare" 
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#a855f7', textTransform: 'uppercase' }}>
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
                      cursor: (!isMultiplayer || isHost) ? 'text' : 'not-allowed'
                    }}
                  />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                    +3% event chance each
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: '8px 0 0 0', textAlign: 'center' }}>
                Samples increase the chance of random events. Event chance resets to base 0% when an event occurs.
              </p>
            </div>
            
            {/* Extraction Status */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
                Extraction Status
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {players.map((player, idx) => {
                  // In multiplayer, clients can only toggle their own extraction status
                  const canToggle = !isMultiplayer || isHost || idx === playerSlot;
                  
                  const handleExtractionChange = (checked) => {
                    if (!canToggle) return;
                    
                    // In multiplayer as client, send action to host
                    if (isMultiplayer && !isHost) {
                      sendAction({
                        type: 'SET_PLAYER_EXTRACTED',
                        payload: { playerIndex: idx, extracted: checked }
                      });
                    } else {
                      dispatch(actions.setPlayerExtracted(idx, checked));
                    }
                  };
                  
                  return (
                    <label 
                      key={player.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        cursor: canToggle ? 'pointer' : 'not-allowed', 
                        padding: '10px 16px', 
                        backgroundColor: player.extracted ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                        borderRadius: '4px', 
                        border: `1px solid ${player.extracted ? '#22c55e' : '#ef4444'}`,
                        transition: 'all 0.2s',
                        opacity: canToggle ? 1 : 0.7
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={player.extracted !== false}
                        onChange={(e) => handleExtractionChange(e.target.checked)}
                        disabled={!canToggle}
                        style={{ width: '18px', height: '18px', cursor: canToggle ? 'pointer' : 'not-allowed' }}
                      />
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: player.extracted ? '#22c55e' : '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>
                          {player.name} extracted
                        </span>
                        {!player.extracted && gameConfig.brutalityMode && (
                          <span style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic' }}>
                            Must sacrifice item
                          </span>
                        )}
                        {!player.extracted && !gameConfig.brutalityMode && players.every(p => !p.extracted) && (
                          <span style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic' }}>
                            TPK - Must sacrifice item
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: '8px 0 0 0', textAlign: 'center' }}>
                {gameConfig.brutalityMode 
                  ? 'Brutality Mode: Non-extracted Helldivers must sacrifice equipment' 
                  : 'If all Helldivers fail to extract, all must sacrifice equipment'}
              </p>
            </div>
            
            {/* Mission outcome buttons - only host can control in multiplayer */}
            {(!isMultiplayer || isHost) ? (
              <>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => {
                       if (window.confirm('Mission Failed? This will end your run permanently. Are you sure?')) {
                         dispatch(actions.setPhase('GAMEOVER'));
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
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.5)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)'}
                  >
                    <XCircle />
                    Mission Failed
                  </button>

                  <button 
                    onClick={() => {
                  // Collect samples from input fields
                  const commonSamples = parseInt(document.getElementById('commonSamples')?.value || '0', 10);
                  const rareSamples = parseInt(document.getElementById('rareSamples')?.value || '0', 10);
                  const superRareSamples = parseInt(document.getElementById('superRareSamples')?.value || '0', 10);
                  
                  // Add samples to total
                  dispatch(actions.addSamples({
                    common: commonSamples,
                    rare: rareSamples,
                    superRare: superRareSamples
                  }));
                  
                  // Clear input fields
                  if (document.getElementById('commonSamples')) document.getElementById('commonSamples').value = '0';
                  if (document.getElementById('rareSamples')) document.getElementById('rareSamples').value = '0';
                  if (document.getElementById('superRareSamples')) document.getElementById('superRareSamples').value = '0';
                  
                  // Calculate dynamic requisition based on player count and subfaction
                  const { getRequisitionMultiplier } = require('./constants/balancingConfig');
                  const reqMultiplier = getRequisitionMultiplier(
                    gameConfig.playerCount,
                    gameConfig.subfaction
                  );
                  const reqGained = 1 * reqMultiplier;
                  dispatch(actions.addRequisition(reqGained));
                  
                  // Clear weapon restrictions from all players
                  const updatedPlayers = players.map(p => ({
                    ...p,
                    weaponRestricted: false
                  }));
                  dispatch(actions.setPlayers(updatedPlayers));
                  
                  // Check for victory condition
                  if (currentDiff === 10 && !gameConfig.endlessMode) {
                    dispatch(actions.setPhase('VICTORY'));
                    return;
                  }
                  
                  if (currentDiff < 10) dispatch(actions.setDifficulty(currentDiff + 1));
                  
                  // Check if sacrifice is required
                  let sacrificesRequired = [];
                  
                  if (gameConfig.brutalityMode) {
                    // Brutality mode: any non-extracted player must sacrifice
                    sacrificesRequired = players
                      .map((p, idx) => ({ player: p, idx }))
                      .filter(({ player }) => !player.extracted)
                      .map(({ idx }) => idx);
                  } else {
                    // Non-brutality: only if ALL players failed to extract
                    const allFailed = players.every(p => !p.extracted);
                    if (allFailed) {
                      sacrificesRequired = players.map((_, idx) => idx);
                    }
                  }
                  
                  // Route to SACRIFICE or DRAFT
                  if (sacrificesRequired.length > 0) {
                    dispatch(actions.setSacrificeState({
                      activePlayerIndex: sacrificesRequired[0],
                      sacrificesRequired: sacrificesRequired
                    }));
                    dispatch(actions.setPhase('SACRIFICE'));
                  } else {
                    startDraftPhase();
                  }
                }}
                style={{
                  ...BUTTON_STYLES.PRIMARY,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 32px',
                  border: 'none',
                  borderRadius: '4px',
                  letterSpacing: '2px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.PRIMARY_HOVER;
                  e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
                  e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY;
                }}
              >
                <CheckCircle />
                Mission Success
              </button>
                </div>
            
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace', margin: '16px 0 0 0' }}>
                  Report success to earn Requisition & proceed to draft.
                  <br/>Reporting failure consumes 1 Life.
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'rgba(100, 116, 139, 0.1)', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.3)' }}>
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
            <div style={{ width: '100%', maxWidth: '800px', backgroundColor: '#1a2332', padding: '24px', borderRadius: '12px', border: '2px solid #ef4444', marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase', margin: 0 }}>
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
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                >
                  Reset Seen Events
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {EVENTS.map(event => (
                  <button
                    key={event.id}
                    onClick={() => {
                      dispatch(actions.addSeenEvent(event.id));
                      dispatch(actions.setCurrentEvent(event));
                      dispatch(actions.setEventPlayerChoice(null));
                      dispatch(actions.setPhase('EVENT'));
                    }}
                    style={{
                      padding: '12px',
                      backgroundColor: seenEvents.includes(event.id) ? '#374151' : '#283548',
                      color: seenEvents.includes(event.id) ? '#6b7280' : '#cbd5e1',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: seenEvents.includes(event.id) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      opacity: seenEvents.includes(event.id) ? 0.5 : 1
                    }}
                    disabled={seenEvents.includes(event.id)}
                    onMouseEnter={(e) => {
                      if (!seenEvents.includes(event.id)) {
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.backgroundColor = '#374151';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!seenEvents.includes(event.id)) {
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.backgroundColor = '#283548';
                      }
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}>{event.name}</div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                      {event.id} {seenEvents.includes(event.id) ? '(SEEN)' : ''}
                    </div>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '12px', textAlign: 'center', fontStyle: 'italic' }}>
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
    </div>
  );
}

// Wrapper component that provides multiplayer context
export default function HelldiversRoguelite() {
  return (
    <MultiplayerProvider>
      <HelldiversRogueliteApp />
    </MultiplayerProvider>
  );
}
