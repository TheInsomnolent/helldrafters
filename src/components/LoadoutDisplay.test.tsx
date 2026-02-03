import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ThemeProvider } from 'styled-components'
import LoadoutDisplay from './LoadoutDisplay'
import { FACTION } from '../constants/types'
import { theme } from '../styles'
import type { Player, GetItemById, GetArmorComboDisplayName, Item, Loadout } from '../types'

// Helper to render with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) =>
    render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)

describe('LoadoutDisplay', () => {
    const mockLoadout: Loadout = {
        primary: 'p_lib',
        secondary: 's_peace',
        grenade: 'g_frag',
        armor: 'a_sc_light',
        booster: null,
        stratagems: ['st_reinforce', 'st_resupply', null, null],
    }

    const mockPlayer: Player = {
        id: 'player1',
        name: 'Test Player',
        loadout: mockLoadout,
        lockedSlots: [],
        inventory: [],
        disabledWarbonds: [],
        superstoreItems: [],
        extracted: false,
        warbonds: [],
        includeSuperstore: true,
    }

    const mockGetItemById: GetItemById = (id) => {
        const items: Record<string, Item> = {
            p_lib: { id: 'p_lib', name: 'AR-23 Liberator', type: 'Primary' } as Item,
            s_peace: { id: 's_peace', name: 'P-2 Peacemaker', type: 'Secondary' } as Item,
            g_frag: { id: 'g_frag', name: 'G-6 Frag', type: 'Grenade' } as Item,
            a_sc_light: {
                id: 'a_sc_light',
                name: 'SC-30 Trailblazer Scout',
                type: 'Armor',
                passive: 'scout',
                armorClass: 'light',
            } as Item,
            st_reinforce: { id: 'st_reinforce', name: 'Reinforce', type: 'Stratagem' } as Item,
            st_resupply: { id: 'st_resupply', name: 'Resupply', type: 'Stratagem' } as Item,
        }
        return id ? items[id] : undefined
    }

    const mockGetArmorComboDisplayName: GetArmorComboDisplayName = () => 'SC-30 Trailblazer Scout'

    it('renders player name and loadout items', () => {
        const mockOnLockSlot = jest.fn()
        const mockOnUnlockSlot = jest.fn()

        renderWithTheme(
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
        renderWithTheme(
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

        renderWithTheme(
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
        renderWithTheme(
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
        renderWithTheme(
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
        renderWithTheme(
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
