<template>
  <div class="damage-numbers">
    <div
      v-for="num in numbers"
      :key="num.id"
      class="damage-number"
      :class="num.type"
      :style="{ left: num.x + 'px', top: num.y + 'px' }"
    >
      <span v-if="num.text">{{ num.text }}</span>
      <span class="value">{{ num.value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FloatingNumber } from '../game/floating-numbers'

const numbers = defineModel<FloatingNumber[]>('modelValue', { required: true })
</script>

<style lang="scss" scoped>
.damage-numbers {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}

.damage-number {
  position: absolute;
  font-weight: bold;
  font-size: 24px;
  animation: float-up 0.8s ease-out forwards;

  &.damage {
    color: #e94560;
    text-shadow: 0 0 6px rgba(233, 69, 96, 0.8);
  }

  &.heal {
    color: #27ae60;
    text-shadow: 0 0 6px rgba(39, 174, 96, 0.8);
  }

  &.crit {
    color: #f0c040;
    font-size: 32px;
    animation: float-up 0.8s ease-out forwards, crit-burst 0.4s ease;
  }

  &.element {
    color: #3498db;
    font-size: 18px;
    animation: float-up 0.8s ease-out forwards;
  }

  .value { font-size: inherit; }
}

@keyframes float-up {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-60px) scale(0.7); }
}

@keyframes crit-burst {
  0% { transform: scale(0.5); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
}
</style>
