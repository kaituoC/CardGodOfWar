## Why

怪兽意图系统已经让战斗选择有了可读信息，但当前页面布局和卡牌视觉仍偏“功能堆叠”：卡牌颜色、尺寸、预估文本和操作区层级不够稳定，玩家很难快速扫出“伤害/治疗/强化/不可用”的差异。与此同时，代码 review 发现少数预估值可能和真实执行不一致；在继续叠玩法前，需要先把“玩家看到的内容可信且好读”定稳。

## What Changes

- 校准决策预览：Boss 狂暴意图预估 MUST 包含狂暴倍率；英雄攻击卡预估 MUST NOT 使用怪兽 `critBoost`；治疗卡预估 MUST 显示实际可恢复 HP。
- 提升无意图/结束战斗的安全性：缺少 `monsterIntent` 或战斗已结束时，卡牌预估 MUST 安全降级，不能导致页面崩溃。
- 优化战斗页面布局：重排顶部状态、双方状态面板、手牌区、战斗日志和操作按钮，让主要决策区更集中，避免卡牌和底部操作栏互相挤压。
- 优化卡牌视觉系统：为攻击、治疗、强化、不可用状态建立稳定的颜色语义、尺寸、内边距、标题区、数值区、预估区和操作区。
- 优化卡牌位置与响应式行为：手牌区 MUST 在桌面窗口中居中排列，在窄窗口中允许自然换行或缩放，且不遮挡战斗操作按钮。
- 优化交互状态：卡牌 hover/pressed/disabled/stunned 状态 MUST 可见且不造成布局跳动；眩晕中的攻击卡在预估区显示 `眩晕中`，操作区使用中性不可用状态，避免重复文案。
- 保持范围克制：不新增卡牌类型、怪兽机制、奖励机制或复杂动画系统。

## Capabilities

### New Capabilities

- `battle-visual-hierarchy`: Defines the battle page visual hierarchy, panel placement, spacing, and responsive layout behavior.
- `card-visual-system`: Defines card colors, sizes, internal layout, state styling, and preview text presentation.

### Modified Capabilities

- `battle-decision-preview`: Preview values and fallback states must be corrected so displayed estimates match execution assumptions and never crash on missing intent.
- `battle-ui-layout`: Existing battle UI layout requirements are tightened to include hand positioning, action bar separation, and readable status/log balance.

## Impact

- `src/renderer/src/game/monster-intent.ts` — Correct preview math and safe fallback behavior.
- `src/renderer/src/game/types.ts` — Add a small `unavailable` estimate branch if needed for missing intent or game-over fallback.
- `src/renderer/src/components/CardComponent.vue` — Update card structure, colors, dimensions, estimate line, and disabled/stunned styles.
- `src/renderer/src/components/CardHand.vue` — Update hand layout, wrapping/spacing behavior, and estimate guarding.
- `src/renderer/src/components/MonsterStatus.vue` / `HeroStatus.vue` / `StatusBar.vue` — Adjust layout and text hierarchy where needed.
- `src/renderer/src/views/BattleView.vue` — Rebalance battle content columns, hand area, log panel, and bottom actions.
- `src/renderer/src/styles/global.scss` — Add or normalize reusable colors/spacing only if this matches existing style conventions.
- `tests/game/*` — Add unit coverage for preview corrections and safe fallback states.
- Manual smoke checks — Verify desktop and narrow-window layouts, card readability, stunned state, Boss enrage preview, and save/load restored battles.
