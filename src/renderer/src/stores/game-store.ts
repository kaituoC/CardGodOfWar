import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Hero, BattleState, Card, SaveData } from '@/game/types'
import { createInitialHero, createBattle, playCard, applyVictoryGrowth, resetToInitialHero } from '@/game/game-engine'

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
    const data: SaveData = {
      level: level.value,
      hero: { ...hero.value },
      battleState: currentBattle.value,
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
    const data: SaveData = {
      level: level.value,
      hero: { ...hero.value },
      battleState: currentBattle.value,
      timestamp: Date.now(),
    }
    try {
      return await window.electronAPI.saveGame(slot, data)
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
    hero.value = data.hero
    if (data.battleState) {
      currentBattle.value = data.battleState
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
