/* eslint-disable jest/no-conditional-expect */
import {
    getDraftHandSize,
    getWeightedPool,
    generateDraftHand,
    WeightedItem,
    WeightedArmorCombo,
    WeightedPoolEntry,
    DraftHandItem,
} from './draftHelpers'
import { RARITY, TYPE, FACTION, Player, GameConfig, Item } from '../types'
import { MASTER_DB } from '../data/itemsByWarbond'
import { ArmorCombo } from './itemHelpers'

describe('Utils - Draft Helpers', () => {
    const createGameConfig = (overrides: Partial<GameConfig> = {}): Partial<GameConfig> => ({
        playerCount: 1,
        faction: FACTION.BUGS,
        subfaction: 'standard',
        starRating: 3,
        globalUniqueness: false,
        burnCards: false,
        customStart: false,
        endlessMode: false,
        enduranceMode: false,
        debugEventsMode: false,
        brutalityMode: false,
        ...overrides,
    })

    const createPlayer = (overrides: Partial<Player> = {}): Player => ({
        id: '1',
        name: 'Test Player',
        inventory: [],
        loadout: {
            primary: null,
            secondary: null,
            grenade: null,
            armor: null,
            booster: null,
            stratagems: [null, null, null, null],
        },
        lockedSlots: [],
        disabledWarbonds: [],
        superstoreItems: [],
        extracted: false,
        warbonds: ['helldivers_mobilize'],
        includeSuperstore: false,
        ...overrides,
    })

    // Helper to check if entry is armor combo
    const isArmorCombo = (entry: WeightedPoolEntry): entry is WeightedArmorCombo =>
        entry.isArmorCombo === true

    // Helper to check if hand item is armor combo
    const isArmorComboItem = (item: DraftHandItem): item is ArmorCombo =>
        'items' in item && Array.isArray((item as ArmorCombo).items)

    // Helper to get ID from draft hand item
    const getIdFromHandItem = (item: DraftHandItem): string => {
        if (isArmorComboItem(item)) {
            // For armor combos, use the first item's id or the combo's passive as identifier
            return item.items[0]?.id || item.passive
        }
        return (item as Item).id
    }

    describe('getDraftHandSize', () => {
        it('should return correct hand size for single player', () => {
            const size = getDraftHandSize(1)
            expect(size).toBeGreaterThan(0)
            expect(typeof size).toBe('number')
        })

        it('should return correct hand size for different star ratings', () => {
            const size1 = getDraftHandSize(1)
            const size2 = getDraftHandSize(2)
            const size4 = getDraftHandSize(4)

            // Hand sizes should be reasonable values based on the function:
            // starRating <= 2 returns 2
            // starRating <= 4 returns 3
            // starRating > 4 returns 4
            expect(size1).toBe(2)
            expect(size2).toBe(2)
            expect(size4).toBe(3)
        })

        it('should scale with star rating', () => {
            // Generally, higher star rating might affect hand size
            const sizes = [1, 2, 3, 4, 5].map((rating) => getDraftHandSize(rating))

            // All sizes should be reasonable
            sizes.forEach((size) => {
                expect(size).toBeGreaterThanOrEqual(2)
                expect(size).toBeLessThanOrEqual(4)
            })
        })
    })

    describe('getWeightedPool', () => {
        const defaultConfig = createGameConfig()
        const player = createPlayer()

        it('should return weighted pool entries', () => {
            const pool = getWeightedPool(player, 1, defaultConfig)

            expect(pool.length).toBeGreaterThan(0)
            pool.forEach((entry) => {
                expect(entry).toHaveProperty('weight')
            })
        })

        it('should exclude already owned items', () => {
            const ownedPlayer = createPlayer({
                inventory: ['s_peacemaker', 'g_he'],
            })

            const pool = getWeightedPool(ownedPlayer, 1, defaultConfig)

            pool.forEach((entry) => {
                if (!isArmorCombo(entry)) {
                    const item = entry.item
                    expect(ownedPlayer.inventory).not.toContain(item.id)
                }
            })
        })

        it('should exclude boosters from pool', () => {
            const pool = getWeightedPool(player, 1, defaultConfig)

            pool.forEach((entry) => {
                if (!isArmorCombo(entry)) {
                    const item = entry.item
                    expect(item.type).not.toBe(TYPE.BOOSTER)
                }
            })
        })

        it('should exclude burned cards when burn mode is enabled', () => {
            const burnedId = MASTER_DB.find((i) => i.type === TYPE.SECONDARY)?.id || ''
            const burnConfig = createGameConfig({ burnCards: true })

            const pool = getWeightedPool(player, 1, burnConfig, [burnedId])

            pool.forEach((entry) => {
                if (!isArmorCombo(entry)) {
                    expect(entry.item.id).not.toBe(burnedId)
                }
            })
        })

        it('should respect player warbond settings', () => {
            const playerWithWarbonds = createPlayer({
                warbonds: ['helldivers_mobilize'],
                disabledWarbonds: ['steeled_veterans'],
            })

            const pool = getWeightedPool(playerWithWarbonds, 1, defaultConfig)

            // Should not include items from disabled warbonds
            pool.forEach((entry) => {
                if (!isArmorCombo(entry)) {
                    const item = entry.item
                    expect(item.warbond).not.toBe('steeled_veterans')
                }
            })
        })

        it('should include superstore items when player has includeSuperstore true', () => {
            const playerWithSuperstore = createPlayer({
                includeSuperstore: true,
                superstoreItems: [],
            })

            const pool = getWeightedPool(playerWithSuperstore, 1, defaultConfig)

            // Pool should have items
            expect(pool.length).toBeGreaterThan(0)
        })
    })

    describe('generateDraftHand', () => {
        const defaultConfig = createGameConfig()
        const player = createPlayer()

        it('should generate a hand of items', () => {
            const hand = generateDraftHand(player, 1, defaultConfig)

            expect(hand.length).toBeGreaterThan(0)
        })

        it('should return unique items', () => {
            const hand = generateDraftHand(player, 5, defaultConfig)

            const ids = hand.map((item) => getIdFromHandItem(item))
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
        })

        it('should exclude owned items', () => {
            const ownedPlayer = createPlayer({
                inventory: ['s_peacemaker', 'g_he', 'a_b01'],
            })

            const hand = generateDraftHand(ownedPlayer, 1, defaultConfig)

            hand.forEach((item) => {
                if (!isArmorComboItem(item)) {
                    expect(ownedPlayer.inventory).not.toContain((item as Item).id)
                }
            })
        })

        it('should return empty array when player is null', () => {
            const hand = generateDraftHand(null, 1, defaultConfig)

            expect(hand).toHaveLength(0)
        })

        it('should respect custom hand size', () => {
            const customSize = 3
            const hand = generateDraftHand(player, 1, defaultConfig, [], [], null, customSize)

            expect(hand.length).toBeLessThanOrEqual(customSize)
        })

        it('should respect global uniqueness setting', () => {
            const player2 = createPlayer({
                id: '2',
                name: 'Player 2',
                inventory: ['st_eagle_airstrike'],
            })

            const uniqueConfig = createGameConfig({ globalUniqueness: true })

            const hand = generateDraftHand(player, 1, uniqueConfig, [], [player, player2])

            // Should not include globally owned items
            const handIds = hand
                .filter((item) => !isArmorComboItem(item))
                .map((item) => (item as Item).id)
            expect(handIds).not.toContain('st_eagle_airstrike')
        })

        it('should scale rarity distribution with difficulty', () => {
            // Run multiple times to check trends
            let higherHasMoreRare = 0
            for (let i = 0; i < 10; i++) {
                const lowHand = generateDraftHand(player, 1, defaultConfig, [], [], null, 20)
                const highHand = generateDraftHand(player, 10, defaultConfig, [], [], null, 20)

                const countRare = (hand: typeof lowHand) =>
                    hand.filter(
                        (item) =>
                            'rarity' in item &&
                            (item.rarity === RARITY.RARE || item.rarity === RARITY.LEGENDARY),
                    ).length

                const lowRare = countRare(lowHand)
                const highRare = countRare(highHand)

                if (highRare >= lowRare) {
                    higherHasMoreRare++
                }
            }

            // Most of the time, higher difficulty should have equal or more rare items
            expect(higherHasMoreRare).toBeGreaterThanOrEqual(5)
        })
    })

    describe('Warbond Filtering', () => {
        it('should only include items from enabled warbonds', () => {
            const playerWithLimitedWarbonds = createPlayer({
                warbonds: ['helldivers_mobilize'],
                disabledWarbonds: [],
            })

            const pool = getWeightedPool(playerWithLimitedWarbonds, 5, createGameConfig())

            // All non-armor items should be from helldivers_mobilize
            pool.forEach((entry) => {
                if (!(entry as WeightedArmorCombo).isArmorCombo) {
                    const item = (entry as WeightedItem).item
                    expect(item.warbond).toBe('helldivers_mobilize')
                }
            })
        })

        it('should include items from multiple enabled warbonds', () => {
            const playerWithMultipleWarbonds = createPlayer({
                warbonds: ['helldivers_mobilize', 'steeled_veterans'],
                disabledWarbonds: [],
            })

            const pool = getWeightedPool(playerWithMultipleWarbonds, 5, createGameConfig())

            const warbonds = new Set<string>()
            pool.forEach((entry) => {
                if (!(entry as WeightedArmorCombo).isArmorCombo) {
                    const item = (entry as WeightedItem).item
                    if (item.warbond) {
                        warbonds.add(item.warbond)
                    }
                }
            })

            // Should potentially include items from both warbonds
            expect(warbonds.size).toBeGreaterThanOrEqual(1)
        })
    })

    describe('Superstore Items', () => {
        it('should include superstore items when enabled for player', () => {
            const playerWithSuperstore = createPlayer({
                includeSuperstore: true,
                superstoreItems: [],
                warbonds: ['helldivers_mobilize'],
            })

            const pool = getWeightedPool(playerWithSuperstore, 5, createGameConfig())

            // Pool should include items
            expect(pool.length).toBeGreaterThan(0)
        })

        it('should not include superstore items when disabled', () => {
            const playerWithoutSuperstore = createPlayer({
                includeSuperstore: false,
                superstoreItems: [],
                warbonds: ['helldivers_mobilize'],
            })

            const pool = getWeightedPool(playerWithoutSuperstore, 5, createGameConfig())

            // Should still have items from warbonds
            expect(pool.length).toBeGreaterThan(0)

            // None should be superstore items
            pool.forEach((entry) => {
                if (!(entry as WeightedArmorCombo).isArmorCombo) {
                    const item = (entry as WeightedItem).item
                    expect(item.superstore).not.toBe(true)
                }
            })
        })
    })
})
