import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, LogOut, Users, Crown } from 'lucide-react';
import { WARBONDS, WARBOND_TYPE, DEFAULT_WARBONDS } from '../constants/warbonds';
import { COLORS, SHADOWS, GRADIENTS, BUTTON_STYLES, getFactionColors } from '../constants/theme';
import { useMultiplayer } from '../systems/multiplayer';

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
    includeSuperstore: savedConfig?.includeSuperstore || false
  });
  
  const [isReady, setIsReady] = useState(false);
  const [editingName, setEditingName] = useState(false);
  
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
          includeSuperstore: p.includeSuperstore || false
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
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '72px', fontWeight: '900', color: factionColors.PRIMARY, margin: '0 0 8px 0', letterSpacing: '0.05em', textTransform: 'uppercase', textShadow: factionColors.GLOW }}>
            {isMultiplayer ? 'SQUAD LOADOUT' : 'LOADOUT SETUP'}
          </h1>
          <div style={{ background: GRADIENTS.HEADER_BAR, padding: '12px', margin: '0 auto 24px auto', maxWidth: '500px' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>
              {isMultiplayer ? 'Configure Your Warbonds' : 'Select Your Equipment'}
            </p>
          </div>
        </div>

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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {standardWarbonds.map(wb => (
                  <WarbondCard
                    key={wb.id}
                    warbond={wb}
                    selected={myConfig.warbonds.includes(wb.id)}
                    onToggle={() => toggleWarbond(wb.id)}
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
                    factionColors={factionColors}
                  />
                ))}
              </div>
            </div>

            {/* Superstore Toggle */}
            <div style={{ backgroundColor: COLORS.BG_MAIN, borderRadius: '4px', padding: '24px', border: `1px solid ${COLORS.CARD_BORDER}` }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
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
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
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
            marginTop: '24px', 
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
      </div>
    </div>
  );
}

// Warbond selection card component
function WarbondCard({ warbond, selected, onToggle, disabled = false, factionColors }) {
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

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        position: 'relative',
        borderRadius: '4px',
        padding: '16px 20px',
        border: `2px solid ${getBorderColor()}`,
        transition: 'all 0.2s',
        backgroundColor: selected ? 'rgba(0, 0, 0, 0.4)' : COLORS.BG_MAIN,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
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
      </div>
      {disabled && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '4px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: factionColors.PRIMARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            ● REQUIRED
          </span>
        </div>
      )}
    </button>
  );
}
