import { getFirstEmptyStratagemSlot, areStratagemSlotsFull } from './loadoutHelpers'
import { Loadout } from '../types'

describe('Utils - Loadout Helpers', () => {
    const createLoadout = (overrides: Partial<Loadout> = {}): Loadout => ({
        primary: null,
        secondary: null,
        grenade: null,
        armor: null,
        booster: null,
        stratagems: [null, null, null, null],
        ...overrides,
    })

    describe('Stratagem Slot Helpers', () => {
        describe('getFirstEmptyStratagemSlot', () => {
            it('should return 0 for empty loadout', () => {
                const loadout = createLoadout()
                expect(getFirstEmptyStratagemSlot(loadout)).toBe(0)
            })

            it('should return first empty slot index', () => {
                const loadout = createLoadout({
                    stratagems: ['st_ops', null, null, null],
                })
                expect(getFirstEmptyStratagemSlot(loadout)).toBe(1)
            })

            it('should return -1 when all slots full', () => {
                const loadout = createLoadout({
                    stratagems: [
                        'st_ops',
                        'st_eagle_airstrike',
                        'st_recoilless',
                        'st_orbital_laser',
                    ],
                })
                expect(getFirstEmptyStratagemSlot(loadout)).toBe(-1)
            })

            it('should find gap in middle of array', () => {
                const loadout = createLoadout({
                    stratagems: ['st_ops', 'st_eagle_airstrike', null, 'st_orbital_laser'],
                })
                expect(getFirstEmptyStratagemSlot(loadout)).toBe(2)
            })
        })

        describe('areStratagemSlotsFull', () => {
            it('should return false for empty loadout', () => {
                const loadout = createLoadout()
                expect(areStratagemSlotsFull(loadout)).toBe(false)
            })

            it('should return false with partial stratagems', () => {
                const loadout = createLoadout({
                    stratagems: ['st_ops', 'st_eagle_airstrike', null, null],
                })
                expect(areStratagemSlotsFull(loadout)).toBe(false)
            })

            it('should return true when all slots filled', () => {
                const loadout = createLoadout({
                    stratagems: [
                        'st_ops',
                        'st_eagle_airstrike',
                        'st_recoilless',
                        'st_orbital_laser',
                    ],
                })
                expect(areStratagemSlotsFull(loadout)).toBe(true)
            })
        })
    })
})
