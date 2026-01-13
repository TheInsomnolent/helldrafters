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
  SWAP_STRATAGEM_WITH_PLAYER: 'swap_stratagem_with_player',
  RESTRICT_TO_SINGLE_WEAPON: 'restrict_to_single_weapon',
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
  // 1. Yearly Bonus
  {
    id: 'yearly_bonus',
    name: 'Annual Requisition Payment',
    description: 'Super Earth\'s fiscal year has ended, and your yearly bonus requisition payment has been processed. Most Helldivers don\'t survive long enough to see this day.',
    type: EVENT_TYPES.BENEFICIAL,
    minDifficulty: 1,
    maxDifficulty: 10,
    weight: 8,
    targetPlayer: 'all',
    outcomes: [
      { type: OUTCOME_TYPES.ADD_REQUISITION, value: 1 }
    ]
  },

  // 2. Enemy Counter Attack
  {
    id: 'enemy_counterattack',
    name: 'Enemy Counteroffensive',
    description: 'Intelligence reports a massive enemy counterattack in response to your recent victories. Command demands you hold your position at all costs, but retreat is also an option.',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 4,
    maxDifficulty: 10,
    weight: 10,
    targetPlayer: 'all',
    choices: [
      {
        text: 'Hold the Line',
        outcomes: [
          { type: OUTCOME_TYPES.LOSE_ALL_BUT_ONE_LIFE }
        ]
      },
      {
        text: 'Tactical Retreat',
        outcomes: [
          { type: OUTCOME_TYPES.CHANGE_FACTION }
        ]
      }
    ]
  },

  // 3. Teamwork Event
  {
    id: 'teamwork_training',
    name: 'Coordinated Tactics Training',
    description: 'Your squad has been selected for an experimental tactical coordination program. You can either learn to duplicate your stratagem deployment techniques with a squadmate, or practice equipment swapping protocols.',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 2,
    maxDifficulty: 10,
    weight: 12,
    requiresMultiplayer: true,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Duplicate Stratagem Training',
        requiresRequisition: 1,
        outcomes: [
          { type: OUTCOME_TYPES.DUPLICATE_STRATAGEM_TO_ANOTHER_HELLDIVER, targetPlayer: 'choose' }
        ]
      },
      {
        text: 'Equipment Swap Protocol',
        outcomes: [
          { type: OUTCOME_TYPES.SWAP_STRATAGEM_WITH_PLAYER, targetPlayer: 'choose' }
        ]
      }
    ]
  },

  // 4. National Holiday
  {
    id: 'national_holiday',
    name: 'Democracy Day Celebration',
    description: 'Today marks a national holiday celebrating the foundation of Managed Democracy! Special benefits are being distributed to active combat personnel.',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 4,
    maxDifficulty: 6,
    weight: 50,
    targetPlayer: 'all',
    choices: [
      {
        text: 'Request Tactical Booster',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'all' }
        ]
      },
      {
        text: 'Request Medical Reinforcement',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_LIFE, value: 1 }
        ]
      }
    ]
  },

  // 5. Cloaked Figure Deal
  {
    id: 'mysterious_deal',
    name: 'A Shadowy Proposition',
    description: 'A cloaked figure approaches you in the armory. They whisper: "Prove your skill with a single weapon in your next engagement, and I\'ll ensure you receive... priority access to equipment." Their voice sends chills down your spine.',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 3,
    maxDifficulty: 10,
    weight: 8,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Accept the Deal',
        outcomes: [
          { type: OUTCOME_TYPES.RESTRICT_TO_SINGLE_WEAPON, targetPlayer: 'choose' },
          { type: OUTCOME_TYPES.EXTRA_DRAFT, value: 2 }
        ]
      },
      {
        text: 'Decline Politely',
        outcomes: []
      }
    ]
  },

  // 6. Democracy Officer Promotion
  {
    id: 'promotion_offer',
    name: 'Career Advancement Opportunity',
    description: 'The Democracy Officer summons you to their office. "Your performance has been... noted. We can fast-track your progression, but it comes with elevated expectations. Alternatively, if you refuse this opportunity, we\'ll need to reassess your current equipment clearance."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 2,
    maxDifficulty: 9,
    weight: 10,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Accept Promotion',
        outcomes: [
          { type: OUTCOME_TYPES.SKIP_DIFFICULTY, value: 1 }
        ]
      },
      {
        text: 'Decline (Demotion)',
        outcomes: [
          { type: OUTCOME_TYPES.REMOVE_ITEM, value: 1, targetPlayer: 'choose' }
        ]
      }
    ]
  },

  // 7. Combat Footage Review
  {
    id: 'combat_review',
    name: 'Performance Review',
    description: 'The Democracy Officer shows you combat footage from your last mission. "Your tactical positioning and weapon handling are... suboptimal. I\'m offering you a chance to repeat this difficulty tier and demonstrate improvement. What do you say?"',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 2,
    maxDifficulty: 10,
    weight: 9,
    targetPlayer: 'all',
    choices: [
      {
        text: 'Accept Remedial Training',
        requiresRequisition: 1,
        outcomes: [
          { type: OUTCOME_TYPES.REPLAY_DIFFICULTY, value: 1 }
        ]
      },
      {
        text: 'Receive Corporal Punishment',
        outcomes: []
      }
    ]
  },

  // 8. End of Financial Year
  {
    id: 'fiscal_year_end',
    name: 'Budget Allocation Decision',
    description: 'Your commanding officer pulls you aside: "End of fiscal year means use it or lose it. We have leftover funding for either a new recruit to reinforce your squad, or we can liquidate your current assets and reinvest in fresh equipment. Your call, Helldiver."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 3,
    maxDifficulty: 10,
    weight: 8,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Recruit New Squad Member',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_LIFE, value: 1 }
        ]
      },
      {
        text: 'Reinvest Assets',
        outcomes: [
          { type: OUTCOME_TYPES.REDRAFT, value: 1, targetPlayer: 'choose' }
        ]
      }
    ]
  }
];

// Helper function to get available events for current difficulty
export function getAvailableEvents(difficulty, isMultiplayer, seenEvents = []) {
  return EVENTS.filter(event => {
    if (event.minDifficulty > difficulty || event.maxDifficulty < difficulty) {
      return false;
    }
    if (event.requiresMultiplayer && !isMultiplayer) {
      return false;
    }
    if (seenEvents.includes(event.id)) {
      return false;
    }
    return true;
  });
}

// Helper function to select a random event weighted by difficulty
export function selectRandomEvent(difficulty, isMultiplayer, seenEvents = []) {
  const available = getAvailableEvents(difficulty, isMultiplayer, seenEvents);
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
