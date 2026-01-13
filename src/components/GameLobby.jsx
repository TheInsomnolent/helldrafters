import React, { useState } from 'react';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { WARBONDS, WARBOND_TYPE, DEFAULT_WARBONDS } from '../constants/warbonds';
import { COLORS, SHADOWS, GRADIENTS, BUTTON_STYLES } from '../constants/theme';

/**
 * GameLobby component for configuring players before starting a run
 */
export default function GameLobby({
  gameConfig,
  onStartRun,
  onCancel
}) {
  const [players, setPlayers] = useState(
    Array.from({ length: gameConfig.playerCount }, (_, i) => ({
      name: `Helldiver ${i + 1}`,
      warbonds: [...DEFAULT_WARBONDS],
      includeSuperstore: false
    }))
  );
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [editingName, setEditingName] = useState(false);

  const currentPlayer = players[currentPlayerIndex];

  const updatePlayer = (index, updates) => {
    setPlayers(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const toggleWarbond = (warbondId) => {
    const newWarbonds = currentPlayer.warbonds.includes(warbondId)
      ? currentPlayer.warbonds.filter(id => id !== warbondId)
      : [...currentPlayer.warbonds, warbondId];
    
    updatePlayer(currentPlayerIndex, { warbonds: newWarbonds });
  };

  const goToNextPlayer = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
      setEditingName(false);
    } else {
      // All players configured, start the run
      onStartRun(players);
    }
  };

  const goToPreviousPlayer = () => {
    if (currentPlayerIndex > 0) {
      setCurrentPlayerIndex(prev => prev - 1);
      setEditingName(false);
    }
  };

  const standardWarbonds = Object.values(WARBONDS).filter(wb => wb.type === WARBOND_TYPE.STANDARD);
  const premiumWarbonds = Object.values(WARBONDS).filter(wb => wb.type === WARBOND_TYPE.PREMIUM);
  const legendaryWarbonds = Object.values(WARBONDS).filter(wb => wb.type === WARBOND_TYPE.LEGENDARY);

  return (
    <div style={{ minHeight: '100vh', background: GRADIENTS.BACKGROUND, color: 'white', padding: '80px 24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '72px', fontWeight: '900', color: COLORS.PRIMARY, margin: '0 0 8px 0', letterSpacing: '0.05em', textTransform: 'uppercase', textShadow: SHADOWS.GLOW_PRIMARY }}>
            GAME LOBBY
          </h1>
          <div style={{ background: GRADIENTS.HEADER_BAR, padding: '12px', margin: '0 auto 24px auto', maxWidth: '500px' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>
              Configure Your Squad
            </p>
          </div>
        </div>

        {/* Player Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {players.map((p, i) => (
            <button
              key={i}
              onClick={() => { setCurrentPlayerIndex(i); setEditingName(false); }}
              style={{
                padding: '16px 32px',
                borderRadius: '4px',
                fontWeight: '900',
                fontSize: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                transition: 'all 0.2s',
                backgroundColor: i === currentPlayerIndex ? COLORS.PRIMARY : 'transparent',
                color: i === currentPlayerIndex ? 'black' : COLORS.TEXT_MUTED,
                border: i === currentPlayerIndex ? `2px solid ${COLORS.PRIMARY}` : `2px solid ${COLORS.CARD_BORDER}`,
                cursor: 'pointer',
                transform: i === currentPlayerIndex ? 'scale(1.05)' : 'scale(1)',
                boxShadow: i === currentPlayerIndex ? SHADOWS.BUTTON_PRIMARY : 'none'
              }}
              onMouseEnter={(e) => {
                if (i !== currentPlayerIndex) {
                  e.currentTarget.style.borderColor = COLORS.TEXT_DISABLED;
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }
              }}
              onMouseLeave={(e) => {
                if (i !== currentPlayerIndex) {
                  e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
                  e.currentTarget.style.color = COLORS.TEXT_MUTED;
                }
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Current Player Configuration */}
        <div style={{ backgroundColor: COLORS.CARD_BG, padding: '48px', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)', marginBottom: '32px', boxShadow: SHADOWS.CARD }}>
          {/* Player Name */}
          <div style={{ marginBottom: '48px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: COLORS.TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>
              ● HELLDIVER DESIGNATION
            </label>
            {editingName ? (
              <input
                type="text"
                value={currentPlayer.name}
                onChange={(e) => updatePlayer(currentPlayerIndex, { name: e.target.value })}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  backgroundColor: COLORS.BG_MAIN,
                  border: `3px solid ${COLORS.PRIMARY}`,
                  borderRadius: '4px',
                  fontSize: '28px',
                  fontWeight: '900',
                  color: COLORS.PRIMARY,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  outline: 'none',
                  boxShadow: SHADOWS.GLOW_PRIMARY
                }}
                autoFocus
                maxLength={30}
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
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
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.PRIMARY;
                  e.currentTarget.style.color = COLORS.PRIMARY;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
                  e.currentTarget.style.color = 'white';
                }}
              >
                {currentPlayer.name}
              </button>
            )}
          </div>

          {/* Warbond Selection */}
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: COLORS.PRIMARY, marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: SHADOWS.GLOW_PRIMARY }}>
              ▸ SELECT WARBONDS
            </h2>
            
            {/* Standard Warbonds */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.TEXT_SECONDARY, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.15em', borderLeft: `4px solid ${COLORS.PRIMARY}`, paddingLeft: '12px' }}>
                STANDARD (FREE)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {standardWarbonds.map(wb => (
                  <WarbondCard
                    key={wb.id}
                    warbond={wb}
                    selected={currentPlayer.warbonds.includes(wb.id)}
                    onToggle={() => toggleWarbond(wb.id)}
                    disabled={wb.id === 'helldivers_mobilize'} // Always include
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
                    selected={currentPlayer.warbonds.includes(wb.id)}
                    onToggle={() => toggleWarbond(wb.id)}
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
                    selected={currentPlayer.warbonds.includes(wb.id)}
                    onToggle={() => toggleWarbond(wb.id)}
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
                  checked={currentPlayer.includeSuperstore}
                  onChange={(e) => updatePlayer(currentPlayerIndex, { includeSuperstore: e.target.checked })}
                  style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: COLORS.ACCENT_PURPLE }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '16px 32px',
              backgroundColor: 'transparent',
              color: COLORS.TEXT_MUTED,
              border: `2px solid ${COLORS.CARD_BORDER}`,
              borderRadius: '4px',
              fontWeight: '900',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
              e.currentTarget.style.borderColor = COLORS.TEXT_DISABLED;
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
              e.currentTarget.style.color = COLORS.TEXT_MUTED;
            }}
          >
            ← BACK TO MENU
          </button>

          <div style={{ display: 'flex', gap: '16px' }}>
            {currentPlayerIndex > 0 && (
              <button
                onClick={goToPreviousPlayer}
                style={{
                  padding: '16px 32px',
                  backgroundColor: 'transparent',
                  color: COLORS.TEXT_MUTED,
                  border: `2px solid ${COLORS.CARD_BORDER}`,
                  borderRadius: '4px',
                  fontWeight: '900',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
                  e.currentTarget.style.borderColor = COLORS.TEXT_DISABLED;
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = COLORS.CARD_BORDER;
                  e.currentTarget.style.color = COLORS.TEXT_MUTED;
                }}
              >
                ← PREVIOUS HELLDIVER
              </button>
            )}
            <button
              onClick={goToNextPlayer}
              style={{
                ...BUTTON_STYLES.PRIMARY,
                padding: '16px 32px',
                borderRadius: '4px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_HOVER;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = SHADOWS.BUTTON_PRIMARY;
              }}
            >
              {currentPlayerIndex < players.length - 1 ? (
                <>
                  NEXT HELLDIVER <ChevronRight size={20} />
                </>
              ) : (
                <>
                  START RUN <CheckCircle size={20} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Player Summary */}
        <div style={{ backgroundColor: COLORS.CARD_BG, borderRadius: '8px', padding: '32px', border: '1px solid rgba(100, 116, 139, 0.5)', boxShadow: SHADOWS.CARD }}>
          <h3 style={{ fontSize: '24px', fontWeight: '900', color: COLORS.PRIMARY, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            ▸ SQUAD SUMMARY
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {players.map((p, i) => (
              <div 
                key={i} 
                style={{
                  backgroundColor: COLORS.BG_MAIN,
                  borderRadius: '4px',
                  padding: '20px',
                  border: i === currentPlayerIndex ? `2px solid ${COLORS.PRIMARY}` : `1px solid ${COLORS.CARD_BORDER}`,
                  boxShadow: i === currentPlayerIndex ? SHADOWS.GLOW_PRIMARY : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: '900', fontSize: '18px', marginBottom: '8px', color: i === currentPlayerIndex ? COLORS.PRIMARY : 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '13px', color: COLORS.TEXT_MUTED, fontWeight: 'bold' }}>
                  {p.warbonds.length} WARBOND{p.warbonds.length !== 1 ? 'S' : ''}
                  {p.includeSuperstore && ' + SUPERSTORE'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Warbond selection card component
function WarbondCard({ warbond, selected, onToggle, disabled = false }) {
  const getBorderColor = () => {
    if (disabled) return COLORS.CARD_BORDER;
    if (selected) {
      if (warbond.type === WARBOND_TYPE.LEGENDARY) return COLORS.ACCENT_PURPLE;
      if (warbond.type === WARBOND_TYPE.PREMIUM) return COLORS.ACCENT_BLUE;
      return COLORS.PRIMARY;
    }
    return COLORS.CARD_BORDER;
  };

  const getGlowColor = () => {
    if (warbond.type === WARBOND_TYPE.LEGENDARY) return SHADOWS.GLOW_PURPLE;
    if (warbond.type === WARBOND_TYPE.PREMIUM) return SHADOWS.GLOW_BLUE;
    return SHADOWS.GLOW_PRIMARY;
  };

  const getTextColor = () => {
    if (warbond.type === WARBOND_TYPE.LEGENDARY) return '#c084fc';
    if (warbond.type === WARBOND_TYPE.PREMIUM) return '#60a5fa';
    return COLORS.PRIMARY;
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
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.PRIMARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            ● REQUIRED
          </span>
        </div>
      )}
    </button>
  );
}
