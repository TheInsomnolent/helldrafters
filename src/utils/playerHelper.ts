import { DEFAULT_WARBONDS } from 'src/constants/warbonds'
import type { Loadout, Player } from 'src/types'

// Helper to create a Player with all required fields and sensible defaults
export const createPlayer = (
    overrides: Partial<Player> & { id: string; name: string; loadout: Loadout },
): Player => ({
    inventory: [],
    lockedSlots: [],
    disabledWarbonds: [],
    superstoreItems: [],
    warbonds: [...DEFAULT_WARBONDS],
    includeSuperstore: false,
    extracted: true,
    ...overrides,
})
