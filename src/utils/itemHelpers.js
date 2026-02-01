import { MASTER_DB } from '../data/itemsByWarbond'

/**
 * Get an item from the database by its ID
 * @param {string} id - The item ID
 * @returns {Object|undefined} The item object, or undefined if not found
 */
export const getItemById = (id) => MASTER_DB.find((item) => item.id === id)

/**
 * Get multiple items from the database by their IDs
 * @param {string[]} ids - Array of item IDs
 * @returns {Object[]} Array of item objects (skips IDs not found)
 */
export const getItemsByIds = (ids) =>
    ids.map((id) => getItemById(id)).filter((item) => item !== undefined)

/**
 * Check if an item has a specific tag
 * @param {string} itemId - The item ID
 * @param {string} tag - The tag to check for
 * @returns {boolean} True if the item has the tag
 */
export const itemHasTag = (itemId, tag) => {
    const item = getItemById(itemId)
    return item ? item.tags.includes(tag) : false
}

/**
 * Filter items by type
 * @param {string} type - The item type to filter by
 * @returns {Object[]} Array of items of the specified type
 */
export const getItemsByType = (type) => MASTER_DB.filter((item) => item.type === type)

/**
 * Filter items by rarity
 * @param {string} rarity - The rarity to filter by
 * @returns {Object[]} Array of items of the specified rarity
 */
export const getItemsByRarity = (rarity) => MASTER_DB.filter((item) => item.rarity === rarity)

/**
 * Check if any item in a list has a specific tag
 * @param {string[]} itemIds - Array of item IDs
 * @param {string} tag - The tag to check for
 * @returns {boolean} True if any item has the tag
 */
export const anyItemHasTag = (itemIds, tag) => itemIds.some((id) => itemHasTag(id, tag))

/**
 * Get all items with a specific tag
 * @param {string} tag - The tag to filter by
 * @returns {Object[]} Array of items with the specified tag
 */
export const getItemsWithTag = (tag) => MASTER_DB.filter((item) => item.tags.includes(tag))

/**
 * Count items of a specific type in an inventory
 * @param {string[]} inventory - Array of item IDs
 * @param {string} type - The type to count
 * @returns {number} Count of items of the specified type
 */
export const countItemsByType = (inventory, type) =>
    getItemsByIds(inventory).filter((item) => item.type === type).length

/**
 * Get unique armor combinations (passive + armorClass) from a list of armor items
 * @param {Object[]} armorItems - Array of armor item objects
 * @returns {Object[]} Array of unique {passive, armorClass, items: []} objects
 */
export const getUniqueArmorCombos = (armorItems) => {
    const comboMap = new Map()

    armorItems.forEach((armor) => {
        if (!armor.passive || !armor.armorClass) return

        const key = `${armor.passive}|${armor.armorClass}`

        if (!comboMap.has(key)) {
            comboMap.set(key, {
                passive: armor.passive,
                armorClass: armor.armorClass,
                items: [],
            })
        }

        comboMap.get(key).items.push(armor)
    })

    return Array.from(comboMap.values())
}

/**
 * Get all armor items matching a specific passive/armorClass combination
 * @param {string} passive - The armor passive
 * @param {string} armorClass - The armor class
 * @returns {Object[]} Array of matching armor items
 */
export const getArmorsByCombo = (passive, armorClass) =>
    MASTER_DB.filter(
        (item) =>
            item.type === 'Armor' && item.passive === passive && item.armorClass === armorClass,
    )

/**
 * Check if player has access to any armor in a combo (based on warbonds)
 * @param {Object} combo - Armor combo object {passive, armorClass, items}
 * @param {string[]} playerWarbonds - Player's unlocked warbonds
 * @param {boolean} includeSuperstore - Whether player has superstore access
 * @param {string[]} excludedItems - Items the player has explicitly excluded
 * @returns {boolean} True if player can access at least one armor in this combo
 */
export const playerHasAccessToArmorCombo = (
    combo,
    playerWarbonds = [],
    includeSuperstore = false,
    excludedItems = [],
) =>
    combo.items.some((armor) => {
        // Skip if this armor is explicitly excluded
        if (excludedItems.includes(armor.id)) {
            return false
        }
        // Check warbond access
        if (armor.warbond && playerWarbonds.includes(armor.warbond)) {
            return true
        }
        // Check superstore access
        if (armor.superstore && includeSuperstore) {
            return true
        }
        // Items without warbond/superstore are base game (always accessible)
        return !armor.warbond && !armor.superstore
    })

/**
 * Check if inventory contains any armor from a specific combo
 * @param {string[]} inventory - Array of item IDs
 * @param {string} passive - Armor passive
 * @param {string} armorClass - Armor class
 * @returns {boolean} True if inventory has at least one armor with this combo
 */
export const hasArmorCombo = (inventory, passive, armorClass) =>
    inventory.some((itemId) => {
        const item = getItemById(itemId)
        return (
            item &&
            item.type === 'Armor' &&
            item.passive === passive &&
            item.armorClass === armorClass
        )
    })

/**
 * Get display name for armor combo (slash-delimited list of armor names)
 * @param {string} passive - Armor passive
 * @param {string} armorClass - Armor class
 * @param {string[]} inventory - Player's inventory (to show only owned armors)
 * @returns {string} Slash-delimited armor names
 */
export const getArmorComboDisplayName = (passive, armorClass, inventory = null) => {
    const armors = getArmorsByCombo(passive, armorClass)

    // If inventory provided, filter to only owned armors
    const displayArmors = inventory
        ? armors.filter((armor) => inventory.includes(armor.id))
        : armors

    if (displayArmors.length === 0) return 'Unknown Armor'

    return displayArmors.map((armor) => armor.name).join(' / ')
}
