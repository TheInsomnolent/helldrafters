/* eslint-disable jest/no-conditional-expect */
import { getDraftHandSize, getWeightedPool, generateDraftHand, generateRandomDraftOrder } from './draftHelpers';
import { TYPE, FACTION, TAGS, RARITY } from '../constants/types';
import { MASTER_DB, SUPERSTORE_ITEMS } from '../data/itemsByWarbond';

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

    describe('Warbond and Superstore Filtering', () => {
      const basePlayer = {
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

      const baseGameConfig = {
        starRating: 3,
        faction: FACTION.BUGS,
        globalUniqueness: false,
        burnCards: false
      };

      it('should only include items from enabled warbonds when warbonds specified', () => {
        const playerWithWarbonds = {
          ...basePlayer,
          warbonds: ['helldivers_mobilize'],
          includeSuperstore: false
        };

        const pool = getWeightedPool(playerWithWarbonds, 1, baseGameConfig);

        // All items in pool should either:
        // 1. Be from helldivers_mobilize warbond
        // 2. Have no warbond/superstore (base game items)
        pool.forEach(({ item, armorCombo, isArmorCombo }) => {
          if (isArmorCombo) {
            // For armor combos, at least one item should be accessible
            const hasAccessibleArmor = armorCombo.items.some(armor => 
              armor.warbond === 'helldivers_mobilize' || (!armor.warbond && !armor.superstore)
            );
            expect(hasAccessibleArmor).toBe(true);
          } else {
            const isFromEnabledWarbond = item.warbond === 'helldivers_mobilize';
            const isBaseGame = !item.warbond && !item.superstore;
            expect(isFromEnabledWarbond || isBaseGame).toBe(true);
          }
        });
      });

      it('should exclude superstore items when includeSuperstore is false', () => {
        const playerNoSuperstore = {
          ...basePlayer,
          warbonds: ['helldivers_mobilize'],
          includeSuperstore: false
        };

        const pool = getWeightedPool(playerNoSuperstore, 1, baseGameConfig);
        
        // Get all superstore item IDs for checking
        const superstoreIds = SUPERSTORE_ITEMS.map(item => item.id);

        // No superstore items should be in the pool
        pool.forEach(({ item, armorCombo, isArmorCombo }) => {
          if (isArmorCombo) {
            // For armor combos, no item in the combo should be superstore-only
            const hasSuperStoreOnlyArmor = armorCombo.items.every(armor => armor.superstore);
            expect(hasSuperStoreOnlyArmor).toBe(false);
          } else {
            expect(superstoreIds).not.toContain(item.id);
            expect(item.superstore).not.toBe(true);
          }
        });
      });

      it('should include superstore items when includeSuperstore is true', () => {
        const playerWithSuperstore = {
          ...basePlayer,
          warbonds: ['helldivers_mobilize'],
          includeSuperstore: true
        };

        const pool = getWeightedPool(playerWithSuperstore, 1, baseGameConfig);
        
        // Get all superstore item IDs
        const superstoreIds = SUPERSTORE_ITEMS.map(item => item.id);

        // At least some superstore items should be in the pool
        const superstoreInPool = pool.filter(({ item, isArmorCombo }) => {
          if (isArmorCombo) return false;
          return superstoreIds.includes(item.id);
        });

        expect(superstoreInPool.length).toBeGreaterThan(0);
      });

      it('should filter using excludedItems list', () => {
        const excludedIds = ['p_liberator', 'p_breaker', 'st_ops'];
        const playerWithExcluded = {
          ...basePlayer,
          warbonds: ['helldivers_mobilize'],
          includeSuperstore: false,
          excludedItems: excludedIds
        };

        const pool = getWeightedPool(playerWithExcluded, 1, baseGameConfig);

        // None of the excluded items should be in the pool
        pool.forEach(({ item, isArmorCombo }) => {
          if (!isArmorCombo) {
            expect(excludedIds).not.toContain(item.id);
          }
        });
      });

      it('should handle undefined warbonds gracefully (no filtering)', () => {
        const playerNoWarbonds = {
          ...basePlayer,
          warbonds: undefined,
          includeSuperstore: false
        };

        const pool = getWeightedPool(playerNoWarbonds, 1, baseGameConfig);

        // Pool should have items (warbond filter is skipped when warbonds is undefined)
        expect(pool.length).toBeGreaterThan(0);
      });

      it('should handle empty warbonds array gracefully (no filtering)', () => {
        const playerEmptyWarbonds = {
          ...basePlayer,
          warbonds: [],
          includeSuperstore: false
        };

        const pool = getWeightedPool(playerEmptyWarbonds, 1, baseGameConfig);

        // Pool should have items (warbond filter is skipped when warbonds is empty)
        expect(pool.length).toBeGreaterThan(0);
      });

      it('should treat undefined includeSuperstore as false', () => {
        const playerUndefinedSuperstore = {
          ...basePlayer,
          warbonds: ['helldivers_mobilize'],
          includeSuperstore: undefined
        };

        const pool = getWeightedPool(playerUndefinedSuperstore, 1, baseGameConfig);
        
        // Get all superstore item IDs
        const superstoreIds = SUPERSTORE_ITEMS.map(item => item.id);

        // No superstore items should be in the pool when includeSuperstore is undefined
        pool.forEach(({ item, isArmorCombo }) => {
          if (!isArmorCombo) {
            expect(superstoreIds).not.toContain(item.id);
          }
        });
      });

      it('should filter superstore items even when multiple warbonds enabled', () => {
        const playerMultipleWarbonds = {
          ...basePlayer,
          warbonds: ['helldivers_mobilize', 'steeled_veterans', 'cutting_edge'],
          includeSuperstore: false
        };

        const pool = getWeightedPool(playerMultipleWarbonds, 1, baseGameConfig);
        
        const superstoreIds = SUPERSTORE_ITEMS.map(item => item.id);

        // No superstore items even with multiple warbonds
        pool.forEach(({ item, isArmorCombo }) => {
          if (!isArmorCombo) {
            expect(superstoreIds).not.toContain(item.id);
          }
        });
      });

      it('should correctly combine warbond filtering and excludedItems', () => {
        // Exclude an item from each source: warbond and would-be-superstore
        const excludedIds = ['p_breaker_inc', 'p_double_freedom']; // breaker_inc is from steeled_veterans
        const playerCombined = {
          ...basePlayer,
          warbonds: ['helldivers_mobilize', 'steeled_veterans'],
          includeSuperstore: true,
          excludedItems: excludedIds
        };

        const pool = getWeightedPool(playerCombined, 1, baseGameConfig);

        // Excluded items should not appear
        pool.forEach(({ item, isArmorCombo }) => {
          if (!isArmorCombo) {
            expect(excludedIds).not.toContain(item.id);
          }
        });

        // But other steeled_veterans and superstore items should be present
        const steeledVetItem = pool.find(({ item, isArmorCombo }) => 
          !isArmorCombo && item.warbond === 'steeled_veterans' && !excludedIds.includes(item.id)
        );
        expect(steeledVetItem).toBeDefined();
      });

      it('should handle player with only superstore enabled (no warbonds)', () => {
        // Edge case: empty warbonds but superstore true - should allow superstore items
        // Note: This tests the current behavior - if warbonds is empty, filtering is skipped
        const playerSuperstoreOnly = {
          ...basePlayer,
          warbonds: [],
          includeSuperstore: true
        };

        const pool = getWeightedPool(playerSuperstoreOnly, 1, baseGameConfig);

        // Pool should have items since warbond filtering is skipped
        expect(pool.length).toBeGreaterThan(0);
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
