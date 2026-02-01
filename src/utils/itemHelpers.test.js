import {
    getItemById,
    getItemsByIds,
    itemHasTag,
    getItemsByType,
    getItemsByRarity,
    anyItemHasTag,
    getItemsWithTag,
    countItemsByType,
    getUniqueArmorCombos,
    playerHasAccessToArmorCombo,
    hasArmorCombo,
} from './itemHelpers'
import { TYPE, RARITY, TAGS } from '../constants/types'
import { ARMOR_PASSIVE, ARMOR_CLASS } from '../constants/armorPassives'

describe('Utils - Item Helpers', () => {
    describe('getItemById', () => {
        it('should find item by ID', () => {
            const item = getItemById('s_peacemaker')
            expect(item).toBeDefined()
            expect(item.name).toBe('P-2 Peacemaker')
        })

        it('should return undefined for non-existent ID', () => {
            const item = getItemById('nonexistent_id')
            expect(item).toBeUndefined()
        })
    })

    describe('getItemsByIds', () => {
        it('should return multiple items by IDs', () => {
            const items = getItemsByIds(['s_peacemaker', 'g_he', 'a_b01'])
            expect(items).toHaveLength(3)
            expect(items.every((item) => item !== undefined)).toBe(true)
        })

        it('should skip non-existent IDs', () => {
            const items = getItemsByIds(['s_peacemaker', 'nonexistent', 'g_he'])
            expect(items).toHaveLength(2)
        })

        it('should return empty array for empty input', () => {
            const items = getItemsByIds([])
            expect(items).toHaveLength(0)
        })
    })

    describe('itemHasTag', () => {
        it('should return true if item has the tag', () => {
            expect(itemHasTag('g_thermite', TAGS.AT)).toBe(true)
            expect(itemHasTag('g_thermite', TAGS.FIRE)).toBe(true)
        })

        it('should return false if item does not have the tag', () => {
            expect(itemHasTag('s_peacemaker', TAGS.AT)).toBe(false)
        })

        it('should return false for non-existent item', () => {
            expect(itemHasTag('nonexistent', TAGS.AT)).toBe(false)
        })
    })

    describe('getItemsByType', () => {
        it('should return all items of a specific type', () => {
            const primaries = getItemsByType(TYPE.PRIMARY)
            expect(primaries.length).toBeGreaterThan(0)
            expect(primaries.every((item) => item.type === TYPE.PRIMARY)).toBe(true)
        })

        it('should return all boosters', () => {
            const boosters = getItemsByType(TYPE.BOOSTER)
            expect(boosters.length).toBeGreaterThan(0)
            expect(boosters.every((item) => item.type === TYPE.BOOSTER)).toBe(true)
        })
    })

    describe('getItemsByRarity', () => {
        it('should return all common items', () => {
            const commons = getItemsByRarity(RARITY.COMMON)
            expect(commons.length).toBeGreaterThan(0)
            expect(commons.every((item) => item.rarity === RARITY.COMMON)).toBe(true)
        })

        it('should return all rare items', () => {
            const rares = getItemsByRarity(RARITY.RARE)
            expect(rares.length).toBeGreaterThan(0)
            expect(rares.every((item) => item.rarity === RARITY.RARE)).toBe(true)
        })
    })

    describe('anyItemHasTag', () => {
        it('should return true if any item has the tag', () => {
            expect(anyItemHasTag(['s_peacemaker', 'g_thermite'], TAGS.AT)).toBe(true)
        })

        it('should return false if no items have the tag', () => {
            expect(anyItemHasTag(['s_peacemaker', 'g_he'], TAGS.AT)).toBe(false)
        })

        it('should return false for empty array', () => {
            expect(anyItemHasTag([], TAGS.AT)).toBe(false)
        })
    })

    describe('getItemsWithTag', () => {
        it('should return all items with AT tag', () => {
            const atItems = getItemsWithTag(TAGS.AT)
            expect(atItems.length).toBeGreaterThan(0)
            expect(atItems.every((item) => item.tags.includes(TAGS.AT))).toBe(true)
        })

        it('should return all items with FIRE tag', () => {
            const fireItems = getItemsWithTag(TAGS.FIRE)
            expect(fireItems.length).toBeGreaterThan(0)
            expect(fireItems.every((item) => item.tags.includes(TAGS.FIRE))).toBe(true)
        })

        it('should return all items with BACKPACK tag', () => {
            const backpacks = getItemsWithTag(TAGS.BACKPACK)
            expect(backpacks.length).toBeGreaterThan(0)
            expect(backpacks.every((item) => item.tags.includes(TAGS.BACKPACK))).toBe(true)
        })
    })

    describe('countItemsByType', () => {
        it('should count stratagems in inventory', () => {
            const inventory = ['st_ops', 'st_railgun', 's_peacemaker', 'st_ac']
            const count = countItemsByType(inventory, TYPE.STRATAGEM)
            expect(count).toBe(3)
        })

        it('should count primaries in inventory', () => {
            const inventory = ['p_breaker', 's_peacemaker', 'p_slugger']
            const count = countItemsByType(inventory, TYPE.PRIMARY)
            expect(count).toBe(2)
        })

        it('should return 0 for empty inventory', () => {
            const count = countItemsByType([], TYPE.STRATAGEM)
            expect(count).toBe(0)
        })
    })

    describe('getUniqueArmorCombos', () => {
        it('should group armors by passive and armorClass', () => {
            const testArmors = [
                { id: 'a1', passive: ARMOR_PASSIVE.SCOUT, armorClass: ARMOR_CLASS.LIGHT },
                { id: 'a2', passive: ARMOR_PASSIVE.SCOUT, armorClass: ARMOR_CLASS.LIGHT },
                { id: 'a3', passive: ARMOR_PASSIVE.FORTIFIED, armorClass: ARMOR_CLASS.HEAVY },
            ]

            const combos = getUniqueArmorCombos(testArmors)

            expect(combos).toHaveLength(2)
            const scoutLightCombo = combos.find(
                (c) => c.passive === ARMOR_PASSIVE.SCOUT && c.armorClass === ARMOR_CLASS.LIGHT,
            )
            expect(scoutLightCombo).toBeDefined()
            expect(scoutLightCombo.items).toHaveLength(2)
        })

        it('should skip armors without passive or armorClass', () => {
            const testArmors = [
                { id: 'a1', passive: ARMOR_PASSIVE.SCOUT, armorClass: ARMOR_CLASS.LIGHT },
                { id: 'a2', passive: null, armorClass: ARMOR_CLASS.LIGHT },
                { id: 'a3', passive: ARMOR_PASSIVE.FORTIFIED, armorClass: undefined },
            ]

            const combos = getUniqueArmorCombos(testArmors)

            expect(combos).toHaveLength(1)
        })

        it('should return empty array for empty input', () => {
            const combos = getUniqueArmorCombos([])
            expect(combos).toHaveLength(0)
        })
    })

    describe('playerHasAccessToArmorCombo', () => {
        const mockCombo = {
            passive: ARMOR_PASSIVE.SCOUT,
            armorClass: ARMOR_CLASS.LIGHT,
            items: [
                { id: 'a_sc34', warbond: 'helldivers_mobilize' },
                { id: 'a_sc37', superstore: true },
                { id: 'a_cw4', warbond: 'polar_patriots' },
            ],
        }

        it('should return true when player has warbond access to at least one armor', () => {
            const result = playerHasAccessToArmorCombo(
                mockCombo,
                ['helldivers_mobilize'],
                false,
                [],
            )
            expect(result).toBe(true)
        })

        it('should return true when player has superstore access and combo has superstore armor', () => {
            const result = playerHasAccessToArmorCombo(
                mockCombo,
                [], // No warbonds
                true, // Has superstore
                [],
            )
            expect(result).toBe(true)
        })

        it('should return false when player has no access to any armor in combo', () => {
            const result = playerHasAccessToArmorCombo(
                mockCombo,
                [], // No warbonds
                false, // No superstore
                [],
            )
            expect(result).toBe(false)
        })

        it('should exclude armors in excludedItems list', () => {
            // Exclude the only warbond armor, no superstore
            const result = playerHasAccessToArmorCombo(
                mockCombo,
                ['helldivers_mobilize'],
                false,
                ['a_sc34'], // Exclude the only accessible armor
            )
            expect(result).toBe(false)
        })

        it('should allow access when not all combo items are excluded', () => {
            const comboWithMultipleWarbondArmors = {
                passive: ARMOR_PASSIVE.FORTIFIED,
                armorClass: ARMOR_CLASS.HEAVY,
                items: [
                    { id: 'a_fs05', warbond: 'helldivers_mobilize' },
                    { id: 'a_fs23', warbond: 'helldivers_mobilize' },
                ],
            }

            const result = playerHasAccessToArmorCombo(
                comboWithMultipleWarbondArmors,
                ['helldivers_mobilize'],
                false,
                ['a_fs05'], // Exclude one but not the other
            )
            expect(result).toBe(true)
        })

        it('should return true for base game armors (no warbond/superstore)', () => {
            const baseGameCombo = {
                passive: ARMOR_PASSIVE.EXTRA_PADDING,
                armorClass: ARMOR_CLASS.MEDIUM,
                items: [{ id: 'a_base', warbond: undefined, superstore: undefined }],
            }

            const result = playerHasAccessToArmorCombo(
                baseGameCombo,
                [], // No warbonds
                false, // No superstore
                [],
            )
            expect(result).toBe(true)
        })

        it('should handle undefined playerWarbonds gracefully', () => {
            const result = playerHasAccessToArmorCombo(
                mockCombo,
                undefined,
                true, // Has superstore
                [],
            )
            expect(result).toBe(true)
        })

        it('should handle undefined includeSuperstore gracefully (treat as false)', () => {
            const superstoreOnlyCombo = {
                passive: ARMOR_PASSIVE.SCOUT,
                armorClass: ARMOR_CLASS.LIGHT,
                items: [{ id: 'a_ss1', superstore: true }],
            }

            const result = playerHasAccessToArmorCombo(
                superstoreOnlyCombo,
                [],
                undefined, // Undefined should be treated as false
                [],
            )
            expect(result).toBe(false)
        })

        it('should handle undefined excludedItems gracefully', () => {
            const result = playerHasAccessToArmorCombo(
                mockCombo,
                ['helldivers_mobilize'],
                false,
                undefined,
            )
            expect(result).toBe(true)
        })
    })

    describe('hasArmorCombo', () => {
        it('should return true if inventory contains armor with matching combo', () => {
            const inventory = ['a_sc34', 's_peacemaker'] // SC-34 Infiltrator is Scout/Light
            const result = hasArmorCombo(inventory, ARMOR_PASSIVE.SCOUT, ARMOR_CLASS.LIGHT)
            expect(result).toBe(true)
        })

        it('should return false if inventory does not contain matching combo', () => {
            const inventory = ['a_sc34', 's_peacemaker'] // SC-34 is Scout/Light, not Fortified/Heavy
            const result = hasArmorCombo(inventory, ARMOR_PASSIVE.FORTIFIED, ARMOR_CLASS.HEAVY)
            expect(result).toBe(false)
        })

        it('should return false for empty inventory', () => {
            const result = hasArmorCombo([], ARMOR_PASSIVE.SCOUT, ARMOR_CLASS.LIGHT)
            expect(result).toBe(false)
        })
    })
})
