import type { Stats } from './types'

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
