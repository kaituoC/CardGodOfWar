<template>
  <div
    class="card"
    :class="[`star-${card.star}`, { disabled }]"
    @click="!disabled && $emit('play', card)"
  >
    <div class="card-stars">{{ '⭐'.repeat(card.star) }}</div>
    <div class="card-type">
      <span class="type-icon">{{ typeIcon }}</span>
      {{ typeName }}
    </div>
    <div v-if="card.type !== 'statBoost'" class="card-coefficient">
      × {{ card.coefficient.toFixed(1) }}
    </div>
    <div v-if="card.type === 'physical' || card.type === 'magic'" class="card-element">
      {{ elementLabel }}
    </div>
    <div v-if="card.type === 'statBoost' && card.statBoost" class="card-stat-boost">
      {{ statLabel }} +{{ card.statBoost.value }}
    </div>
    <!-- Estimate line -->
    <div v-if="estimate" class="card-estimate">{{ estimateText }}</div>
    <div class="card-action">{{ disabled ? '禁用' : '使用' }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card, CardOutcomeEstimate } from '../game/types'

const props = defineProps<{ card: Card; disabled?: boolean; estimate?: CardOutcomeEstimate }>()
defineEmits<{ play: [card: Card] }>()

const typeIcons: Record<string, string> = { physical: '⚔️', magic: '✨', heal: '💚', statBoost: '⬆️' }
const typeNames: Record<string, string> = { physical: '物理攻击', magic: '魔法攻击', heal: '生命恢复', statBoost: '属性提升' }
const elementLabels: Record<string, string> = { fire: '🔥火', thunder: '⚡雷', water: '💧水' }
const statLabels: Record<string, string> = { physicalAttack: '物攻', magicAttack: '魔攻', defense: '防御', maxHp: '最大HP', critRate: '暴击率' }

const typeIcon = computed(() => typeIcons[props.card.type] || '')
const typeName = computed(() => typeNames[props.card.type] || '')
const elementLabel = computed(() => elementLabels[props.card.element ?? ''] || '')
const statLabel = computed(() => props.card.statBoost ? statLabels[props.card.statBoost.stat] : '')

const estimateText = computed(() => {
  if (!props.estimate) return ''
  if (props.estimate.type === 'blocked') return props.estimate.text
  return props.estimate.text
})
</script>

<style lang="scss" scoped>
.card {
  width: 140px;
  min-height: 180px;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    filter: grayscale(0.5);

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  &.star-1 { background: #2a2a2a; border: 2px solid #a0a0a0; }
  &.star-2 { background: linear-gradient(135deg, #1a2a4a, #16213e); border: 2px solid #3498db; }
  &.star-3 { background: linear-gradient(135deg, #3a2a0a, #2a1a00); border: 2px solid #f0c040; }
}

.card-stars { font-size: 14px; }
.card-type { font-size: 14px; font-weight: bold; margin: 8px 0; }
.type-icon { margin-right: 4px; }

.card-coefficient {
  font-size: 28px;
  font-weight: bold;
  color: #e94560;
  margin: 8px 0;
}

.card-element {
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
}

.card-stat-boost {
  font-size: 14px;
  color: #27ae60;
  font-weight: bold;
}

.card-estimate {
  font-size: 12px;
  color: #bdc3c7;
  text-align: center;
  line-height: 1.4;
  white-space: pre-wrap;
}

.card-action {
  margin-top: 8px;
  padding: 4px 16px;
  background: #e94560;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
</style>
