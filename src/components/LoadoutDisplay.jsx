import React from 'react';
import { Lock, Unlock, Wifi, WifiOff } from 'lucide-react';
import { getFactionColors } from '../constants/theme';
import { TYPE } from '../constants/types';

/**
 * Player loadout display component
 */
export default function LoadoutDisplay({ 
  player, 
  getItemById, 
  getArmorComboDisplayName, 
  faction,
  requisition,
  slotLockCost,
  maxLockedSlots,
  onLockSlot,
  onUnlockSlot,
  isConnected = true,
  isMultiplayer = false
}) {
  const factionColors = getFactionColors(faction);
  
  // Guard against undefined player or loadout
  if (!player || !player.loadout) {
    return (
      <div style={{ backgroundColor: '#283548', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#1f2937', padding: '12px', borderBottom: '1px solid rgba(100, 116, 139, 0.5)' }}>
          <h3 style={{ fontWeight: 'bold', color: '#64748b', margin: 0 }}>Loading...</h3>
        </div>
        <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
          Waiting for player data...
        </div>
      </div>
    );
  }
 
  // Get the equipped armor
  const equippedArmor = getItemById(player.loadout.armor);
  
  // Display armor combo if we have a helper function and armor is equipped
  const armorDisplayName = equippedArmor && getArmorComboDisplayName
    ? getArmorComboDisplayName(equippedArmor.passive, equippedArmor.armorClass, player.inventory)
    : equippedArmor?.name || 'None';

  const lockedSlots = player.lockedSlots || [];

  const renderSlotWithLock = (label, value, slotType) => {
    const isLocked = lockedSlots.includes(slotType);
    const canLock = !isLocked && requisition >= slotLockCost && lockedSlots.length < maxLockedSlots;
    const canUnlock = isLocked;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
          <div style={{ 
            fontSize: label === 'Primary' ? '14px' : '12px', 
            fontWeight: label === 'Primary' ? 'bold' : 'normal',
            color: label === 'Primary' ? factionColors.PRIMARY : (label === 'Secondary' ? 'white' : '#cbd5e1'),
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }} title={value}>
            {value}
          </div>
        </div>
        {onLockSlot && onUnlockSlot && (
          <button
            onClick={() => isLocked ? onUnlockSlot(player.id, slotType) : onLockSlot(player.id, slotType)}
            disabled={!canLock && !canUnlock}
            style={{
              padding: '4px',
              backgroundColor: isLocked ? `${factionColors.PRIMARY}20` : 'transparent',
              border: isLocked ? `1px solid ${factionColors.PRIMARY}` : '1px solid rgba(100, 116, 139, 0.5)',
              borderRadius: '3px',
              cursor: (canLock || canUnlock) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLocked ? factionColors.PRIMARY : (canLock ? '#94a3b8' : '#334155'),
              transition: 'all 0.2s',
              minWidth: '24px',
              minHeight: '24px'
            }}
            onMouseEnter={(e) => {
              if (canLock || canUnlock) {
                e.currentTarget.style.borderColor = factionColors.PRIMARY;
                e.currentTarget.style.color = factionColors.PRIMARY;
              }
            }}
            onMouseLeave={(e) => {
              if (canLock || canUnlock) {
                e.currentTarget.style.borderColor = isLocked ? factionColors.PRIMARY : 'rgba(100, 116, 139, 0.5)';
                e.currentTarget.style.color = isLocked ? factionColors.PRIMARY : (canLock ? '#94a3b8' : '#334155');
              }
            }}
            title={isLocked ? 'Unlock slot (free)' : `Lock slot (${slotLockCost} Req)`}
          >
            {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
        )}
      </div>
    );
  };
  
  return (
    <div style={{ 
      backgroundColor: '#283548', 
      borderRadius: '8px', 
      border: `1px solid ${!isConnected && isMultiplayer ? 'rgba(239, 68, 68, 0.5)' : 'rgba(100, 116, 139, 0.5)'}`, 
      overflow: 'hidden',
      opacity: !isConnected && isMultiplayer ? 0.7 : 1
    }}>
      <div style={{ backgroundColor: '#1f2937', padding: '12px', borderBottom: '1px solid rgba(100, 116, 139, 0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{player.name}</h3>
          {/* Connection status indicator for multiplayer */}
          {isMultiplayer && (
            isConnected ? (
              <Wifi size={14} style={{ color: '#22c55e' }} title="Connected" />
            ) : (
              <WifiOff size={14} style={{ color: '#ef4444' }} title="Disconnected" />
            )
          )}
        </div>
        <span style={{ fontSize: '12px', color: !isConnected && isMultiplayer ? '#ef4444' : '#64748b' }}>
          {!isConnected && isMultiplayer ? 'DISCONNECTED' : 'Loadout Active'}
        </span>
      </div>
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* Primary */}
        <div style={{ gridColumn: 'span 2' }}>
          {renderSlotWithLock('Primary', getItemById(player.loadout.primary)?.name || 'None', TYPE.PRIMARY)}
        </div>
        {/* Secondary */}
        <div style={{ gridColumn: 'span 2' }}>
          {renderSlotWithLock('Secondary', getItemById(player.loadout.secondary)?.name, TYPE.SECONDARY)}
        </div>
        
        {/* Grenade */}
        <div style={{ gridColumn: 'span 2' }}>
          {renderSlotWithLock('Grenade', getItemById(player.loadout.grenade)?.name, TYPE.GRENADE)}
        </div>

         {/* Armor */}
         <div style={{ gridColumn: 'span 2' }}>
          {renderSlotWithLock('Armor', armorDisplayName, TYPE.ARMOR)}
        </div>

         {/* Booster */}
         <div style={{ gridColumn: 'span 2' }}>
           <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Booster</div>
           <div style={{ fontSize: '12px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getItemById(player.loadout.booster)?.name || 'None'}</div>
        </div>

         {/* Lock info */}
         {lockedSlots.length > 0 && (
           <div style={{ gridColumn: 'span 2' }}>
             <div style={{ 
               fontSize: '9px', 
               color: factionColors.PRIMARY,
               backgroundColor: `${factionColors.PRIMARY}15`,
               padding: '4px 8px',
               borderRadius: '3px',
               border: `1px solid ${factionColors.PRIMARY}40`
             }}>
               🔒 {lockedSlots.length}/{maxLockedSlots} slots locked
             </div>
           </div>
         )}

        {/* Stratagems */}
        <div style={{ gridColumn: 'span 4', marginTop: '8px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Stratagems</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {(player.loadout.stratagems || [null, null, null, null]).map((sid, i) => (
              <div key={i} style={{ backgroundColor: '#1f2937', height: '64px', borderRadius: '4px', border: '1px solid rgba(71, 85, 105, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', textAlign: 'center', position: 'relative' }}>
                {sid ? (
                   <span style={{ fontSize: '9px', lineHeight: '1.2', color: 'white', fontWeight: '600' }}>{getItemById(sid)?.name}</span>
                ) : <span style={{ color: '#334155', fontSize: '12px' }}>EMPTY</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

