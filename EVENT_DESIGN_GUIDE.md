# Helldrafters Event Design Guide

## Overview

This guide explains how to create events for the Helldrafters roguelite mode. Events are high-risk, high-reward narrative moments that occur between missions, inspired by **Slay the Spire's** event philosophy.

## Event Philosophy

Events should:
- **Create meaningful choices** with clear tradeoffs
- **Scale with difficulty** - higher difficulties have more unfavorable outcomes
- **Offer deck-shaping opportunities** - help players acquire specific gear (like boosters)
- **Balance immediate vs long-term gains** - requisition now vs better positioning later
- **Tell a story** - flavor text matters for immersion
- **Be composable** - mix and match outcome types creatively

## File Location

All events are defined in: **`src/events.js`**

## Event Types

### 1. CHOICE Events
Player must choose between multiple options. Most common type.

**Example:**
```javascript
{
  id: 'supply_cache',
  type: EVENT_TYPES.CHOICE,
  choices: [
    { text: 'Safe option', outcomes: [...] },
    { text: 'Risky option', outcomes: [...] }
  ]
}
```

### 2. RANDOM Events
Random outcome from weighted possibilities (e.g., 60% good, 40% bad).

**Example:**
```javascript
{
  id: 'distress_beacon',
  type: EVENT_TYPES.RANDOM,
  outcomes: [
    { type: OUTCOME_TYPES.ADD_REQUISITION, value: 3, weight: 60 },
    { type: OUTCOME_TYPES.LOSE_LIFE, value: 1, weight: 40 }
  ]
}
```

### 3. BENEFICIAL Events
Always positive. Should be rare and weighted toward higher difficulties.

### 4. DETRIMENTAL Events
Always negative. Should be very rare and only at high difficulties.

---

## Event Structure

### Required Fields

```javascript
{
  id: 'unique_event_id',           // Unique identifier (lowercase_snake_case)
  name: 'Event Display Name',      // Shown to player
  description: 'Flavor text...',   // Narrative description
  type: EVENT_TYPES.CHOICE,        // CHOICE | RANDOM | BENEFICIAL | DETRIMENTAL
  minDifficulty: 1,                // Earliest difficulty (1-10)
  maxDifficulty: 10,               // Latest difficulty (1-10)
  weight: 10,                      // Spawn probability (higher = more common)
  targetPlayer: 'all'              // 'all' or 'single'
}
```

### Optional Fields

```javascript
{
  requiresMultiplayer: true,  // Only appears if playerCount > 1
}
```

---

## Outcome Types

### Currency Outcomes

#### ADD_REQUISITION
Grants requisition (draft reroll currency).

```javascript
{ type: OUTCOME_TYPES.ADD_REQUISITION, value: 3 }
```

**Design Notes:**
- Common reward: 1-2 requisition
- Medium reward: 3-4 requisition
- High reward: 5+ requisition
- Requisition is precious - use sparingly

#### SPEND_REQUISITION
Costs requisition to unlock this choice.

```javascript
{
  text: 'Buy Equipment (3 Requisition)',
  requiresRequisition: 3,
  outcomes: [
    { type: OUTCOME_TYPES.SPEND_REQUISITION, value: 3 },
    { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
  ]
}
```

**Design Notes:**
- Create requisition sinks so players must choose
- 1-2 requisition = minor purchase
- 3-4 requisition = significant investment
- 5+ requisition = major decision

---

### Life Outcomes

#### GAIN_LIFE
Restores lives (rare and valuable).

```javascript
{ type: OUTCOME_TYPES.GAIN_LIFE, value: 1 }
```

**Design Notes:**
- Should be **very rare**
- Usually costs something (requisition, item sacrifice)
- Maximum value should be 1-2

#### LOSE_LIFE
Removes lives (dangerous).

```javascript
{ type: OUTCOME_TYPES.LOSE_LIFE, value: 1 }
```

**Design Notes:**
- High-risk, high-reward tradeoff
- Should pair with significant reward
- Use for "gambling" events

---

### Faction & Difficulty Outcomes

#### CHANGE_FACTION
Switches enemy faction.

```javascript
{ 
  type: OUTCOME_TYPES.CHANGE_FACTION, 
  value: 'Terminids' // or 'Automatons' or 'Illuminate'
}
```

**Design Notes:**
- Strategic tool for adapting loadout synergies
- Should appear mid-run when player has committed to a build
- Can be beneficial or detrimental depending on player's gear

#### SKIP_DIFFICULTY
Skips forward (no rewards).

```javascript
{ type: OUTCOME_TYPES.SKIP_DIFFICULTY, value: 1 }
```

**Design Notes:**
- Trade rewards for safety
- Useful when player is struggling
- Typically no other benefits

#### REPLAY_DIFFICULTY
Repeats current difficulty for extra reward.

```javascript
{ type: OUTCOME_TYPES.REPLAY_DIFFICULTY, value: 1 }
```

**Design Notes:**
- Extends run for more drafts
- Good for greedy players
- Risk: might die before next safe point

---

