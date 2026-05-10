<template>
  <div class="battle-container">
    <StatusBar
      :level="gameStore.level"
      :current-turn="gameStore.currentTurn"
      :max-turns="20"
      :is-boss="battleState.monster.isBoss"
      :is-enraged="battleState.isEnraged"
      :monster-element="battleState.monster.element"
    />

    <div class="status-row">
      <HeroStatus :hero="battleState.hero" :class="{ 'damage-flash': heroFlash }" />
      <MonsterStatus :monster="battleState.monster" :class="{ 'damage-flash': monsterFlash }" />
    </div>

    <div class="battle-content">
      <div class="left-panel">
        <CardHand
          :cards="battleState.cards"
          :is-stunned="battleState.hero.isStunned"
          @play-card="gameStore.playCardAction"
        />
        <div class="battle-actions">
          <button class="btn secondary small" @click="showSaveDialog = true">保存</button>
          <button class="btn secondary small" @click="confirmBackToMenu">回主菜单</button>
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
import DamageNumbers, { pushDamageNumber } from '../components/DamageNumbers.vue'
import { useGameStore } from '../stores/game-store'

const gameStore = useGameStore()
const showSaveDialog = ref(false)

const battleState = computed(() => gameStore.currentBattle!)

// Damage number overlays
const damageNumbers = ref<Array<{ id: number; type: string; value: string; text?: string; x: number; y: number }>>([])

// Flash effects
const heroFlash = ref(false)
const monsterFlash = ref(false)
const isEnragedFlash = ref(false)

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

// Watch for new log entries to spawn floating numbers
let lastLogCount = 0
watch(() => battleState.value?.logs?.length, (newCount) => {
  if (!battleState.value || !newCount) return
  const newLogs = battleState.value.logs.slice(lastLogCount)
  lastLogCount = newCount

  for (const log of newLogs) {
    const msg = log.message
    // Parse damage numbers from log messages
    const damageMatch = msg.match(/(\d+)伤害/)
    const healMatch = msg.match(/恢复\s*(\d+)\s*HP/)
    const critMatch = msg.includes('暴击')
    const elementMatch = msg.match(/(火|雷|水)(克制|被克)/)

    if (log.isHeroAction) {
      if (healMatch) {
        pushDamageNumber('heal', '+' + healMatch[1], '', 300, 250)
      } else if (damageMatch) {
        const dmgX = 550
        pushDamageNumber(critMatch ? 'crit' : 'damage', damageMatch[1], critMatch ? '暴击！' : '', dmgX, 200)
        if (elementMatch) {
          pushDamageNumber('element', elementMatch[1], '', dmgX - 40, 170)
        }
        triggerFlash('monster')
      }
    } else {
      if (damageMatch) {
        pushDamageNumber('damage', damageMatch[1], critMatch ? '暴击！' : '', 200, 200)
        triggerFlash('hero')
      }
      // Boss enrage log
      if (msg.includes('狂暴')) {
        triggerFlash('enraged')
      }
    }
  }
})

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
  gap: 8px;
}

.battle-actions {
  display: flex;
  gap: 8px;
}

.small {
  padding: 6px 12px;
  font-size: 13px;
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
