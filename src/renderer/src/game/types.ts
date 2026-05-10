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
