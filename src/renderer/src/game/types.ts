// 元素类型
export type Element = 'fire' | 'thunder' | 'water'

// 卡牌类型
export type CardType = 'physical' | 'magic' | 'heal' | 'statBoost'

// 卡牌星级
export type CardStar = 1 | 2 | 3

// 战斗阶段
export type BattlePhase = 'playerAction' | 'monsterAction' | 'resolving' | 'gameOver'

// 战斗结果
export interface BattleResult {
  winner: 'hero' | 'monster'
  reason: 'defeat' | 'turnLimit'
}

export type BattleActor = 'hero' | 'monster'
export type BattleStatusType = 'stun'

export interface BattleStatusEffect {
  target: BattleActor
  type: BattleStatusType
}

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
  element: Element | undefined // 攻击卡有元素，恢复/属性卡为 undefined
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
  immuneElement?: Element // elementImmune 技能需要
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
  eventId?: string
}

interface BattleEventBase {
  id: string
  turn: number
  type: string
  message: string
  actor?: BattleActor
  target?: BattleActor
}

export interface DamageEvent extends BattleEventBase {
  type: 'damage'
  actor: BattleActor
  target: BattleActor
  amount: number
  damageType: 'physical' | 'magic'
  element?: Element
  elementMultiplier: number
  isCrit: boolean
  isShield: boolean
  isImmune: boolean
  enrageMultiplier: number
  intentId?: string
}

export interface HealEvent extends BattleEventBase {
  type: 'heal'
  actor: BattleActor
  target: BattleActor
  amount: number
  beforeHp: number
  afterHp: number
  source: 'card' | 'lifesteal'
  intentId?: string
}

export interface StatBoostEvent extends BattleEventBase {
  type: 'statBoost'
  actor: 'hero'
  target: 'hero'
  stat: keyof Stats
  amount: number
  beforeValue: number
  afterValue: number
}

export interface SkillTriggeredEvent extends BattleEventBase {
  type: 'skillTriggered'
  actor: 'monster'
  skill: MonsterSkillType
  immuneElement?: Element
  intentId?: string
}

export interface StatusEvent extends BattleEventBase {
  type: 'status'
  actor: BattleActor
  target: BattleActor
  status: BattleStatusType
  action: 'applied' | 'consumed' | 'rejected'
  intentId?: string
}

export interface TurnSkippedEvent extends BattleEventBase {
  type: 'turnSkipped'
  actor: 'hero'
}

export interface TurnAdvancedEvent extends BattleEventBase {
  type: 'turnAdvanced'
  nextTurn: number
}

export interface BattleEndedEvent extends BattleEventBase {
  type: 'battleEnded'
  winner: 'hero' | 'monster'
  reason: 'defeat' | 'turnLimit'
}

export interface IntentCreatedEvent extends BattleEventBase {
  type: 'intentCreated'
  intentId: string
}

export interface IntentConsumedEvent extends BattleEventBase {
  type: 'intentConsumed'
  intentId: string
}

export type BattleEvent =
  | DamageEvent
  | HealEvent
  | StatBoostEvent
  | SkillTriggeredEvent
  | StatusEvent
  | TurnSkippedEvent
  | TurnAdvancedEvent
  | BattleEndedEvent
  | IntentCreatedEvent
  | IntentConsumedEvent

export type MonsterIntentAction = 'attack'
export type IntentSkillTiming = 'monsterAction' | 'heroActionDefense'

export interface MonsterIntentSkill {
  type: MonsterSkillType
  timing: IntentSkillTiming
  immuneElement?: Element
  willTrigger: boolean
  label: string
}

export interface MonsterIntent {
  id: string
  turn: number
  source: 'generated' | 'restored'
  action: MonsterIntentAction
  attackType: 'physical' | 'magic'
  baseAttack: number
  estimatedDamage: number
  critDamage: number
  critRate: number
  element: Element
  enrageMultiplier: number
  skills: MonsterIntentSkill[]
  message: string
}

export interface GenerateMonsterIntentInput {
  level: number
  hero: Hero
  monster: Monster
  currentTurn: number
  maxTurns: number
  isEnraged: boolean
  source?: 'generated' | 'restored'
}

export interface DamagePreview {
  baseDamage: number
  afterDefense: number
  elementMultiplier: number
  estimatedDamage: number
  critDamage: number
  critRate: number
  critMultiplier: number
}

export type CardOutcomeEstimate =
  | {
      type: 'damage'
      amount: number
      critDamage: number
      critRate: number
      critMultiplier: number
      critLabel: '暴击' | '强化暴击'
      elementMultiplier: number
      isBlockedByStun: false
      isShielded: boolean
      isImmune: boolean
      text: string
    }
  | {
      type: 'blocked'
      reason: 'stun'
      isBlockedByStun: true
      text: '眩晕中'
    }
  | { type: 'heal'; amount: number; text: string }
  | { type: 'statBoost'; stat: keyof Stats; amount: number; text: string }
  | {
      type: 'unavailable'
      reason: 'missingIntent' | 'gameOver'
      text: ''
    }

// 战斗状态
export interface BattleState {
  level: number
  hero: Hero
  monster: Monster
  currentTurn: number
  maxTurns: number
  cards: Card[]
  phase: BattlePhase
  result: BattleResult | null
  statusEffects: BattleStatusEffect[]
  events: BattleEvent[]
  logs: BattleLogEntry[]
  isPlayerTurn: boolean
  isEnraged: boolean
  gameOver: boolean
  winner: 'hero' | 'monster' | null
  monsterIntent: MonsterIntent
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
