## 1. Preview Correctness And Safety

- [x] 1.1 Update monster panel / `monsterIntent` damage preview so Boss enrage multiplier affects monster upcoming-attack `estimatedDamage` and `critDamage`; do not apply enrage to hero card estimates.
- [x] 1.2 Ensure monster intent preview still matches actual monster non-crit damage when monster `critRate` is 0.
- [x] 1.3 Update hero attack card estimates so monster `critBoost` does not affect hero `critDamage`, `critMultiplier`, or `critLabel`.
- [x] 1.4 Update heal card estimates to show actual recoverable HP after max HP clamping; heal and stat boost estimates must still work when `monsterIntent` is missing.
- [x] 1.5 Add a safe `CardOutcomeEstimate` fallback branch `{ type: 'unavailable', reason: 'missingIntent' | 'gameOver', text: '' }` for attack estimates when `monsterIntent` is missing/non-actionable.
- [x] 1.6 Update TypeScript types for the `unavailable` estimate branch, keeping the shape JSON-friendly and simple; do not reuse `blocked` for missing intent.

## 2. Preview Tests

- [x] 2.1 Add unit tests proving enraged Boss intent `estimatedDamage` equals actual non-crit monster damage under the same state and intent.
- [x] 2.2 Add unit tests proving monster `critBoost` does not change hero card crit preview.
- [x] 2.3 Add unit tests proving heal estimates are clamped by missing HP.
- [x] 2.4 Add unit tests proving missing or nullish monster intent returns a safe unavailable/no-estimate result instead of throwing.
- [x] 2.5 Replace indirect old-save helper coverage with direct normalization or restore-path coverage if feasible without over-expanding store test setup.

## 3. Card Visual Structure

- [x] 3.1 Refactor `CardComponent.vue` markup into stable regions: type/rarity header, main value, detail, estimate, and action/state.
- [x] 3.2 Set desktop card dimensions to a fixed baseline of `160px` width and `200px` min-height, with responsive minimum width no smaller than `148px` on narrow windows.
- [x] 3.3 Reserve fixed or minimum height for the estimate area so damage/crit/heal/stat/blocked text does not move the action area.
- [x] 3.4 Ensure card text fits within the card for long crit preview strings and stat boost labels.
- [x] 3.5 Keep border radius at 6-8px and avoid nested card styling.

## 4. Card Color And State Styling

- [x] 4.1 Make card type the primary visual accent with fixed colors: physical `#e94560`, magic `#5dade2`, heal `#27ae60`, stat boost `#f0c040`, disabled/stunned `#6c7380` plus muted text `#95a5a6`.
- [x] 4.2 Make rarity/star styling secondary through badges, border intensity, or subtle shine without overpowering type color.
- [x] 4.3 Add available, hover, pressed, disabled, and blocked-by-stun visual states without width/height changes.
- [x] 4.4 Ensure disabled cards do not use normal hover lift and cannot emit play actions.
- [x] 4.5 Ensure stunned attack cards show `眩晕中` in the estimate area; the action/state area should show a neutral disabled affordance such as `不可用` and must not duplicate `眩晕中` unless the estimate area is unavailable.

## 5. Hand And Battle Page Layout

- [x] 5.1 Refactor `CardHand.vue` layout so cards are centered with consistent gaps on normal desktop widths.
- [x] 5.2 Allow the hand area to wrap or adapt on narrow widths without horizontal page overflow.
- [x] 5.3 Refactor `BattleView.vue` so the save/back action bar sits below the hand inside the left decision column, lives in normal layout flow, removes absolute positioning, and never overlays cards.
- [x] 5.4 Rebalance the lower battle area so the decision/hand area remains primary and the BattleLog remains secondary but readable.
- [x] 5.5 Add responsive rules with this priority: preserve card minimum readability, reduce hand gaps/wrap cards, shrink BattleLog to readable minimum, then move BattleLog below the decision area if needed.
- [x] 5.6 Confirm floating numbers and flash effects remain overlays and do not shift layout.

## 6. Status Panel Polish

- [x] 6.1 Adjust `MonsterStatus.vue` intent area text from ambiguous wording like `下回合` to clearer wording such as `怪兽行动` or equivalent.
- [x] 6.2 Ensure MonsterStatus displays HP, stats, skills, intent, and Boss pressure without overlap.
- [x] 6.3 Adjust HeroStatus and MonsterStatus spacing only as needed to keep the status row visually balanced.
- [x] 6.4 Keep Boss pressure readable before enrage and while enraged, including current multiplier display.

## 7. Visual QA And Acceptance

- [x] 7.1 Run `npm run test` and require all tests to pass.
- [x] 7.2 Run `npm run build` and require type checking plus production build to pass.
- [x] 7.3 Manually smoke test a normal desktop battle: card colors, size, estimates, action bar, and log readability.
- [x] 7.4 Manually smoke test a narrow window: hand wrapping/adaptation, no horizontal overflow, no action overlap.
- [x] 7.5 Manually smoke test stunned state: blocked attack cards show `眩晕中`, non-attack cards remain usable, skip flow still works.
- [x] 7.6 Manually smoke test Boss states: pre-enrage countdown, enraged multiplier, and damage preview consistency.
- [x] 7.7 Manually smoke test save/load or restored battle state so missing/unavailable intent does not crash card rendering.

## 8. Final Review Checklist

- [x] 8.1 Confirm preview math is consistent with execution for non-random cases.
- [x] 8.2 Confirm no new card, monster, reward, or balance mechanics were introduced.
- [x] 8.3 Confirm card type color semantics are clear at a glance.
- [x] 8.4 Confirm card dimensions and hand layout remain stable across card types and states.
- [x] 8.5 Confirm battle layout improves decision readability without hiding BattleLog or core status information.
