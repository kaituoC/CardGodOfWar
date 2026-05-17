## 1. 布局重构 — 顶部状态栏

- [x] 1.1 修改 `StatusBar.vue`：内容居中（`justify-content: center`），移除怪兽元素信息
- [x] 1.2 增大状态栏字体，数字用红色醒目显示
- [x] 1.3 从 `BattleView.vue` 中移除传给 `StatusBar` 的 `monster-element` prop

## 2. 布局重构 — 英雄/怪兽面板

- [x] 2.1 修改 `HeroStatus.vue`：属性改为 2×2 网格布局（`display: grid`），标题居中并用绿色区分
- [x] 2.2 修改 `MonsterStatus.vue`：属性改为 2×2 网格布局，标题居中并用红色区分
- [x] 2.3 `MonsterStatus.vue`：元素克制信息整合到属性网格的第四格
- [x] 2.4 `MonsterStatus.vue`：技能从纯文字改为彩色标签样式（badge）
- [x] 2.5 为英雄和怪兽面板标题添加对应 CSS 类（`hero-title` / `monster-title`）

## 3. 布局重构 — 战斗页面整体

- [x] 3.1 重构 `BattleView.vue` 布局：左侧面板不再用 `gap`，卡牌区占满剩余空间
- [x] 3.2 新增底部操作条容器：绝对定位在左侧面板底部，横跨整个左侧面板宽度
- [x] 3.3 将"保存"/"回主菜单"按钮移入底部操作条
- [x] 3.4 更新全局样式 `global.scss` 或 `BattleView.vue` scoped 样式以支持新布局

## 4. Bug 修复 — 元素免疫技能

- [x] 4.1 修改 `battle-calculator.ts`：元素免疫时将 `elementMultiplier` 设为 `1.0`（当前错误地设为 `0`）
- [x] 4.2 验证修复后免疫元素攻击不受克制/被克影响但正常计算防御和暴击

## 5. Bug 修复 — 眩晕死锁

- [x] 5.1 修改 `CardHand.vue`：眩晕时攻击卡牌显示禁用状态（添加 `disabled` class 或 prop）
- [x] 5.2 修改 `CardHand.vue`：眩晕且手牌全为攻击卡时显示"跳过回合"按钮
- [x] 5.3 修改 `game-engine.ts` 的 `playCard()`：新增处理逻辑，当玩家点击跳过按钮时推进回合并重新生成手牌
- [x] 5.4 在 `BattleView.vue` 中传递跳过事件到 `gameStore`

## 6. 验证与清理

- [x] 6.1 启动开发服务器验证新布局渲染正确
- [x] 6.2 测试眩晕状态下跳过回合功能正常工作
- [x] 6.3 测试元素免疫技能在战斗日志中正确反映（倍率为 1.0）
- [x] 6.4 删除 `layout-preview.html` 静态预览文件
