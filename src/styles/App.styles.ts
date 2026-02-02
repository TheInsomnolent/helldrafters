import styled, { css } from 'styled-components'
import { COLORS, Text, Button } from '../styles'

// Page wrappers for different phases
export const PageWrapper = styled.div<{ $withPadding?: boolean; $withFooterMargin?: boolean }>`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    ${({ $withPadding }) => $withPadding && 'padding: 24px;'}
    ${({ $withFooterMargin }) => $withFooterMargin && 'padding-bottom: 80px;'}
    background-color: #1a2332;
`

export const ContentWrapper = styled.div`
    padding: 24px;
`

export const CenteredContent = styled.div`
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`

// Section headers
export const SectionHeader = styled.div<{ $center?: boolean; $marginBottom?: string }>`
    ${({ $center }) => $center && 'text-align: center;'}
    margin-bottom: ${({ $marginBottom }) => $marginBottom || '32px'};
`

export const PhaseSubtitle = styled.h2<{ $color?: string }>`
    color: ${({ $color }) => $color || COLORS.PRIMARY};
    font-size: 14px;
    font-family: monospace;
    text-transform: uppercase;
    margin-bottom: 8px;
    letter-spacing: 1px;
`

export const PhaseTitle = styled.h1`
    font-size: 36px;
    font-weight: 900;
    color: white;
    text-transform: uppercase;
    margin: 0 0 8px 0;
`

export const TitleSeparator = styled.span`
    color: #64748b;
`

export const PhaseDescription = styled.p`
    color: #94a3b8;
    margin: 0;
`

// Shared section styles
export const SectionBox = styled.div<{ $maxWidth?: string }>`
    background-color: #283548;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid rgba(100, 116, 139, 0.5);
    text-align: center;
    ${({ $maxWidth }) => $maxWidth && `max-width: ${$maxWidth};`}
    width: 100%;
`

export const AlertBox = styled.div<{
    $variant: 'info' | 'warning' | 'error' | 'success'
}>`
    border-radius: 8px;
    padding: 12px 24px;
    margin-bottom: 16px;
    display: inline-block;
    ${({ $variant }) => {
        switch ($variant) {
            case 'info':
                return css`
                    background-color: rgba(59, 130, 246, 0.15);
                    border: 2px solid rgba(59, 130, 246, 0.4);
                `
            case 'warning':
                return css`
                    background-color: rgba(245, 158, 11, 0.15);
                    border: 2px solid rgba(245, 158, 11, 0.4);
                `
            case 'error':
                return css`
                    background-color: rgba(239, 68, 68, 0.15);
                    border: 2px solid rgba(239, 68, 68, 0.4);
                `
            case 'success':
                return css`
                    background-color: rgba(34, 197, 94, 0.15);
                    border: 2px solid rgba(34, 197, 94, 0.4);
                `
        }
    }}
`

export const AlertTitle = styled.div<{ $color?: string }>`
    color: ${({ $color }) => $color || '#3b82f6'};
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
`

export const AlertSubtitle = styled.div`
    color: #94a3b8;
    font-size: 11px;
    margin-top: 4px;
`

// Status messages
export const WaitingMessage = styled.div`
    text-align: center;
    margin-bottom: 32px;
    padding: 16px 32px;
    background-color: rgba(100, 116, 139, 0.2);
    border: 2px solid rgba(100, 116, 139, 0.4);
    border-radius: 8px;
    display: inline-block;
    margin: 0 auto 32px auto;
`

export const WaitingText = styled.div`
    color: #94a3b8;
    font-size: 16px;
    font-weight: bold;
    text-transform: uppercase;
`

// Item/Card grids
export const ItemGrid = styled.div<{ $columns?: number; $disabled?: boolean }>`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: stretch;
    gap: 24px;
    margin-bottom: 48px;
    width: 100%;
    ${({ $disabled }) =>
        $disabled &&
        css`
            opacity: 0.6;
            pointer-events: none;
        `}
`

