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
  LOSE_REQUISITION: 'lose_requisition',
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
  REDRAFT: 'redraft',
  TRANSFORM_LOADOUT: 'transform_loadout',
  GAIN_SECONDARY: 'gain_secondary',
  GAIN_THROWABLE: 'gain_throwable',
  RANDOM_OUTCOME: 'random_outcome',
  GAIN_RANDOM_LIGHT_ARMOR_AND_DRAFT_THROWABLE: 'gain_random_light_armor_and_draft_throwable',
  GAIN_RANDOM_HEAVY_ARMOR_AND_DRAFT_SECONDARY: 'gain_random_heavy_armor_and_draft_secondary',
  DUPLICATE_LOADOUT_TO_ALL: 'duplicate_loadout_to_all',
  SET_CEREMONIAL_LOADOUT: 'set_ceremonial_loadout'
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
          { type: OUTCOME_TYPES.LOSE_REQUISITION, value: 2 }
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
    targetPlayer: 'single',
    choices: [
      {
        text: 'Request Tactical Booster',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
        ]
      },
      {
        text: 'Request Medical Reinforcement',
        outcomes: [
          { type: OUTCOME_TYPES.ADD_REQUISITION, value: 2 }
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
          { type: OUTCOME_TYPES.ADD_REQUISITION, value: 2 }
        ]
      },
      {
        text: 'Reinvest Assets',
        outcomes: [
          { type: OUTCOME_TYPES.REDRAFT, value: 1, targetPlayer: 'choose' }
        ]
      }
    ]
  },

  // 9. Quantum Anomaly
  {
    id: 'quantum_anomaly',
    name: 'Quantum Equipment Anomaly',
    description: 'Your destroyer\'s cargo bay has been exposed to a quantum fluctuation field during FTL travel. Science Officer reports: "Your equipment is undergoing spontaneous molecular reconfiguration. We can attempt to stabilize one item, or let the entire loadout phase-shift. The results are... unpredictable, but statistically favorable."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 2,
    maxDifficulty: 10,
    weight: 10,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Stabilize Single Item',
        outcomes: [
          { type: OUTCOME_TYPES.TRANSFORM_LOADOUT, value: 1, targetPlayer: 'choose' }
        ]
      },
      {
        text: 'Full Loadout Phase-Shift',
        outcomes: [
          { type: OUTCOME_TYPES.TRANSFORM_LOADOUT, value: -1, targetPlayer: 'choose' }
        ]
      }
    ]
  },

  // 10. Propaganda Ministry
  {
    id: 'propaganda_ministry',
    name: 'Ministry of Truth Rewards',
    description: 'Your heroic deeds have been featured in a Ministry of Truth propaganda broadcast. A Democracy Officer congratulates you: "Your sacrifice will inspire millions! We can offer you either requisition credits for your footage rights, or a commemorative morale booster to honor your service."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 1,
    maxDifficulty: 3,
    weight: 12,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Accept Requisition Payment',
        outcomes: [
          { type: OUTCOME_TYPES.ADD_REQUISITION, value: 1 }
        ]
      },
      {
        text: 'Request Commemorative Booster',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
        ]
      }
    ]
  },

  // 11. Supply Disruption
  {
    id: 'supply_disruption',
    name: 'Supply Chain Malfunction',
    description: 'A clerical error has flagged one of your items for immediate return to Super Earth logistics. The quartermaster offers: "I can expedite the paperwork... for a fee. Or you can surrender the equipment and I\'ll throw in some requisition credits as compensation."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 3,
    maxDifficulty: 10,
    weight: 8,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Pay the Fee',
        requiresRequisition: 2,
        outcomes: []
      },
      {
        text: 'Surrender Equipment',
        outcomes: [
          { type: OUTCOME_TYPES.REMOVE_ITEM, targetPlayer: 'choose' },
          { type: OUTCOME_TYPES.ADD_REQUISITION, value: 2 }
        ]
      }
    ]
  },

  // 12. Experimental Weapons Program
  {
    id: 'experimental_weapons',
    name: 'Black Site Research Initiative',
    description: 'A scientist from a classified research facility approaches you: "We\'re testing experimental equipment modifications. Volunteer your loadout for testing and you\'ll receive cutting-edge gear. Results may vary. Side effects include... well, that\'s classified. Participation is \'voluntary\'."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 4,
    maxDifficulty: 10,
    weight: 7,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Volunteer for Testing',
        outcomes: [
          { type: OUTCOME_TYPES.TRANSFORM_LOADOUT, value: 3, targetPlayer: 'choose' }
        ]
      },
      {
        text: 'Politely Decline',
        outcomes: []
      }
    ]
  },

  // 13. Citizenship Renewal
  {
    id: 'citizenship_renewal',
    name: 'Citizenship Examination',
    description: 'It\'s time for your mandatory citizenship renewal exam. The proctor states: "Failure to meet combat effectiveness standards will result in demotion. However, citizens who exceed expectations may advance rapidly through the ranks. Choose your path, Helldiver."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 2,
    maxDifficulty: 9,
    weight: 9,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Request Easier Assessment',
        outcomes: [
          { type: OUTCOME_TYPES.REPLAY_DIFFICULTY, value: 1 }
        ]
      },
      {
        text: 'Attempt Advanced Qualification',
        requiresRequisition: 1,
        outcomes: [
          { type: OUTCOME_TYPES.SKIP_DIFFICULTY, value: 1 }
        ]
      }
    ]
  },

  // 15. Morale Officer Inspection
  {
    id: 'morale_inspection',
    name: 'Mandatory Morale Assessment',
    description: 'A Morale Officer has detected "suboptimal enthusiasm levels" in your squad. They offer a solution: "We can issue a tactical morale booster, or you can demonstrate your commitment through voluntary resource donation and extra training."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 1,
    maxDifficulty: 7,
    weight: 11,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Accept Morale Booster',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
        ]
      },
      {
        text: 'Volunteer for Extra Training',
        outcomes: [
          { type: OUTCOME_TYPES.SPEND_REQUISITION, value: 2 },
          { type: OUTCOME_TYPES.EXTRA_DRAFT, value: 1 }
        ]
      }
    ]
  },

  // 17. Veterans Memorial
  {
    id: 'veterans_memorial',
    name: 'Fallen Heroes Memorial',
    description: 'You\'re selected to honor fallen Helldivers at a memorial service. The ceremony organizer asks: "Will you volunteer to carry the standard in remembrance? It\'s dangerous duty, but those who survive receive special recognition and equipment privileges."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 5,
    maxDifficulty: 10,
    weight: 7,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Carry the Standard',
        outcomes: [
          { type: OUTCOME_TYPES.LOSE_REQUISITION, value: 2 },
          { type: OUTCOME_TYPES.EXTRA_DRAFT, value: 2, targetPlayer: 'choose' }
        ]
      },
      {
        text: 'March in the Parade',
        outcomes: [
          { type: OUTCOME_TYPES.LOSE_REQUISITION, value: 1 },
          { type: OUTCOME_TYPES.EXTRA_DRAFT, value: 1, targetPlayer: 'choose' }
        ]
      },
      {
        text: 'Respectfully Decline',
        outcomes: []
      }
    ]
  },


  // 21. Loyalty Test
  {
    id: 'loyalty_test',
    name: 'Patriotism Verification',
    description: 'A Democracy Officer confronts you: "We\'ve intercepted communications questioning Super Earth\'s flawless leadership. Prove your loyalty by donating equipment to the war effort, or volunteer for hazardous duty to clear your name. Choose wisely, citizen."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 2,
    maxDifficulty: 10,
    weight: 9,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Donate Equipment',
        outcomes: [
          { type: OUTCOME_TYPES.REMOVE_ITEM, targetPlayer: 'choose' }
        ]
      },
      {
        text: 'Volunteer for Hazardous Duty',
        outcomes: [
          { type: OUTCOME_TYPES.RESTRICT_TO_SINGLE_WEAPON, targetPlayer: 'choose' },
          { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
        ]
      }
    ]
  },

  // 23. Training Accident
  {
    id: 'training_accident',
    name: 'Training Exercise Gone Wrong',
    description: 'A live-fire training exercise has gone catastrophically wrong. The instructor barks: "This is what happens when you don\'t follow protocol! Medical treatment is available, or you can tough it out and prove you\'re Helldiver material!"',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 1,
    maxDifficulty: 6,
    weight: 10,
    targetPlayer: 'all',
    choices: [
      {
        text: 'Seek Medical Treatment',
        requiresRequisition: 2,
        outcomes: []
      },
      {
        text: 'Tough It Out',
        outcomes: [
          { type: OUTCOME_TYPES.LOSE_REQUISITION, value: 1 }
        ]
      }
    ]
  },


  // 25. Commendation Ceremony
  {
    id: 'commendation_ceremony',
    name: 'Medal of Valor Award',
    description: 'You\'re being recognized for exceptional service! The commanding officer presents options: "You may select a single tactical booster for yourself, or we can distribute two random boosters among your squad. Both serve democracy equally!"',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 4,
    maxDifficulty: 10,
    weight: 9,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Single Tactical Booster',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
        ]
      },
      {
        text: 'Two Random Squad Boosters',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'random' },
          { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'random' }
        ]
      }
    ]
  },

  // 30. Supply Credits
  {
    id: 'supply_credits',
    name: 'Surplus Requisition Allocation',
    description: 'The Ministry of Finance has allocated surplus resources to your unit. A bureaucrat offers: "You can claim standard requisition credits, or we can arrange a tactical booster from the armory. Both options serve the greater good equally."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 1,
    maxDifficulty: 10,
    weight: 12,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Claim Requisition Credits',
        outcomes: [
          { type: OUTCOME_TYPES.ADD_REQUISITION, value: 1 }
        ]
      },
      {
        text: 'Request Tactical Booster',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
        ]
      }
    ]
  },

  // 31. Armory Surplus
  {
    id: 'armory_surplus',
    name: 'Quartermaster\'s Surplus Distribution',
    description: 'The quartermaster has excess inventory after a supply run. "I\'ve got equipment to distribute, Helldiver. Everyone gets something - could be a sidearm, could be a throwable. Democracy is random but fair!"',
    type: EVENT_TYPES.BENEFICIAL,
    minDifficulty: 1,
    maxDifficulty: 3,
    weight: 10,
    targetPlayer: 'all',
    outcomes: [
      {
        type: OUTCOME_TYPES.RANDOM_OUTCOME,
        possibleOutcomes: [
          { type: OUTCOME_TYPES.GAIN_SECONDARY },
          { type: OUTCOME_TYPES.GAIN_THROWABLE }
        ]
      }
    ]
  },

  // 32. Probability Field
  {
    id: 'probability_field',
    name: 'Quantum Probability Cascade',
    description: 'A quantum anomaly has created a probability field affecting your loadout. Science Officer warns: "50/50 chance - either lose a random item to the void OR gain a tactical booster from spontaneous materialization. We can collapse the field entirely for zero effect instead."',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 4,
    maxDifficulty: 10,
    weight: 7,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Enter Probability Field',
        outcomes: [
          {
            type: OUTCOME_TYPES.RANDOM_OUTCOME,
            possibleOutcomes: [
              { type: OUTCOME_TYPES.REMOVE_ITEM, targetPlayer: 'choose' },
              { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
            ]
          }
        ]
      },
      {
        text: 'Collapse Field Safely',
        outcomes: []
      }
    ]
  },

  // 33. Light Armor Distribution
  {
    id: 'light_armor_distribution',
    name: 'Mobility Training Initiative',
    description: 'Command is implementing a new mobility doctrine. All Helldivers will be issued randomized light armor for maximum speed. Additionally, you may select preferred throwables from the armory for tactical flexibility. This is mandatory. Well, you can refuse, but then nobody gets anything.',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 3,
    maxDifficulty: 10,
    weight: 8,
    targetPlayer: 'all',
    choices: [
      {
        text: 'Accept New Doctrine',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_RANDOM_LIGHT_ARMOR_AND_DRAFT_THROWABLE }
        ]
      },
      {
        text: 'Refuse for Everyone',
        outcomes: []
      }
    ]
  },

  // 34. Heavy Armor Distribution
  {
    id: 'heavy_armor_distribution',
    name: 'Fortification Protocol',
    description: 'Intelligence reports increased enemy firepower. All Helldivers are being re-equipped with randomized heavy armor for maximum protection. You may also select preferred sidearms from the armory. This is mandatory. Or you can all go without, your choice.',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 4,
    maxDifficulty: 10,
    weight: 8,
    targetPlayer: 'all',
    choices: [
      {
        text: 'Accept Fortification',
        outcomes: [
          { type: OUTCOME_TYPES.GAIN_RANDOM_HEAVY_ARMOR_AND_DRAFT_SECONDARY }
        ]
      },
      {
        text: 'Refuse for Everyone',
        outcomes: []
      }
    ]
  },

  // 35. Tactical Synchronization
  {
    id: 'tactical_synchronization',
    name: 'Perfect Synchronization Protocol',
    description: 'High Command has developed experimental loadout synchronization technology. You may select one Helldiver as a template and duplicate their entire loadout (excluding boosters) to all squad members. The technology bypasses normal equipment uniqueness restrictions. Or you can reject this experimental procedure.',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 7,
    maxDifficulty: 10,
    weight: 5,
    targetPlayer: 'single',
    choices: [
      {
        text: 'Synchronize Squad Loadouts',
        outcomes: [
          { type: OUTCOME_TYPES.DUPLICATE_LOADOUT_TO_ALL, targetPlayer: 'choose' }
        ]
      },
      {
        text: 'Reject Synchronization',
        outcomes: []
      }
    ]
  },

  // 36. Ceremonial Parade
  {
    id: 'ceremonial_parade',
    name: 'Ceremonial Parade',
    description: 'High Command has selected your squad for a prestigious ceremonial parade. All participants will be issued formal parade equipment and given command privileges. This is a great honor... and refusal would be an act of treason against Super Earth.',
    type: EVENT_TYPES.CHOICE,
    minDifficulty: 1,
    maxDifficulty: 10,
    weight: 1,
    targetPlayer: 'all',
    choices: [
      {
        text: 'Join the black parade',
        outcomes: [
          { type: OUTCOME_TYPES.SET_CEREMONIAL_LOADOUT },
          { type: OUTCOME_TYPES.ADD_REQUISITION, value: 6 }
        ]
      },
      {
        text: 'Refusal is treason',
        outcomes: [
          { type: OUTCOME_TYPES.LOSE_REQUISITION, value: 1 }
        ]
      }
    ]
  },
];

// Helper function to get available events for current difficulty
export function getAvailableEvents(difficulty, isMultiplayer, seenEvents = [], players = []) {
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
    
    // Check if event requires stratagems (teamwork_training) - need at least one player with a stratagem
    if (event.id === 'teamwork_training') {
      const anyPlayerHasStratagem = players.some(player => 
        player.loadout?.stratagems?.some(s => s !== null)
      );
      if (!anyPlayerHasStratagem) {
        return false;
      }
    }
    
    return true;
  });
}

// Helper function to select a random event weighted by difficulty
export function selectRandomEvent(difficulty, isMultiplayer, seenEvents = [], players = []) {
  const available = getAvailableEvents(difficulty, isMultiplayer, seenEvents, players);
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
