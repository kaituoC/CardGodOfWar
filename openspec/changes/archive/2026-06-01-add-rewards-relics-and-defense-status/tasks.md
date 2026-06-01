## 1. Data Model And Constants

- [x] 1.1 Extend `src/renderer/src/game/types.ts` with reward, reward choice, relic, relic trigger, card-bias, expanded status, shield, tactical card, monster archetype, and expanded battle event types.
- [x] 1.2 Add first-version reward, relic, card-bias, defensive card, status, weak, break-defense, shield, and archetype tuning constants in `src/renderer/src/game/constants.ts`, including guard shield formula, break-defense 40% reduction for 3 hero attack/tactical damage uses, weak `0.8` next-attack multiplier, card-bias cap 3, and Stone General shield cadence.
- [x] 1.3 Document the fixed break-defense duration model in code comments/tests: remaining hero attack/tactical damage uses, initialized to 3.
- [x] 1.4 Add safe default constructors or normalization helpers for missing `relics`, `cardBias`, `pendingRewards`, expanded statuses, shield values, and monster archetype metadata.
- [x] 1.5 Update save data typings so pending rewards, hero relics, card-bias data, expanded statuses, shield state, and monster archetype metadata are JSON-serializable.

## 2. Reward Selection Flow

- [x] 2.1 Implement reward generation for exactly three non-duplicate rewards after hero victory.
- [x] 2.2 Implement attribute rewards for physical attack, magic attack, defense, max HP/current HP, and crit rate.
- [x] 2.3 Implement relic rewards that only offer relics the hero does not already own.
- [x] 2.4 Implement card-bias rewards for at least one card type bias and at least one element bias.
- [x] 2.5 Replace automatic fixed victory growth with pending reward creation in the hero-victory path.
- [x] 2.6 Add store actions to select a reward, apply exactly one reward atomically, clear pending reward state, and block next-level progression until reward selection.
- [x] 2.7 Ensure pending reward choices persist through save/load with the same reward IDs and descriptions.

## 3. Relic System

- [x] 3.1 Add a relic registry with stable IDs, names, short descriptions, trigger timings, and effect metadata.
- [x] 3.2 Implement first-version relics covering fire damage, thunder next-turn attack bonus, healing overflow to shield, advantage-hit break defense, low-HP damage, shield/defense synergy, crit multiplier, and battle-start recovery.
- [x] 3.3 Add helper functions to resolve known relic definitions and safely ignore/render unknown relic IDs from saves.
- [x] 3.4 Apply outgoing damage and crit relic effects in the same deterministic damage pipeline used by previews.
- [x] 3.5 Apply healing overflow and battle-start relic effects with structured events/log feedback.
- [x] 3.6 Implement pending next-turn relic modifiers as JSON-serializable battle/run state and consume/expire them deterministically.
- [x] 3.7 Prevent duplicate relic ownership during generation and application.

## 4. Defense And Status Combat

- [x] 4.1 Add shield gain, shield absorption, shield expiration, and shield event metadata to combat resolution.
- [x] 4.2 Add guard/defense card generation and resolution with shield amount based on hero defense and card tuning.
- [x] 4.3 Add break-defense status data, application, duration/use decrement, expiration, and effective-defense calculation.
- [x] 4.4 Add armor-break tactical card generation and resolution with low damage plus break-defense application when the monster survives.
- [x] 4.5 Add weak status data, application, consumption/expiration, and outgoing monster damage reduction.
- [x] 4.6 Add suppress tactical card generation and resolution with low damage plus weak application when the monster survives.
- [x] 4.7 Keep existing stun behavior compatible with expanded statuses, including blocked attack/tactical damage cards and usable non-attack guard/heal/stat actions.
- [x] 4.8 Ensure every non-terminal defense/tactical action resolves the stored monster intent before turn advancement.
- [x] 4.9 Ensure skip turn still resolves the stored monster intent and advances shield, break-defense, weak, and stun cleanup consistently.

## 5. Card Generation And Card Bias

- [x] 5.1 Extend `card-pool.ts` to generate guard, armor-break, and suppress cards without changing the hand size from three cards.
- [x] 5.2 Apply card type biases to generated hand type weights while preserving neutral baseline behavior when no bias exists.
- [x] 5.3 Apply element biases to generated physical/magic attack card element weights.
- [x] 5.4 Apply rarity/star bias if included in the first card-bias pool.
- [x] 5.5 Add additive card-bias stacking capped at 3 levels per bias ID.
- [x] 5.6 Ensure every next-hand generation path passes current card-bias state into card generation, including normal turn advancement and restored active battles where a new hand is generated.

## 6. Damage, Intent, And Preview Consistency

- [x] 6.1 Update `battle-calculator.ts` or adjacent helpers so effective defense, weak, shield absorption, and relic modifiers resolve in one deterministic order.
- [x] 6.2 Update attack card estimates to include monster break defense, monster defensive intent effects, hero outgoing relics, and adjusted crit multipliers.
- [x] 6.3 Update heal card estimates to show max-HP-clamped healing and overflow-to-shield relic output.
- [x] 6.4 Add estimates for guard, armor-break, and suppress cards, including status application text.
- [x] 6.5 Update monster intent estimates to include weak reduction and preserve raw/mitigated metadata needed for shield-aware UI.
- [x] 6.6 Ensure preview helpers safely handle old or partially normalized states with missing relic/status/card-bias fields.
- [x] 6.7 Add structured events for relic triggers, shield absorption, reward selection, status apply/consume/expire, and expanded damage/heal metadata.

