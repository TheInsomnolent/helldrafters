import { RARITY, TYPE, FACTION, TAGS } from './types'

describe('Constants - Types', () => {
    describe('RARITY', () => {
        it('should have exactly 4 rarity levels', () => {
            expect(Object.keys(RARITY)).toHaveLength(4)
        })

        it('should have correct rarity values', () => {
            expect(RARITY.COMMON).toBe('Common')
            expect(RARITY.UNCOMMON).toBe('Uncommon')
            expect(RARITY.RARE).toBe('Rare')
            expect(RARITY.LEGENDARY).toBe('Legendary')
        })
    })

    describe('TYPE', () => {
        it('should have exactly 6 item types', () => {
            expect(Object.keys(TYPE)).toHaveLength(6)
        })

        it('should have correct type values', () => {
            expect(TYPE.PRIMARY).toBe('Primary')
            expect(TYPE.SECONDARY).toBe('Secondary')
            expect(TYPE.GRENADE).toBe('Grenade')
            expect(TYPE.STRATAGEM).toBe('Stratagem')
            expect(TYPE.BOOSTER).toBe('Booster')
            expect(TYPE.ARMOR).toBe('Armor')
        })
    })

    describe('FACTION', () => {
        it('should have exactly 3 factions', () => {
            expect(Object.keys(FACTION)).toHaveLength(3)
        })

        it('should have correct faction values', () => {
            expect(FACTION.BUGS).toBe('terminid')
            expect(FACTION.BOTS).toBe('automaton')
            expect(FACTION.SQUIDS).toBe('illuminate')
        })
    })

    describe('TAGS', () => {
        it('should have exactly 9 tags', () => {
            expect(Object.keys(TAGS)).toHaveLength(9)
        })

        it('should have correct tag values', () => {
            expect(TAGS.FIRE).toBe('Fire')
            expect(TAGS.AT).toBe('Anti-Tank')
            expect(TAGS.STUN).toBe('Stun')
            expect(TAGS.SMOKE).toBe('Smoke')
            expect(TAGS.BACKPACK).toBe('Backpack')
            expect(TAGS.SUPPORT_WEAPON).toBe('Support Weapon')
            expect(TAGS.PRECISION).toBe('Precision')
            expect(TAGS.EXPLOSIVE).toBe('Explosive')
            expect(TAGS.DEFENSIVE).toBe('Defensive')
        })
    })
})
