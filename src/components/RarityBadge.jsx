import React from 'react';
import { RARITY } from '../constants/types';

/**
 * RarityBadge component displays a color-coded badge for item rarity
 */
export default function RarityBadge({ rarity }) {
  const colors = {
    [RARITY.COMMON]: { bg: '#6b7280', color: 'white' },
    [RARITY.UNCOMMON]: { bg: '#22c55e', color: 'black' },
    [RARITY.RARE]: { bg: '#f97316', color: 'black' },
    [RARITY.LEGENDARY]: { bg: '#9333ea', color: 'white' }
  };
  const style = colors[rarity] || colors[RARITY.COMMON];
  return (
    <span style={{
      fontSize: '10px',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: style.bg,
      color: style.color
    }}>
      {rarity}
    </span>
  );
}
