import type {
  BattleEvent,
  BattleLogEntry,
  BattleResult,
  BattleState,
  Card,
  Element,
  Hero,
  MonsterSkill,
  Stats,
  ExpandedStatus,
  ShieldStatus,
  BreakDefenseStatus,
  WeakStatus,
  BattleActor,
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
  BREAK_DEFENSE_REDUCTION_PERCENT,
  BREAK_DEFENSE_REDUCTION_DIVISOR,
  BREAK_DEFENSE_USES,
  WEAK_MULTIPLIER,
  WEAK_USES,
  ELEMENT_ADVANTAGE,
  ELEMENT_LABELS,
  STAT_LABELS,
  SKILL_LABELS,
} from './constants'
import {
  resolveAdvantageBreakDefenseEffect,
  resolveShieldGainBonus,
  resolveHealOverflowShieldPercent,
  resolveNextTurnAttackBonus,
} from './relic-effects'

const elementNames = ELEMENT_LABELS
const statNames = STAT_LABELS
const skillNames = SKILL_LABELS

// 会话级种子：事件 id 会随 battle.events 持久化并在读档后继续追加。计数器在新会话归零，
// 若不加种子，新事件 id 会与读档恢复的旧事件 id 冲突（Vue :key 重复）。种子每次模块加载唯一。
const EVENT_SESSION_SEED = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
let eventIdCounter = 0

type BattleEventInput = BattleEvent extends infer T
  ? T extends { id: string }
    ? Omit<T, 'id'>
    : never
  : never

function createEvent(event: BattleEventInput): BattleEvent {
  eventIdCounter += 1
  return { ...event, id: `event-${EVENT_SESSION_SEED}-${eventIdCounter}` }
}

function eventToLogKind(event: BattleEvent): BattleLogEntry['kind'] {
  switch (event.type) {
    case 'relicTriggered': return 'relic'
    case 'rewardSelected': return 'reward'
    case 'heal': return 'heal'
    case 'skillTriggered': return 'skill'
    case 'status': return event.status === 'shield' ? 'shield' : 'status'
    default: return undefined
  }
}

