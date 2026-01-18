import React from 'react';
import { DIFFICULTY_CONFIG, getMissionsForDifficulty } from '../constants/gameConfig';
import { getFactionColors } from '../constants/theme';
import { SUBFACTION_CONFIG } from '../constants/balancingConfig';

/**
 * Mission Progress Indicator Component
 * Shows hollow and filled circles for mission progress in Endurance Mode
 */
function MissionProgressIndicator({ currentMission, totalMissions, factionColors }) {
  const circles = [];
  for (let i = 1; i <= totalMissions; i++) {
    const isComplete = i < currentMission;
    const isCurrent = i === currentMission;
    circles.push(
      <div
        key={i}
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: `2px solid ${factionColors.PRIMARY}`,
          backgroundColor: isComplete ? factionColors.PRIMARY : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        title={`Mission ${i}${isComplete ? ' (Complete)' : isCurrent ? ' (Current)' : ''}`}
      >
        {isCurrent && (
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: factionColors.PRIMARY
          }} />
        )}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {circles}
    </div>
  );
}

/**
 * Game header component showing current difficulty, stats, and action buttons
 */
export default function GameHeader({ 
  currentDiff, 
  currentMission,
  enduranceMode,
  requisition, 
  faction,
  subfaction,
  samples,
  onExport 
}) {
  const factionColors = getFactionColors(faction);
  const subfactionName = SUBFACTION_CONFIG[subfaction]?.name || 'Unknown';
  const totalMissions = enduranceMode ? getMissionsForDifficulty(currentDiff) : 1;
  
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
              Theater: {faction} - {subfactionName}
            </div>
          </div>
          
          {/* Endurance Mode Mission Progress */}
          {enduranceMode && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginLeft: '16px',
              padding: '8px 12px',
              backgroundColor: 'rgba(100, 116, 139, 0.2)',
              borderRadius: '4px',
              border: '1px solid rgba(100, 116, 139, 0.3)'
            }}>
              <span style={{ 
                fontSize: '11px', 
                color: '#94a3b8', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Operation
              </span>
              <MissionProgressIndicator 
                currentMission={currentMission || 1} 
                totalMissions={totalMissions}
                factionColors={factionColors}
              />
              <span style={{ 
                fontSize: '11px', 
                color: factionColors.PRIMARY,
                fontWeight: 'bold'
              }}>
                {currentMission || 1}/{totalMissions}
              </span>
            </div>
          )}
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
              {Math.floor(requisition)}
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
        </div>
      </div>
    </div>
  );
}
