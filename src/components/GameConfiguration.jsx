/**
 * GameConfiguration - Reusable game configuration component
 * Used in both solo config screen and multiplayer host screen
 */

import React from 'react';
import { getFactionColors } from '../constants/theme';
import { getSubfactionsForFaction, SUBFACTION_CONFIG } from '../constants/balancingConfig';

export default function GameConfiguration({ 
  gameConfig, 
  eventsEnabled, 
  onUpdateGameConfig, 
  onSetSubfaction,
  onSetEventsEnabled,
  factionColors: providedFactionColors 
}) {
  const factionColors = providedFactionColors || getFactionColors(gameConfig.faction);

  return (
    <div>
      {/* Theatre Selection */}
      <div style={{ marginBottom: '40px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
          Theatre of War
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {['terminid', 'automaton', 'illuminate'].map(faction => {
            const isSelected = gameConfig.faction === faction;
            const colors = getFactionColors(faction);
            
            return (
              <button 
                key={faction}
                onClick={() => {
                  onUpdateGameConfig({ faction });
                  // Auto-select first subfaction for this faction
                  const subfactions = getSubfactionsForFaction(faction);
                  if (subfactions.length > 0) {
                    onSetSubfaction(subfactions[0]);
                  }
                }}
                style={{
                  padding: '16px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  backgroundColor: isSelected ? `${colors.PRIMARY}20` : 'transparent',
                  color: isSelected ? colors.PRIMARY : '#64748b',
                  border: isSelected ? `2px solid ${colors.PRIMARY}` : '1px solid rgba(100, 116, 139, 0.5)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  letterSpacing: '0.5px'
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
                {faction === 'terminid' ? 'Terminids' : faction === 'automaton' ? 'Automatons' : 'Illuminate'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subfaction */}
      <div style={{ marginBottom: '40px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
          Enemy Variant
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {getSubfactionsForFaction(gameConfig.faction).map(subfaction => {
            const isSelected = gameConfig.subfaction === subfaction;
            const config = SUBFACTION_CONFIG[subfaction];
            
            return (
              <button 
                key={subfaction}
                onClick={() => onSetSubfaction(subfaction)}
                style={{
                  padding: '16px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  fontSize: '13px',
                  letterSpacing: '0.5px',
                  backgroundColor: isSelected ? `${factionColors.PRIMARY}15` : 'transparent',
                  color: isSelected ? factionColors.PRIMARY : '#64748b',
                  border: isSelected ? `2px solid ${factionColors.PRIMARY}` : '1px solid rgba(100, 116, 139, 0.5)',
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
                <div style={{ fontSize: '11px', color: isSelected ? factionColors.PRIMARY : '#64748b', opacity: 0.8 }}>
                  {config.description} • Req: {config.reqMultiplier}x • Rares: {config.rareWeightMultiplier}x
                </div>
              </button>
            );
          })}
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
              onChange={(e) => onUpdateGameConfig({ globalUniqueness: e.target.checked })}
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
              onChange={(e) => onUpdateGameConfig({ burnCards: e.target.checked })}
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
              onChange={(e) => onUpdateGameConfig({ customStart: e.target.checked })}
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
              onChange={(e) => onSetEventsEnabled(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Enable Events</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Random high-risk, high-reward events between missions</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.enduranceMode ? `${factionColors.PRIMARY}1A` : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            <input 
              type="checkbox" 
              checked={gameConfig.enduranceMode}
              onChange={(e) => onUpdateGameConfig({ enduranceMode: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Endurance Mode</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Complete full operations (1-3 missions) at each difficulty. Draft rewards only at operation end.</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.endlessMode ? `${factionColors.PRIMARY}1A` : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            <input 
              type="checkbox" 
              checked={gameConfig.endlessMode}
              onChange={(e) => onUpdateGameConfig({ endlessMode: e.target.checked })}
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
              onChange={(e) => onUpdateGameConfig({ debugEventsMode: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Debug Events Mode</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Manually trigger events from dashboard for testing</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.brutalityMode ? `${factionColors.PRIMARY}1A` : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            <input 
              type="checkbox" 
              checked={gameConfig.brutalityMode}
              onChange={(e) => onUpdateGameConfig({ brutalityMode: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Brutality Mode</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Non-extracted Helldivers sacrifice loadout items (down to Peacemaker & B-01). If disabled, only all-fail triggers sacrifice.</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: gameConfig.showCardPool ? `${factionColors.PRIMARY}1A` : 'transparent', borderRadius: '4px', border: '1px solid rgba(100, 116, 139, 0.5)' }}>
            <input 
              type="checkbox" 
              checked={gameConfig.showCardPool}
              onChange={(e) => onUpdateGameConfig({ showCardPool: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ color: factionColors.PRIMARY, fontWeight: 'bold', fontSize: '14px' }}>Show Card Pool</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Display rarity weights and card pool during draft</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
