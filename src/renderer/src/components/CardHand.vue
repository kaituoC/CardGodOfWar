<template>
  <div class="card-hand">
    <div v-if="isStunned" class="stun-message">眩晕中！无法使用攻击卡牌！</div>
    <CardComponent
      v-for="card in cards"
      :key="card.id"
      :card="card"
      :disabled="isStunned && (card.type === 'physical' || card.type === 'magic')"
      @play="$emit('play-card', $event)"
    />
    <button
      v-if="isStunned && hasOnlyAttackCards"
      class="skip-turn-btn"
      @click="$emit('skip-turn')"
    >
      跳过回合
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '../game/types'
import CardComponent from './CardComponent.vue'

const props = defineProps<{ cards: Card[]; isStunned?: boolean }>()
defineEmits<{ 'play-card': [card: Card]; 'skip-turn': [] }>()

const hasOnlyAttackCards = computed(() =>
  props.cards.every(c => c.type === 'physical' || c.type === 'magic')
)
</script>

<style lang="scss" scoped>
.card-hand {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 12px;
  flex-wrap: nowrap;
  min-height: 200px;
  align-items: center;
}

.stun-message {
  color: #f39c12;
  font-size: 18px;
  font-weight: bold;
  padding: 24px;
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

  &:hover {
    background: rgba(243, 156, 18, 0.3);
  }
}
</style>
