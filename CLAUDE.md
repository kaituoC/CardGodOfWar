# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**Card God Of War**（卡牌战神）是一款 Electron 桌面卡牌对战游戏，使用 Vue 3 + TypeScript + Pinia 构建。玩家通过出牌（攻击/治疗/属性提升/防御/战术）在回合制战斗中击败不断升级的怪兽；胜利后从奖励中三选一（属性/遗物/卡牌偏向），借助遗物与状态机制（护盾/破甲/虚弱/眩晕）塑造构筑，角色持续成长。

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Electron 38 |
| 前端 | Vue 3.5 + TypeScript |
| 状态管理 | Pinia 3 |
| 样式 | SCSS |
| 构建 | Vite 6 + vite-plugin-electron |
| 打包 | electron-builder 26 |
| 测试 | Vitest 3 |
| 类型检查 | vue-tsc 2 |

## 目录结构

```
src/
  main.ts                    # Electron 主进程（存档/读档 IPC 处理器）
  preload.ts                 # Electron 预加载脚本（向渲染进程暴露 electronAPI）
  renderer/
    index.html               # 入口 HTML
    src/
      main.ts                # Vue 应用入口（创建 Pinia）
      App.vue                # 根组件，在菜单/战斗视图间切换
      views/
        MainMenuView.vue     # 主菜单：新游戏、继续游戏、手动存档加载
        BattleView.vue       # 战斗界面：状态栏、手牌、战斗日志（双列 flex 布局）
      components/
        HeroStatus.vue       # 英雄血量/属性显示
        MonsterStatus.vue    # 怪兽血量/元素/技能/意图显示
        CardHand.vue         # 可出牌手牌 UI（居中 flex-wrap 布局）
        CardComponent.vue    # 单张卡牌渲染（类型色 accent + 固定布局区域）
        StatusBar.vue        # 顶部栏：关卡、回合数、Boss/狂暴指示器
        BattleLog.vue        # 可滚动的战斗日志
        ResultDialog.vue     # 胜负弹窗，重试/下一关/返回选项
        RewardDialog.vue     # 胜利奖励三选一弹窗
        SaveDialog.vue       # 手动存档槽位选择
        DamageNumbers.vue    # 浮动伤害数字容器
      stores/
        game-store.ts        # Pinia store：游戏状态、操作、通过 IPC 存档/读档
      game/
        types.ts             # 全部 TypeScript 接口定义
        constants.ts         # 游戏平衡数值（属性、倍率、间隔等）
        game-engine.ts       # 核心战斗逻辑：创建战斗、出牌、怪兽反击
        battle-calculator.ts # 伤害计算公式（防御、破甲、元素、暴击、护盾、虚弱、遗物、狂暴）
        relic-effects.ts     # 遗物效果解析单一来源，执行(calculateDamage)与预览(previewDamage)共用
        monster-intent.ts    # 怪兽意图生成 + 卡牌预览估算
        floating-numbers.ts  # 浮动伤害数字叠加层
        card-pool.ts         # 卡牌生成，按类型/星级/系数加权随机（含卡牌偏向）
        monster-generator.ts # 怪兽属性随关卡/原型缩放及技能分配
        reward-generator.ts  # 胜利奖励生成（属性/遗物/卡牌偏向，三选一）
      styles/
        global.scss          # 全局 CSS 重置和主题变量
tests/
  game/
    battle-calculator.test.ts
    game-engine.test.ts
    monster-intent.test.ts   # 意图预览、估算隔离、狂暴伤害匹配测试
    new-features.test.ts     # 奖励/遗物/状态/防御卡/原型/卡牌偏向覆盖
    relic-effects.test.ts    # 遗物解析契约 + 预览/执行一致性
  stores/
    game-store.test.ts       # 奖励应用、关卡门禁、存档恢复 pending reward
```

## 常用命令

```bash
npm run dev            # 开发服务器（Vite + Electron 热重载）
npm run build          # 类型检查 + 生产构建
npm run preview        # 预览生产构建
npm run pack           # 构建未打包的 app（用于测试）
npm run dist           # 构建当前平台的安装包
npm run dist:mac       # 构建 macOS ZIP
npm run dist:win       # 构建 Windows NSIS + ZIP
npm run dist:linux     # 构建 Linux AppImage + DEB
npm run test           # 运行一次 Vitest 测试
npm run test:watch     # Vitest 监听模式
```

打包输出到 `release/` 目录。

### 打包配置（`electron-builder.json`）

| macOS | ZIP | dmg 构建需要 macOS 13+，当前环境用 zip |
| Windows | NSIS + ZIP | NSIS 支持自定义安装路径、快捷方式 |
| Linux | AppImage + DEB | AppImage 免安装运行，DEB 系统安装 |

