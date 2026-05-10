<template>
  <div class="main-menu">
    <h1 class="title">卡牌战神</h1>
    <p class="subtitle">Card God Of War</p>

    <div class="buttons">
      <button class="btn primary" @click="gameStore.startNewGame()">新游戏</button>
      <button v-if="hasAutoSave" class="btn secondary" @click="loadAutoSave()">继续游戏</button>
    </div>

    <div class="save-slots">
      <h3>手动存档</h3>
      <div
        v-for="i in 3"
        :key="i"
        class="save-slot"
        @click="loadManualSave(i)"
      >
        <span v-if="gameStore.manualSaves[i - 1]">
          存档{{ i }}: Lv.{{ gameStore.manualSaves[i - 1]!.level }}
        </span>
        <span v-else>存档{{ i }}: 空</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGameStore } from '../stores/game-store'

const gameStore = useGameStore()
const hasAutoSave = ref(false)

onMounted(async () => {
  hasAutoSave.value = await gameStore.hasAutoSave()
  await gameStore.loadManualSaves()
})

async function loadAutoSave() {
  await gameStore.loadAutoSave()
}

async function loadManualSave(slot: number) {
  await gameStore.loadManualSave(slot)
}
</script>

<style lang="scss" scoped>
.main-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 24px;
}

.title {
  font-size: 48px;
  color: #e94560;
  text-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
}

.subtitle {
  font-size: 18px;
  color: #95a5a6;
  margin-top: -16px;
}

.buttons {
  display: flex;
  gap: 16px;
  margin: 24px 0;
}

.save-slots {
  width: 400px;
  border-top: 1px solid #2c3e50;
  padding-top: 16px;

  h3 {
    margin-bottom: 12px;
    color: #95a5a6;
  }
}

.save-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin: 4px 0;
  background: #16213e;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #1a2a4a;
  }
}
</style>
