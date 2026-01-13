import { MASTER_DB } from '../data/items';

/**
 * Get an item from the database by its ID
 * @param {string} id - The item ID
 * @returns {Object|undefined} The item object, or undefined if not found
 */
export const getItemById = (id) => {
  return MASTER_DB.find(item => item.id === id);
};

/**
 * Get multiple items from the database by their IDs
 * @param {string[]} ids - Array of item IDs
 * @returns {Object[]} Array of item objects (skips IDs not found)
 */
export const getItemsByIds = (ids) => {
  return ids
    .map(id => getItemById(id))
    .filter(item => item !== undefined);
};

/**
 * Check if an item has a specific tag
 * @param {string} itemId - The item ID
 * @param {string} tag - The tag to check for
 * @returns {boolean} True if the item has the tag
 */
export const itemHasTag = (itemId, tag) => {
  const item = getItemById(itemId);
  return item ? item.tags.includes(tag) : false;
};

/**
 * Filter items by type
 * @param {string} type - The item type to filter by
 * @returns {Object[]} Array of items of the specified type
 */
export const getItemsByType = (type) => {
  return MASTER_DB.filter(item => item.type === type);
};

/**
 * Filter items by rarity
 * @param {string} rarity - The rarity to filter by
 * @returns {Object[]} Array of items of the specified rarity
 */
export const getItemsByRarity = (rarity) => {
  return MASTER_DB.filter(item => item.rarity === rarity);
};

/**
 * Check if any item in a list has a specific tag
 * @param {string[]} itemIds - Array of item IDs
 * @param {string} tag - The tag to check for
 * @returns {boolean} True if any item has the tag
 */
export const anyItemHasTag = (itemIds, tag) => {
  return itemIds.some(id => itemHasTag(id, tag));
};

/**
 * Get all items with a specific tag
 * @param {string} tag - The tag to filter by
 * @returns {Object[]} Array of items with the specified tag
 */
export const getItemsWithTag = (tag) => {
  return MASTER_DB.filter(item => item.tags.includes(tag));
};

/**
 * Count items of a specific type in an inventory
 * @param {string[]} inventory - Array of item IDs
 * @param {string} type - The type to count
 * @returns {number} Count of items of the specified type
 */
export const countItemsByType = (inventory, type) => {
  return getItemsByIds(inventory).filter(item => item.type === type).length;
};
