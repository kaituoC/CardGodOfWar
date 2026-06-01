import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Hero, BattleState, Card, SaveData, BattleLogEntry, MonsterIntent, Reward, CardBiasState } from '@/game/types'
import { normalizeRelics, normalizeCardBias } from '@/game/types'
import { createInitialHero, createBattle, playCard, applyVictoryGrowth, resetToInitialHero, skipTurn } from '@/game/game-engine'
import { generateMonsterIntent } from '@/game/monster-intent'
import { generateRewards } from '@/game/reward-generator'
import { DEFAULT_CARD_BIAS } from '@/game/constants'
import { resolveBattleStartRecovery } from '@/game/relic-effects'

function clonePlain<T>(value: T): T {
  // null/undefined 直接返回：JSON.parse(JSON.stringify(undefined)) 会抛 SyntaxError，
  // 而 pendingRewards 等可选字段在新建战斗时为 undefined。
  if (value === undefined || value === null) return value
  return JSON.parse(JSON.stringify(value))
}

function normalizeBattleState(battle: BattleState, level: number): BattleState {
  const result = battle.result ?? (battle.winner
    ? { winner: battle.winner, reason: 'defeat' as const }
    : null)
  const gameOver = battle.gameOver ?? Boolean(result)
  const phase = battle.phase ?? (gameOver ? 'gameOver' : 'playerAction')
  const hero = {
    ...battle.hero,
    stats: { ...battle.hero.stats },
    isStunned: Boolean(battle.hero.isStunned),
    relics: Array.isArray(battle.hero.relics) ? [...battle.hero.relics] : [],
  }
  const monster = {
    ...battle.monster,
    stats: { ...battle.monster.stats },
    skills: battle.monster.skills.map(skill => ({ ...skill })),
  }
  const logs: BattleLogEntry[] = battle.logs ?? []
  const statusEffects = battle.statusEffects ?? (hero.isStunned ? [{ target: 'hero', type: 'stun' }] : [])

  // Generate missing monsterIntent for active non-game-over battles
  let monsterIntent: MonsterIntent | null
  if (battle.monsterIntent) {
    monsterIntent = battle.monsterIntent
  } else if (!gameOver && hero && monster && battle.currentTurn) {
    const normalizedPhase = 'playerAction'
    const isEnraged = monster.isBoss && battle.currentTurn > 15
    monsterIntent = generateMonsterIntent({
      level: battle.level ?? level,
      hero,
      monster,
      currentTurn: battle.currentTurn,
      maxTurns: battle.maxTurns ?? 20,
      isEnraged,
      source: 'restored',
    })
    return {
      ...battle,
      level: battle.level ?? level,
      hero,
      monster,
      cards: battle.cards ?? [],
      logs,
      phase: normalizedPhase,
      result,
      statusEffects,
      events: battle.events ?? [],
      isPlayerTurn: normalizedPhase === 'playerAction' && !gameOver,
      gameOver,
      winner: result?.winner ?? battle.winner ?? null,
      monsterIntent,
      pendingRewards: battle.pendingRewards ?? null,
      nextTurnRelicModifiers: battle.nextTurnRelicModifiers ?? [],
    }
  } else {
    monsterIntent = null
  }

  return {
    ...battle,
    level: battle.level ?? level,
    hero,
    monster,
    cards: battle.cards ?? [],
    logs,
    phase,
    result,
    statusEffects,
    events: battle.events ?? [],
    isPlayerTurn: phase === 'playerAction' && !gameOver,
    gameOver,
    winner: result?.winner ?? battle.winner ?? null,
    monsterIntent,
    pendingRewards: battle.pendingRewards ?? null,
    nextTurnRelicModifiers: battle.nextTurnRelicModifiers ?? [],
  }
}

