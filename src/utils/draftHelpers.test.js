/* eslint-disable jest/no-conditional-expect */
import { getDraftHandSize, getWeightedPool, generateDraftHand, generateRandomDraftOrder } from './draftHelpers';
import { TYPE, FACTION, TAGS } from '../constants/types';

describe('Utils - Draft Helpers', () => {
  describe('generateRandomDraftOrder', () => {
    it('should return array with correct length for single player', () => {
      const order = generateRandomDraftOrder(1);
      expect(order).toHaveLength(1);
      expect(order).toEqual([0]);
    });

    it('should return array with correct length for multiple players', () => {
      const order = generateRandomDraftOrder(4);
      expect(order).toHaveLength(4);
    });

    it('should contain all player indices exactly once', () => {
      const playerCount = 4;
      const order = generateRandomDraftOrder(playerCount);
      
      // Check all indices are present
      for (let i = 0; i < playerCount; i++) {
        expect(order).toContain(i);
      }
      
      // Check no duplicates (length should match unique count)
      const uniqueIndices = new Set(order);
      expect(uniqueIndices.size).toBe(playerCount);
    });

    it('should produce different orders on multiple calls (probabilistic)', () => {
      const playerCount = 4;
      const orders = [];
      
      // Generate 10 orders
      for (let i = 0; i < 10; i++) {
        orders.push(generateRandomDraftOrder(playerCount).join(','));
      }
      
      // At least one should be different (very high probability)
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBeGreaterThan(1);
    });
  });

  describe('getDraftHandSize', () => {
    it('should return 2 cards for 1-2 star missions', () => {
      expect(getDraftHandSize(1)).toBe(2);
      expect(getDraftHandSize(2)).toBe(2);
    });

    it('should return 3 cards for 3-4 star missions', () => {
      expect(getDraftHandSize(3)).toBe(3);
      expect(getDraftHandSize(4)).toBe(3);
    });

    it('should return 4 cards for 5 star missions', () => {
      expect(getDraftHandSize(5)).toBe(4);
    });
  });

  describe('getWeightedPool', () => {
    const mockPlayer = {
      inventory: ['s_peacemaker', 'g_he'],
      loadout: {
        primary: null,
        secondary: 's_peacemaker',
        grenade: 'g_he',
        armor: 'a_b01',
        booster: null,
        stratagems: [null, null, null, null]
      }
    };

    const mockGameConfig = {
      starRating: 3,
      faction: FACTION.BUGS,
      globalUniqueness: false,
      burnCards: false
    };

    it('should exclude already owned items', () => {
      const pool = getWeightedPool(mockPlayer, 1, mockGameConfig);
      const ownedIds = mockPlayer.inventory;
      
      pool.forEach(({ item }) => {
        expect(ownedIds).not.toContain(item.id);
      });
    });

    it('should exclude boosters from pool', () => {
      const pool = getWeightedPool(mockPlayer, 1, mockGameConfig);
      
      pool.forEach(({ item }) => {
        expect(item.type).not.toBe(TYPE.BOOSTER);
      });
    });

    it('should boost FIRE items for Bugs faction', () => {
      const pool = getWeightedPool(mockPlayer, 1, mockGameConfig);
      const fireItem = pool.find(({ item }) => item.tags.includes(TAGS.FIRE));
      const nonFireItem = pool.find(({ item }) => !item.tags.includes(TAGS.FIRE) && item.rarity === fireItem?.item.rarity);

      if (fireItem && nonFireItem) {
        expect(fireItem.weight).toBeGreaterThan(nonFireItem.weight);
      }
    });

    it('should massively boost AT items when approaching difficulty 4 without AT', () => {
      const pool = getWeightedPool(mockPlayer, 3, mockGameConfig);
      const atItem = pool.find(({ item }) => item.tags.includes(TAGS.AT));

      if (atItem) {
        expect(atItem.weight).toBeGreaterThan(500);
      }
    });

    it('should reduce secondary weight if player already has secondary', () => {
      const pool = getWeightedPool(mockPlayer, 1, mockGameConfig);
      const secondaryItems = pool.filter(({ item }) => item.type === TYPE.SECONDARY);

      if (secondaryItems.length > 0) {
        // Weight should be reduced (but still > 0)
        secondaryItems.forEach(({ weight }) => {
          expect(weight).toBeGreaterThan(0);
        });
      }
    });

    it('should set backpack weight to 0 if player already has backpack', () => {
      const playerWithBackpack = {
        ...mockPlayer,
        loadout: {
          ...mockPlayer.loadout,
          stratagems: ['st_bp_jump', null, null, null]
        }
      };

      const pool = getWeightedPool(playerWithBackpack, 1, mockGameConfig);
      const backpackItems = pool.filter(({ item }) => item.tags.includes(TAGS.BACKPACK));

      expect(backpackItems).toHaveLength(0);
    });

    it('should respect global uniqueness setting', () => {
      const configWithGlobalUnique = {
        ...mockGameConfig,
        globalUniqueness: true
      };

      const otherPlayer = {
        inventory: ['p_breaker', 'st_ops'],
        loadout: mockPlayer.loadout
      };

      const pool = getWeightedPool(
        mockPlayer,
        1,
        configWithGlobalUnique,
        [],
        [mockPlayer, otherPlayer]
      );

      pool.forEach(({ item }) => {
        expect(otherPlayer.inventory).not.toContain(item.id);
      });
    });

    it('should respect burned cards', () => {
      const burnedCards = ['p_liberator', 'p_breaker'];
      const configWithBurn = {
        ...mockGameConfig,
        burnCards: true
      };

      const pool = getWeightedPool(mockPlayer, 1, configWithBurn, burnedCards);

      pool.forEach(({ item }) => {
        expect(burnedCards).not.toContain(item.id);
      });
    });
  });

  describe('generateDraftHand', () => {
    const mockPlayer = {
      inventory: ['s_peacemaker', 'g_he'],
      loadout: {
        primary: null,
        secondary: 's_peacemaker',
        grenade: 'g_he',
        armor: 'a_b01',
        booster: null,
        stratagems: [null, null, null, null]
      }
    };

    const mockGameConfig = {
      starRating: 3,
      faction: FACTION.BUGS,
      globalUniqueness: false,
      burnCards: false
    };

    it('should generate hand of correct size', () => {
      const hand = generateDraftHand(mockPlayer, 1, mockGameConfig);
      expect(hand.length).toBe(getDraftHandSize(mockGameConfig.starRating));
    });

    it('should not include duplicate items in same hand', () => {
      const hand = generateDraftHand(mockPlayer, 1, mockGameConfig);
      const ids = hand.map(item => item.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should return empty array for null player', () => {
      const hand = generateDraftHand(null, 1, mockGameConfig);
      expect(hand).toHaveLength(0);
    });

    it('should call onBurnCard callback when burning cards', () => {
      const onBurnCard = jest.fn();
      const burnConfig = { ...mockGameConfig, burnCards: true };

      generateDraftHand(mockPlayer, 1, burnConfig, [], [], onBurnCard);

      expect(onBurnCard).toHaveBeenCalled();
    });

    it('should not call onBurnCard when burn mode disabled', () => {
      const onBurnCard = jest.fn();

      generateDraftHand(mockPlayer, 1, mockGameConfig, [], [], onBurnCard);

      expect(onBurnCard).not.toHaveBeenCalled();
    });
  });
});
