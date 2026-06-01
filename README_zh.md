# 卡牌战神 (Card God Of War)

一款 Electron 桌面卡牌对战游戏，使用 Vue 3 + TypeScript + Pinia 构建。玩家通过出牌（攻击/治疗/属性提升/防御/战术）在回合制战斗中击败不断升级的怪兽，胜利后从奖励中三选一、收集遗物、塑造构筑，角色随之持续成长。

## 截图

> 将截图添加到 `assets/` 目录后在此处引用。

## 游戏特性

- **回合制卡牌战斗** — 出物理、魔法、治疗、属性提升、防御（护盾）、战术（破甲/压制）卡牌对抗具有元素属性的怪兽
- **元素克制系统** — 火克雷、雷克水、水克火（克制 1.5×，被克 0.5×）
- **胜利奖励** — 每次胜利后从三个奖励中选一：属性提升、遗物、或影响后续手牌的卡牌偏向
- **遗物系统** — 8 个持续被动（火属性增伤、雷属性下回合加成、治疗溢出转护盾、克制破防、低血增伤、护盾协同、暴击倍率、战斗开始恢复），由单一来源统一解析，执行与预览共用
- **状态效果** — 护盾、破防、虚弱（各有持续时长），以及既有的眩晕
- **怪兽技能** — 护盾、吸血、暴击强化、元素免疫、眩晕，按概率触发
- **怪兽原型** — 狂战士、石卫、血蝠、雷虫的属性/技能倾向；第 5 关 Boss 为护盾流「石将军」，定期施加盾压
- **Boss 战** — 每 5 关出现更强的 Boss，拥有多种技能；第 15 回合后进入狂暴，伤害逐回合递增
- **伤害预览** — 出牌前每张卡牌显示预估伤害、暴击概率、治疗、护盾与状态施加
- **持续成长** — 英雄通过所选奖励与累积遗物跨关成长
- **存档系统** — 3 个手动存档槽 + 1 个自动存档，本地 JSON 存储；旧存档自动规范化遗物/奖励/状态/卡牌偏向/原型

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

`攻击 × 系数 → 减去防御（可被破甲降低） → 元素倍率 (0/0.5/1.0/1.5，+遗物元素增伤) → 暴击判定 (1.5×/2.0×，+遗物暴击加成) → 护盾 (0.5×) → 虚弱（仅怪兽） → 低血增伤（仅英雄遗物） → 狂暴（仅怪兽） → 向下取整到 MIN_DAMAGE=1`

遗物效果（元素/暴击/低血增伤）由 `relic-effects.ts` 统一解析，执行 (`calculateDamage`) 与预览 (`previewDamage`) 共用同一来源，保证两侧永不漂移。

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
| 卡牌池 | `src/renderer/src/game/card-pool.ts` | 按类型/星级/系数加权随机生成卡牌，支持卡牌偏向 |
| 怪兽生成 | `src/renderer/src/game/monster-generator.ts` | 怪兽属性随关卡、原型缩放及技能分配 |
| 奖励生成 | `src/renderer/src/game/reward-generator.ts` | 胜利后的奖励选项（属性/遗物/卡牌偏向） |
| 遗物效果 | `src/renderer/src/game/relic-effects.ts` | 遗物效果解析的单一来源，执行与预览共用 |

## 游戏数值

- **英雄初始属性**：物攻 10 / 魔攻 10 / 防御 5 / HP 100 / 暴击率 0%
- **胜利奖励**：每次胜利提供 3 选 1 — 属性提升、遗物、或卡牌偏向（同一偏向最多叠加 3 级）
- **状态时长**：破甲持续 3 次英雄伤害行动（防御 -40%）；虚弱使怪兽下次攻击 ×0.8；护盾在怪兽行动后消失
- **怪兽每关成长**：物攻 +3 / 魔攻 +3 / 防御 +1 / 暴击率 +1%，HP 以 1.05 指数增长
- **最大回合数**：每战斗 20 回合
- **Boss 间隔**：每 5 关（第 5 关 Boss 为石将军）
- **Boss 狂暴**：第 15 回合开始，每回合伤害 +20%

## 许可证

本项目仅供学习和个人使用。
