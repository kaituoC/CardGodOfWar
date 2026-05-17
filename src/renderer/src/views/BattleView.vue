<template>
  <div class="battle-container">
    <StatusBar
      :level="gameStore.level"
      :current-turn="gameStore.currentTurn"
      :max-turns="20"
      :is-boss="battleState.monster.isBoss"
      :is-enraged="battleState.isEnraged"
    />

    <div class="status-row">
      <HeroStatus :hero="battleState.hero" :class="{ 'damage-flash': heroFlash }" />
      <MonsterStatus :monster="battleState.monster" :class="{ 'damage-flash': monsterFlash }" />
    </div>

    <div class="battle-content">
      <div class="left-panel">
        <div class="cards-wrapper">
          <CardHand
            :cards="battleState.cards"
            :is-stunned="battleState.hero.isStunned"
            @play-card="gameStore.playCardAction"
            @skip-turn="gameStore.skipTurnAction"
          />
        </div>
        <div class="battle-actions-bar">
          <button class="btn secondary" @click="showSaveDialog = true">保存</button>
          <button class="btn secondary" @click="confirmBackToMenu">回主菜单</button>
        </div>
      </div>
      <BattleLog :logs="battleState.logs" />
    </div>

    <SaveDialog
      v-if="showSaveDialog"
      @save="onSave"
      @cancel="showSaveDialog = false"
    />

    <ResultDialog
      v-if="battleState.gameOver"
      :winner="battleState.winner"
      @retry="gameStore.retryLevel()"
      @next-level="gameStore.nextLevel()"
      @back-to-start="gameStore.backToStart()"
    />

    <DamageNumbers v-model="damageNumbers" />
    <div v-if="isEnragedFlash" class="enraged-flash"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import StatusBar from '../components/StatusBar.vue'
import HeroStatus from '../components/HeroStatus.vue'
import MonsterStatus from '../components/MonsterStatus.vue'
import CardHand from '../components/CardHand.vue'
import BattleLog from '../components/BattleLog.vue'
import SaveDialog from '../components/SaveDialog.vue'
import ResultDialog from '../components/ResultDialog.vue'
import DamageNumbers from '../components/DamageNumbers.vue'
import { pushDamageNumber, type FloatingNumber } from '../game/floating-numbers'
import { useGameStore } from '../stores/game-store'
import type { BattleEvent } from '../game/types'

const gameStore = useGameStore()
const showSaveDialog = ref(false)

const battleState = computed(() => gameStore.currentBattle!)

// Damage number overlays
const damageNumbers = ref<FloatingNumber[]>([])

// Flash effects
const heroFlash = ref(false)
const monsterFlash = ref(false)
const isEnragedFlash = ref(false)
let lastEventCount = battleState.value?.events?.length ?? 0

function triggerFlash(target: 'hero' | 'monster' | 'enraged') {
  if (target === 'hero') {
    heroFlash.value = true
    setTimeout(() => { heroFlash.value = false }, 300)
  } else if (target === 'monster') {
    monsterFlash.value = true
    setTimeout(() => { monsterFlash.value = false }, 300)
  } else {
    isEnragedFlash.value = true
    setTimeout(() => { isEnragedFlash.value = false }, 500)
  }
}

// Watch structured battle events to spawn floating numbers and flashes.
watch(() => battleState.value?.events?.length, (newCount) => {
  if (!battleState.value) return
  if ((newCount ?? 0) < lastEventCount) lastEventCount = newCount ?? 0
  if (!newCount) return
  const newEvents = battleState.value.events.slice(lastEventCount)
  lastEventCount = newCount

  for (const event of newEvents) {
    handleBattleEvent(event)
  }
})

function handleBattleEvent(event: BattleEvent) {
  if (event.type === 'damage') {
    const targetX = event.target === 'monster' ? 550 : 200
    const targetY = 200
    pushDamageNumber(
      damageNumbers,
      event.isCrit ? 'crit' : 'damage',
      String(event.amount),
      event.isCrit ? '暴击！' : '',
      targetX,
      targetY,
    )
    if (event.element && (event.elementMultiplier !== 1 || event.isImmune)) {
      const label = event.isImmune ? '免疫' : event.elementMultiplier > 1 ? '克制' : '被克'
      pushDamageNumber(damageNumbers, 'element', label, '', targetX - 40, 170)
    }
    triggerFlash(event.target)
    if (event.enrageMultiplier > 1) triggerFlash('enraged')
  }

  if (event.type === 'heal' && event.amount > 0) {
    pushDamageNumber(
      damageNumbers,
      'heal',
      '+' + event.amount,
      '',
      event.target === 'hero' ? 300 : 550,
      250,
    )
  }
}

async function onSave(slot: number) {
  const success = await gameStore.saveManual(slot)
  if (success) {
    showSaveDialog.value = false
  } else {
    alert('保存失败，请重试')
  }
}

function confirmBackToMenu() {
  if (confirm('返回主菜单？当前进度将丢失（自动存档除外）')) {
    gameStore.goToMenu()
  }
}
</script>

<style lang="scss" scoped>
.battle-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 8px;
  gap: 8px;
}

.status-row {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.battle-content {
  display: flex;
  flex: 1;
  gap: 8px;
  min-height: 0;
}

.left-panel {
  flex: 0 0 55%;
  display: flex;
  flex-direction: column;
  position: relative;
  align-self: stretch;
}

.cards-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  padding-bottom: 48px;
}

.battle-actions-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(22, 33, 62, 0.7);
  border-radius: 8px 8px 0 0;
}

.damage-flash {
  animation: damage-flash 0.3s ease;
}

.enraged-flash {
  position: fixed;
  inset: 0;
  background: rgba(233, 69, 96, 0.3);
  pointer-events: none;
  z-index: 60;
  animation: fade-out 0.5s ease-out forwards;
}

@keyframes damage-flash {
  0% { opacity: 1; filter: brightness(1); }
  50% { opacity: 0.6; filter: brightness(2) hue-rotate(20deg); }
  100% { opacity: 1; filter: brightness(1); }
}

@keyframes fade-out {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
