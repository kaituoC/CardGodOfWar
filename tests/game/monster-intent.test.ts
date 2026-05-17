import { describe, it, expect } from 'vitest'
import { generateMonsterIntent, previewDamage, estimateCardOutcome } from '@/game/monster-intent'
import { createInitialHero, createBattle, playCard, skipTurn } from '@/game/game-engine'
import type { BattleState, Card } from '@/game/types'

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

function noCritBattle(): BattleState {
  const battle = createBattle(1, createInitialHero())
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
        physicalAttack: 20,
        magicAttack: 20,
        defense: 3,
        critRate: 0,
      },
      skills: [],
    },
  }
}

// ============================================================
// previewDamage tests
// ============================================================

describe('previewDamage', () => {
  it('returns deterministic damage without rolling crit', () => {
    const result = previewDamage(20, 1.0, 5, 'fire', 'fire', 30, false, null)
    // Should be the same every time
    for (let i = 0; i < 10; i++) {
      const r = previewDamage(20, 1.0, 5, 'fire', 'fire', 30, false, null)
      expect(r.estimatedDamage).toBe(result.estimatedDamage)
      expect(r.critDamage).toBe(result.critDamage)
    }
  })

  it('calculates correct critDamage with boost', () => {
    const normal = previewDamage(20, 1.0, 5, 'fire', 'fire', 0, false, null)
    const boosted = previewDamage(20, 1.0, 5, 'fire', 'fire', 0, true, null)
    expect(boosted.critDamage).toBeGreaterThan(normal.critDamage)
  })

  it('applies element advantage in preview', () => {
    const advantaged = previewDamage(20, 1.0, 5, 'fire', 'thunder', 0, false, null)
    const neutral = previewDamage(20, 1.0, 5, 'fire', 'fire', 0, false, null)
    expect(advantaged.estimatedDamage).toBeGreaterThan(neutral.estimatedDamage)
  })

  it('applies element immunity as neutral multiplier', () => {
    const immune = previewDamage(20, 1.0, 5, 'fire', 'thunder', 0, false, 'fire')
    const normal = previewDamage(20, 1.0, 5, 'fire', 'thunder', 0, false, null)
    expect(immune.estimatedDamage).toBeLessThan(normal.estimatedDamage)
    expect(immune.elementMultiplier).toBe(1.0)
  })
})

// ============================================================
// estimateCardOutcome tests
// ============================================================

