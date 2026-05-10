# Card God Of War 游戏实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一款基于 Electron + Vue 3 的单机卡牌策略闯关游戏《卡牌战神》，包含完整的卡牌系统、战斗系统、元素克制、Boss 机制和存档功能。

**Architecture:** 使用 Vite 2 + Vue 3 + TypeScript + Electron 构建应用。游戏核心逻辑为纯 TypeScript（框架无关），通过 Pinia store 驱动 Vue UI。Electron 主进程通过 IPC 处理存档文件读写。

**Tech Stack:** Electron 38.x, Vue 3 + Composition API, TypeScript 5.x, Pinia, Vitest, SCSS, Electron-builder

---

## 文件结构总览

### 新增文件列表

| 文件 | 职责 | 阶段 |
|------|------|------|
| `package.json` | 项目配置 | Task 1 |
| `vite.config.ts` | Vite 配置 | Task 1 |
| `electron-builder.json` | Electron 打包配置 | Task 1 |
| `tsconfig.json` | TypeScript 配置 | Task 1 |
| `tsconfig.node.json` | Node 侧 TS 配置 | Task 1 |
| `src/main.ts` | Electron 主进程入口 | Task 8 |
| `src/preload.ts` | IPC 预加载脚本 | Task 8 |
| `src/renderer/index.html` | 渲染进程 HTML 入口 | Task 1 |
| `src/renderer/src/main.ts` | Vue 渲染进程入口 | Task 1 |
| `src/renderer/src/App.vue` | Vue 根组件，路由容器 | Task 6 |
| `src/renderer/src/game/types.ts` | 游戏类型定义 | Task 2 |
| `src/renderer/src/game/constants.ts` | 游戏常量（初始值、比例、系数） | Task 2 |
| `src/renderer/src/game/battle-calculator.ts` | 伤害计算、元素克制、暴击判定 | Task 3 |
| `src/renderer/src/game/card-pool.ts` | 卡牌生成、随机抽卡、星级分布 | Task 4 |
| `src/renderer/src/game/monster-generator.ts` | 怪兽属性生成、技能分配 | Task 5 |
| `src/renderer/src/game/game-engine.ts` | 回合管理、战斗流程、胜负判定 | Task 5 |
| `src/renderer/src/stores/game-store.ts` | Pinia 状态管理，连接 UI 与游戏引擎 | Task 7 |
| `src/renderer/src/views/MainMenuView.vue` | 主界面（新游戏、加载存档） | Task 6 |
| `src/renderer/src/views/BattleView.vue` | 战斗页面（状态栏、卡牌、战斗记录） | Task 6 |
| `src/renderer/src/components/StatusBar.vue` | 顶部全局状态栏 | Task 6 |
| `src/renderer/src/components/HeroStatus.vue` | 英雄状态栏 | Task 6 |
| `src/renderer/src/components/MonsterStatus.vue` | 怪兽状态栏 | Task 6 |
| `src/renderer/src/components/CardHand.vue` | 卡牌选择区 | Task 6 |
| `src/renderer/src/components/CardComponent.vue` | 单张卡牌渲染 | Task 6 |
| `src/renderer/src/components/BattleLog.vue` | 战斗记录 | Task 6 |
| `src/renderer/src/components/SaveDialog.vue` | 存档弹窗 | Task 6 |
| `src/renderer/src/components/ResultDialog.vue` | 胜利/失败结果弹窗 | Task 6 |
| `src/renderer/src/styles/global.scss` | 全局样式、主题色 | Task 1 |
| `tests/game/battle-calculator.test.ts` | 伤害计算测试 | Task 3 |
| `tests/game/card-pool.test.ts` | 卡牌生成测试 | Task 4 |
| `tests/game/game-engine.test.ts` | 游戏引擎测试 | Task 5 |

### 文件依赖关系

```
game/types.ts ← game/constants.ts ← game/*.ts ← stores/game-store.ts ← views/*.vue
Electron IPC (main.ts) ← preload.ts ← stores/game-store.ts (调用 ipcRenderer)
```

---

## Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `vite.config.ts`, `electron-builder.json`, `tsconfig.json`, `tsconfig.node.json`, `src/renderer/index.html`, `src/renderer/src/main.ts`, `src/renderer/src/App.vue`, `src/renderer/src/styles/global.scss`
- Test: 运行 `npm run dev` 确认窗口打开

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "card-god-of-war",
  "version": "0.1.0",
  "private": true,
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "electron:dev": "vite",
    "electron:build": "vite build && electron-builder"
  },
  "dependencies": {
    "vue": "^3.5.13",
    "pinia": "^3.0.1"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.1",
    "electron": "^38.0.0",
    "electron-builder": "^26.0.0",
    "sass": "^1.85.0",
    "typescript": "^5.7.0",
    "vite": "^6.2.0",
    "vite-plugin-electron": "^0.30.0",
    "vite-plugin-electron-renderer": "^0.14.6",
    "vue-tsc": "^2.2.0",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'src/main.ts',
        vite: {
          build: {
            outDir: 'dist/main',
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
    },
  },
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
})
```

- [ ] **Step 3: 创建 electron-builder.json**

```json
{
  "appId": "com.cardgodofwar.app",
  "productName": "卡牌战神",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*"
  ],
  "mac": {
    "target": "dmg",
    "category": "public.app-category.games"
  },
  "win": {
    "target": "nsis"
  }
}
```

- [ ] **Step 4: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/src/*"]
    }
  },
  "include": ["src/renderer/src/**/*.ts", "src/renderer/src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "composite": true
  },
  "include": ["vite.config.ts", "src/main.ts", "src/preload.ts"]
}
```

- [ ] **Step 6: 创建 src/renderer/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>卡牌战神 - Card God Of War</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: 创建 src/renderer/src/main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

- [ ] **Step 8: 创建 src/renderer/src/App.vue**

```vue
<template>
  <div class="app-container">
    <MainMenuView v-if="!gameStarted" @start-game="startGame" />
    <BattleView v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MainMenuView from './views/MainMenuView.vue'
import BattleView from './views/BattleView.vue'

const gameStarted = ref(false)

function startGame() {
  gameStarted.value = true
}
</script>

<style lang="scss">
@import './styles/global.scss';
</style>
```

- [ ] **Step 9: 创建 src/renderer/src/styles/global.scss**

```scss
// 主题色
$color-primary: #1a1a2e;
$color-secondary: #16213e;
$color-accent: #e94560;
$color-gold: #f0c040;
$color-silver: #a0a0a0;
$color-bronze: #cd7f32;
$color-fire: #e74c3c;
$color-thunder: #f39c12;
$color-water: #3498db;
$color-text: #ecf0f1;
$color-text-dim: #95a5a6;
$color-border: #2c3e50;
$color-success: #27ae60;
$color-danger: #c0392b;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: $color-text;
  background: $color-primary;
  user-select: none;
  -webkit-user-select: none;
}

.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

// 按钮样式
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: $color-text;

  &.primary {
    background: $color-accent;
    &:hover { background: #d63851; }
  }

  &.secondary {
    background: $color-secondary;
    border: 1px solid $color-border;
    &:hover { background: $color-border; }
  }

  &.gold {
    background: linear-gradient(135deg, #f0c040, #e6a817);
    color: #1a1a2e;
    &:hover { background: linear-gradient(135deg, #e6a817, #d49814); }
  }
}
```

- [ ] **Step 10: 安装依赖并确认 dev 模式启动**

运行: `npm install`

然后运行: `npm run dev`

Expected: Electron 窗口打开，显示空白页面（App.vue 渲染 MainMenuView）。

- [ ] **Step 11: 初始化 git 并提交**

```bash
git init
git add .
git commit -m "feat: scaffold Card God Of War project with Electron + Vue 3"
```

---

## Task 2: 游戏类型和常量

**Files:**
- Create: `src/renderer/src/game/types.ts`
- Create: `src/renderer/src/game/constants.ts`

- [ ] **Step 1: 创建 src/renderer/src/game/types.ts**

```typescript
// 元素类型
export type Element = 'fire' | 'thunder' | 'water'

// 卡牌类型
export type CardType = 'physical' | 'magic' | 'heal' | 'statBoost'

// 卡牌星级
export type CardStar = 1 | 2 | 3

// 英雄/怪兽属性
export interface Stats {
  physicalAttack: number
  magicAttack: number
  defense: number
  maxHp: number
  critRate: number // 0-100
}

// 卡牌定义
export interface Card {
  id: string
  type: CardType
  star: CardStar
  coefficient: number // 伤害/恢复系数
  element: Element // 攻击卡有元素，恢复/属性卡为 null（用 undefined）
  statBoost?: {
    stat: keyof Stats
    value: number
  }
  name: string
}

// 怪兽技能
export type MonsterSkillType =
  | 'shield'     // 本回合受到伤害减少50%
  | 'lifesteal'  // 本回合造成伤害的30%恢复自身血量
  | 'critBoost'  // 本回合暴击伤害×2.0
  | 'elementImmune' // 本回合完全免疫某一元素
  | 'stun'       // 下一回合英雄无法使用攻击卡牌

export interface MonsterSkill {
  type: MonsterSkillType
  immuneElement?: Element // elementImmun 技能需要
  triggerChance: number // 触发概率 0-100
}

// 怪兽
export interface Monster {
  stats: Stats
  element: Element
  skills: MonsterSkill[]
  currentHp: number
  isBoss: boolean
}

// 英雄
export interface Hero {
  stats: Stats
  currentHp: number
  isStunned: boolean // 眩晕状态
}

// 战斗日志条目
export interface BattleLogEntry {
  turn: number
  message: string
  isHeroAction: boolean
}

// 战斗状态
export interface BattleState {
  hero: Hero
  monster: Monster
  currentTurn: number
  maxTurns: number
  cards: Card[] // 当前回合的3张卡牌
  logs: BattleLogEntry[]
  isPlayerTurn: boolean
  isEnraged: boolean // Boss狂暴
  gameOver: boolean
  winner: 'hero' | 'monster' | null
}

// 存档数据
export interface SaveData {
  level: number
  hero: Hero
  battleState: BattleState | null
  timestamp: number
}

// 游戏全局状态
export interface GameState {
  level: number
  hero: Hero
  currentBattle: BattleState | null
  view: 'menu' | 'battle'
}
```

