import React from 'react';
import { RARITY } from '../constants/types';
import { getRareWeightMultiplier, SUBFACTION_CONFIG } from '../constants/balancingConfig';
import { COLORS, SHADOWS } from '../constants/theme';

/**
 * Debug component to visualize rarity draw weights
 * Shows how weights change based on player count and subfaction
 */
export default function RarityWeightDebug({ gameConfig }) {
  const calculateWeights = (playerCount, subfaction) => {
    const rareMultiplier = getRareWeightMultiplier(playerCount, subfaction);
    
    return {
      [RARITY.COMMON]: 60,
      [RARITY.UNCOMMON]: 35,
      [RARITY.RARE]: 10 + Math.round(5 * rareMultiplier),
      [RARITY.LEGENDARY]: 10 + Math.round(2 * rareMultiplier)
    };
  };

  const calculatePercentages = (weights) => {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    return Object.entries(weights).reduce((acc, [rarity, weight]) => {
      acc[rarity] = ((weight / total) * 100).toFixed(1);
      return acc;
    }, {});
  };

  const currentWeights = calculateWeights(gameConfig.playerCount, gameConfig.subfaction);
  const currentPercentages = calculatePercentages(currentWeights);

  const rarityColors = {
    [RARITY.COMMON]: '#9CA3AF',
    [RARITY.UNCOMMON]: '#60A5FA',
    [RARITY.RARE]: '#A78BFA',
    [RARITY.LEGENDARY]: '#FBBF24'
  };

  const subfactionName = SUBFACTION_CONFIG[gameConfig.subfaction]?.name || 'Unknown';
  const subfactionMultiplier = SUBFACTION_CONFIG[gameConfig.subfaction]?.rareWeightMultiplier || 1.0;

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.8)',
      border: `2px solid ${COLORS.ACCENT_YELLOW}`,
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto 24px auto',
      boxShadow: SHADOWS.GLOW
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: COLORS.ACCENT_YELLOW,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        Debug: Rarity Weight Visualization
      </h3>

      {/* Current Settings */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '20px',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0 0 4px 0' }}>
          <strong>Player Count:</strong> {gameConfig.playerCount} 
          {' '}(Rare Multiplier: {Math.pow(0.7, gameConfig.playerCount - 1).toFixed(3)}×)
        </p>
        <p style={{ margin: '0' }}>
          <strong>Subfaction:</strong> {subfactionName} 
          {' '}(Rare Multiplier: {subfactionMultiplier.toFixed(2)}×)
        </p>
      </div>

      {/* Current Weights Bar */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
          Current Draw Weights
        </h4>
        <div style={{
          display: 'flex',
          height: '60px',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          {Object.entries(currentWeights).map(([rarity, weight]) => {
            const percentage = currentPercentages[rarity];
            return (
              <div
                key={rarity}
                style={{
                  flex: weight,
                  background: rarityColors[rarity],
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  minWidth: '60px'
                }}
              >
                <div>{rarity}</div>
                <div style={{ fontSize: '10px' }}>{percentage}%</div>
              </div>
            );
          })}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          fontSize: '12px'
        }}>
          {Object.entries(currentWeights).map(([rarity, weight]) => (
            <div
              key={rarity}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px',
                borderRadius: '4px',
                borderLeft: `4px solid ${rarityColors[rarity]}`
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{rarity}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Weight: {weight}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
          Weight Comparison (by Player Count)
        </h4>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Players</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Common</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Uncommon</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Rare</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Legendary</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map(playerCount => {
                const weights = calculateWeights(playerCount, gameConfig.subfaction);
                const percentages = calculatePercentages(weights);
                const isCurrent = playerCount === gameConfig.playerCount;
                return (
                  <tr
                    key={playerCount}
                    style={{
                      background: isCurrent ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <td style={{ padding: '8px', fontWeight: isCurrent ? 'bold' : 'normal' }}>
                      {playerCount} {isCurrent && '←'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {weights[RARITY.COMMON]} ({percentages[RARITY.COMMON]}%)
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {weights[RARITY.UNCOMMON]} ({percentages[RARITY.UNCOMMON]}%)
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {weights[RARITY.RARE]} ({percentages[RARITY.RARE]}%)
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {weights[RARITY.LEGENDARY]} ({percentages[RARITY.LEGENDARY]}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subfaction Comparison */}
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
          Weight Comparison (by Subfaction @ {gameConfig.playerCount}P)
        </h4>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          overflow: 'hidden',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(0, 0, 0, 0.9)' }}>
              <tr style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Subfaction</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Mult</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Rare</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Legendary</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SUBFACTION_CONFIG).map(([subfactionId, config]) => {
                const weights = calculateWeights(gameConfig.playerCount, subfactionId);
                const isCurrent = subfactionId === gameConfig.subfaction;
                return (
                  <tr
                    key={subfactionId}
                    style={{
                      background: isCurrent ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <td style={{ padding: '6px', fontWeight: isCurrent ? 'bold' : 'normal' }}>
                      {config.name} {isCurrent && '←'}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      {config.rareWeightMultiplier.toFixed(2)}×
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      {weights[RARITY.RARE]}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      {weights[RARITY.LEGENDARY]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(251, 191, 36, 0.1)',
        borderLeft: `4px solid ${COLORS.ACCENT_YELLOW}`,
        borderRadius: '4px',
        fontSize: '12px',
        opacity: 0.8
      }}>
        <strong>Note:</strong> Weights shown are base rarity weights before additional modifiers like faction synergy, 
        AT requirements, or backpack restrictions are applied.
      </div>
    </div>
  );
}
