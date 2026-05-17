## Why

战斗内核已经稳定，下一步应当先提升每回合出牌选择的信息量，而不是直接堆叠更多卡牌或怪兽内容。怪兽意图系统让玩家在出牌前知道怪兽将要采取的大致行动，从而把选择从“哪张牌数值最高”推进到“根据风险做取舍”。

这个变化也会复用已稳定的 `BattleState.phase`、结构化事件、技能语义和回合推进顺序，是在现有内核上叠玩法的低风险第一步。

## What Changes

- 新增怪兽意图模型：每个玩家行动阶段前，战斗状态中 MUST 有当前怪兽意图。
- 怪兽行动从“反击时即时随机”改为“按当前意图执行”，保证 UI 展示与实际行动一致。
- 意图 MUST 包含行动类型、攻击类型、预计伤害、将尝试触发的技能、狂暴倍率和可展示文本。
- 怪兽技能触发从行动时临时多次随机改为意图生成时决策；怪兽行动技能按意图执行，防御技能只在本回合攻击中生效或过期。
- 新增 UI 展示：怪兽面板展示下一行动、预计伤害、技能风险和 Boss 狂暴倒计时/倍率。
- 新增卡牌预估：攻击卡显示对当前怪兽的预计非暴击伤害，并在有暴击概率时显示暴击风险；治疗卡显示预计治疗量；属性提升卡保留强化摘要。
- 保持存档兼容：旧存档的非 gameOver 活跃战斗缺少怪兽意图时，加载后 MUST 生成 `source: restored` 的安全意图。
- 新增测试覆盖：意图生成、意图执行一致性、存档恢复、UI 数据派生、卡牌预估。

## Capabilities

### New Capabilities

- `monster-intent-generation`: Defines how the game generates, stores, refreshes, and restores monster intent for each player action phase.
- `monster-intent-resolution`: Defines how monster actions execute from the stored intent and emit structured events that match the preview.
- `battle-decision-preview`: Defines UI-facing decision preview data for monster intent, Boss enrage pressure, and card outcome estimates.

### Modified Capabilities

- `battle-rule-semantics`: Monster action resolution changes from immediate random choice to executing the previously generated intent.
- `battle-state-model`: Battle state gains persistent monster intent and restore defaults.
- `battle-event-log`: Structured events include intent-related preview/consumption metadata so logs and UI remain consistent.
- `battle-ui-layout`: Monster status UI gains an intent panel and card UI gains compact outcome estimates.

## Impact

- `src/renderer/src/game/types.ts` — Add `MonsterIntent`, intent action/skill types, preview metadata, and card estimate types.
- `src/renderer/src/game/monster-intent.ts` — Add pure intent generation, deterministic damage preview, and card outcome estimate helpers.
- `src/renderer/src/game/game-engine.ts` — Generate intent, execute intent, refresh intent after turn advancement, and emit intent-related events.
- `src/renderer/src/game/battle-calculator.ts` — Support deterministic preview calculations without consuming random crit rolls.
- `src/renderer/src/game/card-pool.ts` — No card generation changes expected, but card preview consumers use generated card data.
- `src/renderer/src/stores/game-store.ts` — Normalize old saves by generating missing monster intent.
- `src/renderer/src/components/MonsterStatus.vue` — Display current intent and Boss pressure.
- `src/renderer/src/components/CardComponent.vue` / `CardHand.vue` — Display card outcome estimates.
- `src/renderer/src/views/BattleView.vue` — Pass monster/battle preview data into card and monster UI.
- `tests/game/*` — Add deterministic unit tests for generation, resolution, save restore, and preview calculations.
