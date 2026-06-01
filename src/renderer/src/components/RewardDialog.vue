<template>
  <div class="reward-overlay" @click.self="noop">
    <div class="reward-dialog">
      <h2 class="dialog-title">选择奖励</h2>
      <p class="dialog-subtitle">选择一项永久奖励</p>
      <div class="reward-choices">
        <div
          v-for="reward in rewards"
          :key="reward.id"
          class="reward-card"
          :class="reward.type"
          @click="selectReward(reward)"
        >
          <div class="reward-icon">{{ rewardIcon(reward) }}</div>
          <div class="reward-label">{{ reward.label }}</div>
          <div class="reward-description">{{ reward.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reward } from '@/game/types'

defineProps<{
  rewards: Reward[]
}>()

const emit = defineEmits<{
  select: [reward: Reward]
}>()

function noop() {}

function selectReward(reward: Reward) {
  emit('select', reward)
}

function rewardIcon(reward: Reward): string {
  if (reward.type === 'attribute') return '⚔'
  if (reward.type === 'relic') return '🏆'
  if (reward.type === 'cardBias') return '🎯'
  return '?'
}
</script>

<style lang="scss" scoped>
.reward-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.reward-dialog {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 32px;
  max-width: 700px;
  width: 90%;
  text-align: center;
}

.dialog-title {
  color: #e94560;
  font-size: 28px;
  margin: 0 0 4px;
}

.dialog-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin: 0 0 24px;
}

.reward-choices {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.reward-card {
  flex: 1;
  min-width: 160px;
  max-width: 200px;
  padding: 20px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  &.attribute {
    border-color: rgba(233, 69, 96, 0.4);
    &:hover { border-color: rgba(233, 69, 96, 0.8); }
  }

  &.relic {
    border-color: rgba(255, 215, 0, 0.4);
    &:hover { border-color: rgba(255, 215, 0, 0.8); }
  }

  &.cardBias {
    border-color: rgba(52, 152, 219, 0.4);
    &:hover { border-color: rgba(52, 152, 219, 0.8); }
  }
}

.reward-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.reward-label {
  color: #ecf0f1;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.reward-description {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}
</style>
