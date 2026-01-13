import React from 'react';
import { Trophy, AlertTriangle } from 'lucide-react';
import { EVENT_TYPES } from '../events';

/**
 * EventDisplay component for showing and handling event interactions
 */
export default function EventDisplay({
  currentEvent,
  eventPlayerChoice,
  players,
  currentDiff,
  requisition,
  lives,
  needsPlayerChoice,
  canAffordChoice,
  formatOutcome,
  formatOutcomes,
  onPlayerChoice,
  onEventChoice,
  onAutoContinue
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a2332', color: '#e0e0e0', padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: '#0f1419', 
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #F5C642',
        zIndex: 100
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F5C642' }}>
          EVENT - DIFFICULTY {currentDiff}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="#F5C642" />
            <span style={{ fontWeight: 'bold' }}>{requisition}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#ff4444" />
            <span style={{ fontWeight: 'bold' }}>{lives} Lives</span>
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '100px auto 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Event Card */}
        <div style={{
          backgroundColor: '#283548',
          border: '2px solid #F5C642',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '32px', 
            color: '#F5C642', 
            marginBottom: '16px',
            fontWeight: 'bold'
          }}>
            {currentEvent.name}
          </h2>
          <p style={{ 
            fontSize: '18px', 
            lineHeight: '1.6',
            marginBottom: '32px',
            color: '#b0b0b0'
          }}>
            {currentEvent.description}
          </p>

          {/* Player Selection (if needed) */}
          {needsPlayerChoice(currentEvent) && eventPlayerChoice === null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '16px', marginBottom: '12px', color: '#F5C642' }}>
                Choose a Helldiver:
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {players.map((player, idx) => (
                  <button
                    key={idx}
                    onClick={() => onPlayerChoice(idx)}
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: '#1a2332',
                      color: '#F5C642',
                      border: '2px solid #F5C642',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#283548'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a2332'}
                  >
                    HELLDIVER {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Choices */}
          {currentEvent.type === EVENT_TYPES.CHOICE && (!needsPlayerChoice(currentEvent) || eventPlayerChoice !== null) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentEvent.choices.map((choice, idx) => {
                const affordable = canAffordChoice(choice);
                const outcomeText = formatOutcomes(choice.outcomes);
                return (
                  <button
                    key={idx}
                    onClick={() => onEventChoice(choice)}
                    disabled={!affordable}
                    style={{
                      padding: '16px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: affordable ? '#F5C642' : '#555',
                      color: affordable ? '#0f1419' : '#888',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: affordable ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => affordable && (e.target.style.backgroundColor = '#ffd95a')}
                    onMouseLeave={(e) => affordable && (e.target.style.backgroundColor = '#F5C642')}
                  >
                    <div style={{ fontSize: '16px' }}>
                      {choice.text}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: 'normal',
                      opacity: 0.85,
                      fontStyle: 'italic'
                    }}>
                      {outcomeText}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Random/Beneficial/Detrimental events auto-proceed */}
          {currentEvent.type !== EVENT_TYPES.CHOICE && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              {currentEvent.outcomes && currentEvent.outcomes.length > 0 && (
                <div style={{
                  backgroundColor: '#1f2937',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 198, 66, 0.3)'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                    {currentEvent.type === EVENT_TYPES.RANDOM ? 'Possible Outcomes:' : 'Outcome:'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#F5C642' }}>
                    {currentEvent.type === EVENT_TYPES.RANDOM 
                      ? currentEvent.outcomes.map((o, i) => (
                          <div key={i}>
                            {formatOutcome(o)} {o.weight ? `(${o.weight}% chance)` : ''}
                          </div>
                        ))
                      : formatOutcomes(currentEvent.outcomes)
                    }
                  </div>
                </div>
              )}
              <button
                onClick={onAutoContinue}
                style={{
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#F5C642',
                  color: '#0f1419',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#ffd95a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#F5C642'}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
