import type { Element, RelicEffect } from './types'
import { RELIC_REGISTRY } from './constants'

/**
 * 遗物效果解析的单一事实源。
 *
 * 执行（battle-calculator / game-engine）与预览（monster-intent）共用这里的函数，
 * 保证两侧逻辑永不漂移。新增"出伤/暴击/护盾"类遗物时，只需在 RELIC_REGISTRY 注册
 * 并在此补一个解析分支，调用方无需改动。
 */

/** 查找英雄拥有的、指定 effect.type 的遗物效果（取第一个匹配）。 */
function findOwnedEffect<T extends RelicEffect['type']>(
  relics: readonly string[],
  type: T,
): Extract<RelicEffect, { type: T }> | undefined {
  for (const id of relics) {
    const relic = RELIC_REGISTRY.find(r => r.id === id)
    if (relic && relic.effect.type === type) {
      return relic.effect as Extract<RelicEffect, { type: T }>
    }
  }
  return undefined
}

/** 元素增伤（如 flame-emblem 火 +25%）：返回叠加到 elementMultiplier 上的加成，默认 0。 */
export function resolveElementDamageBonus(relics: readonly string[], cardElement: Element): number {
  const effect = findOwnedEffect(relics, 'elementDamageBonus')
  return effect && effect.element === cardElement ? effect.bonus : 0
}

/** 低 HP 增伤（如 blood-rage-sigil HP<30% → +20%）：满足阈值返回伤害倍率，否则 1.0。 */
export function resolveLowHpDamageMultiplier(
  relics: readonly string[],
  currentHp: number | undefined,
  maxHp: number | undefined,
): number {
  if (currentHp === undefined || maxHp === undefined) return 1.0
  const effect = findOwnedEffect(relics, 'lowHpDamageBonus')
  if (effect && currentHp <= maxHp * effect.thresholdPercent / 100) {
    return 1 + effect.bonusPercent
  }
  return 1.0
}

/** 暴击倍率加成（如 sharp-charm +0.3）：返回叠加到暴击倍率上的加成，默认 0。 */
export function resolveCritMultiplierBonus(relics: readonly string[]): number {
  return findOwnedEffect(relics, 'critMultiplierBonus')?.bonus ?? 0
}

/** 护盾获取加成（如 ironwall-crest +30%）：返回护盾增益百分比，默认 0。 */
export function resolveShieldGainBonus(relics: readonly string[]): number {
  return findOwnedEffect(relics, 'shieldGainBonus')?.bonusPercent ?? 0
}

/** 治疗溢出转护盾比例（如 water-spirit-bottle 50%）：拥有则返回比例，否则 undefined。 */
export function resolveHealOverflowShieldPercent(relics: readonly string[]): number | undefined {
  return findOwnedEffect(relics, 'healOverflowToShield')?.overflowPercent
}

/** 下回合攻击加成（如 thunder-core 雷攻后 +15%）：拥有且元素匹配则返回加成，否则 undefined。 */
export function resolveNextTurnAttackBonus(relics: readonly string[], cardElement: Element): number | undefined {
  const effect = findOwnedEffect(relics, 'nextTurnAttackBonus')
  return effect && effect.element === cardElement ? effect.bonusPercent : undefined
}

/** 战斗开始恢复（如 regrowth-seed +20HP）：拥有则返回恢复量，否则 0。 */
export function resolveBattleStartRecovery(relics: readonly string[]): number {
  return findOwnedEffect(relics, 'battleStartRecovery')?.amount ?? 0
}

/** 克制命中破防（如 armor-breaker-blade）：拥有则返回破防参数，否则 undefined。 */
export function resolveAdvantageBreakDefenseEffect(
  relics: readonly string[],
): { reductionPercent: number; uses: number } | undefined {
  const effect = findOwnedEffect(relics, 'advantageBreakDefense')
  return effect ? { reductionPercent: effect.reductionPercent, uses: effect.uses } : undefined
}