// Loadout overview
export const LoadoutOverview = styled.div`
    background-color: rgba(40, 53, 72, 0.5);
    border-radius: 8px;
    padding: 16px 24px;
    margin-bottom: 32px;
    border: 1px solid rgba(100, 116, 139, 0.3);
`

export const LoadoutLabel = styled.div`
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
`

export const LoadoutItems = styled.div`
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    justify-content: center;
`

export const LoadoutSlot = styled.div`
    text-align: center;
`

export const LoadoutSlotLabel = styled.div`
    font-size: 10px;
    color: #94a3b8;
    margin-bottom: 4px;
`

export const LoadoutSlotValue = styled.div<{
    $hasItem?: boolean
    $special?: boolean
    $color?: string
}>`
    padding: 4px 8px;
    background-color: ${({ $hasItem, $special }) =>
        $special
            ? 'rgba(34, 197, 94, 0.2)'
            : $hasItem
              ? 'rgba(100, 116, 139, 0.3)'
              : 'rgba(100, 116, 139, 0.1)'};
    border-radius: 4px;
    font-size: 10px;
    color: ${({ $hasItem, $special, $color }) =>
        $color || ($special ? '#22c55e' : $hasItem ? '#cbd5e1' : '#64748b')};
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

// Button containers
export const ButtonRow = styled.div<{ $justify?: string; $marginTop?: string }>`
    display: flex;
    justify-content: ${({ $justify }) => $justify || 'center'};
    gap: 24px;
    ${({ $marginTop }) => $marginTop && `margin-top: ${$marginTop};`}
`

export const ActionButton = styled.button<{
    $variant?: 'primary' | 'secondary' | 'outline' | 'danger'
    $disabled?: boolean
}>`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 32px;
    border-radius: 4px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
    transition: all 0.2s;

    ${({ $variant, $disabled }) => {
        switch ($variant) {
            case 'primary':
                return css`
                    background-color: ${COLORS.PRIMARY};
                    color: black;
                    border: none;
                    &:hover:not(:disabled) {
                        background-color: ${COLORS.PRIMARY_HOVER};
                    }
                `
            case 'danger':
                return css`
                    background-color: rgba(127, 29, 29, 0.3);
                    color: #ef4444;
                    border: 1px solid #7f1d1d;
                    &:hover:not(:disabled) {
                        background-color: rgba(127, 29, 29, 0.5);
                    }
                `
            case 'outline':
            default:
                return css`
                    background-color: transparent;
                    color: ${$disabled ? '#64748b' : 'white'};
                    border: 2px solid ${$disabled ? '#334155' : 'white'};
                    &:hover:not(:disabled) {
                        border-color: #94a3b8;
                    }
                `
        }
    }}
`

export const SkipButton = styled.button`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 32px;
    border-radius: 4px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: 2px solid #64748b;
    background-color: transparent;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: #94a3b8;
        color: white;
    }
`

// Hints and helper text
export const HintText = styled.p<{ $center?: boolean; $marginTop?: string }>`
    font-size: 11px;
    color: #94a3b8;
    font-style: italic;
    margin: ${({ $marginTop }) => $marginTop || '8px'} 0 0 0;
    ${({ $center }) => $center && 'text-align: center;'}
`

export const MonoText = styled.span<{ $color?: string }>`
    color: ${({ $color }) => $color || COLORS.PRIMARY};
    font-family: monospace;
`

// Sacrifice phase specific
export const SacrificeHeader = styled.div`
    text-align: center;
    margin-bottom: 40px;
`

export const SacrificePenaltyBadge = styled.div`
    background-color: rgba(239, 68, 68, 0.15);
    padding: 8px 16px;
    border-radius: 8px;
    display: inline-block;
    border: 2px solid rgba(239, 68, 68, 0.3);
    margin-bottom: 24px;
`

export const SacrificePenaltyTitle = styled.div`
    color: #ef4444;
    font-size: 16px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
`

export const SacrificePenaltySubtext = styled.div`
    color: #94a3b8;
    font-size: 12px;
    margin-top: 6px;
