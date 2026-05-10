<template>
  <div class="app-container">
    <MainMenuView v-if="gameStore.view === 'menu'" />
    <BattleView v-else-if="gameStore.currentBattle" />
    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from './stores/game-store'
import MainMenuView from './views/MainMenuView.vue'
import BattleView from './views/BattleView.vue'

const gameStore = useGameStore()
</script>

<style lang="scss">
@import './styles/global.scss';
</style>