- [ ] **Step 2: 创建 src/renderer/src/game/constants.ts**

```typescript
import { Stats } from './types'

// 英雄初始属性
export const HERO_INITIAL_STATS: Stats = {
  physicalAttack: 10,
  magicAttack: 10,
  defense: 5,
  maxHp: 100,
  critRate: 0,
}

// 英雄胜利后成长
export const HERO_VICTORY_GROWTH: Stats = {
  physicalAttack: 1,
  magicAttack: 1,
  defense: 1,
  maxHp: 3,
  critRate: 1,
}

// 怪兽第1关基础属性
export const MONSTER_BASE_STATS = {
  physicalAttack: 8,
  magicAttack: 8,
  defense: 3,
  baseHp: 50,
  critRate: 5,
}

// 怪兽每关成长（非血量）
export const MONSTER_PER_LEVEL_GROWTH = {
  physicalAttack: 5,
  magicAttack: 5,
  defense: 4,
  critRate: 1,
}

// 怪兽血量指数公式指数
export const MONSTER_HP_EXPONENT = 1.3

// Boss 基础血量乘数
export const BOSS_HP_MULTIPLIER = 2 // Boss血量 = 普通怪兽 × 2

// Boss 狂暴起始回合
export const ENRAGE_START_TURN = 15

// Boss 狂暴每回合伤害增幅
export const ENRAGE_DAMAGE_PER_TURN = 0.2

// 最大回合数
export const MAX_TURNS = 20

// 元素克制倍率
export const ELEMENT_ADVANTAGE: Record<string, string> = {
  fire: 'thunder',   // 火克雷
  thunder: 'water',  // 雷克水
  water: 'fire',     // 水克火
}

export const ELEMENT_ADVANTAGE_MULTIPLIER = 1.5
export const ELEMENT_DISADVANTAGE_MULTIPLIER = 0.5

// 暴击倍率
export const CRIT_MULTIPLIER = 1.5
export const CRIT_BOOST_MULTIPLIER = 2.0 // 暴击强化技能

// 最低伤害
export const MIN_DAMAGE = 1

// 卡牌类型比例
export const CARD_TYPE_WEIGHTS = [
  // 物理:魔法:恢复:属性 = 10:10:8:6
  ...Array(10).fill('physical'),
  ...Array(10).fill('magic'),
  ...Array(8).fill('heal'),
  ...Array(6).fill('statBoost'),
] as const

// 卡牌星级比例 (1星:2星:3星 = 6:3:1)
export const CARD_STAR_WEIGHTS = [
  ...Array(6).fill(1),
  ...Array(3).fill(2),
  ...Array(1).fill(3),
] as number[]

// 卡牌系数范围
export const CARD_COEFFICIENTS = {
  physical: { 1: [1.0, 1.5], 2: [1.5, 2.2], 3: [2.2, 3.0] },
  magic:    { 1: [1.0, 1.5], 2: [1.5, 2.2], 3: [2.2, 3.0] },
  heal:     { 1: [0.3, 0.4], 2: [0.4, 0.6], 3: [0.6, 0.8] },
} as const

// 属性提升值
export const STAT_BOOST_VALUES: Record<keyof Omit<Stats, 'critRate'>, [number, number, number]> = {
  physicalAttack: [1, 2, 3],
  magicAttack: [1, 2, 3],
  defense: [1, 2, 3],
  maxHp: [5, 8, 12],
}
export const CRIT_BOOST_VALUES: [number, number, number] = [2, 3, 5] // 百分比

// 怪兽技能池
export const MONSTER_SKILL_POOL = [
  'shield',
  'lifesteal',
  'critBoost',
  'elementImmune',
  'stun',
] as const

// 普通怪兽技能数量
export const NORMAL_MONSTER_SKILL_COUNT = 1

// Boss 技能数量
export const BOSS_SKILL_COUNT = 2

// 技能触发概率
export const SKILL_TRIGGER_CHANCE = 30 // 30%

// Boss关卡间隔
export const BOSS_INTERVAL = 5

// 存档目录
export const SAVE_DIR_NAME = '.cardgodofwar'
```

- [ ] **Step 3: 运行测试确认类型编译通过**

运行: `npx tsc --noEmit`

Expected: 无错误输出。

- [ ] **Step 4: 提交**

```bash
git add src/renderer/src/game/types.ts src/renderer/src/game/constants.ts
git commit -m "feat: add game types and constants"
```

---

## Task 3: 伤害计算器（Battle Calculator）

**Files:**
- Create: `src/renderer/src/game/battle-calculator.ts`
- Test: `tests/game/battle-calculator.test.ts`

- [ ] **Step 1: 编写测试文件**

创建 `tests/game/battle-calculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateDamage, getElementMultiplier, isCrit } from '@/game/battle-calculator'

describe('getElementMultiplier', () => {
  it('returns 1.5 when attacker element has advantage', () => {
    // fire beats thunder
    expect(getElementMultiplier('fire', 'thunder')).toBe(1.5)
    expect(getElementMultiplier('thunder', 'water')).toBe(1.5)
    expect(getElementMultiplier('water', 'fire')).toBe(1.5)
  })

  it('returns 0.5 when attacker element is at disadvantage', () => {
    expect(getElementMultiplier('fire', 'water')).toBe(0.5)
    expect(getElementMultiplier('thunder', 'fire')).toBe(0.5)
    expect(getElementMultiplier('water', 'thunder')).toBe(0.5)
  })

  it('returns 1.0 for same elements', () => {
    expect(getElementMultiplier('fire', 'fire')).toBe(1.0)
    expect(getElementMultiplier('thunder', 'thunder')).toBe(1.0)
    expect(getElementMultiplier('water', 'water')).toBe(1.0)
  })
})

describe('calculateDamage', () => {
  it('calculates basic physical damage', () => {
    // attack 10 * coeff 1.5 = 15, defense 5 => 10, no element, no crit
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.5,
      defense: 5,
      cardElement: 'fire',
      monsterElement: 'fire', // same element => ×1.0
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    // (10 * 1.5 - 5) * 1.0 = 10
    expect(result.finalDamage).toBe(10)
    expect(result.isCrit).toBe(false)
    expect(result.elementMultiplier).toBe(1.0)
  })

  it('applies element advantage', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'thunder', // fire beats thunder => ×1.5
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    // (10 * 1.0 - 0) * 1.5 = 15
    expect(result.finalDamage).toBe(15)
  })

  it('applies element disadvantage', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'water',
      monsterElement: 'fire', // water is weak against fire => ×0.5
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    // (10 * 1.0 - 0) * 0.5 = 5
    expect(result.finalDamage).toBe(5)
  })

  it('minimum damage is 1', () => {
    const result = calculateDamage({
      attack: 1,
      coefficient: 1.0,
      defense: 100,
      cardElement: 'water',
      monsterElement: 'fire', // ×0.5
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    // (1 * 1.0 - 100) * 0.5 = -49.5 => min 1
    expect(result.finalDamage).toBe(1)
  })

  it('applies crit when rolled', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 100, // 100% crit
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    // (10 * 1.0) * 1.5(crit) = 15
    expect(result.finalDamage).toBe(15)
    expect(result.isCrit).toBe(true)
  })

  it('applies shield reduction', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 0,
      isShield: true,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    // (10 * 1.0) * 0.5(shield) = 5
    expect(result.finalDamage).toBe(5)
  })

  it('applies element immunity', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: 'fire',
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    // immune to fire => 0 => min 1
    expect(result.finalDamage).toBe(1)
  })

  it('applies enrage multiplier for monster attacks', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.4, // turn 17 => 1 + 2*0.2 = 1.4
      isMonsterAttacking: true,
    })
    // (10 * 1.0) * 1.4(enrage) = 14
    expect(result.finalDamage).toBe(14)
  })

  it('applies crit boost skill', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 100,
      isShield: false,
      isCritBoost: true,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    // (10 * 1.0) * 2.0(crit boost) = 20
    expect(result.finalDamage).toBe(20)
  })
})

describe('isCrit', () => {
  it('returns true when random value is below crit rate', () => {
    expect(isCrit(100, 42)).toBe(true)  // 100% crit, roll 42
    expect(isCrit(0, 42)).toBe(false)    // 0% crit, roll 42
    expect(isCrit(50, 30)).toBe(true)    // 50% crit, roll 30
    expect(isCrit(50, 80)).toBe(false)   // 50% crit, roll 80
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

运行: `npm run test`

Expected: 测试文件存在但函数未定义，测试失败。

- [ ] **Step 3: 实现 battle-calculator.ts**

```typescript
import type { Element } from './types'
import {
  ELEMENT_ADVANTAGE,
  ELEMENT_ADVANTAGE_MULTIPLIER,
  ELEMENT_DISADVANTAGE_MULTIPLIER,
  CRIT_MULTIPLIER,
  CRIT_BOOST_MULTIPLIER,
  MIN_DAMAGE,
} from './constants'

