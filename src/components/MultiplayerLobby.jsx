/**
 * MultiplayerLobby - Component for hosting/joining multiplayer games
 */

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Users, Crown, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { COLORS, SHADOWS, GRADIENTS, getFactionColors } from '../constants/theme';
import { useMultiplayer } from '../systems/multiplayer';
import { trackMultiplayerAction } from '../utils/analytics';
import GameConfiguration from './GameConfiguration';

/**
 * Host/Join selection screen
 */
export function MultiplayerModeSelect({ gameConfig, onHost, onJoin, onBack }) {
  const factionColors = getFactionColors(gameConfig.faction);
  const { firebaseReady, error, clearError } = useMultiplayer();

  if (!firebaseReady) {
    return (
      <div style={{ minHeight: '100vh', background: GRADIENTS.BACKGROUND, color: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#ef4444', marginBottom: '24px' }}>
            MULTIPLAYER UNAVAILABLE
          </h1>
          <p style={{ fontSize: '16px', color: COLORS.TEXT_MUTED, marginBottom: '32px' }}>
            Firebase is not configured. Please add your Firebase configuration to enable multiplayer features.
          </p>
          <p style={{ fontSize: '14px', color: COLORS.TEXT_DISABLED, marginBottom: '48px' }}>
            See src/systems/multiplayer/firebaseConfig.js for setup instructions.
          </p>
          <button
            onClick={onBack}
            style={{
              padding: '16px 32px',
              backgroundColor: 'transparent',
              color: COLORS.TEXT_MUTED,
              border: `2px solid ${COLORS.CARD_BORDER}`,
              borderRadius: '4px',
              fontWeight: '900',
              fontSize: '14px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            ← BACK TO MENU
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: GRADIENTS.BACKGROUND, color: 'white', padding: '80px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 style={{ 
            fontSize: '72px', 
            fontWeight: '900', 
            color: factionColors.PRIMARY, 
            margin: '0 0 8px 0', 
            letterSpacing: '0.05em', 
            textTransform: 'uppercase', 
            textShadow: factionColors.GLOW 
          }}>
            MULTIPLAYER
          </h1>
          <div style={{ background: GRADIENTS.HEADER_BAR, padding: '12px', margin: '0 auto', maxWidth: '400px' }}>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>
              Squad Up
            </p>
          </div>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444', 
            borderRadius: '4px', 
            padding: '16px', 
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#ef4444' }}>{error}</span>
            <button onClick={clearError} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '48px' }}>
          {/* Host Game */}
          <button
            onClick={() => {
              trackMultiplayerAction('select_host');
              onHost();
            }}
            style={{
              backgroundColor: COLORS.CARD_BG,
              border: `2px solid ${COLORS.CARD_BORDER}`,
              borderRadius: '8px',
              padding: '48px 32px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = factionColors.PRIMARY;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = factionColors.SHADOW;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Crown size={64} style={{ color: factionColors.PRIMARY, marginBottom: '24px' }} />
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: factionColors.PRIMARY, marginBottom: '12px', textTransform: 'uppercase' }}>
              HOST GAME
            </h2>
            <p style={{ fontSize: '14px', color: COLORS.TEXT_MUTED, margin: 0 }}>
              Create a new lobby and invite your squad
            </p>
          </button>

          {/* Join Game */}
          <button
            onClick={() => {
              trackMultiplayerAction('select_join');
              onJoin();
            }}
            style={{
              backgroundColor: COLORS.CARD_BG,
              border: `2px solid ${COLORS.CARD_BORDER}`,
              borderRadius: '8px',
              padding: '48px 32px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.ACCENT_BLUE;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = SHADOWS.GLOW_BLUE;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Users size={64} style={{ color: COLORS.ACCENT_BLUE, marginBottom: '24px' }} />
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: COLORS.ACCENT_BLUE, marginBottom: '12px', textTransform: 'uppercase' }}>
              JOIN GAME
            </h2>
            <p style={{ fontSize: '14px', color: COLORS.TEXT_MUTED, margin: 0 }}>
              Enter a lobby code to join your squad
            </p>
          </button>
        </div>

        {/* Back button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onBack}
            style={{
              padding: '16px 32px',
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
        </div>
      </div>
    </div>
  );
}

/**
 * Join game screen - enter lobby code
 */
export function JoinGameScreen({ gameConfig, onJoinLobby, onBack }) {
  const factionColors = getFactionColors(gameConfig.faction);
  const { checkLobbyExists, error, clearError } = useMultiplayer();
  
  // Load saved player name from localStorage
  const [lobbyCode, setLobbyCode] = useState('');
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem('helldrafters_mp_name') || '';
    } catch {
      return '';
    }
  });
  const [checking, setChecking] = useState(false);
  const [lobbyInfo, setLobbyInfo] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Track if we've already checked this code to avoid duplicate checks
  const lastCheckedCode = useRef('');

  // UUID v4 pattern
  const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Auto-check lobby when a valid UUID is entered/pasted
  useEffect(() => {
    const trimmedCode = lobbyCode.trim();
    
    // Only auto-check if it looks like a valid UUID and we haven't checked it yet
    if (isValidUUID(trimmedCode) && trimmedCode !== lastCheckedCode.current && !checking) {
      lastCheckedCode.current = trimmedCode;
      
      // Run the check
      const autoCheck = async () => {
        setChecking(true);
        clearError();
        
        const info = await checkLobbyExists(trimmedCode);
        setLobbyInfo(info);
        setChecking(false);
        
        // For new games, auto-select the next sequential slot
        if (info && !info.isLoadedGame) {
          const players = info.players || {};
          const takenSlots = Object.values(players).map(p => p.slot);
          for (let i = 0; i < 4; i++) {
            if (!takenSlots.includes(i)) {
              setSelectedSlot(i);
              break;
            }
          }
        } else {
          setSelectedSlot(null);
        }
      };
      
      autoCheck();
    }
  }, [lobbyCode, checking, checkLobbyExists, clearError]);

  const handleCheckLobby = async () => {
    if (!lobbyCode.trim()) return;
    
    setChecking(true);
    clearError();
    
    const info = await checkLobbyExists(lobbyCode.trim());
    setLobbyInfo(info);
    setChecking(false);
    
    // For new games, auto-select the next sequential slot
    if (info && !info.isLoadedGame) {
      const players = info.players || {};
      const takenSlots = Object.values(players).map(p => p.slot);
      // Find the first available slot sequentially
      for (let i = 0; i < 4; i++) {
        if (!takenSlots.includes(i)) {
          setSelectedSlot(i);
          break;
        }
      }
    } else {
      setSelectedSlot(null);
    }
  };

  const getAvailableSlots = () => {
    if (!lobbyInfo) return [];
    const totalSlots = 4; // Always allow up to 4 players in multiplayer (dynamic)
    const players = lobbyInfo.players || {};
    
    // A slot is available if:
    // 1. No player is in that slot, OR
    // 2. The player in that slot is disconnected (connected === false)
    const available = [];
    for (let i = 0; i < totalSlots; i++) {
      const playerInSlot = Object.values(players).find(p => p.slot === i);
      // Slot is available if no player or player is disconnected
      if (!playerInSlot || playerInSlot.connected === false) {
        available.push(i);
      }
    }
    return available;
  };
  
  // Get info about disconnected players by slot (for UI indication)
  const getDisconnectedPlayerInSlot = (slot) => {
    if (!lobbyInfo?.players) return null;
    const player = Object.values(lobbyInfo.players).find(p => p.slot === slot && p.connected === false);
    return player;
  };

  // Check if slot selection should be shown (only for loaded games)
  const showSlotSelection = lobbyInfo?.isLoadedGame;

  const handleJoin = () => {
    if (playerName.trim() && selectedSlot !== null) {
      // Save player name to localStorage for next time
      try {
        localStorage.setItem('helldrafters_mp_name', playerName.trim());
      } catch (e) {
        // Ignore localStorage errors
      }
      trackMultiplayerAction('join_lobby');
      onJoinLobby(lobbyCode.trim(), playerName.trim(), selectedSlot);
    }
  };

  const availableSlots = getAvailableSlots();

  return (
    <div style={{ minHeight: '100vh', background: GRADIENTS.BACKGROUND, color: 'white', padding: '80px 24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: COLORS.ACCENT_BLUE, marginBottom: '8px', textTransform: 'uppercase' }}>
            JOIN GAME
          </h1>
          <p style={{ fontSize: '16px', color: COLORS.TEXT_MUTED }}>
            Enter the lobby code shared by your host
          </p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444', 
            borderRadius: '4px', 
            padding: '16px', 
            marginBottom: '24px' 
          }}>
            <span style={{ color: '#ef4444' }}>{error}</span>
          </div>
        )}

        {/* Lobby Code Input */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: COLORS.TEXT_MUTED, textTransform: 'uppercase', marginBottom: '8px' }}>
            LOBBY CODE
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={lobbyCode}
              onChange={(e) => {
                setLobbyCode(e.target.value);
                setLobbyInfo(null);
                setSelectedSlot(null);
              }}
              placeholder="Enter lobby code (UUID)"
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: COLORS.BG_MAIN,
                border: `2px solid ${COLORS.CARD_BORDER}`,
                borderRadius: '4px',
                fontSize: '16px',
                color: 'white',
                outline: 'none'
              }}
            />
            <button
              onClick={handleCheckLobby}
              disabled={!lobbyCode.trim() || checking}
              style={{
                padding: '16px 24px',
                backgroundColor: COLORS.ACCENT_BLUE,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: lobbyCode.trim() && !checking ? 'pointer' : 'not-allowed',
                opacity: lobbyCode.trim() && !checking ? 1 : 0.5
              }}
            >
              {checking ? <RefreshCw size={20} className="spin" /> : 'CHECK'}
            </button>
          </div>
        </div>

        {/* Lobby Info */}
        {lobbyInfo && (
          <div style={{ 
            backgroundColor: COLORS.CARD_BG, 
            borderRadius: '8px', 
            padding: '24px', 
            marginBottom: '32px',
            border: `1px solid ${COLORS.CARD_BORDER}`
          }}>
            <h3 style={{ color: factionColors.PRIMARY, marginBottom: '16px', textTransform: 'uppercase' }}>
              LOBBY FOUND
            </h3>
            
            {/* Current Players */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: COLORS.TEXT_MUTED, marginBottom: '8px' }}>PLAYERS IN LOBBY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.values(lobbyInfo.players || {}).map(p => (
                  <div key={p.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: COLORS.BG_MAIN,
                    borderRadius: '4px',
                    border: `1px solid ${p.isHost ? factionColors.PRIMARY : COLORS.CARD_BORDER}`
                  }}>
                    {p.isHost && <Crown size={14} style={{ color: factionColors.PRIMARY }} />}
                    <span style={{ color: p.connected ? 'white' : COLORS.TEXT_DISABLED }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: '10px', color: COLORS.TEXT_MUTED }}>
                      (Slot {p.slot + 1})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Name */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: COLORS.TEXT_MUTED, textTransform: 'uppercase', marginBottom: '8px' }}>
                YOUR NAME
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your helldiver name"
                maxLength={30}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: COLORS.BG_MAIN,
                  border: `2px solid ${COLORS.CARD_BORDER}`,
                  borderRadius: '4px',
                  fontSize: '16px',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>

            {/* Slot Selection - only show for loaded/saved games */}
            {showSlotSelection && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: COLORS.TEXT_MUTED, textTransform: 'uppercase', marginBottom: '8px' }}>
                  SELECT YOUR SLOT
                </label>
                <p style={{ fontSize: '12px', color: COLORS.TEXT_SECONDARY, marginBottom: '12px' }}>
                  This is a saved game. Select which helldiver slot you want to play as.
                </p>
                {availableSlots.length === 0 ? (
                  <p style={{ color: '#ef4444' }}>No slots available - lobby is full</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {availableSlots.map(slot => {
                      const disconnectedPlayer = getDisconnectedPlayerInSlot(slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '16px 24px',
                            backgroundColor: selectedSlot === slot ? factionColors.PRIMARY : COLORS.BG_MAIN,
                            color: selectedSlot === slot ? 'black' : 'white',
                            border: `2px solid ${selectedSlot === slot ? factionColors.PRIMARY : disconnectedPlayer ? '#f59e0b' : COLORS.CARD_BORDER}`,
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>Slot {slot + 1}</span>
                          {disconnectedPlayer && (
                            <span style={{ 
                              fontSize: '10px', 
                              color: selectedSlot === slot ? 'rgba(0,0,0,0.6)' : '#f59e0b',
                              fontWeight: 'normal'
                            }}>
                              (Rejoin as {disconnectedPlayer.name})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Auto-assigned slot message for new games */}
            {!showSlotSelection && selectedSlot !== null && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                  padding: '12px 16px', 
                  backgroundColor: `${factionColors.PRIMARY}20`, 
                  border: `1px solid ${factionColors.PRIMARY}40`,
                  borderRadius: '4px'
                }}>
                  <span style={{ color: factionColors.PRIMARY, fontWeight: 'bold' }}>
                    You will join as Helldiver {selectedSlot + 1}
                  </span>
                </div>
              </div>
            )}

            {/* Join Button */}
            <button
              onClick={handleJoin}
              disabled={!playerName.trim() || selectedSlot === null}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: playerName.trim() && selectedSlot !== null ? COLORS.ACCENT_BLUE : COLORS.BG_MAIN,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '900',
                fontSize: '16px',
                textTransform: 'uppercase',
                cursor: playerName.trim() && selectedSlot !== null ? 'pointer' : 'not-allowed',
                opacity: playerName.trim() && selectedSlot !== null ? 1 : 0.5
              }}
            >
              JOIN LOBBY
            </button>
          </div>
        )}

        {/* No lobby found message */}
        {lobbyCode && !checking && !lobbyInfo && !error && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444', 
            borderRadius: '4px', 
            padding: '24px', 
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#ef4444', margin: 0 }}>
              Lobby not found. Check the code and try again.
            </p>
          </div>
        )}

        {/* Back button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onBack}
            style={{
              padding: '16px 32px',
              backgroundColor: 'transparent',
              color: COLORS.TEXT_MUTED,
              border: `2px solid ${COLORS.CARD_BORDER}`,
              borderRadius: '4px',
              fontWeight: '900',
              fontSize: '14px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            ← BACK
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Multiplayer waiting room - shown after host creates or player joins
 */
export function MultiplayerWaitingRoom({ 
  gameConfig, 
  eventsEnabled,
  onUpdateGameConfig,
  onSetSubfaction,
  onSetEventsEnabled,
  onStartGame, 
  onLeave, 
  isConfiguring = false 
}) {
  const factionColors = getFactionColors(gameConfig.faction);
  const { isHost, lobbyId, lobbyData, playerSlot, disconnect, changeSlot, kickPlayerFromLobby } = useMultiplayer();
  const [copied, setCopied] = useState(false);
  const [changingSlot, setChangingSlot] = useState(false);
  const [lobbyCodeVisible, setLobbyCodeVisible] = useState(false);

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(lobbyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allPlayers = lobbyData?.players ? Object.values(lobbyData.players) : [];
  const players = allPlayers.filter(p => p.connected !== false); // Only show connected players
  const maxPlayers = 4; // Always allow up to 4 players in multiplayer
  const canStart = players.length >= 1; // Can start with at least 1 player (the host)

  // Calculate available slots for slot switching
  const takenSlots = players.map(p => p.slot);
  const availableSlotsForSwitch = [];
  for (let i = 0; i < maxPlayers; i++) {
    if (!takenSlots.includes(i)) {
      availableSlotsForSwitch.push(i);
    }
  }

  const handleChangeSlot = async (newSlot) => {
    setChangingSlot(true);
    await changeSlot(newSlot);
    setChangingSlot(false);
  };

  const handleKickPlayer = async (playerIdToKick) => {
    if (window.confirm('Are you sure you want to kick this player? They can rejoin with the lobby code.')) {
      await kickPlayerFromLobby(playerIdToKick);
    }
  };

  const handleLeave = async () => {
    trackMultiplayerAction('leave_lobby', players.length);
    await disconnect();
    onLeave();
  };

  const handleStartGame = () => {
    // Track multiplayer game start
    trackMultiplayerAction('start_game', players.length);
    // Pass the actual number of players that joined
    onStartGame(players.length);
  };

  // If host is configuring warbonds, show minimal waiting UI
  if (isConfiguring) {
    return null; // Let the parent handle the lobby display
  }

  return (
    <div style={{ minHeight: '100vh', background: GRADIENTS.BACKGROUND, color: 'white', padding: '80px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: factionColors.PRIMARY, marginBottom: '8px', textTransform: 'uppercase' }}>
            {isHost ? 'HOSTING GAME' : 'WAITING FOR HOST'}
          </h1>
          <p style={{ fontSize: '16px', color: COLORS.TEXT_MUTED }}>
            {isHost ? 'Share the lobby code with your squad' : 'Waiting for host to start the game...'}
          </p>
        </div>

        {/* Lobby Code - Hidden until hover for streaming mode */}
        <div style={{ 
          backgroundColor: COLORS.CARD_BG, 
          borderRadius: '8px', 
          padding: '32px', 
          marginBottom: '32px',
          textAlign: 'center',
          border: `1px solid ${COLORS.CARD_BORDER}`
        }}>
          <div style={{ fontSize: '12px', color: COLORS.TEXT_MUTED, marginBottom: '8px', textTransform: 'uppercase' }}>
            LOBBY CODE {!lobbyCodeVisible && '(hover to reveal)'}
          </div>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '16px',
              backgroundColor: COLORS.BG_MAIN,
              padding: '16px 24px',
              borderRadius: '4px',
              border: `1px solid ${COLORS.CARD_BORDER}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={() => setLobbyCodeVisible(true)}
            onMouseLeave={() => setLobbyCodeVisible(false)}
          >
            <code style={{ 
              fontSize: '18px', 
              fontFamily: 'monospace', 
              color: lobbyCodeVisible ? factionColors.PRIMARY : COLORS.TEXT_DISABLED,
              letterSpacing: '0.05em',
              filter: lobbyCodeVisible ? 'none' : 'blur(8px)',
              transition: 'all 0.2s',
              userSelect: lobbyCodeVisible ? 'text' : 'none'
            }}>
              {lobbyId}
            </code>
            <button
              onClick={copyLobbyCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: copied ? '#22c55e' : 'transparent',
                color: copied ? 'white' : COLORS.TEXT_MUTED,
                border: `1px solid ${copied ? '#22c55e' : COLORS.CARD_BORDER}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: COLORS.TEXT_DISABLED, marginTop: '8px', margin: '8px 0 0 0' }}>
            Hidden for streaming - hover to reveal
          </p>
        </div>

        {/* Players List */}
        <div style={{ 
          backgroundColor: COLORS.CARD_BG, 
          borderRadius: '8px', 
          padding: '32px', 
          marginBottom: '32px',
          border: `1px solid ${COLORS.CARD_BORDER}`
        }}>
          <h3 style={{ color: factionColors.PRIMARY, marginBottom: '24px', textTransform: 'uppercase' }}>
            SQUAD ({players.length}/{maxPlayers})
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            {Array.from({ length: maxPlayers }, (_, i) => {
              const player = players.find(p => p.slot === i);
              const isCurrentPlayer = player && player.slot === playerSlot;
              
              return (
                <div 
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    backgroundColor: COLORS.BG_MAIN,
                    borderRadius: '4px',
                    border: `2px solid ${player ? (isCurrentPlayer ? factionColors.PRIMARY : COLORS.CARD_BORDER) : 'rgba(100, 116, 139, 0.3)'}`,
                    opacity: player ? 1 : 0.5
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      color: COLORS.TEXT_MUTED,
                      minWidth: '60px'
                    }}>
                      SLOT {i + 1}
                    </span>
                    {player ? (
                      <>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>
                          {player.name}
                        </span>
                        {player.isHost && (
                          <Crown size={16} style={{ color: factionColors.PRIMARY }} />
                        )}
                        {isCurrentPlayer && (
                          <span style={{ 
                            fontSize: '10px', 
                            padding: '2px 8px', 
                            backgroundColor: `${factionColors.PRIMARY}30`,
                            color: factionColors.PRIMARY,
                            borderRadius: '4px'
                          }}>
                            YOU
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: COLORS.TEXT_DISABLED, fontStyle: 'italic' }}>
                        Waiting for player...
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {player && (
                      player.connected ? (
                        <Wifi size={16} style={{ color: '#22c55e' }} />
                      ) : (
                        <WifiOff size={16} style={{ color: '#ef4444' }} />
                      )
                    )}
                    {/* Host can kick disconnected players to free up their slot */}
                    {isHost && player && !player.isHost && !player.connected && (
                      <button
                        onClick={() => handleKickPlayer(player.id)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          border: `1px solid #7f1d1d`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = '#7f1d1d';
                        }}
                        title="Kick this player to free up their slot for rejoining"
                      >
                        Kick
                      </button>
                    )}
                    {!player && !isHost && (
                      <button
                        onClick={() => handleChangeSlot(i)}
                        disabled={changingSlot}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'transparent',
                          color: COLORS.ACCENT_BLUE,
                          border: `1px solid ${COLORS.ACCENT_BLUE}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Switch Here
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Configuration - Host Only */}
        {isHost && (
          <div style={{ 
            backgroundColor: COLORS.CARD_BG, 
            borderRadius: '8px', 
            padding: '32px', 
            marginBottom: '32px',
            border: `1px solid ${COLORS.CARD_BORDER}`
          }}>
            <h3 style={{ color: factionColors.PRIMARY, marginBottom: '24px', textTransform: 'uppercase' }}>
              GAME CONFIGURATION
            </h3>
            <GameConfiguration
              gameConfig={gameConfig}
              eventsEnabled={eventsEnabled}
              onUpdateGameConfig={onUpdateGameConfig}
              onSetSubfaction={onSetSubfaction}
              onSetEventsEnabled={onSetEventsEnabled}
              factionColors={factionColors}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <button
            onClick={handleLeave}
            style={{
              padding: '16px 32px',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: '2px solid #7f1d1d',
              borderRadius: '4px',
              fontWeight: '900',
              fontSize: '14px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            {isHost ? 'CLOSE LOBBY' : 'LEAVE LOBBY'}
          </button>

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              style={{
                padding: '16px 32px',
                backgroundColor: canStart ? factionColors.PRIMARY : COLORS.BG_MAIN,
                color: canStart ? 'black' : COLORS.TEXT_DISABLED,
                border: 'none',
                borderRadius: '4px',
                fontWeight: '900',
                fontSize: '14px',
                textTransform: 'uppercase',
                cursor: canStart ? 'pointer' : 'not-allowed',
                opacity: canStart ? 1 : 0.5
              }}
            >
              {canStart ? `START WITH ${players.length} PLAYER${players.length > 1 ? 'S' : ''} →` : 'WAITING FOR HOST...'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MultiplayerStatusBar - Shows during active multiplayer game
 * Displays lobby code, connected players, and host status
 */
export function MultiplayerStatusBar({ gameConfig, onDisconnect }) {
  const { isHost, lobbyId, connectedPlayers, playerSlot, kickPlayerFromLobby } = useMultiplayer();
  const [copied, setCopied] = useState(false);
  const [lobbyCodeVisible, setLobbyCodeVisible] = useState(false);
  const factionColors = getFactionColors(gameConfig?.faction || 'terminid');

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(lobbyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format lobby ID for display (show first 8 chars)
  const displayLobbyId = lobbyId ? `${lobbyId.substring(0, 8)}...` : '';
  // Count only actually connected players (not those who disconnected)
  const actuallyConnected = (connectedPlayers || []).filter(p => p.connected !== false);
  const playerCount = actuallyConnected.length;
  const expectedPlayers = gameConfig?.playerCount || 4;

  return (
    <div style={{
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderBottom: `2px solid ${isHost ? factionColors.PRIMARY : COLORS.ACCENT_BLUE}`,
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Left: Multiplayer Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wifi size={16} style={{ color: '#22c55e' }} />
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '900', 
            color: isHost ? factionColors.PRIMARY : COLORS.ACCENT_BLUE, 
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            {isHost ? '👑 HOST' : `PLAYER ${playerSlot + 1}`}
          </span>
        </div>

        {/* Lobby Code - Hidden until hover for streaming mode */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onMouseEnter={() => setLobbyCodeVisible(true)}
          onMouseLeave={() => setLobbyCodeVisible(false)}
        >
          <span style={{ fontSize: '11px', color: COLORS.TEXT_DISABLED, textTransform: 'uppercase' }}>
            Lobby:
          </span>
          <button
            onClick={copyLobbyCode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: 'rgba(100, 116, 139, 0.2)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title={lobbyCodeVisible ? `Copy full lobby code: ${lobbyId}` : 'Hover to reveal lobby code'}
          >
            <code style={{ 
              fontSize: '11px', 
              color: lobbyCodeVisible ? COLORS.TEXT_SECONDARY : COLORS.TEXT_DISABLED, 
              fontFamily: 'monospace',
              filter: lobbyCodeVisible ? 'none' : 'blur(4px)',
              transition: 'filter 0.2s',
              userSelect: lobbyCodeVisible ? 'text' : 'none'
            }}>
              {displayLobbyId}
            </code>
            {copied ? (
              <Check size={12} style={{ color: '#22c55e' }} />
            ) : (
              <Copy size={12} style={{ color: COLORS.TEXT_DISABLED }} />
            )}
          </button>
        </div>

        {/* Player Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} style={{ color: COLORS.TEXT_MUTED }} />
          <span style={{ fontSize: '12px', color: COLORS.TEXT_SECONDARY }}>
            {playerCount}/{expectedPlayers}
          </span>
        </div>
      </div>

      {/* Right: Player Names & Disconnect */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Connected Player Names */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Object.values(connectedPlayers || {}).map((player, idx) => (
            <div
              key={player.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                padding: '2px 8px',
                backgroundColor: player.connected === false 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : player.isHost 
                    ? `${factionColors.PRIMARY}20`
                    : 'rgba(59, 130, 246, 0.2)',
                color: player.connected === false 
                  ? '#ef4444'
                  : player.isHost ? factionColors.PRIMARY : COLORS.ACCENT_BLUE,
                borderRadius: '4px',
                fontWeight: player.id === connectedPlayers?.self?.id ? '900' : '600',
                opacity: player.connected === false ? 0.7 : 1
              }}
            >
              {player.isHost && <Crown size={10} style={{ marginRight: '2px', verticalAlign: 'middle' }} />}
              {player.connected === false && <WifiOff size={10} style={{ marginRight: '2px', verticalAlign: 'middle' }} />}
              <span>{player.name || `Player ${(player.slot ?? 0) + 1}`}</span>
              {/* Kick button for host (only shows for non-host players) */}
              {isHost && !player.isHost && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Kick ${player.name || 'this player'}? They can rejoin with the lobby code.`)) {
                      kickPlayerFromLobby(player.id);
                    }
                  }}
                  style={{
                    marginLeft: '4px',
                    padding: '0 4px',
                    backgroundColor: 'transparent',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                  title={`Kick ${player.name || 'player'}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Disconnect Button */}
        <button
          onClick={onDisconnect}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '4px',
            color: '#ef4444',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
        >
          <WifiOff size={12} />
          {isHost ? 'END SESSION' : 'DISCONNECT'}
        </button>
      </div>
    </div>
  );
}

// Named exports only - no default export needed