`

export const SacrificeCard = styled.div<{ $interactive?: boolean }>`
    background-color: #283548;
    border: 2px solid rgba(239, 68, 68, 0.5);
    border-radius: 12px;
    padding: 24px;
    cursor: ${({ $interactive }) => ($interactive ? 'pointer' : 'not-allowed')};
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 12px;

    &:hover {
        border-color: #ef4444;
        background-color: #1f2937;
        transform: translateY(-4px);
    }
`

export const SacrificeCardSlot = styled.div`
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
`

export const SacrificeCardName = styled.div`
    color: white;
    font-weight: bold;
    font-size: 18px;
`

export const SacrificeCardRarity = styled.div`
    font-size: 12px;
    color: #94a3b8;
`

export const SacrificeCardHint = styled.div`
    font-size: 11px;
    color: #ef4444;
    font-style: italic;
    margin-top: auto;
`

// No items to sacrifice
export const EmptyBox = styled.div`
    background-color: #283548;
    padding: 40px;
    border-radius: 12px;
    border: 1px solid rgba(100, 116, 139, 0.5);
    text-align: center;
    max-width: 600px;
`

export const EmptyIcon = styled.div`
    font-size: 48px;
    margin-bottom: 16px;
`

export const EmptyTitle = styled.h3<{ $color?: string }>`
    color: ${({ $color }) => $color || COLORS.PRIMARY};
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
`

export const EmptyDescription = styled.p`
    color: #94a3b8;
    margin: 0;
`

// Form section labels
export const FormSectionLabel = styled.label`
    display: block;
    font-size: 12px;
    font-weight: bold;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 16px;
`

// Custom setup phase

export const DifficultyGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 8px;
`

export const DifficultyButton = styled.button<{
    $selected?: boolean
    $factionColor?: string
}>`
    padding: 12px 8px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 16px;
    transition: all 0.2s;
    cursor: pointer;
    background-color: ${({ $selected, $factionColor }) =>
        $selected ? $factionColor || COLORS.PRIMARY : 'transparent'};
    color: ${({ $selected }) => ($selected ? 'black' : '#64748b')};
    border: ${({ $selected, $factionColor }) =>
        $selected
            ? `2px solid ${$factionColor || COLORS.PRIMARY}`
            : '1px solid rgba(100, 116, 139, 0.5)'};

    &:hover:not(:disabled) {
        border-color: ${({ $selected }) => ($selected ? undefined : '#64748b')};
    }
`

export const PlayerTabs = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
`

export const PlayerTab = styled.button<{ $active?: boolean; $factionColor?: string }>`
    padding: 12px 24px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 12px;
    text-transform: uppercase;
    transition: all 0.2s;
    cursor: pointer;
    background-color: ${({ $active, $factionColor }) =>
        $active ? $factionColor || COLORS.PRIMARY : 'transparent'};
    color: ${({ $active }) => ($active ? 'black' : '#94a3b8')};
    border: 1px solid
        ${({ $active, $factionColor }) =>
            $active ? $factionColor || COLORS.PRIMARY : 'rgba(100, 116, 139, 0.5)'};
`

export const LoadoutField = styled.div``

export const LoadoutFieldLabel = styled.label`
    display: block;
    font-size: 11px;
    color: #94a3b8;
    text-transform: uppercase;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
`

export const LoadoutSelect = styled.select`
    width: 100%;
    padding: 10px 12px;
    background-color: #1f2937;
    border: 1px solid rgba(100, 116, 139, 0.5);
    border-radius: 4px;
    color: white;
    font-size: 13px;

    &:focus {
        outline: none;
        border-color: ${COLORS.PRIMARY};
    }
`

export const StratagemGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
`

export const StratagemSelect = styled(LoadoutSelect)`
    font-size: 12px;
`

export const CustomSetupActions = styled.div`
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 32px;
`

export const CustomSetupPhaseTitle = styled(PhaseTitle)<{ $color?: string }>`
    font-size: 48px;
    color: ${({ $color }) => $color || 'white'};
`

export const SectionBoxSpaced = styled(SectionBox)<{ $marginBottom?: string }>`
    margin-bottom: ${({ $marginBottom }) => $marginBottom || '0'};
`

