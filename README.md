# Card God Of War

A desktop card battle game built with Electron, Vue 3, TypeScript, and Pinia. Play attack, heal, stat-boost, defense, and tactical cards in turn-based combat against ever-scaling monsters. Choose rewards, collect relics, and shape your build as your hero grows stronger with every victory.

## Screenshot

> Add screenshots to the `assets/` directory and reference them here.

## Features

- **Turn-based card combat** — Play physical, magic, heal, stat-boost, defense (shield), and tactical (armor-break / suppress) cards against monsters with elemental affinities
- **Elemental system** — Fire beats Thunder, Thunder beats Water, Water beats Fire (1.5× advantage, 0.5× disadvantage)
- **Victory rewards** — After each win, choose one of three rewards: attribute boost, a relic, or a card-bias that shapes future hands
- **Relics** — 8 persistent passives (fire damage, thunder next-turn bonus, heal-overflow shield, advantage break-defense, low-HP damage, shield synergy, crit multiplier, battle-start recovery), resolved from a single source shared by combat and previews
- **Status effects** — Shield, break-defense, and weak with defined durations, alongside the existing stun
- **Monster skills** — Shield, lifesteal, crit boost, elemental immunity, and stun with probabilistic triggers
- **Monster archetypes** — Berserker, Stone Guard, Blood Bat, and Thunder Bug tendencies; the level-5 Boss is the shield-focused Stone General with periodic shield pressure
- **Boss fights** — Every 5 levels, tougher bosses with multiple skills; enrage after turn 15 with escalating damage
- **Preview system** — See estimated damage, crit chances, healing, shields, and status application before playing each card
- **Persistent progression** — Hero grows via chosen rewards and accumulated relics across runs
- **Save/load** — 3 manual save slots + 1 auto-save, stored locally as JSON; old saves are normalized for relics, rewards, statuses, card-bias, and archetypes

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

`Attack × coefficient → subtract defense (reduced by break-defense) → element multiplier (0/0.5/1.0/1.5, + relic element bonus) → crit check (1.5×/2.0×, + relic crit bonus) → shield (0.5×) → weak (monster only) → low-HP relic bonus (hero only) → enrage (monster only) → floor to MIN_DAMAGE=1`

Relic effects (element/crit/low-HP bonuses) are resolved by `relic-effects.ts`, the single source shared by `calculateDamage` (execution) and `previewDamage` (preview) so the two never drift.

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
| Card Pool | `src/renderer/src/game/card-pool.ts` | Weighted random card generation by type/star/coefficient, with card-bias support |
| Monster Generator | `src/renderer/src/game/monster-generator.ts` | Monster scaling by level, archetype, and skill assignment |
| Reward Generator | `src/renderer/src/game/reward-generator.ts` | Post-victory reward choices (attribute / relic / card-bias) |
| Relic Effects | `src/renderer/src/game/relic-effects.ts` | Single source for relic effect resolution, shared by execution and preview |

## Game Balance

- **Hero starts at**: 10 ATK / 10 MATK / 5 DEF / 100 HP / 0% crit
- **Victory rewards**: Each win offers 3 choices — attribute boost, a relic, or a card-bias (card-bias stacks up to 3 levels per id)
- **Status durations**: break-defense lasts 3 hero damage actions (40% defense reduction); weak applies ×0.8 to the monster's next attack; shield expires after the monster acts
- **Monster scaling**: +3 ATK / +3 MATK / +1 DEF / +1% crit per level, HP grows with 1.05 exponent
- **Max turns**: 20 per battle
- **Boss interval**: Every 5 levels (level-5 Boss = Stone General)
- **Boss enrage**: Starts at turn 15, +20% damage per turn

## License

This project is for educational and personal use.
