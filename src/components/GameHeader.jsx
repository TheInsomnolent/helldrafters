import React from 'react';
import { Trophy, AlertTriangle, XCircle } from 'lucide-react';
import { DIFFICULTY_CONFIG } from '../constants/gameConfig';

/**
 * Game header component showing current difficulty, stats, and action buttons
 */
export default function GameHeader({ 
  currentDiff, 
  requisition, 
  lives, 
  faction,
  onExport,
  onCancelRun 
}) {
  return (
    <div style={{ 
      backgroundColor: '#0f1419', 
      borderBottom: '1px solid rgba(245, 198, 66, 0.3)', 
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
            backgroundColor: '#F5C642', 
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
              color: '#F5C642', 
              fontFamily: 'monospace' 
            }}>
              Theater: {faction}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F5C642' }}>
            <Trophy size={18} />
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '20px' }}>
              {requisition}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
            <AlertTriangle size={18} />
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '20px' }}>
              {lives} Lives
            </span>
          </div>
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
              e.currentTarget.style.color = '#F5C642';
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