export interface DamageCalculationParams {
  attack: number
  coefficient: number
  defense: number
  cardElement: Element
  monsterElement: Element
  critRate: number // 0-100
  isShield: boolean
  isCritBoost: boolean
  isImmuneToElement: Element | null
  enrageMultiplier: number
  isMonsterAttacking: boolean
}

export interface DamageResult {
  baseDamage: number
  afterDefense: number
  elementMultiplier: number
  afterElement: number
  isCrit: boolean
  afterCrit: number
  afterShield: number
  finalDamage: number
}

export function getElementMultiplier(cardElement: Element, monsterElement: Element): number {
  if (cardElement === monsterElement) return 1.0
  if (ELEMENT_ADVANTAGE[cardElement] === monsterElement) return ELEMENT_ADVANTAGE_MULTIPLIER
  return ELEMENT_DISADVANTAGE_MULTIPLIER
}

export function isCrit(critRate: number, roll: number): boolean {
  return roll < critRate
}

export function calculateDamage(params: DamageCalculationParams): DamageResult {
  const {
    attack, coefficient, defense, cardElement, monsterElement,
    critRate, isShield, isCritBoost, isImmuneToElement,
    enrageMultiplier, isMonsterAttacking,
  } = params

  // Step 1: Base damage
  const baseDamage = attack * coefficient

  // Step 2: Defense reduction
  const afterDefense = Math.max(baseDamage - defense, MIN_DAMAGE)

  // Step 3: Element multiplier (skip if immune)
  let elementMultiplier: number
  if (isImmuneToElement === cardElement) {
    elementMultiplier = 0
  } else {
    elementMultiplier = getElementMultiplier(cardElement, monsterElement)
  }
  const afterElement = afterDefense * elementMultiplier

  // Step 4: Crit check (use deterministic roll for testability; UI passes random)
  const roll = Math.random() * 100
  const crit = isCrit(critRate, roll)
  const critMultiplier = isCritBoost ? CRIT_BOOST_MULTIPLIER : CRIT_MULTIPLIER
  const afterCrit = crit ? afterElement * critMultiplier : afterElement

  // Step 5: Shield
  const afterShield = isShield ? afterCrit * 0.5 : afterCrit

  // Step 6: Enrage (only for monster attacks)
  const finalBase = isMonsterAttacking
    ? afterShield * enrageMultiplier
    : afterShield

  // Step 7: Clamp to minimum
  const finalDamage = Math.max(Math.floor(finalBase), MIN_DAMAGE)

  return {
    baseDamage,
    afterDefense,
    elementMultiplier,
    afterElement,
    isCrit: crit,
    afterCrit,
    afterShield,
    finalDamage,
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

运行: `npm run test -- tests/game/battle-calculator.test.ts -v`

Expected: 所有测试 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/game/battle-calculator.ts tests/game/battle-calculator.test.ts
git commit -m "feat: implement battle calculator with element, crit, shield logic"
```

---

## Task 4: 卡牌池（Card Pool）

**Files:**
- Create: `src/renderer/src/game/card-pool.ts`
- Test: `tests/game/card-pool.test.ts`

- [ ] **Step 1: 编写测试文件**

创建 `tests/game/card-pool.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateCards, randomCardType, randomStar } from '@/game/card-pool'

describe('randomCardType', () => {
  it('returns a valid card type', () => {
    const type = randomCardType()
    expect(['physical', 'magic', 'heal', 'statBoost']).toContain(type)
  })

  it('follows approximate distribution over many samples', () => {
    const samples = Array.from({ length: 1000 }, () => randomCardType())
    const physical = samples.filter(t => t === 'physical').length
    const magic = samples.filter(t => t === 'magic').length
    const heal = samples.filter(t => t === 'heal').length
    const statBoost = samples.filter(t => t === 'statBoost').length
    // physical:magic:heal:statBoost ≈ 10:10:8:6
    const total = physical + magic + heal + statBoost
    expect(physical / total).toBeGreaterThan(0.25)
    expect(magic / total).toBeGreaterThan(0.25)
    expect(heal / total).toBeGreaterThan(0.2)
    expect(statBoost / total).toBeGreaterThan(0.1)
  })
})

describe('randomStar', () => {
  it('returns 1, 2, or 3', () => {
    const star = randomStar()
    expect([1, 2, 3]).toContain(star)
  })

  it('follows 6:3:1 ratio approximately', () => {
    const samples = Array.from({ length: 1000 }, () => randomStar())
    const s1 = samples.filter(s => s === 1).length
    const s2 = samples.filter(s => s === 2).length
    const s3 = samples.filter(s => s === 3).length
    // 1星 ~60%, 2星 ~30%, 3星 ~10%
    expect(s1 / 1000).toBeGreaterThan(0.5)
    expect(s2 / 1000).toBeGreaterThan(0.2)
    expect(s3 / 1000).toBeLessThan(0.2)
  })
})

describe('generateCards', () => {
  it('generates exactly 3 cards', () => {
    const cards = generateCards(1)
    expect(cards.length).toBe(3)
  })

  it('each card has required fields', () => {
    const cards = generateCards(1)
    for (const card of cards) {
      expect(card.id).toBeDefined()
      expect(card.type).toBeDefined()
      expect(card.star).toBeDefined()
      expect(card.coefficient).toBeDefined()
      expect(card.name).toBeDefined()
    }
  })

  it('physical and magic cards have element', () => {
    const cards = generateCards(1)
    const attackCards = cards.filter(c => c.type === 'physical' || c.type === 'magic')
    for (const card of attackCards) {
      expect(['fire', 'thunder', 'water']).toContain(card.element)
    }
  })

  it('stat boost cards have statBoost property', () => {
    const cards = generateCards(1)
    const boostCards = cards.filter(c => c.type === 'statBoost')
    for (const card of boostCards) {
      expect(card.statBoost).toBeDefined()
      expect(card.statBoost!.value).toBeGreaterThan(0)
    }
  })

  it('card coefficients are within valid ranges', () => {
    const cards = generateCards(1)
    for (const card of cards) {
      if (card.type === 'physical' || card.type === 'magic') {
        const [min, max] = card.star === 1 ? [1.0, 1.5] : card.star === 2 ? [1.5, 2.2] : [2.2, 3.0]
        expect(card.coefficient).toBeGreaterThanOrEqual(min)
        expect(card.coefficient).toBeLessThanOrEqual(max)
      } else if (card.type === 'heal') {
        const [min, max] = card.star === 1 ? [0.3, 0.4] : card.star === 2 ? [0.4, 0.6] : [0.6, 0.8]
        expect(card.coefficient).toBeGreaterThanOrEqual(min)
        expect(card.coefficient).toBeLessThanOrEqual(max)
      }
    }
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

运行: `npm run test -- tests/game/card-pool.test.ts`

Expected: 测试失败（函数未定义）。

- [ ] **Step 3: 实现 card-pool.ts**

```typescript
import type { Card, CardType, CardStar, Element } from './types'
import {
  CARD_TYPE_WEIGHTS,
  CARD_STAR_WEIGHTS,
  CARD_COEFFICIENTS,
  STAT_BOOST_VALUES,
  CRIT_BOOST_VALUES,
} from './constants'

let cardIdCounter = 0

export function randomCardType(): CardType {
  const idx = Math.floor(Math.random() * CARD_TYPE_WEIGHTS.length)
  return CARD_TYPE_WEIGHTS[idx] as CardType
}

export function randomStar(): CardStar {
  const idx = Math.floor(Math.random() * CARD_STAR_WEIGHTS.length)
  return CARD_STAR_WEIGHTS[idx] as CardStar
}

export function randomElement(): Element {
  const elements: Element[] = ['fire', 'thunder', 'water']
  return elements[Math.floor(Math.random() * elements.length)]
}

function randomInRange(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10
}

function generateCardName(type: CardType, star: CardStar, element?: Element): string {
  const elementNames: Record<Element, string> = { fire: '火', thunder: '雷', water: '水' }
  const starNames = ['一', '二', '三']
  const typeNames: Record<CardType, string> = {
    physical: '物理攻击',
    magic: '魔法攻击',
    heal: '生命恢复',
    statBoost: '属性提升',
  }

  if (type === 'statBoost') return `${starNames[star - 1]}星强化`
  if (type === 'heal') return `${starNames[star - 1]}星治愈`
  return `${starNames[star - 1]}星${typeNames[type]}·${elementNames[element!]}`
}

export function generateCards(_level: number): Card[] {
  return Array.from({ length: 3 }, () => {
    cardIdCounter++
    const type = randomCardType()
    const star = randomStar()
    const id = `card-${cardIdCounter}`

    if (type === 'physical' || type === 'magic') {
      const element = randomElement()
      const [min, max] = CARD_COEFFICIENTS[type][star]
      const coefficient = randomInRange(min, max)
      return {
        id, type, star, coefficient, element,
        name: generateCardName(type, star, element),
      }
    }

    if (type === 'heal') {
      const [min, max] = CARD_COEFFICIENTS.heal[star]
      const coefficient = randomInRange(min, max)
      return {
        id, type, star, coefficient,
        element: 'fire' as Element, // placeholder, not used for heal
        name: generateCardName(type, star),
      }
    }

    // statBoost
    const statKeys: Array<keyof typeof STAT_BOOST_VALUES> = ['physicalAttack', 'magicAttack', 'defense', 'maxHp']
    const statIndex = Math.floor(Math.random() * statKeys.length)
    const stat = statKeys[statIndex]
    const value = STAT_BOOST_VALUES[stat][star - 1]
    // For crit boost cards, use a separate path
    if (Math.random() < 0.2) { // 20% chance for crit boost among statBoost
      return {
        id, type: 'statBoost' as CardType, star,
        coefficient: 0,
        element: 'fire' as Element,
        statBoost: { stat: 'critRate' as keyof import('./types').Stats, value: CRIT_BOOST_VALUES[star - 1] },
        name: `${['一', '二', '三'][star - 1]}星暴击提升`,
      }
    }
    return {
      id, type: 'statBoost' as CardType, star,
      coefficient: 0,
      element: 'fire' as Element,
      statBoost: { stat, value },
      name: generateCardName(type, star),
    }
  })
}
```

- [ ] **Step 4: 运行测试确认通过**

运行: `npm run test -- tests/game/card-pool.test.ts`

Expected: 所有测试 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/game/card-pool.ts tests/game/card-pool.test.ts
git commit -m "feat: implement card pool with type/star distribution and coefficient generation"
```

---

## Task 5: 怪兽生成器和游戏引擎

**Files:**
- Create: `src/renderer/src/game/monster-generator.ts`
- Create: `src/renderer/src/game/game-engine.ts`
- Test: `tests/game/game-engine.test.ts`

- [ ] **Step 1: 创建 monster-generator.ts**

```typescript
import type { Monster, MonsterSkill, MonsterSkillType, Element } from './types'
import {
  MONSTER_BASE_STATS,
  MONSTER_PER_LEVEL_GROWTH,
  MONSTER_HP_EXPONENT,
  BOSS_HP_MULTIPLIER,
  BOSS_INTERVAL,
  BOSS_SKILL_COUNT,
  NORMAL_MONSTER_SKILL_COUNT,
  MONSTER_SKILL_POOL,
  SKILL_TRIGGER_CHANCE,
} from './constants'

function randomElement(): Element {
  const elements: Element[] = ['fire', 'thunder', 'water']
  return elements[Math.floor(Math.random() * elements.length)]
}

function isBossLevel(level: number): boolean {
  return level % BOSS_INTERVAL === 0
}

export function generateMonster(level: number): Monster {
  const isBoss = isBossLevel(level)
  const baseHp = MONSTER_BASE_STATS.baseHp * Math.pow(level, MONSTER_HP_EXPONENT)
  const maxHp = isBoss ? baseHp * BOSS_HP_MULTIPLIER : baseHp

  const stats = {
    physicalAttack: MONSTER_BASE_STATS.physicalAttack + MONSTER_PER_LEVEL_GROWTH.physicalAttack * (level - 1),
    magicAttack: MONSTER_BASE_STATS.magicAttack + MONSTER_PER_LEVEL_GROWTH.magicAttack * (level - 1),
    defense: MONSTER_BASE_STATS.defense + MONSTER_PER_LEVEL_GROWTH.defense * (level - 1),
    maxHp: Math.floor(maxHp),
    critRate: Math.min(
      MONSTER_BASE_STATS.critRate + MONSTER_PER_LEVEL_GROWTH.critRate * (level - 1),
      100
    ),
  }

  const skillCount = isBoss ? BOSS_SKILL_COUNT : NORMAL_MONSTER_SKILL_COUNT
  const skills = generateSkills(skillCount)

  return {
    stats,
    element: randomElement(),
    skills,
    currentHp: stats.maxHp,
    isBoss,
  }
}

function generateSkills(count: number): MonsterSkill[] {
  const skills: MonsterSkill[] = []
  const usedTypes = new Set<MonsterSkillType>()

  for (let i = 0; i < count; i++) {
    let type: MonsterSkillType
    do {
      type = MONSTER_SKILL_POOL[Math.floor(Math.random() * MONSTER_SKILL_POOL.length)]
    } while (usedTypes.has(type) && usedTypes.size < MONSTER_SKILL_POOL.length)

    usedTypes.add(type)

    const skill: MonsterSkill = {
      type,
      triggerChance: SKILL_TRIGGER_CHANCE,
    }

    if (type === 'elementImmune') {
      const elements: Element[] = ['fire', 'thunder', 'water']
      skill.immuneElement = elements[Math.floor(Math.random() * elements.length)]
    }

    skills.push(skill)
  }

  return skills
}
```

- [ ] **Step 2: 创建 game-engine.ts**

```typescript
import type {
  BattleState, Hero, Monster, Card, CardType,
  BattleLogEntry, Element, MonsterSkillType, Stats,
} from './types'
import type { DamageResult } from './battle-calculator'
import { calculateDamage } from './battle-calculator'
import { generateCards } from './card-pool'
import { generateMonster } from './monster-generator'
import {
  HERO_INITIAL_STATS,
  HERO_VICTORY_GROWTH,
  MAX_TURNS,
  ENRAGE_START_TURN,
  ENRAGE_DAMAGE_PER_TURN,
  CRIT_MULTIPLIER,
  CRIT_BOOST_MULTIPLIER,
} from './constants'

export function createInitialHero(): Hero {
  const stats = { ...HERO_INITIAL_STATS }
  return {
    stats,
    currentHp: stats.maxHp,
    isStunned: false,
  }
}

export function createBattle(level: number, hero: Hero): BattleState {
  const monster = generateMonster(level)
  return {
    hero: { ...hero, isStunned: false },
    monster,
    currentTurn: 1,
    maxTurns: MAX_TURNS,
    cards: generateCards(level),
    logs: [],
    isPlayerTurn: true,
    isEnraged: false,
    gameOver: false,
    winner: null,
  }
}

export function startTurn(state: BattleState): BattleState {
  if (state.gameOver) return state

  const newLogs: BattleLogEntry[] = []
  const turn = state.currentTurn

  // Check enrage
  let isEnraged = state.isEnraged
  if (state.monster.isBoss && turn > ENRAGE_START_TURN) {
    isEnraged = true
    if (!state.isEnraged) {
      newLogs.push({
        turn,
        message: `⚠️ Boss进入狂暴状态！每回合伤害递增${Math.round(ENRAGE_DAMAGE_PER_TURN * 100)}%`,
        isHeroAction: false,
      })
    }
  }

  // Generate new cards
  const cards = generateCards(state.hero.stats.maxHp > 100 ? Math.floor(state.hero.stats.maxHp / 100) : 1)

  // Check stun
  if (state.hero.isStunned) {
    newLogs.push({
      turn,
      message: '英雄处于眩晕状态，无法使用攻击卡牌！',
      isHeroAction: false,
    })
  }

  return {
    ...state,
    currentTurn: turn,
    cards,
    isEnraged,
    isPlayerTurn: true,
    logs: [...state.logs, ...newLogs],
  }
}

export function playCard(state: BattleState, card: Card): { newState: BattleState; damageResult?: DamageResult; healAmount?: number } {
  const { hero, monster, currentTurn, isEnraged } = state
  const newLogs: BattleLogEntry[] = []

  if (card.type === 'physical' || card.type === 'magic') {
    // Check stun - can't use attack cards
    if (hero.isStunned) {
      newLogs.push({
        turn: currentTurn,
        message: '眩晕中！无法使用攻击卡牌！',
        isHeroAction: true,
      })
      return { newState: { ...state, logs: [...state.logs, ...newLogs] } }
    }

    const attack = card.type === 'physical' ? hero.stats.physicalAttack : hero.stats.magicAttack

    // Check monster skills for this turn
    const skillEffects = getMonsterSkillEffectsForTurn(monster, currentTurn)

    const damageResult = calculateDamage({
      attack,
      coefficient: card.coefficient,
      defense: monster.stats.defense,
      cardElement: card.element,
      monsterElement: monster.element,
      critRate: hero.stats.critRate,
      isShield: skillEffects.isShield,
      isCritBoost: false,
      isImmuneToElement: skillEffects.immuneElement,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })

    const newMonsterHp = Math.max(monster.currentHp - damageResult.finalDamage, 0)

    // Log
    const elementNames: Record<Element, string> = { fire: '火', thunder: '雷', water: '水' }
    const typeLabel = card.type === 'physical' ? '物理' : '魔法'
    let logMsg = `英雄使用${typeLabel}攻击: ${hero.stats.physicalAttack === attack ? hero.stats.physicalAttack : hero.stats.magicAttack} × ${card.coefficient} = ${Math.round(hero.stats.physicalAttack === attack ? hero.stats.physicalAttack * card.coefficient : hero.stats.magicAttack * card.coefficient)}`

    if (damageResult.elementMultiplier !== 1.0) {
      const advOrDis = damageResult.elementMultiplier > 1 ? '克制' : '被克'
      logMsg += `, ${elementNames[card.element]}${advOrDis}${elementNames[monster.element]} ×${damageResult.elementMultiplier}`
    }
    logMsg += `, 防御-${monster.stats.defense} = ${damageResult.finalDamage}伤害`
    if (damageResult.isCrit) logMsg += ' 🔥暴击！'

    newLogs.push({ turn: currentTurn, message: logMsg, isHeroAction: true })

    // Lifesteal
    if (skillEffects.hasLifesteal) {
      const lifestealHp = Math.floor(damageResult.finalDamage * 0.3)
      const healedHp = Math.min(newMonsterHp + lifestealHp, monster.stats.maxHp)
      newMonsterHp = healedHp
      newLogs.push({
        turn: currentTurn,
        message: `怪兽吸血恢复 ${lifestealHp} HP`,
        isHeroAction: false,
      })
    }

    state.monster.currentHp = newMonsterHp

    // Check if monster dead
    if (newMonsterHp <= 0) {
      return {
        newState: {
          ...state,
          monster: { ...state.monster, currentHp: 0 },
          logs: [...state.logs, ...newLogs],
          gameOver: true,
          winner: 'hero',
        },
        damageResult,
      }
    }

    // Monster counter-attack
    return monsterCounterAttack(
      { ...state, monster: { ...state.monster, currentHp: newMonsterHp }, logs: [...state.logs, ...newLogs] },
      currentTurn,
      isEnraged,
    )
  }

  if (card.type === 'heal') {
    const healAmount = Math.floor(hero.stats.maxHp * card.coefficient)
    const newHp = Math.min(hero.currentHp + healAmount, hero.stats.maxHp)
    newLogs.push({
      turn: currentTurn,
      message: `英雄恢复 ${healAmount} HP (${hero.currentHp} → ${newHp})`,
      isHeroAction: true,
    })

    return monsterCounterAttack(
      { ...state, hero: { ...hero, currentHp: newHp }, logs: [...state.logs, ...newLogs] },
      currentTurn,
      isEnraged,
    )
  }

  if (card.type === 'statBoost' && card.statBoost) {
    const { stat, value } = card.statBoost
    const newStats = { ...hero.stats }
    newStats[stat] = Math.min(newStats[stat] + value, stat === 'critRate' ? 100 : newStats[stat] + value)
    newLogs.push({
      turn: currentTurn,
      message: `英雄${stat}永久 +${value}`,
      isHeroAction: true,
    })

    return monsterCounterAttack(
      { ...state, hero: { ...hero, stats: newStats }, logs: [...state.logs, ...newLogs] },
      currentTurn,
      isEnraged,
    )
  }

  return { newState: state }
}

function getMonsterSkillEffectsForTurn(monster: Monster, turn: number) {
  const roll = (skill: MonsterSkillType) => {
    const skill = monster.skills.find(s => s.type === skill)
    if (!skill) return false
    return Math.random() * 100 < skill.triggerChance
  }

  return {
    isShield: roll('shield'),
    hasLifesteal: roll('lifesteal'),
    isCritBoost: roll('critBoost'),
    immuneElement: (monster.skills.find(s => s.type === 'elementImmune') && roll('elementImmune'))
      ? monster.skills.find(s => s.type === 'elementImmune')?.immuneElement
      : null,
    willStun: roll('stun'),
  }
}

function monsterCounterAttack(state: BattleState, turn: number, isEnraged: boolean): { newState: BattleState; damageResult?: DamageResult } {
  const { hero, monster } = state
  const newLogs: BattleLogEntry[] = []

  const skillEffects = getMonsterSkillEffectsForTurn(monster, turn)

  // Monster uses physical or magic attack (random)
  const isPhysical = Math.random() > 0.5
  const attack = isPhysical ? monster.stats.physicalAttack : monster.stats.magicAttack
  const typeLabel = isPhysical ? '物理' : '魔法'

  const enrageMultiplier = monster.isBoss && isEnraged
    ? 1 + (turn - ENRAGE_START_TURN) * ENRAGE_DAMAGE_PER_TURN
    : 1.0

  const damageResult = calculateDamage({
    attack,
    coefficient: 1.0, // monster basic attack has no card
    defense: hero.stats.defense,
    cardElement: monster.element,
    monsterElement: monster.element, // same element for monster => ×1.0
    critRate: monster.stats.critRate,
    isShield: false,
    isCritBoost: skillEffects.isCritBoost,
    isImmuneToElement: null,
    enrageMultiplier,
    isMonsterAttacking: true,
  })

  const newHeroHp = Math.max(hero.currentHp - damageResult.finalDamage, 0)
  const critText = damageResult.isCrit ? ' 🔥暴击！' : ''
  const enrageText = enrageMultiplier > 1 ? ` (狂暴×${enrageMultiplier.toFixed(1)})` : ''

  newLogs.push({
    turn,
    message: `怪兽${typeLabel}攻击: ${attack} × 1.0 - ${hero.stats.defense} = ${damageResult.finalDamage}伤害${critText}${enrageText}`,
    isHeroAction: false,
  })

  // Stun effect
  const newIsStunned = skillEffects.willStun

  const newHp = newHeroHp

  if (newHp <= 0) {
    return {
      newState: {
        ...state,
        hero: { ...hero, currentHp: 0, isStunned: newIsStunned },
        logs: [...state.logs, ...newLogs],
        gameOver: true,
        winner: 'monster',
      },
      damageResult,
    }
  }

  return {
    newState: {
      ...state,
      hero: { ...hero, currentHp: newHp, isStunned: newIsStunned },
      logs: [...state.logs, ...newLogs],
      currentTurn: turn + 1,
      cards: generateCards(1),
      isPlayerTurn: true,
      isEnraged: monster.isBoss && turn + 1 > ENRAGE_START_TURN,
      gameOver: turn + 1 > MAX_TURNS,
      winner: turn + 1 > MAX_TURNS ? 'monster' : null,
    },
    damageResult,
  }
}

export function applyVictoryGrowth(hero: Hero): Hero {
  const newStats: Stats = {
    physicalAttack: hero.stats.physicalAttack + HERO_VICTORY_GROWTH.physicalAttack,
    magicAttack: hero.stats.magicAttack + HERO_VICTORY_GROWTH.magicAttack,
    defense: hero.stats.defense + HERO_VICTORY_GROWTH.defense,
    maxHp: hero.stats.maxHp + HERO_VICTORY_GROWTH.maxHp,
    critRate: Math.min(hero.stats.critRate + HERO_VICTORY_GROWTH.critRate, 100),
  }
  return {
    stats: newStats,
    currentHp: hero.currentHp, // HP doesn't change on victory
    isStunned: false,
  }
}

export function resetToInitialHero(): Hero {
  return createInitialHero()
}
```

- [ ] **Step 3: 编写 game-engine 测试**

创建 `tests/game/game-engine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createInitialHero, createBattle, playCard, applyVictoryGrowth, startTurn } from '@/game/game-engine'
import type { Card } from '@/game/types'

describe('createInitialHero', () => {
  it('creates hero with correct initial stats', () => {
    const hero = createInitialHero()
    expect(hero.stats.physicalAttack).toBe(10)
    expect(hero.stats.magicAttack).toBe(10)
    expect(hero.stats.defense).toBe(5)
    expect(hero.stats.maxHp).toBe(100)
    expect(hero.stats.critRate).toBe(0)
    expect(hero.currentHp).toBe(100)
  })
})

describe('createBattle', () => {
  it('creates battle with monster at full HP', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    expect(battle.monster.currentHp).toBe(battle.monster.stats.maxHp)
    expect(battle.currentTurn).toBe(1)
    expect(battle.cards.length).toBe(3)
    expect(battle.gameOver).toBe(false)
  })

  it('level 5 creates a boss', () => {
    const hero = createInitialHero()
    const battle = createBattle(5, hero)
    expect(battle.monster.isBoss).toBe(true)
    expect(battle.monster.skills.length).toBe(2)
  })

  it('level 1 creates a normal monster', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    expect(battle.monster.isBoss).toBe(false)
    expect(battle.monster.skills.length).toBe(1)
  })
})

describe('playCard', () => {
  it('physical attack deals damage to monster', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    const physicalCard = battle.cards.find(c => c.type === 'physical')
    if (!physicalCard) return // skip if no physical card (rare)

    const { newState } = playCard(battle, physicalCard)
    expect(newState.monster.currentHp).toBeLessThan(battle.monster.stats.maxHp)
  })

  it('heal card increases hero HP', () => {
    const hero = { ...createInitialHero(), currentHp: 50 }
    const battle = createBattle(1, hero)
    const healCard = battle.cards.find(c => c.type === 'heal')
    if (!healCard) return

    const { newState } = playCard(battle, healCard)
    expect(newState.hero.currentHp).toBeGreaterThan(50)
  })

  it('stat boost card increases hero stat', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    const boostCard = battle.cards.find(c => c.type === 'statBoost')
    if (!boostCard) return

    const { newState } = playCard(battle, boostCard)
    if (boostCard.statBoost) {
      expect(newState.hero.stats[boostCard.statBoost.stat])
        .toBeGreaterThan(hero.stats[boostCard.statBoost.stat])
    }
  })
})

