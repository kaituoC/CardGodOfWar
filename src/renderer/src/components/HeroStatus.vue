<template>
  <div class="hero-status">
    <div class="name hero-title">英雄</div>
    <div class="hp-bar">
      <div class="hp-fill" :style="{ width: hpPercent + '%' }"></div>
      <span class="hp-text">{{ hero.currentHp }} / {{ hero.stats.maxHp }}</span>
    </div>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-icon">⚔️</span>
        <span class="stat-label">物攻</span>
        <span class="stat-val">{{ hero.stats.physicalAttack }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">✨</span>
        <span class="stat-label">魔攻</span>
        <span class="stat-val">{{ hero.stats.magicAttack }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🛡️</span>
        <span class="stat-label">防御</span>
        <span class="stat-val">{{ hero.stats.defense }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon"></span>
        <span class="stat-label">暴击</span>
        <span class="stat-val">{{ hero.stats.critRate }}%</span>
      </div>
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

.name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  text-align: center;
}

.hero-title {
  color: #2ecc71;
}

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

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
  margin-top: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #95a5a6;
}

.stat-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.stat-label {
  flex: 1;
  min-width: 2em;
}

.stat-val {
  color: #ecf0f1;
  font-weight: 600;
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

