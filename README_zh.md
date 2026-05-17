# 卡牌战神 (Card God Of War)

一款 Electron 桌面卡牌对战游戏，使用 Vue 3 + TypeScript + Pinia 构建。玩家通过出牌（攻击/治疗/属性提升）在回合制战斗中击败不断升级的怪兽，角色属性随胜利持续增长。

## 截图

> 将截图添加到 `assets/` 目录后在此处引用。

## 游戏特性

- **回合制卡牌战斗** — 出物理、魔法、治疗、属性提升卡牌对抗具有元素属性的怪兽
- **元素克制系统** — 火克雷、雷克水、水克火（克制 1.5×，被克 0.5×）
- **怪兽技能** — 护盾、吸血、暴击强化、元素免疫、眩晕，按概率触发
- **Boss 战** — 每 5 关出现更强的 Boss，拥有多种技能；第 15 回合后进入狂暴，伤害逐回合递增
- **伤害预览** — 出牌前每张卡牌显示预估伤害、暴击概率和治疗量
- **持续成长** — 每次胜利后英雄永久提升属性
- **存档系统** — 3 个手动存档槽 + 1 个自动存档，本地 JSON 存储

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

## 快速开始

### 环境要求

- Node.js 20+
- npm

### 安装

```bash
git clone https://github.com/kaituoC/CardGodOfWar.git
cd CardGodOfWar
npm install
```

### 开发

```bash
npm run dev          # 启动 Vite 开发服务器 + Electron 热重载
npm run test         # 运行一次单元测试
npm run test:watch   # 监听模式运行测试
```

### 生产构建

```bash
npm run build          # 类型检查 + 生产构建
npm run pack           # 构建未打包的 app（用于测试）
npm run dist           # 构建当前平台的安装包
npm run dist:mac       # 构建 macOS DMG + ZIP
npm run dist:win       # 构建 Windows NSIS 安装包 + ZIP
npm run dist:linux     # 构建 Linux AppImage + DEB
```

输出文件位于 `release/` 目录。

**支持的平台：**

| 平台 | 输出格式 |
|------|----------|
| macOS | ZIP 便携版 |
| Windows | NSIS 安装包 + 便携 ZIP |
| Linux | AppImage + DEB 包 |

> macOS 上 dmg 构建需要 macOS 13+，当前构建环境为 macOS 12，故使用 zip 格式。

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

### 伤害管线

`攻击 × 系数 → 减去防御 → 元素倍率 (0/0.5/1.0/1.5) → 暴击判定 (1.5× 或 2.0×) → 护盾 (0.5×) → 狂暴（仅怪兽） → 向下取整到 MIN_DAMAGE=1`

### 怪兽意图系统

每回合怪兽生成 `MonsterIntent`，包含预估伤害、暴击和技能信息。意图驱动：
- **预览**：`estimateCardOutcome()` 在手牌上为每张卡牌显示估算值
- **执行**：`playCard()` 和 `monsterCounterAttack()` 执行实际战斗结算

### 核心模块

| 模块 | 路径 | 职责 |
|------|------|------|
| 游戏引擎 | `src/renderer/src/game/game-engine.ts` | 创建战斗、出牌、怪兽反击、胜利成长 |
| 伤害计算 | `src/renderer/src/game/battle-calculator.ts` | 防御、元素、暴击、护盾、狂暴伤害管线 |
| 怪兽意图 | `src/renderer/src/game/monster-intent.ts` | 意图生成、卡牌预览估算 |
| 游戏状态 | `src/renderer/src/stores/game-store.ts` | Pinia store，通过 Electron IPC 存档/读档 |
| 卡牌池 | `src/renderer/src/game/card-pool.ts` | 按类型/星级/系数加权随机生成卡牌 |
| 怪兽生成 | `src/renderer/src/game/monster-generator.ts` | 怪兽属性随关卡缩放及技能分配 |

## 游戏数值

- **英雄初始属性**：物攻 10 / 魔攻 10 / 防御 5 / HP 100 / 暴击率 0%
- **每胜利一次成长**：物攻 +3 / 魔攻 +3 / 防御 +2 / HP +10 / 暴击率 +2%
- **怪兽每关成长**：物攻 +3 / 魔攻 +3 / 防御 +1 / 暴击率 +1%，HP 以 1.05 指数增长
- **最大回合数**：每战斗 20 回合
- **Boss 间隔**：每 5 关
- **Boss 狂暴**：第 15 回合开始，每回合伤害 +20%

## 许可证

本项目仅供学习和个人使用。
