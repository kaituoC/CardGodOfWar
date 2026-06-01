import { describe, it, expect } from 'vitest'
import {
  resolveElementDamageBonus,
  resolveCritMultiplierBonus,
  resolveLowHpDamageMultiplier,
  resolveShieldGainBonus,
  resolveHealOverflowShieldPercent,
  resolveNextTurnAttackBonus,
  resolveBattleStartRecovery,
  resolveAdvantageBreakDefenseEffect,
} from '@/game/relic-effects'
import { previewDamage } from '@/game/monster-intent'
import { calculateDamage } from '@/game/battle-calculator'

// 这些测试锁定 RELIC_REGISTRY 与 relic-effects 解析层之间的契约，
// 以及"预览(previewDamage) 与 执行(calculateDamage) 共用同一遗物解析"的不变量。

describe('relic-effects 解析层', () => {
  it('元素增伤仅对匹配元素生效（flame-emblem 火 +0.25）', () => {
    expect(resolveElementDamageBonus(['flame-emblem'], 'fire')).toBe(0.25)
    expect(resolveElementDamageBonus(['flame-emblem'], 'water')).toBe(0)
    expect(resolveElementDamageBonus([], 'fire')).toBe(0)
  })

  it('暴击倍率加成（sharp-charm +0.3）', () => {
    expect(resolveCritMultiplierBonus(['sharp-charm'])).toBe(0.3)
    expect(resolveCritMultiplierBonus([])).toBe(0)
  })

  it('低 HP 增伤仅在阈值内生效（blood-rage-sigil HP≤30% → ×1.2）', () => {
    expect(resolveLowHpDamageMultiplier(['blood-rage-sigil'], 20, 100)).toBe(1.2)
    expect(resolveLowHpDamageMultiplier(['blood-rage-sigil'], 50, 100)).toBe(1.0)
    expect(resolveLowHpDamageMultiplier([], 20, 100)).toBe(1.0)
    expect(resolveLowHpDamageMultiplier(['blood-rage-sigil'], undefined, undefined)).toBe(1.0)
  })

  it('护盾获取加成（ironwall-crest +0.3）', () => {
    expect(resolveShieldGainBonus(['ironwall-crest'])).toBe(0.3)
    expect(resolveShieldGainBonus([])).toBe(0)
  })

  it('治疗溢出转护盾比例（water-spirit-bottle 0.5）', () => {
    expect(resolveHealOverflowShieldPercent(['water-spirit-bottle'])).toBe(0.5)
    expect(resolveHealOverflowShieldPercent([])).toBeUndefined()
  })

  it('下回合攻击加成仅对匹配元素生效（thunder-core 雷 +0.15）', () => {
    expect(resolveNextTurnAttackBonus(['thunder-core'], 'thunder')).toBe(0.15)
    expect(resolveNextTurnAttackBonus(['thunder-core'], 'fire')).toBeUndefined()
    expect(resolveNextTurnAttackBonus([], 'thunder')).toBeUndefined()
  })

  it('战斗开始恢复（regrowth-seed +20）', () => {
    expect(resolveBattleStartRecovery(['regrowth-seed'])).toBe(20)
    expect(resolveBattleStartRecovery([])).toBe(0)
  })

  it('克制破防参数来自 registry（armor-breaker-blade 40%/3次）', () => {
    expect(resolveAdvantageBreakDefenseEffect(['armor-breaker-blade'])).toEqual({ reductionPercent: 40, uses: 3 })
    expect(resolveAdvantageBreakDefenseEffect([])).toBeUndefined()
  })
})

describe('预览与执行的遗物一致性', () => {
  it('flame-emblem 使火属性攻击预览伤害提升（修复前预览漏算）', () => {
    const base = previewDamage(50, 1.0, 5, 'fire', 'thunder', 0, false, null, { attackerRelics: [] })
    const withEmblem = previewDamage(50, 1.0, 5, 'fire', 'thunder', 0, false, null, { attackerRelics: ['flame-emblem'] })
    expect(withEmblem.estimatedDamage).toBeGreaterThan(base.estimatedDamage)
  })

  it('blood-rage-sigil 使低 HP 时预览伤害提升', () => {
    const normal = previewDamage(50, 1.0, 5, 'fire', 'fire', 0, false, null, {
      attackerRelics: ['blood-rage-sigil'], attackerCurrentHp: 80, attackerMaxHp: 100,
    })
    const lowHp = previewDamage(50, 1.0, 5, 'fire', 'fire', 0, false, null, {
      attackerRelics: ['blood-rage-sigil'], attackerCurrentHp: 20, attackerMaxHp: 100,
    })
    expect(lowHp.estimatedDamage).toBeGreaterThan(normal.estimatedDamage)
  })

  it('无暴击场景下预览估算与执行结果差异不超过 ±1（共用同一遗物解析）', () => {
    // critRate=0 保证不暴击，消除随机；遗物加成两侧应同源
    const relics = ['flame-emblem']
    const preview = previewDamage(50, 1.5, 5, 'fire', 'thunder', 0, false, null, { attackerRelics: relics })
    const exec = calculateDamage({
      attack: 50, coefficient: 1.5, defense: 5,
      cardElement: 'fire', monsterElement: 'thunder', critRate: 0,
      isShield: false, isCritBoost: false, isImmuneToElement: null,
      enrageMultiplier: 1.0, isMonsterAttacking: false, attackerRelics: relics,
    })
    expect(Math.abs(preview.estimatedDamage - exec.finalDamage)).toBeLessThanOrEqual(1)
  })
})
