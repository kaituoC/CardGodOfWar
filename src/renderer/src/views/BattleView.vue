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
      <HeroStatus :hero="battleState.hero" />
      <MonsterStatus :monster="battleState.monster" />
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
          <button class="btn secondary small" @click="gameStore.goToMenu()">回主菜单</button>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import StatusBar from '../components/StatusBar.vue'
import HeroStatus from '../components/HeroStatus.vue'
import MonsterStatus from '../components/MonsterStatus.vue'
import CardHand from '../components/CardHand.vue'
import BattleLog from '../components/BattleLog.vue'
import SaveDialog from '../components/SaveDialog.vue'
import ResultDialog from '../components/ResultDialog.vue'
import { useGameStore } from '../stores/game-store'

const gameStore = useGameStore()
const showSaveDialog = ref(false)

const battleState = computed(() => gameStore.currentBattle!)

function onSave(slot: number) {
  gameStore.saveManual(slot)
  showSaveDialog.value = false
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
</style>