export const LoadoutConfigTitle = styled.h3<{ $color?: string }>`
    color: ${({ $color }) => $color || COLORS.PRIMARY};
    margin-bottom: 16px;
    font-size: 18px;
`

export const LoadoutFieldSpaced = styled(LoadoutField)<{ $marginBottom?: string }>`
    margin-bottom: ${({ $marginBottom }) => $marginBottom || '0'};
`

export const LoadoutSelectColored = styled(LoadoutSelect)<{ $color?: string }>`
    color: ${({ $color }) => $color || 'white'};
`

export const DifficultyLabel = styled.div<{ $color?: string }>`
    margin-top: 8px;
    text-align: center;
    color: ${({ $color }) => $color || COLORS.PRIMARY};
    font-size: 14px;
`

export const StratagemGap = styled.div`
    display: flex;
    gap: 6px;
`

export const RequisitionDisplay = styled.div`
    margin-top: 32px;
    text-align: center;
`

export const SacrificeWaitSection = styled(SectionBox)`
    margin-top: 24px;
`

export const SacrificeWaitText = styled(Text)`
    margin-bottom: 8px;
`

export const FlexButton = styled(Button)<{ $flex?: number }>`
    flex: ${({ $flex }) => $flex || 1};
`

export const StartOperationButton = styled(Button)`
    flex: 2;
    font-size: 18px;
    letter-spacing: 0.1em;
`

// Export row for top-right buttons
export const ExportRow = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
    gap: 12px;
`

// =============================================
// EVENT PHASE
// =============================================
export const EventPageWrapper = styled.div`
    min-height: 100vh;
`

// =============================================
// DASHBOARD PHASE
// =============================================

// Main content container for dashboard - responsive grid layout
export const DashboardMain = styled.div`
    max-width: 1800px;
    margin: 0 auto;
    padding: 24px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;

    /* Constrain content to prevent horizontal overflow on mobile */
    @media (max-width: 1023px) {
        padding: 16px;
        max-width: 100%;
        overflow-x: hidden;
    }

    /* Two-column layout on tablet/small desktop: players left, controls right */
    @media (min-width: 1024px) {
        grid-template-columns: 1fr 420px;
        gap: 32px;
    }

    /* Three-column layout on large PC screens: P1 P2 | CONTROLS */
    @media (min-width: 1400px) {
        grid-template-columns: 1fr 1fr 440px;
    }
`

// Player roster grid
export const PlayerRosterGrid = styled.div<{ $playerCount: number }>`
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;

    /* On tablet/small desktop: single column of players in left area */
    @media (min-width: 1024px) {
        grid-column: 1;
        grid-row: 1;
    }

    /* On large PC: 2x2 grid of players spanning first 2 columns */
    @media (min-width: 1400px) {
        grid-column: 1 / 3;
        grid-template-columns: ${({ $playerCount }) => ($playerCount > 1 ? '1fr 1fr' : '1fr')};
        align-content: start;
    }
`

// Controls section container - right sidebar on larger screens
export const ControlsSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;

    /* Right column on tablet/small desktop */
    @media (min-width: 1024px) {
        grid-column: 2;
        grid-row: 1;
        position: sticky;
        top: 24px;
        align-self: start;
    }

    /* Still right column (now column 3) on large PC */
    @media (min-width: 1400px) {
        grid-column: 3;
    }
`

// Mission objective card
export const ObjectiveCard = styled.div<{ $factionColor: string }>`
    width: 100%;
    background-color: ${({ $factionColor }) => `${$factionColor}20`};
    padding: 16px 20px;
    border-radius: 8px;
    border: 2px solid ${({ $factionColor }) => $factionColor};
    text-align: center;
`

export const ObjectiveTitle = styled.h2<{ $color: string }>`
    font-size: 24px;
    font-weight: bold;
    color: ${({ $color }) => $color};
    text-transform: uppercase;
    margin: 0;
    letter-spacing: 1px;
`

export const ObjectiveText = styled.p`
    font-size: 16px;
    color: white;
    margin: 12px 0 0 0;
    font-weight: bold;
`

