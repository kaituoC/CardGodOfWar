import type {
  BattleState,
  Card,
  CardOutcomeEstimate,
  DamagePreview,
  Element,
  BreakDefenseStatus,
  WeakStatus,
  GenerateMonsterIntentInput,
  MonsterIntent,
  MonsterIntentSkill,
} from './types'
import {
  ELEMENT_ADVANTAGE,
  ELEMENT_ADVANTAGE_MULTIPLIER,
  ELEMENT_DISADVANTAGE_MULTIPLIER,
  CRIT_MULTIPLIER,
  CRIT_BOOST_MULTIPLIER,
  MIN_DAMAGE,
  ENRAGE_START_TURN,
  ENRAGE_DAMAGE_PER_TURN,
  BREAK_DEFENSE_REDUCTION_PERCENT,
  WEAK_MULTIPLIER,
  STONE_GENERAL_SHIELD_CADENCE,
  ELEMENT_LABELS,
  STAT_LABELS,
  SKILL_LABELS,
} from './constants'
import {
  resolveElementDamageBonus,
  resolveCritMultiplierBonus,
  resolveLowHpDamageMultiplier,
  resolveShieldGainBonus,
  resolveHealOverflowShieldPercent,
} from './relic-effects'

let intentSequenceCounter = 0

function nextSequence(): number {
  return ++intentSequenceCounter
}

function getElementMultiplier(cardElement: Element, monsterElement: Element): number {
  if (cardElement === monsterElement) return 1.0
  if (ELEMENT_ADVANTAGE[cardElement] === monsterElement) return ELEMENT_ADVANTAGE_MULTIPLIER
  return ELEMENT_DISADVANTAGE_MULTIPLIER
}

export function previewDamage(
  attack: number,
  coefficient: number,
  defense: number,
  cardElement: Element,
  monsterElement: Element,
  critRate: number,
  isCritBoost: boolean,
  isImmuneToElement: Element | null,
  options?: {
    effectiveDefense?: number
    weakMultiplier?: number
    // 出伤方遗物上下文（仅英雄攻击预览传入），效果解析与执行共用 relic-effects
    attackerRelics?: readonly string[]
    attackerCurrentHp?: number
    attackerMaxHp?: number
  },
): DamagePreview {
  const relics = options?.attackerRelics ?? []
  const baseDamage = attack * coefficient
  const effectiveDefense = options?.effectiveDefense ?? defense
  const afterDefense = Math.max(baseDamage - effectiveDefense, MIN_DAMAGE)

  let elementMultiplier: number
  if (isImmuneToElement === cardElement) {
    elementMultiplier = 1.0
  } else {
    elementMultiplier = getElementMultiplier(cardElement, monsterElement)
  }
  // Element-damage relic (e.g. flame-emblem) — keep preview in sync with calculateDamage
  elementMultiplier += resolveElementDamageBonus(relics, cardElement)

  let estimatedDamage = Math.max(Math.floor(afterDefense * elementMultiplier), MIN_DAMAGE)

  // Apply weak multiplier to the post-element damage
  if (options?.weakMultiplier !== undefined) {
    estimatedDamage = Math.max(Math.floor(estimatedDamage * options.weakMultiplier), MIN_DAMAGE)
  }

  // Low-HP relic (e.g. blood-rage-sigil) for hero attacks
  const lowHpMultiplier = resolveLowHpDamageMultiplier(relics, options?.attackerCurrentHp, options?.attackerMaxHp)
  if (lowHpMultiplier !== 1.0) {
    estimatedDamage = Math.max(Math.floor(estimatedDamage * lowHpMultiplier), MIN_DAMAGE)
  }

  const critMultiplier = (isCritBoost ? CRIT_BOOST_MULTIPLIER : CRIT_MULTIPLIER) + resolveCritMultiplierBonus(relics)
  const critDamage = Math.max(Math.floor(estimatedDamage * critMultiplier), MIN_DAMAGE)

  return {
    baseDamage,
    afterDefense,
    elementMultiplier,
    estimatedDamage,
    critDamage,
    critRate,
    critMultiplier,
  }
}

function getTiming(type: MonsterIntentSkill['type']): 'monsterAction' | 'heroActionDefense' {
  if (type === 'shield' || type === 'elementImmune') return 'heroActionDefense'
  return 'monsterAction'
}

function getSkillLabel(type: MonsterIntentSkill['type'], immuneElement?: Element): string {
  if (type === 'elementImmune' && immuneElement) {
    return `${SKILL_LABELS[type]}(${ELEMENT_LABELS[immuneElement]})`
  }
  return SKILL_LABELS[type]
}

