import { Coffee, Bug, MessageSquare } from 'lucide-react'
import { COLORS } from '../constants/theme'

/**
 * Game footer component with Ko-fi support link and bug reporting
 */
export default function GameFooter() {
    return (
        <div
            style={{
                backgroundColor: 'transparent',
                padding: '20px 16px',
                marginTop: 'auto',
            }}
        >
            <div
                style={{
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                }}
            >
                <a
                    href="https://github.com/TheInsomnolent/helldrafters/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: 'rgba(100, 116, 139, 0.1)',
                        color: COLORS.TEXT_MUTED,
                        border: `1px solid rgba(100, 116, 139, 0.3)`,
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s',
                        letterSpacing: '0.5px',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.2)'
                        e.currentTarget.style.borderColor = COLORS.TEXT_MUTED
                        e.currentTarget.style.color = COLORS.TEXT_SECONDARY
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)'
                        e.currentTarget.style.color = COLORS.TEXT_MUTED
                    }}
                >
                    <Bug size={16} />
                    Report Bug/Feedback
                </a>
                <a
                    href="https://github.com/TheInsomnolent/helldrafters/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        color: '#a78bfa',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s',
                        letterSpacing: '0.5px',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)'
                        e.currentTarget.style.borderColor = '#a78bfa'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                    }}
                >
                    <MessageSquare size={16} />
                    Discussions
                </a>
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
                        letterSpacing: '0.5px',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 94, 77, 0.2)'
                        e.currentTarget.style.borderColor = '#ff5e4d'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 94, 77, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(255, 94, 77, 0.3)'
                    }}
                >
                    <Coffee size={16} />
                    Support Our Costs
                </a>
            </div>
        </div>
    )
}