### Item Outcomes

#### GAIN_BOOSTER
**Primary way to obtain boosters** (removed from normal draft).

```javascript
{ 
  type: OUTCOME_TYPES.GAIN_BOOSTER, 
  targetPlayer: 'choose'  // or 'all' for everyone
}
```

**Design Notes:**
- **Boosters are now event-exclusive**
- Should cost 3-4 requisition OR have a significant downside
- `targetPlayer: 'choose'` means player selects which Helldiver gets it
- `targetPlayer: 'all'` gives to everyone (very powerful)

#### SACRIFICE_ITEM
Removes a stratagem (deck-thinning).

```javascript
{
  type: OUTCOME_TYPES.SACRIFICE_ITEM,
  value: 'stratagem',
  targetPlayer: 'choose'
}
```

**Design Notes:**
- Currently only supports stratagems
- Useful for "removal" events (like Slay the Spire)
- Should provide significant benefit
- Can be forced (negative event) or optional (player choice)

#### EXTRA_DRAFT
Grants additional draft card(s).

```javascript
{ type: OUTCOME_TYPES.EXTRA_DRAFT, value: 1 }
```

**Design Notes:**
- Powerful reward
- Usually appears at higher difficulties
- Can target specific player in multiplayer

---

## Player Targeting

### `targetPlayer: 'all'`
Affects all Helldivers equally.

```javascript
{
  targetPlayer: 'all',
  outcomes: [
    { type: OUTCOME_TYPES.ADD_REQUISITION, value: 2 }  // Everyone gets +2
  ]
}
```

### `targetPlayer: 'single'`
Only affects one Helldiver.

```javascript
{
  targetPlayer: 'single',
  outcomes: [
    { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }  // Player picks who
  ]
}
```

**Player Selection:**
- When `targetPlayer: 'choose'` is in any outcome, the event shows player selection UI first
- Player clicks a Helldiver button, then sees the event choices

---

## Difficulty Scaling

### Weight by Difficulty

**Early Game (1-3):**
- weight: 8-10 (common)
- Safer choices
- Lower rewards
- Introduce mechanics

**Mid Game (4-7):**
- weight: 5-7 (medium)
- Balanced risk/reward
- More impactful outcomes
- Faction switching becomes relevant

**Late Game (7-10):**
- weight: 3-5 (rare but powerful)
- High stakes choices
- Forced negative outcomes
- Unavoidable consequences

### Example: Scaling Event

```javascript
// Early version (Difficulty 1-3)
{
  id: 'minor_cache',
  minDifficulty: 1,
  maxDifficulty: 3,
  weight: 10,
  choices: [
    { text: 'Open', outcomes: [{ type: OUTCOME_TYPES.ADD_REQUISITION, value: 1 }] },
    { text: 'Leave', outcomes: [] }
  ]
}

// Late version (Difficulty 7-10)
{
  id: 'cursed_cache',
  minDifficulty: 7,
  maxDifficulty: 10,
  weight: 5,
  choices: [
    { text: 'Take it', outcomes: [
      { type: OUTCOME_TYPES.ADD_REQUISITION, value: 5 },
      { type: OUTCOME_TYPES.LOSE_LIFE, value: 1 }
    ]},
    { text: 'Resist', outcomes: [] }  // No safe option!
  ]
}
```

---

## Complete Event Examples

### Example 1: Simple Choice Event

```javascript
{
  id: 'mysterious_merchant',
  name: 'Mysterious Merchant',
  description: 'A cloaked figure offers you experimental equipment... for a price.',
  type: EVENT_TYPES.CHOICE,
  minDifficulty: 1,
  maxDifficulty: 10,
  weight: 8,
  targetPlayer: 'single',
  choices: [
    {
      text: 'Buy Booster (3 Requisition)',
      requiresRequisition: 3,
      outcomes: [
        { type: OUTCOME_TYPES.SPEND_REQUISITION, value: 3 },
        { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
      ]
    },
    {
      text: 'Trade a stratagem for requisition',
      outcomes: [
        { type: OUTCOME_TYPES.SACRIFICE_ITEM, value: 'stratagem', targetPlayer: 'choose' },
        { type: OUTCOME_TYPES.ADD_REQUISITION, value: 3 }
      ]
    },
    {
      text: 'Walk away',
      outcomes: []
    }
  ]
}
```

### Example 2: Random Outcome Event

```javascript
{
  id: 'unstable_artifact',
  name: 'Unstable Artifact',
  description: 'You discover a strange glowing object. It pulses with energy.',
  type: EVENT_TYPES.RANDOM,
  minDifficulty: 4,
  maxDifficulty: 10,
  weight: 6,
  targetPlayer: 'all',
  outcomes: [
    { 
      type: OUTCOME_TYPES.GAIN_BOOSTER, 
      targetPlayer: 'all',
      weight: 30  // 30% chance everyone gets booster
    },
    { 
      type: OUTCOME_TYPES.LOSE_LIFE, 
      value: 1,
      weight: 70  // 70% chance lose a life
    }
  ]
}
```