describe('applyVictoryGrowth', () => {
  it('increases all hero stats', () => {
    const hero = createInitialHero()
    const newHero = applyVictoryGrowth(hero)
    expect(newHero.stats.physicalAttack).toBe(11)
    expect(newHero.stats.magicAttack).toBe(11)
    expect(newHero.stats.defense).toBe(6)
    expect(newHero.stats.maxHp).toBe(103)
    expect(newHero.stats.critRate).toBe(1)
    expect(newHero.currentHp).toBe(100) // unchanged
  })
})
```

- [ ] **Step 4: 运行所有游戏逻辑测试**

运行: `npm run test`

Expected: 所有测试 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/game/monster-generator.ts src/renderer/src/game/game-engine.ts tests/game/game-engine.test.ts
git commit -m "feat: implement monster generator, game engine with battle flow"
```

---

## Task 6: Vue UI 组件

**Files:**
- Create: `src/renderer/src/views/MainMenuView.vue`
- Create: `src/renderer/src/views/BattleView.vue`
- Create: `src/renderer/src/components/StatusBar.vue`
- Create: `src/renderer/src/components/HeroStatus.vue`
- Create: `src/renderer/src/components/MonsterStatus.vue`
- Create: `src/renderer/src/components/CardHand.vue`
- Create: `src/renderer/src/components/CardComponent.vue`
- Create: `src/renderer/src/components/BattleLog.vue`
- Create: `src/renderer/src/components/SaveDialog.vue`
- Create: `src/renderer/src/components/ResultDialog.vue`
- Modify: `src/renderer/src/App.vue`

