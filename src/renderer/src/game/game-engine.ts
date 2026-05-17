import type {
  BattleEvent,
  BattleLogEntry,
  BattleResult,
  BattleState,
  Card,
  Element,
  Hero,
  MonsterSkill,
  MonsterSkillType,
  MonsterIntent,
  Stats,
} from './types'
import type { DamageResult } from './battle-calculator'
import { calculateDamage } from './battle-calculator'
import { generateCards } from './card-pool'
import { generateMonster } from './monster-generator'
import { generateMonsterIntent } from './monster-intent'
import {
  HERO_INITIAL_STATS,
  HERO_VICTORY_GROWTH,
  MAX_TURNS,
  ENRAGE_START_TURN,
} from './constants'

const elementNames: Record<Element, string> = { fire: '火', thunder: '雷', water: '水' }
const statNames: Record<keyof Stats, string> = {
  physicalAttack: '物攻',
  magicAttack: '魔攻',
  defense: '防御',
  maxHp: '最大HP',
  critRate: '暴击率',
}
const skillNames: Record<MonsterSkillType, string> = {
  shield: '护盾',
  lifesteal: '吸血',
  critBoost: '暴击强化',
  elementImmune: '元素免疫',
  stun: '眩晕',
}

let eventIdCounter = 0

type BattleEventInput = BattleEvent extends infer T
  ? T extends { id: string }
    ? Omit<T, 'id'>
    : never
  : never

function createEvent(event: BattleEventInput): BattleEvent {
  eventIdCounter += 1
  return { ...event, id: `event-${eventIdCounter}` }
}

function eventToLog(event: BattleEvent): BattleLogEntry {
  return {
    turn: event.turn,
    message: event.message,
    isHeroAction: event.actor === 'hero' || (event.type === 'battleEnded' && event.winner === 'hero'),
    eventId: event.id,
  }
}

function appendEvents(state: BattleState, events: BattleEvent[]): BattleState {
  const logEntries = events
    .filter(e => e.type !== 'intentCreated' && e.type !== 'intentConsumed')
    .map(eventToLog)
  return {
    ...state,
    events: [...state.events, ...events],
    logs: [...state.logs, ...logEntries],
  }
}

function isAttackCard(card: Card): boolean {
  return card.type === 'physical' || card.type === 'magic'
}

function activeStatusEffects(hero: Hero) {
  return hero.isStunned ? [{ target: 'hero' as const, type: 'stun' as const }] : []
}

function withResult(state: BattleState, result: BattleResult, events: BattleEvent[]): BattleState {
  const next = appendEvents(state, [
    ...events,
    createEvent({
      type: 'battleEnded',
      turn: state.currentTurn,
      winner: result.winner,
      reason: result.reason,
      message: result.winner === 'hero' ? '战斗胜利！' : result.reason === 'turnLimit' ? '回合耗尽，挑战失败' : '英雄被击败了',
    }),
  ])

  return {
    ...next,
    phase: 'gameOver',
    result,
    isPlayerTurn: false,
    gameOver: true,
    winner: result.winner,
  }
}

function createSkillEvent(turn: number, skill: MonsterSkill, intentId?: string): BattleEvent {
  const suffix = skill.immuneElement ? `(${elementNames[skill.immuneElement]})` : ''
  return createEvent({
    type: 'skillTriggered',
    turn,
    actor: 'monster',
    skill: skill.type,
    immuneElement: skill.immuneElement,
    intentId,
    message: `怪兽触发${skillNames[skill.type]}${suffix}`,
  })
}

function createIntentCreatedEvent(turn: number, intentId: string): BattleEvent {
  return createEvent({
    type: 'intentCreated',
    turn,
    intentId,
    message: `怪兽意图已生成: ${intentId}`,
  })
}

