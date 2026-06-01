import type { Stats, RelicDefinition, MonsterArchetype, MonsterArchetypeId, CardBiasState, Element, MonsterSkillType, CardStar } from './types'

// --- 统一显示标签（单一事实源，避免多处重复定义） ---
export const ELEMENT_LABELS: Record<Element, string> = {
  fire: '火',
  thunder: '雷',
  water: '水',
}

export const STAT_LABELS: Record<keyof Stats, string> = {
  physicalAttack: '物攻',
  magicAttack: '魔攻',
  defense: '防御',
  maxHp: '最大HP',
  critRate: '暴击率',
}

export const SKILL_LABELS: Record<MonsterSkillType, string> = {
  shield: '护盾',
  lifesteal: '吸血',
  critBoost: '暴击强化',
  elementImmune: '元素免疫',
  stun: '眩晕',
}

// 英雄初始属性
export const HERO_INITIAL_STATS: Stats = {
  physicalAttack: 10,
  magicAttack: 10,
  defense: 5,
  maxHp: 100,
  critRate: 0,
}

// 英雄胜利后成长 (被奖励系统替代，保留作回退)
export const HERO_VICTORY_GROWTH: Stats = {
  physicalAttack: 3,
  magicAttack: 3,
  defense: 2,
  maxHp: 10,
  critRate: 2,
}

// --- 奖励常量 ---
export const ATTRIBUTE_REWARD_AMOUNTS: Record<keyof Omit<Stats, 'critRate'>, [number, number, number]> = {
  physicalAttack: [3, 4, 5],
  magicAttack: [3, 4, 5],
  defense: [2, 3, 4],
  maxHp: [10, 15, 20],
}
export const ATTRIBUTE_REWARD_CRIT_AMOUNTS: [number, number, number] = [2, 3, 4]

// --- 遗物定义 ---
export const RELIC_REGISTRY: RelicDefinition[] = [
  {
    id: 'flame-emblem',
    name: '火炎纹章',
    shortDescription: '火属性攻击伤害+25%',
    triggerTiming: ['outgoingDamage'],
    effect: { type: 'elementDamageBonus', element: 'fire', bonus: 0.25 },
  },
  {
    id: 'thunder-core',
    name: '雷霆核心',
    shortDescription: '使用雷属性攻击后，下回合攻击+15%',
    triggerTiming: ['nextTurn'],
    effect: { type: 'nextTurnAttackBonus', element: 'thunder', bonusPercent: 0.15 },
  },
  {
    id: 'water-spirit-bottle',
    name: '水灵瓶',
    shortDescription: '治疗溢出部分转为护盾(50%)',
    triggerTiming: ['onHealOverflow'],
    effect: { type: 'healOverflowToShield', overflowPercent: 0.5 },
  },
  {
    id: 'armor-breaker-blade',
    name: '破甲之刃',
    shortDescription: '克制属性攻击命中后，使怪兽破防(40%/3次)',
    triggerTiming: ['outgoingDamage'],
    effect: { type: 'advantageBreakDefense', reductionPercent: 40, uses: 3 },
  },
  {
    id: 'blood-rage-sigil',
    name: '血怒符文',
    shortDescription: 'HP低于30%时，伤害+20%',
    triggerTiming: ['outgoingDamage'],
    effect: { type: 'lowHpDamageBonus', thresholdPercent: 30, bonusPercent: 0.2 },
  },
  {
    id: 'ironwall-crest',
    name: '铁壁庇护',
    shortDescription: '护盾获取量+30%',
    triggerTiming: ['outgoingDamage'],
    effect: { type: 'shieldGainBonus', bonusPercent: 0.3 },
  },
  {
    id: 'sharp-charm',
    name: '锐利护符',
    shortDescription: '暴击伤害倍率+0.3',
    triggerTiming: ['onCrit'],
    effect: { type: 'critMultiplierBonus', bonus: 0.3 },
  },
  {
    id: 'regrowth-seed',
    name: '复生之种',
    shortDescription: '战斗开始时恢复20HP',
    triggerTiming: ['battleStart'],
    effect: { type: 'battleStartRecovery', amount: 20 },
  },
]