export function generateMonsterIntent(input: GenerateMonsterIntentInput): MonsterIntent {
  const { hero, monster, currentTurn, isEnraged, source = 'generated', existingStatuses = [] } = input

  const attackType: 'physical' | 'magic' = Math.random() > 0.5 ? 'physical' : 'magic'
  const baseAttack = attackType === 'physical' ? monster.stats.physicalAttack : monster.stats.magicAttack

  const enrageMultiplier = isEnraged
    ? 1 + (currentTurn - ENRAGE_START_TURN) * ENRAGE_DAMAGE_PER_TURN
    : 1.0

  const skills: MonsterIntentSkill[] = monster.skills.map(skill => ({
    type: skill.type,
    timing: getTiming(skill.type),
    immuneElement: skill.immuneElement,
    willTrigger: Math.random() * 100 < skill.triggerChance,
    label: getSkillLabel(skill.type, skill.immuneElement),
  }))

  // Stone General: force shield on shield pressure cadence turns (1, 4, 7, 10...)
  if (monster.archetype?.id === 'stoneGeneral') {
    const turnInSequence = (currentTurn - 1) % STONE_GENERAL_SHIELD_CADENCE
    if (turnInSequence === 0) {
      const existingShield = skills.find(s => s.type === 'shield')
      if (existingShield) {
        existingShield.willTrigger = true
      } else {
        skills.push({
          type: 'shield',
          timing: 'heroActionDefense',
          willTrigger: true,
          label: getSkillLabel('shield'),
        })
      }
    }
  }

  const isCritBoost = skills.some(s => s.type === 'critBoost' && s.willTrigger)
  const elementImmune = skills.find(s => s.type === 'elementImmune' && s.willTrigger)

  // Check for weak status on monster
  const weakStatus = existingStatuses.find(
    (s): s is WeakStatus => s.type === 'weak' && s.target === 'monster' && s.remainingUses > 0,
  )
  const weakMult = weakStatus ? weakStatus.multiplier : undefined

  // Preview base damage (without enrage for the previewDamage helper)
  const preview = previewDamage(
    baseAttack,
    1.0,
    hero.stats.defense,
    monster.element,
    monster.element,
    monster.stats.critRate,
    isCritBoost,
    elementImmune?.immuneElement ?? null,
    { weakMultiplier: weakMult },
  )

  // Apply enrage multiplier to the final estimated damage
  const enragedEstimated = Math.max(Math.floor(preview.estimatedDamage * enrageMultiplier), 1)
  const enragedCrit = Math.max(Math.floor(preview.critDamage * enrageMultiplier), 1)

  const attackTypeLabel = attackType === 'physical' ? '物理' : '魔法'
  const skillParts = skills.filter(s => s.willTrigger).map(s => s.label)
  const skillText = skillParts.length > 0 ? ` [${skillParts.join(', ')}]` : ''
  const enrageText = enrageMultiplier > 1 ? ` (狂暴×${enrageMultiplier.toFixed(1)})` : ''

  const message = `怪兽将使用${attackTypeLabel}攻击，预计伤害 ${enragedEstimated}${enrageText}${skillText}`

  const id = `intent-turn-${currentTurn}-${nextSequence()}`

  return {
    id,
    turn: currentTurn,
    source,
    action: 'attack',
    attackType,
    baseAttack,
    estimatedDamage: enragedEstimated,
    critDamage: enragedCrit,
    critRate: monster.stats.critRate,
    element: monster.element,
    enrageMultiplier,
    skills,
    message,
  }
}

function findTriggeredSkill(intent: MonsterIntent | null, type: MonsterIntentSkill['type']): MonsterIntentSkill | undefined {
  return intent?.skills.find(s => s.type === type && s.willTrigger)
}

