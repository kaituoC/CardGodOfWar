<template>
  <div class="monster-status">
    <div class="name">
      {{ monster.isBoss ? 'Boss' : '怪兽' }}
      <span :class="`element-${monster.element}`">{{ elementLabel }}</span>
    </div>
    <div class="hp-bar">
      <div class="hp-fill" :class="{ boss: monster.isBoss }" :style="{ width: hpPercent + '%' }"></div>
      <span class="hp-text">{{ monster.currentHp }} / {{ monster.stats.maxHp }}</span>
    </div>
    <div class="stats">
      <span>物攻: {{ monster.stats.physicalAttack }}</span>
      <span>魔攻: {{ monster.stats.magicAttack }}</span>
      <span>防御: {{ monster.stats.defense }}</span>
    </div>
    <div class="skills">技能: {{ skillLabels }}</div>
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

const elementLabel = computed(() => elementLabels[props.monster.element])
const skillLabels = computed(() =>
  props.monster.skills.map(s =>
    skillLabelsMap[s.type] + (s.immuneElement ? `(${elementLabels[s.immuneElement]})` : '')
  ).join(', ')
)
</script>

<style lang="scss" scoped>
.monster-status {
  flex: 1;
  background: #16213e;
  border-radius: 6px;
  padding: 8px 12px;
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

.stats {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: #95a5a6;
}

.skills {
  font-size: 11px;
  color: #f0c040;
  margin-top: 2px;
}

.element-fire { color: #e74c3c; }
.element-thunder { color: #f39c12; }
.element-water { color: #3498db; }
</style>
