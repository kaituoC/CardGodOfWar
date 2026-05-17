import { describe, it, expect } from 'vitest'
import { createInitialHero, createBattle, playCard, applyVictoryGrowth, skipTurn } from '@/game/game-engine'
import type { BattleState, Card } from '@/game/types'

function noSkillBattle(level = 1): BattleState {
  const battle = createBattle(level, createInitialHero())
  return {
    ...battle,
    hero: {
      ...battle.hero,
      stats: { ...battle.hero.stats, critRate: 0 },
    },
    monster: {
      ...battle.monster,
      stats: {
        ...battle.monster.stats,
        physicalAttack: 10,
        magicAttack: 10,
        critRate: 0,
      },
      skills: [],
    },
  }
}

function card(overrides: Partial<Card>): Card {
  return {
    id: 'test-card',
    type: 'physical',
    star: 1,
    coefficient: 1,
    element: 'fire',
    name: '测试卡',
    ...overrides,
  }
}

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
    expect(battle.phase).toBe('playerAction')
    expect(battle.result).toBeNull()
    expect(battle.level).toBe(1)
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
    const battle = noSkillBattle()
    const physicalCard = card({ type: 'physical', coefficient: 1.5, element: battle.monster.element })

    const { newState } = playCard(battle, physicalCard)
    expect(newState.monster.currentHp).toBeLessThan(battle.monster.stats.maxHp)
    expect(newState.currentTurn).toBe(2)
    expect(newState.phase).toBe('playerAction')
  })

  it('heal card increases hero HP', () => {
    const hero = { ...createInitialHero(), currentHp: 50 }
    const battle = {
      ...noSkillBattle(),
      hero: { ...hero, stats: { ...hero.stats, defense: 100 } },
    }
    const healCard = card({ type: 'heal', coefficient: 0.4, element: undefined })

    const { newState } = playCard(battle, healCard)
    expect(newState.hero.currentHp).toBeGreaterThan(50)
  })

  it('stat boost card increases hero stat', () => {
    const hero = createInitialHero()
    const battle = noSkillBattle()
    const boostCard = card({
      type: 'statBoost',
      coefficient: 0,
      element: undefined,
      statBoost: { stat: 'physicalAttack', value: 2 },
    })

    const { newState } = playCard(battle, boostCard)
    if (boostCard.statBoost) {
      expect(newState.hero.stats[boostCard.statBoost.stat])
        .toBeGreaterThan(hero.stats[boostCard.statBoost.stat])
    }
  })

  it('rejects attack cards while stunned without advancing the turn', () => {
    const battle = {
      ...noSkillBattle(),
      hero: { ...createInitialHero(), isStunned: true },
    }
    const attackCard = card({ type: 'physical', element: battle.monster.element })

    const { newState } = playCard(battle, attackCard)

    expect(newState.currentTurn).toBe(1)
    expect(newState.monster.currentHp).toBe(battle.monster.currentHp)
    expect(newState.hero.isStunned).toBe(true)
    expect(newState.events.at(-1)?.type).toBe('status')
  })

  it('allows non-attack cards while stunned and consumes stun', () => {
    const hero = { ...createInitialHero(), currentHp: 50, isStunned: true }
    const battle = {
      ...noSkillBattle(),
      hero: { ...hero, stats: { ...hero.stats, defense: 100 } },
    }
    const healCard = card({ type: 'heal', coefficient: 0.4, element: undefined })

    const { newState } = playCard(battle, healCard)

    expect(newState.currentTurn).toBe(2)
    expect(newState.hero.isStunned).toBe(false)
    expect(newState.events.some(event => event.type === 'status' && event.action === 'consumed')).toBe(true)
  })

  it('skip triggers monster action and consumes stun', () => {
    const battle = {
      ...noSkillBattle(),
      hero: { ...createInitialHero(), isStunned: true },
      cards: [
        card({ id: 'a', type: 'physical' }),
        card({ id: 'b', type: 'magic' }),
        card({ id: 'c', type: 'physical' }),
      ],
    }

    const newState = skipTurn(battle)

    expect(newState.currentTurn).toBe(2)
    expect(newState.hero.currentHp).toBeLessThan(battle.hero.currentHp)
    expect(newState.hero.isStunned).toBe(false)
    expect(newState.events.some(event => event.type === 'turnSkipped')).toBe(true)
    expect(newState.events.some(event => event.type === 'damage' && event.actor === 'monster')).toBe(true)
  })

  it('monster lifesteal heals from monster-dealt damage', () => {
    const battle = {
      ...noSkillBattle(),
      hero: {
        ...noSkillBattle().hero,
        stats: { ...noSkillBattle().hero.stats, defense: 0 },
      },
      monster: {
        ...noSkillBattle().monster,
        currentHp: 20,
        skills: [{ type: 'lifesteal' as const, triggerChance: 100 }],
      },
    }

    const newState = skipTurn(battle)

    expect(newState.monster.currentHp).toBe(23)
    expect(newState.events.some(event => event.type === 'heal' && event.actor === 'monster' && event.source === 'lifesteal')).toBe(true)
  })

  it('hero damage does not trigger monster lifesteal', () => {
    const battle = {
      ...noSkillBattle(),
      hero: {
        ...noSkillBattle().hero,
        stats: { ...noSkillBattle().hero.stats, defense: 100 },
      },
      monster: {
        ...noSkillBattle().monster,
        currentHp: 30,
        skills: [{ type: 'lifesteal' as const, triggerChance: 100 }],
      },
    }
    const attackCard = card({ type: 'physical', coefficient: 1, element: battle.monster.element })

    const { newState } = playCard(battle, attackCard)

    expect(newState.monster.currentHp).toBeLessThanOrEqual(30)
  })

  it('sets hero victory result and game over phase', () => {
    const battle = {
      ...noSkillBattle(),
      hero: {
        ...noSkillBattle().hero,
        stats: { ...noSkillBattle().hero.stats, physicalAttack: 100 },
      },
      monster: {
        ...noSkillBattle().monster,
        currentHp: 5,
        stats: { ...noSkillBattle().monster.stats, defense: 0 },
      },
    }
    const attackCard = card({ type: 'physical', coefficient: 1, element: battle.monster.element })

    const { newState } = playCard(battle, attackCard)

    expect(newState.phase).toBe('gameOver')
    expect(newState.result).toEqual({ winner: 'hero', reason: 'defeat' })
    expect(newState.winner).toBe('hero')
    expect(newState.events.at(-1)?.type).toBe('battleEnded')
  })

  it('sets monster victory when max turns are exceeded', () => {
    const battle = {
      ...noSkillBattle(),
      currentTurn: 20,
      hero: {
        ...noSkillBattle().hero,
        stats: { ...noSkillBattle().hero.stats, defense: 100 },
      },
    }

    const newState = skipTurn(battle)

    expect(newState.phase).toBe('gameOver')
    expect(newState.result).toEqual({ winner: 'monster', reason: 'turnLimit' })
    expect(newState.winner).toBe('monster')
  })

  it('emits JSON-serializable structured events', () => {
    const battle = noSkillBattle()
    const attackCard = card({ type: 'physical', coefficient: 1, element: battle.monster.element })

    const { newState } = playCard(battle, attackCard)
    const restored = JSON.parse(JSON.stringify(newState.events))

    expect(restored.length).toBeGreaterThan(0)
    expect(restored.some((event: { type: string }) => event.type === 'damage')).toBe(true)
  })
})

describe('applyVictoryGrowth', () => {
  it('increases all hero stats', () => {
    const hero = createInitialHero()
    const newHero = applyVictoryGrowth(hero)
    expect(newHero.stats.physicalAttack).toBe(13)
    expect(newHero.stats.magicAttack).toBe(13)
    expect(newHero.stats.defense).toBe(7)
    expect(newHero.stats.maxHp).toBe(110)
    expect(newHero.stats.critRate).toBe(2)
    expect(newHero.currentHp).toBe(100)
  })
})
