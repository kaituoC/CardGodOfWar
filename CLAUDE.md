# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**Card God Of War**（卡牌战神）是一款 Electron 桌面卡牌对战游戏，使用 Vue 3 + TypeScript + Pinia 构建。玩家通过出牌（攻击/治疗/属性提升）在回合制战斗中击败不断升级的怪兽，角色属性随胜利持续增长。

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
        BattleView.vue       # 战斗界面：状态栏、手牌、战斗日志
      components/
        HeroStatus.vue       # 英雄血量/属性显示
        MonsterStatus.vue    # 怪兽血量/元素/技能显示
        CardHand.vue         # 可出牌手牌 UI
        CardComponent.vue    # 单张卡牌渲染
        StatusBar.vue        # 顶部栏：关卡、回合数、Boss/狂暴指示器
        BattleLog.vue        # 可滚动的战斗日志
        ResultDialog.vue     # 胜负弹窗，重试/下一关/返回选项
        SaveDialog.vue       # 手动存档槽位选择
      stores/
        game-store.ts        # Pinia store：游戏状态、操作、通过 IPC 存档/读档
      game/
        types.ts             # 全部 TypeScript 接口定义
        constants.ts         # 游戏平衡数值（属性、倍率、间隔等）
        game-engine.ts       # 核心战斗逻辑：创建战斗、出牌、怪兽反击
        battle-calculator.ts # 伤害计算公式（防御、元素、暴击、护盾、狂暴）
        card-pool.ts         # 卡牌生成，按类型/星级/系数加权随机
        monster-generator.ts # 怪兽属性随关卡缩放及技能分配
      styles/
        global.scss          # 全局 CSS 重置和主题变量
tests/
  scaffold.test.ts           # 占位测试
```

## 常用命令

```bash
npm run dev            # 开发服务器（Vite + Electron 热重载）
npm run build          # 类型检查 + 生产构建
npm run preview        # 预览生产构建
npm run test           # 运行一次 Vitest 测试
npm run test:watch     # Vitest 监听模式
npm run electron:build # 构建 + 打包（electron-builder）
```

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
