import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Hero, BattleState, Card, SaveData, BattleLogEntry } from '@/game/types'
import { createInitialHero, createBattle, playCard, applyVictoryGrowth, resetToInitialHero, skipTurn } from '@/game/game-engine'

function clonePlain<T>(value: T): T {
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
  }
  const monster = {
    ...battle.monster,
    stats: { ...battle.monster.stats },
    skills: battle.monster.skills.map(skill => ({ ...skill })),
  }
  const logs: BattleLogEntry[] = battle.logs ?? []

  return {
    ...battle,
    level: battle.level ?? level,
    hero,
    monster,
    cards: battle.cards ?? [],
    logs,
    phase,
    result,
    statusEffects: battle.statusEffects ?? (hero.isStunned ? [{ target: 'hero', type: 'stun' }] : []),
    events: battle.events ?? [],
    isPlayerTurn: phase === 'playerAction' && !gameOver,
    gameOver,
    winner: result?.winner ?? battle.winner ?? null,
  }
}

export const useGameStore = defineStore('game', () => {
  const level = ref(1)
  const hero = ref<Hero>(createInitialHero())
  const currentBattle = ref<BattleState | null>(null)
  const view = ref<'menu' | 'battle'>('menu')
  const manualSaves = ref<(SaveData | null)[]>([null, null, null])

  const currentTurn = computed(() => currentBattle.value?.currentTurn ?? 0)

  function startNewGame() {
    level.value = 1
    hero.value = createInitialHero()
    startBattle()
  }

  function startBattle() {
    currentBattle.value = createBattle(level.value, hero.value)
    view.value = 'battle'
    autoSave()
  }

  function playCardAction(card: Card) {
    if (!currentBattle.value || currentBattle.value.gameOver) return
    const result = playCard(currentBattle.value, card)
    currentBattle.value = result.newState

    autoSave()
  }

  function skipTurnAction() {
    if (!currentBattle.value || currentBattle.value.gameOver) return
    currentBattle.value = skipTurn(currentBattle.value)
    autoSave()
  }

  function nextLevel() {
    hero.value = applyVictoryGrowth(currentBattle.value!.hero)
    level.value++
    startBattle()
  }

  function retryLevel() {
    // Restart the current level battle with current hero stats
    // Hero keeps current HP and attributes; monster is regenerated
    currentBattle.value = createBattle(level.value, hero.value)
    autoSave()
  }

  function backToStart() {
    level.value = 1
    hero.value = resetToInitialHero()
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
    }
    try {
      await window.electronAPI.saveGame('auto', data)
    } catch {
      // Auto-save failure is non-fatal — silently skip
    }
  }

  async function saveManual(slot: number): Promise<boolean> {
    if (!currentBattle.value) return false
    // 使用 JSON 序列化/反序列化剥离 Vue 响应式代理，避免 IPC 结构化克隆失败
    const cleanHero = clonePlain(hero.value)
    const cleanBattle = clonePlain(currentBattle.value)
    const data: SaveData = {
      level: level.value,
      hero: cleanHero,
      battleState: cleanBattle,
      timestamp: Date.now(),
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
    startNewGame,
    playCardAction,
    skipTurnAction,
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