function createIntentConsumedEvent(turn: number, intentId: string): BattleEvent {
  return createEvent({
    type: 'intentConsumed',
    turn,
    intentId,
    message: `怪兽意图已执行: ${intentId}`,
  })
}

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
  const battleHero = { ...hero, stats: { ...hero.stats }, isStunned: false }
  const initialState: BattleState = {
    level,
    hero: battleHero,
    monster,
    currentTurn: 1,
    maxTurns: MAX_TURNS,
    cards: generateCards(level),
    phase: 'playerAction',
    result: null,
    statusEffects: activeStatusEffects(battleHero),
    events: [],
    logs: [],
    isPlayerTurn: true,
    isEnraged: false,
    gameOver: false,
    winner: null,
    monsterIntent: null as unknown as MonsterIntent, // will be set below
  }

  const intent = generateMonsterIntent({
    level,
    hero: battleHero,
    monster,
    currentTurn: 1,
    maxTurns: MAX_TURNS,
    isEnraged: false,
    source: 'generated',
  })

  initialState.monsterIntent = intent
  initialState.events = [createIntentCreatedEvent(1, intent.id)]
  initialState.logs = initialState.events
    .filter(e => e.type !== 'intentCreated' && e.type !== 'intentConsumed')
    .map(eventToLog)

  return initialState
}

export function playCard(state: BattleState, card: Card): { newState: BattleState; damageResult?: DamageResult } {
  if (state.phase !== 'playerAction' || state.gameOver) return { newState: state }

  if (isAttackCard(card) && state.hero.isStunned) {
    const rejected = createEvent({
      type: 'status',
      turn: state.currentTurn,
      actor: 'hero',
      target: 'hero',
      status: 'stun',
      action: 'rejected',
      message: '眩晕中！无法使用攻击卡牌！',
    })
    return { newState: appendEvents(state, [rejected]) }
  }

  return resolvePlayerAction(state, card)
}

export function skipTurn(state: BattleState): BattleState {
  if (state.phase !== 'playerAction' || state.gameOver) return state
  return resolvePlayerAction(state, null).newState
}

function resolvePlayerAction(state: BattleState, card: Card | null): { newState: BattleState; damageResult?: DamageResult } {
  const playerResult = resolveHeroAction(state, card)
  let nextState = playerResult.state
  let damageResult = playerResult.damageResult

  if (nextState.gameOver) return { newState: nextState, damageResult }

  nextState = {
    ...nextState,
    phase: 'monsterAction',
    isPlayerTurn: false,
  }

  const monsterResult = resolveMonsterAction(nextState)
  nextState = monsterResult.state
  damageResult = damageResult ?? monsterResult.damageResult

  if (nextState.gameOver) return { newState: nextState, damageResult }

  nextState = finishTurn(nextState)
  return { newState: nextState, damageResult }
}

