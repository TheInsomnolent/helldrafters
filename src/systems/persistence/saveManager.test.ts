import {
    createSaveState,
    validateSaveState,
    normalizeLoadedState,
    parseSaveFile,
} from './saveManager'

describe('Systems - Save Manager', () => {
    const mockGameState = {
        phase: 'DASHBOARD' as const,
        gameConfig: {
            playerCount: 1,
            starRating: 3,
            faction: 'terminid' as const,
            subfaction: 'standard',
            globalUniqueness: true,
            burnCards: true,
            customStart: false,
            endlessMode: false,
            enduranceMode: false,
            debugEventsMode: false,
            brutalityMode: false,
        },
        currentDiff: 4,
        requisition: 50,
        samples: { common: 0, rare: 0, superRare: 0 },
        burnedCards: ['p_liberator', 'st_gatling'],
        seenEvents: [] as string[],
        players: [
            {
                id: '1',
                name: 'Helldiver 1',
                inventory: ['s_peacemaker', 'g_he'],
                loadout: {
                    primary: null,
                    secondary: 's_peacemaker',
                    grenade: 'g_he',
                    armor: 'a_b01',
                    booster: null,
                    stratagems: [null, null, null, null] as (string | null)[],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
                warbonds: [],
                includeSuperstore: false,
            },
        ],
        draftState: {
            activePlayerIndex: 0,
            roundCards: [],
            isRerolling: false,
            pendingStratagem: null,
            extraDraftRound: 0,
            draftOrder: [],
            isRetrospective: false,
            retrospectivePlayerIndex: null,
        },
        eventsEnabled: true,
        currentEvent: null,
        eventPlayerChoice: null,
        customSetup: { difficulty: 1, loadouts: [] },
        selectedPlayer: 0,
    }

    describe('createSaveState', () => {
        it('should create a complete save state', () => {
            const saveState = createSaveState(
                mockGameState as unknown as Parameters<typeof createSaveState>[0],
            )

            expect(saveState.phase).toBe('DASHBOARD')
            expect(saveState.gameConfig).toEqual(mockGameState.gameConfig)
            expect(saveState.currentDiff).toBe(4)
            expect(saveState.requisition).toBe(50)
            expect(saveState.players).toEqual(mockGameState.players)
            expect(saveState.exportedAt).toBeDefined()
        })

        it('should include timestamp', () => {
            const saveState = createSaveState(
                mockGameState as unknown as Parameters<typeof createSaveState>[0],
            )
            expect(saveState.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
        })

        it('should preserve all game state fields', () => {
            const saveState = createSaveState(
                mockGameState as unknown as Parameters<typeof createSaveState>[0],
            )

            expect(saveState.burnedCards).toEqual(mockGameState.burnedCards)
            expect(saveState.draftState).toEqual(mockGameState.draftState)
            expect(saveState.eventsEnabled).toBe(true)
        })
    })

    describe('validateSaveState', () => {
        it('should validate correct save state', () => {
            const result = validateSaveState(mockGameState)

            expect(result.valid).toBe(true)
            expect(result.error).toBeNull()
        })

        it('should reject null state', () => {
            const result = validateSaveState(null)

            expect(result.valid).toBe(false)
            expect(result.error).toContain('null or undefined')
        })

        it('should reject state without phase', () => {
            const invalidState = { ...mockGameState, phase: null }
            const result = validateSaveState(invalidState)

            expect(result.valid).toBe(false)
            expect(result.error).toContain('phase')
        })

        it('should reject state without gameConfig', () => {
            const invalidState = { ...mockGameState, gameConfig: null }
            const result = validateSaveState(invalidState)

            expect(result.valid).toBe(false)
            expect(result.error).toContain('gameConfig')
        })

        it('should reject state without players', () => {
            const invalidState = { ...mockGameState, players: null }
            const result = validateSaveState(invalidState)

            expect(result.valid).toBe(false)
            expect(result.error).toContain('players')
        })
    })

    describe('normalizeLoadedState', () => {
        it('should normalize complete state without changes', () => {
            const normalized = normalizeLoadedState(
                mockGameState as unknown as Parameters<typeof normalizeLoadedState>[0],
            )

            expect(normalized.phase).toBe(mockGameState.phase)
            expect(normalized.requisition).toBe(mockGameState.requisition)
        })

        it('should provide defaults for missing currentDiff', () => {
            const incomplete = { ...mockGameState, currentDiff: undefined }
            const normalized = normalizeLoadedState(
                incomplete as unknown as Parameters<typeof normalizeLoadedState>[0],
            )

            expect(normalized.currentDiff).toBe(1)
        })

        it('should provide defaults for missing requisition', () => {
            const incomplete = { ...mockGameState, requisition: undefined }
            const normalized = normalizeLoadedState(
                incomplete as unknown as Parameters<typeof normalizeLoadedState>[0],
            )

            expect(normalized.requisition).toBe(0)
        })

        it('should provide defaults for missing arrays', () => {
            const incomplete = {
                ...mockGameState,
                burnedCards: undefined,
                players: undefined,
            }
            const normalized = normalizeLoadedState(
                incomplete as unknown as Parameters<typeof normalizeLoadedState>[0],
            )

            expect(normalized.burnedCards).toEqual([])
            expect(normalized.players).toEqual([])
        })

        it('should provide default draftState', () => {
            const incomplete = { ...mockGameState, draftState: undefined }
            const normalized = normalizeLoadedState(
                incomplete as unknown as Parameters<typeof normalizeLoadedState>[0],
            )

            expect(normalized.draftState).toBeDefined()
            expect(normalized.draftState.activePlayerIndex).toBe(0)
            expect(normalized.draftState.roundCards).toEqual([])
        })

        it('should default eventsEnabled to true', () => {
            const incomplete = { ...mockGameState, eventsEnabled: undefined }
            const normalized = normalizeLoadedState(
                incomplete as unknown as Parameters<typeof normalizeLoadedState>[0],
            )

            expect(normalized.eventsEnabled).toBe(true)
        })

        it('should preserve false eventsEnabled', () => {
            const state = { ...mockGameState, eventsEnabled: false }
            const normalized = normalizeLoadedState(
                state as unknown as Parameters<typeof normalizeLoadedState>[0],
            )

            expect(normalized.eventsEnabled).toBe(false)
        })
    })

    describe('parseSaveFile', () => {
        it('should parse valid JSON file', async () => {
            const jsonData = JSON.stringify(mockGameState)
            const file = new File([jsonData], 'save.json', { type: 'application/json' })

            const result = await parseSaveFile(file)

            expect(result.phase).toBe('DASHBOARD')
            expect(result.gameConfig).toEqual(mockGameState.gameConfig)
        })

        it('should reject invalid JSON', async () => {
            const file = new File(['invalid json{{{'], 'save.json', { type: 'application/json' })

            await expect(parseSaveFile(file)).rejects.toThrow('corrupted')
        })

        it('should reject file with missing required fields', async () => {
            const invalidState = { phase: 'DASHBOARD' } // Missing gameConfig and players
            const jsonData = JSON.stringify(invalidState)
            const file = new File([jsonData], 'save.json', { type: 'application/json' })

            await expect(parseSaveFile(file)).rejects.toThrow()
        })
    })
})
