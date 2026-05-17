## Context

The game currently has a compact Vue/Pinia/Electron architecture with the battle engine concentrated in `game-engine.ts`, damage math in `battle-calculator.ts`, random card and monster generation in separate modules, and UI components consuming `BattleState` from the Pinia store.

The core issue is not a missing feature; it is that several battle concepts are not yet represented as explicit contracts:

```text
Current flow
════════════

UI click card
   │
   ▼
playCard(state, card)
   │
   ├─ apply hero effect
   ├─ maybe monsterCounterAttack()
   ├─ append text logs
   └─ generate next hand

UI later parses text logs for damage numbers and flashes
```

This works while rules are small, but the boundaries are already strained:

- `hero` exists both at run level and inside `currentBattle`.
- `skipTurn()` advances turn and redraws cards without following the same monster counterattack path as a normal action.
- Element immunity has three competing meanings across design, implementation, and tests.
- Lifesteal is applied after the monster takes hero damage, even though the intended rule reads as monster damage-based healing.
- Battle presentation effects are inferred from localized text logs rather than structured outcomes.

## Goals / Non-Goals

**Goals:**

- Establish one canonical turn sequence for all player actions, including skip.
- Define stun, skip, element immunity, lifesteal, enrage, and battle end semantics in testable terms.
- Make battle state explicit enough to support future mechanics such as enemy intent, rewards, persistent effects, and richer cards.
- Introduce structured battle events so UI can render logs and animations without parsing human-readable strings.
- Keep save/restore tolerant of older save data that lacks new fields.

**Non-Goals:**

- Do not add new cards, rewards, monsters, enemy intent, deckbuilding, or balance changes in this change.
- Do not redesign the battle page visuals beyond what is necessary to consume structured events.
- Do not replace Pinia, Electron IPC, or the current file-based save system.
- Do not introduce external state-machine or event-sourcing dependencies.

## Decisions

### Decision 1: Use an explicit battle phase instead of implicit booleans

`BattleState` should include a `phase` field such as:

```text
playerAction → monsterAction → resolving → playerAction
                         │
                         └──────────────→ gameOver
```

The existing `isPlayerTurn` boolean is too small for future rules. A phase makes invalid transitions easier to prevent and easier to test. It also gives UI a natural way to disable card input during animation or resolution.

Alternative considered: keep `isPlayerTurn` and add more booleans. This is lower effort, but it spreads transition rules across unrelated flags.

### Decision 2: Centralize turn advancement in one resolution path

All actions should resolve through a shared path:

```text
resolvePlayerAction(action)
   │
   ├─ apply player action if any
   ├─ if battle ended, finish
   ├─ resolve monster action
   ├─ apply end-of-turn status changes
   ├─ increment turn / check max turns
   └─ draw next hand
```

Skip should mean "no player card effect this turn", not "advance and redraw for free". If the hero is stunned and has no legal card, skip still enters monster action and end-of-turn resolution.

Alternative considered: keep a separate `skipTurn()` function. This preserves existing structure, but creates two competing definitions of what a turn means.

### Decision 3: Treat stun as a one-action status effect

Stun should restrict the hero's next player action by disabling attack cards. The player may still use non-attack cards. If no non-attack card is available, the system must offer skip. Once the player takes a legal non-attack action or skips, the stun is consumed during turn resolution.

Alternative considered: stun means a full automatic skip. This is simpler, but removes the interesting choice of healing or buffing while stunned.

### Decision 4: Element immunity neutralizes element relationships, not all damage

When element immunity triggers for an element matching the incoming attack, the element multiplier is `1.0`. Defense, crit, shield, and other damage steps still apply.

This keeps the skill meaningful without making a random 30% trigger negate an entire high-value card. It also matches the completed OpenSpec design from `improve-battle-ui-and-fix-bugs`.

Alternative considered: immunity clamps final damage to `MIN_DAMAGE`. This is more literal, but creates a large random swing and conflicts with the previous design decision.

### Decision 5: Lifesteal heals from monster-dealt damage

Lifesteal should trigger during monster action. If the skill is active and the monster deals damage to the hero, the monster heals by a percentage of the actual final damage dealt, capped by max HP.

Alternative considered: heal when monster receives damage. That behaves more like retaliation regeneration and makes the label "lifesteal" misleading.

### Decision 6: Use structured battle events as the UI contract

The engine should emit events such as:

```text
damage
heal
statBoost
statusApplied
statusConsumed
skillTriggered
turnSkipped
battleEnded
```

Each event should include machine-readable metadata plus an optional display text. The battle log can render display text, while floating numbers and flashes read typed fields.

Alternative considered: keep text logs and improve regex parsing. This avoids a type migration, but makes future copy changes and localization risky.

### Decision 7: Keep run-level and battle-level hero state distinct

The run-level hero is the hero snapshot between battles. `BattleState.hero` is the active in-battle hero. On victory, the run-level hero is updated from the battle hero plus victory growth. On retry/back-to-start/load, the store must restore the appropriate snapshot explicitly.

This keeps the current mental model while making synchronization moments clear.

## Risks / Trade-offs

- Rule migration changes player-visible behavior → Cover with explicit tests for stun, skip, lifesteal, element immunity, and max-turn loss.
- Save files may lack new fields → Add tolerant restore defaults for `phase`, `events`, `result`, and `level`.
- Structured events duplicate some text log information → Treat text as derived display data and machine fields as canonical.
- Phase model may feel heavier than the current game needs → Keep phases minimal and avoid external state-machine dependencies.
- Random skill triggers make tests flaky → Allow deterministic skill/effect control in unit tests through direct state setup or injectable random rolls.
