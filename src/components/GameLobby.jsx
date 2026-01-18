import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, LogOut, Users, Crown, Settings, X } from 'lucide-react';
import { WARBONDS, WARBOND_TYPE, DEFAULT_WARBONDS, getWarbondById } from '../constants/warbonds';
import { COLORS, SHADOWS, GRADIENTS, BUTTON_STYLES, getFactionColors } from '../constants/theme';
import { useMultiplayer } from '../systems/multiplayer';
import { MASTER_DB, SUPERSTORE_ITEMS } from '../data/itemsByWarbond';
import { TYPE } from '../constants/types';

// Local storage key for saving player configuration
const STORAGE_KEY = 'helldrafters_player_config';

/**
 * Load saved player configuration from local storage
 */
const loadSavedConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load saved config:', e);
  }
  return null;
};

/**
 * Save player configuration to local storage
 */
const saveConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save config:', e);
  }
};

/**
 * GameLobby component for configuring players before starting a run
 */
export default function GameLobby({
  gameConfig,
  onStartRun,
  onCancel
}) {
  const factionColors = getFactionColors(gameConfig.faction);
  const { 
    isMultiplayer, 
    isHost, 
    lobbyData, 
    playerSlot, 
    playerName: mpPlayerName,
    disconnect,
    updatePlayerConfig,
    setPlayerReady
  } = useMultiplayer();

  // Load saved config or use defaults
  const savedConfig = loadSavedConfig();
  
  // For solo mode, initialize with 1 player
  // For multiplayer, each player only configures their own slot
  const [myConfig, setMyConfig] = useState({
    name: mpPlayerName || savedConfig?.name || 'Helldiver',
    warbonds: savedConfig?.warbonds || [...DEFAULT_WARBONDS],
    includeSuperstore: savedConfig?.includeSuperstore || false,
    excludedItems: savedConfig?.excludedItems || []
  });
  
  const [isReady, setIsReady] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [itemSelectionModal, setItemSelectionModal] = useState(null); // null or { warbondId: string } or { superstore: true }
  
  // Track if we've done initial name sync to avoid loops
  const initialNameSyncDone = React.useRef(false);
  
  // Check if all players are ready (in multiplayer)
  const allPlayersReady = useCallback(() => {
    if (!isMultiplayer) return isReady;
    if (!lobbyData?.players) return false;
    
    const players = Object.values(lobbyData.players);
    return players.length > 0 && players.every(p => p.ready);
  }, [isMultiplayer, lobbyData, isReady]);

  // Update player name from multiplayer context on initial load only
  useEffect(() => {
    if (isMultiplayer && mpPlayerName && !initialNameSyncDone.current) {
      initialNameSyncDone.current = true;
      setMyConfig(prev => ({ ...prev, name: mpPlayerName }));
    }
  }, [isMultiplayer, mpPlayerName]);

  // Save config to local storage whenever it changes
  useEffect(() => {
    saveConfig(myConfig);
  }, [myConfig]);

  // Sync ready state and config to multiplayer lobby
  useEffect(() => {
    if (isMultiplayer && updatePlayerConfig) {
      updatePlayerConfig({
        name: myConfig.name,
        warbonds: myConfig.warbonds,
        includeSuperstore: myConfig.includeSuperstore,
        excludedItems: myConfig.excludedItems,
        ready: isReady
      });
    }
  }, [isMultiplayer, updatePlayerConfig, myConfig, isReady]);

  // Auto-start when all players are ready (host initiates)
  useEffect(() => {
    if (isMultiplayer && isHost && allPlayersReady() && lobbyData?.players) {
      // Build players array from lobby data
      const players = Object.values(lobbyData.players)
        .sort((a, b) => a.slot - b.slot)
        .map(p => ({
          name: p.name,
          warbonds: p.warbonds || [...DEFAULT_WARBONDS],
          includeSuperstore: p.includeSuperstore || false,
          excludedItems: p.excludedItems || []
        }));
      
      // Small delay to ensure UI shows all ready
      setTimeout(() => {
        onStartRun(players);
      }, 500);
    }
  }, [isMultiplayer, isHost, allPlayersReady, lobbyData, onStartRun]);

  const updateMyConfig = (updates) => {
    setMyConfig(prev => ({ ...prev, ...updates }));
    // When config changes, unready the player
    if (isReady) {
      setIsReady(false);
    }
  };

  const toggleWarbond = (warbondId) => {
    const newWarbonds = myConfig.warbonds.includes(warbondId)
      ? myConfig.warbonds.filter(id => id !== warbondId)
      : [...myConfig.warbonds, warbondId];
    
    updateMyConfig({ warbonds: newWarbonds });
  };

  const handleEditItems = (warbondId) => {
    setItemSelectionModal({ warbondId });
  };

  const handleEditSuperstoreItems = () => {
    setItemSelectionModal({ superstore: true });
  };

  const handleSaveExcludedItems = (newExcluded) => {
    // Merge with existing excluded items, removing items from the current warbond/superstore first
    const currentWarbondId = itemSelectionModal?.warbondId;
    const isSuperstore = itemSelectionModal?.superstore;
    
    // Get items that should be managed by this modal
    const managedItems = isSuperstore 
      ? SUPERSTORE_ITEMS 
      : MASTER_DB.filter(item => item.warbond === currentWarbondId && item.type !== TYPE.BOOSTER);
    const managedIds = new Set(managedItems.map(i => i.id));
    
    // Keep excluded items from other warbonds/superstore, add new exclusions
    const otherExcluded = myConfig.excludedItems.filter(id => !managedIds.has(id));
    const updatedExcluded = [...otherExcluded, ...newExcluded];
    
    updateMyConfig({ excludedItems: updatedExcluded });
  };

  const handleReadyToggle = () => {
    const newReady = !isReady;
    setIsReady(newReady);
    
    if (isMultiplayer && setPlayerReady) {
      setPlayerReady(newReady);
    }
  };

  const handleSoloStart = () => {
    // Solo mode - just start with current config
    onStartRun([myConfig]);
  };

  const handleExitLobby = async () => {
    if (isMultiplayer && disconnect) {
      await disconnect();
    }
    onCancel();
  };

  const standardWarbonds = Object.values(WARBONDS).filter(wb => wb.type === WARBOND_TYPE.STANDARD);
  const premiumWarbonds = Object.values(WARBONDS).filter(wb => wb.type === WARBOND_TYPE.PREMIUM);
  const legendaryWarbonds = Object.values(WARBONDS).filter(wb => wb.type === WARBOND_TYPE.LEGENDARY);

  // Get all players' configs for display in multiplayer (sorted by slot)
  const allPlayers = isMultiplayer && lobbyData?.players
    ? Object.values(lobbyData.players).sort((a, b) => a.slot - b.slot)
    : [];

  return (
    <div style={{ minHeight: '100vh', background: GRADIENTS.BACKGROUND, color: 'white', padding: '80px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '72px', fontWeight: '900', color: factionColors.PRIMARY, margin: '0 0 8px 0', letterSpacing: '0.05em', textTransform: 'uppercase', textShadow: factionColors.GLOW }}>
            {isMultiplayer ? 'SQUAD LOADOUT' : 'LOADOUT SETUP'}
          </h1>
          <div style={{ background: GRADIENTS.HEADER_BAR, padding: '12px', margin: '0 auto 24px auto', maxWidth: '500px' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>
              {isMultiplayer ? 'Configure Your Warbonds' : 'Select Your Equipment'}
            </p>
          </div>
        </div>

        {/* Action Buttons - Moved to top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
          {/* Exit/Back Button */}
          <button
            onClick={handleExitLobby}
            style={{
              padding: '16px 32px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '2px solid #7f1d1d',
              borderRadius: '4px',
              fontWeight: '900',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = '#7f1d1d';
            }}
          >
            <LogOut size={18} />
            {isMultiplayer ? 'EXIT LOBBY' : 'BACK TO MENU'}
          </button>

          {/* Ready / Start Button */}
          {isMultiplayer ? (
            <button
              onClick={handleReadyToggle}
              style={{
                ...BUTTON_STYLES.PRIMARY,
                padding: '16px 48px',
                borderRadius: '4px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: isReady ? '#22c55e' : factionColors.PRIMARY,
                color: isReady ? 'white' : 'black'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isReady ? SHADOWS.GLOW_GREEN : factionColors.SHADOW_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
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
            </button>
          ) : (
            <button
              onClick={handleSoloStart}
              style={{
                ...BUTTON_STYLES.PRIMARY,
                padding: '16px 48px',
                borderRadius: '4px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = factionColors.PRIMARY_HOVER;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = factionColors.SHADOW_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = factionColors.PRIMARY;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = factionColors.SHADOW;
              }}
            >
              START RUN <CheckCircle size={20} />
            </button>
          )}
        </div>

        {/* Multiplayer waiting message */}
        {isMultiplayer && isReady && !allPlayersReady() && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '24px', 
            padding: '16px', 
            backgroundColor: 'rgba(34, 197, 94, 0.1)', 
            borderRadius: '4px',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <p style={{ color: '#22c55e', margin: 0, fontWeight: 'bold' }}>
              Waiting for all players to ready up...
            </p>
          </div>
        )}

        {/* Multiplayer: Show all players' status in slot order */}
        {isMultiplayer && allPlayers.length > 0 && (
          <div style={{ 
            backgroundColor: COLORS.CARD_BG, 
            borderRadius: '8px', 
            padding: '24px', 
            marginBottom: '32px',
            border: `1px solid ${COLORS.CARD_BORDER}`
          }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: COLORS.TEXT_MUTED, 
              marginBottom: '16px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em' 
            }}>
              <Users size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              SQUAD STATUS
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {allPlayers.map(player => {
                const isCurrentPlayer = player.slot === playerSlot;
                const playerReady = isCurrentPlayer ? isReady : player.ready;
                const playerName = isCurrentPlayer ? myConfig.name : player.name;
                
                return (
                  <div 
                    key={player.slot}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: playerReady ? 'rgba(34, 197, 94, 0.2)' : COLORS.BG_MAIN,
                      borderRadius: '4px',
                      border: `2px solid ${playerReady ? '#22c55e' : (isCurrentPlayer ? factionColors.PRIMARY : COLORS.CARD_BORDER)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      opacity: player.connected ? 1 : 0.5
                    }}
                  >
                    {player.isHost && <Crown size={16} style={{ color: factionColors.PRIMARY }} />}
                    <span style={{ fontWeight: 'bold', color: isCurrentPlayer ? factionColors.PRIMARY : (playerReady ? '#22c55e' : 'white') }}>
                      {playerName}
                    </span>
                    {isCurrentPlayer && <span style={{ fontSize: '11px', color: COLORS.TEXT_MUTED }}>(YOU)</span>}
                    {playerReady && <CheckCircle size={16} style={{ color: '#22c55e' }} />}
                    {!player.connected && <span style={{ fontSize: '11px', color: '#ef4444' }}>(DISCONNECTED)</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Configuration */}
        <div style={{ backgroundColor: COLORS.CARD_BG, padding: '48px', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)', marginBottom: '32px', boxShadow: SHADOWS.CARD }}>
          {/* Player Name */}
          <div style={{ marginBottom: '48px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: COLORS.TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>
              ● HELLDIVER DESIGNATION
            </label>
            {editingName ? (
              <input
                type="text"
                value={myConfig.name}
                onChange={(e) => updateMyConfig({ name: e.target.value })}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  backgroundColor: COLORS.BG_MAIN,
                  border: `3px solid ${factionColors.PRIMARY}`,
                  borderRadius: '4px',
                  fontSize: '28px',
                  fontWeight: '900',
                  color: factionColors.PRIMARY,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  outline: 'none',
                  boxShadow: factionColors.GLOW
                }}
                autoFocus
                maxLength={30}
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                disabled={isReady}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  backgroundColor: COLORS.BG_MAIN,
                  border: `2px solid ${COLORS.CARD_BORDER}`,
                  borderRadius: '4px',
                  fontSize: '28px',
                  fontWeight: '900',
                  color: 'white',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: isReady ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isReady ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isReady) {
                    e.currentTarget.style.borderColor = factionColors.PRIMARY;
                    e.currentTarget.style.color = factionColors.PRIMARY;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isReady) {
                    e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
                    e.currentTarget.style.color = 'white';
                  }
                }}
              >
                {myConfig.name}
              </button>
            )}
          </div>

          {/* Warbond Selection */}
          <div style={{ opacity: isReady ? 0.7 : 1, pointerEvents: isReady ? 'none' : 'auto' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: factionColors.PRIMARY, marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: factionColors.GLOW }}>
              ▸ SELECT WARBONDS
            </h2>
            
            {/* Standard Warbonds */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.TEXT_SECONDARY, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.15em', borderLeft: `4px solid ${factionColors.PRIMARY}`, paddingLeft: '12px' }}>
                STANDARD (FREE)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {standardWarbonds.map(wb => (
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
              </div>
            </div>

            {/* Premium Warbonds */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.TEXT_SECONDARY, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.15em', borderLeft: `4px solid ${COLORS.ACCENT_BLUE}`, paddingLeft: '12px' }}>
                PREMIUM WARBONDS
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {premiumWarbonds.map(wb => (
                  <WarbondCard
                    key={wb.id}
                    warbond={wb}
                    selected={myConfig.warbonds.includes(wb.id)}
                    onToggle={() => toggleWarbond(wb.id)}
                    onEditItems={handleEditItems}
                    factionColors={factionColors}
                  />
                ))}
              </div>
            </div>

            {/* Legendary Warbonds */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.TEXT_SECONDARY, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.15em', borderLeft: `4px solid ${COLORS.ACCENT_PURPLE}`, paddingLeft: '12px' }}>
                LEGENDARY WARBONDS
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {legendaryWarbonds.map(wb => (
                  <WarbondCard
                    key={wb.id}
                    warbond={wb}
                    selected={myConfig.warbonds.includes(wb.id)}
                    onToggle={() => toggleWarbond(wb.id)}
                    onEditItems={handleEditItems}
                    factionColors={factionColors}
                  />
                ))}
              </div>
            </div>

            {/* Superstore Toggle */}
            <div style={{ backgroundColor: COLORS.BG_MAIN, borderRadius: '4px', padding: '24px', border: `1px solid ${COLORS.CARD_BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: COLORS.ACCENT_PURPLE, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      ▸ INCLUDE SUPERSTORE ITEMS
                    </div>
                    <div style={{ fontSize: '13px', color: COLORS.TEXT_MUTED, lineHeight: '1.5' }}>
                      Allow items from the rotating Superstore in drafts
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={myConfig.includeSuperstore}
                    onChange={(e) => updateMyConfig({ includeSuperstore: e.target.checked })}
                    style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: COLORS.ACCENT_PURPLE }}
                  />
                </label>
              </div>
              {myConfig.includeSuperstore && (
                <button
                  onClick={handleEditSuperstoreItems}
                  style={{
                    marginTop: '16px',
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(100, 116, 139, 0.2)',
                    color: COLORS.TEXT_SECONDARY,
                    border: `1px solid ${COLORS.CARD_BORDER}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.4)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.2)';
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  }}
                >
                  <Settings size={16} />
                  Customize Superstore Items
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Item Selection Modal */}
        {itemSelectionModal && (
          <ItemSelectionModal
            warbondId={itemSelectionModal.warbondId}
            isSuperstore={itemSelectionModal.superstore}
            excludedItems={myConfig.excludedItems}
            onSave={handleSaveExcludedItems}
            onClose={() => setItemSelectionModal(null)}
            factionColors={factionColors}
          />
        )}
      </div>
    </div>
  );
}

// Warbond selection card component
function WarbondCard({ warbond, selected, onToggle, onEditItems, disabled = false, factionColors }) {
  const getBorderColor = () => {
    if (disabled) return COLORS.CARD_BORDER;
    if (selected) {
      if (warbond.type === WARBOND_TYPE.LEGENDARY) return COLORS.ACCENT_PURPLE;
      if (warbond.type === WARBOND_TYPE.PREMIUM) return COLORS.ACCENT_BLUE;
      return factionColors.PRIMARY;
    }
    return COLORS.CARD_BORDER;
  };

  const getGlowColor = () => {
    if (warbond.type === WARBOND_TYPE.LEGENDARY) return SHADOWS.GLOW_PURPLE;
    if (warbond.type === WARBOND_TYPE.PREMIUM) return SHADOWS.GLOW_BLUE;
    return factionColors.GLOW;
  };

  const getTextColor = () => {
    if (warbond.type === WARBOND_TYPE.LEGENDARY) return '#c084fc';
    if (warbond.type === WARBOND_TYPE.PREMIUM) return '#60a5fa';
    return factionColors.PRIMARY;
  };

  const handleCardClick = (e) => {
    // Don't toggle if clicking on the edit button
    if (e.target.closest('[data-edit-button]')) return;
    if (!disabled) {
      onToggle();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        position: 'relative',
        borderRadius: '4px',
        padding: '16px 20px',
        border: `2px solid ${getBorderColor()}`,
        transition: 'all 0.2s',
        backgroundColor: selected ? 'rgba(0, 0, 0, 0.4)' : COLORS.BG_MAIN,
        cursor: disabled ? 'default' : 'pointer',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected ? getGlowColor() : 'none',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.6)';
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
          e.currentTarget.style.backgroundColor = COLORS.BG_MAIN;
        }
      }}
        if (!disabled && !selected) {
          e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
          e.currentTarget.style.backgroundColor = COLORS.BG_MAIN;
        }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Warbond Info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: '14px',
              color: selected ? getTextColor() : COLORS.TEXT_SECONDARY,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {warbond.name}
            </div>
            <div style={{ fontSize: '10px', color: COLORS.TEXT_DISABLED, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {warbond.type === WARBOND_TYPE.STANDARD && '● FREE'}
              {warbond.type === WARBOND_TYPE.PREMIUM && '● PREMIUM'}
              {warbond.type === WARBOND_TYPE.LEGENDARY && '● LEGENDARY'}
            </div>
          </div>
          
          {/* Checkmark */}
          {selected && (
            <CheckCircle style={{ color: getTextColor(), flexShrink: 0 }} size={20} />
          )}
        </div>
        
        {/* Warbond Image - 16:9 aspect ratio */}
        {warbond.image && (
          <div style={{
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: '4px',
            overflow: 'hidden',
            border: `1px solid ${selected ? getBorderColor() : 'rgba(100, 116, 139, 0.3)'}`,
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}>
            <img
              src={warbond.image}
              alt={warbond.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#000'
              }}
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 12px; font-weight: bold;">IMAGE UNAVAILABLE</div>';
              }}
            />
          </div>
        )}
        
        {/* Edit Items Button - only show when selected */}
        {selected && onEditItems && (
          <button
            data-edit-button
            onClick={(e) => {
              e.stopPropagation();
              onEditItems(warbond.id);
            }}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'rgba(100, 116, 139, 0.2)',
              color: COLORS.TEXT_SECONDARY,
              border: `1px solid ${COLORS.CARD_BORDER}`,
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              position: 'relative',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.4)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.2)';
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <Settings size={14} />
            Customize Items
          </button>
        )}
      </div>
      {disabled && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: selected && onEditItems ? '50px' : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '4px',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: factionColors.PRIMARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            ● REQUIRED
          </span>
        </div>
      )}
    </div>
  );
}

// Item selection modal component
function ItemSelectionModal({ 
  warbondId, 
  isSuperstore, 
  excludedItems, 
  onSave, 
  onClose, 
  factionColors 
}) {
  const [localExcluded, setLocalExcluded] = useState(new Set(excludedItems));
  
  // Get items for this warbond or superstore
  const items = isSuperstore 
    ? SUPERSTORE_ITEMS 
    : MASTER_DB.filter(item => item.warbond === warbondId && item.type !== TYPE.BOOSTER);
  
  const warbondInfo = warbondId ? getWarbondById(warbondId) : null;
  const title = isSuperstore ? 'Superstore Items' : (warbondInfo?.name || 'Items');
  
  // Group items by type
  const itemsByType = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});
  
  const toggleItem = (itemId) => {
    setLocalExcluded(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };
  
  const selectAll = () => {
    setLocalExcluded(new Set());
  };
  
  const deselectAll = () => {
    setLocalExcluded(new Set(items.map(i => i.id)));
  };
  
  const handleSave = () => {
    onSave(Array.from(localExcluded));
    onClose();
  };
  
  const includedCount = items.length - localExcluded.size;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: COLORS.CARD_BG,
        borderRadius: '12px',
        border: `2px solid ${factionColors.PRIMARY}`,
        maxWidth: '800px',
        width: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${COLORS.CARD_BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ 
              color: factionColors.PRIMARY, 
              fontSize: '24px', 
              fontWeight: 'bold', 
              margin: 0,
              textTransform: 'uppercase'
            }}>
              {title}
            </h2>
            <p style={{ color: COLORS.TEXT_MUTED, fontSize: '14px', margin: '8px 0 0 0' }}>
              Select items you own. Unchecked items won't appear in drafts.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: '1px solid #7f1d1d',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Quick actions */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${COLORS.CARD_BORDER}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={selectAll}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Deselect All
          </button>
          <span style={{ marginLeft: 'auto', color: COLORS.TEXT_MUTED, fontSize: '14px' }}>
            {includedCount} / {items.length} items selected
          </span>
        </div>
        
        {/* Items list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {Object.entries(itemsByType).map(([type, typeItems]) => (
            <div key={type} style={{ marginBottom: '24px' }}>
              <h3 style={{
                color: factionColors.PRIMARY,
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '12px',
                borderLeft: `3px solid ${factionColors.PRIMARY}`,
                paddingLeft: '12px'
              }}>
                {type}
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px'
              }}>
                {typeItems.map(item => {
                  const isIncluded = !localExcluded.has(item.id);
                  return (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        backgroundColor: isIncluded ? 'rgba(34, 197, 94, 0.1)' : COLORS.BG_MAIN,
                        borderRadius: '4px',
                        border: `1px solid ${isIncluded ? 'rgba(34, 197, 94, 0.3)' : COLORS.CARD_BORDER}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={() => toggleItem(item.id)}
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          cursor: 'pointer',
                          accentColor: '#22c55e'
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: isIncluded ? 'white' : COLORS.TEXT_MUTED,
                          fontSize: '13px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.name}
                        </div>
                        <div style={{
                          color: COLORS.TEXT_DISABLED,
                          fontSize: '10px',
                          textTransform: 'uppercase'
                        }}>
                          {item.rarity}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${COLORS.CARD_BORDER}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: COLORS.TEXT_MUTED,
              border: `1px solid ${COLORS.CARD_BORDER}`,
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '12px 24px',
              backgroundColor: factionColors.PRIMARY,
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '14px'
            }}
          >
            Save Selection
          </button>
        </div>
      </div>
    </div>
  );
}
