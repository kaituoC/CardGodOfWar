## Why

当前战斗页面布局信息层级混乱，属性展示拥挤且操作按钮位置不合理，影响游戏体验。同时存在两个功能性 bug：眩晕状态下全部手牌为攻击卡时游戏死锁无法继续，以及怪兽的"属性免疫"技能未生效，影响战斗平衡。

## What Changes

- 重构战斗页面整体布局：顶部状态栏居中精简、英雄/怪兽面板改为网格属性展示 + 彩色技能标签、操作按钮移至左下角横条区域
- 修复眩晕状态下的游戏卡死问题：眩晕时跳过英雄回合但仍能推进回合，或提供"跳过回合"按钮
- 修复属性免疫技能：怪兽技能中的元素免疫应在伤害计算时跳过该元素的克制/被克倍率

## Capabilities

### New Capabilities
- `battle-ui-layout`: 战斗页面全新布局，包括状态栏居中、属性网格、技能标签、操作按钮区域
- `stun-game-lock-fix`: 眩晕状态下防止游戏死锁的机制
- `element-immunity-fix`: 属性免疫技能在伤害计算中生效

### Modified Capabilities

## Impact

- `src/renderer/src/views/BattleView.vue` — 布局重构
- `src/renderer/src/components/StatusBar.vue` — 居中、精简
- `src/renderer/src/components/HeroStatus.vue` — 网格属性展示
- `src/renderer/src/components/MonsterStatus.vue` — 网格属性、技能标签、元素信息
- `src/renderer/src/game/battle-calculator.ts` — 属性免疫逻辑
- `src/renderer/src/game/game-engine.ts` — 眩晕回合处理
- `src/renderer/src/styles/global.scss` — 新增布局样式
