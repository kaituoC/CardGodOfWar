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

    <!-- Element/detail block (always rendered to keep card height stable) -->
    <div class="card-detail" :class="{ empty: !detailLabel }">
      {{ detailLabel || '·' }}
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
import { ELEMENT_LABELS, STAT_LABELS } from '../game/constants'

const props = defineProps<{ card: Card; disabled?: boolean; estimate?: CardOutcomeEstimate }>()
defineEmits<{ play: [card: Card] }>()

const typeNames: Record<string, string> = { physical: '物理', magic: '魔法', heal: '治疗', statBoost: '强化', guard: '防御', tactical: '战术' }

const effectLabels: Record<string, string> = { armorBreak: '破甲', suppress: '压制' }

const typeName = computed(() => typeNames[props.card.type] || '')
const elementLabel = computed(() => (props.card.element ? ELEMENT_LABELS[props.card.element] : '') || '')
const statLabel = computed(() => props.card.statBoost ? STAT_LABELS[props.card.statBoost.stat] : '')

// 固定 detail 区的语义标签：攻击卡显示元素，战术卡显示破甲/压制，防御卡显示护盾
const detailLabel = computed(() => {
  const card = props.card
  if (card.type === 'physical' || card.type === 'magic') return elementLabel.value
  if (card.type === 'tactical') return effectLabels[card.effect ?? ''] || '战术'
  if (card.type === 'guard') return '护盾'
  return ''
})

const isBlockedByStun = computed(() =>
  (props.card.type === 'physical' || props.card.type === 'magic' || props.card.type === 'tactical') &&
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
$color-guard: #8e9aaf;
$color-tactical: #b084cc;
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
  &.type-guard { border-left: 3px solid $color-guard; }
  &.type-tactical { border-left: 3px solid $color-tactical; }
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
.type-guard .card-type-label { color: $color-guard; }
.type-tactical .card-type-label { color: $color-tactical; }

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

  // 空占位：保持卡片高度恒定但不可见
  &.empty {
    visibility: hidden;
  }
}

// 战术/防御卡的 detail 标签采用类型 accent，强化"破甲/压制/护盾"辨识度
.type-tactical .card-detail:not(.empty) {
  background: rgba(176, 132, 204, 0.18);
  color: $color-tactical;
  font-weight: 600;
}
.type-guard .card-detail:not(.empty) {
  background: rgba(142, 154, 175, 0.18);
  color: $color-guard;
  font-weight: 600;
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
  margin-top: auto;

  .type-physical & { background: rgba(233, 69, 96, 0.15); color: $color-physical; }
  .type-magic & { background: rgba(93, 174, 226, 0.15); color: $color-magic; }
  .type-heal & { background: rgba(39, 174, 96, 0.15); color: $color-heal; }
  .type-statBoost & { background: rgba(240, 192, 64, 0.15); color: $color-statBoost; }
  .type-guard & { background: rgba(142, 154, 175, 0.15); color: $color-guard; }
  .type-tactical & { background: rgba(176, 132, 204, 0.15); color: $color-tactical; }

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
