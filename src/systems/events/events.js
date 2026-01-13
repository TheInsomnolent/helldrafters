// src/events.js
// Events system for Helldivers Roguelite
// Inspired by Slay the Spire's event philosophy

export const EVENT_TYPES = {
  CHOICE: 'choice',      // Player makes a choice
  RANDOM: 'random',      // Random good/bad outcome
  BENEFICIAL: 'beneficial', // Always positive
  DETRIMENTAL: 'detrimental' // Always negative
};

export const OUTCOME_TYPES = {
  ADD_REQUISITION: 'add_requisition',
  SPEND_REQUISITION: 'spend_requisition',
  GAIN_LIFE: 'gain_life',
  LOSE_LIFE: 'lose_life',
  LOSE_ALL_BUT_ONE_LIFE: 'lose_all_but_one_life',
  CHANGE_FACTION: 'change_faction',
  EXTRA_DRAFT: 'extra_draft',
  SKIP_DIFFICULTY: 'skip_difficulty',
  REPLAY_DIFFICULTY: 'replay_difficulty',
  SACRIFICE_ITEM: 'sacrifice_item',
  GAIN_BOOSTER: 'gain_booster',
  REMOVE_ITEM: 'remove_item',
  GAIN_SPECIFIC_ITEM: 'gain_specific_item',
  DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER: 'duplicate_stratagem_to_another_helldiver',
  REDRAFT: 'redraft'
};

// Event structure:
// {
//   id: unique identifier
//   name: display name
//   description: flavor text
//   type: EVENT_TYPES value
//   minDifficulty: minimum difficulty to appear (1-10)
//   maxDifficulty: maximum difficulty to appear (1-10)
//   weight: how likely to appear
//   requiresMultiplayer: only appears in multiplayer (optional)
//   targetPlayer: 'single' | 'all' - affects one or all players
//   choices: array of choice objects (for CHOICE type)
//   outcomes: array of outcome objects (for RANDOM/BENEFICIAL/DETRIMENTAL)
// }

// Choice structure:
// {
//   text: button text
//   requiresRequisition: amount needed (optional)
//   outcomes: array of outcome objects
// }

// Outcome structure:
// {
//   type: OUTCOME_TYPES value
//   value: relevant value (requisition amount, item id, etc.)
//   targetPlayer: 'current' | 'all' | 'choose' (optional, defaults to current)
// }

export const EVENTS = [
  // === EXAMPLE EVENT ===
  {
    id: 'supply_cache',
    name: 'Supply Cache',
    description: 'Your squad stumbles upon an abandoned Super Earth supply cache. The contents could be valuable.',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 1,
    maxDifficulty: 10,
    weight: 10,
    targetPlayer: 'all',
    choices: [
      {
        text: 'Open carefully',
        outcomes: [
          { type: OUTCOME_TYPES.ADD_REQUISITION, value: 2 }
        ]
      },
      {
        text: 'Force it open (Risky)',
        outcomes: [
          { type: OUTCOME_TYPES.ADD_REQUISITION, value: 4 },
          { type: OUTCOME_TYPES.LOSE_LIFE, value: 1 }
        ]
      },
      {
        text: 'Leave it',
        outcomes: []
      }
    ]
  }
];

// Helper function to get available events for current difficulty
export function getAvailableEvents(difficulty, isMultiplayer) {
  return EVENTS.filter(event => {
    if (event.minDifficulty > difficulty || event.maxDifficulty < difficulty) {
      return false;
    }
    if (event.requiresMultiplayer && !isMultiplayer) {
      return false;
    }
    return true;
  });
}

// Helper function to select a random event weighted by difficulty
export function selectRandomEvent(difficulty, isMultiplayer) {
  const available = getAvailableEvents(difficulty, isMultiplayer);
  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, event) => sum + event.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const event of available) {
    random -= event.weight;
    if (random <= 0) {
      return event;
    }
  }
  
  return available[available.length - 1];
}
