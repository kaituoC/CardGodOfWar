// 元素类型
export type Element = 'fire' | 'thunder' | 'water'

// 卡牌类型
export type CardType = 'physical' | 'magic' | 'heal' | 'statBoost' | 'guard' | 'tactical'

// 战术卡效果子类型
export type TacticalEffect = 'armorBreak' | 'suppress'

// 卡牌星级
export type CardStar = 1 | 2 | 3

// 战斗阶段
export type BattlePhase = 'playerAction' | 'monsterAction' | 'resolving' | 'gameOver' | 'rewardSelection'

// 战斗结果
export interface BattleResult {
  winner: 'hero' | 'monster'
  reason: 'defeat' | 'turnLimit'
}

export type BattleActor = 'hero' | 'monster'
export type BattleStatusType = 'stun' | 'shield' | 'breakDefense' | 'weak'

// --- 奖励系统 ---
export type RewardType = 'attribute' | 'relic' | 'cardBias'

export interface AttributeReward {
  id: string
  type: 'attribute'
  stat: keyof Stats
  amount: number
  label: string
  description: string
}

export interface RelicReward {
  id: string
  type: 'relic'
  relicId: string
  label: string
  description: string
}

export interface CardBiasReward {
  id: string
  type: 'cardBias'
  biasCategory: 'type' | 'element' | 'star'
  biasKey: string
  level: number
  label: string
  description: string
}

export type Reward = AttributeReward | RelicReward | CardBiasReward

export interface PendingRewardChoice {
  rewards: Reward[]
}

// --- 遗物系统 ---
export type RelicTriggerTiming = 'outgoingDamage' | 'onCrit' | 'onHealOverflow' | 'battleStart' | 'nextTurn' | 'lowHp'

export interface RelicDefinition {
  id: string
  name: string
  shortDescription: string
  triggerTiming: RelicTriggerTiming[]
  effect: RelicEffect
}

export type RelicEffect =
  | { type: 'elementDamageBonus'; element: Element; bonus: number }
  | { type: 'nextTurnAttackBonus'; element: Element; bonusPercent: number }
  | { type: 'healOverflowToShield'; overflowPercent: number }
  | { type: 'advantageBreakDefense'; reductionPercent: number; uses: number }
  | { type: 'lowHpDamageBonus'; thresholdPercent: number; bonusPercent: number }
  | { type: 'shieldGainBonus'; bonusPercent: number }
  | { type: 'critMultiplierBonus'; bonus: number }
  | { type: 'battleStartRecovery'; amount: number }

export interface NextTurnRelicModifier {
  relicId: string
  bonusPercent: number
  expiresAfterTurn: number
}

// --- 卡牌偏向 ---
export interface CardBiasState {
  typeWeights: Record<CardType, number>
  elementWeights: Partial<Record<Element, number>>
  starWeights: Partial<Record<CardStar, number>>
}

// --- 状态效果 ---
export interface BreakDefenseStatus {
  target: BattleActor
  type: 'breakDefense'
  reductionPercent: number
  remainingUses: number
}

export interface WeakStatus {
  target: BattleActor
  type: 'weak'
  multiplier: number
  remainingUses: number
}

export interface ShieldStatus {
  target: BattleActor
  type: 'shield'
  amount: number
}

export type ExpandedStatus = StunStatus | BreakDefenseStatus | WeakStatus | ShieldStatus

export interface StunStatus {
  target: BattleActor
  type: 'stun'
}

// Kept for backwards compat — use StunStatus directly
export interface BattleStatusEffect {
  target: BattleActor
  type: BattleStatusType
}

// --- 怪物原型 ---
export type MonsterArchetypeId = 'berserker' | 'stoneGuard' | 'bloodBat' | 'thunderBug' | 'stoneGeneral' | 'generic'

export interface MonsterArchetype {
  id: MonsterArchetypeId
  name: string
  statModifiers: Partial<Record<keyof Stats, number>>
  skillTendencies: Partial<Record<MonsterSkillType, number>>
  elementTendency?: Element
  shieldPressureCadence?: number
}

export interface MonsterArchetypeMetadata {
  id: MonsterArchetypeId
  name: string
  shieldPressureCadence?: number
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
  effect?: TacticalEffect // guard/tactical 卡的效果标识
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
  archetype?: MonsterArchetypeMetadata
}

