## 1. Types And State Model

- [x] 1.1 Add explicit battle phase, battle result, status effect, and structured battle event types to `src/renderer/src/game/types.ts`.
- [x] 1.2 Add `level`, `phase`, `result`, and `events` fields to `BattleState`, keeping restore defaults for saves that do not include them.
- [x] 1.3 Clarify run-level hero versus battle-level hero synchronization in `game-store.ts`.
- [x] 1.4 Ensure new battles, restored battles, victories, retries, and back-to-start flows set hero and battle state consistently.

## 2. Rule Semantics

- [x] 2.1 Refactor battle resolution so attack, heal, stat boost, and skip all use one canonical turn sequence.
- [x] 2.2 Change skip behavior so it triggers monster action, end-of-turn processing, turn advancement, and next-hand generation.
- [x] 2.3 Make stun a one-action effect that blocks attack cards, allows non-attack cards, and is consumed after legal action or skip.
- [x] 2.4 Keep element immunity as neutral element multiplier `1.0` for matching elements while preserving defense, crit, shield, and minimum damage.
- [x] 2.5 Move lifesteal to monster action so the monster heals from actual final damage dealt to the hero.
- [x] 2.6 Ensure next-hand generation uses the active battle level instead of a hard-coded level.

## 3. Structured Events

- [x] 3.1 Emit structured events for damage, heal, stat boost, skill trigger, status apply/consume, skip, turn advancement, and battle end.
- [x] 3.2 Derive human-readable battle log lines from structured events without making UI effects depend on log text.
- [x] 3.3 Update `BattleView.vue` and related UI code to drive floating numbers, flashes, crit indicators, element indicators, and enrage indicators from event metadata.
- [x] 3.4 Keep battle events JSON-serializable for Electron IPC and save files.

## 4. Save Compatibility

- [x] 4.1 Add tolerant restore logic for older saves missing `level`, `phase`, `result`, `events`, or new status fields.
- [x] 4.2 Verify auto-save and manual-save payloads serialize plain data without Vue reactive proxies.
- [x] 4.3 Confirm loaded older saves resume in a playable state with safe defaults.

## 5. Tests

- [x] 5.1 Update the element immunity test to expect neutral multiplier behavior instead of minimum damage.
- [x] 5.2 Add tests for lifesteal healing from monster-dealt damage and not from hero-dealt damage.
- [x] 5.3 Add tests for stunned hero legal actions, illegal attack actions, skip availability, and stun consumption.
- [x] 5.4 Add tests proving skip still triggers monster action and advances through the canonical turn sequence.
- [x] 5.5 Add tests for battle phase transitions and deterministic battle results.
- [x] 5.6 Add tests for structured event emission and save-safe event serialization.

## 6. Verification

- [x] 6.1 Run the full Vitest suite and fix any regressions.
- [x] 6.2 Run type checking through the project build pipeline.
- [x] 6.3 Smoke test a local battle flow: new game, attack, heal, stat boost, stun skip, victory, next level, save, and load.