function resolveHeroAction(state: BattleState, card: Card | null): { state: BattleState; damageResult?: DamageResult } {
  const events: BattleEvent[] = []
  let nextState = state
  let damageResult: DamageResult | undefined

  if (card === null) {
    events.push(createEvent({
      type: 'turnSkipped',
      turn: state.currentTurn,
      actor: 'hero',
      message: '英雄跳过行动',
    }))
    return { state: consumeStunIfNeeded(nextState, events) }
  }

  if (card.type === 'physical' || card.type === 'magic') {
    const attack = card.type === 'physical' ? state.hero.stats.physicalAttack : state.hero.stats.magicAttack
    const intent = state.monsterIntent
    const shield = intent?.skills.find(s => s.type === 'shield' && s.willTrigger)
    const immune = intent?.skills.find(s => s.type === 'elementImmune' && s.willTrigger)
    const intentId = intent?.id

    if (shield) events.push(createSkillEvent(state.currentTurn, { type: 'shield', triggerChance: 100 }, intentId))
    if (immune) events.push(createSkillEvent(state.currentTurn, { type: 'elementImmune', immuneElement: immune.immuneElement, triggerChance: 100 }, intentId))

    damageResult = calculateDamage({
      attack,
      coefficient: card.coefficient,
      defense: state.monster.stats.defense,
      cardElement: card.element!,
      monsterElement: state.monster.element,
      critRate: state.hero.stats.critRate,
      isShield: Boolean(shield),
      isCritBoost: false,
      isImmuneToElement: immune?.immuneElement ?? null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })

    const monsterHp = Math.max(state.monster.currentHp - damageResult.finalDamage, 0)
    const typeLabel = card.type === 'physical' ? '物理' : '魔法'
    const elementText = damageResult.elementMultiplier !== 1.0
      ? `, ${elementNames[card.element!]}${damageResult.elementMultiplier > 1 ? '克制' : '被克'}${elementNames[state.monster.element]} ×${damageResult.elementMultiplier}`
      : immune?.immuneElement === card.element
        ? `, ${elementNames[card.element!]}免疫中性 ×1`
        : ''
    const critText = damageResult.isCrit ? ' 暴击！' : ''

    events.push(createEvent({
      type: 'damage',
      turn: state.currentTurn,
      actor: 'hero',
      target: 'monster',
      amount: damageResult.finalDamage,
      damageType: card.type,
      element: card.element,
      elementMultiplier: damageResult.elementMultiplier,
      isCrit: damageResult.isCrit,
      isShield: Boolean(shield),
      isImmune: immune?.immuneElement === card.element,
      enrageMultiplier: 1.0,
      intentId,
      message: `英雄使用${typeLabel}攻击: ${attack} × ${card.coefficient} = ${Math.round(damageResult.baseDamage * 10) / 10}${elementText}, 防御-${state.monster.stats.defense} = ${damageResult.finalDamage}伤害${critText}`,
    }))

    nextState = {
      ...state,
      monster: { ...state.monster, currentHp: monsterHp },
    }

    if (monsterHp <= 0) {
      return {
        state: withResult(nextState, { winner: 'hero', reason: 'defeat' }, events),
        damageResult,
      }
    }

    return { state: appendEvents(nextState, events), damageResult }
  }

  if (card.type === 'heal') {
    const healAmount = Math.floor(state.hero.stats.maxHp * card.coefficient)
    const newHp = Math.min(state.hero.currentHp + healAmount, state.hero.stats.maxHp)
    events.push(createEvent({
      type: 'heal',
      turn: state.currentTurn,
      actor: 'hero',
      target: 'hero',
      amount: newHp - state.hero.currentHp,
      beforeHp: state.hero.currentHp,
      afterHp: newHp,
      source: 'card',
      message: `英雄恢复 ${newHp - state.hero.currentHp} HP (${state.hero.currentHp} → ${newHp})`,
    }))

    nextState = {
      ...state,
      hero: { ...state.hero, currentHp: newHp },
    }

    return { state: consumeStunIfNeeded(nextState, events) }
  }

  if (card.type === 'statBoost' && card.statBoost) {
    const { stat, value } = card.statBoost
    const beforeValue = state.hero.stats[stat]
    const afterValue = stat === 'critRate'
      ? Math.min(beforeValue + value, 100)
      : beforeValue + value
    const newStats = { ...state.hero.stats, [stat]: afterValue }

    events.push(createEvent({
      type: 'statBoost',
      turn: state.currentTurn,
      actor: 'hero',
      target: 'hero',
      stat,
      amount: afterValue - beforeValue,
      beforeValue,
      afterValue,
      message: `英雄${statNames[stat]}永久 +${afterValue - beforeValue}`,
    }))

    nextState = {
      ...state,
      hero: { ...state.hero, stats: newStats },
    }

    return { state: consumeStunIfNeeded(nextState, events) }
  }

  return { state }
}

function consumeStunIfNeeded(state: BattleState, events: BattleEvent[]): BattleState {
  if (!state.hero.isStunned) return appendEvents(state, events)

  const hero = { ...state.hero, isStunned: false }
  events.push(createEvent({
    type: 'status',
    turn: state.currentTurn,
    actor: 'hero',
    target: 'hero',
    status: 'stun',
    action: 'consumed',
    message: '英雄眩晕已解除',
  }))

  return appendEvents({
    ...state,
    hero,
    statusEffects: activeStatusEffects(hero),
  }, events)
}

