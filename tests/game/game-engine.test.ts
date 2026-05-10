import { describe, it, expect } from 'vitest'
import { createInitialHero, createBattle, playCard, applyVictoryGrowth } from '@/game/game-engine'

describe('createInitialHero', () => {
  it('creates hero with correct initial stats', () => {
    const hero = createInitialHero()
    expect(hero.stats.physicalAttack).toBe(10)
    expect(hero.stats.magicAttack).toBe(10)
    expect(hero.stats.defense).toBe(5)
    expect(hero.stats.maxHp).toBe(100)
    expect(hero.stats.critRate).toBe(0)
    expect(hero.currentHp).toBe(100)
  })
})

describe('createBattle', () => {
  it('creates battle with monster at full HP', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    expect(battle.monster.currentHp).toBe(battle.monster.stats.maxHp)
    expect(battle.currentTurn).toBe(1)
    expect(battle.cards.length).toBe(3)
    expect(battle.gameOver).toBe(false)
  })

  it('level 5 creates a boss', () => {
    const hero = createInitialHero()
    const battle = createBattle(5, hero)
    expect(battle.monster.isBoss).toBe(true)
    expect(battle.monster.skills.length).toBe(2)
  })

  it('level 1 creates a normal monster', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    expect(battle.monster.isBoss).toBe(false)
    expect(battle.monster.skills.length).toBe(1)
  })
})

describe('playCard', () => {
  it('physical attack deals damage to monster', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    const physicalCard = battle.cards.find(c => c.type === 'physical')
    if (!physicalCard) return

    const { newState } = playCard(battle, physicalCard)
    expect(newState.monster.currentHp).toBeLessThan(battle.monster.stats.maxHp)
  })

  it('heal card increases hero HP', () => {
    const hero = { ...createInitialHero(), currentHp: 50 }
    const battle = createBattle(1, hero)
    const healCard = battle.cards.find(c => c.type === 'heal')
    if (!healCard) return

    const { newState } = playCard(battle, healCard)
    expect(newState.hero.currentHp).toBeGreaterThan(50)
  })

  it('stat boost card increases hero stat', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    const boostCard = battle.cards.find(c => c.type === 'statBoost')
    if (!boostCard) return

    const { newState } = playCard(battle, boostCard)
    if (boostCard.statBoost) {
      expect(newState.hero.stats[boostCard.statBoost.stat])
        .toBeGreaterThan(hero.stats[boostCard.statBoost.stat])
    }
  })
})

describe('applyVictoryGrowth', () => {
  it('increases all hero stats', () => {
    const hero = createInitialHero()
    const newHero = applyVictoryGrowth(hero)
    expect(newHero.stats.physicalAttack).toBe(11)
    expect(newHero.stats.magicAttack).toBe(11)
    expect(newHero.stats.defense).toBe(6)
    expect(newHero.stats.maxHp).toBe(103)
    expect(newHero.stats.critRate).toBe(1)
    expect(newHero.currentHp).toBe(100)
  })
})
