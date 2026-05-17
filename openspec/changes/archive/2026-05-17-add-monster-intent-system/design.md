## Context

当前战斗内核已经具备显式 `phase/result/events`、稳定的回合推进、结构化事件和旧存档容错恢复。怪兽行动仍然在怪兽反击阶段即时随机选择攻击类型和技能触发，这使玩家在出牌前只能看到怪兽静态属性，无法围绕下一步风险做计划。

这次改动的目标是把“怪兽下一步会做什么”变成战斗状态的一部分：

```text
当前
════
玩家看手牌和怪兽属性
  │
  ▼
玩家出牌
  │
  ▼
怪兽即时随机攻击/技能

目标
════
回合开始生成 monsterIntent
  │
  ▼
玩家看意图 + 预计伤害 + 技能风险
  │
  ▼
玩家出牌
  │
  ▼
怪兽按已展示意图执行
```

核心原则：意图不是额外 UI 文案，而是怪兽行动的来源。UI 展示、结构化事件、存档和测试都围绕同一个 `monsterIntent`。

## Goals / Non-Goals

**Goals:**

- 每个 `playerAction` 阶段都存在一个可展示、可存档、可执行的怪兽意图。
- 怪兽行动 MUST 执行当前意图，不能在执行时重新随机出与展示不一致的行动。
- 意图 MUST 覆盖攻击类型、预计伤害、将触发的技能、狂暴倍率、展示文本。
- 玩家能在怪兽面板看到下一行动和技能风险，在卡牌上看到紧凑的结果预估。
- 旧存档缺少意图时，加载后生成安全可执行意图。
- 测试能确定性验证“生成什么意图，就执行什么行动”。

**Non-Goals:**

- 不新增卡牌类型、怪兽类型、奖励系统或牌组构筑。
- 不改变怪兽基础属性成长、卡牌生成权重或元素倍率。
- 不引入动画时间轴、异步战斗队列或外部状态机依赖。
- 不要求意图完全暴露所有随机数细节；例如暴击只展示预计非暴击伤害和暴击风险，不提前决定暴击。

## Decisions

### Decision 0: Put intent helpers in `src/renderer/src/game/monster-intent.ts`

Create one new pure helper module:

```text
src/renderer/src/game/monster-intent.ts
```

This file owns:

- `generateMonsterIntent(input)`
- `previewDamage(input)`
- `estimateCardOutcome(battle, card)`
- small lookup helpers such as `getTriggeredIntentSkill(intent, type, timing)`

`game-engine.ts` should import these helpers and remain responsible for battle state transitions. `battle-calculator.ts` should continue to own actual random damage resolution. `monster-intent.ts` may reuse constants and pure element multiplier logic, but it MUST NOT import Vue, Pinia, Electron, stores, or UI components.

Rationale: keeping intent generation and previews outside `game-engine.ts` makes the new behavior easier for another agent to test in isolation and keeps the battle engine from becoming a long mixed-purpose file.

Alternative considered: append helper functions to `game-engine.ts`. Rejected because this change adds enough pure logic that a focused module is clearer.

### Decision 1: Store intent directly on BattleState

Add a new field:

```ts
interface BattleState {
  monsterIntent: MonsterIntent
}
```

Recommended shape:

```ts
type MonsterIntentAction = 'attack'

interface MonsterIntent {
  id: string
  turn: number
  source: 'generated' | 'restored'
  action: MonsterIntentAction
  attackType: 'physical' | 'magic'
  baseAttack: number
  estimatedDamage: number
  critDamage: number
  critRate: number
  element: Element
  enrageMultiplier: number
  skills: MonsterIntentSkill[]
  message: string
}

interface MonsterIntentSkill {
  type: MonsterSkillType
  timing: IntentSkillTiming
  immuneElement?: Element
  willTrigger: boolean
  label: string
}
```

`id` MUST be deterministic and human-readable enough for debugging. Use this format:

```text
intent-turn-{turn}-{sequence}
```

The sequence can be a module-local counter or a value derived from event id generation. It does not need to be globally unique across different app launches, but it MUST be unique within a battle event history.

Rationale: storing intent in `BattleState` makes it visible to UI, serializable for saves, and available to the engine without recomputation.

Alternative considered: compute intent in UI from monster stats. Rejected because UI would only be guessing; the engine could still diverge.

