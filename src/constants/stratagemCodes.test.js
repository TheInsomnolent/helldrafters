import {
    STRATAGEM_CODES,
    getStratagemIds,
    getRandomStratagem,
    KEY_TO_DIRECTION,
    DIRECTION_SYMBOLS,
} from './stratagemCodes'

describe('stratagemCodes', () => {
    describe('STRATAGEM_CODES', () => {
        it('should have valid structure for all stratagems', () => {
            Object.entries(STRATAGEM_CODES).forEach(([_id, data]) => {
                expect(data).toHaveProperty('name')
                expect(data).toHaveProperty('code')
                expect(typeof data.name).toBe('string')
                expect(Array.isArray(data.code)).toBe(true)
                expect(data.code.length).toBeGreaterThan(0)

                // All directions should be valid (U, D, L, R)
                data.code.forEach((dir) => {
                    expect(['U', 'D', 'L', 'R']).toContain(dir)
                })
            })
        })

        it('should have codes for common stratagems', () => {
            expect(STRATAGEM_CODES['st_ops']).toBeDefined()
            expect(STRATAGEM_CODES['st_railgun']).toBeDefined()
            expect(STRATAGEM_CODES['st_e_500']).toBeDefined()
            expect(STRATAGEM_CODES['st_reinforce']).toBeDefined()
        })
    })

    describe('getStratagemIds', () => {
        it('should return array of stratagem IDs', () => {
            const ids = getStratagemIds()
            expect(Array.isArray(ids)).toBe(true)
            expect(ids.length).toBeGreaterThan(0)
            expect(ids).toContain('st_ops')
        })
    })

    describe('getRandomStratagem', () => {
        it('should return a random stratagem with valid structure', () => {
            const stratagem = getRandomStratagem()
            expect(stratagem).toHaveProperty('id')
            expect(stratagem).toHaveProperty('name')
            expect(stratagem).toHaveProperty('code')
            expect(Array.isArray(stratagem.code)).toBe(true)
        })

        it('should return different stratagems (probability test)', () => {
            const results = new Set()
            for (let i = 0; i < 20; i++) {
                results.add(getRandomStratagem().id)
            }
            // With 60+ stratagems, we should get more than 1 unique result in 20 tries
            expect(results.size).toBeGreaterThan(1)
        })
    })

    describe('KEY_TO_DIRECTION', () => {
        it('should map arrow keys correctly', () => {
            expect(KEY_TO_DIRECTION['ArrowUp']).toBe('U')
            expect(KEY_TO_DIRECTION['ArrowDown']).toBe('D')
            expect(KEY_TO_DIRECTION['ArrowLeft']).toBe('L')
            expect(KEY_TO_DIRECTION['ArrowRight']).toBe('R')
        })

        it('should map WASD keys correctly', () => {
            expect(KEY_TO_DIRECTION['w']).toBe('U')
            expect(KEY_TO_DIRECTION['W']).toBe('U')
            expect(KEY_TO_DIRECTION['s']).toBe('D')
            expect(KEY_TO_DIRECTION['S']).toBe('D')
            expect(KEY_TO_DIRECTION['a']).toBe('L')
            expect(KEY_TO_DIRECTION['A']).toBe('L')
            expect(KEY_TO_DIRECTION['d']).toBe('R')
            expect(KEY_TO_DIRECTION['D']).toBe('R')
        })
    })

    describe('DIRECTION_SYMBOLS', () => {
        it('should have symbols for all directions', () => {
            expect(DIRECTION_SYMBOLS['U']).toBe('▲')
            expect(DIRECTION_SYMBOLS['D']).toBe('▼')
            expect(DIRECTION_SYMBOLS['L']).toBe('◄')
            expect(DIRECTION_SYMBOLS['R']).toBe('►')
        })
    })
})
