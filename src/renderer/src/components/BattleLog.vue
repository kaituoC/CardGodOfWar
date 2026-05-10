<template>
  <div class="battle-log">
    <h3 class="log-title">战斗记录</h3>
    <div class="log-entries" ref="entriesRef">
      <div v-for="(entry, i) in logs" :key="i" class="log-entry" :class="entry.isHeroAction ? 'hero' : 'monster'">
        <span class="turn-badge">T{{ entry.turn }}</span>
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
}

.turn-badge {
  background: #2c3e50;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  margin-right: 6px;
}
</style>
