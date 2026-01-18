import { STARTING_LOADOUT, DIFFICULTY_CONFIG, ENDURANCE_MISSION_COUNTS, getEnduranceMissionCount } from './gameConfig';

describe('Constants - Game Configuration', () => {
  describe('STARTING_LOADOUT', () => {
    it('should have all required loadout slots', () => {
      expect(STARTING_LOADOUT).toHaveProperty('primary');
      expect(STARTING_LOADOUT).toHaveProperty('secondary');
      expect(STARTING_LOADOUT).toHaveProperty('grenade');
      expect(STARTING_LOADOUT).toHaveProperty('armor');
      expect(STARTING_LOADOUT).toHaveProperty('booster');
      expect(STARTING_LOADOUT).toHaveProperty('stratagems');
    });

    it('should have correct starting weapon values', () => {
      expect(STARTING_LOADOUT.primary).toBeNull();
      expect(STARTING_LOADOUT.secondary).toBe('s_peacemaker');
      expect(STARTING_LOADOUT.grenade).toBe('g_he');
      expect(STARTING_LOADOUT.armor).toBe('a_b01');
      expect(STARTING_LOADOUT.booster).toBeNull();
    });

    it('should have 4 stratagem slots', () => {
      expect(STARTING_LOADOUT.stratagems).toHaveLength(4);
      expect(STARTING_LOADOUT.stratagems.every(s => s === null)).toBe(true);
    });
  });

  describe('DIFFICULTY_CONFIG', () => {
    it('should have exactly 10 difficulty levels', () => {
      expect(DIFFICULTY_CONFIG).toHaveLength(10);
    });

    it('should have sequential difficulty levels 1-10', () => {
      DIFFICULTY_CONFIG.forEach((config, index) => {
        expect(config.level).toBe(index + 1);
      });
    });

    it('should have correct difficulty names', () => {
      expect(DIFFICULTY_CONFIG[0].name).toBe('Trivial');
      expect(DIFFICULTY_CONFIG[3].name).toBe('Challenging');
      expect(DIFFICULTY_CONFIG[9].name).toBe('Super Helldive');
    });

    it('should require AT starting from level 4', () => {
      // Levels 1-3 should not require AT
      expect(DIFFICULTY_CONFIG[0].reqAT).toBe(false);
      expect(DIFFICULTY_CONFIG[1].reqAT).toBe(false);
      expect(DIFFICULTY_CONFIG[2].reqAT).toBe(false);

      // Levels 4-10 should require AT
      for (let i = 3; i < 10; i++) {
        expect(DIFFICULTY_CONFIG[i].reqAT).toBe(true);
      }
    });

    it('should have all required properties for each difficulty', () => {
      DIFFICULTY_CONFIG.forEach(config => {
        expect(config).toHaveProperty('level');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('reqAT');
      });
    });
  });

  describe('ENDURANCE_MISSION_COUNTS', () => {
    it('should have mission counts for all 10 difficulties', () => {
      for (let i = 1; i <= 10; i++) {
        expect(ENDURANCE_MISSION_COUNTS[i]).toBeDefined();
        expect(typeof ENDURANCE_MISSION_COUNTS[i]).toBe('number');
      }
    });

    it('should have correct mission counts per difficulty', () => {
      // Trivial and Easy = 1 mission
      expect(ENDURANCE_MISSION_COUNTS[1]).toBe(1);
      expect(ENDURANCE_MISSION_COUNTS[2]).toBe(1);
      
      // Medium and Challenging = 2 missions
      expect(ENDURANCE_MISSION_COUNTS[3]).toBe(2);
      expect(ENDURANCE_MISSION_COUNTS[4]).toBe(2);
      
      // Hard through Super Helldive = 3 missions
      expect(ENDURANCE_MISSION_COUNTS[5]).toBe(3);
      expect(ENDURANCE_MISSION_COUNTS[6]).toBe(3);
      expect(ENDURANCE_MISSION_COUNTS[7]).toBe(3);
      expect(ENDURANCE_MISSION_COUNTS[8]).toBe(3);
      expect(ENDURANCE_MISSION_COUNTS[9]).toBe(3);
      expect(ENDURANCE_MISSION_COUNTS[10]).toBe(3);
    });
  });

  describe('getEnduranceMissionCount', () => {
    it('should return correct mission count for each difficulty', () => {
      expect(getEnduranceMissionCount(1)).toBe(1);
      expect(getEnduranceMissionCount(2)).toBe(1);
      expect(getEnduranceMissionCount(3)).toBe(2);
      expect(getEnduranceMissionCount(4)).toBe(2);
      expect(getEnduranceMissionCount(5)).toBe(3);
      expect(getEnduranceMissionCount(10)).toBe(3);
    });

    it('should return 1 for unknown difficulties', () => {
      expect(getEnduranceMissionCount(0)).toBe(1);
      expect(getEnduranceMissionCount(11)).toBe(1);
      expect(getEnduranceMissionCount(undefined)).toBe(1);
    });
  });
});
