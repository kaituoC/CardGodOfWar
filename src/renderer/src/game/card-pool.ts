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
        element: undefined,
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
