## Why

The current game has a readable single-battle loop, but long-term play is still mostly linear: each victory grants fixed stat growth, each turn offers three temporary cards, and enemies mainly differ by scaled stats plus random skills. This change adds a compact strategy layer so players can shape a run through rewards, relics, defensive choices, and clearer enemy pressure without jumping directly to a full deckbuilder, map, shop, or action-point system.

## What Changes

- Add a victory reward flow: after winning a battle, the player must choose one reward before entering the next level.
- Add reward types that support early build direction:
  - Attribute rewards for stable hero growth.
  - Relic rewards that add persistent passive effects.
  - Card-bias rewards that influence future generated hand composition.
- Add a hero relic system with a first small relic pool focused on elemental damage, defense, sustain, crit, Boss pressure, and status interaction.
- Add player-side defensive and tactical card options:
  - Defense cards that grant temporary shield.
  - Break-defense cards that apply defense reduction to monsters.
  - Suppression cards that apply weak to monsters.
- Add status effect semantics for shield, break defense, and weak while keeping the existing stun behavior compatible.
- Update damage, healing, intent, and card-outcome previews so they include the new defensive/status/relic effects where they affect player decisions.
- Add visible status and relic presentation in the battle UI, including concise trigger feedback in logs/events.
- Add light enemy archetype support so selected monsters and the first Boss can test the new mechanics:
  - Ordinary monsters may receive named archetypes with stat and skill tendencies.
  - Level 5 Boss becomes a shield-focused Stone General archetype that rewards shield reading, break-defense usage, and defensive play.
- Preserve the current simple battle cadence: one player action per turn, three generated cards per turn, no map, no shop, no full deck/discard system, and no action points in this change.
- Preserve save/load compatibility by normalizing old saves that lack relics, rewards, statuses, card-bias data, or monster archetypes.

## Capabilities

### New Capabilities

- `victory-reward-selection`: Defines the post-victory reward choice flow, reward categories, reward generation, selection behavior, and progression gating.
- `hero-relic-system`: Defines persistent hero relic ownership, relic trigger semantics, first-version relic pool behavior, UI visibility, and save compatibility.
- `defense-and-status-combat`: Defines shield, break-defense, weak, defensive/tactical cards, status duration rules, and how these affect damage resolution and previews.
- `enemy-archetypes-and-boss-pressure`: Defines lightweight monster archetypes, their display requirements, first-version ordinary archetypes, and the level 5 Stone General Boss behavior.

### Modified Capabilities

- `battle-state-model`: Battle state and save-normalization requirements change to include reward-pending progression, hero relics, card-bias data, status effects, and monster archetype metadata.
- `battle-rule-semantics`: Combat rules change to include shield absorption, break-defense defense reduction, weak damage reduction, and relic/status modifiers.
- `battle-decision-preview`: Card and monster intent previews must account for new statuses, shields, and applicable relic/card-bias effects.
- `battle-event-log`: Structured battle events and logs must describe reward selection, relic triggers, status application/consumption, shield absorption, and archetype/Boss pressure where relevant.
- `monster-intent-generation`: Monster intent generation must reflect archetype tendencies and Stone General shield-pressure behavior.
- `monster-intent-resolution`: Monster intent resolution must apply weak, shield absorption, archetype/Boss skills, and relic/status side effects consistently with previews.
- `battle-ui-layout`: Battle UI requirements change to show relics, statuses, victory rewards, and archetype/Boss pressure without obscuring cards, intent, or logs.
- `card-visual-system`: Card visual requirements change to include defense and tactical cards while preserving type-first color semantics, stable card regions, and stunned/disabled behavior.

## Impact

- `src/renderer/src/game/types.ts` — Add reward, relic, card-bias, status, shield, archetype, and expanded event types.
- `src/renderer/src/game/constants.ts` — Add reward pools, relic definitions, status constants, defensive card tuning, card-bias weights, and archetype tuning.
- `src/renderer/src/game/game-engine.ts` — Add reward-pending progression, reward application, defensive/tactical card resolution, status duration handling, relic triggers, and normalized turn flow.
- `src/renderer/src/game/card-pool.ts` — Add defense/tactical cards and card-bias-aware generation.
- `src/renderer/src/game/battle-calculator.ts` — Apply shield, break-defense, weak, and selected relic modifiers in a deterministic order.
- `src/renderer/src/game/monster-intent.ts` — Update card estimates and monster intent estimates for statuses, relics, shield mitigation, and archetype/Boss behavior.
- `src/renderer/src/game/monster-generator.ts` — Generate ordinary archetypes and fixed level 5 Boss archetype.
- `src/renderer/src/stores/game-store.ts` — Add reward selection actions, next-level gating, save/load normalization, and reward/relic/card-bias persistence.
- `src/renderer/src/views/BattleView.vue` and related components — Add reward selection dialog/view, relic/status display, defensive card rendering, and archetype/Boss pressure display.
- `src/main.ts` / preload typings if needed — Persist expanded save data while maintaining old-save loading.
- `tests/game/*` — Add focused unit coverage for reward flow, relic triggers, status duration, defensive card resolution, card-bias generation, archetype generation, preview consistency, and save normalization.