// 英雄
export interface Hero {
  stats: Stats
  currentHp: number
  isStunned: boolean // 眩晕状态
  relics: string[] // 遗物ID列表
}

// 战斗日志条目
export type BattleLogKind = 'relic' | 'shield' | 'status' | 'reward' | 'heal' | 'skill'

export interface BattleLogEntry {
  turn: number
  message: string
  isHeroAction: boolean
  eventId?: string
  // 事件分类，供战斗日志按类型加图标/着色；旧存档可能缺失（按普通条目渲染）
  kind?: BattleLogKind
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
  shieldAbsorbed?: number
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
  overflow?: number
  shieldConversion?: number
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
  action: 'applied' | 'consumed' | 'rejected' | 'expired'
  amount?: number
  remainingUses?: number
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

export interface RelicTriggerEvent extends BattleEventBase {
  type: 'relicTriggered'
  relicId: string
  actor: BattleActor
  triggerTiming: RelicTriggerTiming
  affectedAmount?: number
}

export interface RewardSelectedEvent extends BattleEventBase {
  type: 'rewardSelected'
  rewardId: string
  rewardType: RewardType
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
  | RelicTriggerEvent
  | RewardSelectedEvent

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
  relicContext?: string[]
  existingStatuses?: ExpandedStatus[]
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
  | { type: 'heal'; amount: number; overflowShield?: number; text: string }
  | { type: 'statBoost'; stat: keyof Stats; amount: number; text: string }
  | { type: 'guard'; shieldAmount: number; text: string }
  | { type: 'tactical'; amount: number; damageEstimate: number; statusApplied: 'breakDefense' | 'weak'; statusText: string; text: string }
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
  statusEffects: ExpandedStatus[]
  events: BattleEvent[]
  logs: BattleLogEntry[]
  isPlayerTurn: boolean
  isEnraged: boolean
  gameOver: boolean
  winner: 'hero' | 'monster' | null
  // 活跃战斗中始终存在；战斗结束或旧存档恢复时可能暂时为 null（消费点需防御处理）
  monsterIntent: MonsterIntent | null
  pendingRewards?: PendingRewardChoice | null
  nextTurnRelicModifiers?: NextTurnRelicModifier[]
}

// 存档数据
export interface SaveData {
  level: number
  hero: Hero
  battleState: BattleState | null
  timestamp: number
  cardBias?: CardBiasState
  pendingRewards?: PendingRewardChoice | null
}

// 游戏全局状态
export interface GameState {
  level: number
  hero: Hero
  currentBattle: BattleState | null
  view: 'menu' | 'battle'
  cardBias: CardBiasState
}

// --- 规范化 helpers ---
import { DEFAULT_CARD_BIAS, RELIC_REGISTRY, MONSTER_ARCHETYPES } from './constants'

export function normalizeRelics(relics: unknown): string[] {
  if (!Array.isArray(relics)) return []
  const knownIds = new Set(RELIC_REGISTRY.map(r => r.id))
  return relics.filter((r): r is string => typeof r === 'string' && knownIds.has(r))
}

export function normalizeCardBias(raw: unknown): CardBiasState {
  if (raw && typeof raw === 'object' && 'typeWeights' in raw) {
    return raw as CardBiasState
  }
  return { ...DEFAULT_CARD_BIAS }
}

export function normalizeExpandedStatuses(statuses: unknown): ExpandedStatus[] {
  if (!Array.isArray(statuses)) return []
  return statuses.filter((s): s is ExpandedStatus => {
    if (!s || typeof s !== 'object') return false
    const obj = s as Record<string, unknown>
    return 'target' in obj && 'type' in obj
  })
}

export function normalizeMonsterArchetype(archetype: unknown): MonsterArchetypeMetadata | undefined {
  if (!archetype || typeof archetype !== 'object') return undefined
  const obj = archetype as Record<string, unknown>
  if ('id' in obj && typeof obj.id === 'string' && obj.id in MONSTER_ARCHETYPES) {
    return {
      id: obj.id as MonsterArchetypeId,
      name: (obj.name as string) || MONSTER_ARCHETYPES[obj.id as MonsterArchetypeId].name,
      shieldPressureCadence: typeof obj.shieldPressureCadence === 'number' ? obj.shieldPressureCadence : undefined,
    }
  }
  return undefined
}
