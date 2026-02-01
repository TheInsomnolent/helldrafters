import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoadoutDisplay from './LoadoutDisplay'
import { FACTION } from '../constants/types'

describe('LoadoutDisplay', () => {
    const mockPlayer = {
        id: 'player1',
        name: 'Test Player',
        loadout: {
            primary: 'p_lib',
            secondary: 's_peace',
            grenade: 'g_frag',
            armor: 'a_sc_light',
            booster: null,
            stratagems: ['st_reinforce', 'st_resupply', null, null],
        },
        lockedSlots: [],
        inventory: [],
    }

    const mockGetItemById = (id) => {
        const items = {
            p_lib: { id: 'p_lib', name: 'AR-23 Liberator', type: 'Primary' },
            s_peace: { id: 's_peace', name: 'P-2 Peacemaker', type: 'Secondary' },
            g_frag: { id: 'g_frag', name: 'G-6 Frag', type: 'Grenade' },
            a_sc_light: {
                id: 'a_sc_light',
                name: 'SC-30 Trailblazer Scout',
                type: 'Armor',
                passive: 'scout',
                armorClass: 'light',
            },
            st_reinforce: { id: 'st_reinforce', name: 'Reinforce', type: 'Stratagem' },
            st_resupply: { id: 'st_resupply', name: 'Resupply', type: 'Stratagem' },
        }
        return items[id] || null
    }

    const mockGetArmorComboDisplayName = () => 'SC-30 Trailblazer Scout'

    it('renders player name and loadout items', () => {
        const mockOnLockSlot = jest.fn()
        const mockOnUnlockSlot = jest.fn()

        render(
            <LoadoutDisplay
                player={mockPlayer}
                getItemById={mockGetItemById}
                getArmorComboDisplayName={mockGetArmorComboDisplayName}
                faction={FACTION.BUGS}
                requisition={10}
                slotLockCost={2}
                maxLockedSlots={3}
                onLockSlot={mockOnLockSlot}
                onUnlockSlot={mockOnUnlockSlot}
            />,
        )

        // Check that player name is rendered
        expect(screen.getByText('Test Player')).toBeInTheDocument()

        // Check that loadout items are rendered
        expect(screen.getByText('AR-23 Liberator')).toBeInTheDocument()
        expect(screen.getByText('P-2 Peacemaker')).toBeInTheDocument()
    })

    it('renders without lock/unlock buttons when handlers are not provided', () => {
        render(
            <LoadoutDisplay
                player={mockPlayer}
                getItemById={mockGetItemById}
                getArmorComboDisplayName={mockGetArmorComboDisplayName}
                faction={FACTION.BUGS}
                requisition={10}
                slotLockCost={2}
                maxLockedSlots={3}
            />,
        )

        // Component should still render player name and items
        expect(screen.getByText('Test Player')).toBeInTheDocument()
        expect(screen.getByText('AR-23 Liberator')).toBeInTheDocument()
    })

    it('accepts both lock and unlock handlers', () => {
        const mockOnLockSlot = jest.fn()
        const mockOnUnlockSlot = jest.fn()

        render(
            <LoadoutDisplay
                player={mockPlayer}
                getItemById={mockGetItemById}
                getArmorComboDisplayName={mockGetArmorComboDisplayName}
                faction={FACTION.BUGS}
                requisition={10}
                slotLockCost={2}
                maxLockedSlots={3}
                onLockSlot={mockOnLockSlot}
                onUnlockSlot={mockOnUnlockSlot}
            />,
        )

        // Handlers should not be called on render
        expect(mockOnLockSlot).not.toHaveBeenCalled()
        expect(mockOnUnlockSlot).not.toHaveBeenCalled()
    })

    it('shows "Loadout Active" for connected players in multiplayer', () => {
        render(
            <LoadoutDisplay
                player={mockPlayer}
                getItemById={mockGetItemById}
                getArmorComboDisplayName={mockGetArmorComboDisplayName}
                faction={FACTION.BUGS}
                requisition={10}
                slotLockCost={2}
                maxLockedSlots={3}
                isConnected={true}
                isMultiplayer={true}
            />,
        )

        expect(screen.getByText('Loadout Active')).toBeInTheDocument()
    })

    it('shows "DISCONNECTED" for disconnected players in multiplayer', () => {
        render(
            <LoadoutDisplay
                player={mockPlayer}
                getItemById={mockGetItemById}
                getArmorComboDisplayName={mockGetArmorComboDisplayName}
                faction={FACTION.BUGS}
                requisition={10}
                slotLockCost={2}
                maxLockedSlots={3}
                isConnected={false}
                isMultiplayer={true}
            />,
        )

        expect(screen.getByText('DISCONNECTED')).toBeInTheDocument()
    })

    it('shows "Loadout Active" in solo mode regardless of isConnected', () => {
        render(
            <LoadoutDisplay
                player={mockPlayer}
                getItemById={mockGetItemById}
                getArmorComboDisplayName={mockGetArmorComboDisplayName}
                faction={FACTION.BUGS}
                requisition={10}
                slotLockCost={2}
                maxLockedSlots={3}
                isConnected={false}
                isMultiplayer={false}
            />,
        )

        expect(screen.getByText('Loadout Active')).toBeInTheDocument()
    })
})