// --- 怪物原型常量 ---
export const MONSTER_ARCHETYPES: Record<MonsterArchetypeId, MonsterArchetype> = {
  berserker: {
    id: 'berserker',
    name: '狂战士',
    statModifiers: { physicalAttack: 5, defense: -2 },
    skillTendencies: { critBoost: 20, stun: 10 },
  },
  stoneGuard: {
    id: 'stoneGuard',
    name: '石卫',
    statModifiers: { defense: 5, maxHp: 10 },
    skillTendencies: { shield: 20 },
  },
  bloodBat: {
    id: 'bloodBat',
    name: '血蝠',
    statModifiers: { maxHp: -10 },
    skillTendencies: { lifesteal: 20 },
  },
  thunderBug: {
    id: 'thunderBug',
    name: '雷虫',
    statModifiers: { maxHp: -5, critRate: 10 },
    skillTendencies: { stun: 15, critBoost: 10 },
  },
  stoneGeneral: {
    id: 'stoneGeneral',
    name: '石将军',
    statModifiers: { defense: 8, maxHp: 20 },
    skillTendencies: { shield: 30 },
    shieldPressureCadence: 3,
  },
  generic: {
    id: 'generic',
    name: '普通',
    statModifiers: {},
    skillTendencies: {},
  },
}

// 默认卡牌偏向状态（中性）
export const DEFAULT_CARD_BIAS: CardBiasState = {
  typeWeights: { physical: 10, magic: 10, heal: 8, statBoost: 6, guard: 4, tactical: 4 },
  elementWeights: {},
  starWeights: {},
}

// 卡牌偏向上限
export const CARD_BIAS_CAP = 3

// 卡牌偏向每级权重增量
export const CARD_BIAS_WEIGHT_PER_LEVEL = 3

// 怪兽第1关基础属性
export const MONSTER_BASE_STATS = {
  physicalAttack: 8,
  magicAttack: 8,
  defense: 3,
  baseHp: 40,
  critRate: 5,
}

// 怪兽每关成长（非血量）
export const MONSTER_PER_LEVEL_GROWTH = {
  physicalAttack: 3,
  magicAttack: 3,
  defense: 1,
  critRate: 1,
}

// 怪兽血量指数公式指数
export const MONSTER_HP_EXPONENT = 1.05

// Boss 基础血量
export const BOSS_BASE_HP = 50

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

// 卡牌类型比例 (物理:魔法:恢复:属性:防御:战术 = 10:10:8:6:4:4)
export const CARD_TYPE_WEIGHTS = [
  ...Array(10).fill('physical'),
  ...Array(10).fill('magic'),
  ...Array(8).fill('heal'),
  ...Array(6).fill('statBoost'),
  ...Array(4).fill('guard'),
  ...Array(4).fill('tactical'),
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
  heal:     { 1: [0.4, 0.5], 2: [0.5, 0.7], 3: [0.7, 1.0] },
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

// --- 防御卡护盾系数（按星级，护盾 = floor(防御 × 系数)） ---
export const GUARD_SHIELD_COEFFICIENTS: Record<CardStar, number> = { 1: 1.0, 2: 1.5, 3: 2.0 }

// --- 战术卡系数范围 (低于标准攻击卡) ---
export const TACTICAL_COEFFICIENTS = {
  armorBreak: { 1: [0.5, 0.8], 2: [0.8, 1.2], 3: [1.2, 1.6] },
  suppress: { 1: [0.5, 0.8], 2: [0.8, 1.2], 3: [1.2, 1.6] },
} as const

// --- 状态常量 ---
// 破防: 降低40%防御(向下取整), 持续3次英雄攻击/战术伤害行动
export const BREAK_DEFENSE_REDUCTION_PERCENT = 40
export const BREAK_DEFENSE_REDUCTION_DIVISOR = 100
export const BREAK_DEFENSE_USES = 3

// 虚弱: 怪兽下次攻击伤害×0.8
export const WEAK_MULTIPLIER = 0.8
export const WEAK_USES = 1

// 石将军盾压节拍: 每3回合必定触发盾压
export const STONE_GENERAL_SHIELD_CADENCE = 3
