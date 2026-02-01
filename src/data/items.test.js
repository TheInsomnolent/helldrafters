import { MASTER_DB } from './itemsByWarbond'
import { RARITY, TYPE, TAGS } from '../constants/types'

describe('Data - Items Database', () => {
    describe('MASTER_DB structure', () => {
        it('should be an array', () => {
            expect(Array.isArray(MASTER_DB)).toBe(true)
        })

        it('should contain items', () => {
            expect(MASTER_DB.length).toBeGreaterThan(0)
        })

        it('should have all items with required properties', () => {
            MASTER_DB.forEach((item) => {
                expect(item).toHaveProperty('id')
                expect(item).toHaveProperty('name')
                expect(item).toHaveProperty('type')
                expect(item).toHaveProperty('rarity')
                expect(item).toHaveProperty('tags')
            })
        })

        it('should have unique item IDs', () => {
            const ids = MASTER_DB.map((item) => item.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
        })

        it('should have only valid item types', () => {
            const validTypes = Object.values(TYPE)
            MASTER_DB.forEach((item) => {
                expect(validTypes).toContain(item.type)
            })
        })

        it('should have only valid rarities', () => {
            const validRarities = Object.values(RARITY)
            MASTER_DB.forEach((item) => {
                expect(validRarities).toContain(item.rarity)
            })
        })

        it('should have tags as an array', () => {
            MASTER_DB.forEach((item) => {
                expect(Array.isArray(item.tags)).toBe(true)
            })
        })

        it('should have only valid tags', () => {
            const validTags = Object.values(TAGS)
            MASTER_DB.forEach((item) => {
                item.tags.forEach((tag) => {
                    expect(validTags).toContain(tag)
                })
            })
        })
    })

    describe('MASTER_DB content validation', () => {
        it('should contain primary weapons', () => {
            const primaries = MASTER_DB.filter((item) => item.type === TYPE.PRIMARY)
            expect(primaries.length).toBeGreaterThan(0)
        })

        it('should contain secondary weapons', () => {
            const secondaries = MASTER_DB.filter((item) => item.type === TYPE.SECONDARY)
            expect(secondaries.length).toBeGreaterThan(0)
        })

        it('should contain grenades', () => {
            const grenades = MASTER_DB.filter((item) => item.type === TYPE.GRENADE)
            expect(grenades.length).toBeGreaterThan(0)
        })

        it('should contain stratagems', () => {
            const stratagems = MASTER_DB.filter((item) => item.type === TYPE.STRATAGEM)
            expect(stratagems.length).toBeGreaterThan(0)
        })

        it('should contain armor', () => {
            const armor = MASTER_DB.filter((item) => item.type === TYPE.ARMOR)
            expect(armor.length).toBeGreaterThan(0)
        })

        it('should contain boosters', () => {
            const boosters = MASTER_DB.filter((item) => item.type === TYPE.BOOSTER)
            expect(boosters.length).toBeGreaterThan(0)
        })

        it('should have starting items in database', () => {
            // Check for starting secondary
            const peacemaker = MASTER_DB.find((item) => item.id === 's_peacemaker')
            expect(peacemaker).toBeDefined()
            expect(peacemaker.type).toBe(TYPE.SECONDARY)

            // Check for starting grenade
            const heGrenade = MASTER_DB.find((item) => item.id === 'g_he')
            expect(heGrenade).toBeDefined()
            expect(heGrenade.type).toBe(TYPE.GRENADE)

            // Check for starting armor
            const b01Armor = MASTER_DB.find((item) => item.id === 'a_b01')
            expect(b01Armor).toBeDefined()
            expect(b01Armor.type).toBe(TYPE.ARMOR)
        })

        it('should have AT-tagged items', () => {
            const atItems = MASTER_DB.filter((item) => item.tags.includes(TAGS.AT))
            expect(atItems.length).toBeGreaterThan(0)
        })

        it('should have support weapon tagged items', () => {
            const supportWeapons = MASTER_DB.filter((item) =>
                item.tags.includes(TAGS.SUPPORT_WEAPON),
            )
            expect(supportWeapons.length).toBeGreaterThan(0)
        })
    })

    describe('MASTER_DB specific items', () => {
        it('should include iconic weapons', () => {
            const breaker = MASTER_DB.find((item) => item.id === 'p_breaker')
            expect(breaker).toBeDefined()
            expect(breaker.name).toBe('SG-225 Breaker')

            const railgun = MASTER_DB.find((item) => item.id === 'st_railgun')
            expect(railgun).toBeDefined()
            expect(railgun.tags).toContain(TAGS.AT)
        })

        it('should include stratagem with multiple tags', () => {
            const thermite = MASTER_DB.find((item) => item.id === 'g_thermite')
            expect(thermite).toBeDefined()
            expect(thermite.tags).toContain(TAGS.AT)
            expect(thermite.tags).toContain(TAGS.FIRE)
        })
    })
})
