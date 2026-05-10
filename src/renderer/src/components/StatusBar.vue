<template>
  <div class="status-bar" :class="{ enraged: isEnraged }">
    <span class="info">关卡: <strong>{{ level }}</strong></span>
    <span class="info">回合: <strong>{{ currentTurn }}/{{ maxTurns }}</strong></span>
    <span v-if="isBoss" class="boss-badge">
      {{ isEnraged ? '⚠️ Boss狂暴！' : 'Boss战' }}
    </span>
    <span v-if="monsterElement" class="info">
      怪兽元素: <span :class="`element-${monsterElement}`">{{ elementLabel }}</span>
      <span class="advantage-hint">({{ advantageHint }}克之)</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { Element } from '../game/types'

const props = defineProps<{
  level: number
  currentTurn: number
  maxTurns: number
  isBoss?: boolean
  isEnraged?: boolean
  monsterElement?: Element
}>()

const elementLabels: Record<Element, string> = { fire: '火', thunder: '雷', water: '水' }
const advantageMap: Record<Element, Element> = { fire: 'water', thunder: 'fire', water: 'thunder' }

const elementLabel = props.monsterElement ? elementLabels[props.monsterElement] : ''
const advantageHint = props.monsterElement ? elementLabels[advantageMap[props.monsterElement]] : ''
</script>

<style lang="scss" scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 16px;
  background: #16213e;
  border-radius: 6px;
  font-size: 14px;

  &.enraged {
    background: #3d0c0c;
    animation: pulse-red 1s infinite;
  }
}

.info { color: #95a5a6; }
.info strong { color: #ecf0f1; }

.boss-badge {
  background: #e94560;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.element-fire { color: #e74c3c; }
.element-thunder { color: #f39c12; }
.element-water { color: #3498db; }

.advantage-hint {
  font-size: 12px;
  color: #95a5a6;
}

@keyframes pulse-red {
  0%, 100% { background: #3d0c0c; }
  50% { background: #5a1515; }
}
</style>
