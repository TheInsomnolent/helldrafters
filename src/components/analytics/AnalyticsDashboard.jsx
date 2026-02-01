/**
 * Analytics Dashboard Component
 * 
 * Main container for all post-run analytics charts and sharing features
 */

import React, { useRef } from 'react';
import { COLORS, getFactionColors, BUTTON_STYLES } from '../../constants/theme';
import { DIFFICULTY_CONFIG } from '../../constants/gameConfig';
import { SUBFACTION_CONFIG } from '../../constants/balancingConfig';
import SamplesChart from './SamplesChart';
import RequisitionChart from './RequisitionChart';
import LoadoutTimeline from './LoadoutTimeline';
import MissionRadar from './MissionRadar';
import DeathTimeline from './DeathTimeline';
import SharePanel from './SharePanel';

// Format duration in ms to readable string
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds % 60}s`;
};

// Get difficulty name
const getDifficultyName = (level) => {
  const config = DIFFICULTY_CONFIG.find(d => d.level === level);
  return config?.name || `Difficulty ${level}`;
};

// Get faction display name
const getFactionDisplayName = (factionId) => {
  switch (factionId) {
    case 'terminid':
      return 'Terminids';
    case 'automaton':
      return 'Automatons';
    case 'illuminate':
      return 'Illuminate';
    default:
      return factionId || 'Unknown';
  }
};

// Get faction emoji
const getFactionEmoji = (factionId) => {
  switch (factionId) {
    case 'terminid':
      return '🐛';
    case 'automaton':
      return '🤖';
    case 'illuminate':
      return '👽';
    default:
      return '❓';
  }
};

const AnalyticsDashboard = ({ 
  analyticsData, 
  outcome, // 'victory' or 'defeat'
  faction = 'terminid',
  subfaction = null,
  players = [],
  onClose,
  onViewHistory 
}) => {
  const dashboardRef = useRef(null);
  const factionColors = getFactionColors(faction);
  
  const isVictory = outcome === 'victory';
  const chartData = analyticsData ? {
    samplesData: analyticsData.sampleSnapshots?.map(s => ({
      time: s.timestamp,
      common: s.common,
      rare: s.rare,
      superRare: s.superRare,
      event: s.eventName
    })) || [],
    requisitionData: analyticsData.requisitionSnapshots?.map(r => ({
      time: r.timestamp,
      amount: r.amount,
      change: r.change,
      reason: r.reason,
      player: r.playerName
    })) || [],
    loadoutTimeline: Object.entries(analyticsData.playerLoadouts || {}).map(([playerId, loadouts]) => ({
      playerId: parseInt(playerId),
      playerName: loadouts[0]?.playerName || `Helldiver ${playerId}`,
      changes: loadouts
    })),
    missionStars: analyticsData.missionResults || [],
    deathTimeline: analyticsData.playerDeaths || [],
    eventMarkers: analyticsData.eventOccurrences?.map(e => ({
      time: e.timestamp,
      name: e.eventName,
      type: e.eventType,
      difficulty: e.difficulty
    })) || []
  } : null;
  
  const duration = analyticsData?.finalStats?.duration || 
    (analyticsData?.endTime && analyticsData?.startTime 
      ? analyticsData.endTime - analyticsData.startTime 
      : 0);

  // Get subfaction display name
  const subfactionName = subfaction && SUBFACTION_CONFIG[subfaction] 
    ? SUBFACTION_CONFIG[subfaction].name 
    : null;

  // Check if faction was changed during the run (e.g., by an event)
  const startingFaction = analyticsData?.gameConfig?.faction;
  const startingSubfaction = analyticsData?.gameConfig?.subfaction;
  const factionWasChanged = startingFaction && startingFaction !== faction;
  const startingFactionName = startingFaction ? getFactionDisplayName(startingFaction) : null;
  const startingSubfactionName = startingSubfaction && SUBFACTION_CONFIG[startingSubfaction] 
    ? SUBFACTION_CONFIG[startingSubfaction].name 
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: COLORS.BG_MAIN,
      backgroundImage: `linear-gradient(to bottom, ${COLORS.BG_GRADIENT_START}, ${COLORS.BG_GRADIENT_END})`,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div 
        ref={dashboardRef}
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px',
          backgroundColor: COLORS.CARD_BG,
          borderRadius: '16px',
          border: `2px solid ${isVictory ? COLORS.ACCENT_GREEN : COLORS.ACCENT_RED}`,
          boxShadow: isVictory 
            ? `0 0 40px rgba(34, 197, 94, 0.3)` 
            : `0 0 40px rgba(239, 68, 68, 0.3)`
        }}
      >
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '24px',
          background: isVictory
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
          borderRadius: '12px',
          border: `1px solid ${isVictory ? COLORS.ACCENT_GREEN : COLORS.ACCENT_RED}`
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>
            {isVictory ? '🏆' : '💀'}
          </div>
          <h1 style={{
            color: isVictory ? COLORS.ACCENT_GREEN : COLORS.ACCENT_RED,
            fontSize: '32px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            margin: '0 0 8px 0',
            textShadow: isVictory
              ? '0 0 20px rgba(34, 197, 94, 0.5)'
              : '0 0 20px rgba(239, 68, 68, 0.5)'
          }}>
            {isVictory ? 'DEMOCRACY MANIFESTED' : 'DISHONORABLE DISCHARGE'}
          </h1>
          <p style={{
            color: COLORS.TEXT_SECONDARY,
            fontSize: '14px',
            margin: 0,
            letterSpacing: '0.1em'
          }}>
            {isVictory 
              ? 'Super Earth salutes your service, Helldiver!' 
              : 'Your sacrifice will not be forgotten.'}
          </p>
        </div>

        {/* Quick Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {/* Difficulty */}
          <div style={{
            backgroundColor: COLORS.CARD_INNER,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: `1px solid ${COLORS.CARD_BORDER}`
          }}>
            <p style={{ color: COLORS.TEXT_MUTED, fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Max Difficulty
            </p>
            <p style={{ color: factionColors.PRIMARY, fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              {analyticsData?.finalStats?.finalDifficulty || 1}
            </p>
            <p style={{ color: COLORS.TEXT_SECONDARY, fontSize: '11px', margin: '4px 0 0 0' }}>
              {getDifficultyName(analyticsData?.finalStats?.finalDifficulty || 1)}
            </p>
          </div>
          
          {/* Duration */}
          <div style={{
            backgroundColor: COLORS.CARD_INNER,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: `1px solid ${COLORS.CARD_BORDER}`
          }}>
            <p style={{ color: COLORS.TEXT_MUTED, fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Duration
            </p>
            <p style={{ color: COLORS.PRIMARY, fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              {formatDuration(duration)}
            </p>
            <p style={{ color: COLORS.TEXT_SECONDARY, fontSize: '11px', margin: '4px 0 0 0' }}>
              Total Play Time
            </p>
          </div>
          
          {/* Squad Size */}
          <div style={{
            backgroundColor: COLORS.CARD_INNER,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: `1px solid ${COLORS.CARD_BORDER}`
          }}>
            <p style={{ color: COLORS.TEXT_MUTED, fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Squad Size
            </p>
            <p style={{ color: COLORS.ACCENT_BLUE, fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              {analyticsData?.finalStats?.playerCount || players.length || 1}
            </p>
            <p style={{ color: COLORS.TEXT_SECONDARY, fontSize: '11px', margin: '4px 0 0 0' }}>
              Helldivers
            </p>
          </div>
          
          {/* Total Events */}
          <div style={{
            backgroundColor: COLORS.CARD_INNER,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: `1px solid ${COLORS.CARD_BORDER}`
          }}>
            <p style={{ color: COLORS.TEXT_MUTED, fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Events
            </p>
            <p style={{ color: COLORS.ACCENT_PURPLE, fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              {analyticsData?.finalStats?.totalEvents || analyticsData?.eventOccurrences?.length || 0}
            </p>
            <p style={{ color: COLORS.TEXT_SECONDARY, fontSize: '11px', margin: '4px 0 0 0' }}>
              Encountered
            </p>
          </div>
          
          {/* Final Requisition */}
          <div style={{
            backgroundColor: COLORS.CARD_INNER,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: `1px solid ${COLORS.CARD_BORDER}`
          }}>
            <p style={{ color: COLORS.TEXT_MUTED, fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Final Requisition
            </p>
            <p style={{ color: COLORS.PRIMARY, fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              {Math.floor((analyticsData?.finalStats?.finalRequisition || 0) * 100) / 100}
            </p>
            <p style={{ color: COLORS.TEXT_SECONDARY, fontSize: '11px', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <img src="https://helldivers.wiki.gg/images/Requisition_Slip.svg" alt="" style={{ width: 14, height: 14 }} />
              Remaining
            </p>
          </div>
          
          {/* Casualties */}
          <div style={{
            backgroundColor: COLORS.CARD_INNER,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: `1px solid ${COLORS.CARD_BORDER}`
          }}>
            <p style={{ color: COLORS.TEXT_MUTED, fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Casualties
            </p>
            <p style={{ color: COLORS.ACCENT_RED, fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              {analyticsData?.finalStats?.totalDeaths || analyticsData?.playerDeaths?.length || 0}
            </p>
            <p style={{ color: COLORS.TEXT_SECONDARY, fontSize: '11px', margin: '4px 0 0 0' }}>
              💀 KIA
            </p>
          </div>
          
          {/* Enemy Faction */}
          <div style={{
            backgroundColor: COLORS.CARD_INNER,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: `1px solid ${factionColors.PRIMARY}40`,
            gridColumn: 'span 2'
          }}>
            <p style={{ color: COLORS.TEXT_MUTED, fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Enemy Forces
            </p>
            <p style={{ color: factionColors.PRIMARY, fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>{getFactionEmoji(faction)}</span>
              <span>{getFactionDisplayName(faction)}</span>
            </p>
            {subfactionName && (
              <p style={{ color: COLORS.TEXT_SECONDARY, fontSize: '13px', margin: '4px 0 0 0' }}>
                {subfactionName}
              </p>
            )}
            {factionWasChanged && (
              <p style={{ 
                color: COLORS.ACCENT_PURPLE, 
                fontSize: '11px', 
                margin: '8px 0 0 0',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                ⚡ Changed from {getFactionEmoji(startingFaction)} {startingFactionName}
                {startingSubfactionName && startingSubfactionName !== 'Standard' && ` (${startingSubfactionName})`}
              </p>
            )}
          </div>
        </div>

        {/* Charts Grid */}
        {chartData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Samples Chart - Full width */}
            <div style={{ gridColumn: 'span 2' }}>
              <SamplesChart 
                data={chartData.samplesData} 
                missionStars={chartData.missionStars}
                eventMarkers={chartData.eventMarkers}
                height={220}
              />
            </div>
            
            {/* Requisition Chart */}
            <div style={{ gridColumn: 'span 2' }}>
              <RequisitionChart 
                data={chartData.requisitionData}
                missionStars={chartData.missionStars}
                height={200}
              />
            </div>
            
            {/* Mission Radar */}
            <div>
              <MissionRadar 
                data={chartData.missionStars}
                faction={faction}
                height={250}
              />
            </div>
            
            {/* Death Timeline */}
            <div>
              <DeathTimeline 
                data={chartData.deathTimeline}
                totalMissions={analyticsData?.finalStats?.totalMissions || analyticsData?.missionResults?.length || 10}
                players={players}
              />
            </div>
            
            {/* Loadout Timeline - Full width */}
            <div style={{ gridColumn: 'span 2' }}>
              <LoadoutTimeline 
                data={chartData.loadoutTimeline}
                totalMissions={analyticsData?.finalStats?.totalMissions || analyticsData?.missionResults?.length || 10}
                missionStars={chartData.missionStars}
              />
            </div>
          </div>
        )}

        {/* Share Panel */}
        <div style={{ marginBottom: '24px' }}>
          <SharePanel 
            targetRef={dashboardRef}
            runData={analyticsData}
            outcome={outcome}
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={onClose}
            style={{
              ...BUTTON_STYLES.PRIMARY,
              padding: '14px 32px',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: factionColors.PRIMARY,
              border: `2px solid ${factionColors.PRIMARY}`,
              boxShadow: factionColors.SHADOW
            }}
          >
            Return to Menu
          </button>
          
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              style={{
                ...BUTTON_STYLES.SECONDARY,
                padding: '14px 32px',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              View Past Runs
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