## 7. Enemy Archetypes And Stone General

- [x] 7.1 Add monster archetype definitions for berserker, stone guard, blood bat, thunder bug, and a generic fallback.
- [x] 7.2 Update `monster-generator.ts` to assign ordinary monster archetypes and apply archetype stat/skill/element tendencies.
- [x] 7.3 Make level 5 Boss generate as Stone General with fixed archetype metadata.
- [x] 7.4 Implement Stone General shield-pressure tendency in intent generation with deterministic or testable behavior.
- [x] 7.5 Ensure level 10 and later Bosses remain generic for this change, preserve existing Boss interval and enrage rules, and are not forced to Stone General.
- [x] 7.6 Ensure old saves without archetype metadata restore safely and continue generic intent behavior.

## 8. Store And Save/Load Integration

- [x] 8.1 Update `game-store.ts` state with pending reward choice, hero relics, card-bias state, and reward-selection actions.
- [x] 8.2 Update `nextLevel`, `retryLevel`, `backToStart`, and `startNewGame` flows so reward, relic, card-bias, and status state reset or persist according to specs.
- [x] 8.3 Update auto-save and manual save payload creation to include all new run and battle fields.
- [x] 8.4 Update restore normalization for old saves missing relics, card bias, pending rewards, expanded statuses, shield state, monster archetype, or current intent.
- [x] 8.5 Verify retry behavior does not duplicate pending rewards or relic triggers.

## 9. Battle UI And Reward UI

- [x] 9.1 Add a reward selection dialog/view that displays exactly three reward choices with category, name, and effect description.
- [x] 9.2 Wire reward choice clicks to store reward selection and keep next-level progression unavailable until selection.
- [x] 9.3 Update result flow so hero victory presents rewards before the next-level action.
- [x] 9.4 Update hero status UI to display relic labels and hero statuses including shield, stun, break-defense, and weak.
- [x] 9.5 Update monster status UI to display archetype/Boss name, monster statuses, Stone General pressure, and status-aware intent information.
- [x] 9.6 Update card UI styling/text for guard, armor-break, suppress, unavailable, and stunned tactical cards without layout overlap.
- [x] 9.7 Update card visual semantics so defense and tactical/status cards have distinct type-first accents while preserving archived card dimensions, estimate regions, and disabled/stunned behavior.
- [x] 9.8 Update BattleLog rendering to show concise reward, relic, shield, and status entries while preserving intent lifecycle hiding behavior.
- [x] 9.9 Smoke check normal and narrow battle layouts so reward cards, relic/status tags, hand, actions, and logs do not overlap.

## 10. Tests

- [x] 10.1 Add unit tests for reward generation: exactly three choices, no duplicate rewards, relic rewards exclude owned relics, and reward selection applies exactly one reward.
- [x] 10.2 Add unit tests for save/load normalization with old saves missing relics, card-bias data, expanded statuses, pending rewards, archetypes, and monster intent.
- [x] 10.3 Add unit tests for shield gain, partial absorption, full absorption, event metadata, and expiration after monster action.
- [x] 10.4 Add unit tests for break-defense damage preview and actual damage consistency.
- [x] 10.5 Add unit tests for weak reducing monster intent preview and actual monster damage consistently.
- [x] 10.6 Add unit tests for guard, armor-break, and suppress card resolution, including stun compatibility.
- [x] 10.7 Add unit tests for relic triggers: fire damage, crit multiplier, healing overflow to shield, battle-start recovery, and next-turn bonus consumption.
- [x] 10.8 Add unit tests proving `armor-breaker-blade` applies monster break-defense after advantage-element attacks when the monster survives.
- [x] 10.9 Add unit tests for skip turn resolving stored monster intent and cleaning up shield, monster break-defense, monster weak, and stun state consistently.
- [x] 10.10 Add unit tests for card-bias-aware generation while preserving hand size of three and clamping repeated bias levels at 3.
- [x] 10.11 Add unit tests for ordinary archetype generation, level 5 Stone General generation/intent pressure, and generic level 10+ Boss behavior.
- [x] 10.12 Add tests or fixtures proving non-random preview values match engine results under controlled states.

## 11. Verification

- [x] 11.1 Run `npm run test` and require all tests to pass.
- [x] 11.2 Run `npm run build` and require type checking plus production build to pass.
- [x] 11.3 Manually smoke test new game through at least one victory reward selection. (核心流程已由 `tests/stores/game-store.test.ts` 自动覆盖；用户实机验证通过)
- [x] 11.4 Manually smoke test a saved and restored pending reward choice. (存档恢复 pending reward 已由 `tests/stores/game-store.test.ts` 自动覆盖；用户实机验证通过)
- [x] 11.5 Manually smoke test guard shield against a visible monster attack intent.
- [x] 11.6 Manually smoke test armor-break and suppress cards with status tags and preview updates.
- [x] 11.7 Manually smoke test at least one relic trigger visible in battle log/UI.
- [x] 11.8 Manually smoke test level 5 Stone General encounter readability and beatability.
