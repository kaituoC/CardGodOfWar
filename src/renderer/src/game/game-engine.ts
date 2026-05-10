import type {
  BattleState, Hero, Monster, Card,
  BattleLogEntry, Element, MonsterSkillType, Stats,
} from './types'
import type { DamageResult } from './battle-calculator'
import { calculateDamage } from './battle-calculator'
import { generateCards } from './card-pool'
import { generateMonster } from './monster-generator'
import {
  HERO_INITIAL_STATS,
  HERO_VICTORY_GROWTH,
  MAX_TURNS,
  ENRAGE_START_TURN,
  ENRAGE_DAMAGE_PER_TURN,
} from './constants'

export function createInitialHero(): Hero {
  const stats = { ...HERO_INITIAL_STATS }
  return {
    stats,
    currentHp: stats.maxHp,
    isStunned: false,
  }
}

export function createBattle(level: number, hero: Hero): BattleState {
  const monster = generateMonster(level)
  return {
    hero: { ...hero, isStunned: false },
    monster,
    currentTurn: 1,
    maxTurns: MAX_TURNS,
    cards: generateCards(level),
    logs: [],
    isPlayerTurn: true,
    isEnraged: false,
    gameOver: false,
    winner: null,
  }
}

export function playCard(state: BattleState, card: Card): { newState: BattleState; damageResult?: DamageResult } {
  const { hero, monster, currentTurn, isEnraged } = state
  const newLogs: BattleLogEntry[] = []

  if (card.type === 'physical' || card.type === 'magic') {
    if (hero.isStunned) {
      newLogs.push({
        turn: currentTurn,
        message: '眩晕中！无法使用攻击卡牌！',
        isHeroAction: true,
      })
      return { newState: { ...state, logs: [...state.logs, ...newLogs] } }
    }

    const attack = card.type === 'physical' ? hero.stats.physicalAttack : hero.stats.magicAttack
    const skillEffects = getMonsterSkillEffectsForTurn(monster, currentTurn)

    const damageResult = calculateDamage({
      attack,
      coefficient: card.coefficient,
      defense: monster.stats.defense,
      cardElement: card.element,
      monsterElement: monster.element,
      critRate: hero.stats.critRate,
      isShield: skillEffects.isShield,
      isCritBoost: false,
      isImmuneToElement: skillEffects.immuneElement,
      enrageMultiplier: 1.0,
      isMonsterAttacking: false,
    })

    let newMonsterHp = Math.max(monster.currentHp - damageResult.finalDamage, 0)

    const elementNames: Record<Element, string> = { fire: '火', thunder: '雷', water: '水' }
    const typeLabel = card.type === 'physical' ? '物理' : '魔法'
    const attackValue = card.type === 'physical' ? hero.stats.physicalAttack : hero.stats.magicAttack
    let logMsg = `英雄使用${typeLabel}攻击: ${attackValue} × ${card.coefficient} = ${Math.round(attackValue * card.coefficient * 10) / 10}`

    if (damageResult.elementMultiplier !== 1.0) {
      const advOrDis = damageResult.elementMultiplier > 1 ? '克制' : '被克'
      logMsg += `, ${elementNames[card.element]}${advOrDis}${elementNames[monster.element]} ×${damageResult.elementMultiplier}`
    }
    logMsg += `, 防御-${monster.stats.defense} = ${damageResult.finalDamage}伤害`
    if (damageResult.isCrit) logMsg += ' 🔥暴击！'

    newLogs.push({ turn: currentTurn, message: logMsg, isHeroAction: true })

    if (skillEffects.hasLifesteal) {
      const lifestealHp = Math.floor(damageResult.finalDamage * 0.3)
      newMonsterHp = Math.min(newMonsterHp + lifestealHp, monster.stats.maxHp)
      newLogs.push({
        turn: currentTurn,
        message: `怪兽吸血恢复 ${lifestealHp} HP`,
        isHeroAction: false,
      })
    }

    if (newMonsterHp <= 0) {
      return {
        newState: {
          ...state,
          monster: { ...state.monster, currentHp: 0 },
          logs: [...state.logs, ...newLogs],
          gameOver: true,
          winner: 'hero',
        },
        damageResult,
      }
    }

    return monsterCounterAttack(
      { ...state, monster: { ...state.monster, currentHp: newMonsterHp }, logs: [...state.logs, ...newLogs] },
      currentTurn,
      isEnraged,
    )
  }

  if (card.type === 'heal') {
    const healAmount = Math.floor(hero.stats.maxHp * card.coefficient)
    const newHp = Math.min(hero.currentHp + healAmount, hero.stats.maxHp)
    newLogs.push({
      turn: currentTurn,
      message: `英雄恢复 ${healAmount} HP (${hero.currentHp} → ${newHp})`,
      isHeroAction: true,
    })

    return monsterCounterAttack(
      { ...state, hero: { ...hero, currentHp: newHp }, logs: [...state.logs, ...newLogs] },
      currentTurn,
      isEnraged,
    )
  }

  if (card.type === 'statBoost' && card.statBoost) {
    const { stat, value } = card.statBoost
    const newStats = { ...hero.stats }
    newStats[stat] = Math.min(newStats[stat] + value, stat === 'critRate' ? 100 : newStats[stat] + value)
    newLogs.push({
      turn: currentTurn,
      message: `英雄${stat}永久 +${value}`,
      isHeroAction: true,
    })

    return monsterCounterAttack(
      { ...state, hero: { ...hero, stats: newStats }, logs: [...state.logs, ...newLogs] },
      currentTurn,
      isEnraged,
    )
  }

  return { newState: state }
}

