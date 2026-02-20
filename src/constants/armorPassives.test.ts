import { ARMOR_PASSIVE, ARMOR_PASSIVE_DESCRIPTIONS } from './armorPassives'

describe('Constants - Armor Passives', () => {
    it('should provide a description for every armor passive', () => {
        Object.values(ARMOR_PASSIVE).forEach((passive) => {
            expect(ARMOR_PASSIVE_DESCRIPTIONS[passive]).toBeDefined()
            expect(ARMOR_PASSIVE_DESCRIPTIONS[passive]).not.toEqual('')
        })
    })
})