## 开发工作流（标准流程）

每个需求一条分支，**完整流程为规格驱动开发（SDD），由 OpenSpec 工具全程串起：explore → propose → apply → archive**。按改动大小**分级**：新功能 / 较大需求走完整流程，小修复 / 文档类走简化流程。标 **⚠️** 的是**确认卡点，必须停下征得用户同意后才能继续**；外发动作（push / 创建 PR / 合并 PR / 打 tag / 发布）一律不自作主张。分支命名：`feature/<功能>`、`fix/<问题>`、`docs/*`、`chore/*`。

### 完整流程（新功能 / 较大需求）

1. **需求澄清 / 探索** `/opsx:explore` — 厘清意图、方案与关键决策。
2. **提案** `/opsx:propose` — 生成 proposal / design / specs / tasks。
3. **建分支** — 先 `git checkout master && git pull origin master` 同步远程，再开 `feature/<名>`（避免基于落后代码建分支）。
4. **实现** `/opsx:apply` — 按 tasks 逐项落地并勾选；改动前先勘察现状，遵循既有约定，复杂逻辑配套测试。
5. **自测（门禁，必做）**：
   - `npm test` —— 全部通过；依赖 `Math.random` 的测试连跑 5+ 次确认非 flaky。
   - `npx vue-tsc --noEmit` —— 类型检查（沙箱内可跑）。
   - `npm run build` —— 完整构建（`vite build` 需关沙箱）；必要时 `npm run dev` 手动验证。
6. **代码审查** `/code-review`（high）— 修复高优先级问题后回到第 5 步复测。
7. **文档** — 同步 `README.md` / `README_zh.md` / 本文件。
8. **版本号 ⚠️** — push / PR 前确认是否升版本：新功能升次版本（0.3.0 → 0.4.0），修复升修订号（0.3.0 → 0.3.1），改 `package.json`。
9. **归档** `/opsx:archive` — delta 合并进 `openspec/specs/`，change 移入 `archive/`。
10. **提交** — 默认分支先开分支；按主题分组 commit（feat / fix / test / docs / ci），message 以 `Co-Authored-By` 结尾。
11. **Push + PR ⚠️** — 用户确认后 push 并 `gh pr create`（结构化 body）；**不擅自合并 PR**。
12. **Release ⚠️（仅发版时）** — PR 合并后打 `vX.Y.Z` tag → CI workflow 三平台构建并创建 GitHub Release → 用中文覆盖 Release 文案。

### 简化流程（小修复 / 文档类）

跳过探索、提案、归档（第 1-2、9 步）；保留：建分支 → 实现 → 自测 → 文档（按需）→ 版本号 ⚠️ → 提交 → Push + PR ⚠️。

### 确认卡点（⚠️）汇总

升版本号、push / 创建 PR、发布 release 之前必须先征得用户同意；**任何情况下都不擅自合并 PR**。

### 贯穿全程的硬性约定

- **沙箱**：`vite build`、`npm install` 等需关闭沙箱运行（沙箱会报误导性的模块解析 / 权限错误）；`npm test` 与 `vue-tsc` 可在沙箱内跑。
- **本地网络**：dev server 统一用 `127.0.0.1`（vite 默认绑 IPv6 `::1`，会与 wait-on/electron 的 IPv4 探测不匹配，导致窗口不弹）。
- **发布文案**：Release notes 用中文；当前 gh 无 `release edit` 子命令，经 `gh api -X PATCH repos/<owner>/<repo>/releases/{id}` 更新标题与正文。
- **测试稳定性**：眩晕清除类测试必须使用无技能怪兽并重新生成 intent，否则怪兽随机反击会重新眩晕英雄，导致断言 flaky。

## 架构

### 数据流

```
MainMenuView  →  gameStore.startNewGame()  →  createBattle()  →  BattleState
BattleView    →  gameStore.playCardAction() →  playCard()      →  calculateDamage()
                  ↓
              battleState 更新（Pinia 响应式）
                  ↓
              Vue 组件重新渲染
```

### 游戏引擎（`game-engine.ts`）

- **`createInitialHero()`** — 使用 `HERO_INITIAL_STATS` 创建初始英雄
- **`createBattle(level, hero)`** — 生成怪兽 + 卡牌，返回 `BattleState`
- **`playCard(state, card)`** — 处理攻击/治疗/属性提升，然后触发 `monsterCounterAttack()`
- **`monsterCounterAttack()`** — 怪兽反击，判定眩晕等技能，推进回合
- **`applyVictoryGrowth(hero)`** — 胜利后永久提升英雄属性
- Boss 在第 15 回合后进入狂暴，每回合伤害递增

