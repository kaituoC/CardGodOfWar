import type {
  BattleState,
  Card,
  CardOutcomeEstimate,
  DamagePreview,
  Element,
  GenerateMonsterIntentInput,
  MonsterIntent,
  MonsterIntentSkill,
} from './types'
import {
  ELEMENT_ADVANTAGE,
  ELEMENT_ADVANTAGE_MULTIPLIER,
  ELEMENT_DISADVANTAGE_MULTIPLIER,
  CRIT_MULTIPLIER,
  CRIT_BOOST_MULTIPLIER,
  MIN_DAMAGE,
  ENRAGE_START_TURN,
  ENRAGE_DAMAGE_PER_TURN,
} from './constants'

let intentSequenceCounter = 0

function nextSequence(): number {
  return ++intentSequenceCounter
}

function getElementMultiplier(cardElement: Element, monsterElement: Element): number {
  if (cardElement === monsterElement) return 1.0
  if (ELEMENT_ADVANTAGE[cardElement] === monsterElement) return ELEMENT_ADVANTAGE_MULTIPLIER
  return ELEMENT_DISADVANTAGE_MULTIPLIER
}

export function previewDamage(
  attack: number,
  coefficient: number,
  defense: number,
  cardElement: Element,
  monsterElement: Element,
  critRate: number,
  isCritBoost: boolean,
  isImmuneToElement: Element | null,
): DamagePreview {
  const baseDamage = attack * coefficient
  const afterDefense = Math.max(baseDamage - defense, MIN_DAMAGE)

  let elementMultiplier: number
  if (isImmuneToElement === cardElement) {
    elementMultiplier = 1.0
  } else {
    elementMultiplier = getElementMultiplier(cardElement, monsterElement)
  }
  const estimatedDamage = Math.max(Math.floor(afterDefense * elementMultiplier), MIN_DAMAGE)

  const critMultiplier = isCritBoost ? CRIT_BOOST_MULTIPLIER : CRIT_MULTIPLIER
  const critDamage = Math.max(Math.floor(estimatedDamage * critMultiplier), MIN_DAMAGE)

  return {
    baseDamage,
    afterDefense,
    elementMultiplier,
    estimatedDamage,
    critDamage,
    critRate,
    critMultiplier,
  }
}

function getTiming(type: MonsterIntentSkill['type']): 'monsterAction' | 'heroActionDefense' {
  if (type === 'shield' || type === 'elementImmune') return 'heroActionDefense'
  return 'monsterAction'
}

function getSkillLabel(type: MonsterIntentSkill['type'], immuneElement?: Element): string {
  const base: Record<string, string> = {
    shield: '护盾',
    lifesteal: '吸血',
    critBoost: '暴击强化',
    elementImmune: '元素免疫',
    stun: '眩晕',
  }
  if (type === 'elementImmune' && immuneElement) {
    const elemLabels: Record<string, string> = { fire: '火', thunder: '雷', water: '水' }
    return `${base[type]}(${elemLabels[immuneElement]})`
  }
  return base[type]
}

export function generateMonsterIntent(input: GenerateMonsterIntentInput): MonsterIntent {
  const { hero, monster, currentTurn, isEnraged, source = 'generated' } = input

  const attackType: 'physical' | 'magic' = Math.random() > 0.5 ? 'physical' : 'magic'
  const baseAttack = attackType === 'physical' ? monster.stats.physicalAttack : monster.stats.magicAttack

  const enrageMultiplier = isEnraged
    ? 1 + (currentTurn - ENRAGE_START_TURN) * ENRAGE_DAMAGE_PER_TURN
    : 1.0

  const skills: MonsterIntentSkill[] = monster.skills.map(skill => ({
    type: skill.type,
    timing: getTiming(skill.type),
    immuneElement: skill.immuneElement,
    willTrigger: Math.random() * 100 < skill.triggerChance,
    label: getSkillLabel(skill.type, skill.immuneElement),
  }))

  const isCritBoost = skills.some(s => s.type === 'critBoost' && s.willTrigger)
  const elementImmune = skills.find(s => s.type === 'elementImmune' && s.willTrigger)

  // Preview base damage (without enrage for the previewDamage helper)
  const preview = previewDamage(
    baseAttack,
    1.0,
    hero.stats.defense,
    monster.element,
    monster.element,
    monster.stats.critRate,
    isCritBoost,
    elementImmune?.immuneElement ?? null,
  )

  // Apply enrage multiplier to the final estimated damage
  const enragedEstimated = Math.max(Math.floor(preview.estimatedDamage * enrageMultiplier), 1)
  const enragedCrit = Math.max(Math.floor(preview.critDamage * enrageMultiplier), 1)

  const attackTypeLabel = attackType === 'physical' ? '物理' : '魔法'
  const skillParts = skills.filter(s => s.willTrigger).map(s => s.label)
  const skillText = skillParts.length > 0 ? ` [${skillParts.join(', ')}]` : ''
  const enrageText = enrageMultiplier > 1 ? ` (狂暴×${enrageMultiplier.toFixed(1)})` : ''

  const message = `怪兽将使用${attackTypeLabel}攻击，预计伤害 ${enragedEstimated}${enrageText}${skillText}`

  const id = `intent-turn-${currentTurn}-${nextSequence()}`

  return {
    id,
    turn: currentTurn,
    source,
    action: 'attack',
    attackType,
    baseAttack,
    estimatedDamage: enragedEstimated,
    critDamage: enragedCrit,
    critRate: monster.stats.critRate,
    element: monster.element,
    enrageMultiplier,
    skills,
    message,
  }
}

