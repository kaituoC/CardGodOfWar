<template>
  <div class="card-hand">
    <div v-if="isStunned" class="stun-message">眩晕中！无法使用卡牌！</div>
    <CardComponent v-for="card in cards" :key="card.id" :card="card" @play="$emit('play-card', $event)" />
  </div>
</template>

<script setup lang="ts">
import type { Card } from '../game/types'
import CardComponent from './CardComponent.vue'

defineProps<{ cards: Card[]; isStunned?: boolean }>()
defineEmits<{ 'play-card': [card: Card] }>()
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
</style>
