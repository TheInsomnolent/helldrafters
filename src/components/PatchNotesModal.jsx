import React from 'react';
import { X, FileText } from 'lucide-react';
import { getFactionColors } from '../constants/theme';

/**
 * Modal component that displays patch notes from CHANGELOG.md
 */
export default function PatchNotesModal({ isOpen, onClose, faction = 'Terminids' }) {
  const factionColors = getFactionColors(faction);
  const [patchNotes, setPatchNotes] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  // Fetch changelog on mount
  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      
      // Try to fetch CHANGELOG.md from the public directory
      // Use PUBLIC_URL for production builds with homepage setting
      const changelogPath = `${process.env.PUBLIC_URL}/CHANGELOG.md`;
      fetch(changelogPath)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load patch notes');
          }
          return response.text();
        })
        .then(text => {
          setPatchNotes(text);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading patch notes:', err);
          setError('Unable to load patch notes. Please check the repository for the latest updates.');
          setLoading(false);
        });
    }
  }, [isOpen]);
  
  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Parse markdown-style headers and lists for basic formatting
  const formatPatchNotes = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    
    const flushListItems = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{
            color: '#cbd5e1',
            lineHeight: '1.8',
            paddingLeft: '20px',
            marginBottom: '16px',
            listStyleType: 'disc'
          }}>
            {listItems}
          </ul>
        );
        listItems = [];
      }
    };
    
    lines.forEach((line, idx) => {
      // Skip empty lines
      if (!line.trim()) {
        flushListItems();
        return;
      }
      
      // H1 headers (# Title)
      if (line.startsWith('# ')) {
        flushListItems();
        elements.push(
          <h1 key={`h1-${idx}`} style={{
            fontSize: '32px',
            fontWeight: '900',
            color: factionColors.PRIMARY,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '24px',
            marginTop: '0'
          }}>
            {line.substring(2)}
          </h1>
        );
      }
      // H2 headers (## Version)
      else if (line.startsWith('## ')) {
        flushListItems();
        const text = line.substring(3);
        elements.push(
          <h2 key={`h2-${idx}`} style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: factionColors.PRIMARY,
            marginTop: '32px',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: `2px solid ${factionColors.PRIMARY}40`
          }}>
            {text}
          </h2>
        );
      }
      // H3 headers (### Category)
      else if (line.startsWith('### ')) {
        flushListItems();
        elements.push(
          <h3 key={`h3-${idx}`} style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#22c55e',
            marginTop: '20px',
            marginBottom: '12px'
          }}>
            {line.substring(4)}
          </h3>
        );
      }
      // List items (- Item)
      else if (line.startsWith('- ')) {
        listItems.push(
          <li key={`li-${idx}`} style={{ marginBottom: '4px' }}>
            {line.substring(2)}
          </li>
        );
      }
      // Regular paragraph text
      else {
        flushListItems();
        // Skip links in square brackets format
        if (!line.startsWith('[') && !line.includes('keepachangelog.com')) {
          elements.push(
            <p key={`p-${idx}`} style={{
              color: '#cbd5e1',
              lineHeight: '1.8',
              marginBottom: '12px'
            }}>
              {line}
            </p>
          );
        }
      }
    });
    
    flushListItems();
    return elements;
  };
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '24px',
        overflowY: 'auto'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="patchnotes-modal-title"
    >
      <div 
        style={{
          backgroundColor: '#1a2332',
          borderRadius: '12px',
          border: `2px solid ${factionColors.PRIMARY}`,
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: `0 0 40px ${factionColors.PRIMARY}40`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: `2px solid ${factionColors.PRIMARY}4D`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: '#1a2332',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={28} color={factionColors.PRIMARY} />
            <h2 style={{
              fontSize: '28px',
              fontWeight: '900',
              color: factionColors.PRIMARY,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0
            }}
            id="patchnotes-modal-title"
            >
              Patch Notes
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              backgroundColor: 'rgba(100, 116, 139, 0.3)',
              color: '#94a3b8',
              border: '1px solid rgba(100, 116, 139, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div style={{ padding: '32px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <p>Loading patch notes...</p>
            </div>
          )}
          
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
            </div>
          )}
          
          {!loading && !error && (
            <div>
              {formatPatchNotes(patchNotes)}
            </div>
          )}
          
          {/* Footer */}
          <div style={{
            marginTop: '32px',
            padding: '20px',
            backgroundColor: 'rgba(100, 116, 139, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0' }}>
              For the full changelog and detailed information, visit the{' '}
              <a 
                href="https://github.com/TheInsomnolent/helldrafters"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: factionColors.PRIMARY, textDecoration: 'underline' }}
              >
                GitHub repository
              </a>
            </p>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
              Version: 0.1.0 | Build: {process.env.REACT_APP_COMMIT_SHA?.substring(0, 7) || 'dev'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
