## Context

The current battle loop is compact and readable: each turn gives the player three generated cards, the player chooses one action, the stored monster intent resolves, and victory advances to the next level with fixed stat growth. This is a strong base for a lightweight desktop card battler, but it limits long-term player agency and makes monster intent less interactive than it could be. The player can see danger coming, yet most responses are still "attack, heal, or permanent stat boost."

This change intentionally extends the existing architecture instead of replacing it. The game will remain a one-action-per-turn, generated-hand battle game. The update adds a post-victory choice layer, persistent relics, lightweight card-bias tuning, active defensive/tactical cards, and a small enemy archetype/Boss pressure layer that validates those new decisions.

The archived battle layout and card visual specs establish the current UI baseline: cards use type-first visual semantics, stable internal regions, fixed desktop sizing, responsive wrapping, and trustworthy compact estimates. This change builds on that baseline by adding new gameplay surfaces that must remain just as readable: reward cards, relic/status tags, defensive/tactical estimates, and archetype/Boss intent.

## Goals / Non-Goals

**Goals:**

- Replace fixed automatic victory growth with a reward choice that gives players meaningful run-shaping decisions.
- Add persistent relics that create early build identity without requiring a full deckbuilder.
- Add card-bias rewards so relic choices can be supported by future generated hands.
- Add player-side shield, break-defense, and weak as a small first status set.
- Add defense/tactical cards that make monster intent actionable, not just informational.
- Keep previews and actual combat resolution consistent for all new statuses and relevant relics.
- Add a small enemy archetype layer and make only the level 5 Boss a fixed Stone General Boss that tests shield/break-defense play.
- Preserve compatibility with existing save files.
- Keep the implementation modular inside existing game helpers, Pinia store actions, and Vue components.

**Non-Goals:**

- No full deck, discard pile, draw pile, card removal, or card upgrade system.
- No action points or multi-card turns.
- No map, route selection, shop, event room, or elite-route rewards.
- No broad achievement, codex, collection, or meta-progression system.
- No large Boss campaign; only the level 5 Boss receives a fixed named archetype in this change. Later Boss levels continue using generic Boss behavior unless ordinary archetype assignment is explicitly reused by implementation.
- No complex status set such as poison, burn, wet, charge, dodge, counterattack, or cleanse cards.
- No new external UI or game-engine dependency.
- No save-format hard break; old saves must normalize into safe defaults.

## Decisions

### Decision 1: Reward choice replaces automatic fixed victory growth

After hero victory, the battle enters a reward-pending state with three generated reward choices. The player must choose one reward before `nextLevel` starts the next battle.

Reward types:

- `attribute`: stable hero growth such as physical attack, magic attack, defense, max HP, or crit rate.
- `relic`: one new non-duplicate passive relic.
- `cardBias`: a persistent bias that affects future generated hand composition.

Rationale: the smallest reliable way to make a run feel authored by the player is to add a decision between battles. It gives immediate value without replacing the combat loop.

Alternative considered: keep fixed victory growth and add relic drops occasionally. Rejected for this change because it reduces player agency and preserves the current linear progression feel.

### Decision 2: Relics are persistent hero-owned passives, not active items

Relics live on the run hero and persist through future battles and saves. Relics are represented by stable IDs, display names, short descriptions, trigger timing, and effect metadata. A hero cannot receive the same relic twice in the same run.

First-version relic pool should be small and explicit:

- `flame-emblem`: fire attack damage bonus.
- `thunder-core`: after using a thunder attack, next-turn attack bonus.
- `water-spirit-bottle`: healing overflow converts into temporary shield.
- `armor-breaker-blade`: advantage-element damage applies break defense.
- `blood-rage-sigil`: low-HP outgoing damage bonus.
- `ironwall-crest`: shield gain bonus or stat-boost defensive bonus.
- `sharp-charm`: crit multiplier improvement.
- `regrowth-seed`: battle-start HP recovery.

Rationale: passive relics produce build identity while keeping input and UI simple. Active relics would require new player action surfaces and timing rules.

Alternative considered: make relics random invisible stat modifiers. Rejected because players must see and feel how earlier choices change later fights.

### Decision 3: Card-bias rewards tune generated hands instead of adding a deck

Card-bias rewards are persistent modifiers used by `generateCards` to shift probabilities for card type, element, or star rarity. They do not guarantee exact cards and do not create a deck list.

Recommended first-version card biases:

- Fire, thunder, or water affinity.
- Physical or magic specialization.
- Healing supply.
- Tactical training for defense/status cards.
- Rare instinct for modest 2-star/3-star weighting.

Card-bias rewards can stack as numeric bias levels, capped at 3 levels per bias ID. Each level applies an additive weight boost defined in constants; the generator must clamp at the cap and avoid unbounded probability growth.

Rationale: this matches the current generated-hand architecture and supports relic direction without introducing deck state.

Alternative considered: create a full deck and draw/discard piles. Rejected as a separate future direction because it would change the core game model too much for this version.

### Decision 4: Shield is temporary and absorbs the next monster action only

Shield is a hero-side status/resource generated by defense cards and selected relics. Shield absorbs incoming monster damage before HP loss. First-version shield expires after the current monster action or at turn cleanup if unused.

Rationale: one-turn shield creates a direct answer to monster intent and avoids stacking/rolling defenses that could trivialize long fights.

Alternative considered: persistent shield that carries across turns. Rejected for first version because it risks runaway defense and makes Boss pressure harder to tune.

### Decision 5: Break defense and weak use simple, bounded duration semantics

Break defense reduces a target's effective defense by a percentage for a bounded number of player attacks. Weak reduces a target's outgoing damage multiplier for its next relevant attack. First-version cards primarily apply these to monsters.

- Break defense on monster: effective defense is reduced by 40%, rounded down, for the next 3 hero attack/tactical damage actions against that monster. Effective defense must not go below `0`.
- Weak on monster: next monster attack damage is multiplied by `0.8`, then weak is consumed.
- Existing stun remains: attack cards are blocked until the stunned hero takes a non-attack action, skips, or the status is consumed by the current existing flow.

Rationale: these statuses add strategy with only two new tactical concepts. More status types can come later.

Alternative considered: add burn, poison, wet, charge, cleanse, and counterattack together. Rejected because it would overload UI, tests, and player learning.

### Decision 6: Add one new card category with tactical subtypes

Extend card modeling so defensive/tactical cards can be generated and rendered distinctly. The implementation may model this as a new `defense` card type with an `effect` field, or as a `tactical`/`skill` type with subtypes, but it must support these first-version cards:

- Guard: grants shield based on hero defense and card coefficient/star.
- Armor Break: deals low physical damage and applies break defense to the monster.
- Suppress: deals low damage and applies weak to the monster.

Initial tuning anchors:

- Guard shield: `floor(hero.defense * card.coefficient)`, minimum `1`.
- Armor Break damage: normal physical attack pipeline using a lower coefficient range than standard attack cards, then apply 40% break defense for 3 hero attack/tactical damage uses if the monster survives.
- Suppress damage: normal physical or magic attack pipeline using a lower coefficient range than standard attack cards, then apply weak `0.8` for the next monster attack if the monster survives.

Rationale: separate card semantics make the hand more readable and allow card-bias rewards to target tactical cards.

Alternative considered: overload `statBoost` cards for defensive effects. Rejected because permanent stat growth and temporary combat tactics are different player decisions.

### Decision 7: Previews remain the source of trust

Every new mechanic that affects a player-visible decision must be represented in preview helpers:

- Attack card estimates include monster break defense, defensive intent effects, relevant relic outgoing modifiers, and crit multiplier changes.
- Defense cards estimate shield amount.
- Armor Break and Suppress cards estimate their damage and status application.
- Monster intent estimates include weak when already applied before monster action and show predicted HP damage after shield only when shield is already active.
- Healing estimates include overflow-to-shield relic effects when applicable.

Rationale: the current project already treats preview correctness as foundational. New mechanics must not regress that trust.

Alternative considered: show new mechanics only in logs after resolution. Rejected because players need previews to make tactical decisions.

### Decision 8: Enemy archetypes are light metadata plus tuning, not separate enemy classes

Monster generation adds an optional archetype object or ID. Archetypes tune stats, element tendencies, skill tendencies, and display labels. Level 5 Boss is fixed to `stone-general` in this change.

First-version ordinary archetypes can be small:

- `berserker`: high physical pressure, lower defense.
- `stone-guard`: higher defense and shield tendency.
- `blood-bat`: lifesteal tendency and lower HP.
- `thunder-bug`: crit/stun tendency and lower HP.

Stone General Boss behavior:

- Level 5 Boss uses a shield-focused archetype/name.
- Its intent generation uses deterministic shield pressure on every third Stone General turn, starting on turn 1 or turn 3 as defined by constants; tests must be able to assert the configured cadence without random retries.
- It remains beatable with normal attacks, but break-defense and defense cards should be clearly valuable.

