import type { Element } from './types'
import {
  ELEMENT_ADVANTAGE,
  ELEMENT_ADVANTAGE_MULTIPLIER,
  ELEMENT_DISADVANTAGE_MULTIPLIER,
  CRIT_MULTIPLIER,
  CRIT_BOOST_MULTIPLIER,
  MIN_DAMAGE,
} from './constants'

export interface DamageCalculationParams {
  attack: number
  coefficient: number
  defense: number
  cardElement: Element
  monsterElement: Element
  critRate: number // 0-100
  isShield: boolean
  isCritBoost: boolean
  isImmuneToElement: Element | null
  enrageMultiplier: number
  isMonsterAttacking: boolean
}

export interface DamageResult {
  baseDamage: number
  afterDefense: number
  elementMultiplier: number
  afterElement: number
  isCrit: boolean
  afterCrit: number
  afterShield: number
  finalDamage: number
}

export function getElementMultiplier(cardElement: Element, monsterElement: Element): number {
  if (cardElement === monsterElement) return 1.0
  if (ELEMENT_ADVANTAGE[cardElement] === monsterElement) return ELEMENT_ADVANTAGE_MULTIPLIER
  return ELEMENT_DISADVANTAGE_MULTIPLIER
}

export function isCrit(critRate: number, roll: number): boolean {
  return roll < critRate
}

export function calculateDamage(params: DamageCalculationParams): DamageResult {
  const {
    attack, coefficient, defense, cardElement, monsterElement,
    critRate, isShield, isCritBoost, isImmuneToElement,
    enrageMultiplier, isMonsterAttacking,
  } = params

  // Step 1: Base damage
  const baseDamage = attack * coefficient

  // Step 2: Defense reduction
  const afterDefense = Math.max(baseDamage - defense, MIN_DAMAGE)

  // Step 3: Element multiplier
  let elementMultiplier: number
  if (isImmuneToElement === cardElement) {
    elementMultiplier = 0
  } else {
    elementMultiplier = getElementMultiplier(cardElement, monsterElement)
  }
  const afterElement = afterDefense * elementMultiplier

  // Step 4: Crit check
  const roll = Math.random() * 100
  const crit = isCrit(critRate, roll)
  const critMultiplier = isCritBoost ? CRIT_BOOST_MULTIPLIER : CRIT_MULTIPLIER
  const afterCrit = crit ? afterElement * critMultiplier : afterElement

  // Step 5: Shield
  const afterShield = isShield ? afterCrit * 0.5 : afterCrit

  // Step 6: Enrage (only for monster attacks)
  const finalBase = isMonsterAttacking
    ? afterShield * enrageMultiplier
    : afterShield

  // Step 7: Clamp to minimum
  const finalDamage = Math.max(Math.floor(finalBase), MIN_DAMAGE)

  return {
    baseDamage,
    afterDefense,
    elementMultiplier,
    afterElement,
    isCrit: crit,
    afterCrit,
    afterShield,
    finalDamage,
  }
}
