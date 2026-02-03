/**
 * Tests for Event UI State (Events V2)
 */

import {
    createInitialEventUIState,
    choiceRequiresPlayerDecision,
    choiceRequiresDetailedSelection,
    choiceRequiresBoosterSelection,
    getNextStep,
    canNavigateBack,
    getPreviousStep,
    generateOutcomePreview,
} from './eventUIState'
import type { GameEvent, EventChoice } from '../../types'

describe('Systems - Event UI State (V2)', () => {
    const mockChoiceEvent: GameEvent = {
        id: 'test_event',
        name: 'Test Event',
        description: 'A test event for unit testing',
        type: 'choice',
        minDifficulty: 1,
        maxDifficulty: 10,
        weight: 10,
        targetPlayer: 'single',
        choices: [
            {
                text: 'Choice A',
                outcomes: [{ type: 'add_requisition', value: 10 }],
            },
            {
                text: 'Choice B',
                requiresRequisition: 5,
                outcomes: [{ type: 'gain_booster', targetPlayer: 'choose' }],
            },
        ],
    }

    const mockBeneficialEvent: GameEvent = {
        id: 'beneficial_event',
        name: 'Beneficial Event',
        description: 'A beneficial event',
        type: 'beneficial',
        minDifficulty: 1,
        maxDifficulty: 10,
        weight: 10,
        targetPlayer: 'all',
        outcomes: [{ type: 'add_requisition', value: 5 }],
    }

    const mockSwapChoice: EventChoice = {
        text: 'Swap Stratagems',
        outcomes: [{ type: 'swap_stratagem_with_player', targetPlayer: 'choose' }],
    }

    const mockRemoveItemChoice: EventChoice = {
        text: 'Remove Item',
        outcomes: [{ type: 'remove_item', targetPlayer: 'choose' }],
    }

    const mockBoosterChoice: EventChoice = {
        text: 'Gain Booster',
        outcomes: [{ type: 'gain_booster', targetPlayer: 'choose' }],
    }

    describe('createInitialEventUIState', () => {
        it('should create initial state for single-target event', () => {
            const state = createInitialEventUIState('test_event', mockChoiceEvent, 'host123')

            expect(state.eventId).toBe('test_event')
            expect(state.event).toEqual(mockChoiceEvent)
            expect(state.currentStep).toBe('PLAYER_SELECTION')
            expect(state.selectedPlayerIndex).toBeNull()
            expect(state.selectedChoice).toBeNull()
            expect(state.votes).toEqual([])
            expect(state.votingEnabled).toBe(true)
            expect(state.isComplete).toBe(false)
            expect(state.lastUpdatedBy).toBe('host123')
        })

        it('should create initial state for all-target event', () => {
            const state = createInitialEventUIState(
                'beneficial_event',
                mockBeneficialEvent,
                'host123',
            )

            expect(state.currentStep).toBe('OVERVIEW')
            expect(state.selectedPlayerIndex).toBeNull()
        })

        it('should initialize with empty step history', () => {
            const state = createInitialEventUIState('test_event', mockChoiceEvent, 'host123')

            expect(state.stepHistory).toEqual([])
            expect(state.canGoBack).toBe(false)
        })
    })

    describe('choiceRequiresPlayerDecision', () => {
        it('should return true for remove_item with choose target', () => {
            expect(choiceRequiresPlayerDecision(mockRemoveItemChoice)).toBe(true)
        })

        it('should return false for add_requisition', () => {
            const choice: EventChoice = {
                text: 'Add Requisition',
                outcomes: [{ type: 'add_requisition', value: 10 }],
            }
            expect(choiceRequiresPlayerDecision(choice)).toBe(false)
        })

        it('should return false for null choice', () => {
            expect(choiceRequiresPlayerDecision(null)).toBe(false)
        })

        it('should return true for transform_loadout with choose target', () => {
            const choice: EventChoice = {
                text: 'Transform',
                outcomes: [{ type: 'transform_loadout', value: 1, targetPlayer: 'choose' }],
            }
            expect(choiceRequiresPlayerDecision(choice)).toBe(true)
        })
    })

    describe('choiceRequiresDetailedSelection', () => {
        it('should return true for swap_stratagem_with_player', () => {
            expect(choiceRequiresDetailedSelection(mockSwapChoice)).toBe(true)
        })

        it('should return true for duplicate_stratagem_to_another_helldiver', () => {
            const choice: EventChoice = {
                text: 'Duplicate',
                outcomes: [
                    { type: 'duplicate_stratagem_to_another_helldiver', targetPlayer: 'choose' },
                ],
            }
            expect(choiceRequiresDetailedSelection(choice)).toBe(true)
        })

        it('should return false for add_requisition', () => {
            const choice: EventChoice = {
                text: 'Add Requisition',
                outcomes: [{ type: 'add_requisition', value: 10 }],
            }
            expect(choiceRequiresDetailedSelection(choice)).toBe(false)
        })

        it('should return false for null choice', () => {
            expect(choiceRequiresDetailedSelection(null)).toBe(false)
        })
    })

    describe('choiceRequiresBoosterSelection', () => {
        it('should return true for gain_booster with choose target', () => {
            expect(choiceRequiresBoosterSelection(mockBoosterChoice)).toBe(true)
        })

        it('should return false for gain_booster with random target', () => {
            const choice: EventChoice = {
                text: 'Random Booster',
                outcomes: [{ type: 'gain_booster', targetPlayer: 'random' }],
            }
            expect(choiceRequiresBoosterSelection(choice)).toBe(false)
        })

        it('should return false for null choice', () => {
            expect(choiceRequiresBoosterSelection(null)).toBe(false)
        })
    })

    describe('getNextStep', () => {
        it('should go from OVERVIEW to CHOICE_SELECTION for choice events', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.currentStep = 'OVERVIEW'

            expect(getNextStep(state)).toBe('CHOICE_SELECTION')
        })

        it('should go from OVERVIEW to CONFIRMATION for beneficial events', () => {
            const state = createInitialEventUIState('test', mockBeneficialEvent, 'host')
            state.currentStep = 'OVERVIEW'

            expect(getNextStep(state)).toBe('CONFIRMATION')
        })

        it('should go from PLAYER_SELECTION to OVERVIEW', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.currentStep = 'PLAYER_SELECTION'

            expect(getNextStep(state)).toBe('OVERVIEW')
        })

        it('should go from CHOICE_SELECTION to SELECTION_DETAILS for complex choices', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.currentStep = 'CHOICE_SELECTION'
            state.selectedChoice = mockSwapChoice

            expect(getNextStep(state)).toBe('SELECTION_DETAILS')
        })

        it('should go from CHOICE_SELECTION to CONFIRMATION for simple choices', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.currentStep = 'CHOICE_SELECTION'
            state.selectedChoice = {
                text: 'Simple',
                outcomes: [{ type: 'add_requisition', value: 5 }],
            }

            expect(getNextStep(state)).toBe('CONFIRMATION')
        })

        it('should go from CONFIRMATION to APPLYING', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.currentStep = 'CONFIRMATION'

            expect(getNextStep(state)).toBe('APPLYING')
        })

        it('should go from APPLYING to COMPLETE', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.currentStep = 'APPLYING'

            expect(getNextStep(state)).toBe('COMPLETE')
        })
    })

    describe('canNavigateBack', () => {
        it('should return false when at APPLYING step', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.currentStep = 'APPLYING'
            state.stepHistory = ['CONFIRMATION']

            expect(canNavigateBack(state)).toBe(false)
        })

        it('should return false when at COMPLETE step', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.currentStep = 'COMPLETE'
            state.stepHistory = ['APPLYING']

            expect(canNavigateBack(state)).toBe(false)
        })

        it('should return false when no history', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.currentStep = 'CHOICE_SELECTION'
            state.stepHistory = []

            expect(canNavigateBack(state)).toBe(false)
        })

        it('should return true when there is history and not at final steps', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.currentStep = 'CHOICE_SELECTION'
            state.stepHistory = ['OVERVIEW']

            expect(canNavigateBack(state)).toBe(true)
        })
    })

    describe('getPreviousStep', () => {
        it('should return null when no history', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.stepHistory = []

            expect(getPreviousStep(state)).toBeNull()
        })

        it('should return last step in history', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.stepHistory = ['OVERVIEW', 'CHOICE_SELECTION']

            expect(getPreviousStep(state)).toBe('CHOICE_SELECTION')
        })
    })

    describe('generateOutcomePreview', () => {
        it('should show prompt when no choice selected', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')

            expect(generateOutcomePreview(state)).toBe('Select a choice to see the outcome')
        })

        it('should format requisition outcomes', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.selectedChoice = {
                text: 'Test',
                outcomes: [{ type: 'add_requisition', value: 10 }],
            }

            expect(generateOutcomePreview(state)).toContain('+10 Requisition')
        })

        it('should include player info for single-target events', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.selectedPlayerIndex = 0
            state.selectedChoice = {
                text: 'Test',
                outcomes: [{ type: 'add_requisition', value: 10 }],
            }

            expect(generateOutcomePreview(state)).toContain('HELLDIVER 1')
        })

        it('should format multiple outcomes', () => {
            const state = createInitialEventUIState('test', mockChoiceEvent, 'host')
            state.selectedChoice = {
                text: 'Test',
                outcomes: [
                    { type: 'add_requisition', value: 5 },
                    { type: 'gain_booster', targetPlayer: 'choose' },
                ],
            }

            const preview = generateOutcomePreview(state)
            expect(preview).toContain('+5 Requisition')
            expect(preview).toContain('Gain a tactical booster')
        })

        it('should show beneficial event outcomes', () => {
            const state = createInitialEventUIState('test', mockBeneficialEvent, 'host')

            expect(generateOutcomePreview(state)).toContain('+5 Requisition')
        })
    })
})
