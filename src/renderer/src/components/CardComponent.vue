<template>
  <div
    class="card"
    :class="[`star-${card.star}`, `type-${card.type}`, { disabled: isDisabled, 'blocked-by-stun': isBlockedByStun }]"
    @click="!isDisabled && $emit('play', card)"
  >
    <!-- Header: type + rarity -->
    <div class="card-header">
      <span class="card-type-label">{{ typeName }}</span>
      <span class="card-stars">{{ '★'.repeat(card.star) }}</span>
    </div>

    <!-- Main value block -->
    <div v-if="card.type !== 'statBoost'" class="card-value">
      ×{{ card.coefficient.toFixed(1) }}
    </div>
    <div v-if="card.type === 'statBoost' && card.statBoost" class="card-value stat-value">
      {{ statLabel }} <span class="value-num">+{{ card.statBoost.value }}</span>
    </div>

    <!-- Element/detail block -->
    <div v-if="card.type === 'physical' || card.type === 'magic'" class="card-detail">
      {{ elementLabel }}
    </div>

    <!-- Estimate block (fixed min-height) -->
    <div class="card-estimate">
      <span v-if="estimate && estimate.type !== 'unavailable'" class="estimate-text">{{ estimate.text }}</span>
      <span v-else-if="isBlockedByStun" class="estimate-text blocked-text">眩晕中</span>
    </div>

    <!-- Action/state block (fixed height) -->
    <div class="card-action">
      <span v-if="isDisabled">不可用</span>
      <span v-else>出牌</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card, CardOutcomeEstimate } from '../game/types'

const props = defineProps<{ card: Card; disabled?: boolean; estimate?: CardOutcomeEstimate }>()
defineEmits<{ play: [card: Card] }>()

const typeNames: Record<string, string> = { physical: '物理', magic: '魔法', heal: '治疗', statBoost: '强化' }
const elementLabels: Record<string, string> = { fire: '火', thunder: '雷', water: '水' }
const statLabels: Record<string, string> = { physicalAttack: '物攻', magicAttack: '魔攻', defense: '防御', maxHp: '最大HP', critRate: '暴击率' }

const typeName = computed(() => typeNames[props.card.type] || '')
const elementLabel = computed(() => elementLabels[props.card.element ?? ''] || '')
const statLabel = computed(() => props.card.statBoost ? statLabels[props.card.statBoost.stat] : '')

const isBlockedByStun = computed(() =>
  (props.card.type === 'physical' || props.card.type === 'magic') &&
  props.estimate?.type === 'blocked'
)

const isDisabled = computed(() => props.disabled || isBlockedByStun.value)
</script>

<style lang="scss" scoped>
// Type accent colors
$color-physical: #e94560;
$color-magic: #5dade2;
$color-heal: #27ae60;
$color-statBoost: #f0c040;
$color-disabled: #6c7380;
$color-muted: #95a5a6;

.card {
  width: 160px;
  min-height: 200px;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.15s ease;
  background: #1a1a2e;
  border: 2px solid #333;
  position: relative;
  overflow: hidden;

  &:hover:not(.disabled) {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  &:active:not(.disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: $color-disabled;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  &.blocked-by-stun {
    border-color: $color-disabled;
  }

  // Type accent borders
  &.type-physical { border-left: 3px solid $color-physical; }
  &.type-magic { border-left: 3px solid $color-magic; }
  &.type-heal { border-left: 3px solid $color-heal; }
  &.type-statBoost { border-left: 3px solid $color-statBoost; }
}

.card-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: $color-muted;
  min-height: 18px;
}

.card-type-label {
  font-weight: 600;
  font-size: 13px;
}

.type-physical .card-type-label { color: $color-physical; }
.type-magic .card-type-label { color: $color-magic; }
.type-heal .card-type-label { color: $color-heal; }
.type-statBoost .card-type-label { color: $color-statBoost; }

.card-stars {
  font-size: 11px;
  color: #f0c040;
  letter-spacing: 1px;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #ecf0f1;
  line-height: 1;
  margin: 4px 0;
}

.stat-value {
  font-size: 16px;
  color: $color-muted;

  .value-num {
    color: $color-statBoost;
    font-weight: bold;
    font-size: 20px;
  }
}

.card-detail {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: $color-muted;
}

.card-estimate {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 4px 0;
}

.estimate-text {
  font-size: 11px;
  color: #bdc3c7;
  text-align: center;
  line-height: 1.3;
  word-break: break-word;
}

.blocked-text {
  color: $color-muted;
  font-style: italic;
}

.card-action {
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 3px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(233, 69, 96, 0.15);
  color: $color-physical;
  margin-top: auto;

  .disabled & {
    background: rgba(108, 115, 128, 0.15);
    color: $color-disabled;
  }
}

// Responsive minimum width
@media (max-width: 768px) {
  .card {
    width: 148px;
    min-height: 190px;
  }
}
</style>