function eventToLog(event: BattleEvent): BattleLogEntry {
  return {
    turn: event.turn,
    message: event.message,
    isHeroAction: event.actor === 'hero' || (event.type === 'battleEnded' && event.winner === 'hero'),
    eventId: event.id,
    kind: eventToLogKind(event),
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

function isDamageCard(card: Card): boolean {
  return card.type === 'physical' || card.type === 'magic' || (card.type === 'tactical' && (card.effect === 'armorBreak' || card.effect === 'suppress'))
}

function activeStatusEffects(hero: Hero, battleStatuses?: ExpandedStatus[]): ExpandedStatus[] {
  const statuses: ExpandedStatus[] = battleStatuses?.filter(s => s.target === 'hero') || []
  if (hero.isStunned && !statuses.some(s => s.type === 'stun')) {
    statuses.push({ target: 'hero' as const, type: 'stun' as const })
  }
  return statuses
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
    relics: [],
  }
}

export function createBattle(level: number, hero: Hero): BattleState {
  const monster = generateMonster(level)
  const battleHero = { ...hero, stats: { ...hero.stats }, isStunned: false }

  const intent = generateMonsterIntent({
    level,
    hero: battleHero,
    monster,
    currentTurn: 1,
    maxTurns: MAX_TURNS,
    isEnraged: false,
    source: 'generated',
  })

  const events: BattleEvent[] = [createIntentCreatedEvent(1, intent.id)]
  const logs = events
    .filter(e => e.type !== 'intentCreated' && e.type !== 'intentConsumed')
    .map(eventToLog)

  return {
    level,
    hero: battleHero,
    monster,
    currentTurn: 1,
    maxTurns: MAX_TURNS,
    cards: generateCards(level),
    phase: 'playerAction',
    result: null,
    statusEffects: activeStatusEffects(battleHero),
    events,
    logs,
    isPlayerTurn: true,
    isEnraged: false,
    gameOver: false,
    winner: null,
    monsterIntent: intent,
  }
}

export function playCard(state: BattleState, card: Card): { newState: BattleState; damageResult?: DamageResult } {
  if (state.phase !== 'playerAction' || state.gameOver) return { newState: state }

  if (isDamageCard(card) && state.hero.isStunned) {
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

  // Consume break-defense/weak uses after hero damage action
  if (card && isDamageCard(card) && !nextState.gameOver) {
    const events: BattleEvent[] = []
    nextState = consumeDamageStatusesAfterHeroAction(nextState, events)
    if (events.length > 0) {
      nextState = appendEvents(nextState, events)
    }
  }

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

  // Expire shield and advance statuses after monster action
  const statusEvents: BattleEvent[] = []
  nextState = advanceStatusesAfterMonsterAction(nextState, statusEvents)
  if (statusEvents.length > 0) {
    nextState = appendEvents(nextState, statusEvents)
  }

  nextState = finishTurn(nextState)
  return { newState: nextState, damageResult }
}


function getEffectiveMonsterDefense(baseDefense: number, statuses: ExpandedStatus[]): number {
  const breakStatus = statuses.find((s): s is BreakDefenseStatus => s.type === 'breakDefense' && s.target === 'monster')
  if (breakStatus) {
    const reduced = Math.floor(baseDefense * (1 - breakStatus.reductionPercent / BREAK_DEFENSE_REDUCTION_DIVISOR))
    return Math.max(reduced, 0)
  }
  return baseDefense
}

function createStatusAppliedEvent(turn: number, target: BattleActor, statusType: string, message: string): BattleEvent {
  return createEvent({
    type: 'status',
    turn,
    actor: 'hero',
    target,
    status: statusType as 'breakDefense' | 'weak',
    action: 'applied',
    message,
  })
}

function resolveAdvantageBreakDefense(
  relicIds: string[],
  cardElement: Element | undefined,
  monsterElement: Element,
  currentStatuses: ExpandedStatus[],
  turn: number,
  events: BattleEvent[],
): ExpandedStatus[] | null {
  if (!cardElement) return null
  const bladeEffect = resolveAdvantageBreakDefenseEffect(relicIds)
  if (!bladeEffect) return null

  if (ELEMENT_ADVANTAGE[cardElement] !== monsterElement) return null

  const breakStatus: BreakDefenseStatus = {
    target: 'monster',
    type: 'breakDefense',
    reductionPercent: bladeEffect.reductionPercent,
    remainingUses: bladeEffect.uses,
  }
  const newStatuses = [...currentStatuses.filter(s => !(s.type === 'breakDefense' && s.target === 'monster')), breakStatus]
  events.push(createEvent({
    type: 'status',
    turn,
    actor: 'hero',
    target: 'monster',
    status: 'breakDefense',
    action: 'applied',
    message: '破甲之刃触发：怪兽破防',
  }))
  events.push(createEvent({
    type: 'relicTriggered',
    turn,
    actor: 'hero',
    target: 'monster',
    relicId: 'armor-breaker-blade',
    triggerTiming: 'outgoingDamage',
    message: '破甲之刃触发',
  }))
  return newStatuses
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
    let attack = card.type === 'physical' ? state.hero.stats.physicalAttack : state.hero.stats.magicAttack

    // Apply next-turn relic modifiers (thunder-core)
    const activeModifiers = (state.nextTurnRelicModifiers ?? []).filter(m => m.expiresAfterTurn >= state.currentTurn)
    for (const mod of activeModifiers) {
      if (mod.relicId === 'thunder-core') {
        attack = Math.floor(attack * (1 + mod.bonusPercent))
      }
    }
    const intent = state.monsterIntent
    const shield = intent?.skills.find(s => s.type === 'shield' && s.willTrigger)
    const immune = intent?.skills.find(s => s.type === 'elementImmune' && s.willTrigger)
    const intentId = intent?.id

    if (shield) events.push(createSkillEvent(state.currentTurn, { type: 'shield', triggerChance: 100 }, intentId))
    if (immune) events.push(createSkillEvent(state.currentTurn, { type: 'elementImmune', immuneElement: immune.immuneElement, triggerChance: 100 }, intentId))

    // Resolve effective defense with break-defense status
    const effectiveMonsterDefense = getEffectiveMonsterDefense(state.monster.stats.defense, state.statusEffects)

    damageResult = calculateDamage({
      attack,
      coefficient: card.coefficient,
      defense: effectiveMonsterDefense,
      cardElement: card.element!,
      monsterElement: state.monster.element,
      critRate: state.hero.stats.critRate,
      isShield: Boolean(shield),
      isCritBoost: false,
      isImmuneToElement: immune?.immuneElement ?? null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
      attackerRelics: state.hero.relics,
      attackerCurrentHp: state.hero.currentHp,
      attackerMaxHp: state.hero.stats.maxHp,
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
      message: `英雄使用${typeLabel}攻击: ${attack} × ${card.coefficient} = ${Math.round(damageResult.baseDamage * 10) / 10}${elementText}, 防御-${effectiveMonsterDefense} = ${damageResult.finalDamage}伤害${critText}`,
    }))

    // Next-turn attack relic (e.g. thunder-core: thunder attack → next turn attack bonus)
    let nextTurnModifiers = [...(state.nextTurnRelicModifiers ?? [])]
    const nextTurnBonus = card.element ? resolveNextTurnAttackBonus(state.hero.relics, card.element) : undefined
    if (nextTurnBonus !== undefined) {
      nextTurnModifiers.push({
        relicId: 'thunder-core',
        bonusPercent: nextTurnBonus,
        expiresAfterTurn: state.currentTurn + 1,
      })
      events.push(createEvent({
        type: 'relicTriggered',
        turn: state.currentTurn,
        actor: 'hero',
        target: 'hero',
        relicId: 'thunder-core',
        triggerTiming: 'nextTurn',
        message: `雷霆核心触发：下回合攻击+${Math.round(nextTurnBonus * 100)}%`,
      }))
    }

    // Consume expired next-turn relic modifiers
    nextTurnModifiers = nextTurnModifiers.filter(m => m.expiresAfterTurn > state.currentTurn)

    nextState = {
      ...state,
      monster: { ...state.monster, currentHp: monsterHp },
      nextTurnRelicModifiers: nextTurnModifiers,
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
    const maxHp = state.hero.stats.maxHp
    const healAmount = Math.floor(maxHp * card.coefficient)
    const rawHeal = Math.min(healAmount, maxHp - state.hero.currentHp)
    const overflow = healAmount - rawHeal
    let newHp = state.hero.currentHp + rawHeal

    // Heal-overflow-to-shield relic (e.g. water-spirit-bottle): convert overflow at relic's rate
    const overflowShieldPercent = resolveHealOverflowShieldPercent(state.hero.relics)
    let shieldEvent: BattleEvent | null = null
    if (overflowShieldPercent !== undefined && overflow > 0) {
      const shieldAmount = Math.floor(overflow * overflowShieldPercent)
      const shieldStatus: ShieldStatus = { target: 'hero', type: 'shield', amount: shieldAmount }
      const newStatuses = [...state.statusEffects.filter(s => s.type !== 'shield'), shieldStatus]
      shieldEvent = createEvent({
        type: 'status',
        turn: state.currentTurn,
        actor: 'hero',
        target: 'hero',
        status: 'shield',
        action: 'applied',
        amount: shieldAmount,
        message: `水瓶溢出 ${shieldAmount} 转为护盾`,
      })
      nextState = {
        ...state,
        hero: { ...state.hero, currentHp: newHp },
        statusEffects: newStatuses,
      }
    } else {
      nextState = {
        ...state,
        hero: { ...state.hero, currentHp: newHp },
      }
    }

    events.push(createEvent({
      type: 'heal',
      turn: state.currentTurn,
      actor: 'hero',
      target: 'hero',
      amount: newHp - state.hero.currentHp,
      beforeHp: state.hero.currentHp,
      afterHp: newHp,
      overflow: overflow > 0 ? overflow : undefined,
      source: 'card',
      message: `英雄恢复 ${newHp - state.hero.currentHp} HP (${state.hero.currentHp} → ${newHp})`,
    }))

    if (shieldEvent) events.push(shieldEvent)

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

  // Guard card: grants shield based on hero defense
  if (card.type === 'guard') {
    const baseShield = Math.max(Math.floor(state.hero.stats.defense * card.coefficient), 1)
    const shieldBonus = resolveShieldGainBonus(state.hero.relics)
    const shieldAmount = Math.floor(baseShield * (1 + shieldBonus))

    const shieldStatus: ShieldStatus = { target: 'hero', type: 'shield', amount: shieldAmount }
    const newStatuses = [...state.statusEffects.filter(s => s.type !== 'shield'), shieldStatus]

    events.push(createEvent({
      type: 'status',
      turn: state.currentTurn,
      actor: 'hero',
      target: 'hero',
      status: 'shield',
      action: 'applied',
      message: `英雄获得 ${shieldAmount} 点护盾`,
    }))

    nextState = {
      ...state,
      hero: { ...state.hero },
      statusEffects: newStatuses,
    }

    return { state: consumeStunIfNeeded(nextState, events) }
  }

  // Tactical cards: armor-break and suppress
  if (card.type === 'tactical' && card.effect) {
    const attack = state.hero.stats.physicalAttack
    const intent = state.monsterIntent
    const shield = intent?.skills.find(s => s.type === 'shield' && s.willTrigger)
    const immune = intent?.skills.find(s => s.type === 'elementImmune' && s.willTrigger)
    const intentId = intent?.id

    if (shield) events.push(createSkillEvent(state.currentTurn, { type: 'shield', triggerChance: 100 }, intentId))
    if (immune && card.element) events.push(createSkillEvent(state.currentTurn, { type: 'elementImmune', immuneElement: immune.immuneElement, triggerChance: 100 }, intentId))

    const effectiveMonsterDefense = getEffectiveMonsterDefense(state.monster.stats.defense, state.statusEffects)

    damageResult = calculateDamage({
      attack,
      coefficient: card.coefficient,
      defense: effectiveMonsterDefense,
      cardElement: card.element || 'fire',
      monsterElement: state.monster.element,
      critRate: state.hero.stats.critRate,
      isShield: Boolean(shield),
      isCritBoost: false,
      isImmuneToElement: immune?.immuneElement ?? null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
      attackerRelics: state.hero.relics,
      attackerCurrentHp: state.hero.currentHp,
      attackerMaxHp: state.hero.stats.maxHp,
    })

    const monsterHp = Math.max(state.monster.currentHp - damageResult.finalDamage, 0)
    const typeLabel = card.effect === 'armorBreak' ? '破甲' : '压制'

    events.push(createEvent({
      type: 'damage',
      turn: state.currentTurn,
      actor: 'hero',
      target: 'monster',
      amount: damageResult.finalDamage,
      damageType: 'physical',
      element: card.element,
      elementMultiplier: damageResult.elementMultiplier,
      isCrit: damageResult.isCrit,
      isShield: Boolean(shield),
      isImmune: immune?.immuneElement === card.element,
      enrageMultiplier: 1.0,
      intentId,
      message: `英雄使用${typeLabel}: ${Math.round(damageResult.finalDamage)}伤害`,
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

    // Apply status if monster survives
    if (card.effect === 'armorBreak') {
      const breakStatus: BreakDefenseStatus = {
        target: 'monster',
        type: 'breakDefense',
        reductionPercent: BREAK_DEFENSE_REDUCTION_PERCENT,
        remainingUses: BREAK_DEFENSE_USES,
      }
      const newStatuses = [...state.statusEffects.filter(s => !(s.type === 'breakDefense' && s.target === 'monster')), breakStatus]
      events.push(createStatusAppliedEvent(state.currentTurn, 'monster', 'breakDefense', `怪兽破防(40%/3次)`))
      nextState = { ...nextState, statusEffects: newStatuses }
    } else if (card.effect === 'suppress') {
      const weakStatus: WeakStatus = {
        target: 'monster',
        type: 'weak',
        multiplier: WEAK_MULTIPLIER,
        remainingUses: WEAK_USES,
      }
      const newStatuses = [...state.statusEffects.filter(s => !(s.type === 'weak' && s.target === 'monster')), weakStatus]
      events.push(createStatusAppliedEvent(state.currentTurn, 'monster', 'weak', `怪兽虚弱(×0.8)`))
      nextState = { ...nextState, statusEffects: newStatuses }
    }

    // Check armor-breaker-blade relic: advantage element → break defense
    const relicStatuses = resolveAdvantageBreakDefense(state.hero.relics, card.element, state.monster.element, nextState.statusEffects, state.currentTurn, events)
    if (relicStatuses) {
      nextState = { ...nextState, statusEffects: relicStatuses }
    }

    return { state: consumeStunIfNeeded(nextState, events), damageResult }
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
  // 防御：活跃战斗进入怪兽行动阶段时 intent 必然存在；缺失则跳过反击（理论不会发生）
  if (!intent) return { state }
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

  // Check for weak status on monster (reduces monster attack damage)
  const weakStatus = state.statusEffects.find(s => s.type === 'weak' && s.target === 'monster' && s.remainingUses > 0)
  const monsterWeakMultiplier = weakStatus ? (weakStatus as WeakStatus).multiplier : undefined

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
    weakMultiplier: monsterWeakMultiplier,
  })

  // Apply shield absorption before reducing hero HP
  let remainingDamage = damageResult.finalDamage
  let shieldAbsorbed = 0
  const shieldEffect = state.statusEffects.find(s => s.type === 'shield' && s.target === 'hero') as ShieldStatus | undefined
  if (shieldEffect) {
    shieldAbsorbed = Math.min(shieldEffect.amount, remainingDamage)
    remainingDamage -= shieldAbsorbed
    if (shieldAbsorbed > 0) {
      events.push(createEvent({
        type: 'status',
        turn: state.currentTurn,
        actor: 'monster',
        target: 'hero',
        status: 'shield',
        action: 'consumed',
        amount: shieldAbsorbed,
        message: `护盾吸收 ${shieldAbsorbed} 伤害`,
      }))
    }
  }

  const heroHp = Math.max(state.hero.currentHp - remainingDamage, 0)
  const critText = damageResult.isCrit ? ' 暴击！' : ''
  const enrageText = enrageMultiplier > 1 ? ` (狂暴×${enrageMultiplier.toFixed(1)})` : ''
  const shieldText = shieldAbsorbed > 0 ? ` (护盾吸收 ${shieldAbsorbed})` : ''

  events.push(createEvent({
    type: 'damage',
    turn: state.currentTurn,
    actor: 'monster',
    target: 'hero',
    amount: remainingDamage,
    shieldAbsorbed,
    damageType: attackType,
    element: intent.element,
    elementMultiplier: damageResult.elementMultiplier,
    isCrit: damageResult.isCrit,
    isShield: false,
    isImmune: false,
    enrageMultiplier,
    intentId,
    message: `怪兽${typeLabel}攻击: ${attack} × 1.0 - ${state.hero.stats.defense} = ${damageResult.finalDamage}伤害${critText}${enrageText}${shieldText}`,
  }))

  let nextMonster = state.monster
  if (lifesteal) {
    const actualDamage = state.hero.currentHp - heroHp // damage actually dealt to HP (after shield)
    const healAmount = Math.floor(actualDamage * 0.3)
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

/**
 * Clean up statuses after monster action: expire shield, consume weak, decrement breakDefense uses.
 */
function advanceStatusesAfterMonsterAction(state: BattleState, events: BattleEvent[]): BattleState {
  const statuses = state.statusEffects.map(s => {
    if (s.type === 'shield') {
      // Shield expires after monster action
      events.push(createEvent({
        type: 'status',
        turn: state.currentTurn,
        actor: 'monster',
        target: 'hero',
        status: 'shield',
        action: 'expired',
        message: '护盾消失',
      }))
      return null // remove shield
    }
    if (s.type === 'weak' && s.target === 'monster') {
      // Weak is consumed after monster attacks
      events.push(createEvent({
        type: 'status',
        turn: state.currentTurn,
        actor: 'monster',
        target: 'monster',
        status: 'weak',
        action: 'consumed',
        message: '怪兽虚弱已解除',
      }))
      return null
    }
    return s
  }).filter(Boolean) as ExpandedStatus[]

  return { ...state, statusEffects: statuses }
}

/**
 * Decrement break-defense remainingUses after a hero attack/tactical damage action.
 * Weak is consumed separately after the monster attacks.
 */
function consumeDamageStatusesAfterHeroAction(state: BattleState, events: BattleEvent[]): BattleState {
  const statuses = state.statusEffects.map(s => {
    if (s.type === 'breakDefense' && s.target === 'monster') {
      const bf = s as BreakDefenseStatus
      if (bf.remainingUses > 1) {
        const updated: BreakDefenseStatus = { ...bf, remainingUses: bf.remainingUses - 1 }
        events.push(createEvent({
          type: 'status',
          turn: state.currentTurn,
          actor: 'hero',
          target: 'monster',
          status: 'breakDefense',
          action: 'consumed',
          message: `怪兽破防剩余 ${updated.remainingUses} 次`,
        }))
        return updated
      }
      // Last use consumed → remove
      events.push(createEvent({
        type: 'status',
        turn: state.currentTurn,
        actor: 'hero',
        target: 'monster',
        status: 'breakDefense',
        action: 'consumed',
        message: '怪兽破防已解除',
      }))
      return null
    }
    return s
  }).filter(Boolean) as ExpandedStatus[]

  return { ...state, statusEffects: statuses }
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
    relics: [...hero.relics],
  }
}

export function resetToInitialHero(): Hero {
  return createInitialHero()
}