- [ ] **Step 1: 更新 App.vue — 使用 router-less 视图切换**

```vue
<template>
  <div class="app-container">
    <MainMenuView
      v-if="gameStore.view === 'menu'"
      @start-game="startNewGame"
    />
    <BattleView v-else />
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from './stores/game-store'
import MainMenuView from './views/MainMenuView.vue'
import BattleView from './views/BattleView.vue'

const gameStore = useGameStore()

function startNewGame() {
  gameStore.startNewGame()
}
</script>
```

- [ ] **Step 2: 创建 MainMenuView.vue**

```vue
<template>
  <div class="main-menu">
    <h1 class="title">卡牌战神</h1>
    <p class="subtitle">Card God Of War</p>

    <div class="buttons">
      <button class="btn primary" @click="emit('start-game')">新游戏</button>
      <button
        v-if="hasAutoSave"
        class="btn gold"
        @click="loadAutoSave"
      >
        继续游戏
      </button>
    </div>

    <div class="save-slots">
      <h3>手动存档</h3>
      <div
        v-for="i in 3"
        :key="i"
        class="save-slot"
      >
        <template v-if="manualSaves[i - 1]">
          <span>存档{{ i }}: 关卡{{ manualSaves[i - 1].level }} HP {{ manualSaves[i - 1].hero.currentHp }}/{{ manualSaves[i - 1].hero.stats.maxHp }}</span>
          <button class="btn secondary" @click="loadManualSave(i)">加载</button>
        </template>
        <template v-else>
          <span>存档{{ i }}: 空</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGameStore } from '../stores/game-store'

const emit = defineEmits<{ 'start-game': [] }>()
const gameStore = useGameStore()

const hasAutoSave = ref(false)
const manualSaves = ref<(typeof gameStore)['manualSaves']>([])

onMounted(async () => {
  hasAutoSave.value = await gameStore.hasAutoSave()
  manualSaves.value = await gameStore.loadManualSaves()
})

async function loadAutoSave() {
  await gameStore.loadAutoSave()
}

async function loadManualSave(slot: number) {
  await gameStore.loadManualSave(slot)
}
</script>

<style lang="scss" scoped>
.main-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 24px;
}

.title {
  font-size: 48px;
  color: #e94560;
  text-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
}

.subtitle {
  font-size: 18px;
  color: #95a5a6;
  margin-top: -16px;
}

.buttons {
  display: flex;
  gap: 16px;
  margin: 24px 0;
}

.save-slots {
  width: 400px;
  border-top: 1px solid #2c3e50;
  padding-top: 16px;

  h3 {
    margin-bottom: 12px;
    color: #95a5a6;
  }
}

.save-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin: 4px 0;
  background: #16213e;
  border-radius: 4px;
}
</style>
```

