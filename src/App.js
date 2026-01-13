import React, { useReducer, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { selectRandomEvent, EVENT_TYPES, EVENTS } from './systems/events/events';
import { RARITY, TYPE, FACTION } from './constants/types';
import { MASTER_DB } from './data/itemsByWarbond';
import { STARTING_LOADOUT, DIFFICULTY_CONFIG } from './constants/gameConfig';
import { getItemById } from './utils/itemHelpers';
import { getDraftHandSize, getWeightedPool, generateDraftHand } from './utils/draftHelpers';
import { areStratagemSlotsFull, getFirstEmptyStratagemSlot } from './utils/loadoutHelpers';
import { getArmorComboDisplayName } from './utils/itemHelpers';
import { processAllOutcomes, canAffordChoice, formatOutcome, formatOutcomes, needsPlayerChoice, applyGainBoosterWithSelection } from './systems/events/eventProcessor';
import { exportGameStateToFile, parseSaveFile, normalizeLoadedState } from './systems/persistence/saveManager';
import GameHeader from './components/GameHeader';
import EventDisplay from './components/EventDisplay';
import LoadoutDisplay from './components/LoadoutDisplay';
import GameLobby from './components/GameLobby';
import { gameReducer, initialState } from './state/gameReducer';
import * as actions from './state/actions';
import { COLORS, SHADOWS, BUTTON_STYLES, getFactionColors } from './constants/theme';

// --- DATA CONSTANTS (imported from modules) ---









// --- INITIAL STATE & HELPER LOGIC ---



export default function HelldiversRoguelite() {
  // --- STATE (Using useReducer for complex state management) ---
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Destructure commonly used state values for easier access
  const {
    phase,
    gameConfig,
    currentDiff,
    requisition,
    lives,
    burnedCards,
    customSetup,
    players,
    draftState,
    eventsEnabled,
    currentEvent,
    eventPlayerChoice,
    eventStratagemSelection,
    eventTargetPlayerSelection,
    eventTargetStratagemSelection,
    eventBoosterDraft,
    eventBoosterSelection,
    seenEvents
  } = state;
  
  // Get faction-specific colors
  const factionColors = getFactionColors(gameConfig.faction);
  
  // UI-only state (not part of game state)
  const [selectedPlayer, setSelectedPlayer] = React.useState(0); // For custom setup phase
  
  
  // Load game state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('helldraftersGameState');
      if (savedState) {
        const loadedState = JSON.parse(savedState);
        if (loadedState.phase && loadedState.phase !== 'MENU') {
          dispatch(actions.loadGameState(loadedState));
        }
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }, []);

  // Save game state to localStorage whenever it changes
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
    // Go to lobby to configure players
    dispatch(actions.setPhase('LOBBY'));
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
        weaponRestricted: false
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
        weaponRestricted: false
      }));
      dispatch(actions.setPlayers(newPlayers));
      dispatch(actions.setDifficulty(1));
      dispatch(actions.setRequisition(0)); // Start with 0, earn 1 per mission
      dispatch(actions.setLives(3));
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
      weaponRestricted: false
    }));
    dispatch(actions.setPlayers(newPlayers));
    dispatch(actions.setDifficulty(customSetup.difficulty));
    dispatch(actions.setRequisition(0));
    dispatch(actions.setLives(3));
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

    return generateDraftHand(
      player,
      currentDiff,
      gameConfig,
      burnedCards,
      players,
      (cardId) => dispatch(actions.addBurnedCard(cardId)),
      handSize
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
    
    dispatch(actions.setDraftState({
      activePlayerIndex: 0,
      roundCards: generateDraftHandForPlayer(0),
      isRerolling: false,
      pendingStratagem: null,
      extraDraftRound: 0
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
        isRedrafting: true
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
        extraDraftRound: currentExtraRound + 1
      }));
      return;
    }
    
    // Clear extra draft cards for this player
    if (currentPlayer.extraDraftCards) {
      const clearedPlayers = [...updatedPlayers];
      clearedPlayers[currentPlayerIdx] = { ...currentPlayer, extraDraftCards: 0 };
      dispatch(actions.setPlayers(clearedPlayers));
    }
    
    // Move to next player or complete
    if (currentPlayerIdx < gameConfig.playerCount - 1) {
      const nextIdx = currentPlayerIdx + 1;
      dispatch(actions.setDraftState({
        activePlayerIndex: nextIdx,
        roundCards: generateDraftHandForPlayer(nextIdx),
        isRerolling: false,
        pendingStratagem: null,
        extraDraftRound: 0
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
          const event = selectRandomEvent(currentDiff, players.length > 1, seenEvents);
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
    proceedToNextDraft(players);
  };

  const handleDraftPick = (item) => {
    const currentPlayerIdx = draftState.activePlayerIndex;
    const updatedPlayers = [...players];
    const player = updatedPlayers[currentPlayerIdx];

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
    const updatedPlayers = [...players];
    const player = updatedPlayers[currentPlayerIdx];
    const item = draftState.pendingStratagem;

    // Add to inventory
    player.inventory.push(item.id);
    
    // Replace the selected slot
    player.loadout.stratagems[slotIndex] = item.id;
    
    dispatch(actions.setPlayers(updatedPlayers));

    // Next player, extra draft, or finish
    proceedToNextDraft(updatedPlayers);
  };

  const rerollDraft = (cost) => {
    if (requisition < cost) return;
    dispatch(actions.spendRequisition(cost));
    dispatch(actions.updateDraftState({
      roundCards: generateDraftHandForPlayer(draftState.activePlayerIndex)
    }));
  };

  const removeCardFromDraft = (cardToRemove) => {
    // Remove single card and replace it with a new one
    const player = players[draftState.activePlayerIndex];
    const pool = getWeightedPool(player, currentDiff, gameConfig, burnedCards, players);
    
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
    // Check if this is an armor combo (has 'items' array and 'passive' property)
    const isArmorCombo = item && item.items && item.passive && item.armorClass;
    
    // For armor combos, use the first item as representative for display
    const displayItem = isArmorCombo ? item.items[0] : item;
    
    // For armor combos, create a slash-delimited name
    const displayName = isArmorCombo 
      ? item.items.map(armor => armor.name).join(' / ')
      : item.name;
    
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
          height: '256px'
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
          
          <h3 style={{ 
            color: factionColors.PRIMARY, 
            fontWeight: 'bold', 
            fontSize: isArmorCombo ? '14px' : '18px', 
            lineHeight: '1.2', 
            marginBottom: '8px' 
          }}>
            {displayName}
          </h3>
          
          <div style={{ flexGrow: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
              {displayItem.tags.map(tag => (
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Difficulty Cleared</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: factionColors.PRIMARY }}>D10</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Super Helldive</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Requisition</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>{requisition}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Lives Remaining</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{lives}</div>
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
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: factionColors.PRIMARY }}>{requisition}</div>
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

  if (phase === 'MENU') {
    return (
      <div style={{ minHeight: '100vh', padding: '80px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '72px', fontWeight: '900', color: factionColors.PRIMARY, margin: '0 0 0 0', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            HELLDRAFTERS
          </h1>
          <div style={{ background: 'linear-gradient(to right, #5a5142, #6b6052)', padding: '12px', marginBottom: '60px', maxWidth: '620px', margin: '0 auto 60px auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>
              Roguelite Director
            </h2>
          </div>
          
          <div style={{ backgroundColor: '#283548', padding: '40px', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            
            
            {/* Faction */}
            <div style={{ marginBottom: '40px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px' }}>
                Select Theater of War
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {Object.values(FACTION).map(f => {
                  const isSelected = gameConfig.faction === f;
                  const btnColors = getFactionColors(f);
                  return (
                    <button 
                      key={f}
                      onClick={() => dispatch(actions.updateGameConfig({ faction: f }))}
                      style={{
                        padding: '16px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s',
                        fontSize: '14px',
                        letterSpacing: '1px',
                        backgroundColor: isSelected ? `${btnColors.PRIMARY}15` : 'transparent',
                        color: isSelected ? btnColors.PRIMARY : '#64748b',
                        border: isSelected ? `2px solid ${btnColors.PRIMARY}` : '1px solid rgba(100, 116, 139, 0.5)',
                        cursor: 'pointer'
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Squad Size */}
            <div style={{ marginBottom: '40px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px' }}>
                Squad Size
              </label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                {[1, 2, 3, 4].map(n => (
                  <button 
                    key={n}
                    onClick={() => dispatch(actions.updateGameConfig({ playerCount: n }))}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '4px',
                      fontWeight: '900',
                      fontSize: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      backgroundColor: gameConfig.playerCount === n ? factionColors.PRIMARY : 'transparent',
                      color: gameConfig.playerCount === n ? 'black' : '#64748b',
                      border: gameConfig.playerCount === n ? `2px solid ${factionColors.PRIMARY}` : '1px solid rgba(100, 116, 139, 0.5)',
                      cursor: 'pointer'
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Mode Options */}
            <div style={{ marginBottom: '40px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
                Game Mode Options
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.globalUniqueness ? `${factionColors.PRIMARY}1A` : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
                  <input 
                    type="checkbox" 
                    checked={gameConfig.globalUniqueness}
                    onChange={(e) => dispatch(actions.updateGameConfig({ globalUniqueness: e.target.checked }))}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Global Card Uniqueness</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Cards drafted by one player cannot appear for other players</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.burnCards ? `${factionColors.PRIMARY}1A` : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
                  <input 
                    type="checkbox" 
                    checked={gameConfig.burnCards}
                    onChange={(e) => dispatch(actions.updateGameConfig({ burnCards: e.target.checked }))}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Burn Cards After Viewing</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Once a card appears in a draft, it cannot appear again this run</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.customStart ? `${factionColors.PRIMARY}1A` : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
                  <input 
                    type="checkbox" 
                    checked={gameConfig.customStart}
                    onChange={(e) => dispatch(actions.updateGameConfig({ customStart: e.target.checked }))}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Custom Start Mode</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Choose starting difficulty and loadouts for each player</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: eventsEnabled ? `${factionColors.PRIMARY}1A` : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
                  <input 
                    type="checkbox" 
                    checked={eventsEnabled}
                    onChange={(e) => dispatch(actions.setEventsEnabled(e.target.checked))}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Enable Events</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Random high-risk, high-reward events between missions</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.endlessMode ? `${factionColors.PRIMARY}1A` : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
                  <input 
                    type="checkbox" 
                    checked={gameConfig.endlessMode}
                    onChange={(e) => dispatch(actions.updateGameConfig({ endlessMode: e.target.checked }))}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Endless Mode</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Continue running D10 missions indefinitely. Otherwise, win after completing D10</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.debugEventsMode ? `${factionColors.PRIMARY}1A` : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
                  <input 
                    type="checkbox" 
                    checked={gameConfig.debugEventsMode}
                    onChange={(e) => dispatch(actions.updateGameConfig({ debugEventsMode: e.target.checked }))}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Debug Events Mode</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Manually trigger events from dashboard for testing</div>
                  </div>
                </label>
              </div>
            </div>

            <button 
              onClick={startGame}
              style={{
                ...BUTTON_STYLES.PRIMARY,
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                letterSpacing: '0.2em',
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
              Initialize Operation
            </button>

            {/* Save/Load Section */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(100, 116, 139, 0.3)' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px', textAlign: 'center' }}>
                Save / Load Game
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={exportGameState}
                  style={{
                    padding: '12px',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(100, 116, 139, 0.5)',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = factionColors.PRIMARY;
                    e.currentTarget.style.color = factionColors.PRIMARY;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  Export Game
                </button>
                <label
                  style={{
                    padding: '12px',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(100, 116, 139, 0.5)',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = factionColors.PRIMARY;
                    e.currentTarget.style.color = factionColors.PRIMARY;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  Import Game
                  <input
                    type="file"
                    accept=".json"
                    onChange={importGameState}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', textAlign: 'center', margin: '8px 0 0 0' }}>
                Export saves your current game to a file. Import loads a saved game.
              </p>
            </div>
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
        lives,
        currentDiff,
        gameConfig,
        burnedCards
      }, selections);

      // Check if we need booster selection
      if (updates.needsBoosterSelection && updates.boosterDraft) {
        dispatch(actions.setEventBoosterDraft(updates.boosterDraft));
        // Store the outcome for later application
        window.__boosterOutcome = updates.boosterOutcome;
        return; // Don't close event yet, wait for booster selection
      }

      // Apply state updates
      if (updates.requisition !== undefined) dispatch(actions.setRequisition(updates.requisition));
      if (updates.lives !== undefined) dispatch(actions.setLives(updates.lives));
      if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players));
      if (updates.currentDiff !== undefined) dispatch(actions.setDifficulty(updates.currentDiff));
      if (updates.faction !== undefined) dispatch(actions.updateGameConfig({ faction: updates.faction }));
      if (updates.bonusRequisition !== undefined) dispatch(actions.addRequisition(updates.bonusRequisition));
      
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
        const redraftHand = generateDraftHand(
          updates.players[updates.redraftPlayerIndex],
          currentDiff,
          gameConfig,
          burnedCards,
          updates.players,
          (cardId) => dispatch(actions.addBurnedCard(cardId)),
          getDraftHandSize(gameConfig.starRating)
        );
        
        dispatch(actions.setDraftState({
          activePlayerIndex: updates.redraftPlayerIndex,
          roundCards: redraftHand,
          isRerolling: false,
          pendingStratagem: null,
          extraDraftRound: 0,
          isRedrafting: true  // Flag to indicate this is a redraft
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
          lives,
          currentDiff,
          gameConfig,
          burnedCards
        });

        // Apply state updates
        if (updates.requisition !== undefined) dispatch(actions.setRequisition(updates.requisition));
        if (updates.lives !== undefined) dispatch(actions.setLives(updates.lives));
        if (updates.players !== undefined) dispatch(actions.setPlayers(updates.players));
        if (updates.currentDiff !== undefined) dispatch(actions.setDifficulty(updates.currentDiff));
        if (updates.faction !== undefined) dispatch(actions.updateGameConfig({ faction: updates.faction }));
        if (updates.bonusRequisition !== undefined) dispatch(actions.addRequisition(updates.bonusRequisition));
        
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
      <EventDisplay
        currentEvent={currentEvent}
        eventPlayerChoice={eventPlayerChoice}
        eventStratagemSelection={eventStratagemSelection}
        eventTargetPlayerSelection={eventTargetPlayerSelection}
        eventTargetStratagemSelection={eventTargetStratagemSelection}
        eventBoosterDraft={eventBoosterDraft}
        eventBoosterSelection={eventBoosterSelection}
        players={players}
        currentDiff={currentDiff}
        requisition={requisition}
        lives={lives}
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
        onConfirmSelections={handleEventChoice}
      />
    );
  }

  if (phase === 'DRAFT') {
    const player = players[draftState.activePlayerIndex];
    
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
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel this run? All progress will be lost.')) {
                dispatch(actions.setPhase('MENU'));
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(127, 29, 29, 0.3)',
              color: '#ef4444',
              border: '1px solid #7f1d1d',
              borderRadius: '4px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)'}
          >
            <XCircle size={16} />
            Cancel Run
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
              Choose wisely. This equipment is vital for Difficulty {currentDiff + 1}.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${Math.min(draftState.roundCards.length, 4)}, 1fr)`, 
            gap: '24px', 
            marginBottom: '48px' 
          }}>
            {draftState.roundCards.map((item, idx) => (
              <ItemCard key={`${item.id}-${idx}`} item={item} onSelect={handleDraftPick} onRemove={removeCardFromDraft} />
            ))}
          </div>

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
          
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <span style={{ color: factionColors.PRIMARY, fontFamily: 'monospace' }}>Current Requisition: {requisition} R</span>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD PHASE
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* HEADER */}
      <GameHeader 
        currentDiff={currentDiff}
        requisition={requisition}
        lives={lives}
        faction={gameConfig.faction}
        samples={state.samples}
        onExport={exportGameState}
        onCancelRun={() => dispatch(actions.setPhase('MENU'))}
      />

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        
        {/* PLAYER ROSTER */}
        <div style={{ display: 'grid', gridTemplateColumns: gameConfig.playerCount > 1 ? 'repeat(auto-fit, minmax(400px, 1fr))' : '1fr', gap: '32px', marginBottom: '48px' }}>
          {players.map(player => (
            <LoadoutDisplay key={player.id} player={player} getItemById={getItemById} getArmorComboDisplayName={getArmorComboDisplayName} faction={gameConfig.faction} />
          ))}
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '100%', maxWidth: '800px', backgroundColor: '#283548', padding: '24px', borderRadius: '12px', border: '1px solid rgba(100, 116, 139, 0.5)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', marginBottom: '24px' }}>Mission Status Report</h2>
            
            {/* Star Rating Selection */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
                Mission Performance Rating
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '12px' }}>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button 
                    key={n}
                    onClick={() => dispatch(actions.updateGameConfig({ starRating: n }))}
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
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (gameConfig.starRating !== n) {
                        e.currentTarget.style.borderColor = '#64748b';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (gameConfig.starRating !== n) {
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
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
                Samples Collected This Mission
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
                      fontFamily: 'monospace'
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
                      fontFamily: 'monospace'
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
                      fontFamily: 'monospace'
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
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                   const newLives = lives - 1;
                   dispatch(actions.setLives(newLives));
                   if (newLives === 0) {
                     setTimeout(() => dispatch(actions.setPhase('GAMEOVER')), 100);
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
                  
                  dispatch(actions.addRequisition(1));
                  
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
                  startDraftPhase();
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
    </div>
  );
}