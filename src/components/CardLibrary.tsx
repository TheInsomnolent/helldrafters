import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { MASTER_DB } from '../data/itemsByWarbond'
import { getWarbondById } from '../constants/warbonds'
import { getFactionColors } from '../constants/theme'
import { ItemCard } from './ItemCard'
import { Flex } from '../styles'
import type { Item, DraftHandItem } from '../types'

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const PageWrapper = styled.div`
    min-height: 100vh;
    background-color: ${({ theme }) => theme.colors.bgMain};
    color: ${({ theme }) => theme.colors.textPrimary};
    padding: ${({ theme }) => theme.spacing.xl};
`

const HeaderSection = styled.div<{ $borderColor: string }>`
    text-align: center;
    margin-bottom: ${({ theme }) => theme.spacing.xxl};
    padding: ${({ theme }) => theme.spacing.xl};
    background-color: ${({ theme }) => theme.colors.cardBg};
    border-radius: ${({ theme }) => theme.radii.lg};
    border: 2px solid ${({ $borderColor }) => $borderColor};
`

const HeaderTitle = styled.h1<{ $color: string }>`
    font-size: 36px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ $color }) => $color};
    margin-bottom: ${({ theme }) => theme.spacing.md};
    text-transform: uppercase;
    letter-spacing: 2px;
`

const HeaderSubtitle = styled.p`
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: ${({ theme }) => theme.spacing.md};
`

const StatsContainer = styled(Flex)`
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.xl};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
`

const StatValue = styled.strong`
    color: ${({ theme }) => theme.colors.textPrimary};
`

const WarbondSection = styled.section`
    margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const WarbondTitle = styled.h2<{ $color: string }>`
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ $color }) => $color};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
    text-transform: uppercase;
    letter-spacing: 1px;
    padding-bottom: ${({ theme }) => theme.spacing.md};
    border-bottom: 2px solid rgba(100, 116, 139, 0.3);
`

const ItemGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: ${({ theme }) => theme.spacing.xl};
`

const FooterSection = styled.div`
    text-align: center;
    margin-top: ${({ theme }) => theme.spacing.xxl};
    padding-top: ${({ theme }) => theme.spacing.xl};
    border-top: 1px solid rgba(100, 116, 139, 0.3);
`

const BackLink = styled(Link)<{ $color: string }>`
    color: ${({ $color }) => $color};
    text-decoration: none;
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: ${({ theme }) => theme.transitions.normal};

    &:hover {
        opacity: 0.8;
    }
`

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CardLibrary() {
    const factionColors = getFactionColors('terminid')

    // Group items by warbond
    const itemsByWarbond = MASTER_DB.reduce<Record<string, Item[]>>((acc, item) => {
        const warbondId = item.superstore ? 'superstore' : item.warbond || 'unknown'
        if (!acc[warbondId]) {
            acc[warbondId] = []
        }
        acc[warbondId].push(item)
        return acc
    }, {})

    // Sort warbonds for consistent display
    const sortedWarbonds = Object.keys(itemsByWarbond).sort()

    return (
        <PageWrapper>
            {/* Header */}
            <HeaderSection $borderColor={factionColors.PRIMARY}>
                <HeaderTitle $color={factionColors.PRIMARY}>Card Library</HeaderTitle>
                <HeaderSubtitle>Development Route - All Items from All Warbonds</HeaderSubtitle>
                <StatsContainer>
                    <div>
                        Total Items: <StatValue>{MASTER_DB.length}</StatValue>
                    </div>
                    <div>
                        Warbonds: <StatValue>{sortedWarbonds.length}</StatValue>
                    </div>
                </StatsContainer>
            </HeaderSection>

            {/* Items grouped by warbond */}
            {sortedWarbonds.map((warbondId) => {
                const items = itemsByWarbond[warbondId]
                const warbondInfo =
                    warbondId === 'superstore' ? { name: 'Superstore' } : getWarbondById(warbondId)
                const warbondName = warbondInfo?.name || warbondId
                const warbondColor = warbondId === 'superstore' ? '#c084fc' : '#60a5fa'

                return (
                    <WarbondSection key={warbondId}>
                        <WarbondTitle $color={warbondColor}>
                            {warbondName} ({items.length} items)
                        </WarbondTitle>

                        <ItemGrid>
                            {items.map((item) => (
                                <ItemCard
                                    key={item.id}
                                    item={item as DraftHandItem}
                                    factionColors={factionColors}
                                />
                            ))}
                        </ItemGrid>
                    </WarbondSection>
                )
            })}

            {/* Back to home link */}
            <FooterSection>
                <BackLink to="/" $color={factionColors.PRIMARY}>
                    ← Back to Game
                </BackLink>
            </FooterSection>
        </PageWrapper>
    )
}
