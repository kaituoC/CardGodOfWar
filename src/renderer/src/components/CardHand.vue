<template>
  <div class="card-hand">
    <CardComponent
      v-for="card in cards"
      :key="card.id"
      :card="card"
      :estimate="estimates[card.id]"
      :disabled="isCardDisabled(card)"
      @play="$emit('play-card', $event)"
    />
    <button
      v-if="showSkipButton"
      class="skip-turn-btn"
      @click="$emit('skip-turn')"
    >
      跳过回合
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card, BattleState, CardOutcomeEstimate } from '../game/types'
import { estimateCardOutcome } from '../game/monster-intent'
import CardComponent from './CardComponent.vue'

const props = defineProps<{ cards: Card[]; isStunned?: boolean; battleState: BattleState }>()
defineEmits<{ 'play-card': [card: Card]; 'skip-turn': [] }>()

const isCardDisabled = (card: Card) =>
  props.isStunned && (card.type === 'physical' || card.type === 'magic' || card.type === 'tactical')

const hasAnyUsableCard = computed(() =>
  props.cards.some(c => !isCardDisabled(c))
)

const showSkipButton = computed(() =>
  props.isStunned && !hasAnyUsableCard.value
)

const estimates = computed<Record<string, CardOutcomeEstimate>>(() => {
  const result: Record<string, CardOutcomeEstimate> = {}
  for (const card of props.cards) {
    result[card.id] = estimateCardOutcome(props.battleState, card)
  }
  return result
})
</script>

<style lang="scss" scoped>
.card-hand {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 16px 12px;
  flex-wrap: wrap;
  align-items: flex-start;
  min-height: 220px;
}

.skip-turn-btn {
  padding: 10px 24px;
  border: 2px solid #f39c12;
  border-radius: 8px;
  background: rgba(243, 156, 18, 0.15);
  color: #f39c12;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  align-self: center;

  &:hover {
    background: rgba(243, 156, 18, 0.3);
  }
}

@media (max-width: 768px) {
  .card-hand {
    gap: 10px;
    padding: 12px 8px;
  }
}
</style>
