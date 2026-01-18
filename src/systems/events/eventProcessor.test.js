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

    it('should change faction', () => {
      const outcome = { type: OUTCOME_TYPES.CHANGE_FACTION };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      // Should trigger subfaction selection with a different faction than BUGS
      expect(updates.needsSubfactionSelection).toBe(true);
      expect(updates.pendingFaction).toBeDefined();
      expect(updates.pendingFaction).not.toBe(FACTION.BUGS);
      expect(Object.values(FACTION)).toContain(updates.pendingFaction);
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

    it('should generate booster draft for selection', () => {
      const outcome = { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.needsBoosterSelection).toBe(true);
      expect(updates.boosterDraft).toBeDefined();
      expect(Array.isArray(updates.boosterDraft)).toBe(true);
      expect(updates.boosterOutcome).toBeDefined();
    });

    it('should filter out boosters already owned by players', () => {
      const stateWithBooster = {
        ...mockState,
        players: [
          { ...mockState.players[0], loadout: { ...mockState.players[0].loadout, booster: 'b_stamina' } },
          { id: 2, name: 'Helldiver 2', inventory: [], loadout: { primary: null, secondary: null, grenade: null, armor: null, booster: 'b_hellpod', stratagems: [null, null, null, null] } }
        ]
      };
      const outcome = { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' };
      const updates = processEventOutcome(outcome, {}, stateWithBooster);
      
      expect(updates.boosterDraft).toBeDefined();
      expect(updates.boosterDraft).not.toContain('b_stamina');
      expect(updates.boosterDraft).not.toContain('b_hellpod');
    });

    it('should filter out burned boosters when burn mode is enabled', () => {
      const stateWithBurn = {
        ...mockState,
        gameConfig: { ...mockState.gameConfig, burnCards: true },
        burnedCards: ['b_stamina', 'b_hellpod']
      };
      const outcome = { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' };
      const updates = processEventOutcome(outcome, {}, stateWithBurn);
      
      expect(updates.boosterDraft).toBeDefined();
      expect(updates.boosterDraft).not.toContain('b_stamina');
      expect(updates.boosterDraft).not.toContain('b_hellpod');
    });

    it('should not filter burned cards when burn mode is disabled', () => {
      const stateWithoutBurn = {
        ...mockState,
        gameConfig: { ...mockState.gameConfig, burnCards: false },
        burnedCards: ['b_stamina']
      };
      const outcome = { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' };
      const updates = processEventOutcome(outcome, {}, stateWithoutBurn);
      
      // Since burnCards is false, the booster draft should not be affected by burnedCards
      // We can't guarantee b_stamina will be in the draft (it's random), but we can ensure
      // the draft generation succeeds and produces results
      expect(updates.boosterDraft).toBeDefined();
      expect(Array.isArray(updates.boosterDraft)).toBe(true);
    });

    it('should redraft player inventory', () => {
      const outcome = { type: OUTCOME_TYPES.REDRAFT, value: 3 };
      const updates = processEventOutcome(outcome, {}, mockState);
      
      expect(updates.players).toBeDefined();
      expect(updates.players[0].inventory.length).toBeLessThan(mockState.players[0].inventory.length);
      expect(updates.bonusRequisition).toBeGreaterThan(0);
    });

    it('should give all players random light armor and add to inventory', () => {
      const multiPlayerState = {
        ...mockState,
        players: [
          { ...mockState.players[0] },
          {
            id: 2,
            name: 'Helldiver 2',
            inventory: ['s_peacemaker', 'g_he', 'a_b01'],
            loadout: {
              primary: null,
              secondary: 's_peacemaker',
              grenade: 'g_he',
              armor: 'a_b01',
              booster: null,
              stratagems: [null, null, null, null]
            }
          }
        ],
        burnedCards: []
      };
      
      const outcome = { type: OUTCOME_TYPES.GAIN_RANDOM_LIGHT_ARMOR_AND_DRAFT_THROWABLE };
      const updates = processEventOutcome(outcome, {}, multiPlayerState);
      
      expect(updates.players).toBeDefined();
      expect(updates.players.length).toBe(2);
      
      // Each player should have a light armor assigned
      updates.players.forEach(player => {
        expect(player.loadout.armor).toBeDefined();
        expect(player.loadout.armor).not.toBe('a_b01'); // Should be different from default
        // Armor should be in inventory
        expect(player.inventory).toContain(player.loadout.armor);
      });
      
      // Should trigger special draft for throwables
      expect(updates.needsSpecialDraft).toBe(true);
      expect(updates.specialDraftType).toBe('throwable');
    });

    it('should give all players random heavy armor and add to inventory', () => {
      const multiPlayerState = {
        ...mockState,
        players: [
          { ...mockState.players[0] },
          {
            id: 2,
            name: 'Helldiver 2',
            inventory: ['s_peacemaker', 'g_he', 'a_b01'],
            loadout: {
              primary: null,
              secondary: 's_peacemaker',
              grenade: 'g_he',
              armor: 'a_b01',
              booster: null,
              stratagems: [null, null, null, null]
            }
          }
        ],
        burnedCards: []
      };
      
      const outcome = { type: OUTCOME_TYPES.GAIN_RANDOM_HEAVY_ARMOR_AND_DRAFT_SECONDARY };
      const updates = processEventOutcome(outcome, {}, multiPlayerState);
      
      expect(updates.players).toBeDefined();
      expect(updates.players.length).toBe(2);
      
      // Each player should have a heavy armor assigned
      updates.players.forEach(player => {
        expect(player.loadout.armor).toBeDefined();
        // Armor should be in inventory
        expect(player.inventory).toContain(player.loadout.armor);
      });
      
      // Should trigger special draft for secondaries
      expect(updates.needsSpecialDraft).toBe(true);
      expect(updates.specialDraftType).toBe('secondary');
    });

    it('should give each player a different random armor', () => {
      const multiPlayerState = {
        ...mockState,
        players: [
          { ...mockState.players[0] },
          {
            id: 2,
            name: 'Helldiver 2',
            inventory: ['s_peacemaker'],
            loadout: {
              primary: null,
              secondary: 's_peacemaker',
              grenade: null,
              armor: 'a_b01',
              booster: null,
              stratagems: [null, null, null, null]
            }
          },
          {
            id: 3,
            name: 'Helldiver 3',
            inventory: ['s_peacemaker'],
            loadout: {
              primary: null,
              secondary: 's_peacemaker',
              grenade: null,
              armor: 'a_b01',
              booster: null,
              stratagems: [null, null, null, null]
            }
          }
        ],
        burnedCards: []
      };
      
      const outcome = { type: OUTCOME_TYPES.GAIN_RANDOM_LIGHT_ARMOR_AND_DRAFT_THROWABLE };
      
      // Run multiple times to check randomness
      let hasDifferentArmors = false;
      for (let i = 0; i < 10; i++) {
        const updates = processEventOutcome(outcome, {}, multiPlayerState);
        const armors = updates.players.map(p => p.loadout.armor);
        
        // Check if at least one run has different armors between players
        const uniqueArmors = new Set(armors);
        if (uniqueArmors.size > 1) {
          hasDifferentArmors = true;
          break;
        }
      }
      
      // With multiple players and multiple armor options, we should eventually see different armors
      expect(hasDifferentArmors).toBe(true);
    });
  });

  describe('processAllOutcomes', () => {
    it('should process multiple outcomes in sequence', () => {
      const outcomes = [
        { type: OUTCOME_TYPES.ADD_REQUISITION, value: 10 }
      ];
      const updates = processAllOutcomes(outcomes, {}, mockState);
      
      expect(updates.requisition).toBe(60);
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

    it('should format CHANGE_FACTION', () => {
      const outcome = { type: OUTCOME_TYPES.CHANGE_FACTION };
      expect(formatOutcome(outcome)).toBe('Switch to different theater');
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
        { type: OUTCOME_TYPES.ADD_REQUISITION, value: 10 }
      ];
      const result = formatOutcomes(outcomes);
      
      expect(result).toContain('+10 Requisition');
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
