/**
 * Mission Radar Chart
 * 
 * Displays mission star ratings in a radar/spider chart format
 */

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { COLORS, getFactionColors } from '../../constants/theme';
import { DIFFICULTY_CONFIG } from '../../constants/gameConfig';

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0]?.payload;
  
  return (
    <div style={{
      backgroundColor: COLORS.CARD_BG,
      border: `1px solid ${COLORS.CARD_BORDER}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      <p style={{ 
        color: COLORS.PRIMARY, 
        margin: '0 0 4px 0',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {data?.difficultyName}
      </p>
      <p style={{ 
        color: COLORS.TEXT_SECONDARY, 
        margin: '0 0 4px 0',
        fontSize: '12px'
      }}>
        Star Rating: {'⭐'.repeat(data?.stars || 0)}
      </p>
      {data?.count > 1 && (
        <p style={{ 
          color: COLORS.TEXT_MUTED, 
          margin: '0',
          fontSize: '11px',
          fontStyle: 'italic'
        }}>
          Played {data.count} times (avg: {data.avgStars}⭐)
        </p>
      )}
    </div>
  );
};

const MissionRadar = ({ data, faction = 'terminid', height = 300 }) => {
  const factionColors = getFactionColors(faction);
  
  if (!data || data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.TEXT_MUTED,
        backgroundColor: COLORS.CARD_INNER,
        borderRadius: '8px'
      }}>
        No mission data recorded
      </div>
    );
  }

  // Transform mission results into radar chart data
  // Group by difficulty and calculate average stars
  const difficultyData = {};
  
  data.forEach(mission => {
    const diffConfig = DIFFICULTY_CONFIG.find(d => d.level === mission.difficulty);
    const key = mission.difficulty;
    
    if (!difficultyData[key]) {
      difficultyData[key] = {
        difficulty: mission.difficulty,
        difficultyName: diffConfig?.name || `D${mission.difficulty}`,
        stars: 0,
        count: 0
      };
    }
    
    difficultyData[key].stars += mission.starRating;
    difficultyData[key].count += 1;
  });
  
  // Calculate averages and prepare chart data
  const chartData = Object.values(difficultyData)
    .map(d => ({
      ...d,
      stars: Math.round(d.stars / d.count),
      avgStars: (d.stars / d.count).toFixed(1),
      // Add indicator for repeated difficulties
      displayName: d.count > 1 ? `${d.difficultyName} (×${d.count})` : d.difficultyName
    }))
    .sort((a, b) => a.difficulty - b.difficulty);

  // Calculate total average for center display
  const totalStars = data.reduce((sum, m) => sum + m.starRating, 0);
  const avgStars = (totalStars / data.length).toFixed(1);

  return (
    <div style={{ 
      backgroundColor: COLORS.CARD_INNER, 
      borderRadius: '8px', 
      padding: '16px',
      border: `1px solid ${COLORS.CARD_BORDER}`
    }}>
      <h3 style={{ 
        color: COLORS.TEXT_PRIMARY, 
        margin: '0 0 8px 0',
        fontSize: '14px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '18px' }}>⭐</span>
        Mission Performance
      </h3>
      
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={factionColors.PRIMARY} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={factionColors.PRIMARY} stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            
            <PolarGrid 
              stroke={COLORS.CARD_BORDER}
              gridType="polygon"
            />
            
            <PolarAngleAxis 
              dataKey="displayName"
              tick={{ fill: COLORS.TEXT_SECONDARY, fontSize: 11 }}
              tickLine={{ stroke: COLORS.CARD_BORDER }}
            />
            
            <PolarRadiusAxis 
              angle={90}
              domain={[0, 3]}
              tick={{ fill: COLORS.TEXT_MUTED, fontSize: 10 }}
              axisLine={{ stroke: COLORS.CARD_BORDER }}
              tickCount={4}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Radar
              name="Star Rating"
              dataKey="stars"
              stroke={factionColors.PRIMARY}
              fill="url(#radarGradient)"
              strokeWidth={2}
              dot={{ 
                fill: factionColors.PRIMARY, 
                strokeWidth: 2,
                r: 4
              }}
              activeDot={{
                fill: COLORS.TEXT_PRIMARY,
                stroke: factionColors.PRIMARY,
                strokeWidth: 2,
                r: 6
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Center average display */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <p style={{ 
            color: COLORS.PRIMARY, 
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0,
            textShadow: `0 0 20px ${factionColors.PRIMARY}`
          }}>
            {avgStars}
          </p>
          <p style={{ 
            color: COLORS.TEXT_MUTED, 
            fontSize: '10px',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Avg Stars
          </p>
        </div>
      </div>
      
      {/* Mission summary grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '8px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: `1px solid ${COLORS.CARD_BORDER}`
      }}>
        {chartData.map((d, index) => (
          <div 
            key={index}
            style={{
              textAlign: 'center',
              padding: '8px',
              backgroundColor: COLORS.CARD_BG,
              borderRadius: '6px',
              border: `1px solid ${COLORS.CARD_BORDER}`
            }}
          >
            <p style={{ 
              color: factionColors.PRIMARY, 
              fontSize: '12px',
              fontWeight: 'bold',
              margin: '0 0 4px 0'
            }}>
              D{d.difficulty}
            </p>
            <p style={{ 
              color: COLORS.TEXT_SECONDARY, 
              fontSize: '12px',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}>
              <span style={{ fontSize: '14px' }}>⭐</span>
              <span style={{ fontWeight: 'bold' }}>{d.stars}</span>
            </p>
            <p style={{ 
              color: COLORS.TEXT_MUTED, 
              fontSize: '9px',
              margin: '4px 0 0 0'
            }}>
              {d.count} mission{d.count > 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissionRadar;