// Mission status card
export const MissionStatusCard = styled.div`
    width: 100%;
    background-color: #283548;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid rgba(100, 116, 139, 0.5);
    text-align: center;
`

export const MissionStatusTitle = styled.h2`
    font-size: 20px;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
    margin-bottom: 8px;
`

export const OperationStatus = styled.div<{ $color: string }>`
    font-size: 12px;
    color: ${({ $color }) => $color};
    font-family: monospace;
    margin-bottom: 16px;
    font-weight: bold;
`

// Star rating section
export const RatingSection = styled.div<{ $disabled?: boolean }>`
    margin-bottom: 32px;
    opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`

export const RatingLabel = styled.label`
    display: block;
    font-size: 12px;
    font-weight: bold;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 16px;
`

export const StarRatingGrid = styled.div<{ $disabled?: boolean }>`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-bottom: 12px;
    pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};

    @media (max-width: 480px) {
        gap: 4px;
    }
`

export const StarRatingButton = styled.button<{
    $selected?: boolean
    $disabled?: boolean
    $factionColor: string
}>`
    padding: 12px 6px;
    border-radius: 4px;
    font-weight: 900;
    font-size: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    @media (max-width: 480px) {
        padding: 8px 4px;
        font-size: 16px;
    }
    transition: all 0.2s;
    background-color: ${({ $selected, $factionColor }) =>
        $selected ? $factionColor : 'transparent'};
    color: ${({ $disabled, $selected }) =>
        $disabled ? '#334155' : $selected ? 'black' : '#64748b'};
    border: ${({ $selected, $disabled, $factionColor }) =>
        $selected
            ? `2px solid ${$factionColor}`
            : $disabled
              ? '1px solid #1e293b'
              : '1px solid rgba(100, 116, 139, 0.5)'};
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
    opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};

    &:hover:not(:disabled) {
        border-color: ${({ $selected }) => ($selected ? undefined : '#64748b')};
    }
`

export const StarIcon = styled.div`
    font-size: 14px;

    @media (max-width: 480px) {
        font-size: 12px;
    }
`

export const RatingHint = styled.p`
    font-size: 11px;
    color: #64748b;
    font-style: italic;
    margin: 0;
`

// Samples section
export const SamplesSection = styled.div<{ $disabled?: boolean }>`
    margin-bottom: 24px;
    opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`

export const SamplesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 8px;

    @media (max-width: 480px) {
        gap: 8px;
    }
`

export const SampleColumn = styled.div``

export const SampleHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
`

export const SampleIcon = styled.img`
    width: 20px;
    height: 20px;
`

export const SampleLabel = styled.span<{ $color: string }>`
    font-size: 12px;
    font-weight: bold;
    color: ${({ $color }) => $color};
    text-transform: uppercase;
`

export const SampleInput = styled.input<{ $borderColor: string; $disabled?: boolean }>`
    width: 100%;
    padding: 10px 8px;
    background-color: #1f2937;
    border: 1px solid ${({ $borderColor }) => $borderColor};
    border-radius: 4px;
    color: ${({ $borderColor }) => $borderColor};
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    font-family: monospace;
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'text')};

    @media (max-width: 480px) {
        padding: 8px 4px;
        font-size: 12px;
    }
`

export const SampleHint = styled.div`
    font-size: 10px;
    color: #64748b;
    margin-top: 4px;
    font-style: italic;
`

export const SamplesNote = styled.p`
    font-size: 11px;
    color: #94a3b8;
    font-style: italic;
    margin: 8px 0 0 0;
    text-align: center;
`

// Extraction status section
export const ExtractionSection = styled.div`
    margin-bottom: 32px;
`

