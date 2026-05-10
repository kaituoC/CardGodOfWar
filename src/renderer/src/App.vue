<template>
  <div class="app-container">
    <MainMenuView v-if="gameStore.view === 'menu'" />
    <BattleView v-else-if="gameStore.currentBattle" />
    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from './stores/game-store'
import MainMenuView from './views/MainMenuView.vue'
import BattleView from './views/BattleView.vue'

const gameStore = useGameStore()

onMounted(async () => {
  const hasSave = await gameStore.hasAutoSave()
  if (hasSave) {
    if (confirm('检测到未完成的进度，是否继续？')) {
      await gameStore.loadAutoSave()
    }
  }
})
</script>

<style lang="scss">
@import './styles/global.scss';
</style>
