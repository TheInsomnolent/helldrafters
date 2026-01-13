import {
  processEventOutcome,
  processAllOutcomes,
  canAffordChoice,
  formatOutcome,
  formatOutcomes,
  needsPlayerChoice
} from './eventProcessor';
import { OUTCOME_TYPES } from './events';
import { FACTION } from '../../constants/types';

describe('Systems - Event Processor', () => {
  const mockState = {
    players: [
      {
        id: 1,
        name: 'Helldiver 1',
        inventory: ['s_peacemaker', 'g_he', 'a_b01', 'st_ops'],
        loadout: {
          primary: null,
          secondary: 's_peacemaker',
          grenade: 'g_he',
          armor: 'a_b01',
          booster: null,
          stratagems: ['st_ops', null, null, null]
        }
      }
    ],
    eventPlayerChoice: 0,
    requisition: 50,
    lives: 3,
    currentDiff: 4,
    gameConfig: { faction: FACTION.BUGS }
  };

  describe('processEventOutcome', () => {
    it('should add requisition', () => {
      const outcome = { type: OUTCOME_TYPES.ADD_REQUISITION, value: 25 };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.requisition).toBe(75);
    });

    it('should spend requisition without going negative', () => {
      const outcome = { type: OUTCOME_TYPES.SPEND_REQUISITION, value: 100 };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.requisition).toBe(0);
    });

    it('should gain life', () => {
      const outcome = { type: OUTCOME_TYPES.GAIN_LIFE, value: 2 };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.lives).toBe(5);
    });

    it('should lose life', () => {
      const outcome = { type: OUTCOME_TYPES.LOSE_LIFE, value: 1 };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.lives).toBe(2);
    });

    it('should trigger game over when lives reach 0', () => {
      const outcome = { type: OUTCOME_TYPES.LOSE_LIFE, value: 3 };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.lives).toBe(0);
      expect(updates.triggerGameOver).toBe(true);
    });

    it('should set lives to 1 for LOSE_ALL_BUT_ONE_LIFE', () => {
      const outcome = { type: OUTCOME_TYPES.LOSE_ALL_BUT_ONE_LIFE };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.lives).toBe(1);
    });

    it('should change faction', () => {
      const outcome = { type: OUTCOME_TYPES.CHANGE_FACTION, value: FACTION.BOTS };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.faction).toBe(FACTION.BOTS);
    });

    it('should skip difficulty', () => {
      const outcome = { type: OUTCOME_TYPES.SKIP_DIFFICULTY, value: 2 };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.currentDiff).toBe(6);
    });

    it('should not skip beyond difficulty 10', () => {
      const highDiffState = { ...mockState, currentDiff: 9 };
      const outcome = { type: OUTCOME_TYPES.SKIP_DIFFICULTY, value: 5 };
      const updates = processEventOutcome(outcome, {}, highDiffState);
      
      expect(updates.currentDiff).toBe(10);
    });

    it('should replay difficulty', () => {
      const outcome = { type: OUTCOME_TYPES.REPLAY_DIFFICULTY, value: 1 };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.currentDiff).toBe(3);
    });

    it('should grant booster to chosen player', () => {
      const outcome = { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.players).toBeDefined();
      expect(updates.players[0].loadout.booster).toBeTruthy();
    });

    it('should redraft player inventory', () => {
      const outcome = { type: OUTCOME_TYPES.REDRAFT, value: 3 };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.players).toBeDefined();
      expect(updates.players[0].inventory.length).toBeLessThan(mockState.players[0].inventory.length);
      expect(updates.bonusRequisition).toBeGreaterThan(0);
    });
  });

  describe('processAllOutcomes', () => {
    it('should process multiple outcomes in sequence', () => {
      const outcomes = [
        { type: OUTCOME_TYPES.ADD_REQUISITION, value: 10 },
        { type: OUTCOME_TYPES.GAIN_LIFE, value: 1 }
      ];
      const updates = processAllOutcomes(outcomes, {}, mockState);
      
      expect(updates.requisition).toBe(60);
      expect(updates.lives).toBe(4);
    });

    it('should handle empty outcomes array', () => {
      const updates = processAllOutcomes([], {}, mockState);
      expect(Object.keys(updates)).toHaveLength(0);
    });
  });

  describe('canAffordChoice', () => {
    it('should return true when requisition is sufficient', () => {
      const choice = { requiresRequisition: 25 };
      expect(canAffordChoice(choice, 50)).toBe(true);
    });

    it('should return false when requisition is insufficient', () => {
      const choice = { requiresRequisition: 100 };
      expect(canAffordChoice(choice, 50)).toBe(false);
    });

    it('should return true when no requisition required', () => {
      const choice = {};
      expect(canAffordChoice(choice, 0)).toBe(true);
    });
  });

  describe('formatOutcome', () => {
    it('should format ADD_REQUISITION', () => {
      const outcome = { type: OUTCOME_TYPES.ADD_REQUISITION, value: 25 };
      expect(formatOutcome(outcome)).toBe('+25 Requisition');
    });

    it('should format LOSE_LIFE', () => {
      const outcome = { type: OUTCOME_TYPES.LOSE_LIFE, value: 2 };
      expect(formatOutcome(outcome)).toBe('-2 Life');
    });

    it('should format CHANGE_FACTION', () => {
      const outcome = { type: OUTCOME_TYPES.CHANGE_FACTION, value: FACTION.SQUIDS };
      expect(formatOutcome(outcome)).toBe(`Switch to ${FACTION.SQUIDS}`);
    });

    it('should format SKIP_DIFFICULTY with plural', () => {
      const outcome = { type: OUTCOME_TYPES.SKIP_DIFFICULTY, value: 2 };
      expect(formatOutcome(outcome)).toBe('Skip 2 difficulty levels');
    });

    it('should return empty string for unknown outcome type', () => {
      const outcome = { type: 'UNKNOWN_TYPE' };
      expect(formatOutcome(outcome)).toBe('');
    });
  });

  describe('formatOutcomes', () => {
    it('should format multiple outcomes', () => {
      const outcomes = [
        { type: OUTCOME_TYPES.ADD_REQUISITION, value: 10 },
        { type: OUTCOME_TYPES.GAIN_LIFE, value: 1 }
      ];
      const result = formatOutcomes(outcomes);
      
      expect(result).toContain('+10 Requisition');
      expect(result).toContain('+1 Life');
    });

    it('should return "No effect" for empty array', () => {
      expect(formatOutcomes([])).toBe('No effect');
    });

    it('should return "No effect" for null', () => {
      expect(formatOutcomes(null)).toBe('No effect');
    });
  });

  describe('needsPlayerChoice', () => {
    it('should return true when event requires player choice', () => {
      const event = {
        targetPlayer: 'single',
        choices: [
          {
            outcomes: [
              { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
            ]
          }
        ]
      };
      
      expect(needsPlayerChoice(event)).toBe(true);
    });

    it('should return false when no player choice needed', () => {
      const event = {
        targetPlayer: 'all',
        choices: [
          {
            outcomes: [
              { type: OUTCOME_TYPES.ADD_REQUISITION, value: 10 }
            ]
          }
        ]
      };
      
      expect(needsPlayerChoice(event)).toBe(false);
    });
  });
});
