import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { DIFFICULTY_CONFIG } from '../constants/gameConfig';
import { getFactionColors } from '../constants/theme';

/**
 * Game header component showing current difficulty, stats, and action buttons
 */
export default function GameHeader({ 
  currentDiff, 
  requisition, 
  lives, 
  faction,
  samples,
  onExport,
  onCancelRun 
}) {
  const factionColors = getFactionColors(faction);
  return (
    <div style={{ 
      backgroundColor: '#0f1419', 
      borderBottom: `1px solid ${factionColors.PRIMARY}4D`, 
      padding: '16px', 
      position: 'sticky', 
      top: 0, 
      zIndex: 10 
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            backgroundColor: factionColors.PRIMARY, 
            color: 'black', 
            padding: '4px 12px', 
            fontWeight: '900', 
            fontSize: '20px', 
            borderRadius: '4px' 
          }}>
            D{currentDiff}
          </div>
          <div>
            <h1 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              color: 'white', 
              letterSpacing: '1px', 
              margin: 0 
            }}>
              {DIFFICULTY_CONFIG[currentDiff-1]?.name}
            </h1>
            <div style={{ 
              fontSize: '12px', 
              color: factionColors.PRIMARY, 
              fontFamily: 'monospace' 
            }}>
              Theater: {faction}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Requisition */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: factionColors.PRIMARY }}>
            <img 
              src="https://helldivers.wiki.gg/images/Requisition_Slip.svg" 
              alt="Requisition" 
              style={{ width: '20px', height: '20px' }}
            />
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '20px' }}>
              {requisition}
            </span>
          </div>
          
          {/* Samples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Common Samples */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <img 
                src="https://helldivers.wiki.gg/images/Common_Sample_Logo.svg" 
                alt="Common Samples" 
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px', color: '#22c55e' }}>
                {samples?.common || 0}
              </span>
            </div>
            
            {/* Rare Samples */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <img 
                src="https://helldivers.wiki.gg/images/Rare_Sample_Logo.svg" 
                alt="Rare Samples" 
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px', color: '#f97316' }}>
                {samples?.rare || 0}
              </span>
            </div>
            
            {/* Super Rare Samples */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <img 
                src="https://helldivers.wiki.gg/images/Super_Sample_Logo.svg" 
                alt="Super Rare Samples" 
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px', color: '#a855f7' }}>
                {samples?.superRare || 0}
              </span>
            </div>
          </div>
          
          {/* Lives */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
            <AlertTriangle size={18} />
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '20px' }}>
              {lives} Lives
            </span>
          </div>
          
          {/* Action Buttons */}
          <button
            onClick={onExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(100, 116, 139, 0.3)',
              color: '#94a3b8',
              border: '1px solid rgba(100, 116, 139, 0.5)',
              borderRadius: '4px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.5)';
              e.currentTarget.style.color = factionColors.PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            💾 Export
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel this run? All progress will be lost.')) {
                onCancelRun();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(127, 29, 29, 0.3)',
              color: '#ef4444',
              border: '1px solid #7f1d1d',
              borderRadius: '4px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)'}
          >
            <XCircle size={16} />
            Cancel Run
          </button>
        </div>
      </div>
    </div>
  );
}
