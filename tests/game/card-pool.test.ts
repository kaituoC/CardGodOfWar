import { describe, it, expect } from 'vitest'
import { generateCards, randomCardType, randomStar } from '@/game/card-pool'

describe('randomCardType', () => {
  it('returns a valid card type', () => {
    const type = randomCardType()
    expect(['physical', 'magic', 'heal', 'statBoost', 'guard', 'tactical']).toContain(type)
  })

  it('follows approximate distribution over many samples', () => {
    const samples = Array.from({ length: 1000 }, () => randomCardType())
    const physical = samples.filter(t => t === 'physical').length
    const magic = samples.filter(t => t === 'magic').length
    const heal = samples.filter(t => t === 'heal').length
    const statBoost = samples.filter(t => t === 'statBoost').length
    const guard = samples.filter(t => t === 'guard').length
    const tactical = samples.filter(t => t === 'tactical').length
    // physical:magic:heal:statBoost:guard:tactical ≈ 10:10:8:6:4:4
    const total = physical + magic + heal + statBoost + guard + tactical
    expect(physical / total).toBeGreaterThan(0.2)
    expect(magic / total).toBeGreaterThan(0.2)
    expect(heal / total).toBeGreaterThan(0.15)
    expect(statBoost / total).toBeGreaterThan(0.1)
  })
})

describe('randomStar', () => {
  it('returns 1, 2, or 3', () => {
    const star = randomStar()
    expect([1, 2, 3]).toContain(star)
  })

  it('follows 6:3:1 ratio approximately', () => {
    const samples = Array.from({ length: 1000 }, () => randomStar())
    const s1 = samples.filter(s => s === 1).length
    const s2 = samples.filter(s => s === 2).length
    const s3 = samples.filter(s => s === 3).length
    expect(s1 / 1000).toBeGreaterThan(0.5)
    expect(s2 / 1000).toBeGreaterThan(0.2)
    expect(s3 / 1000).toBeLessThan(0.2)
  })
})

describe('generateCards', () => {
  it('generates exactly 3 cards', () => {
    const cards = generateCards(1)
    expect(cards.length).toBe(3)
  })

  it('each card has required fields', () => {
    const cards = generateCards(1)
    for (const card of cards) {
      expect(card.id).toBeDefined()
      expect(card.type).toBeDefined()
      expect(card.star).toBeDefined()
      expect(card.coefficient).toBeDefined()
      expect(card.name).toBeDefined()
    }
  })

  it('physical and magic cards have element', () => {
    const cards = generateCards(1)
    const attackCards = cards.filter(c => c.type === 'physical' || c.type === 'magic')
    for (const card of attackCards) {
      expect(['fire', 'thunder', 'water']).toContain(card.element)
    }
  })

  it('stat boost cards have statBoost property', () => {
    const cards = generateCards(1)
    const boostCards = cards.filter(c => c.type === 'statBoost')
    for (const card of boostCards) {
      expect(card.statBoost).toBeDefined()
      expect(card.statBoost!.value).toBeGreaterThan(0)
    }
  })

  it('card coefficients are within valid ranges', () => {
    const cards = generateCards(1)
    for (const card of cards) {
      if (card.type === 'physical' || card.type === 'magic') {
        const [min, max] = card.star === 1 ? [1.0, 1.5] : card.star === 2 ? [1.5, 2.2] : [2.2, 3.0]
        expect(card.coefficient).toBeGreaterThanOrEqual(min)
        expect(card.coefficient).toBeLessThanOrEqual(max)
      } else if (card.type === 'heal') {
        const [min, max] = card.star === 1 ? [0.4, 0.5] : card.star === 2 ? [0.5, 0.7] : [0.7, 1.0]
        expect(card.coefficient).toBeGreaterThanOrEqual(min)
        expect(card.coefficient).toBeLessThanOrEqual(max)
      }
    }
  })
})
