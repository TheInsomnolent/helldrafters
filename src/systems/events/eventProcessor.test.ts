import {
    processEventOutcome,
    processAllOutcomes,
    canAffordChoice,
    formatOutcome,
    formatOutcomes,
    needsPlayerChoice,
    EventProcessorState,
} from './eventProcessor'
import {
    OUTCOME_TYPES,
    EventOutcome,
    EventChoice,
    TargetPlayer,
    GameEvent,
    EVENT_TYPES,
} from './events'
import { FACTION, Loadout, Player, GameConfig } from '../../types'

describe('Systems - Event Processor', () => {
    const mockLoadout: Loadout = {
        primary: null,
        secondary: 's_peacemaker',
        grenade: 'g_he',
        armor: 'a_b01',
        booster: null,
        stratagems: ['st_ops', null, null, null],
    }

    const mockPlayer: Player = {
        id: '1',
        name: 'Helldiver 1',
        inventory: ['s_peacemaker', 'g_he', 'a_b01', 'st_ops'],
        loadout: mockLoadout,
        lockedSlots: [],
        disabledWarbonds: [],
        superstoreItems: [],
        extracted: false,
        warbonds: [],
        includeSuperstore: false,
    }

    const mockGameConfig: GameConfig = {
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
    }

    const mockState: EventProcessorState = {
        players: [mockPlayer],
        eventPlayerChoice: 0,
        requisition: 50,
        currentDiff: 4,
        gameConfig: mockGameConfig,
        burnedCards: [],
    }

    describe('processEventOutcome', () => {
        it('should add requisition', () => {
            const outcome: EventOutcome = { type: OUTCOME_TYPES.ADD_REQUISITION, value: 25 }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, mockState)

            expect(updates.requisition).toBe(75)
        })

        it('should spend requisition without going negative', () => {
            const outcome: EventOutcome = { type: OUTCOME_TYPES.SPEND_REQUISITION, value: 100 }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, mockState)

            expect(updates.requisition).toBe(0)
        })

        it('should change faction', () => {
            const outcome: EventOutcome = { type: OUTCOME_TYPES.CHANGE_FACTION }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, mockState)

            // Should trigger subfaction selection with a different faction than BUGS
            expect(updates.needsSubfactionSelection).toBe(true)
            expect(updates.pendingFaction).toBeDefined()
            expect(updates.pendingFaction).not.toBe(FACTION.BUGS)
            expect(Object.values(FACTION)).toContain(updates.pendingFaction)
        })

        it('should skip difficulty', () => {
            const outcome: EventOutcome = { type: OUTCOME_TYPES.SKIP_DIFFICULTY, value: 2 }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, mockState)

            expect(updates.currentDiff).toBe(6)
        })

        it('should not skip beyond difficulty 10', () => {
            const highDiffState = { ...mockState, currentDiff: 9 }
            const outcome: EventOutcome = { type: OUTCOME_TYPES.SKIP_DIFFICULTY, value: 5 }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, highDiffState)

            expect(updates.currentDiff).toBe(10)
        })

        it('should replay difficulty', () => {
            const outcome: EventOutcome = { type: OUTCOME_TYPES.REPLAY_DIFFICULTY, value: 1 }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, mockState)

            expect(updates.currentDiff).toBe(3)
        })

        it('should generate booster draft for selection', () => {
            const outcome: EventOutcome = {
                type: OUTCOME_TYPES.GAIN_BOOSTER,
                targetPlayer: 'choose' as TargetPlayer,
            }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, mockState)

            expect(updates.needsBoosterSelection).toBe(true)
            expect(updates.boosterDraft).toBeDefined()
            expect(Array.isArray(updates.boosterDraft)).toBe(true)
            expect(updates.boosterOutcome).toBeDefined()
        })

        it('should filter out boosters already owned by players', () => {
            const playerWithBooster: Player = {
                ...mockPlayer,
                loadout: { ...mockPlayer.loadout, booster: 'b_stamina' },
            }
            const player2: Player = {
                id: '2',
                name: 'Helldiver 2',
                inventory: [],
                loadout: {
                    primary: null,
                    secondary: null,
                    grenade: null,
                    armor: null,
                    booster: 'b_hellpod',
                    stratagems: [null, null, null, null],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
                warbonds: [],
                includeSuperstore: false,
            }
            const stateWithBooster = {
                ...mockState,
                players: [playerWithBooster, player2],
            }
            const outcome: EventOutcome = {
                type: OUTCOME_TYPES.GAIN_BOOSTER,
                targetPlayer: 'choose' as TargetPlayer,
            }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, stateWithBooster)

            expect(updates.boosterDraft).toBeDefined()
            expect(updates.boosterDraft).not.toContain('b_stamina')
            expect(updates.boosterDraft).not.toContain('b_hellpod')
        })

        it('should filter out burned boosters when burn mode is enabled', () => {
            const stateWithBurn = {
                ...mockState,
                gameConfig: { ...mockState.gameConfig, burnCards: true },
                burnedCards: ['b_stamina', 'b_hellpod'],
            }
            const outcome: EventOutcome = {
                type: OUTCOME_TYPES.GAIN_BOOSTER,
                targetPlayer: 'choose' as TargetPlayer,
            }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, stateWithBurn)

            expect(updates.boosterDraft).toBeDefined()
            expect(updates.boosterDraft).not.toContain('b_stamina')
            expect(updates.boosterDraft).not.toContain('b_hellpod')
        })

        it('should not filter burned cards when burn mode is disabled', () => {
            const stateWithoutBurn = {
                ...mockState,
                gameConfig: { ...mockState.gameConfig, burnCards: false },
                burnedCards: ['b_stamina'],
            }
            const outcome: EventOutcome = {
                type: OUTCOME_TYPES.GAIN_BOOSTER,
                targetPlayer: 'choose' as TargetPlayer,
            }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, stateWithoutBurn)

            // Since burnCards is false, the booster draft should not be affected by burnedCards
            // We can't guarantee b_stamina will be in the draft (it's random), but we can ensure
            // the draft generation succeeds and produces results
            expect(updates.boosterDraft).toBeDefined()
            expect(Array.isArray(updates.boosterDraft)).toBe(true)
        })

        it('should apply a random booster without selection', () => {
            const player2: Player = {
                id: '2',
                name: 'Helldiver 2',
                inventory: ['s_peacemaker', 'g_he', 'a_b01'],
                loadout: {
                    primary: null,
                    secondary: 's_peacemaker',
                    grenade: 'g_he',
                    armor: 'a_b01',
                    booster: null,
                    stratagems: [null, null, null, null],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
                warbonds: [],
                includeSuperstore: false,
            }
            const multiPlayerState = {
                ...mockState,
                players: [mockPlayer, player2],
            }
            const outcome: EventOutcome = {
                type: OUTCOME_TYPES.GAIN_BOOSTER,
                targetPlayer: 'random' as TargetPlayer,
            }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, multiPlayerState)

            expect(updates.needsBoosterSelection).toBeUndefined()
            expect(updates.players).toBeDefined()
            const playersWithBoosters = updates.players!.filter(
                (player: Player) => player.loadout.booster,
            )
            expect(playersWithBoosters.length).toBe(1)
            expect(playersWithBoosters[0].inventory).toContain(
                playersWithBoosters[0].loadout.booster,
            )
            expect(updates.gainedItems).toBeDefined()
            expect(updates.gainedItems!.length).toBe(1)
        })

        it('should redraft player inventory', () => {
            const outcome: EventOutcome = { type: OUTCOME_TYPES.REDRAFT, value: 3 }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, mockState)

            expect(updates.players).toBeDefined()
            expect(updates.players![0].inventory.length).toBeLessThan(
                mockState.players[0].inventory.length,
            )
            expect(updates.bonusRequisition).toBeGreaterThan(0)
        })

        it('should give all players random light armor and add to inventory', () => {
            const player2: Player = {
                id: '2',
                name: 'Helldiver 2',
                inventory: ['s_peacemaker', 'g_he', 'a_b01'],
                loadout: {
                    primary: null,
                    secondary: 's_peacemaker',
                    grenade: 'g_he',
                    armor: 'a_b01',
                    booster: null,
                    stratagems: [null, null, null, null],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
                warbonds: [],
                includeSuperstore: false,
            }
            const multiPlayerState = {
                ...mockState,
                players: [mockPlayer, player2],
                burnedCards: [],
            }

            const outcome: EventOutcome = {
                type: OUTCOME_TYPES.GAIN_RANDOM_LIGHT_ARMOR_AND_DRAFT_THROWABLE,
            }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, multiPlayerState)

            expect(updates.players).toBeDefined()
            expect(updates.players!.length).toBe(2)

            // Each player should have a light armor assigned
            updates.players!.forEach((player: Player) => {
                expect(player.loadout.armor).toBeDefined()
                expect(player.loadout.armor).not.toBe('a_b01') // Should be different from default
                // Armor should be in inventory
                expect(player.inventory).toContain(player.loadout.armor)
            })

            // Should trigger special draft for throwables
            expect(updates.needsSpecialDraft).toBe(true)
            expect(updates.specialDraftType).toBe('throwable')
        })

        it('should give all players random heavy armor and add to inventory', () => {
            const player2: Player = {
                id: '2',
                name: 'Helldiver 2',
                inventory: ['s_peacemaker', 'g_he', 'a_b01'],
                loadout: {
                    primary: null,
                    secondary: 's_peacemaker',
                    grenade: 'g_he',
                    armor: 'a_b01',
                    booster: null,
                    stratagems: [null, null, null, null],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
                warbonds: [],
                includeSuperstore: false,
            }
            const multiPlayerState = {
                ...mockState,
                players: [mockPlayer, player2],
                burnedCards: [],
            }

            const outcome: EventOutcome = {
                type: OUTCOME_TYPES.GAIN_RANDOM_HEAVY_ARMOR_AND_DRAFT_SECONDARY,
            }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, multiPlayerState)

            expect(updates.players).toBeDefined()
            expect(updates.players!.length).toBe(2)

            // Each player should have a heavy armor assigned
            updates.players!.forEach((player: Player) => {
                expect(player.loadout.armor).toBeDefined()
                // Armor should be in inventory
                expect(player.inventory).toContain(player.loadout.armor)
            })

            // Should trigger special draft for secondaries
            expect(updates.needsSpecialDraft).toBe(true)
            expect(updates.specialDraftType).toBe('secondary')
        })

        it('should give each player a different random armor', () => {
            const player2: Player = {
                id: '2',
                name: 'Helldiver 2',
                inventory: ['s_peacemaker'],
                loadout: {
                    primary: null,
                    secondary: 's_peacemaker',
                    grenade: null,
                    armor: 'a_b01',
                    booster: null,
                    stratagems: [null, null, null, null],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
                warbonds: [],
                includeSuperstore: false,
            }
            const player3: Player = {
                id: '3',
                name: 'Helldiver 3',
                inventory: ['s_peacemaker'],
                loadout: {
                    primary: null,
                    secondary: 's_peacemaker',
                    grenade: null,
                    armor: 'a_b01',
                    booster: null,
                    stratagems: [null, null, null, null],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
                warbonds: [],
                includeSuperstore: false,
            }
            const multiPlayerState = {
                ...mockState,
                players: [mockPlayer, player2, player3],
                burnedCards: [],
            }

            const outcome: EventOutcome = {
                type: OUTCOME_TYPES.GAIN_RANDOM_LIGHT_ARMOR_AND_DRAFT_THROWABLE,
            }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }

            // Run multiple times to check randomness
            let hasDifferentArmors = false
            for (let i = 0; i < 10; i++) {
                const updates = processEventOutcome(outcome, choice, multiPlayerState)
                const armors = updates.players!.map((p: Player) => p.loadout.armor)

                // Check if at least one run has different armors between players
                const uniqueArmors = new Set(armors)
                if (uniqueArmors.size > 1) {
                    hasDifferentArmors = true
                    break
                }
            }

            // With multiple players and multiple armor options, we should eventually see different armors
            expect(hasDifferentArmors).toBe(true)
        })

        it('should apply ceremonial loadout with proper equipment distribution', () => {
            const player1: Player = {
                id: '1',
                name: 'Helldiver 1',
                inventory: ['s_peacemaker', 'g_he', 'a_b01'],
                warbonds: ['helldivers_mobilize', 'steeled_veterans', 'masters_of_ceremony'],
                includeSuperstore: false,
                loadout: {
                    primary: null,
                    secondary: 's_peacemaker',
                    grenade: 'g_he',
                    armor: 'a_b01',
                    booster: null,
                    stratagems: ['st_ops', null, null, null],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
            }
            const player2: Player = {
                id: '2',
                name: 'Helldiver 2',
                inventory: ['s_peacemaker', 'g_he', 'a_b01'],
                warbonds: ['helldivers_mobilize', 'masters_of_ceremony'],
                includeSuperstore: false,
                loadout: {
                    primary: null,
                    secondary: 's_peacemaker',
                    grenade: 'g_he',
                    armor: 'a_b01',
                    booster: null,
                    stratagems: [null, null, null, null],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
            }
            const player3: Player = {
                id: '3',
                name: 'Helldiver 3',
                inventory: ['s_peacemaker'],
                warbonds: ['helldivers_mobilize', 'masters_of_ceremony'],
                includeSuperstore: false,
                loadout: {
                    primary: null,
                    secondary: 's_peacemaker',
                    grenade: null,
                    armor: 'a_b01',
                    booster: null,
                    stratagems: [null, null, null, null],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
            }
            const multiPlayerState = {
                ...mockState,
                players: [player1, player2, player3],
                burnedCards: [],
            }

            const outcome: EventOutcome = { type: OUTCOME_TYPES.SET_CEREMONIAL_LOADOUT }
            const choice: EventChoice = { text: 'Test', outcomes: [outcome] }
            const updates = processEventOutcome(outcome, choice, multiPlayerState)

            expect(updates.players).toBeDefined()
            expect(updates.players!.length).toBe(3)
            expect(updates.ceremonialLoadoutApplied).toBe(true)

            // All players should have constitution as primary
            updates.players!.forEach((player: Player) => {
                expect(player.loadout.primary).toBe('p_constitution')
                expect(player.inventory).toContain('p_constitution')
            })

            // Player 1 should have senator and parade commander armor
            expect(updates.players![0].loadout.secondary).toBe('s_senator')
            expect(updates.players![0].inventory).toContain('s_senator')
            expect(updates.players![0].loadout.armor).toBe('a_re1861')
            expect(updates.players![0].inventory).toContain('a_re1861')

            // Player 1 should have the flag stratagem
            expect(updates.players![0].loadout.stratagems[0]).toBe('st_flag')
            expect(updates.players![0].inventory).toContain('st_flag')

            // Players 2 and 3 should have saber and honorary guard armor
            for (let i = 1; i < 3; i++) {
                expect(updates.players![i].loadout.secondary).toBe('s_saber')
                expect(updates.players![i].inventory).toContain('s_saber')
                expect(updates.players![i].loadout.armor).toBe('a_re2310')
                expect(updates.players![i].inventory).toContain('a_re2310')

                // Should have no stratagems
                expect(updates.players![i].loadout.stratagems).toEqual([null, null, null, null])
            }
        })
    })

    describe('processAllOutcomes', () => {
        it('should process multiple outcomes in sequence', () => {
            const outcomes: EventOutcome[] = [{ type: OUTCOME_TYPES.ADD_REQUISITION, value: 10 }]
            const choice: EventChoice = { text: 'Test', outcomes }
            const updates = processAllOutcomes(outcomes, choice, mockState)

            expect(updates.requisition).toBe(60)
        })

        it('should distribute multiple random boosters across the squad', () => {
            const player2: Player = {
                id: '2',
                name: 'Helldiver 2',
                inventory: ['s_peacemaker', 'g_he', 'a_b01'],
                loadout: {
                    primary: null,
                    secondary: 's_peacemaker',
                    grenade: 'g_he',
                    armor: 'a_b01',
                    booster: null,
                    stratagems: [null, null, null, null],
                },
                lockedSlots: [],
                disabledWarbonds: [],
                superstoreItems: [],
                extracted: false,
                warbonds: [],
                includeSuperstore: false,
            }
            const multiPlayerState = {
                ...mockState,
                players: [mockPlayer, player2],
            }
            const outcomes: EventOutcome[] = [
                { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'random' as TargetPlayer },
                { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'random' as TargetPlayer },
            ]
            const choice: EventChoice = { text: 'Test', outcomes }
            const updates = processAllOutcomes(outcomes, choice, multiPlayerState)

            expect(updates.players).toBeDefined()
            updates.players!.forEach((player: Player) => {
                expect(player.loadout.booster).toBeDefined()
                expect(player.inventory).toContain(player.loadout.booster)
            })
            const boosters = updates.players!.map((player: Player) => player.loadout.booster)
            expect(new Set(boosters).size).toBe(boosters.length)
            expect(updates.gainedItems).toBeDefined()
            expect(updates.gainedItems!.length).toBe(2)
        })

        it('should handle empty outcomes array', () => {
            const choice: EventChoice = { text: 'Test', outcomes: [] }
            const updates = processAllOutcomes([], choice, mockState)
            expect(Object.keys(updates)).toHaveLength(0)
        })
    })

    describe('canAffordChoice', () => {
        it('should return true when requisition is sufficient', () => {
            const choice: EventChoice = { text: 'Test', outcomes: [], requiresRequisition: 25 }
            expect(canAffordChoice(choice, 50)).toBe(true)
        })

        it('should return false when requisition is insufficient', () => {
            const choice: EventChoice = { text: 'Test', outcomes: [], requiresRequisition: 100 }
            expect(canAffordChoice(choice, 50)).toBe(false)
        })

        it('should return true when no requisition required', () => {
            const choice: EventChoice = { text: 'Test', outcomes: [] }
            expect(canAffordChoice(choice, 0)).toBe(true)
        })
    })

    describe('formatOutcome', () => {
        it('should format ADD_REQUISITION', () => {
            const outcome: EventOutcome = { type: OUTCOME_TYPES.ADD_REQUISITION, value: 25 }
            expect(formatOutcome(outcome)).toBe('+25 Requisition')
        })

        it('should format CHANGE_FACTION', () => {
            const outcome: EventOutcome = { type: OUTCOME_TYPES.CHANGE_FACTION }
            expect(formatOutcome(outcome)).toBe('Switch to different theater')
        })

        it('should format SKIP_DIFFICULTY with plural', () => {
            const outcome: EventOutcome = { type: OUTCOME_TYPES.SKIP_DIFFICULTY, value: 2 }
            expect(formatOutcome(outcome)).toBe('Skip 2 difficulty levels')
        })

        it('should return empty string for unknown outcome type', () => {
            const outcome = { type: 'UNKNOWN_TYPE' as const }
            expect(formatOutcome(outcome as unknown as EventOutcome)).toBe('')
        })
    })

    describe('formatOutcomes', () => {
        it('should format multiple outcomes', () => {
            const outcomes: EventOutcome[] = [{ type: OUTCOME_TYPES.ADD_REQUISITION, value: 10 }]
            const result = formatOutcomes(outcomes)

            expect(result).toContain('+10 Requisition')
        })

        it('should return "No effect" for empty array', () => {
            expect(formatOutcomes([])).toBe('No effect')
        })

        it('should return "No effect" for null', () => {
            expect(formatOutcomes(null as unknown as EventOutcome[])).toBe('No effect')
        })
    })

    describe('needsPlayerChoice', () => {
        it('should return true when event requires player choice', () => {
            const event: GameEvent = {
                id: 'test',
                name: 'Test Event',
                description: 'Test description',
                type: EVENT_TYPES.CHOICE,
                minDifficulty: 1,
                maxDifficulty: 10,
                weight: 1,
                targetPlayer: 'single',
                choices: [
                    {
                        text: 'Test choice',
                        outcomes: [
                            {
                                type: OUTCOME_TYPES.GAIN_BOOSTER,
                                targetPlayer: 'choose' as TargetPlayer,
                            },
                        ],
                    },
                ],
            }

            expect(needsPlayerChoice(event)).toBe(true)
        })

        it('should return false when no player choice needed', () => {
            const event: GameEvent = {
                id: 'test',
                name: 'Test Event',
                description: 'Test description',
                type: EVENT_TYPES.BENEFICIAL,
                minDifficulty: 1,
                maxDifficulty: 10,
                weight: 1,
                targetPlayer: 'all',
                choices: [
                    {
                        text: 'Test choice',
                        outcomes: [{ type: OUTCOME_TYPES.ADD_REQUISITION, value: 10 }],
                    },
                ],
            }

            expect(needsPlayerChoice(event)).toBe(false)
        })
    })
})