### 伤害计算（`battle-calculator.ts`）

伤害管线：`攻击 × 系数 → 减去防御 → 元素倍率 (0/0.5/1.0/1.5) → 暴击判定 (1.5× 或 2.0×) → 护盾 (0.5×) → 狂暴（仅怪兽） → 向下取整到 MIN_DAMAGE=1`

### 怪兽意图系统（`monster-intent.ts`）

怪兽每回合开始前生成 `MonsterIntent`，包含攻击类型、预估伤害、暴击伤害、技能触发等。意图生命周期：

1. **生成**：`generateMonsterIntent()` 在 `playCard()` 或 `monsterCounterAttack()` 后调用，计算下一回合怪兽行动
2. **消费**：`estimateCardOutcome()` 读取 `battle.monsterIntent` 为每张手牌生成 `CardOutcomeEstimate` 预览
3. **刷新**：怪兽行动后旧意图被新意图替换

**关键约束**：
- 狂暴倍率应用于 `estimatedDamage` 和 `critDamage`，但不影响英雄卡牌估算
- 怪兽 `critBoost` 不影响英雄卡牌的暴击预览（`isCritBoost = false` in `estimateCardOutcome`）
- 治疗卡牌估算受英雄缺失 HP 限制（`Math.min(rawHeal, maxHp - currentHp)`）
- `CardOutcomeEstimate` 是判别联合类型，包含 `damage | blocked | heal | statBoost | unavailable` 五种分支
- `unavailable` 分支用于 `missingIntent` 或 `gameOver` 时攻击卡的降级展示

**预览 vs 执行一致性**：`previewDamage` 中暴击伤害基于 floored `estimatedDamage` 计算，与 `calculateDamage` 的实际执行结果可能有 ±1 差异。这是已知可接受的舍入偏差。

### 浮动伤害数字（`floating-numbers.ts`）

轻量叠加层系统，通过 `pushDamageNumber()` 向 `DamageNumbers.vue` 组件注入浮动数字，800ms 后自动移除。类型包括 `damage | heal | crit | element`，不影响布局流。

### 战斗布局

`BattleView.vue` 使用 flex 双列布局：左侧决策区（手牌 + 操作栏）+ 右侧战斗日志。操作栏从 `position: absolute` 改为 `flex-shrink: 0` 正常流布局。响应式断点 900px 时日志区域堆叠到决策区下方。

### 遗物效果解析（`relic-effects.ts`）

所有"出伤/暴击/护盾/治疗溢出/下回合/破防/战斗开始"类遗物效果在此单一解析，数值来自 `RELIC_REGISTRY.effect`。执行（`battle-calculator.ts` / `game-engine.ts`）与预览（`monster-intent.ts` 的 `previewDamage`）共用同一组 `resolve*` 函数，避免两侧逻辑漂移。新增这类遗物只需在 `RELIC_REGISTRY` 注册并补一个解析分支，调用方无需改动。`calculateDamage` / `previewDamage` 通过 `attackerRelics` 接收英雄遗物列表，而非逐个布尔参数。

### 注意事项

- 元素/属性/技能显示标签统一在 `constants.ts` 的 `ELEMENT_LABELS`、`STAT_LABELS`、`SKILL_LABELS`，各处（组件与游戏逻辑）引用同一份，修改名称只需改这里
- `monsterIntent` 在 `BattleState` 中类型为 `MonsterIntent | null`：活跃战斗中始终存在，战斗结束或旧存档恢复时可能暂时为 null，消费点（`resolveMonsterAction`、`estimateCardOutcome`、`MonsterStatus.vue`）均已防御处理
- 战斗事件 id 形如 `event-<会话种子>-<序号>`，会话种子保证读档后追加的新事件不与存档中的旧事件 id 冲突

### 状态管理（`game-store.ts`）

单一 Pinia store 管理全部游戏状态：
- `level`、`hero`、`currentBattle`、`view`（menu/battle）
- 通过 Electron IPC 存档/读档，路径 `~/.cardgodofwar/saves/`
- 战斗开始和每次出牌后自动存档
- 3 个手动存档槽 + 1 个自动存档槽

### 存档系统

- 主进程（`main.ts`）处理 IPC：`save-game`、`load-game`、`has-auto-save`、`list-saves`
- 存档以 JSON 格式存储在 `~/.cardgodofwar/saves/`
- 存档格式：`{ level, hero, battleState, timestamp }`

### 路径别名

`@` 解析为 `src/renderer/src/`（在 `vite.config.ts` 和 `vitest.config.ts` 中配置）