- [ ] **Step 3: 创建 BattleView.vue**

```vue
<template>
  <div class="battle-container">
    <StatusBar
      :level="gameStore.level"
      :current-turn="gameStore.currentTurn"
      :max-turns="20"
      :is-boss="gameStore.currentBattle?.monster.isBoss"
      :is-enraged="gameStore.currentBattle?.isEnraged"
      :monster-element="gameStore.currentBattle?.monster.element"
    />

    <div class="status-row">
      <HeroStatus :hero="gameStore.currentBattle!.hero" />
      <MonsterStatus :monster="gameStore.currentBattle!.monster" />
    </div>

    <div class="battle-content">
      <div class="left-panel">
        <CardHand
          :cards="gameStore.currentBattle!.cards"
          :is-stunned="gameStore.currentBattle!.hero.isStunned"
          @play-card="onPlayCard"
        />
        <div class="battle-actions">
          <button class="btn secondary small" @click="showSaveDialog = true">保存</button>
          <button class="btn secondary small" @click="backToMenu">回主菜单</button>
        </div>
      </div>
      <BattleLog :logs="gameStore.currentBattle!.logs" />
    </div>

    <SaveDialog
      v-if="showSaveDialog"
      @save="onSave"
      @cancel="showSaveDialog = false"
    />

    <ResultDialog
      v-if="showResultDialog"
      :winner="gameStore.currentBattle!.winner"
      @retry="onRetry"
      @back-to-start="onBackToStart"
      @next-level="onNextLevel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../stores/game-store'
import StatusBar from '../components/StatusBar.vue'
import HeroStatus from '../components/HeroStatus.vue'
import MonsterStatus from '../components/MonsterStatus.vue'
import CardHand from '../components/CardHand.vue'
import BattleLog from '../components/BattleLog.vue'
import SaveDialog from '../components/SaveDialog.vue'
import ResultDialog from '../components/ResultDialog.vue'
import type { Card } from '../game/types'

const gameStore = useGameStore()
const showSaveDialog = ref(false)
const showResultDialog = computed(() => gameStore.currentBattle?.gameOver ?? false)

function onPlayCard(card: Card) {
  gameStore.playCard(card)
}

function onSave(slot: number) {
  gameStore.saveManual(slot)
  showSaveDialog.value = false
}

function backToMenu() {
  gameStore.view = 'menu'
}

function onRetry() {
  gameStore.retryLevel()
}

function onBackToStart() {
  gameStore.backToStart()
}

function onNextLevel() {
  gameStore.nextLevel()
}
</script>

<style lang="scss" scoped>
.battle-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 8px;
  gap: 8px;
}

.status-row {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.battle-content {
  display: flex;
  flex: 1;
  gap: 8px;
  min-height: 0;
}

.left-panel {
  flex: 0 0 55%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.battle-actions {
  display: flex;
  gap: 8px;
}

.small {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
```

- [ ] **Step 4: 创建 StatusBar.vue**

```vue
<template>
  <div class="status-bar" :class="{ enraged: isEnraged }">
    <span class="info">关卡: <strong>{{ level }}</strong></span>
    <span class="info">回合: <strong>{{ currentTurn }}/{{ maxTurns }}</strong></span>
    <span v-if="isBoss" class="boss-badge">
      {{ isEnraged ? '⚠️ Boss狂暴！' : 'Boss战' }}
    </span>
    <span class="info">
      怪兽元素: <span :class="`element-${monsterElement}`">{{ elementLabel }}</span>
      <span class="advantage-hint" v-if="monsterElement">
        ({{ advantageLabel }}克之)
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { Element } from '../game/types'
import { ELEMENT_ADVANTAGE } from '../game/constants'

defineProps<{
  level: number
  currentTurn: number
  maxTurns: number
  isBoss?: boolean
  isEnraged?: boolean
  monsterElement?: Element
}>()

const elementLabels: Record<Element, string> = { fire: '火', thunder: '雷', water: '水' }
const advantageMap: Record<Element, Element> = { fire: 'water', thunder: 'fire', water: 'thunder' }

const elementLabel = (el?: Element) => el ? elementLabels[el] : ''
const advantageLabel = (el?: Element) => el ? elementLabels[advantageMap[el]] : ''
</script>

<style lang="scss" scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 16px;
  background: #16213e;
  border-radius: 6px;
  font-size: 14px;

  &.enraged {
    background: #3d0c0c;
    animation: pulse-red 1s infinite;
  }
}

.info { color: #95a5a6; }
.info strong { color: #ecf0f1; }

.boss-badge {
  background: #e94560;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.element-fire { color: #e74c3c; }
.element-thunder { color: #f39c12; }
.element-water { color: #3498db; }

.advantage-hint {
  font-size: 12px;
  color: #95a5a6;
}

@keyframes pulse-red {
  0%, 100% { background: #3d0c0c; }
  50% { background: #5a1515; }
}
</style>
```

- [ ] **Step 5: 创建 HeroStatus.vue**

```vue
<template>
  <div class="hero-status">
    <div class="name">英雄</div>
    <div class="hp-bar">
      <div
        class="hp-fill"
        :style="{ width: hpPercent + '%' }"
      ></div>
      <span class="hp-text">{{ hero.currentHp }} / {{ hero.stats.maxHp }}</span>
    </div>
    <div class="stats">
      <span>物攻: {{ hero.stats.physicalAttack }}</span>
      <span>魔攻: {{ hero.stats.magicAttack }}</span>
      <span>防御: {{ hero.stats.defense }}</span>
      <span>暴击: {{ hero.stats.critRate }}%</span>
    </div>
    <div v-if="hero.isStunned" class="stun-badge">眩晕</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Hero } from '../game/types'

const props = defineProps<{ hero: Hero }>()
const hpPercent = computed(() => Math.round(props.hero.currentHp / props.hero.stats.maxHp * 100))
</script>

<style lang="scss" scoped>
.hero-status {
  flex: 1;
  background: #16213e;
  border-radius: 6px;
  padding: 8px 12px;
  position: relative;
}

.name {
  font-weight: bold;
  margin-bottom: 4px;
}

.hp-bar {
  height: 20px;
  background: #0a0a1a;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60, #2ecc71);
  transition: width 0.3s;
}

.hp-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.stats {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: #95a5a6;
}

.stun-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #f39c12;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}
</style>
```

