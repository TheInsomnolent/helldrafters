import styled from 'styled-components'
import { Lock, Unlock, Wifi, WifiOff } from 'lucide-react'
import { getFactionColors } from '../constants/theme'
import { TYPE } from '../constants/types'
import type { Player, Faction, SlotType, GetItemById, GetArmorComboDisplayName } from '../types'
import { Card, CardHeader, CardContent, Grid, Flex, Caption, Badge, LockButton } from '../styles'

// ============================================================================
// STYLED COMPONENTS (component-specific only)
// ============================================================================

const LoadoutCard = styled(Card)<{ $disconnected?: boolean }>`
    opacity: ${({ $disconnected }) => ($disconnected ? 0.7 : 1)};
    border-color: ${({ $disconnected, theme }) =>
        $disconnected ? 'rgba(239, 68, 68, 0.5)' : theme.colors.cardBorder};
`

const PlayerName = styled.h3`
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0;
`

const SlotLabel = styled(Caption)`
    text-transform: uppercase;
    margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const SlotValue = styled.div<{ $variant?: 'primary' | 'secondary' | 'default' }>`
    font-size: ${({ $variant }) => ($variant === 'primary' ? '14px' : '12px')};
    font-weight: ${({ $variant }) => ($variant === 'primary' ? 'bold' : 'normal')};
    color: ${({ $variant, theme }) =>
        $variant === 'primary'
            ? 'inherit'
            : $variant === 'secondary'
              ? theme.colors.textPrimary
              : theme.colors.textSecondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const StratagemSlot = styled.div`
    background-color: ${({ theme }) => theme.colors.cardInner};
    height: 64px;
    border-radius: ${({ theme }) => theme.radii.md};
    border: 1px solid rgba(71, 85, 105, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${({ theme }) => theme.spacing.xs};
    text-align: center;
`

const StratagemName = styled.span`
    font-size: 9px;
    line-height: 1.2;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
`

const EmptySlot = styled.span`
    color: ${({ theme }) => theme.colors.textDisabled};
    font-size: ${({ theme }) => theme.fontSizes.md};
`

interface LoadoutDisplayProps {
    player: Player | null
    getItemById: GetItemById
    getArmorComboDisplayName: GetArmorComboDisplayName
    faction: Faction | string
    requisition: number
    slotLockCost: number
    maxLockedSlots: number
    onLockSlot?: (playerId: string, slot: SlotType) => void
    onUnlockSlot?: (playerId: string, slot: SlotType) => void
    isConnected?: boolean
    isMultiplayer?: boolean
}

/**
 * Player loadout display component
 */
export default function LoadoutDisplay({
    player,
    getItemById,
    getArmorComboDisplayName,
    faction,
    requisition,
    slotLockCost,
    maxLockedSlots,
    onLockSlot,
    onUnlockSlot,
    isConnected = true,
    isMultiplayer = false,
}: LoadoutDisplayProps) {
    const factionColors = getFactionColors(faction)

    // Guard against undefined player or loadout
    if (!player || !player.loadout) {
        return (
            <Card>
                <CardHeader>
                    <PlayerName style={{ color: '#64748b' }}>Loading...</PlayerName>
                </CardHeader>
                <CardContent style={{ textAlign: 'center', color: '#64748b' }}>
                    Waiting for player data...
                </CardContent>
            </Card>
        )
    }

    // Get the equipped armor
    const equippedArmor = getItemById(player.loadout.armor)

    // Display armor combo if we have a helper function and armor is equipped
    const armorDisplayName =
        equippedArmor && getArmorComboDisplayName
            ? getArmorComboDisplayName(
                  equippedArmor.passive,
                  equippedArmor.armorClass,
                  player.inventory,
              )
            : equippedArmor?.name || 'None'

    const lockedSlots = player.lockedSlots || []

    const renderSlotWithLock = (
        label: string,
        value: string | null | undefined,
        slotType: SlotType,
    ) => {
        const isLocked = lockedSlots.includes(slotType as (typeof lockedSlots)[number])
        const canLock =
            !isLocked && requisition >= slotLockCost && lockedSlots.length < maxLockedSlots
        const canUnlock = isLocked

        const variant =
            label === 'Primary' ? 'primary' : label === 'Secondary' ? 'secondary' : 'default'

        return (
            <Flex $align="center" $gap="sm">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <SlotLabel>{label}</SlotLabel>
                    <SlotValue
                        $variant={variant}
                        style={label === 'Primary' ? { color: factionColors.PRIMARY } : undefined}
                        title={value ?? undefined}
                    >
                        {value}
                    </SlotValue>
                </div>
                {onLockSlot && onUnlockSlot && (
                    <LockButton
                        $locked={isLocked}
                        $factionPrimary={factionColors.PRIMARY}
                        onClick={() =>
                            isLocked
                                ? onUnlockSlot(player.id, slotType)
                                : onLockSlot(player.id, slotType)
                        }
                        disabled={!canLock && !canUnlock}
                        title={isLocked ? 'Unlock slot (free)' : `Lock slot (${slotLockCost} Req)`}
                    >
                        {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    </LockButton>
                )}
            </Flex>
        )
    }

    return (
        <LoadoutCard $disconnected={!isConnected && isMultiplayer}>
            <CardHeader>
                <Flex $align="center" $gap="sm">
                    <PlayerName>{player.name}</PlayerName>
                    {/* Connection status indicator for multiplayer */}
                    {isMultiplayer &&
                        (isConnected ? (
                            <Wifi size={14} style={{ color: '#22c55e' }} aria-label="Connected" />
                        ) : (
                            <WifiOff
                                size={14}
                                style={{ color: '#ef4444' }}
                                aria-label="Disconnected"
                            />
                        ))}
                </Flex>
                <Caption $color={!isConnected && isMultiplayer ? 'error' : undefined}>
                    {!isConnected && isMultiplayer ? 'DISCONNECTED' : 'Loadout Active'}
                </Caption>
            </CardHeader>
            <CardContent>
                <Grid $columns={4} $gap="lg">
                    {/* Primary */}
                    <div style={{ gridColumn: 'span 2' }}>
                        {renderSlotWithLock(
                            'Primary',
                            getItemById(player.loadout.primary)?.name || 'None',
                            TYPE.PRIMARY,
                        )}
                    </div>
                    {/* Secondary */}
                    <div style={{ gridColumn: 'span 2' }}>
                        {renderSlotWithLock(
                            'Secondary',
                            getItemById(player.loadout.secondary)?.name,
                            TYPE.SECONDARY,
                        )}
                    </div>

                    {/* Grenade */}
                    <div style={{ gridColumn: 'span 2' }}>
                        {renderSlotWithLock(
                            'Grenade',
                            getItemById(player.loadout.grenade)?.name,
                            TYPE.GRENADE,
                        )}
                    </div>

                    {/* Armor */}
                    <div style={{ gridColumn: 'span 2' }}>
                        {renderSlotWithLock('Armor', armorDisplayName, TYPE.ARMOR)}
                    </div>

                    {/* Booster */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <SlotLabel>Booster</SlotLabel>
                        <SlotValue>{getItemById(player.loadout.booster)?.name || 'None'}</SlotValue>
                    </div>

                    {/* Lock info */}
                    {lockedSlots.length > 0 && (
                        <div style={{ gridColumn: 'span 2' }}>
                            <Badge
                                $variant="faction"
                                $size="sm"
                                $factionPrimary={factionColors.PRIMARY}
                            >
                                🔒 {lockedSlots.length}/{maxLockedSlots} slots locked
                            </Badge>
                        </div>
                    )}

                    {/* Stratagems */}
                    <div style={{ gridColumn: 'span 4', marginTop: '8px' }}>
                        <SlotLabel>Stratagems</SlotLabel>
                        <Grid $columns={4} $gap="sm">
                            {(player.loadout.stratagems || [null, null, null, null]).map(
                                (sid, i) => (
                                    <StratagemSlot key={i}>
                                        {sid ? (
                                            <StratagemName>{getItemById(sid)?.name}</StratagemName>
                                        ) : (
                                            <EmptySlot>EMPTY</EmptySlot>
                                        )}
                                    </StratagemSlot>
                                ),
                            )}
                        </Grid>
                    </div>
                </Grid>
            </CardContent>
        </LoadoutCard>
    )
}