### Decision 2: Generate intent at battle creation and after each turn advancement

Intent lifecycle:

```text
createBattle(level, hero)
  └─ generateMonsterIntent(initial battle)

finishTurn(state)
  ├─ increment turn
  ├─ draw cards
  └─ generateMonsterIntent(next player-action state)

restoreSave(data)
  └─ if missing monsterIntent and battle is active/non-game-over, generate restored monsterIntent
```

Intent MUST be refreshed only when a new player action phase begins. It MUST NOT change while the player is deciding which card to play.

The generation input MUST be an explicit parameter object, not a loose `stateLike`:

```ts
interface GenerateMonsterIntentInput {
  level: number
  hero: Hero
  monster: Monster
  currentTurn: number
  maxTurns: number
  isEnraged: boolean
  source?: 'generated' | 'restored'
}

function generateMonsterIntent(input: GenerateMonsterIntentInput): MonsterIntent
```

Use `source: 'generated'` by default. `restoreSave()`/`normalizeBattleState()` should pass `source: 'restored'` only when filling a missing intent from an old active save.

### Decision 3: Decide skill triggers during intent generation

Monster skills currently roll during action resolution. With intent, roll these during intent generation:

- `critBoost`: shown as a triggered skill and applied to the monster attack.
- `lifesteal`: shown as a triggered skill and applied after damage.
- `stun`: shown as a triggered skill and applied after damage.
- `shield`: shown as a defensive risk for the player's upcoming action and applied if the hero attacks this turn.
- `elementImmune`: shown as a defensive risk with immune element and applied if the hero attacks this turn.

This creates two skill categories:

```ts
type IntentSkillTiming = 'monsterAction' | 'heroActionDefense'
```

Hero-action defensive skills (`shield`, `elementImmune`) have a turn-scoped lifetime:

- If the player uses an attack card, triggered defensive skills are applied to that attack.
- If the player uses a heal card, stat boost card, or skip, triggered defensive skills expire unused at the end of the turn.
- They MUST NOT carry over to the next turn.
- They are not "consumed" as mutable state inside the same intent; instead the whole intent is consumed when the monster action resolves or the battle ends.

This means the implementation does not need to mutate `intent.skills[].willTrigger` after hero action. It only needs to use triggered defensive skills when resolving an attack card and ignore them otherwise.

Rationale: players need to know both “what monster will do to me” and “what defenses may affect my card this turn”. Keeping both in one intent avoids a second hidden random system.

Alternative considered: only preview monster attack and leave defensive skills random. Rejected because shield/element immunity are some of the most decision-relevant effects.

### Decision 4: Use preview damage without consuming crit randomness

`estimatedDamage` should be deterministic:

- Use monster attack type from intent.
- Use monster current stats, hero defense, enrage multiplier.
- Use `critBoost` to calculate `critDamage`, but do not treat crit as guaranteed unless the existing crit roll actually crits during execution.
- Do not call `Math.random()` for crit during preview.

Recommended helper:

```ts
interface DamagePreview {
  baseDamage: number
  afterDefense: number
  elementMultiplier: number
  estimatedDamage: number
  critDamage: number
  critRate: number
  critMultiplier: number
}

previewDamage(params): DamagePreview
```

Implementation can reuse the same formula constants as `calculateDamage`, but MUST not roll crit.

UI display rule:

- Normal preview text SHOULD be `预计 {estimatedDamage}`.
- If `critRate > 0`, append `暴击 {critRate}% → {critDamage}` in compact form.
- If `critBoost` is triggered, label the crit line as `强化暴击`.

Example compact strings:

```text
预计 18
预计 18 | 暴击15%→27
预计 18 | 强化暴击15%→36
```

### Decision 5: Execute monster action from intent

`resolveMonsterAction(state)` should no longer choose attack type or skill triggers itself. It should read:

```ts
const intent = state.monsterIntent
```

Then:

- Use `intent.attackType` to choose physical/magic attack.
- Use `intent.skills` to apply `critBoost`, `lifesteal`, and `stun`.
- Use `intent.enrageMultiplier`.
- Emit events that include `intentId`.

Hero-side defensive effects (`shield`, `elementImmune`) should be used during `resolveHeroAction` from the same intent, so the card outcome matches what UI preview showed.

