# Card God Of War

A desktop card battle game built with Electron, Vue 3, TypeScript, and Pinia. Play attack, heal, and stat-boost cards in turn-based combat against ever-scaling monsters. Your hero grows stronger with every victory.

## Screenshot

> Add screenshots to the `assets/` directory and reference them here.

## Features

- **Turn-based card combat** — Play physical, magic, heal, and stat-boost cards against monsters with elemental affinities
- **Elemental system** — Fire beats Thunder, Thunder beats Water, Water beats Fire (1.5× advantage, 0.5× disadvantage)
- **Monster skills** — Shield, lifesteal, crit boost, elemental immunity, and stun with probabilistic triggers
- **Boss fights** — Every 5 levels, tougher bosses with multiple skills; enrage after turn 15 with escalating damage
- **Preview system** — See estimated damage, crit chances, and healing before playing each card
- **Persistent progression** — Hero permanently gains stats after each victory
- **Save/load** — 3 manual save slots + 1 auto-save, stored locally as JSON

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Electron 38 |
| Frontend | Vue 3.5 + TypeScript |
| State Management | Pinia 3 |
| Styling | SCSS |
| Build | Vite 6 + vite-plugin-electron |
| Packaging | electron-builder 26 |
| Testing | Vitest 3 |
| Type Checking | vue-tsc 2 |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/kaituoC/CardGodOfWar.git
cd CardGodOfWar
npm install
```

### Development

```bash
npm run dev          # Start Vite dev server + Electron hot reload
npm run test         # Run unit tests once
npm run test:watch   # Run tests in watch mode
```

### Production Build

```bash
npm run build          # Type check + production build
npm run pack           # Build unpacked app (for testing)
npm run dist           # Build installers for current platform
npm run dist:mac       # Build macOS DMG + ZIP
npm run dist:win       # Build Windows NSIS installer + ZIP
npm run dist:linux     # Build Linux AppImage + DEB
```

Output files are placed in `release/`.

**Supported platforms:**

| Platform | Output Format |
|----------|---------------|
| macOS | ZIP portable |
| Windows | NSIS installer + portable ZIP |
| Linux | AppImage + DEB package |

> macOS DMG requires macOS 13+ build machine. Current environment uses ZIP.

## Architecture

### Data Flow

```
MainMenuView  →  gameStore.startNewGame()  →  createBattle()  →  BattleState
BattleView    →  gameStore.playCardAction() →  playCard()      →  calculateDamage()
                  ↓
              battleState updates (Pinia reactive)
                  ↓
              Vue components re-render
```

### Damage Pipeline

`Attack × coefficient → subtract defense → element multiplier (0/0.5/1.0/1.5) → crit check (1.5× or 2.0×) → shield (0.5×) → enrage (monster only) → floor to MIN_DAMAGE=1`

### Monster Intent System

Each turn, the monster generates a `MonsterIntent` with predicted damage, crit, and skills. This intent drives:
- **Preview**: `estimateCardOutcome()` shows estimates on each card in the hand
- **Execution**: `playCard()` and `monsterCounterAttack()` execute the actual combat

### Key Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| Game Engine | `src/renderer/src/game/game-engine.ts` | Create battles, play cards, monster counter-attack, victory growth |
| Battle Calculator | `src/renderer/src/game/battle-calculator.ts` | Damage calculation with defense, element, crit, shield, enrage |
| Monster Intent | `src/renderer/src/game/monster-intent.ts` | Intent generation, card preview estimation |
| Game Store | `src/renderer/src/stores/game-store.ts` | Pinia store, save/load via Electron IPC |
| Card Pool | `src/renderer/src/game/card-pool.ts` | Weighted random card generation by type/star/coefficient |
| Monster Generator | `src/renderer/src/game/monster-generator.ts` | Monster scaling by level and skill assignment |

## Game Balance

- **Hero starts at**: 10 ATK / 10 MATK / 5 DEF / 100 HP / 0% crit
- **Per victory gain**: +3 ATK / +3 MATK / +2 DEF / +10 HP / +2% crit
- **Monster scaling**: +3 ATK / +3 MATK / +1 DEF / +1% crit per level, HP grows with 1.05 exponent
- **Max turns**: 20 per battle
- **Boss interval**: Every 5 levels
- **Boss enrage**: Starts at turn 15, +20% damage per turn

## License

This project is for educational and personal use.