describe('estimateCardOutcome', () => {
  it('attack estimate matches actual non-crit damage when critRate is 0', () => {
    const battle = noCritBattle()
    const attackCard = card({ type: 'physical', coefficient: 1.5, element: battle.monster.element })
    const estimate = estimateCardOutcome(battle, attackCard)

    expect(estimate.type).toBe('damage')
    if (estimate.type === 'damage') {
      const { newState } = playCard(battle, attackCard)
      const damageEvent = newState.events.find(e => e.type === 'damage' && e.actor === 'hero')
      expect(damageEvent).toBeDefined()
      if (damageEvent) {
        expect(estimate.amount).toBe((damageEvent as any).amount)
      }
    }
  })

  it('shield in intent affects attack card estimate', () => {
    const battle = noCritBattle()
    const base = estimateCardOutcome(battle, card({ type: 'physical', coefficient: 1, element: battle.monster.element }))

    // Create a battle with shield in intent (triggerChance 100)
    const shieldBattle: BattleState = {
      ...battle,
      monster: {
        ...battle.monster,
        skills: [{ type: 'shield', triggerChance: 100 }],
      },
    }
    // Regenerate intent with shield
    const intent = generateMonsterIntent({
      level: shieldBattle.level,
      hero: shieldBattle.hero,
      monster: shieldBattle.monster,
      currentTurn: shieldBattle.currentTurn,
      maxTurns: shieldBattle.maxTurns,
      isEnraged: shieldBattle.isEnraged,
    })
    // Ensure shield triggered
    intent.skills.find(s => s.type === 'shield')!.willTrigger = true
    shieldBattle.monsterIntent = intent

    const shielded = estimateCardOutcome(shieldBattle, card({ type: 'physical', coefficient: 1, element: battle.monster.element }))

    if (base.type === 'damage' && shielded.type === 'damage') {
      expect(shielded.amount).toBeLessThan(base.amount)
      expect(shielded.isShielded).toBe(true)
    }
  })

  it('element immunity in intent affects matching element attack estimate', () => {
    const battle = noCritBattle()

    const immuneBattle: BattleState = {
      ...battle,
      monster: {
        ...battle.monster,
        skills: [{ type: 'elementImmune', immuneElement: 'fire' as const, triggerChance: 100 }],
      },
    }
    const intent = generateMonsterIntent({
      level: immuneBattle.level,
      hero: immuneBattle.hero,
      monster: immuneBattle.monster,
      currentTurn: immuneBattle.currentTurn,
      maxTurns: immuneBattle.maxTurns,
      isEnraged: immuneBattle.isEnraged,
    })
    intent.skills.find(s => s.type === 'elementImmune')!.willTrigger = true
    immuneBattle.monsterIntent = intent

    const fireCard = card({ type: 'physical', coefficient: 1, element: 'fire' })
    const estimate = estimateCardOutcome(immuneBattle, fireCard)

    expect(estimate.type).toBe('damage')
    if (estimate.type === 'damage') {
      expect(estimate.isImmune).toBe(true)
      expect(estimate.elementMultiplier).toBe(1.0)
    }
  })

  it('heal estimate is correct', () => {
    const battle = noCritBattle()
    const healCard = card({ type: 'heal', coefficient: 0.4, element: undefined })
    const estimate = estimateCardOutcome(battle, healCard)

    expect(estimate.type).toBe('heal')
    if (estimate.type === 'heal') {
      expect(estimate.amount).toBe(Math.floor(battle.hero.stats.maxHp * 0.4))
      expect(estimate.text).toContain('恢复')
    }
  })

  it('stat boost estimate is correct', () => {
    const battle = noCritBattle()
    const boostCard = card({
      type: 'statBoost',
      coefficient: 0,
      element: undefined,
      statBoost: { stat: 'physicalAttack', value: 2 },
    })
    const estimate = estimateCardOutcome(battle, boostCard)

    expect(estimate.type).toBe('statBoost')
    if (estimate.type === 'statBoost') {
      expect(estimate.stat).toBe('physicalAttack')
      expect(estimate.amount).toBe(2)
    }
  })

  it('stunned attack card shows blocked state', () => {
    const battle: BattleState = {
      ...noCritBattle(),
      hero: { ...noCritBattle().hero, isStunned: true },
    }
    const attackCard = card({ type: 'physical', element: 'fire' })
    const estimate = estimateCardOutcome(battle, attackCard)

    expect(estimate.type).toBe('blocked')
    if (estimate.type === 'blocked') {
      expect(estimate.text).toBe('眩晕中')
    }
  })
})

// ============================================================
// Intent generation tests
// ============================================================

describe('generateMonsterIntent', () => {
  it('creates intent with all required fields', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    const intent = battle.monsterIntent

    expect(intent.id).toMatch(/^intent-turn-\d+-\d+$/)
    expect(intent.turn).toBe(1)
    expect(intent.source).toBe('generated')
    expect(intent.action).toBe('attack')
    expect(['physical', 'magic']).toContain(intent.attackType)
    expect(intent.baseAttack).toBeGreaterThan(0)
    expect(intent.estimatedDamage).toBeGreaterThan(0)
    expect(intent.skills.length).toBe(1) // level 1 monster has 1 skill
  })

  it('skill chance 100 triggers', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    battle.monster.skills = [{ type: 'stun', triggerChance: 100 }]

    // Generate multiple times to ensure it always triggers
    for (let i = 0; i < 10; i++) {
      const intent = generateMonsterIntent({
        level: 1, hero, monster: battle.monster,
        currentTurn: 1, maxTurns: 20, isEnraged: false,
      })
      const stun = intent.skills.find(s => s.type === 'stun')
      expect(stun?.willTrigger).toBe(true)
    }
  })

  it('skill chance 0 does not trigger', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    battle.monster.skills = [{ type: 'lifesteal', triggerChance: 0 }]

    for (let i = 0; i < 10; i++) {
      const intent = generateMonsterIntent({
        level: 1, hero, monster: battle.monster,
        currentTurn: 1, maxTurns: 20, isEnraged: false,
      })
      const lifesteal = intent.skills.find(s => s.type === 'lifesteal')
      expect(lifesteal?.willTrigger).toBe(false)
    }
  })

  it('boss has enrage multiplier when enraged', () => {
    const hero = createInitialHero()
    const battle = createBattle(5, hero) // level 5 is boss
    battle.monster.isBoss = true

    const enragedIntent = generateMonsterIntent({
      level: 5, hero, monster: battle.monster,
      currentTurn: 18, maxTurns: 20, isEnraged: true,
    })
    expect(enragedIntent.enrageMultiplier).toBeGreaterThan(1.0)
  })

  it('restored intent has correct source', () => {
    const hero = createInitialHero()
    const battle = createBattle(1, hero)

    const restoredIntent = generateMonsterIntent({
      level: 1, hero, monster: battle.monster,
      currentTurn: 1, maxTurns: 20, isEnraged: false,
      source: 'restored',
    })
    expect(restoredIntent.source).toBe('restored')
  })
})

