<template>
  <div class="app-container">
    <MainMenuView v-if="\!gameStarted" @start-game="startGame" />
    <BattleView v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MainMenuView from './views/MainMenuView.vue'
import BattleView from './views/BattleView.vue'

const gameStarted = ref(false)

function startGame() {
  gameStarted.value = true
}
</script>

<style lang="scss">
@import './styles/global.scss';
</style>
