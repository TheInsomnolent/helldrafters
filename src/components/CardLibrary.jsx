import React from 'react';
import { Link } from 'react-router-dom';
import { MASTER_DB } from '../data/itemsByWarbond';
import { TYPE, RARITY } from '../constants/types';
import { ARMOR_PASSIVE_DESCRIPTIONS } from '../constants/armorPassives';
import { getWarbondById } from '../constants/warbonds';
import { getItemIconUrl } from '../utils/iconHelpers';
import { getFactionColors } from '../constants/theme';

// Reusable RarityBadge component
const RarityBadge = ({ rarity }) => {
  const rarityColors = {
    [RARITY.COMMON]: '#64748b',
    [RARITY.UNCOMMON]: '#3b82f6',
    [RARITY.RARE]: '#a855f7',
    [RARITY.LEGENDARY]: '#f59e0b'
  };
  
  const color = rarityColors[rarity] || '#64748b';
  
  return (
    <div style={{
      fontSize: '10px',
      fontWeight: 'bold',
      color: 'white',
      backgroundColor: color,
      padding: '4px 8px',
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {rarity}
    </div>
  );
};

// Card component for displaying individual items
const ItemCard = ({ item }) => {
  const factionColors = getFactionColors('helldivers');
  
  if (!item || !item.name) {
    return null;
  }
  
  const displayItem = item;
  const displayName = item.name;
  
  let armorPassiveDescription = null;
  let armorPassiveKey = null;
  const isArmorItem = item?.type === TYPE.ARMOR;
  
  if (isArmorItem) {
    armorPassiveKey = item.passive;
    if (armorPassiveKey) {
      const description = ARMOR_PASSIVE_DESCRIPTIONS[armorPassiveKey];
      armorPassiveDescription = description || 'Passive effect details unavailable.';
    }
  }
  
  // Get warbond info for display
  const warbondId = displayItem.warbond;
  const isSuperstore = displayItem.superstore;
  const warbondInfo = warbondId ? getWarbondById(warbondId) : null;
  const sourceName = isSuperstore ? 'Superstore' : (warbondInfo?.name || 'Unknown');
  const tags = displayItem.tags || [];
  
  // Show armor class in tags
  const armorClass = item.armorClass ? item.armorClass.slice(0, 1).toUpperCase() + item.armorClass.slice(1) : null;
  if (armorClass && !tags.includes(armorClass)) {
    tags.push(armorClass);
  }
  
  // Get item icon URL
  const iconUrl = getItemIconUrl(displayItem);
  
  return (
    <div 
      style={{
        position: 'relative',
        backgroundColor: '#283548',
        border: '2px solid rgba(100, 116, 139, 0.5)',
        padding: '16px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '280px',
        width: '280px',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <RarityBadge rarity={displayItem.rarity} />
        <div style={{ color: factionColors.PRIMARY, fontSize: '12px', fontFamily: 'monospace' }}>
          {displayItem.type}
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
        fontSize: '18px', 
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
          {tags.map((tag, idx) => (
            <span key={`${tag}-${idx}`} style={{
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
              Armor Passive - {armorPassiveKey}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: '1.4', marginTop: '4px' }}>
              {armorPassiveDescription}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(71, 85, 105, 0.5)' }}>
        <div style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Item ID: {item.id}
        </div>
      </div>
    </div>
  );
};

// Main CardLibrary component
export default function CardLibrary() {
  const factionColors = getFactionColors('helldivers');
  
  // Group items by warbond
  const itemsByWarbond = MASTER_DB.reduce((acc, item) => {
    const warbondId = item.superstore ? 'superstore' : (item.warbond || 'unknown');
    if (!acc[warbondId]) {
      acc[warbondId] = [];
    }
    acc[warbondId].push(item);
    return acc;
  }, {});
  
  // Sort warbonds for consistent display
  const sortedWarbonds = Object.keys(itemsByWarbond).sort();
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        border: `2px solid ${factionColors.PRIMARY}`
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: factionColors.PRIMARY,
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          Card Library
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          marginBottom: '10px'
        }}>
          Development Route - All Items from All Warbonds
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          fontSize: '12px',
          color: '#cbd5e1'
        }}>
          <div>Total Items: <strong>{MASTER_DB.length}</strong></div>
          <div>Warbonds: <strong>{sortedWarbonds.length}</strong></div>
        </div>
      </div>
      
      {/* Items grouped by warbond */}
      {sortedWarbonds.map(warbondId => {
        const items = itemsByWarbond[warbondId];
        const warbondInfo = warbondId === 'superstore' ? { name: 'Superstore' } : getWarbondById(warbondId);
        const warbondName = warbondInfo?.name || warbondId;
        
        return (
          <div key={warbondId} style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: warbondId === 'superstore' ? '#c084fc' : '#60a5fa',
              marginBottom: '20px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              paddingBottom: '10px',
              borderBottom: '2px solid rgba(100, 116, 139, 0.3)'
            }}>
              {warbondName} ({items.length} items)
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {items.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
      
      {/* Back to home link */}
      <div style={{
        textAlign: 'center',
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(100, 116, 139, 0.3)'
      }}>
        <Link 
          to="/"
          style={{
            color: factionColors.PRIMARY,
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          ← Back to Game
        </Link>
      </div>
    </div>
  );
}
