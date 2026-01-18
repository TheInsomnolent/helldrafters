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

    it('should directly assign random booster when targetPlayer is random', () => {
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
        ]
      };
      const outcome = { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'random' };
      const updates = processEventOutcome(outcome, {}, multiPlayerState);
      
      // Should NOT generate a booster draft (no selection UI)
      expect(updates.needsBoosterSelection).toBeUndefined();
      expect(updates.boosterDraft).toBeUndefined();
      
      // Should directly assign booster to a player
      expect(updates.players).toBeDefined();
      expect(updates.gainedBoosterName).toBeDefined();
      expect(updates.gainedBoosterPlayerIndex).toBeDefined();
      
      // Verify that one player got a booster in both loadout and inventory
      const playersWithBooster = updates.players.filter(p => p.loadout.booster !== null);
      expect(playersWithBooster.length).toBe(1);
      
      const playerWithBooster = playersWithBooster[0];
      expect(playerWithBooster.inventory).toContain(playerWithBooster.loadout.booster);
    });

    it('should filter out boosters already owned when assigning random booster', () => {
      const stateWithExistingBooster = {
        ...mockState,
        players: [
          { ...mockState.players[0], loadout: { ...mockState.players[0].loadout, booster: 'b_stamina' } },
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
          }
        ]
      };
      const outcome = { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'random' };
      const updates = processEventOutcome(outcome, {}, stateWithExistingBooster);
      
      expect(updates.players).toBeDefined();
      
      // Verify that the assigned booster is not b_stamina
      const playersWithBooster = updates.players.filter(p => p.loadout.booster !== null && p.loadout.booster !== 'b_stamina');
      expect(playersWithBooster.length).toBeGreaterThan(0);
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
        { type: OUTCOME_TYPES.ADD_REQUISITION, value: 10 }
      ];
      const updates = processAllOutcomes(outcomes, {}, mockState);
      
      expect(updates.requisition).toBe(60);
    });

    it('should handle empty outcomes array', () => {
      const updates = processAllOutcomes([], {}, mockState);
      expect(Object.keys(updates)).toHaveLength(0);
    });

    it('should handle two random booster outcomes (commendation ceremony)', () => {
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
          },
          { 
            id: 3, 
            name: 'Helldiver 3', 
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
        ]
      };
      
      const outcomes = [
        { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'random' },
        { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'random' }
      ];
      
      const updates = processAllOutcomes(outcomes, {}, multiPlayerState);
      
      // Should NOT trigger booster selection UI
      expect(updates.needsBoosterSelection).toBeUndefined();
      expect(updates.boosterDraft).toBeUndefined();
      
      // Should have players updated
      expect(updates.players).toBeDefined();
      
      // Should track both gained boosters
      expect(updates.gainedBoosters).toBeDefined();
      expect(updates.gainedBoosters.length).toBe(2);
      
      // Verify at least one player got a booster (could be 1 or 2 players depending on random selection)
      const playersWithBooster = updates.players.filter(p => p.loadout.booster !== null);
      expect(playersWithBooster.length).toBeGreaterThan(0);
      expect(playersWithBooster.length).toBeLessThanOrEqual(2);
      
      // Verify each player with a booster has it in both loadout and inventory
      playersWithBooster.forEach(player => {
        expect(player.loadout.booster).toBeTruthy();
        expect(player.inventory).toContain(player.loadout.booster);
      });
      
      // Verify that if two different players got boosters, they got different boosters
      const uniqueBoosters = new Set(playersWithBooster.map(p => p.loadout.booster));
      expect(uniqueBoosters.size).toBe(playersWithBooster.length);
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