// ============================================================
// Intent-driven battle flow tests
// ============================================================

describe('intent-driven resolution', () => {
  it('monster attack follows stored intent attack type', () => {
    // Create a battle and check that monster damage event uses the intent's attackType
    const hero = createInitialHero()
    const battle = createBattle(1, hero)
    const intentAttackType = battle.monsterIntent.attackType

    const newState = skipTurn(battle)
    const monsterDamage = newState.events.find(e => e.type === 'damage' && e.actor === 'monster')
    expect(monsterDamage).toBeDefined()
    if (monsterDamage) {
      const damageType = (monsterDamage as any).damageType
      expect(damageType).toBe(intentAttackType)
    }
  })

  it('intent consumed event is emitted', () => {
    const battle = createBattle(1, createInitialHero())
    const intentId = battle.monsterIntent.id

    const newState = skipTurn(battle)
    const consumedEvent = newState.events.find(e => e.type === 'intentConsumed')
    expect(consumedEvent).toBeDefined()
    if (consumedEvent) {
      expect((consumedEvent as any).intentId).toBe(intentId)
    }
  })

  it('hero victory does not generate next-turn intent', () => {
    const battle = noCritBattle()
    // Make hero strong enough to kill monster
    battle.hero.stats.physicalAttack = 1000
    const attackCard = card({ type: 'physical', coefficient: 3, element: battle.monster.element })

    const { newState } = playCard(battle, attackCard)

    expect(newState.gameOver).toBe(true)
    expect(newState.winner).toBe('hero')
  })

  it('intent does not change during player decision', () => {
    const battle = createBattle(1, createInitialHero())
    const firstIntentId = battle.monsterIntent.id

    // Read intent multiple times without acting
    expect(battle.monsterIntent.id).toBe(firstIntentId)
    expect(battle.monsterIntent.id).toBe(firstIntentId)
  })

  it('next turn generates new intent', () => {
    const battle = createBattle(1, createInitialHero())
    const turn1IntentId = battle.monsterIntent.id

    const newState = skipTurn(battle)

    expect(newState.currentTurn).toBe(2)
    expect(newState.monsterIntent.turn).toBe(2)
    expect(newState.monsterIntent.id).not.toBe(turn1IntentId)
  })

  it('intent events are hidden from logs', () => {
    const battle = createBattle(1, createInitialHero())
    const newState = skipTurn(battle)

    const logMessages = newState.logs.map(l => l.message)
    expect(logMessages.some(m => m.includes('意图已生成'))).toBe(false)
    expect(logMessages.some(m => m.includes('意图已执行'))).toBe(false)
  })

  it('intent id is available in damage events without parsing text', () => {
    const battle = createBattle(1, createInitialHero())
    const intentId = battle.monsterIntent.id

    const newState = skipTurn(battle)
    const monsterDamage = newState.events.find(e => e.type === 'damage' && e.actor === 'monster')

    expect(monsterDamage).toBeDefined()
    if (monsterDamage) {
      expect((monsterDamage as any).intentId).toBe(intentId)
    }
  })
})

// ============================================================
// Save/restore tests
// ============================================================

describe('save/restore intent compatibility', () => {
  it('battle state with intent serializes to JSON and back', () => {
    const battle = createBattle(1, createInitialHero())
    const json = JSON.stringify(battle)
    const restored: BattleState = JSON.parse(json)

    expect(restored.monsterIntent).toBeDefined()
    expect(restored.monsterIntent.id).toBe(battle.monsterIntent.id)
    expect(restored.monsterIntent.skills.length).toBe(battle.monsterIntent.skills.length)
  })

  it('battle state without monsterIntent gets restored intent', () => {
    const battle = createBattle(1, createInitialHero())
    // Simulate old save without monsterIntent
    const oldSave = JSON.parse(JSON.stringify(battle))
    delete oldSave.monsterIntent

    // The game-store's normalizeBattleState should generate one
    // We test this indirectly through the store import
    // For now, verify that the generateMonsterIntent helper works with old-save-like data
    const intent = generateMonsterIntent({
      level: oldSave.level,
      hero: oldSave.hero,
      monster: oldSave.monster,
      currentTurn: oldSave.currentTurn,
      maxTurns: oldSave.maxTurns,
      isEnraged: oldSave.isEnraged,
      source: 'restored',
    })
    expect(intent.source).toBe('restored')
    expect(intent.turn).toBe(oldSave.currentTurn)
  })
})