Boss assignment rules:

- Level 5 is always Stone General.
- Level 10 and higher Boss levels remain generic Bosses in this change unless the ordinary archetype generator assigns display metadata that does not change their Boss interval/enrage rules.
- Existing Boss interval and enrage rules remain intact: Bosses still appear at the existing interval and still use the existing enrage timing/multiplier behavior.

Rationale: enemies become readable without a full scripted campaign system.

Alternative considered: implement all explored Bosses immediately. Rejected because the first version needs one reliable Boss testbed before expanding the roster.

### Decision 9: Save normalization handles all new fields

Old saves must load safely:

- Missing hero relics -> `[]`.
- Missing card biases -> neutral/default bias.
- Missing reward state -> no pending rewards unless the battle is already won and not advanced by new state.
- Missing status fields -> derive old stun state and no shield/break/weak.
- Missing monster archetype -> default/generated generic archetype or `undefined` with safe UI fallback.

Rationale: Electron save files persist across development versions; breaking them would make testing and user play frustrating.

Alternative considered: invalidate old saves. Rejected because current save normalization already sets a compatibility expectation.

### Decision 10: New card visuals extend archived card semantics

Defense and tactical cards must follow the archived `card-visual-system` baseline. They need type-first visual accents, stable card regions, readable estimate text, and disabled/stunned behavior that does not resize cards.

Initial visual anchors:

- Defense/guard cards use a distinct defensive accent such as `#8e9aaf`.
- Tactical/status cards use a distinct control accent such as `#b084cc`.
- Existing physical, magic, heal, stat boost, disabled, and stunned colors remain unchanged.

Rationale: new mechanics should be easy to scan without undoing the completed card visual polish.

Alternative considered: reuse stat boost styling for all non-attack tactics. Rejected because permanent growth, shield defense, and status tactics are separate player decisions.

## Risks / Trade-offs

- [Risk] Scope expands into a full roguelite map/deckbuilder → Mitigation: keep this change to reward choice, relics, card bias, defense/status, and one Boss archetype.
- [Risk] Reward/relic effects become invisible stat soup → Mitigation: every relic trigger must have visible UI/log/event feedback when it materially affects an action.
- [Risk] Random hand generation fails to support chosen relics → Mitigation: include card-bias rewards and test biased generation statistically enough for confidence.
- [Risk] Shield trivializes Boss pressure → Mitigation: first-version shield expires after the current monster action and uses conservative scaling.
- [Risk] Break defense stacks into runaway damage → Mitigation: cap effective defense at a minimum, use bounded duration, and avoid unlimited stacking in first version.
- [Risk] Weak makes Bosses harmless → Mitigation: make weak consume on next monster attack and tune a modest reduction.
- [Risk] Preview and resolution drift → Mitigation: add direct tests that compare non-random preview values with engine results under controlled states.
- [Risk] UI becomes crowded → Mitigation: show relics/statuses as compact tags with short text; reward descriptions live in the reward dialog, not the battle hand.
- [Risk] Old saves crash due to missing fields → Mitigation: normalize every new field in the store restore path before rendering.

## Migration Plan

1. Add data types, constants, and normalization defaults without changing existing active gameplay.
2. Add status/relic/reward helper functions with unit tests.
3. Add defensive/tactical card generation behind the normal card pool.
4. Integrate resolution and preview updates in the game engine.
5. Add reward-pending flow and store actions.
6. Add UI surfaces for rewards, relics, statuses, and archetype labels.
7. Add enemy archetype generation and Stone General Boss behavior.
8. Run unit tests and build.
9. Manually smoke test old-save loading, victory reward choice, shield use, break-defense/weak use, relic triggers, and level 5 Boss behavior.

Rollback is straightforward if unreleased: remove the change artifacts and code changes. For released saves containing new fields, older app versions may ignore or fail on unknown data; this change only guarantees forward loading of old saves into the new app.

## Implementation Phases

The change can remain a single OpenSpec change, but implementation SHOULD proceed in reviewable phases:

1. Reward and relic foundation: data model, reward selection, relic registry, save normalization, reward UI.
2. Defense and status combat: guard, shield, break defense, weak, tactical cards, previews, status UI.
3. Card bias and enemy pressure: biased card generation, ordinary archetypes, Stone General, final visual QA.

## Open Questions

None. The previously open items are resolved by Decisions 3, 5, and 8.
