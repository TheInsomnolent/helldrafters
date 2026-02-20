/**
 * Armor classification and passive abilities
 * Re-exports from central types file for backwards compatibility,
 * plus descriptions for display
 */

export { ARMOR_CLASS, ARMOR_PASSIVE } from '../types'
export type { ArmorClass, ArmorPassive } from '../types'

// Passive descriptions for reference - flavour text from Helldivers wiki
export const ARMOR_PASSIVE_DESCRIPTIONS: Record<string, string> = {
    servo_assisted: 'Increases throwing range by 30%. Provides +50% limb health.',
    scout: 'Markers placed on the map will generate radar scans every 2.0s. Reduces range at which enemies can detect the wearer by 30%.',
    peak_physique:
        'Increases melee damage by 100%. Improves weapons handling with less drag on weapon movement.',
    extra_padding: 'Provides a higher armor rating.',

    fortified:
        'Further reduces recoil when crouching or prone by 30%. Provides 50% resistance to explosive damage.',
    democracy_protects:
        '50% chance to not die when taking lethal damage. Prevents all damage from bleeding if chest hemorrhages.',
    unflinching:
        'Helps prevent Helldivers from flinching when hit. Provides a higher armor rating. Markers placed on the map will generate radar scans every 2.0s.',
    ballistic_padding:
        'Provides 25% resistance to chest damage. Provides 25% resistance to explosive damage. Prevents all damage from bleeding if chest hemorrhages.',
    rock_solid:
        'Helps prevent Helldivers from ragdolling when hit. Increases melee damage by 100%.',

    engineering_kit:
        'Further reduces recoil when crouching or prone by 30%. Increases initial inventory and holding capacity of throwables by +2.',
    med_kit:
        'Increases initial inventory and holding capacity of stims by +2. Increases stim effect duration by 2.0s.',
    electrical_conduit: 'Provides 95% resistance to arc damage.',

    inflammable:
        'Provides 75% damage resistance to fire, allowing bearer to rest assured in their inflammability.',
    advanced_filtration: 'Provides 80% resistance to gas damage and effects.',
    desert_stormer:
        'Provides 40% resistance to fire, gas, acid, and electrical damage. Increases throwing range by 20%.',
    acclimated: 'Provides 50% resistance to fire, gas, acid, and electrical damage.',

    integrated_explosives:
        'Armor explodes 1.5s after the wearer dies. Increases initial inventory and holding capacity of throwables by +2.',
    gunslinger:
        'Increases sidearms reload speed by 40%. Sidearm draw/holster speed increased by 50%. Sidearm recoil reduced by 70%.',
    siege_ready:
        'Increases reload speed of primary weapons by 30%. Increases ammo capacity of all weapons by 20%. Does not affect weapon backpacks.',
    reinforced_epaulettes:
        'Increases reload speed of primary weapons by 30%. Gives wearer a 50% chance to avoid grievous limb injury. Increases melee damage by 50%.',
    adreno_defibrillator:
        "Provides one-time, short-lived resuscitation upon death, given that the Helldiver's body is still intact. Increases stim effect duration by 2.0s. Provides 50% resistance to arc damage.",
    feet_first:
        'Wearer makes 50% less noise when moving. Increases point-of-interest identification range by 30%. Provides immunity to leg injuries.',
    reduced_signature:
        'Wearer makes 50% less noise when moving. Reduces range at which enemies can detect the wearer by 40%.',
    supplementary_adrenaline:
        'When the wearer takes damage, they regain some stamina. Provides a higher armor rating.',
}
