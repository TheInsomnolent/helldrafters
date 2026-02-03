import { getItemById, itemHasTag, anyItemHasTag } from './itemHelpers'
import { TYPE, TAGS, Item } from '../types'
import { MASTER_DB } from '../data/itemsByWarbond'

describe('Utils - Item Helpers', () => {
    describe('getItemById', () => {
        it('should return item from master database', () => {
            const item = getItemById('s_peacemaker')
            expect(item).toBeDefined()
            expect(item!.name).toBe('P-2 Peacemaker')
        })

        it('should return undefined for non-existent item', () => {
            const item = getItemById('nonexistent_item')
            expect(item).toBeUndefined()
        })

        it('should return items of different types', () => {
            const primary = getItemById('p_liberator')
            const secondary = getItemById('s_peacemaker')
            const grenade = getItemById('g_he')
            const armor = getItemById('a_b01')
            const stratagem = getItemById('st_e_airstrike')
            const booster = getItemById('b_stamina')

            expect(primary).toBeDefined()
            expect(secondary).toBeDefined()
            expect(grenade).toBeDefined()
            expect(armor).toBeDefined()
            expect(stratagem).toBeDefined()
            expect(booster).toBeDefined()
        })
    })

    describe('itemHasTag', () => {
        it('should return true if item has the tag', () => {
            // Find an item with FIRE tag
            const fireItem = MASTER_DB.find((i) => i.tags?.includes(TAGS.FIRE))
            expect(fireItem).toBeDefined()
            expect(itemHasTag(fireItem!.id, TAGS.FIRE)).toBe(true)
        })

        it('should return false if item does not have the tag', () => {
            const peacemaker = getItemById('s_peacemaker')
            expect(peacemaker).toBeDefined()
            expect(itemHasTag(peacemaker!.id, TAGS.FIRE)).toBe(false)
        })

        it('should return false for non-existent item', () => {
            expect(itemHasTag('nonexistent_item', TAGS.FIRE)).toBe(false)
        })
    })

    describe('anyItemHasTag', () => {
        it('should return true if any item has the tag', () => {
            // Find items with AT tag
            const atItem = MASTER_DB.find((i) => i.tags?.includes(TAGS.AT))
            expect(atItem).toBeDefined()
            expect(anyItemHasTag([atItem!.id, 's_peacemaker'], TAGS.AT)).toBe(true)
        })

        it('should return false if no items have the tag', () => {
            expect(anyItemHasTag(['s_peacemaker', 'g_he'], TAGS.BACKPACK)).toBe(false)
        })

        it('should return false for empty array', () => {
            expect(anyItemHasTag([], TAGS.FIRE)).toBe(false)
        })
    })

    describe('MASTER_DB consistency', () => {
        it('all items should have required properties', () => {
            MASTER_DB.forEach((item: Item) => {
                expect(item.id).toBeDefined()
                expect(typeof item.id).toBe('string')
                expect(item.name).toBeDefined()
                expect(typeof item.name).toBe('string')
                expect(item.type).toBeDefined()
                expect(Object.values(TYPE)).toContain(item.type)
                expect(item.rarity).toBeDefined()
            })
        })

        it('no duplicate IDs should exist', () => {
            const ids = MASTER_DB.map((i: Item) => i.id)
            const uniqueIds = new Set(ids)

            expect(uniqueIds.size).toBe(ids.length)
        })
    })
})
