<template>
  <div class="battle-log">
    <h3 class="log-title">战斗记录</h3>
    <div class="log-entries" ref="entriesRef">
      <div
        v-for="(entry, i) in logs"
        :key="i"
        class="log-entry"
        :class="[entry.isHeroAction ? 'hero' : 'monster', entry.kind ? `kind-${entry.kind}` : '']"
      >
        <span class="turn-badge">T{{ entry.turn }}</span>
        <span v-if="kindIcons[entry.kind ?? '']" class="kind-icon">{{ kindIcons[entry.kind ?? ''] }}</span>
        {{ entry.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { BattleLogEntry } from '../game/types'

const props = defineProps<{ logs: BattleLogEntry[] }>()
const entriesRef = ref<HTMLElement | null>(null)

// 事件类型 → 图标，便于在长日志中快速定位遗物/护盾/状态等关键条目
const kindIcons: Record<string, string> = {
  relic: '🔮',
  shield: '🛡',
  status: '✦',
  reward: '🎁',
  heal: '💚',
  skill: '⚡',
}

watch(() => props.logs.length, async () => {
  await nextTick()
  if (entriesRef.value) {
    entriesRef.value.scrollTop = entriesRef.value.scrollHeight
  }
})
</script>

<style lang="scss" scoped>
.battle-log {
  flex: 1;
  background: #0a0a1a;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-title {
  font-size: 13px;
  color: #95a5a6;
  margin-bottom: 8px;
}

.log-entries {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.5;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #2c3e50; border-radius: 2px; }
}

.log-entry {
  padding: 4px 8px;
  border-radius: 4px;
  margin: 2px 0;
  &.hero { background: rgba(39, 174, 96, 0.1); }
  &.monster { background: rgba(192, 57, 43, 0.1); }

  // 关键事件的左侧 accent，便于在普通攻击/治疗流水中快速识别
  &.kind-relic { border-left: 3px solid #b084cc; }
  &.kind-shield { border-left: 3px solid #5dade2; }
  &.kind-status { border-left: 3px solid #f0c040; }
  &.kind-reward { border-left: 3px solid #27ae60; }
  &.kind-skill { border-left: 3px solid #e67e22; }
}

.turn-badge {
  background: #2c3e50;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  margin-right: 6px;
}

.kind-icon {
  margin-right: 4px;
  font-size: 11px;
}
</style>
