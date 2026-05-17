## 1. Types And Helper Boundaries

- [x] 1.1 Add `MonsterIntent`, `MonsterIntentSkill`, `MonsterIntentAction`, `IntentSkillTiming`, `DamagePreview`, and `CardOutcomeEstimate` types to `src/renderer/src/game/types.ts`.
- [x] 1.2 Extend `BattleState` with `monsterIntent` while preserving existing `phase/result/events/logs` fields.
- [x] 1.3 Add optional `intentId` metadata to relevant battle event types (`damage`, `heal`, `status`, `skillTriggered`) and add new intent lifecycle event types.
- [x] 1.4 Create `src/renderer/src/game/monster-intent.ts` as the pure helper module for intent generation and card previews; it MUST NOT import Vue, Pinia, Electron, or UI components.

## 2. Damage And Card Preview Helpers

- [x] 2.1 Add a deterministic damage preview helper that uses the same formula constants as `calculateDamage` but never rolls crit.
- [x] 2.2 Ensure preview output includes `estimatedDamage`, `critDamage`, `critRate`, `critMultiplier`, `critLabel`, `elementMultiplier`, shield flag, immunity flag, and enrage multiplier.
- [x] 2.3 Add `estimateCardOutcome(battle, card)` for attack, heal, stat boost, and stun-blocked attack cases; attack previews MUST expose ready-to-render `text` such as `预计 18` or `预计 18 | 暴击15%→27`.
- [x] 2.4 Add unit tests proving attack estimates match actual non-crit damage when `critRate` is 0.
- [x] 2.5 Add unit tests proving shield and element immunity in the current intent affect attack card estimates.
- [x] 2.6 Add unit tests for heal and stat boost estimates.

## 3. Intent Generation

- [x] 3.1 Implement `generateMonsterIntent(input: GenerateMonsterIntentInput)` in `monster-intent.ts`, using explicit fields: `level`, `hero`, `monster`, `currentTurn`, `maxTurns`, `isEnraged`, and optional `source`.
- [x] 3.2 Generate an initial monster intent inside `createBattle()`.
- [x] 3.3 Generate a new monster intent after each surviving turn advances into `playerAction`.
- [x] 3.4 Ensure intent does not change while the player is deciding during the same player action phase.
- [x] 3.5 Ensure skill trigger chances are decided during intent generation and respect `triggerChance` 0 and 100 in tests; defensive skill triggers (`shield`, `elementImmune`) apply only if the player attacks that turn and expire unused on heal, stat boost, or skip.
- [x] 3.6 Add unit tests for new battle intent, next-turn intent refresh, stable same-turn intent, and forced skill trigger outcomes.

## 4. Intent-Driven Resolution

- [x] 4.1 Refactor monster action resolution to read attack type, triggered monster-action skills, and enrage multiplier from `state.monsterIntent`.
- [x] 4.2 Refactor hero attack resolution to read triggered defensive intent skills (`shield`, `elementImmune`) from `state.monsterIntent`; heal, stat boost, and skip MUST NOT apply them, and the intent MUST be consumed by the subsequent monster action or battle end.
- [x] 4.3 Remove or bypass old monster-action skill re-roll paths so displayed intent and actual execution cannot diverge.
- [x] 4.4 Emit `intentConsumed` events when monster action executes an intent.
- [x] 4.5 Add `intentId` to damage/heal/status/skill events caused by the current intent.
- [x] 4.6 Add unit tests proving physical/magic monster attacks follow the stored intent.
- [x] 4.7 Add unit tests proving triggered `critBoost`, `lifesteal`, `stun`, `shield`, and `elementImmune` are applied from intent without re-rolling.
- [x] 4.8 Add unit tests proving hero victory and monster victory do not require next-turn intent generation.

## 5. Save And Restore Compatibility

- [x] 5.1 Update `game-store.ts` battle normalization so only non-game-over active old saves missing `monsterIntent` get a restored generated intent; if `phase` is missing or not actionable, normalize to `playerAction` before generating.
- [x] 5.2 Ensure completed old saves do not require actionable monster intent for further player input.
- [x] 5.3 Ensure auto-save and manual save payloads include `monsterIntent` as plain JSON.
- [x] 5.4 Add tests or targeted helper coverage for restoring active battle state without `monsterIntent`.
- [x] 5.5 Add tests or targeted helper coverage for JSON serialization of battle state with intent and intent events.

## 6. Monster UI

- [x] 6.1 Update `MonsterStatus.vue` props to receive current intent or the full battle state needed to render intent.
- [x] 6.2 Add a compact intent area showing next attack type, estimated damage, and triggered skill labels.
- [x] 6.3 Add Boss pressure display: turns until enrage before turn 16, and current enrage multiplier once active.
- [x] 6.4 Ensure the intent UI stays readable at the existing battle layout size and does not overlap the HP/stat grid.
- [x] 6.5 Do not add new component-test dependencies for this change; keep UI confidence to type/build checks, pure helper tests, and the manual smoke checklist unless compatible DOM test infrastructure already exists.

## 7. Card UI

- [x] 7.1 Update `CardHand.vue` to compute and pass per-card outcome estimates.
- [x] 7.2 Update `CardComponent.vue` to render a compact estimate line for damage, heal, stat boost, and stun-blocked attacks.
- [x] 7.3 Ensure disabled/stunned attack cards show blocked text `眩晕中` rather than a damage number; they MUST NOT show `0` damage.
- [x] 7.4 Keep card dimensions stable so estimates do not cause layout shift.
- [x] 7.5 Add unit tests for estimate helper outputs; add UI smoke checks for visible estimate text.

## 8. Event Log And Presentation

- [x] 8.1 Ensure intent lifecycle events are stored in `BattleState.events` without requiring text parsing.
- [x] 8.2 Store `intentCreated` and `intentConsumed` events in `BattleState.events`, but keep them hidden from `BattleLog` by default so the log does not duplicate the monster panel.
- [x] 8.3 Ensure existing floating numbers and flashes still respond to damage/heal/status metadata after intent event additions.
- [x] 8.4 Add tests proving intent metadata is machine-readable through event fields.

## 9. Acceptance Tests

- [x] 9.1 Add or update `tests/game/game-engine.test.ts` for intent generation, refresh, stability, execution consistency, and victory edge cases.
- [x] 9.2 Add or update `tests/game/battle-calculator.test.ts` for deterministic preview calculations.
- [x] 9.3 Add a new focused test file if helper coverage becomes too large for existing files.
- [x] 9.4 Run `npm run test` and require all tests to pass.
- [ ] 9.5 Run `npm run build` and require type checking plus production build to pass.
- [ ] 9.6 Manually smoke test: new game, read monster intent, compare monster action to intent, use attack/heal/stat cards with estimates, trigger stun skip, reach next level, save and load.

## 10. Review Checklist For Final Reviewer

- [ ] 10.1 Confirm no hidden monster action randomization remains after intent generation.
- [ ] 10.2 Confirm card estimates use the same formula assumptions as execution for non-crit cases.
- [ ] 10.3 Confirm old saves normalize safely and active saves retain intent.
- [ ] 10.4 Confirm UI improves decision-making without overcrowding the battle page.
- [ ] 10.5 Confirm no unrelated balance changes, card pool changes, or reward mechanics slipped into this change.
