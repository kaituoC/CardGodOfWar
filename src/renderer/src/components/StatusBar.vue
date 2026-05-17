<template>
  <div class="status-bar" :class="{ enraged: isEnraged }">
    <span class="info">关卡: <strong>{{ level }}</strong></span>
    <span class="info">回合: <strong>{{ currentTurn }}/{{ maxTurns }}</strong></span>
    <span v-if="isBoss" class="boss-badge">
      {{ isEnraged ? '⚠ Boss狂暴！' : 'Boss战' }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  level: number
  currentTurn: number
  maxTurns: number
  isBoss?: boolean
  isEnraged?: boolean
}>()
</script>

<style lang="scss" scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 12px 20px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 8px;
  font-size: 17px;
  border: 1px solid rgba(233, 69, 96, 0.2);

  &.enraged {
    background: #3d0c0c;
    animation: pulse-red 1s infinite;
  }
}

.info { color: #bdc3c7; font-size: 16px; }
.info strong {
  color: #e94560;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(233, 69, 96, 0.5);
}

.boss-badge {
  background: #e94560;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

@keyframes pulse-red {
  0%, 100% { background: #3d0c0c; }
  50% { background: #5a1515; }
}
</style>