export const ExtractionList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`

export const ExtractionLabel = styled.label<{
    $extracted: boolean
    $canToggle: boolean
}>`
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: ${({ $canToggle }) => ($canToggle ? 'pointer' : 'not-allowed')};
    padding: 10px 16px;
    background-color: ${({ $extracted }) =>
        $extracted ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
    border-radius: 4px;
    border: 1px solid ${({ $extracted }) => ($extracted ? '#22c55e' : '#ef4444')};
    transition: all 0.2s;
    opacity: ${({ $canToggle }) => ($canToggle ? 1 : 0.7)};
`

export const ExtractionCheckbox = styled.input<{ $canToggle: boolean }>`
    width: 18px;
    height: 18px;
    cursor: ${({ $canToggle }) => ($canToggle ? 'pointer' : 'not-allowed')};
`

export const ExtractionContent = styled.div`
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
`

export const ExtractionName = styled.span<{ $extracted: boolean }>`
    color: ${({ $extracted }) => ($extracted ? '#22c55e' : '#ef4444')};
    font-weight: bold;
    font-size: 14px;
`

export const ExtractionPenalty = styled.span`
    font-size: 11px;
    color: #ef4444;
    font-style: italic;
`

export const ExtractionNote = styled.p`
    font-size: 11px;
    color: #94a3b8;
    font-style: italic;
    margin: 8px 0 0 0;
    text-align: center;
`

// Mission buttons
export const MissionButtonRow = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;

    /* Stack on very narrow screens only */
    @media (max-width: 380px) {
        flex-direction: column;
    }
`

export const MissionFailButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background-color: rgba(127, 29, 29, 0.3);
    color: #ef4444;
    border: 1px solid #7f1d1d;
    border-radius: 4px;
    font-weight: bold;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
    white-space: nowrap;

    &:hover {
        background-color: rgba(127, 29, 29, 0.5);
    }
`

export const MissionSuccessButton = styled.button<{ $disabled?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    background-color: ${COLORS.PRIMARY};
    color: black;
    font-weight: bold;
    text-transform: uppercase;
    border: none;
    border-radius: 4px;
    letter-spacing: 1px;
    font-size: 12px;
    white-space: nowrap;
    opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
    pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background-color: ${COLORS.PRIMARY_HOVER};
    }
`

export const MissionReportHint = styled.p`
    margin-top: 16px;
    font-size: 12px;
    color: #64748b;
    font-family: monospace;
    margin: 16px 0 0 0;
`

// Waiting for host message
export const WaitingForHostBox = styled.div`
    text-align: center;
    padding: 24px;
    background-color: rgba(100, 116, 139, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(100, 116, 139, 0.3);
`

export const WaitingForHostText = styled.p`
    color: #94a3b8;
    margin: 0;
`

export const WaitingForHostSubtext = styled.p`
    color: #64748b;
    font-size: 12px;
    margin-top: 8px;
`

// Debug Events section
export const DebugSection = styled.div`
    width: 100%;
    background-color: #1a2332;
    padding: 20px;
    border-radius: 12px;
    border: 2px solid #ef4444;
    margin-top: 16px;
`

export const DebugHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
`

export const DebugTitle = styled.h3`
    font-size: 16px;
    font-weight: bold;
    color: #ef4444;
    text-transform: uppercase;
    margin: 0;
`

export const ResetSeenEventsButton = styled.button`
    padding: 8px 16px;
    background-color: #ef4444;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;

    &:hover {
        background-color: #dc2626;
    }
`

export const DebugGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
`

export const DebugButton = styled.button<{ $seen?: boolean }>`
    padding: 12px;
    background-color: ${({ $seen }) => ($seen ? '#374151' : '#283548')};
    color: ${({ $seen }) => ($seen ? '#6b7280' : '#cbd5e1')};
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 4px;
    font-size: 11px;
    cursor: ${({ $seen }) => ($seen ? 'not-allowed' : 'pointer')};
    transition: all 0.2s;
    text-align: left;
    opacity: ${({ $seen }) => ($seen ? 0.5 : 1)};

    &:hover:not(:disabled) {
        border-color: #ef4444;
        background-color: #374151;
    }
`

export const DebugButtonTitle = styled.div`
    font-weight: bold;
    margin-bottom: 4px;
    font-size: 12px;
`

export const DebugButtonSubtext = styled.div`
    font-size: 9px;
    color: #64748b;
`

export const DebugHint = styled.p`
    font-size: 10px;
    color: #64748b;
    margin-top: 12px;
    text-align: center;
    font-style: italic;
`