function getMonsterSkillEffectsForTurn(monster: Monster, _turn: number) {
  const roll = (skillType: MonsterSkillType) => {
    const skill = monster.skills.find(s => s.type === skillType)
    if (!skill) return false
    return Math.random() * 100 < skill.triggerChance
  }

  return {
    isShield: roll('shield'),
    hasLifesteal: roll('lifesteal'),
    isCritBoost: roll('critBoost'),
    immuneElement: (monster.skills.find(s => s.type === 'elementImmune') && roll('elementImmune'))
      ? monster.skills.find(s => s.type === 'elementImmune')?.immuneElement ?? null
      : null,
    willStun: roll('stun'),
  }
}

function monsterCounterAttack(state: BattleState, turn: number, isEnraged: boolean): { newState: BattleState; damageResult?: DamageResult } {
  const { hero, monster } = state
  const newLogs: BattleLogEntry[] = []

  const skillEffects = getMonsterSkillEffectsForTurn(monster, turn)

  const isPhysical = Math.random() > 0.5
  const attack = isPhysical ? monster.stats.physicalAttack : monster.stats.magicAttack
  const typeLabel = isPhysical ? '物理' : '魔法'

  const enrageMultiplier = monster.isBoss && isEnraged
    ? 1 + (turn - ENRAGE_START_TURN) * ENRAGE_DAMAGE_PER_TURN
    : 1.0

  const damageResult = calculateDamage({
    attack,
    coefficient: 1.0,
    defense: hero.stats.defense,
    cardElement: monster.element,
    monsterElement: monster.element,
    critRate: monster.stats.critRate,
    isShield: false,
    isCritBoost: skillEffects.isCritBoost,
    isImmuneToElement: null,
    enrageMultiplier,
    isMonsterAttacking: true,
  })

  const newHeroHp = Math.max(hero.currentHp - damageResult.finalDamage, 0)
  const critText = damageResult.isCrit ? ' 🔥暴击！' : ''
  const enrageText = enrageMultiplier > 1 ? ` (狂暴×${enrageMultiplier.toFixed(1)})` : ''

  newLogs.push({
    turn,
    message: `怪兽${typeLabel}攻击: ${attack} × 1.0 - ${hero.stats.defense} = ${damageResult.finalDamage}伤害${critText}${enrageText}`,
    isHeroAction: false,
  })

  const newIsStunned = skillEffects.willStun

  if (newHeroHp <= 0) {
    return {
      newState: {
        ...state,
        hero: { ...hero, currentHp: 0, isStunned: newIsStunned },
        logs: [...state.logs, ...newLogs],
        gameOver: true,
        winner: 'monster',
      },
      damageResult,
    }
  }

  return {
    newState: {
      ...state,
      hero: { ...hero, currentHp: newHeroHp, isStunned: newIsStunned },
      logs: [...state.logs, ...newLogs],
      currentTurn: turn + 1,
      cards: generateCards(1),
      isPlayerTurn: true,
      isEnraged: monster.isBoss && turn + 1 > ENRAGE_START_TURN,
      gameOver: turn + 1 > MAX_TURNS,
      winner: turn + 1 > MAX_TURNS ? 'monster' : null,
    },
    damageResult,
  }
}

export function applyVictoryGrowth(hero: Hero): Hero {
  const newStats: Stats = {
    physicalAttack: hero.stats.physicalAttack + HERO_VICTORY_GROWTH.physicalAttack,
    magicAttack: hero.stats.magicAttack + HERO_VICTORY_GROWTH.magicAttack,
    defense: hero.stats.defense + HERO_VICTORY_GROWTH.defense,
    maxHp: hero.stats.maxHp + HERO_VICTORY_GROWTH.maxHp,
    critRate: Math.min(hero.stats.critRate + HERO_VICTORY_GROWTH.critRate, 100),
  }
  return {
    stats: newStats,
    currentHp: hero.currentHp,
    isStunned: false,
  }
}

export function resetToInitialHero(): Hero {
  return createInitialHero()
}
