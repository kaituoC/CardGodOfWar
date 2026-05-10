<template>
  <div class="hero-status">
    <div class="name">英雄</div>
    <div class="hp-bar">
      <div class="hp-fill" :style="{ width: hpPercent + '%' }"></div>
      <span class="hp-text">{{ hero.currentHp }} / {{ hero.stats.maxHp }}</span>
    </div>
    <div class="stats">
      <span>物攻: {{ hero.stats.physicalAttack }}</span>
      <span>魔攻: {{ hero.stats.magicAttack }}</span>
      <span>防御: {{ hero.stats.defense }}</span>
      <span>暴击: {{ hero.stats.critRate }}%</span>
    </div>
    <div v-if="hero.isStunned" class="stun-badge">眩晕</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Hero } from '../game/types'

const props = defineProps<{ hero: Hero }>()
const hpPercent = computed(() => Math.round(props.hero.currentHp / props.hero.stats.maxHp * 100))
</script>

<style lang="scss" scoped>
.hero-status {
  flex: 1;
  background: #16213e;
  border-radius: 6px;
  padding: 8px 12px;
  position: relative;
}

.name { font-weight: bold; margin-bottom: 4px; }

.hp-bar {
  height: 20px;
  background: #0a0a1a;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60, #2ecc71);
  transition: width 0.3s;
}

.hp-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.stats {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: #95a5a6;
}

.stun-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #f39c12;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}
</style>
