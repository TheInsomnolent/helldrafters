/**
 * ExportButton Component
 *
 * Reusable button for exporting game state.
 * Uses the ghost button variant from common styled-components.
 */

import React from 'react'
import { Button } from '../styles'
import type { FactionColorSet } from '../constants/theme'

interface ExportButtonProps {
    onClick: () => void
    factionColors: FactionColorSet
}

const ExportButton: React.FC<ExportButtonProps> = ({ onClick, factionColors }) => (
    <Button
        $variant="ghost"
        $size="sm"
        $factionPrimary={factionColors.PRIMARY}
        $factionHover={factionColors.PRIMARY_HOVER}
        onClick={onClick}
    >
        💾 Export
    </Button>
)

export default ExportButton