If the player does not attack, defensive intent skills expire unused when the turn resolves. The monster action still executes the same intent for its `monsterAction` skills and attack.

### Decision 6: Keep card estimates UI-facing and derived

Do not store card estimates in `BattleState`, because they depend on current hand + current hero + current monster + current intent and can be derived in UI/computed helpers.

Recommended helper:

```ts
estimateCardOutcome(battle: BattleState, card: Card): CardOutcomeEstimate
```

Suggested output:

```ts
type CardOutcomeEstimate =
  | {
      type: 'damage'
      amount: number
      critDamage: number
      critRate: number
      critLabel: '暴击' | '强化暴击'
      elementMultiplier: number
      isBlockedByStun: false
      isShielded: boolean
      isImmune: boolean
      text: string
    }
  | {
      type: 'blocked'
      reason: 'stun'
      isBlockedByStun: true
      text: '眩晕中'
    }
  | { type: 'heal'; amount: number; text: string }
  | { type: 'statBoost'; stat: keyof Stats; amount: number; text: string }
```

For stunned attack cards, show the blocked state text `眩晕中`; do not show `0` damage, because the card does not resolve as a damage action.

### Decision 7: Add intent events but keep logs readable

Add structured events:

- `intentCreated`: emitted when a new intent is generated.
- `intentConsumed`: emitted when monster action executes the intent.

These events should not spam the battle log unless useful. The monster panel can read `battle.monsterIntent` directly, while the battle log can record execution events such as damage, skill triggered, heal, and status as today.

Default logging policy:

- `intentCreated` should be stored in `events` but hidden from `BattleLog`.
- `intentConsumed` should be stored in `events` but hidden from `BattleLog`.
- Skill, damage, heal, status, skip, turn advancement, and battle-ended events keep existing log behavior.

### Decision 8: Do not introduce Vue component test dependencies in this change

The current project test setup uses Vitest for pure unit tests and does not include `@vue/test-utils` or JSDOM component tests. This change MUST NOT add those dependencies solely for MonsterIntent UI checks.

Validation strategy:

- Cover all intent generation, resolution, restore, and preview formatting with pure unit tests.
- Cover UI rendering through build/type-check plus manual smoke checklist.
- If another change later introduces component testing infrastructure, this UI can be backfilled with component tests then.

Rationale: the feature risk is mostly in battle state and formula consistency; adding a new frontend test stack would expand scope beyond the gameplay change.

### Decision 9: Old save intent recovery rules

`normalizeBattleState()` should generate a missing `monsterIntent` only when all of these are true:

- `battle.gameOver` is false.
- `battle.phase` is missing or equals `playerAction`.
- `battle.hero`, `battle.monster`, and `battle.currentTurn` are present.

For non-player active phases in old saves, normalize phase to `playerAction` first, because prior saves did not persist intermediate async phases and the old engine was effectively synchronous from the player's perspective.

Generated recovery intent MUST set `source: 'restored'`. Normal new-turn intents MUST set `source: 'generated'`.

## Risks / Trade-offs

- [Risk] Intent makes combat less surprising → Mitigation: show action and triggered skills, but keep crit roll probabilistic; use Boss/enrage pressure for tension.
- [Risk] Defensive skills are awkward because they affect hero action before monster action → Mitigation: model intent skills with `timing`, apply them only to same-turn attack cards, and expire them unused on heal/stat boost/skip.
- [Risk] Existing tests rely on immediate random monster action → Mitigation: update tests to assert intent generation and execution consistency; use 100%/0% skill trigger chances.
- [Risk] Old saves have no `monsterIntent` → Mitigation: normalize active restored battles by generating an intent from restored state.
- [Risk] Card estimates diverge from actual damage → Mitigation: use shared preview helper and test estimate vs actual non-crit damage with deterministic inputs.
- [Risk] UI gets too crowded → Mitigation: keep monster intent as a compact row/panel in `MonsterStatus`, and card estimates as one short line per card.

## Migration Plan

1. Add types and pure helpers behind existing behavior.
2. Add `monsterIntent` to newly created battles.
3. Update monster action resolution to consume intent.
4. Add restore fallback for old saves.
5. Add UI display and card estimates.
6. Expand tests, then run `npm run test` and `npm run build`.

Rollback is straightforward: revert the change and old saves remain readable because the new field is additive.
