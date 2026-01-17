import {
  getItemById,
  getItemsByIds,
  itemHasTag,
  getItemsByType,
  getItemsByRarity,
  anyItemHasTag,
  getItemsWithTag,
  countItemsByType
} from './itemHelpers';
import { TYPE, RARITY, TAGS } from '../constants/types';

describe('Utils - Item Helpers', () => {
  describe('getItemById', () => {
    it('should find item by ID', () => {
      const item = getItemById('s_peacemaker');
      expect(item).toBeDefined();
      expect(item.name).toBe('P-2 Peacemaker');
    });

    it('should return undefined for non-existent ID', () => {
      const item = getItemById('nonexistent_id');
      expect(item).toBeUndefined();
    });
  });

  describe('getItemsByIds', () => {
    it('should return multiple items by IDs', () => {
      const items = getItemsByIds(['s_peacemaker', 'g_he', 'a_b01']);
      expect(items).toHaveLength(3);
      expect(items.every(item => item !== undefined)).toBe(true);
    });

    it('should skip non-existent IDs', () => {
      const items = getItemsByIds(['s_peacemaker', 'nonexistent', 'g_he']);
      expect(items).toHaveLength(2);
    });

    it('should return empty array for empty input', () => {
      const items = getItemsByIds([]);
      expect(items).toHaveLength(0);
    });
  });

  describe('itemHasTag', () => {
    it('should return true if item has the tag', () => {
      expect(itemHasTag('g_thermite', TAGS.AT)).toBe(true);
      expect(itemHasTag('g_thermite', TAGS.FIRE)).toBe(true);
    });

    it('should return false if item does not have the tag', () => {
      expect(itemHasTag('s_peacemaker', TAGS.AT)).toBe(false);
    });

    it('should return false for non-existent item', () => {
      expect(itemHasTag('nonexistent', TAGS.AT)).toBe(false);
    });
  });

  describe('getItemsByType', () => {
    it('should return all items of a specific type', () => {
      const primaries = getItemsByType(TYPE.PRIMARY);
      expect(primaries.length).toBeGreaterThan(0);
      expect(primaries.every(item => item.type === TYPE.PRIMARY)).toBe(true);
    });

    it('should return all boosters', () => {
      const boosters = getItemsByType(TYPE.BOOSTER);
      expect(boosters.length).toBeGreaterThan(0);
      expect(boosters.every(item => item.type === TYPE.BOOSTER)).toBe(true);
    });
  });

  describe('getItemsByRarity', () => {
    it('should return all common items', () => {
      const commons = getItemsByRarity(RARITY.COMMON);
      expect(commons.length).toBeGreaterThan(0);
      expect(commons.every(item => item.rarity === RARITY.COMMON)).toBe(true);
    });

    it('should return all rare items', () => {
      const rares = getItemsByRarity(RARITY.RARE);
      expect(rares.length).toBeGreaterThan(0);
      expect(rares.every(item => item.rarity === RARITY.RARE)).toBe(true);
    });
  });

  describe('anyItemHasTag', () => {
    it('should return true if any item has the tag', () => {
      expect(anyItemHasTag(['s_peacemaker', 'g_thermite'], TAGS.AT)).toBe(true);
    });

    it('should return false if no items have the tag', () => {
      expect(anyItemHasTag(['s_peacemaker', 'g_he'], TAGS.AT)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(anyItemHasTag([], TAGS.AT)).toBe(false);
    });
  });

  describe('getItemsWithTag', () => {
    it('should return all items with AT tag', () => {
      const atItems = getItemsWithTag(TAGS.AT);
      expect(atItems.length).toBeGreaterThan(0);
      expect(atItems.every(item => item.tags.includes(TAGS.AT))).toBe(true);
    });

    it('should return all items with FIRE tag', () => {
      const fireItems = getItemsWithTag(TAGS.FIRE);
      expect(fireItems.length).toBeGreaterThan(0);
      expect(fireItems.every(item => item.tags.includes(TAGS.FIRE))).toBe(true);
    });

    it('should return all items with BACKPACK tag', () => {
      const backpacks = getItemsWithTag(TAGS.BACKPACK);
      expect(backpacks.length).toBeGreaterThan(0);
      expect(backpacks.every(item => item.tags.includes(TAGS.BACKPACK))).toBe(true);
    });
  });

  describe('countItemsByType', () => {
    it('should count stratagems in inventory', () => {
      const inventory = ['st_ops', 'st_railgun', 's_peacemaker', 'st_ac'];
      const count = countItemsByType(inventory, TYPE.STRATAGEM);
      expect(count).toBe(3);
    });

    it('should count primaries in inventory', () => {
      const inventory = ['p_breaker', 's_peacemaker', 'p_slugger'];
      const count = countItemsByType(inventory, TYPE.PRIMARY);
      expect(count).toBe(2);
    });

    it('should return 0 for empty inventory', () => {
      const count = countItemsByType([], TYPE.STRATAGEM);
      expect(count).toBe(0);
    });
  });
});
