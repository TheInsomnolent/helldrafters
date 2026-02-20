import { MASTER_DB } from '../data/itemsByWarbond'
import type { Item, ArmorItem, ArmorClass, ArmorPassive, Tag } from '../types'

/**
 * Armor combo representation for draft display
 */
export interface ArmorCombo {
    passive: ArmorPassive
    armorClass: ArmorClass
    items: ArmorItem[]
}

/**
 * Get an item from the database by its ID
 * @param id - The item ID
 * @returns The item object, or undefined if not found
 */
export const getItemById = (id: string | null): Item | undefined => {
    if (id === null) return undefined
    return MASTER_DB.find((item) => item.id === id)
}

/**
 * Check if an item has a specific tag
 * @param itemId - The item ID
 * @param tag - The tag to check for
 * @returns True if the item has the tag
 */
export const itemHasTag = (itemId: string, tag: Tag): boolean => {
    const item = getItemById(itemId)
    return item ? item.tags.includes(tag) : false
}

/**
 * Check if any item in a list has a specific tag
 * @param itemIds - Array of item IDs
 * @param tag - The tag to check for
 * @returns True if any item has the tag
 */
export const anyItemHasTag = (itemIds: string[], tag: Tag): boolean =>
    itemIds.some((id) => itemHasTag(id, tag))

/**
 * Get unique armor combinations (passive + armorClass) from a list of armor items
 * @param armorItems - Array of armor item objects
 * @returns Array of unique {passive, armorClass, items: []} objects
 */
export const getUniqueArmorCombos = (armorItems: ArmorItem[]): ArmorCombo[] => {
    const comboMap = new Map<string, ArmorCombo>()

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

        const combo = comboMap.get(key)
        if (combo) {
            combo.items.push(armor)
        }
    })

    return Array.from(comboMap.values())
}

/**
 * Get all armor items matching a specific passive/armorClass combination
 * @param passive - The armor passive
 * @param armorClass - The armor class
 * @returns Array of matching armor items
 */
export const getArmorsByCombo = (passive: ArmorPassive, armorClass: ArmorClass): ArmorItem[] =>
    MASTER_DB.filter(
        (item): item is ArmorItem =>
            item.type === 'Armor' &&
            (item as ArmorItem).passive === passive &&
            (item as ArmorItem).armorClass === armorClass,
    )

/**
 * Check if player has access to any armor in a combo (based on warbonds)
 * @param combo - Armor combo object {passive, armorClass, items}
 * @param playerWarbonds - Player's unlocked warbonds
 * @param includeSuperstore - Whether player has superstore access
 * @param excludedItems - Items the player has explicitly excluded
 * @returns True if player can access at least one armor in this combo
 */
export const playerHasAccessToArmorCombo = (
    combo: ArmorCombo,
    playerWarbonds: string[] = [],
    includeSuperstore: boolean = false,
    excludedItems: string[] = [],
): boolean =>
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
        const armorWithSuperstore = armor as ArmorItem & { superstore?: boolean }
        if (armorWithSuperstore.superstore && includeSuperstore) {
            return true
        }
        // Items without warbond/superstore are base game (always accessible)
        return !armor.warbond && !armorWithSuperstore.superstore
    })

/**
 * Check if inventory contains any armor from a specific combo
 * @param inventory - Array of item IDs
 * @param passive - Armor passive
 * @param armorClass - Armor class
 * @returns True if inventory has at least one armor with this combo
 */
export const hasArmorCombo = (
    inventory: string[],
    passive: ArmorPassive,
    armorClass: ArmorClass,
): boolean =>
    inventory.some((itemId) => {
        const item = getItemById(itemId)
        return (
            item &&
            item.type === 'Armor' &&
            (item as ArmorItem).passive === passive &&
            (item as ArmorItem).armorClass === armorClass
        )
    })

/**
 * Get display name for armor combo (slash-delimited list of armor names)
 * @param passive - Armor passive
 * @param armorClass - Armor class
 * @param inventory - Player's inventory (to show only owned armors)
 * @returns Slash-delimited armor names
 */
export const getArmorComboDisplayName = (
    passive: ArmorPassive | null | undefined,
    armorClass: ArmorClass | null | undefined,
    inventory?: string[],
): string => {
    if (!passive || !armorClass) return 'Unknown Armor'
    const armors = getArmorsByCombo(passive, armorClass)

    // If inventory provided, filter to only owned armors
    const displayArmors = inventory
        ? armors.filter((armor) => inventory.includes(armor.id))
        : armors

    if (displayArmors.length === 0) return 'Unknown Armor'

    return displayArmors.map((armor) => armor.name).join(' / ')
}