export function estimateCardOutcome(battle: BattleState, card: Card): CardOutcomeEstimate {
  const { hero, monster, monsterIntent } = battle

  // Game-over state: no actionable estimates
  if (battle.gameOver) {
    if (card.type === 'physical' || card.type === 'magic') {
      return {
        type: 'unavailable',
        reason: 'gameOver',
        text: '',
      }
    }
    // Non-attack cards still show their base info even in game-over
  }

  // Safe fallback for missing intent (attack cards only)
  if (!monsterIntent && (card.type === 'physical' || card.type === 'magic')) {
    return {
      type: 'unavailable',
      reason: 'missingIntent',
      text: '',
    }
  }

  if ((card.type === 'physical' || card.type === 'magic') && hero.isStunned) {
    return {
      type: 'blocked',
      reason: 'stun',
      isBlockedByStun: true,
      text: '眩晕中',
    }
  }

  // --- Guard cards ---
  if (card.type === 'guard') {
    const baseShield = Math.floor(hero.stats.defense * card.coefficient)
    const shieldBonus = resolveShieldGainBonus(hero.relics)
    const shieldAmount = Math.floor(baseShield * (1 + shieldBonus))
    return {
      type: 'guard',
      shieldAmount,
      text: `护盾 +${shieldAmount}`,
    }
  }

  // --- Tactical cards ---
  if (card.type === 'tactical') {
    const statusLabels: Record<string, string> = {
      armorBreak: '破甲',
      suppress: '虚弱',
    }
    const statusApplied: 'breakDefense' | 'weak' = card.effect === 'armorBreak' ? 'breakDefense' : 'weak'
    const statusText = statusLabels[card.effect || ''] || statusApplied
    const amount = card.effect === 'armorBreak' ? BREAK_DEFENSE_REDUCTION_PERCENT : Math.floor(WEAK_MULTIPLIER * 100)

    // Calculate damage preview for tactical cards (account for existing break-defense)
    const attack = hero.stats.physicalAttack
    const existingBreakDefense = battle.statusEffects?.find(
      (s): s is BreakDefenseStatus => s.type === 'breakDefense' && s.target === 'monster' && s.remainingUses > 0,
    )
    const effectiveMonsterDefense = existingBreakDefense
      ? Math.max(monster.stats.defense - Math.floor(monster.stats.defense * existingBreakDefense.reductionPercent / 100), 0)
      : monster.stats.defense
    const tacticalDamage = previewDamage(
      attack,
      card.coefficient,
      effectiveMonsterDefense,
      card.element || monster.element,
      monster.element,
      hero.stats.critRate,
      false,
      null,
      { attackerRelics: hero.relics, attackerCurrentHp: hero.currentHp, attackerMaxHp: hero.stats.maxHp },
    )

    return {
      type: 'tactical',
      amount,
      damageEstimate: tacticalDamage.estimatedDamage,
      statusApplied,
      statusText,
      text: `伤害 ${tacticalDamage.estimatedDamage} + 施加 ${statusText}`,
    }
  }

  if (card.type === 'physical' || card.type === 'magic') {
    const attack = card.type === 'physical' ? hero.stats.physicalAttack : hero.stats.magicAttack
    const shield = findTriggeredSkill(monsterIntent, 'shield')
    const elementImmune = findTriggeredSkill(monsterIntent, 'elementImmune')
    // Monster critBoost does NOT affect hero card estimates — hero attacks use their own crit only
    const isCritBoost = false

    // Check for break-defense status on monster
    const breakDefenseStatus = battle.statusEffects?.find(
      (s): s is BreakDefenseStatus => s.type === 'breakDefense' && s.target === 'monster' && s.remainingUses > 0,
    )
    const effectiveMonsterDefense = breakDefenseStatus
      ? Math.max(monster.stats.defense - Math.floor(monster.stats.defense * breakDefenseStatus.reductionPercent / 100), 0)
      : monster.stats.defense

    // Relic effects (flame-emblem / sharp-charm / blood-rage-sigil) are resolved inside
    // previewDamage via relic-effects, the same source calculateDamage uses.
    const preview = previewDamage(
      attack,
      card.coefficient,
      effectiveMonsterDefense,
      card.element!,
      monster.element,
      hero.stats.critRate,
      isCritBoost,
      elementImmune?.immuneElement ?? null,
      { attackerRelics: hero.relics, attackerCurrentHp: hero.currentHp, attackerMaxHp: hero.stats.maxHp },
    )

    // Apply shield reduction to the estimate
    const hasShield = Boolean(shield)
    const afterShield = hasShield ? Math.max(Math.floor(preview.estimatedDamage * 0.5), 1) : preview.estimatedDamage
    const afterShieldCrit = hasShield ? Math.max(Math.floor(preview.critDamage * 0.5), 1) : preview.critDamage

    const critLabel: '暴击' | '强化暴击' = isCritBoost ? '强化暴击' : '暴击'
    let text = `预计 ${afterShield}`
    if (preview.critRate > 0) {
      text += ` | ${critLabel}${preview.critRate}%→${afterShieldCrit}`
    }

    return {
      type: 'damage',
      amount: afterShield,
      critDamage: afterShieldCrit,
      critRate: preview.critRate,
      critMultiplier: preview.critMultiplier,
      critLabel,
      elementMultiplier: preview.elementMultiplier,
      isBlockedByStun: false,
      isShielded: Boolean(shield),
      isImmune: elementImmune?.immuneElement === card.element,
      text,
    }
  }

  if (card.type === 'heal') {
    const rawHeal = Math.floor(hero.stats.maxHp * card.coefficient)
    const healAmount = Math.min(rawHeal, hero.stats.maxHp - hero.currentHp)

    // Heal-overflow-to-shield relic (e.g. water-spirit-bottle) — same source as execution
    const overflowShieldPercent = resolveHealOverflowShieldPercent(hero.relics)
    let overflowShield: number | undefined
    if (overflowShieldPercent !== undefined && rawHeal > healAmount) {
      const overflow = rawHeal - healAmount
      overflowShield = Math.floor(overflow * overflowShieldPercent)
    }

    let text = `恢复 ${healAmount}`
    if (overflowShield && overflowShield > 0) {
      text += ` | 溢出护盾 +${overflowShield}`
    }

    return {
      type: 'heal',
      amount: healAmount,
      overflowShield,
      text,
    }
  }

  if (card.type === 'statBoost' && card.statBoost) {
    const { stat, value } = card.statBoost
    const label = STAT_LABELS[stat] || stat
    return {
      type: 'statBoost',
      stat,
      amount: value,
      text: `${label} +${value}`,
    }
  }

  // Generic fallback for unknown card types
  return {
    type: 'unavailable',
    reason: 'missingIntent',
    text: '',
  }
}