export const useGameStore = defineStore('game', () => {
  const level = ref(1)
  const hero = ref<Hero>(createInitialHero())
  const currentBattle = ref<BattleState | null>(null)
  const view = ref<'menu' | 'battle'>('menu')
  const manualSaves = ref<(SaveData | null)[]>([null, null, null])
  const cardBias = ref<CardBiasState>({ ...DEFAULT_CARD_BIAS })

  const currentTurn = computed(() => currentBattle.value?.currentTurn ?? 0)
  const pendingRewards = computed(() => currentBattle.value?.pendingRewards ?? null)
  const isRewardSelection = computed(() => currentBattle.value?.phase === 'rewardSelection')

  function startNewGame() {
    level.value = 1
    hero.value = createInitialHero()
    cardBias.value = { ...DEFAULT_CARD_BIAS }
    startBattle()
  }

  function startBattle() {
    // Apply battle-start relics (e.g. regrowth-seed)
    let battleHero = { ...hero.value, stats: { ...hero.value.stats }, currentHp: hero.value.currentHp }
    const startRecovery = resolveBattleStartRecovery(hero.value.relics)
    if (startRecovery > 0) {
      battleHero.currentHp = Math.min(battleHero.currentHp + startRecovery, battleHero.stats.maxHp)
    }

    currentBattle.value = createBattle(level.value, battleHero)
    view.value = 'battle'
    autoSave()
  }

  function playCardAction(card: Card) {
    if (!currentBattle.value || currentBattle.value.gameOver) return
    if (currentBattle.value.phase === 'rewardSelection') return
    const result = playCard(currentBattle.value, card)
    currentBattle.value = result.newState

    // Check for victory → create reward choices
    if (currentBattle.value.gameOver && currentBattle.value.winner === 'hero') {
      const rewards = generateRewards(hero.value, cardBias.value)
      currentBattle.value = {
        ...currentBattle.value,
        phase: 'rewardSelection',
        pendingRewards: { rewards },
      }
    }

    autoSave()
  }

  function skipTurnAction() {
    if (!currentBattle.value || currentBattle.value.gameOver) return
    if (currentBattle.value.phase === 'rewardSelection') return
    currentBattle.value = skipTurn(currentBattle.value)
    autoSave()
  }

  function selectReward(reward: Reward) {
    if (!currentBattle.value || currentBattle.value.phase !== 'rewardSelection') return
    const pending = currentBattle.value.pendingRewards
    if (!pending || !pending.rewards.find(r => r.id === reward.id)) return

    // Apply the reward
    if (reward.type === 'attribute') {
      const stats = { ...hero.value.stats }
      if (reward.stat === 'critRate') {
        stats.critRate = Math.min(stats.critRate + reward.amount, 100)
      } else if (reward.stat === 'maxHp') {
        stats.maxHp += reward.amount
        hero.value.currentHp += reward.amount
      } else {
        (stats as Record<string, number>)[reward.stat] += reward.amount
      }
      hero.value.stats = stats
    } else if (reward.type === 'relic') {
      if (!hero.value.relics.includes(reward.relicId)) {
        hero.value.relics = [...hero.value.relics, reward.relicId]
      }
    } else if (reward.type === 'cardBias') {
      const bias = { ...cardBias.value }
      if (reward.biasCategory === 'type') {
        bias.typeWeights = { ...bias.typeWeights }
        const key = reward.biasKey as keyof typeof bias.typeWeights
        bias.typeWeights[key] = (bias.typeWeights[key] || 0) + 1
      } else if (reward.biasCategory === 'element') {
        bias.elementWeights = { ...bias.elementWeights }
        bias.elementWeights[reward.biasKey as keyof typeof bias.elementWeights] = (bias.elementWeights[reward.biasKey as keyof typeof bias.elementWeights] || 0) + 1
      } else if (reward.biasCategory === 'star') {
        bias.starWeights = { ...bias.starWeights }
        const starNum = parseInt(reward.biasKey) as 1 | 2 | 3
        bias.starWeights[starNum] = (bias.starWeights[starNum] || 0) + 1
      }
      cardBias.value = bias
    }

    // Clear pending rewards and advance
    currentBattle.value.pendingRewards = null
    currentBattle.value = {
      ...currentBattle.value,
      phase: 'playerAction',
    }

    // Auto-save after reward selection
    autoSave()
  }

  function nextLevel() {
    // Block if reward selection is pending
    if (currentBattle.value?.phase === 'rewardSelection') return
    hero.value = applyVictoryGrowth(currentBattle.value!.hero)
    level.value++
    startBattle()
  }

  function retryLevel() {
    // Clear any pending rewards on retry
    cardBias.value = { ...cardBias.value } // preserve bias
    currentBattle.value = createBattle(level.value, hero.value)
    autoSave()
  }

  function backToStart() {
    level.value = 1
    hero.value = resetToInitialHero()
    cardBias.value = { ...DEFAULT_CARD_BIAS }
    startBattle()
  }

  async function autoSave() {
    if (!currentBattle.value) return
    const cleanHero = clonePlain(hero.value)
    const cleanBattle = clonePlain(currentBattle.value)
    const data: SaveData = {
      level: level.value,
      hero: cleanHero,
      battleState: cleanBattle,
      timestamp: Date.now(),
      cardBias: clonePlain(cardBias.value),
      pendingRewards: clonePlain(currentBattle.value.pendingRewards),
    }
    try {
      await window.electronAPI.saveGame('auto', data)
    } catch {
      // Auto-save failure is non-fatal — silently skip
    }
  }

  async function saveManual(slot: number): Promise<boolean> {
    if (!currentBattle.value) return false
    const cleanHero = clonePlain(hero.value)
    const cleanBattle = clonePlain(currentBattle.value)
    const data: SaveData = {
      level: level.value,
      hero: cleanHero,
      battleState: cleanBattle,
      timestamp: Date.now(),
      cardBias: clonePlain(cardBias.value),
      pendingRewards: clonePlain(currentBattle.value.pendingRewards),
    }
    try {
      const result = await window.electronAPI.saveGame(slot, data)
      return result
    } catch {
      return false
    }
  }

  async function loadAutoSave() {
    const data = await window.electronAPI.loadGame('auto')
    if (data) restoreSave(data)
  }

  async function loadManualSave(slot: number) {
    const data = await window.electronAPI.loadGame(slot)
    if (data) restoreSave(data)
  }

  function restoreSave(data: SaveData) {
    level.value = data.level
    hero.value = clonePlain(data.hero)
    hero.value.relics = normalizeRelics(hero.value.relics)
    cardBias.value = normalizeCardBias(data.cardBias)
    if (data.battleState) {
      currentBattle.value = normalizeBattleState(clonePlain(data.battleState), data.level)
    } else {
      startBattle()
      return
    }
    view.value = 'battle'
  }

  async function hasAutoSave() {
    return await window.electronAPI.hasAutoSave()
  }

  async function loadManualSaves() {
    const saves = await window.electronAPI.listSaves()
    const result: (SaveData | null)[] = [null, null, null]
    for (const s of saves) {
      if (s.slot >= 1 && s.slot <= 3) {
        const data = await window.electronAPI.loadGame(s.slot)
        result[s.slot - 1] = data
      }
    }
    manualSaves.value = result
    return result
  }

  function goToMenu() {
    view.value = 'menu'
    currentBattle.value = null
  }

  return {
    level,
    hero,
    currentBattle,
    view,
    currentTurn,
    manualSaves,
    cardBias,
    pendingRewards,
    isRewardSelection,
    startNewGame,
    playCardAction,
    skipTurnAction,
    selectReward,
    nextLevel,
    retryLevel,
    backToStart,
    saveManual,
    loadAutoSave,
    loadManualSave,
    hasAutoSave,
    loadManualSaves,
    goToMenu,
  }
})
