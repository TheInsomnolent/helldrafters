import {
  hasAntiTank,
  hasBackpack,
  validateLoadoutForDifficulty,
  getFirstEmptyStratagemSlot,
  areStratagemSlotsFull,
  countOccupiedStratagemSlots,
  wouldBackpackConflict
} from './loadoutHelpers';
import { DIFFICULTY_CONFIG } from '../constants/gameConfig';

describe('Utils - Loadout Helpers', () => {
  const mockLoadout = {
    primary: 'p_breaker',
    secondary: 's_peacemaker',
    grenade: 'g_he',
    armor: 'a_b01',
    booster: null,
    stratagems: ['st_gatling', null, null, null] // Non-AT stratagem
  };

  const mockInventory = ['p_breaker', 's_peacemaker', 'g_he', 'a_b01', 'st_gatling'];

  describe('hasAntiTank', () => {
    it('should return false when no AT items', () => {
      const loadout = {
        primary: 'p_breaker',
        secondary: 's_peacemaker',
        grenade: 'g_he',
        armor: 'a_b01',
        booster: null,
        stratagems: [null, null, null, null]
      };
      const inventory = ['s_peacemaker', 'g_he'];
      
      expect(hasAntiTank(loadout, inventory)).toBe(false);
    });

    it('should return true when AT item in stratagems', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: ['st_railgun', null, null, null]
      };
      
      expect(hasAntiTank(loadout, mockInventory)).toBe(true);
    });

    it('should return true when AT grenade equipped', () => {
      const loadout = {
        ...mockLoadout,
        grenade: 'g_thermite'
      };
      const inventory = [...mockInventory, 'g_thermite'];
      
      expect(hasAntiTank(loadout, inventory)).toBe(true);
    });

    it('should return true when AT item in inventory', () => {
      const inventory = [...mockInventory, 'st_railgun'];
      
      expect(hasAntiTank(mockLoadout, inventory)).toBe(true);
    });
  });

  describe('hasBackpack', () => {
    it('should return false when no backpack equipped', () => {
      expect(hasBackpack(mockLoadout)).toBe(false);
    });

    it('should return true when backpack is equipped', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: ['st_bp_jump', 'st_ops', null, null]
      };
      
      expect(hasBackpack(loadout)).toBe(true);
    });

    it('should handle null stratagem slots', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: [null, null, null, null]
      };
      
      expect(hasBackpack(loadout)).toBe(false);
    });
  });

  describe('validateLoadoutForDifficulty', () => {
    it('should validate loadout for difficulty not requiring AT', () => {
      const result = validateLoadoutForDifficulty(
        mockLoadout,
        mockInventory,
        DIFFICULTY_CONFIG[0] // Trivial
      );
      
      expect(result.valid).toBe(true);
      expect(result.missingRequirements).toHaveLength(0);
    });

    it('should fail validation when AT required but missing', () => {
      const loadoutNoAT = {
        primary: 'p_breaker',
        secondary: 's_peacemaker',
        grenade: 'g_he',
        armor: 'a_b01',
        booster: null,
        stratagems: [null, null, null, null]
      };
      const inventoryNoAT = ['p_breaker', 's_peacemaker', 'g_he', 'a_b01'];
      
      const result = validateLoadoutForDifficulty(
        loadoutNoAT,
        inventoryNoAT,
        DIFFICULTY_CONFIG[3] // Challenging - requires AT
      );
      
      expect(result.valid).toBe(false);
      expect(result.missingRequirements).toContain('Anti-Tank capability required');
    });

    it('should pass validation when AT required and present', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: ['st_railgun', null, null, null]
      };
      
      const result = validateLoadoutForDifficulty(
        loadout,
        mockInventory,
        DIFFICULTY_CONFIG[3]
      );
      
      expect(result.valid).toBe(true);
      expect(result.missingRequirements).toHaveLength(0);
    });
  });

  describe('getFirstEmptyStratagemSlot', () => {
    it('should return 0 when first slot is empty', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: [null, null, null, null]
      };
      
      expect(getFirstEmptyStratagemSlot(loadout)).toBe(0);
    });

    it('should return correct index for first empty slot', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: ['st_ops', 'st_railgun', null, null]
      };
      
      expect(getFirstEmptyStratagemSlot(loadout)).toBe(2);
    });

    it('should return -1 when all slots full', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: ['st_ops', 'st_railgun', 'st_ac', 'st_eagle']
      };
      
      expect(getFirstEmptyStratagemSlot(loadout)).toBe(-1);
    });
  });

  describe('areStratagemSlotsFull', () => {
    it('should return false when slots available', () => {
      expect(areStratagemSlotsFull(mockLoadout)).toBe(false);
    });

    it('should return true when all slots full', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: ['st_ops', 'st_railgun', 'st_ac', 'st_eagle']
      };
      
      expect(areStratagemSlotsFull(loadout)).toBe(true);
    });
  });

  describe('countOccupiedStratagemSlots', () => {
    it('should count 1 occupied slot', () => {
      expect(countOccupiedStratagemSlots(mockLoadout)).toBe(1);
    });

    it('should count 0 when all empty', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: [null, null, null, null]
      };
      
      expect(countOccupiedStratagemSlots(loadout)).toBe(0);
    });

    it('should count 4 when all full', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: ['st_ops', 'st_railgun', 'st_ac', 'st_eagle']
      };
      
      expect(countOccupiedStratagemSlots(loadout)).toBe(4);
    });
  });

  describe('wouldBackpackConflict', () => {
    it('should return false when adding non-backpack item', () => {
      expect(wouldBackpackConflict(mockLoadout, 'st_ops')).toBe(false);
    });

    it('should return false when adding backpack and none equipped', () => {
      expect(wouldBackpackConflict(mockLoadout, 'st_bp_jump')).toBe(false);
    });

    it('should return true when adding backpack and one already equipped', () => {
      const loadout = {
        ...mockLoadout,
        stratagems: ['st_bp_shield', null, null, null]
      };
      
      expect(wouldBackpackConflict(loadout, 'st_bp_jump')).toBe(true);
    });

    it('should return false for non-existent item', () => {
      expect(wouldBackpackConflict(mockLoadout, 'nonexistent')).toBe(false);
    });
  });
});
