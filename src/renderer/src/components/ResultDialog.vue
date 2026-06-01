<template>
  <div class="dialog-overlay">
    <div class="dialog" :class="winner">
      <h2>{{ winner === 'hero' ? '胜利！' : '挑战失败' }}</h2>
      <p>{{ resultMessage }}</p>
      <div class="actions">
        <template v-if="winner === 'hero'">
          <button class="btn gold" @click="$emit('next-level')">下一关</button>
        </template>
        <template v-else>
          <button class="btn primary" @click="$emit('retry')">重新挑战</button>
          <button class="btn secondary" @click="$emit('back-to-start')">返回第一关</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ winner: 'hero' | 'monster' | null }>()
defineEmits<{
  'next-level': []
  retry: []
  'back-to-start': []
}>()

const resultMessage = computed(() =>
  props.winner === 'hero' ? '英雄成功通关！' : '英雄被击败了...'
)
</script>

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: #16213e;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  min-width: 350px;

  &.hero { border: 2px solid #27ae60; }
  &.monster { border: 2px solid #c0392b; }

  h2 { margin-bottom: 12px; }
  p { color: #95a5a6; margin-bottom: 20px; }
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
