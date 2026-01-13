import React from 'react';

/**
 * Player loadout display component
 */
export default function LoadoutDisplay({ player, getItemById }) {
  return (
    <div style={{ backgroundColor: '#283548', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.5)', overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#1f2937', padding: '12px', borderBottom: '1px solid rgba(100, 116, 139, 0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{player.name}</h3>
        <span style={{ fontSize: '12px', color: '#64748b' }}>Loadout Active</span>
      </div>
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* Primary */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Primary</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F5C642', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getItemById(player.loadout.primary)?.name}>
            {getItemById(player.loadout.primary)?.name || 'None'}
          </div>
        </div>
        {/* Secondary */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Secondary</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getItemById(player.loadout.secondary)?.name}>
            {getItemById(player.loadout.secondary)?.name}
          </div>
        </div>
        
        {/* Grenade */}
        <div style={{ gridColumn: 'span 2' }}>
           <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Grenade</div>
           <div style={{ fontSize: '12px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getItemById(player.loadout.grenade)?.name}</div>
        </div>

         {/* Armor */}
         <div style={{ gridColumn: 'span 2' }}>
           <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Armor</div>
           <div style={{ fontSize: '12px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getItemById(player.loadout.armor)?.name}</div>
        </div>

         {/* Booster */}
         <div style={{ gridColumn: 'span 2' }}>
           <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Booster</div>
           <div style={{ fontSize: '12px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getItemById(player.loadout.booster)?.name || 'None'}</div>
        </div>

         {/* Spacer for better alignment */}
         <div style={{ gridColumn: 'span 2' }}></div>

        {/* Stratagems */}
        <div style={{ gridColumn: 'span 4', marginTop: '8px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Stratagems</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {player.loadout.stratagems.map((sid, i) => (
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