function findTriggeredSkill(intent: MonsterIntent, type: MonsterIntentSkill['type']): MonsterIntentSkill | undefined {
  return intent.skills.find(s => s.type === type && s.willTrigger)
}

export function estimateCardOutcome(battle: BattleState, card: Card): CardOutcomeEstimate {
  const { hero, monster, monsterIntent } = battle

  // Game-over state: no actionable estimates
  if (battle.gameOver) {
    if (card.type === 'physical' || card.type === 'magic') {
      return {
        type: 'unavailable',
        reason: 'gameOver',
        text: '',
      }
    }
    // Non-attack cards still show their base info even in game-over
  }

  // Safe fallback for missing intent (attack cards only)
  if (!monsterIntent && (card.type === 'physical' || card.type === 'magic')) {
    return {
      type: 'unavailable',
      reason: 'missingIntent',
      text: '',
    }
  }

  if ((card.type === 'physical' || card.type === 'magic') && hero.isStunned) {
    return {
      type: 'blocked',
      reason: 'stun',
      isBlockedByStun: true,
      text: '眩晕中',
    }
  }

  if (card.type === 'physical' || card.type === 'magic') {
    const attack = card.type === 'physical' ? hero.stats.physicalAttack : hero.stats.magicAttack
    const shield = findTriggeredSkill(monsterIntent, 'shield')
    const elementImmune = findTriggeredSkill(monsterIntent, 'elementImmune')
    // Monster critBoost does NOT affect hero card estimates — hero attacks use their own crit only
    const isCritBoost = false

    const preview = previewDamage(
      attack,
      card.coefficient,
      monster.stats.defense,
      card.element!,
      monster.element,
      hero.stats.critRate,
      isCritBoost,
      elementImmune?.immuneElement ?? null,
    )

    // Apply shield reduction to the estimate
    const hasShield = Boolean(shield)
    const afterShield = hasShield ? Math.max(Math.floor(preview.estimatedDamage * 0.5), 1) : preview.estimatedDamage
    const afterShieldCrit = hasShield ? Math.max(Math.floor(preview.critDamage * 0.5), 1) : preview.critDamage

    const critLabel: '暴击' | '强化暴击' = isCritBoost ? '强化暴击' : '暴击'
    let text = `预计 ${afterShield}`
    if (preview.critRate > 0) {
      text += ` | ${critLabel}${preview.critRate}%→${afterShieldCrit}`
    }

    return {
      type: 'damage',
      amount: afterShield,
      critDamage: afterShieldCrit,
      critRate: preview.critRate,
      critMultiplier: preview.critMultiplier,
      critLabel,
      elementMultiplier: preview.elementMultiplier,
      isBlockedByStun: false,
      isShielded: Boolean(shield),
      isImmune: elementImmune?.immuneElement === card.element,
      text,
    }
  }

  if (card.type === 'heal') {
    const rawHeal = Math.floor(hero.stats.maxHp * card.coefficient)
    const healAmount = Math.min(rawHeal, hero.stats.maxHp - hero.currentHp)
    return {
      type: 'heal',
      amount: healAmount,
      text: `恢复 ${healAmount}`,
    }
  }

  if (card.type === 'statBoost' && card.statBoost) {
    const { stat, value } = card.statBoost
    const statLabels: Record<string, string> = {
      physicalAttack: '物攻',
      magicAttack: '魔攻',
      defense: '防御',
      maxHp: '最大HP',
      critRate: '暴击率',
    }
    const label = statLabels[stat] || stat
    return {
      type: 'statBoost',
      stat,
      amount: value,
      text: `${label} +${value}`,
    }
  }

  // Generic fallback for unknown card types
  return {
    type: 'unavailable',
    reason: 'missingIntent',
    text: '',
  }
}