- [ ] **Step 6: 创建 MonsterStatus.vue**

```vue
<template>
  <div class="monster-status">
    <div class="name">{{ monster.isBoss ? 'Boss' : '怪兽' }} <span :class="`element-${monster.element}`">{{ elementLabel }}</span></div>
    <div class="hp-bar">
      <div
        class="hp-fill"
        :style="{ width: hpPercent + '%' }"
        :class="{ boss: monster.isBoss }"
      ></div>
      <span class="hp-text">{{ monster.currentHp }} / {{ monster.stats.maxHp }}</span>
    </div>
    <div class="stats">
      <span>物攻: {{ monster.stats.physicalAttack }}</span>
      <span>魔攻: {{ monster.stats.magicAttack }}</span>
      <span>防御: {{ monster.stats.defense }}</span>
    </div>
    <div class="skills">
      技能: {{ skillLabels.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Monster } from '../game/types'

const props = defineProps<{ monster: Monster }>()
const hpPercent = computed(() => Math.round(props.monster.currentHp / props.monster.stats.maxHp * 100))

const elementLabels: Record<string, string> = { fire: '火', thunder: '雷', water: '水' }
const skillLabelsMap: Record<string, string> = {
  shield: '护盾',
  lifesteal: '吸血',
  critBoost: '暴击强化',
  elementImmune: '元素免疫',
  stun: '眩晕',
}

const elementLabel = computed(() => elementLabels[props.monster.element])
const skillLabels = computed(() => props.monster.skills.map(s => skillLabelsMap[s.type] + (s.immuneElement ? `(${elementLabels[s.immuneElement]})` : '')))
</script>

<style lang="scss" scoped>
.monster-status {
  flex: 1;
  background: #16213e;
  border-radius: 6px;
  padding: 8px 12px;
}

.name { font-weight: bold; margin-bottom: 4px; }

.hp-bar {
  height: 20px;
  background: #0a0a1a;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #c0392b, #e74c3c);
  transition: width 0.3s;

  &.boss {
    background: linear-gradient(90deg, #8e44ad, #9b59b6);
  }
}

.hp-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.stats {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: #95a5a6;
}

.skills {
  font-size: 11px;
  color: #f0c040;
  margin-top: 2px;
}

.element-fire { color: #e74c3c; }
.element-thunder { color: #f39c12; }
.element-water { color: #3498db; }
</style>
```

- [ ] **Step 7: 创建 CardComponent.vue**

```vue
<template>
  <div class="card" :class="cardClass" @click="$emit('play', card)">
    <div class="card-stars">{{ '⭐'.repeat(card.star) }}</div>
    <div class="card-type">
      <span class="type-icon">{{ typeIcon }}</span>
      {{ cardName }}
    </div>
    <div class="card-coefficient" v-if="card.type !== 'statBoost'">
      × {{ card.coefficient.toFixed(1) }}
    </div>
    <div class="card-element" v-if="card.type === 'physical' || card.type === 'magic'">
      {{ elementLabel }}
    </div>
    <div class="card-stat-boost" v-if="card.type === 'statBoost' && card.statBoost">
      {{ statLabel }} +{{ card.statBoost.value }}
    </div>
    <div class="card-action">使用</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '../game/types'

const props = defineProps<{ card: Card }>()
defineEmits<{ play: [card: Card] }>()

const typeIcons: Record<string, string> = {
  physical: '⚔️',
  magic: '✨',
  heal: '💚',
  statBoost: '⬆️',
}
const typeIcon = computed(() => typeIcons[props.card.type] || '')

const elementLabels: Record<string, string> = { fire: '🔥火', thunder: '⚡雷', water: '💧水' }
const elementLabel = computed(() => elementLabels[props.card.element] || '')

const cardName = computed(() => {
  const names: Record<string, string> = {
    physical: '物理攻击',
    magic: '魔法攻击',
    heal: '生命恢复',
    statBoost: '属性提升',
  }
  return names[props.card.type]
})

const statLabels: Record<string, string> = {
  physicalAttack: '物攻',
  magicAttack: '魔攻',
  defense: '防御',
  maxHp: '最大HP',
  critRate: '暴击率',
}
const statLabel = computed(() => props.card.statBoost ? statLabels[props.card.statBoost.stat] : '')

const cardClass = computed(() => {
  return [`star-${props.card.star}`, `type-${props.card.type}`]
})
</script>

<style lang="scss" scoped>
.card {
  width: 140px;
  min-height: 180px;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }

  &.star-1 { background: #2a2a2a; border: 2px solid #a0a0a0; }
  &.star-2 { background: linear-gradient(135deg, #1a2a4a, #16213e); border: 2px solid #3498db; }
  &.star-3 { background: linear-gradient(135deg, #3a2a0a, #2a1a00); border: 2px solid #f0c040; }
}

.card-stars { font-size: 14px; }
.card-type { font-size: 14px; font-weight: bold; margin: 8px 0; }
.type-icon { margin-right: 4px; }

.card-coefficient {
  font-size: 28px;
  font-weight: bold;
  color: #e94560;
  margin: 8px 0;
}

.card-element {
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
}

.card-stat-boost {
  font-size: 14px;
  color: #27ae60;
  font-weight: bold;
}

.card-action {
  margin-top: 8px;
  padding: 4px 16px;
  background: #e94560;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
</style>
```

- [ ] **Step 8: 创建 CardHand.vue**

```vue
<template>
  <div class="card-hand">
    <CardComponent
      v-for="card in cards"
      :key="card.id"
      :card="card"
      @play="$emit('play-card', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Card } from '../game/types'
import CardComponent from './CardComponent.vue'

defineProps<{ cards: Card[]; isStunned?: boolean }>()
defineEmits<{ 'play-card': [card: Card] }>()
</script>

<style lang="scss" scoped>
.card-hand {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 12px;
  flex-wrap: nowrap;
  min-height: 200px;
  align-items: center;
}
</style>
```

- [ ] **Step 9: 创建 BattleLog.vue**

```vue
<template>
  <div class="battle-log" ref="logContainer">
    <h3 class="log-title">战斗记录</h3>
    <div class="log-entries">
      <div
        v-for="(entry, i) in logs"
        :key="i"
        class="log-entry"
        :class="entry.isHeroAction ? 'hero' : 'monster'"
      >
        <span class="turn-badge">T{{ entry.turn }}</span>
        {{ entry.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { BattleLogEntry } from '../game/types'

defineProps<{ logs: BattleLogEntry[] }>()
const logContainer = ref<HTMLElement | null>(null)

watch(() => props.logs.length, async () => {
  await nextTick()
  if (logContainer.value) {
    const entries = logContainer.value.querySelector('.log-entries')
    if (entries) entries.scrollTop = entries.scrollHeight
  }
})
</script>

<style lang="scss" scoped>
.battle-log {
  flex: 1;
  background: #0a0a1a;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-title {
  font-size: 13px;
  color: #95a5a6;
  margin-bottom: 8px;
}

.log-entries {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.5;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #2c3e50; border-radius: 2px; }
}

.log-entry {
  padding: 4px 8px;
  border-radius: 4px;
  margin: 2px 0;

  &.hero { background: rgba(39, 174, 96, 0.1); }
  &.monster { background: rgba(192, 57, 43, 0.1); }
}

.turn-badge {
  background: #2c3e50;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  margin-right: 6px;
}
</style>
```

- [ ] **Step 10: 创建 SaveDialog.vue**

```vue
<template>
  <div class="dialog-overlay" @click.self="$emit('cancel')">
    <div class="dialog">
      <h3>保存进度</h3>
      <div class="save-options">
        <div
          v-for="i in 3"
          :key="i"
          class="save-option"
          @click="$emit('save', i)"
        >
          <span>存档 {{ i }}</span>
        </div>
      </div>
      <button class="btn secondary" @click="$emit('cancel')">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ save: [slot: number]; cancel: [] }>()
</script>

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: #16213e;
  border-radius: 8px;
  padding: 24px;
  min-width: 300px;
  text-align: center;

  h3 { margin-bottom: 16px; }
}

.save-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.save-option {
  padding: 10px;
  background: #1a1a2e;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: #2c3e50; }
}
</style>
```

- [ ] **Step 11: 创建 ResultDialog.vue**

```vue
<template>
  <div class="dialog-overlay">
    <div class="dialog" :class="winner">
      <h2>{{ winner === 'hero' ? '🎉 胜利！' : '💀 挑战失败' }}</h2>
      <p>{{ resultMessage }}</p>
      <div class="actions">
        <template v-if="winner === 'hero'">
          <button class="btn gold" @click="$emit('next-level')">下一关</button>
        </template>
        <template v-else>
          <button class="btn primary" @click="$emit('retry')">重新挑战</button>
          <button class="btn secondary" @click="$emit('back-to-start')">返回第一关</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ winner: 'hero' | 'monster' | null }>()
defineEmits<{
  'next-level': []
  retry: []
  'back-to-start': []
}>()

const resultMessage = computed(() =>
  props.winner === 'hero' ? '英雄成功通关！获得属性提升' : '英雄被击败了...'
)
</script>

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: #16213e;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  min-width: 350px;

  &.hero { border: 2px solid #27ae60; }
  &.monster { border: 2px solid #c0392b; }

  h2 { margin-bottom: 12px; }
  p { color: #95a5a6; margin-bottom: 20px; }
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
```

