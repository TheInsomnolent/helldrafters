import React, { useState } from 'react';
import { EVENT_TYPES, OUTCOME_TYPES } from '../systems/events/events';
import { MASTER_DB } from '../data/itemsByWarbond';
import { getSubfactionsForFaction, SUBFACTION_CONFIG } from '../constants/balancingConfig';
import { getFactionColors } from '../constants/theme';
import RarityBadge from './RarityBadge';

/**
 * EventDisplay component for showing and handling event interactions
 */
export default function EventDisplay({
  currentEvent,
  eventPlayerChoice,
  players,
  currentDiff,
  requisition,
  isHost = true,
  needsPlayerChoice,
  canAffordChoice,
  formatOutcome,
  formatOutcomes,
  onPlayerChoice,
  onEventChoice,
  onAutoContinue,
  eventStratagemSelection,
  eventTargetPlayerSelection,
  eventTargetStratagemSelection,
  eventBoosterDraft,
  eventBoosterSelection,
  eventSpecialDraft,
  eventSpecialDraftType,
  pendingFaction,
  pendingSubfactionSelection,
  onStratagemSelection,
  onTargetPlayerSelection,
  onTargetStratagemSelection,
  onBoosterSelection,
  onSubfactionSelection,
  onConfirmSubfaction,
  onSpecialDraftSelection,
  onConfirmSelections
}) {
  // Helper to get item name by ID
  const getItemName = (itemId) => {
    const item = MASTER_DB.find(i => i.id === itemId);
    return item ? item.name : 'Unknown';
  };

  // Check if current event choice needs stratagem/player selection
  const needsSelectionDialogue = (choice) => {
    if (!choice || !choice.outcomes) return false;
    return choice.outcomes.some(outcome => 
      outcome.type === OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER ||
      outcome.type === OUTCOME_TYPES.SWAP_STRATAGEM_WITH_PLAYER
    );
  };

  // Check if this is a swap (needs target stratagem selection)
  const isSwapChoice = (choice) => {
    if (!choice || !choice.outcomes) return false;
    return choice.outcomes.some(outcome => 
      outcome.type === OUTCOME_TYPES.SWAP_STRATAGEM_WITH_PLAYER
    );
  };

  // Check if this is a duplicate
  const isDuplicateChoice = (choice) => {
    if (!choice || !choice.outcomes) return false;
    return choice.outcomes.some(outcome => 
      outcome.type === OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER
    );
  };

  // Track which choice was selected and needs selections
  const [selectedChoice, setSelectedChoice] = useState(null);
  
  // Track player selections for special draft
  const [playerSelections, setPlayerSelections] = useState({});

  const handleChoiceClick = (choice) => {
    if (needsSelectionDialogue(choice)) {
      setSelectedChoice(choice);
    } else {
      onEventChoice(choice);
    }
  };

  const handleConfirmSelections = () => {
    if (selectedChoice) {
      onConfirmSelections(selectedChoice);
      setSelectedChoice(null);
    }
  };

  const handleCancelSelections = () => {
    setSelectedChoice(null);
    onStratagemSelection(null);
    onTargetPlayerSelection(null);
    onTargetStratagemSelection(null);
    onBoosterSelection(null);
  };

  // Get available stratagems from the active player
  const getAvailableStratagems = () => {
    if (eventPlayerChoice === null) return [];
    const player = players[eventPlayerChoice];
    return player.loadout.stratagems
      .map((stratagemId, slotIndex) => ({
        stratagemId,
        stratagemSlotIndex: slotIndex,
        name: getItemName(stratagemId)
      }))
      .filter(s => s.stratagemId !== null);
  };

  // Check if target player already has this stratagem
  const targetPlayerHasStratagem = (targetPlayerIndex, stratagemId) => {
    if (targetPlayerIndex === null || targetPlayerIndex === undefined) return false;
    const player = players[targetPlayerIndex];
    return player.loadout.stratagems.includes(stratagemId);
  };

  // Check if target player has free slots
  const targetPlayerHasFreeSlot = (targetPlayerIndex) => {
    if (targetPlayerIndex === null || targetPlayerIndex === undefined) return false;
    const player = players[targetPlayerIndex];
    return player.loadout.stratagems.some(s => s === null);
  };

  // Get available stratagems from the target player
  const getTargetPlayerStratagems = () => {
    if (eventTargetPlayerSelection === null || eventTargetPlayerSelection === undefined) return [];
    const player = players[eventTargetPlayerSelection];
    
    // For swap: filter out stratagems that would cause duplicates on source player
    if (isSwapChoice(selectedChoice) && eventStratagemSelection) {
      const sourcePlayer = players[eventPlayerChoice];
      return player.loadout.stratagems
        .map((stratagemId, slotIndex) => ({
          stratagemId,
          stratagemSlotIndex: slotIndex,
          name: getItemName(stratagemId)
        }))
        .filter(s => {
          if (s.stratagemId === null) return false;
          // Check if swapping would create a duplicate on source player
          // (i.e., source player already has this stratagem in another slot)
          const wouldCreateDuplicate = sourcePlayer.loadout.stratagems.some(
            (id, idx) => id === s.stratagemId && idx !== eventStratagemSelection.stratagemSlotIndex
          );
          return !wouldCreateDuplicate;
        });
    }
    
    // For duplicate with overwrite: show all stratagems
    return player.loadout.stratagems
      .map((stratagemId, slotIndex) => ({
        stratagemId,
        stratagemSlotIndex: slotIndex,
        name: getItemName(stratagemId)
      }))
      .filter(s => s.stratagemId !== null);
  };

  // Get other players for target selection (filtered for duplicates if duplicate choice)
  const getOtherPlayers = () => {
    if (eventPlayerChoice === null) return [];
    
    const allOtherPlayers = players
      .map((player, idx) => ({ player, idx }))
      .filter((_, idx) => idx !== eventPlayerChoice);
    
    // For duplicate: filter out players who already have the selected stratagem (unless they're full)
    if (isDuplicateChoice(selectedChoice) && eventStratagemSelection) {
      return allOtherPlayers.filter(({ player, idx }) => {
        const alreadyHas = targetPlayerHasStratagem(idx, eventStratagemSelection.stratagemId);
        const hasFreeSlot = targetPlayerHasFreeSlot(idx);
        // Allow if they don't have it, OR if they have it but are full (need overwrite)
        return !alreadyHas || !hasFreeSlot;
      });
    }
    
    // For swap: filter out players who would create duplicates after swap
    if (isSwapChoice(selectedChoice) && eventStratagemSelection) {
      const sourceStratagem = eventStratagemSelection.stratagemId;
      return allOtherPlayers.filter(({ player, idx }) => {
        // Target player shouldn't already have the source stratagem
        return !targetPlayerHasStratagem(idx, sourceStratagem);
      });
    }
    
    return allOtherPlayers;
  };

  const availableStratagems = getAvailableStratagems();
  const targetPlayerStratagems = getTargetPlayerStratagems();
  const otherPlayers = getOtherPlayers();
  
  // Check if we need to show target stratagem selection for duplicate (when target is full)
  const needsOverwriteForDuplicate = isDuplicateChoice(selectedChoice) && 
    eventTargetPlayerSelection !== null && 
    !targetPlayerHasFreeSlot(eventTargetPlayerSelection);
  
  // For swap, need both stratagems selected
  // For duplicate with free slot, just need stratagem and player
  // For duplicate with full slots, need stratagem, player, and target stratagem to overwrite
  const canConfirm = eventStratagemSelection !== null && eventTargetPlayerSelection !== null &&
    (!isSwapChoice(selectedChoice) || eventTargetStratagemSelection !== null) &&
    (!needsOverwriteForDuplicate || eventTargetStratagemSelection !== null);
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a2332', color: '#e0e0e0', padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: '#0f1419', 
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #F5C642',
        zIndex: 100
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F5C642' }}>
          EVENT - DIFFICULTY {currentDiff}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="https://helldivers.wiki.gg/images/Requisition_Slip.svg" 
              alt="Requisition"
              style={{ width: '20px', height: '20px' }}
            />
            <span style={{ fontWeight: 'bold' }}>{Math.floor(requisition)}</span>
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '100px auto 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Event Card */}
        <div style={{
          backgroundColor: '#283548',
          border: '2px solid #F5C642',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '32px', 
            color: '#F5C642', 
            marginBottom: '16px',
            fontWeight: 'bold'
          }}>
            {currentEvent.name}
          </h2>
          <p style={{ 
            fontSize: '18px', 
            lineHeight: '1.6',
            marginBottom: '32px',
            color: '#b0b0b0'
          }}>
            {currentEvent.description}
          </p>

          {/* Player Selection (if needed) - Shows choices below for context */}
          {needsPlayerChoice(currentEvent) && eventPlayerChoice === null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '16px', marginBottom: '12px', color: '#F5C642' }}>
                {isHost ? 'Choose a Helldiver:' : 'Waiting for host to choose a Helldiver...'}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {players.map((player, idx) => (
                  <button
                    key={idx}
                    onClick={() => isHost && onPlayerChoice(idx)}
                    disabled={!isHost}
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: '#1a2332',
                      color: '#F5C642',
                      border: '2px solid #F5C642',
                      borderRadius: '4px',
                      cursor: isHost ? 'pointer' : 'not-allowed',
                      opacity: isHost ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => isHost && (e.currentTarget.style.backgroundColor = '#283548')}
                    onMouseLeave={(e) => isHost && (e.currentTarget.style.backgroundColor = '#1a2332')}
                  >
                    HELLDIVER {idx + 1}
                  </button>
                ))}
              </div>
              
              {/* Show preview of choices below player selection */}
              {currentEvent.type === EVENT_TYPES.CHOICE && currentEvent.choices && currentEvent.choices.length > 0 && (
                <div style={{ marginTop: '24px', opacity: 0.5 }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px', textAlign: 'center' }}>
                    Available choices (select a Helldiver first):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentEvent.choices.map((choice, idx) => {
                      const outcomeText = formatOutcomes(choice.outcomes);
                      const reqCost = choice.requiresRequisition;
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: '#283548',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#b0b0b0' }}>
                            <span>{choice.text}</span>
                            {reqCost && (
                              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                Costs {reqCost} requisition
                              </span>
                            )}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            opacity: 0.7,
                            fontStyle: 'italic',
                            marginTop: '4px',
                            color: '#94a3b8'
                          }}>
                            {outcomeText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stratagem/Player Selection Dialogue */}
          {selectedChoice && (!needsPlayerChoice(currentEvent) || eventPlayerChoice !== null) && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                backgroundColor: '#1f2937', 
                border: '2px solid #F5C642',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '16px'
              }}>
                {selectedChoice.outcomes.some(o => o.type === OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER) && (
                  <div style={{ fontSize: '18px', marginBottom: '16px', color: '#F5C642', textAlign: 'center' }}>
                    Select a stratagem to duplicate and a player to receive it:
                  </div>
                )}
                {selectedChoice.outcomes.some(o => o.type === OUTCOME_TYPES.SWAP_STRATAGEM_WITH_PLAYER) && (
                  <div style={{ fontSize: '18px', marginBottom: '16px', color: '#F5C642', textAlign: 'center' }}>
                    Select a stratagem to swap and a player to swap with:
                  </div>
                )}

                {/* Stratagem Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', marginBottom: '8px', color: '#b0b0b0' }}>
                    Your Stratagems:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    {availableStratagems.map((strat, idx) => (
                      <button
                        key={idx}
                        onClick={() => onStratagemSelection({
                          stratagemId: strat.stratagemId,
                          stratagemSlotIndex: strat.stratagemSlotIndex
                        })}
                        style={{
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: eventStratagemSelection?.stratagemId === strat.stratagemId ? '#F5C642' : '#283548',
                          color: eventStratagemSelection?.stratagemId === strat.stratagemId ? '#0f1419' : '#e0e0e0',
                          border: '2px solid ' + (eventStratagemSelection?.stratagemId === strat.stratagemId ? '#F5C642' : '#555'),
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: eventStratagemSelection?.stratagemId === strat.stratagemId ? 'bold' : 'normal',
                          transition: 'all 0.2s',
                          textAlign: 'left'
                        }}
                      >
                        {strat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Player Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', marginBottom: '8px', color: '#b0b0b0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>Target Helldiver:</span>
                    {eventTargetPlayerSelection !== null && (
                      <button
                        onClick={() => {
                          onTargetPlayerSelection(null);
                          onTargetStratagemSelection(null);
                        }}
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: '#6b7280',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                      >
                        ← Change Target
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {otherPlayers.map(({ player, idx }) => (
                      <button
                        key={idx}
                        onClick={() => onTargetPlayerSelection(idx)}
                        style={{
                          padding: '12px 24px',
                          fontSize: '14px',
                          fontWeight: eventTargetPlayerSelection === idx ? 'bold' : 'normal',
                          backgroundColor: eventTargetPlayerSelection === idx ? '#F5C642' : '#283548',
                          color: eventTargetPlayerSelection === idx ? '#0f1419' : '#e0e0e0',
                          border: '2px solid ' + (eventTargetPlayerSelection === idx ? '#F5C642' : '#555'),
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        HELLDIVER {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Player Stratagem Selection (for swap OR duplicate with overwrite) */}
                {((isSwapChoice(selectedChoice) && eventTargetPlayerSelection !== null && targetPlayerStratagems.length > 0) ||
                  (isDuplicateChoice(selectedChoice) && needsOverwriteForDuplicate && targetPlayerStratagems.length > 0)) && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px', color: '#b0b0b0' }}>
                      {isSwapChoice(selectedChoice) 
                        ? "Target Helldiver's Stratagems (select one to swap):" 
                        : "Target Helldiver's Stratagems (select one to overwrite):"}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                      {targetPlayerStratagems.map((strat, idx) => (
                        <button
                          key={idx}
                          onClick={() => onTargetStratagemSelection({
                            stratagemId: strat.stratagemId,
                            stratagemSlotIndex: strat.stratagemSlotIndex
                          })}
                          style={{
                            padding: '12px',
                            fontSize: '14px',
                            backgroundColor: eventTargetStratagemSelection?.stratagemId === strat.stratagemId ? '#4ade80' : '#283548',
                            color: eventTargetStratagemSelection?.stratagemId === strat.stratagemId ? '#0f1419' : '#e0e0e0',
                            border: '2px solid ' + (eventTargetStratagemSelection?.stratagemId === strat.stratagemId ? '#4ade80' : '#555'),
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: eventTargetStratagemSelection?.stratagemId === strat.stratagemId ? 'bold' : 'normal',
                            transition: 'all 0.2s',
                            textAlign: 'left'
                          }}
                        >
                          {strat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm/Cancel Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={handleConfirmSelections}
                    disabled={!canConfirm}
                    style={{
                      padding: '12px 32px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: canConfirm ? '#4ade80' : '#555',
                      color: canConfirm ? '#0f1419' : '#888',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: canConfirm ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => canConfirm && (e.target.style.backgroundColor = '#22c55e')}
                    onMouseLeave={(e) => canConfirm && (e.target.style.backgroundColor = '#4ade80')}
                  >
                    CONFIRM
                  </button>
                  <button
                    onClick={handleCancelSelections}
                    style={{
                      padding: '12px 32px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Booster Selection (when booster draft is available) */}
          {eventBoosterDraft && eventBoosterDraft.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                backgroundColor: '#1f2937', 
                border: '2px solid #F5C642',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '16px', color: '#F5C642', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <span>Select a Booster:</span>
                  {needsPlayerChoice(currentEvent) && eventPlayerChoice !== null && (
                    <button
                      onClick={() => {
                        onPlayerChoice(null);
                        onBoosterSelection(null);
                      }}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: '#6b7280',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                    >
                      ← Change Helldiver
                    </button>
                  )}
                </div>

                {/* Booster Selection Grid */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                    {eventBoosterDraft.map((boosterId, idx) => {
                      const boosterName = getItemName(boosterId);
                      return (
                        <button
                          key={idx}
                          onClick={() => onBoosterSelection(boosterId)}
                          style={{
                            padding: '16px',
                            fontSize: '15px',
                            backgroundColor: eventBoosterSelection === boosterId ? '#F5C642' : '#283548',
                            color: eventBoosterSelection === boosterId ? '#0f1419' : '#e0e0e0',
                            border: '2px solid ' + (eventBoosterSelection === boosterId ? '#F5C642' : '#555'),
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: eventBoosterSelection === boosterId ? 'bold' : 'normal',
                            transition: 'all 0.2s',
                            textAlign: 'center'
                          }}
                          onMouseEnter={(e) => {
                            if (eventBoosterSelection !== boosterId) {
                              e.target.style.backgroundColor = '#374151';
                              e.target.style.borderColor = '#F5C642';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (eventBoosterSelection !== boosterId) {
                              e.target.style.backgroundColor = '#283548';
                              e.target.style.borderColor = '#555';
                            }
                          }}
                        >
                          {boosterName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm/Cancel Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={onAutoContinue}
                    disabled={!eventBoosterSelection}
                    style={{
                      padding: '12px 32px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: eventBoosterSelection ? '#4ade80' : '#555',
                      color: eventBoosterSelection ? '#0f1419' : '#888',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: eventBoosterSelection ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => eventBoosterSelection && (e.target.style.backgroundColor = '#22c55e')}
                    onMouseLeave={(e) => eventBoosterSelection && (e.target.style.backgroundColor = '#4ade80')}
                  >
                    CONFIRM
                  </button>
                  <button
                    onClick={onAutoContinue}
                    style={{
                      padding: '12px 32px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: '#6b7280',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                  >
                    SKIP
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subfaction Selection */}
          {pendingFaction && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                backgroundColor: '#1f2937', 
                border: `2px solid ${getFactionColors(pendingFaction).PRIMARY}`,
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '16px', color: getFactionColors(pendingFaction).PRIMARY, textAlign: 'center' }}>
                  Select Enemy Variant for {pendingFaction}
                </div>

                {/* Subfaction Selection Grid */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    {getSubfactionsForFaction(pendingFaction).map((subfaction) => {
                      const config = SUBFACTION_CONFIG[subfaction];
                      const isSelected = pendingSubfactionSelection === subfaction;
                      const factionColor = getFactionColors(pendingFaction).PRIMARY;
                      
                      return (
                        <button
                          key={subfaction}
                          onClick={() => onSubfactionSelection(subfaction)}
                          style={{
                            padding: '16px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            transition: 'all 0.2s',
                            fontSize: '13px',
                            letterSpacing: '0.5px',
                            backgroundColor: isSelected ? `${factionColor}15` : 'transparent',
                            color: isSelected ? factionColor : '#64748b',
                            border: isSelected ? `2px solid ${factionColor}` : '1px solid rgba(100, 116, 139, 0.5)',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
                              e.currentTarget.style.color = '#94a3b8';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#64748b';
                            }
                          }}
                        >
                          <div style={{ fontSize: '14px', marginBottom: '4px' }}>{config.name}</div>
                          <div style={{ fontSize: '11px', color: isSelected ? factionColor : '#64748b', opacity: 0.8 }}>
                            {config.description} • Req: {config.reqMultiplier}x • Rares: {config.rareWeightMultiplier}x
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm Button */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={onConfirmSubfaction}
                    disabled={!pendingSubfactionSelection}
                    style={{
                      padding: '12px 32px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: pendingSubfactionSelection ? '#4ade80' : '#555',
                      color: pendingSubfactionSelection ? '#0f1419' : '#888',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: pendingSubfactionSelection ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => pendingSubfactionSelection && (e.target.style.backgroundColor = '#22c55e')}
                    onMouseLeave={(e) => pendingSubfactionSelection && (e.target.style.backgroundColor = '#4ade80')}
                  >
                    CONFIRM
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Special Draft Selection (throwable or secondary for all players) */}
          {eventSpecialDraft && eventSpecialDraft.length > 0 && eventSpecialDraftType && (
            <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                  backgroundColor: '#1f2937', 
                  border: '2px solid #F5C642',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '18px', marginBottom: '24px', color: '#F5C642', textAlign: 'center' }}>
                    All Helldivers Select: {eventSpecialDraftType === 'throwable' ? 'Throwable' : 'Secondary Weapon'}
                  </div>

                  {/* Selection for each player */}
                  {players.map((player, playerIndex) => (
                    <div key={playerIndex} style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#283548', borderRadius: '8px' }}>
                      <div style={{ fontSize: '16px', marginBottom: '12px', color: '#F5C642', fontWeight: 'bold' }}>
                        Helldiver {playerIndex + 1}
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                        {eventSpecialDraft.map((item) => {
                          const isSelected = playerSelections[playerIndex] === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setPlayerSelections(prev => ({ ...prev, [playerIndex]: item.id }));
                                onSpecialDraftSelection(playerIndex, item.id);
                              }}
                              style={{
                                padding: '12px',
                                fontSize: '14px',
                                backgroundColor: isSelected ? '#F5C642' : '#1f2937',
                                color: isSelected ? '#0f1419' : '#e0e0e0',
                                border: '2px solid ' + (isSelected ? '#F5C642' : '#555'),
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: isSelected ? 'bold' : 'normal',
                                transition: 'all 0.2s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.target.style.backgroundColor = '#374151';
                                  e.target.style.borderColor = '#F5C642';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.target.style.backgroundColor = '#1f2937';
                                  e.target.style.borderColor = '#555';
                                }
                              }}
                            >
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Confirm Button */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                    <button
                      onClick={onAutoContinue}
                      disabled={Object.keys(playerSelections).length < players.length}
                      style={{
                        padding: '12px 32px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: Object.keys(playerSelections).length < players.length ? '#555' : '#4ade80',
                        color: Object.keys(playerSelections).length < players.length ? '#888' : '#0f1419',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: Object.keys(playerSelections).length < players.length ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (Object.keys(playerSelections).length >= players.length) {
                          e.target.style.backgroundColor = '#22c55e';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (Object.keys(playerSelections).length >= players.length) {
                          e.target.style.backgroundColor = '#4ade80';
                        }
                      }}
                    >
                      CONFIRM ALL SELECTIONS
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* Choices */}
          {currentEvent.type === EVENT_TYPES.CHOICE && (!needsPlayerChoice(currentEvent) || eventPlayerChoice !== null) && !selectedChoice && (
            <>
              {needsPlayerChoice(currentEvent) && eventPlayerChoice !== null && (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  {isHost ? (
                    <button
                      onClick={() => onPlayerChoice(null)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        backgroundColor: '#6b7280',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                    >
                      ← Change Selected Helldiver
                    </button>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                      Host selected Helldiver {eventPlayerChoice + 1}
                    </div>
                  )}
                </div>
              )}
              
              {/* Client waiting message */}
              {!isHost && (
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '16px',
                  padding: '12px 24px',
                  backgroundColor: 'rgba(100, 116, 139, 0.2)',
                  border: '1px solid rgba(100, 116, 139, 0.4)',
                  borderRadius: '4px'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                    Waiting for host to make a choice...
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: isHost ? 1 : 0.6 }}>
                {currentEvent.choices.map((choice, idx) => {
                const affordable = canAffordChoice(choice, requisition, players, eventPlayerChoice);
                const canSelect = isHost && affordable;
                const outcomeText = formatOutcomes(choice.outcomes);
                const reqCost = choice.requiresRequisition;
                return (
                  <button
                    key={idx}
                    onClick={() => canSelect && handleChoiceClick(choice)}
                    disabled={!canSelect}
                    style={{
                      padding: '16px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: affordable ? '#F5C642' : '#555',
                      color: affordable ? '#0f1419' : '#888',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: canSelect ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => canSelect && (e.target.style.backgroundColor = '#ffd95a')}
                    onMouseLeave={(e) => canSelect && (e.target.style.backgroundColor = '#F5C642')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px' }}>
                      <span>{choice.text}</span>
                      {reqCost && (
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: 'bold',
                          opacity: affordable ? 1 : 0.6
                        }}>
                          Costs {reqCost} requisition
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: 'normal',
                      opacity: 0.85,
                      fontStyle: 'italic'
                    }}>
                      {outcomeText}
                    </div>
                  </button>
                );
              })}
            </div>
            </>
          )}

          {/* Random/Beneficial/Detrimental events auto-proceed */}
          {currentEvent.type !== EVENT_TYPES.CHOICE && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              {currentEvent.outcomes && currentEvent.outcomes.length > 0 && (
                <div style={{
                  backgroundColor: '#1f2937',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 198, 66, 0.3)'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                    {currentEvent.type === EVENT_TYPES.RANDOM ? 'Possible Outcomes:' : 'Outcome:'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#F5C642' }}>
                    {currentEvent.type === EVENT_TYPES.RANDOM 
                      ? currentEvent.outcomes.map((o, i) => (
                          <div key={i}>
                            {formatOutcome(o)} {o.weight ? `(${o.weight}% chance)` : ''}
                          </div>
                        ))
                      : formatOutcomes(currentEvent.outcomes)
                    }
                  </div>
                </div>
              )}
              {isHost ? (
                <button
                  onClick={onAutoContinue}
                  style={{
                    padding: '16px 32px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    backgroundColor: '#F5C642',
                    color: '#0f1419',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#ffd95a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#F5C642'}
                >
                  Continue
                </button>
              ) : (
                <div style={{ 
                  padding: '12px 24px',
                  backgroundColor: 'rgba(100, 116, 139, 0.2)',
                  border: '1px solid rgba(100, 116, 139, 0.4)',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  fontSize: '14px'
                }}>
                  Waiting for host to continue...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
