import React from 'react';
import { Coffee } from 'lucide-react';

/**
 * Game footer component with Ko-fi support link
 */
export default function GameFooter() {
  return (
    <div style={{ 
      backgroundColor: '#0f1419', 
      borderTop: '1px solid rgba(100, 116, 139, 0.3)',
      padding: '20px 16px',
      marginTop: 'auto'
    }}>
      <div style={{ 
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <a
          href="https://ko-fi.com/theinsomnolent"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: 'rgba(255, 94, 77, 0.1)',
            color: '#ff5e4d',
            border: '1px solid rgba(255, 94, 77, 0.3)',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 'bold',
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 94, 77, 0.2)';
            e.currentTarget.style.borderColor = '#ff5e4d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 94, 77, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 94, 77, 0.3)';
          }}
        >
          <Coffee size={16} />
          Support Our Costs
        </a>
      </div>
    </div>
  );
}
