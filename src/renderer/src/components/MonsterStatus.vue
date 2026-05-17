<template>
  <div class="monster-status">
    <div class="name monster-title">
      {{ monster.isBoss ? 'Boss' : '怪兽' }}
      <span :class="`element-${monster.element}`">{{ elementLabel }}</span>
    </div>
    <div class="hp-bar">
      <div class="hp-fill" :class="{ boss: monster.isBoss }" :style="{ width: hpPercent + '%' }"></div>
      <span class="hp-text">{{ monster.currentHp }} / {{ monster.stats.maxHp }}</span>
    </div>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-icon">⚔️</span>
        <span class="stat-label">物攻</span>
        <span class="stat-val">{{ monster.stats.physicalAttack }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">✨</span>
        <span class="stat-label">魔攻</span>
        <span class="stat-val">{{ monster.stats.magicAttack }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🛡️</span>
        <span class="stat-label">防御</span>
        <span class="stat-val">{{ monster.stats.defense }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon"></span>
        <span class="stat-label">元素</span>
        <span :class="`element-tag ${monster.element}`">{{ elementLabel }}</span>
        <span class="element-hint">(<span :class="`element-${advantageElement}`">{{ advantageLabel }}</span>克之)</span>
      </div>
    </div>
    <div class="skill-tags">
      <span v-for="(label, i) in skillLabels" :key="i" class="skill-tag">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Monster } from '../game/types'

const props = defineProps<{ monster: Monster }>()
const hpPercent = computed(() => Math.round(props.monster.currentHp / props.monster.stats.maxHp * 100))

const elementLabels: Record<string, string> = { fire: '火', thunder: '雷', water: '水' }
const skillLabelsMap: Record<string, string> = {
  shield: '护盾', lifesteal: '吸血', critBoost: '暴击强化',
  elementImmune: '元素免疫', stun: '眩晕',
}
const advantageMap: Record<string, string> = { fire: 'water', thunder: 'fire', water: 'thunder' }

const elementLabel = computed(() => elementLabels[props.monster.element])
const advantageElement = computed(() => advantageMap[props.monster.element])
const advantageLabel = computed(() => elementLabels[advantageElement.value])

const skillLabels = computed(() =>
  props.monster.skills.map(s =>
    skillLabelsMap[s.type] + (s.immuneElement ? `(${elementLabels[s.immuneElement]})` : '')
  )
)
</script>

<style lang="scss" scoped>
.monster-status {
  flex: 1;
  background: #16213e;
  border-radius: 6px;
  padding: 8px 12px;
}

.name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  text-align: center;
}

.monster-title {
  color: #e74c3c;
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
  background: linear-gradient(90deg, #c0392b, #e74c3c);
  transition: width 0.3s;

  &.boss {
    background: linear-gradient(90deg, #8e44ad, #9b59b6);
  }
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

.element-tag {
  font-weight: 700;
  font-size: 13px;
}

.element-hint {
  font-size: 12px;
  color: #95a5a6;
}

.element-fire { color: #e74c3c; }
.element-thunder { color: #f39c12; }
.element-water { color: #3498db; }

.skill-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.skill-tag {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 4px;
  background: rgba(240, 192, 64, 0.15);
  color: #f0c040;
  border: 1px solid rgba(240, 192, 64, 0.3);
}
</style>
