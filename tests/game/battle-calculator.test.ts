import { describe, it, expect } from 'vitest'
import { calculateDamage, getElementMultiplier, isCrit } from '@/game/battle-calculator'

describe('getElementMultiplier', () => {
  it('returns 1.5 when attacker element has advantage', () => {
    expect(getElementMultiplier('fire', 'thunder')).toBe(1.5)
    expect(getElementMultiplier('thunder', 'water')).toBe(1.5)
    expect(getElementMultiplier('water', 'fire')).toBe(1.5)
  })

  it('returns 0.5 when attacker element is at disadvantage', () => {
    expect(getElementMultiplier('fire', 'water')).toBe(0.5)
    expect(getElementMultiplier('thunder', 'fire')).toBe(0.5)
    expect(getElementMultiplier('water', 'thunder')).toBe(0.5)
  })

  it('returns 1.0 for same elements', () => {
    expect(getElementMultiplier('fire', 'fire')).toBe(1.0)
    expect(getElementMultiplier('thunder', 'thunder')).toBe(1.0)
    expect(getElementMultiplier('water', 'water')).toBe(1.0)
  })
})

describe('calculateDamage', () => {
  it('calculates basic physical damage', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.5,
      defense: 5,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    expect(result.finalDamage).toBe(10)
    expect(result.isCrit).toBe(false)
    expect(result.elementMultiplier).toBe(1.0)
  })

  it('applies element advantage', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'thunder',
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    expect(result.finalDamage).toBe(15)
  })

  it('applies element disadvantage', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'water',
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    expect(result.finalDamage).toBe(5)
  })

  it('minimum damage is 1', () => {
    const result = calculateDamage({
      attack: 1,
      coefficient: 1.0,
      defense: 100,
      cardElement: 'water',
      monsterElement: 'fire',
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    expect(result.finalDamage).toBe(1)
  })

  it('applies crit when rolled', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 100,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    expect(result.finalDamage).toBe(15)
    expect(result.isCrit).toBe(true)
  })

  it('applies shield reduction', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 0,
      isShield: true,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    expect(result.finalDamage).toBe(5)
  })

  it('applies element immunity', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: 'fire',
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    expect(result.finalDamage).toBe(1)
  })

  it('applies enrage multiplier for monster attacks', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 0,
      isShield: false,
      isCritBoost: false,
      isImmuneToElement: null,
      enrageMultiplier: 1.4,
      isMonsterAttacking: true,
    })
    expect(result.finalDamage).toBe(14)
  })

  it('applies crit boost skill', () => {
    const result = calculateDamage({
      attack: 10,
      coefficient: 1.0,
      defense: 0,
      cardElement: 'fire',
      monsterElement: 'fire',
      critRate: 100,
      isShield: false,
      isCritBoost: true,
      isImmuneToElement: null,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })
    expect(result.finalDamage).toBe(20)
  })
})

describe('isCrit', () => {
  it('returns true when random value is below crit rate', () => {
    expect(isCrit(100, 42)).toBe(true)
    expect(isCrit(0, 42)).toBe(false)
    expect(isCrit(50, 30)).toBe(true)
    expect(isCrit(50, 80)).toBe(false)
  })
})
