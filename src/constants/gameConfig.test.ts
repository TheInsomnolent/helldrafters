import {
    STARTING_LOADOUT,
    DIFFICULTY_CONFIG,
    ENDURANCE_MISSION_COUNT,
    getMissionsForDifficulty,
} from './gameConfig'

describe('Constants - Game Configuration', () => {
    describe('STARTING_LOADOUT', () => {
        it('should have all required loadout slots', () => {
            expect(STARTING_LOADOUT).toHaveProperty('primary')
            expect(STARTING_LOADOUT).toHaveProperty('secondary')
            expect(STARTING_LOADOUT).toHaveProperty('grenade')
            expect(STARTING_LOADOUT).toHaveProperty('armor')
            expect(STARTING_LOADOUT).toHaveProperty('booster')
            expect(STARTING_LOADOUT).toHaveProperty('stratagems')
        })

        it('should have correct starting weapon values', () => {
            expect(STARTING_LOADOUT.primary).toBeNull()
            expect(STARTING_LOADOUT.secondary).toBe('s_peacemaker')
            expect(STARTING_LOADOUT.grenade).toBe('g_he')
            expect(STARTING_LOADOUT.armor).toBe('a_b01')
            expect(STARTING_LOADOUT.booster).toBeNull()
        })

        it('should have 4 stratagem slots', () => {
            expect(STARTING_LOADOUT.stratagems).toHaveLength(4)
            expect(STARTING_LOADOUT.stratagems.every((s) => s === null)).toBe(true)
        })
    })

    describe('DIFFICULTY_CONFIG', () => {
        it('should have exactly 10 difficulty levels', () => {
            expect(DIFFICULTY_CONFIG).toHaveLength(10)
        })

        it('should have sequential difficulty levels 1-10', () => {
            DIFFICULTY_CONFIG.forEach((config, index) => {
                expect(config.level).toBe(index + 1)
            })
        })

        it('should have correct difficulty names', () => {
            expect(DIFFICULTY_CONFIG[0].name).toBe('Trivial')
            expect(DIFFICULTY_CONFIG[3].name).toBe('Challenging')
            expect(DIFFICULTY_CONFIG[9].name).toBe('Super Helldive')
        })

        it('should require AT starting from level 4', () => {
            // Levels 1-3 should not require AT
            expect(DIFFICULTY_CONFIG[0].reqAT).toBe(false)
            expect(DIFFICULTY_CONFIG[1].reqAT).toBe(false)
            expect(DIFFICULTY_CONFIG[2].reqAT).toBe(false)

            // Levels 4-10 should require AT
            for (let i = 3; i < 10; i++) {
                expect(DIFFICULTY_CONFIG[i].reqAT).toBe(true)
            }
        })

        it('should have all required properties for each difficulty', () => {
            DIFFICULTY_CONFIG.forEach((config) => {
                expect(config).toHaveProperty('level')
                expect(config).toHaveProperty('name')
                expect(config).toHaveProperty('reqAT')
            })
        })
    })

    describe('ENDURANCE_MISSION_COUNT', () => {
        it('should have mission counts for all 10 difficulty levels', () => {
            for (let i = 1; i <= 10; i++) {
                expect(ENDURANCE_MISSION_COUNT[i]).toBeDefined()
            }
        })

        it('should have 1 mission for Trivial and Easy (D1-D2)', () => {
            expect(ENDURANCE_MISSION_COUNT[1]).toBe(1)
            expect(ENDURANCE_MISSION_COUNT[2]).toBe(1)
        })

        it('should have 2 missions for Medium and Challenging (D3-D4)', () => {
            expect(ENDURANCE_MISSION_COUNT[3]).toBe(2)
            expect(ENDURANCE_MISSION_COUNT[4]).toBe(2)
        })

        it('should have 3 missions for Hard through Super Helldive (D5-D10)', () => {
            for (let i = 5; i <= 10; i++) {
                expect(ENDURANCE_MISSION_COUNT[i]).toBe(3)
            }
        })
    })

    describe('getMissionsForDifficulty', () => {
        it('should return correct mission count for each difficulty', () => {
            expect(getMissionsForDifficulty(1)).toBe(1)
            expect(getMissionsForDifficulty(2)).toBe(1)
            expect(getMissionsForDifficulty(3)).toBe(2)
            expect(getMissionsForDifficulty(4)).toBe(2)
            expect(getMissionsForDifficulty(5)).toBe(3)
            expect(getMissionsForDifficulty(10)).toBe(3)
        })

        it('should return 1 for invalid difficulty levels', () => {
            expect(getMissionsForDifficulty(0)).toBe(1)
            expect(getMissionsForDifficulty(11)).toBe(1)
            expect(getMissionsForDifficulty(-1)).toBe(1)
        })
    })
})
