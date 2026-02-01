/**
 * Share Panel Component
 * 
 * Provides social sharing functionality and screenshot capture
 */

import React, { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { COLORS, BUTTON_STYLES } from '../../constants/theme';

const SharePanel = ({ targetRef, runData, outcome }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [shareMessage, setShareMessage] = useState(null);
  
  // Generate share text
  const getShareText = () => {
    const emoji = outcome === 'victory' ? '🏆' : '💀';
    const statusText = outcome === 'victory' ? 'VICTORY' : 'DEFEAT';
    const difficulty = runData?.finalStats?.finalDifficulty || 1;
    const players = runData?.finalStats?.playerCount || 1;
    const duration = runData?.finalStats?.duration || 0;
    const durationMin = Math.floor(duration / 60000);
    
    return `${emoji} HELLDRAFTERS ${statusText} ${emoji}

🎯 Difficulty: ${difficulty}/10
👥 Squad Size: ${players}
⏱️ Duration: ${durationMin} minutes

Spread Democracy! 🦅
#Helldrafters #Helldivers2`;
  };
  
  // Screenshot to clipboard
  const captureScreenshot = useCallback(async () => {
    if (!targetRef?.current) {
      setShareMessage({ type: 'error', text: 'Nothing to capture!' });
      return;
    }
    
    setIsCapturing(true);
    setShareMessage(null);
    
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: COLORS.BG_MAIN,
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Convert to blob and copy to clipboard
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setShareMessage({ type: 'success', text: 'Screenshot copied to clipboard!' });
        } catch (clipboardError) {
          // Fallback: download the image
          const link = document.createElement('a');
          link.download = `helldrafters-${outcome}-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          setShareMessage({ type: 'success', text: 'Screenshot downloaded!' });
        }
      }, 'image/png');
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      setShareMessage({ type: 'error', text: 'Failed to capture screenshot' });
    } finally {
      setIsCapturing(false);
    }
  }, [targetRef, outcome]);
  
  // Share to Twitter/X
  const shareToTwitter = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=550,height=420');
  };
  
  // Clear message after timeout
  React.useEffect(() => {
    if (shareMessage) {
      const timer = setTimeout(() => setShareMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [shareMessage]);

  return (
    <div style={{ 
      backgroundColor: COLORS.CARD_INNER, 
      borderRadius: '8px', 
      padding: '16px',
      border: `1px solid ${COLORS.CARD_BORDER}`
    }}>
      <h3 style={{ 
        color: COLORS.TEXT_PRIMARY, 
        margin: '0 0 16px 0',
        fontSize: '14px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '18px' }}>📤</span>
        Share Your Run
      </h3>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px'
      }}>
        {/* Screenshot button */}
        <button
          onClick={captureScreenshot}
          disabled={isCapturing}
          style={{
            ...BUTTON_STYLES.SECONDARY,
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '12px',
            opacity: isCapturing ? 0.6 : 1,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${COLORS.ACCENT_BLUE}`,
            color: COLORS.ACCENT_BLUE
          }}
        >
          <span style={{ fontSize: '16px' }}>📸</span>
          {isCapturing ? 'Capturing...' : 'Screenshot'}
        </button>
        
        {/* Twitter/X button */}
        <button
          onClick={shareToTwitter}
          style={{
            ...BUTTON_STYLES.SECONDARY,
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '12px',
            backgroundColor: 'rgba(29, 161, 242, 0.1)',
            border: '1px solid #1DA1F2',
            color: '#1DA1F2'
          }}
        >
          <span style={{ fontSize: '16px' }}>𝕏</span>
          Twitter/X
        </button>
      </div>
      
      {/* Status message */}
      {shareMessage && (
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          borderRadius: '6px',
          backgroundColor: shareMessage.type === 'success' 
            ? 'rgba(34, 197, 94, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${shareMessage.type === 'success' ? COLORS.ACCENT_GREEN : COLORS.ACCENT_RED}`,
          color: shareMessage.type === 'success' ? COLORS.ACCENT_GREEN : COLORS.ACCENT_RED,
          fontSize: '12px',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          {shareMessage.text}
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SharePanel;
