## Why

当前战斗规则存在语义不一致：元素免疫的实现、测试与描述不一致，吸血效果的触发对象与设计描述不一致，眩晕后的跳过行为也更像免费换牌而不是一次完整回合推进。这些问题会让后续新增卡牌、怪兽技能和玩法系统时不断扩大隐性复杂度。

在加入新玩法前，需要先稳定战斗规则契约和状态结构，让战斗引擎、UI 表现、存档与测试对同一套语义达成一致。

## What Changes

- 明确回合推进语义：玩家行动、怪兽反击、状态结算、抽牌、进入下一回合。
- 明确眩晕语义：眩晕限制玩家下一次攻击行动；当没有可用行动时，跳过仍应进入怪兽反击与回合结算。
- 明确元素免疫语义：元素免疫使对应元素的克制/被克关系无效，而不是将伤害降为最低值。
- 明确吸血语义：吸血由怪兽造成实际伤害后恢复自身生命，而不是怪兽受到英雄伤害后恢复。
- 调整战斗状态结构，使 BattleState 成为单场战斗事实来源，并显式记录关卡、阶段、结果与状态效果。
- 引入结构化战斗事件，UI 文本、飘字、闪烁、战斗日志从事件派生，而不是从中文日志字符串反向解析。
- 更新测试覆盖规则契约，特别是元素免疫、吸血、眩晕、跳过回合、回合阶段推进和事件输出。

## Capabilities

### New Capabilities

- `battle-rule-semantics`: Defines canonical battle rule behavior for turn progression, stun, skip, element immunity, lifesteal, enrage, and victory/defeat resolution.
- `battle-state-model`: Defines the canonical battle state shape, ownership boundaries between run-level hero state and in-battle hero state, and save/restore expectations.
- `battle-event-log`: Defines structured battle events used by UI logs, floating numbers, damage flashes, and future battle presentation.

### Modified Capabilities

## Impact

- `src/renderer/src/game/game-engine.ts` — Rule sequencing, turn progression, skip behavior, lifesteal, stun handling, state transitions.
- `src/renderer/src/game/battle-calculator.ts` — Element immunity semantics and damage result metadata.
- `src/renderer/src/game/types.ts` — Battle phase, battle result, status effects, and structured battle event types.
- `src/renderer/src/stores/game-store.ts` — Synchronization between run-level hero state and battle-level state, save payload shape.
- `src/renderer/src/views/BattleView.vue` and battle UI components — Consume structured events instead of parsing log messages for animation triggers.
- `tests/game/*` — Rule and state contract tests updated to match the canonical semantics.
- Save files may need tolerant restore behavior for older saves that lack new state/event fields.