### Example 3: Multiplayer-Specific Event

```javascript
{
  id: 'squad_support',
  name: 'Squad Support Package',
  description: 'A support package has arrived, but there\'s only enough for one Helldiver.',
  type: EVENT_TYPES.CHOICE,
  minDifficulty: 1,
  maxDifficulty: 10,
  weight: 5,
  requiresMultiplayer: true,  // Only appears in multiplayer
  targetPlayer: 'single',
  choices: [
    {
      text: 'Choose a Helldiver to receive booster',
      outcomes: [
        { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
      ]
    },
    {
      text: 'Decline the package',
      outcomes: []
    }
  ]
}
```

### Example 4: High-Difficulty Beneficial Event

```javascript
{
  id: 'reinforcements',
  name: 'Emergency Reinforcements',
  description: 'Super Earth is sending additional resources. They expect results.',
  type: EVENT_TYPES.BENEFICIAL,
  minDifficulty: 7,
  maxDifficulty: 10,
  weight: 8,
  targetPlayer: 'all',
  outcomes: [
    { type: OUTCOME_TYPES.ADD_REQUISITION, value: 3 },
    { type: OUTCOME_TYPES.EXTRA_DRAFT, value: 1 }
  ]
}
```

---

## Design Patterns

### 1. The Gamble
High risk, high reward.

```javascript
{
  choices: [
    {
      text: 'Play it safe',
      outcomes: [{ type: OUTCOME_TYPES.ADD_REQUISITION, value: 1 }]
    },
    {
      text: 'Take the risk',
      outcomes: [
        { type: OUTCOME_TYPES.ADD_REQUISITION, value: 5 },
        { type: OUTCOME_TYPES.LOSE_LIFE, value: 1 }
      ]
    }
  ]
}
```

### 2. The Investment
Spend now for later benefit.

```javascript
{
  choices: [
    {
      text: 'Invest 4 Requisition',
      requiresRequisition: 4,
      outcomes: [
        { type: OUTCOME_TYPES.SPEND_REQUISITION, value: 4 },
        { type: OUTCOME_TYPES.EXTRA_DRAFT, value: 2 }
      ]
    },
    {
      text: 'Save your requisition',
      outcomes: []
    }
  ]
}
```

### 3. The Sacrifice
Trade something for something else.

```javascript
{
  choices: [
    {
      text: 'Sacrifice stratagem for booster',
      outcomes: [
        { type: OUTCOME_TYPES.SACRIFICE_ITEM, value: 'stratagem', targetPlayer: 'choose' },
        { type: OUTCOME_TYPES.GAIN_BOOSTER, targetPlayer: 'choose' }
      ]
    }
  ]
}
```

### 4. The Adaptation
Change strategy mid-run.

```javascript
{
  choices: [
    {
      text: 'Adapt to Terminids',
      outcomes: [
        { type: OUTCOME_TYPES.CHANGE_FACTION, value: 'Terminids' },
        { type: OUTCOME_TYPES.EXTRA_DRAFT, value: 1 }
      ]
    },
    {
      text: 'Adapt to Automatons',
      outcomes: [
        { type: OUTCOME_TYPES.CHANGE_FACTION, value: 'Automatons' },
        { type: OUTCOME_TYPES.EXTRA_DRAFT, value: 1 }
      ]
    }
  ]
}
```

### 5. The Unavoidable
No good options (late game only).

```javascript
{
  minDifficulty: 8,
  choices: [
    {
      text: 'Lose requisition',
      outcomes: [{ type: OUTCOME_TYPES.SPEND_REQUISITION, value: 3 }]
    },
    {
      text: 'Lose a life',
      outcomes: [{ type: OUTCOME_TYPES.LOSE_LIFE, value: 1 }]
    }
  ]
}
```

---

## Best Practices

### DO:
✅ Create clear tradeoffs  
✅ Match flavor text to mechanics  
✅ Scale rewards with difficulty  
✅ Use boosters as premium rewards  
✅ Make "leave it alone" always an option (for CHOICE events)  
✅ Test weight values (start high, adjust down)  
✅ Consider multiplayer dynamics  

### DON'T:
❌ Create events with only downsides early game  
❌ Make boosters too easy to get (they're special!)  
❌ Use the same reward values repeatedly (vary it)  
❌ Forget to set minDifficulty/maxDifficulty  
❌ Make all events CHOICE type (mix it up)  
❌ Ignore the narrative (flavor matters!)  

---

## Adding Your Event

1. Open `src/events.js`
2. Add your event object to the `EVENTS` array
3. Follow the structure above
4. Save the file
5. Test in-game (enable Events in menu)

**That's it!** The system handles everything else automatically.

---

## Testing Tips

- Enable "Events" in the main menu
- Events have a 40% chance after each mission success
- Check console for errors if event doesn't appear
- Verify minDifficulty/maxDifficulty range
- Test with different player counts for multiplayer events

---

## Questions?

If you need new outcome types or event features, talk to the engineering team. The system is extensible!

**Happy designing!** 🎮
