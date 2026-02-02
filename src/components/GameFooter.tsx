import styled from 'styled-components'
import { Coffee, Bug, MessageSquare } from 'lucide-react'
import { LinkButton, Flex } from '../styles'

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const FooterContainer = styled.footer`
    background-color: transparent;
    padding: 20px 16px;
    margin-top: auto;
`

// Extend LinkButton with footer-specific sizing
const FooterLink = styled(LinkButton)`
    padding: 10px 20px;
    font-size: 13px;
    letter-spacing: 0.5px;
`

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Game footer component with Ko-fi support link and bug reporting
 */
export default function GameFooter() {
    return (
        <FooterContainer>
            <Flex $justify="center" $align="center" $gap="md" $wrap>
                <FooterLink
                    href="https://github.com/TheInsomnolent/helldrafters/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    $accentColor="#94a3b8"
                >
                    <Bug size={16} />
                    Report Bug/Feedback
                </FooterLink>
                <FooterLink
                    href="https://github.com/TheInsomnolent/helldrafters/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    $accentColor="#a78bfa"
                >
                    <MessageSquare size={16} />
                    Discussions
                </FooterLink>
                <FooterLink
                    href="https://ko-fi.com/theinsomnolent"
                    target="_blank"
                    rel="noopener noreferrer"
                    $accentColor="#ff5e4d"
                >
                    <Coffee size={16} />
                    Support Our Costs
                </FooterLink>
            </Flex>
        </FooterContainer>
    )
}