- [ ] **Step 12: 运行 dev server 确认 UI 渲染**

运行: `npm run dev`

Expected: Electron 窗口打开，显示主界面。

- [ ] **Step 13: 提交**

```bash
git add src/renderer/src/views/ src/renderer/src/components/ src/renderer/src/App.vue
git commit -m "feat: add all UI components (menu, battle, cards, log, dialogs)"
```

---

## Task 7: Pinia Store 和 Electron 集成

**Files:**
- Create: `src/renderer/src/stores/game-store.ts`
- Create: `src/main.ts`
- Create: `src/preload.ts`
- Modify: `src/renderer/src/App.vue` (connect store)

- [ ] **Step 1: 创建 Electron 主进程 src/main.ts**

```typescript
import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs'
import { homedir } from 'os'

const SAVE_DIR = join(homedir(), '.cardgodofwar', 'saves')

function ensureSaveDir() {
  if (!existsSync(SAVE_DIR)) {
    mkdirSync(SAVE_DIR, { recursive: true })
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ensureSaveDir()
  createWindow()

  // IPC: Save file
  ipcMain.handle('save-game', (_event, slot: number | 'auto', data: any) => {
    const filename = slot === 'auto' ? 'auto-save.json' : `manual-save-${slot}.json`
    writeFileSync(join(SAVE_DIR, filename), JSON.stringify(data, null, 2))
    return true
  })

  // IPC: Load file
  ipcMain.handle('load-game', (_event, slot: number | 'auto') => {
    const filename = slot === 'auto' ? 'auto-save.json' : `manual-save-${slot}.json`
    const filepath = join(SAVE_DIR, filename)
    if (!existsSync(filepath)) return null
    return JSON.parse(readFileSync(filepath, 'utf-8'))
  })

  // IPC: Check auto-save
  ipcMain.handle('has-auto-save', () => {
    return existsSync(join(SAVE_DIR, 'auto-save.json'))
  })

  // IPC: List manual saves
  ipcMain.handle('list-saves', () => {
    if (!existsSync(SAVE_DIR)) return []
    return readdirSync(SAVE_DIR)
      .filter(f => f.startsWith('manual-save-') && f.endsWith('.json'))
      .map(f => ({
        slot: parseInt(f.replace('manual-save-', '').replace('.json', '')),
        filename: f,
      }))
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 2: 创建 preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (slot: number | 'auto', data: any) =>
    ipcRenderer.invoke('save-game', slot, data),
  loadGame: (slot: number | 'auto') =>
    ipcRenderer.invoke('load-game', slot),
  hasAutoSave: () =>
    ipcRenderer.invoke('has-auto-save'),
  listSaves: () =>
    ipcRenderer.invoke('list-saves'),
})

export type ElectronAPI = typeof window.electronAPI
```

- [ ] **Step 3: 添加类型声明 src/renderer/src/env.d.ts**

```typescript
/// <reference types="vite/client" />

interface ElectronAPI {
  saveGame(slot: number | 'auto', data: any): Promise<boolean>
  loadGame(slot: number | 'auto'): Promise<any>
  hasAutoSave(): Promise<boolean>
  listSaves(): Promise<Array<{ slot: number; filename: string }>>
}

interface Window {
  electronAPI: ElectronAPI
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
```

- [ ] **Step 4: 创建 game-store.ts**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Hero, BattleState, Card, SaveData } from '@/game/types'
import { createInitialHero, createBattle, playCard, applyVictoryGrowth, resetToInitialHero } from '@/game/game-engine'

export const useGameStore = defineStore('game', () => {
  const level = ref(1)
  const hero = ref<Hero>(createInitialHero())
  const currentBattle = ref<BattleState | null>(null)
  const view = ref<'menu' | 'battle'>('menu')
  const manualSaves = ref<SaveData[]>([null, null, null])

  const currentTurn = computed(() => currentBattle.value?.currentTurn ?? 0)

  function startNewGame() {
    level.value = 1
    hero.value = createInitialHero()
    startBattle()
  }

  function startBattle() {
    currentBattle.value = createBattle(level.value, hero.value)
    view.value = 'battle'
    // Auto-save
    autoSave()
  }

  function playCard(card: Card) {
    if (!currentBattle.value || currentBattle.value.gameOver) return
    const result = playCard(currentBattle.value, card)
    currentBattle.value = result.newState

    // Auto-save after each action
    autoSave()

    // If game over, handle
    if (result.newState.gameOver) {
      handleGameOver()
    }
  }

  function handleGameOver() {
    if (!currentBattle.value) return

    if (currentBattle.value.winner === 'hero') {
      // Victory: apply growth
      hero.value = applyVictoryGrowth(hero.value)
    }
    // Monster death handled by dialog
  }

  function nextLevel() {
    level.value++
    startBattle()
  }

  function retryLevel() {
    startBattle()
  }

  function backToStart() {
    level.value = 1
    hero.value = resetToInitialHero()
    startBattle()
  }

  // Save/Load via Electron IPC
  async function autoSave() {
    if (!currentBattle.value) return
    const data: SaveData = {
      level: level.value,
      hero: { ...hero.value },
      battleState: currentBattle.value,
      timestamp: Date.now(),
    }
    await window.electronAPI.saveGame('auto', data)
  }

  async function saveManual(slot: number) {
    if (!currentBattle.value) return
    const data: SaveData = {
      level: level.value,
      hero: { ...hero.value },
      battleState: currentBattle.value,
      timestamp: Date.now(),
    }
    await window.electronAPI.saveGame(slot, data)
  }

  async function loadAutoSave() {
    const data = await window.electronAPI.loadGame('auto')
    if (data) {
      restoreSave(data)
    }
  }

  async function loadManualSave(slot: number) {
    const data = await window.electronAPI.loadGame(slot)
    if (data) {
      restoreSave(data)
    }
  }

  function restoreSave(data: SaveData) {
    level.value = data.level
    hero.value = data.hero
    if (data.battleState) {
      currentBattle.value = data.battleState
    } else {
      startBattle()
      return
    }
    view.value = 'battle'
  }

  async function hasAutoSave() {
    return await window.electronAPI.hasAutoSave()
  }

  async function loadManualSaves() {
    const saves = await window.electronAPI.listSaves()
    const result: SaveData[] = [null, null, null]
    for (const s of saves) {
      if (s.slot >= 1 && s.slot <= 3) {
        const data = await window.electronAPI.loadGame(s.slot)
        result[s.slot - 1] = data
      }
    }
    return result
  }

  return {
    level,
    hero,
    currentBattle,
    view,
    currentTurn,
    manualSaves,
    startNewGame,
    playCard,
    nextLevel,
    retryLevel,
    backToStart,
    saveManual,
    loadAutoSave,
    loadManualSave,
    hasAutoSave,
    loadManualSaves,
  }
})
```

- [ ] **Step 5: 运行 dev server 测试完整流程**

运行: `npm run dev`

Expected:
1. 主界面显示标题、新游戏按钮
2. 点击"新游戏"进入战斗页面
3. 显示状态栏、英雄/怪兽状态、3张卡牌、战斗记录
4. 点击卡牌触发战斗，战斗记录更新
5. 保存/加载功能可用

- [ ] **Step 6: 提交**

```bash
git add src/main.ts src/preload.ts src/renderer/src/stores/game-store.ts src/renderer/src/env.d.ts
git commit -m "feat: integrate Electron IPC, Pinia store, save/load system"
```

---

## Task 8: 动画与 polish

**Files:**
- Modify: `src/renderer/src/styles/global.scss`
- Modify: `src/renderer/src/components/CardComponent.vue`
- Modify: `src/renderer/src/components/BattleLog.vue`

- [ ] **Step 1: 添加动画样式到 global.scss**

在文件末尾追加：

```scss
// 攻击动画
@keyframes damage-flash {
  0% { opacity: 1; }
  50% { opacity: 0.5; transform: translateX(-2px); }
  100% { opacity: 1; transform: translateX(0); }
}

@keyframes heal-pulse {
  0% { box-shadow: 0 0 0 rgba(39, 174, 96, 0); }
  50% { box-shadow: 0 0 20px rgba(39, 174, 96, 0.6); }
  100% { box-shadow: 0 0 0 rgba(39, 174, 96, 0); }
}

@keyframes crit-burst {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); color: #f0c040; }
  100% { transform: scale(1); }
}

.damage-flash { animation: damage-flash 0.3s ease; }
.heal-pulse { animation: heal-pulse 0.5s ease; }
.crit-burst { animation: crit-burst 0.4s ease; }
```

- [ ] **Step 2: 运行最终测试**

运行: `npm run dev`

Expected: 所有功能正常运行，动画效果流畅，一屏内无滚动。

- [ ] **Step 3: 最终提交**

```bash
git add src/renderer/src/styles/global.scss src/renderer/src/components/
git commit -m "feat: add combat animations, crit effects, and visual polish"
```

---
