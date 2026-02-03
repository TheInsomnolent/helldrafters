# Helldrafters

**A roguelike draft director for Helldivers 2**

🎮 **[Play Now](https://theinsomnolent.github.io/helldrafters/)**

---

## What is Helldrafters?

Helldrafters is a companion app that transforms Helldivers 2 into a roguelike experience. Instead of choosing your loadout freely, you draft equipment cards between missions, building your arsenal as you progress through escalating difficulties.

Perfect for solo players or squads looking for a fresh challenge, Helldrafters adds strategic depth and replayability by forcing you to adapt to what the draft offers rather than relying on your usual meta loadouts.

## How It Works

### The Core Loop

1. **Start at Difficulty 1** - Begin with just a Peacemaker pistol and basic stratagems
2. **Complete a Mission** - Play a Helldivers 2 mission at your current difficulty
3. **Draft Equipment** - Each player drafts one item from a random selection of weapons, armor, and stratagems
4. **Advance or Perish** - Success raises the difficulty; failure triggers sacrifices
5. **Reach Difficulty 10** - Complete all 10 difficulties to achieve victory!

### Key Features

- **Smart Drafting System**: Cards are weighted based on your current needs (need anti-tank? More likely to see AT weapons)
- **Theater Selection**: Choose your faction (Terminids, Automatons, Illuminate) with subfaction variants that modify difficulty and rewards
- **Solo or Co-op**: Supports 1-4 players with customizable game modes
- **Events System**: Optional high-risk, high-reward events between missions
- **Loadout Sacrifice**: Failed missions force you to sacrifice equipment, raising the stakes
- **Custom Start Mode**: Configure starting difficulty and loadouts for challenge runs
- **Multiple Game Modes**:
  - **Global Uniqueness**: Players can't draft the same cards
  - **Burn Cards**: Once seen, a card never appears again
  - **Brutality Mode**: Harsher penalties for non-extracted players
  - **Endless Mode**: Keep playing past D10

### Warbond Selection

At the start of each run, players select which warbonds they own. The draft pool only includes equipment from those warbonds plus Superstore items (optional). This ensures you only see items you can actually equip in Helldivers 2.

### The Draft

Each mission, players take turns drafting from a hand of cards. The hand size increases with difficulty:
- **D1-D2**: 2 cards
- **D3-D4**: 3 cards
- **D5-D6**: 4 cards
- **D7-D8**: 5 cards
- **D9-D10**: 6 cards

Cards show:
- Item name and type
- Rarity (Common, Uncommon, Rare, Legendary)
- Tags (AT, Fire, Explosive, etc.)

You can spend Requisition to reroll your hand, or lock specific slots to prevent certain item types from appearing.

## Contributing

Helldrafters is an open-source project and welcomes community contributions! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

**How to contribute:**
- Read our [Contributing Guide](CONTRIBUTING.md) for development setup and workflow
- Check out [open issues](https://github.com/TheInsomnolent/helldrafters/issues) or create a new one
- Join the [community discussions](https://github.com/TheInsomnolent/helldrafters/discussions) to share ideas and ask questions
- All contributions should target the `develop` branch

**Please note:** We follow the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Be respectful and welcoming to all contributors.

## Feedback & Bug Reports

Found a bug? Have a suggestion? Please [open an issue on GitHub](https://github.com/TheInsomnolent/helldrafters/issues/new/choose).

When reporting bugs, please use the bug report template and include:
- What you were doing when the bug occurred
- Your game configuration (player count, game modes enabled, etc.)
- Browser and device information
- Screenshots if applicable

## Development

### Running Locally

```bash
yarn
yarn start
```

The App will open at [http://localhost:3000](http://localhost:3000).

### Building

```bash
yarn build
```

### Testing & Code Quality

```bash
yarn test       # Run tests
yarn typecheck  # Check TypeScript types
yarn lint       # Check for linting errors
yarn knip       # Check for unused code
```

## Support the Project

If you enjoy Helldrafters, consider supporting development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/theinsomnolent)

---

**For Liberty! For Democracy! For Managed Mayhem!**

