import type { Card, CardType, CardStar, Element, TacticalEffect, CardBiasState } from './types'
import {
  CARD_TYPE_WEIGHTS,
  CARD_STAR_WEIGHTS,
  CARD_COEFFICIENTS,
  STAT_BOOST_VALUES,
  CRIT_BOOST_VALUES,
  CARD_BIAS_CAP,
  CARD_BIAS_WEIGHT_PER_LEVEL,
  TACTICAL_COEFFICIENTS,
  GUARD_SHIELD_COEFFICIENTS,
  ELEMENT_LABELS,
} from './constants'

let cardIdCounter = 0

export function randomCardType(bias?: CardBiasState): CardType {
  const weights = bias ? applyTypeBias(bias) : [...CARD_TYPE_WEIGHTS]
  const idx = Math.floor(Math.random() * weights.length)
  return weights[idx] as CardType
}

function applyTypeBias(bias: CardBiasState): readonly CardType[] {
  const base = [...CARD_TYPE_WEIGHTS] as (CardType)[]
  for (const [type, level] of Object.entries(bias.typeWeights)) {
    if (level > 0) {
      const effectiveLevel = Math.min(level, CARD_BIAS_CAP)
      for (let i = 0; i < effectiveLevel * CARD_BIAS_WEIGHT_PER_LEVEL; i++) {
        base.push(type as CardType)
      }
    }
  }
  return base
}

export function randomStar(bias?: CardBiasState): CardStar {
  if (!bias || !bias.starWeights || Object.keys(bias.starWeights).length === 0) {
    const idx = Math.floor(Math.random() * CARD_STAR_WEIGHTS.length)
    return CARD_STAR_WEIGHTS[idx] as CardStar
  }
  // Apply star bias
  const weights = [...CARD_STAR_WEIGHTS]
  for (const [star, level] of Object.entries(bias.starWeights)) {
    if (level > 0) {
      const effectiveLevel = Math.min(level, CARD_BIAS_CAP)
      const starNum = parseInt(star)
      for (let i = 0; i < effectiveLevel * CARD_BIAS_WEIGHT_PER_LEVEL; i++) {
        weights.push(starNum)
      }
    }
  }
  const idx = Math.floor(Math.random() * weights.length)
  return weights[idx] as CardStar
}

export function randomElement(bias?: CardBiasState): Element {
  const elements: Element[] = ['fire', 'thunder', 'water']
  if (!bias || !bias.elementWeights || Object.keys(bias.elementWeights).length === 0) {
    return elements[Math.floor(Math.random() * elements.length)]
  }
  const weighted: Element[] = []
  for (const elem of elements) {
    const level = bias.elementWeights[elem] || 0
    const effectiveLevel = Math.min(level, CARD_BIAS_CAP)
    weighted.push(elem) // base weight
    for (let i = 0; i < effectiveLevel * CARD_BIAS_WEIGHT_PER_LEVEL; i++) {
      weighted.push(elem)
    }
  }
  return weighted[Math.floor(Math.random() * weighted.length)]
}

function randomInRange(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10
}

function generateCardName(type: CardType, star: CardStar, element?: Element): string {
  const elementNames = ELEMENT_LABELS
  const starNames = ['一', '二', '三']
  const typeNames: Record<CardType, string> = {
    physical: '物理攻击',
    magic: '魔法攻击',
    heal: '生命恢复',
    statBoost: '属性提升',
    guard: '防御',
    tactical: '战术',
  }

  if (type === 'statBoost') return `${starNames[star - 1]}星强化`
  if (type === 'heal') return `${starNames[star - 1]}星治愈`
  if (type === 'guard') return `${starNames[star - 1]}星护盾`
  if (type === 'tactical') return `${starNames[star - 1]}星战术`
  return `${starNames[star - 1]}星${typeNames[type]}·${elementNames[element!]}`
}

export function generateCards(_level: number, bias?: CardBiasState): Card[] {
  return Array.from({ length: 3 }, () => {
    cardIdCounter++
    const type = randomCardType(bias)
    const star = randomStar(bias)
    const id = `card-${cardIdCounter}`

    if (type === 'physical' || type === 'magic') {
      const element = randomElement(bias)
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
        element: undefined,
        name: generateCardName(type, star),
      }
    }

    if (type === 'guard') {
      // Guard cards: coefficient based on star for shield calculation
      return {
        id, type, star,
        coefficient: GUARD_SHIELD_COEFFICIENTS[star],
        element: undefined,
        effect: undefined,
        name: generateCardName(type, star),
      }
    }

    if (type === 'tactical') {
      const effect: TacticalEffect = Math.random() < 0.5 ? 'armorBreak' : 'suppress'
      const [min, max] = TACTICAL_COEFFICIENTS[effect][star]
      const coefficient = randomInRange(min, max)
      return {
        id, type, star, coefficient,
        element: effect === 'armorBreak' ? 'fire' : 'water',
        effect,
        name: generateCardName(type, star),
      }
    }

    // statBoost
    const statKeys: Array<keyof typeof STAT_BOOST_VALUES> = ['physicalAttack', 'magicAttack', 'defense', 'maxHp']
    const statIndex = Math.floor(Math.random() * statKeys.length)
    const stat = statKeys[statIndex]
    const value = STAT_BOOST_VALUES[stat][star - 1]
    if (Math.random() < 0.2) {
      return {
        id, type: 'statBoost' as CardType, star,
        coefficient: 0,
        element: undefined,
        statBoost: { stat: 'critRate' as keyof import('./types').Stats, value: CRIT_BOOST_VALUES[star - 1] },
        name: `${['一', '二', '三'][star - 1]}星暴击提升`,
      }
    }
    return {
      id, type: 'statBoost' as CardType, star,
      coefficient: 0,
      element: undefined,
      statBoost: { stat, value },
      name: generateCardName(type, star),
    }
  })
}