function resolveMonsterAction(state: BattleState): { state: BattleState; damageResult?: DamageResult } {
  const events: BattleEvent[] = []
  const intent = state.monsterIntent
  const intentId = intent.id

  // Execute intent consumed event
  events.push(createIntentConsumedEvent(state.currentTurn, intentId))

  // Read skills from intent (no re-rolling)
  const critBoost = intent.skills.find(s => s.type === 'critBoost' && s.willTrigger)
  const lifesteal = intent.skills.find(s => s.type === 'lifesteal' && s.willTrigger)
  const stun = intent.skills.find(s => s.type === 'stun' && s.willTrigger)

  if (critBoost) events.push(createSkillEvent(state.currentTurn, { type: 'critBoost', triggerChance: 100 }, intentId))
  if (lifesteal) events.push(createSkillEvent(state.currentTurn, { type: 'lifesteal', triggerChance: 100 }, intentId))
  if (stun) events.push(createSkillEvent(state.currentTurn, { type: 'stun', triggerChance: 100 }, intentId))

  const attackType = intent.attackType
  const attack = intent.baseAttack
  const typeLabel = attackType === 'physical' ? '物理' : '魔法'
  const enrageMultiplier = intent.enrageMultiplier

  const damageResult = calculateDamage({
    attack,
    coefficient: 1.0,
    defense: state.hero.stats.defense,
    cardElement: intent.element,
    monsterElement: state.monster.element,
    critRate: state.monster.stats.critRate,
    isShield: false,
    isCritBoost: Boolean(critBoost),
    isImmuneToElement: null,
    enrageMultiplier,
    isMonsterAttacking: true,
  })

  const heroHp = Math.max(state.hero.currentHp - damageResult.finalDamage, 0)
  const critText = damageResult.isCrit ? ' 暴击！' : ''
  const enrageText = enrageMultiplier > 1 ? ` (狂暴×${enrageMultiplier.toFixed(1)})` : ''

  events.push(createEvent({
    type: 'damage',
    turn: state.currentTurn,
    actor: 'monster',
    target: 'hero',
    amount: damageResult.finalDamage,
    damageType: attackType,
    element: intent.element,
    elementMultiplier: damageResult.elementMultiplier,
    isCrit: damageResult.isCrit,
    isShield: false,
    isImmune: false,
    enrageMultiplier,
    intentId,
    message: `怪兽${typeLabel}攻击: ${attack} × 1.0 - ${state.hero.stats.defense} = ${damageResult.finalDamage}伤害${critText}${enrageText}`,
  }))

  let nextMonster = state.monster
  if (lifesteal) {
    const healAmount = Math.floor(damageResult.finalDamage * 0.3)
    const healedHp = Math.min(state.monster.currentHp + healAmount, state.monster.stats.maxHp)
    events.push(createEvent({
      type: 'heal',
      turn: state.currentTurn,
      actor: 'monster',
      target: 'monster',
      amount: healedHp - state.monster.currentHp,
      beforeHp: state.monster.currentHp,
      afterHp: healedHp,
      source: 'lifesteal',
      intentId,
      message: `怪兽吸血恢复 ${healedHp - state.monster.currentHp} HP`,
    }))
    nextMonster = { ...state.monster, currentHp: healedHp }
  }

  const newIsStunned = Boolean(stun)
  let nextHero = { ...state.hero, currentHp: heroHp, isStunned: newIsStunned }
  if (newIsStunned) {
    events.push(createEvent({
      type: 'status',
      turn: state.currentTurn,
      actor: 'monster',
      target: 'hero',
      status: 'stun',
      action: 'applied',
      intentId,
      message: '怪兽使英雄陷入眩晕',
    }))
  }

  let nextState = appendEvents({
    ...state,
    hero: nextHero,
    monster: nextMonster,
    statusEffects: activeStatusEffects(nextHero),
  }, events)

  if (heroHp <= 0) {
    nextState = withResult(nextState, { winner: 'monster', reason: 'defeat' }, [])
  }

  return { state: nextState, damageResult }
}

function finishTurn(state: BattleState): BattleState {
  const nextTurn = state.currentTurn + 1

  if (nextTurn > state.maxTurns) {
    return withResult({
      ...state,
      phase: 'resolving',
      isPlayerTurn: false,
    }, { winner: 'monster', reason: 'turnLimit' }, [])
  }

  const isEnraged = state.monster.isBoss && nextTurn > ENRAGE_START_TURN

  // Generate new intent for next turn
  const intent = generateMonsterIntent({
    level: state.level,
    hero: state.hero,
    monster: state.monster,
    currentTurn: nextTurn,
    maxTurns: state.maxTurns,
    isEnraged,
    source: 'generated',
  })

  const turnEvent = createEvent({
    type: 'turnAdvanced',
    turn: state.currentTurn,
    nextTurn,
    message: `进入第 ${nextTurn} 回合`,
  })
  const intentEvent = createIntentCreatedEvent(nextTurn, intent.id)

  const nextState = appendEvents({
    ...state,
    phase: 'playerAction',
    currentTurn: nextTurn,
    cards: generateCards(state.level),
    isPlayerTurn: true,
    isEnraged,
    gameOver: false,
    winner: null,
    result: null,
    monsterIntent: intent,
  }, [turnEvent, intentEvent])

  return nextState
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
    currentHp: hero.currentHp,
    isStunned: false,
  }
}

export function resetToInitialHero(): Hero {
  return createInitialHero()
}
