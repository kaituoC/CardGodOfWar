<template>
  <div class="monster-status">
    <div class="name monster-title">
      {{ monster.archetype?.name ?? (monster.isBoss ? 'Boss' : '怪兽') }}
      <span :class="`element-${monster.element}`">{{ elementLabel }}</span>
      <span v-if="monster.isBoss && monster.archetype?.id !== 'stoneGeneral'" class="boss-tag">Boss</span>
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
      <span v-for="(label, i) in monsterSkills" :key="i" class="skill-tag">{{ label }}</span>
    </div>
    <!-- Monster statuses -->
    <div class="status-badges">
      <span v-if="breakDefenseStatus" class="badge break-defense">破防({{ breakDefenseStatus.reductionPercent }}%/{{ breakDefenseStatus.remainingUses }}次)</span>
      <span v-if="weakStatus" class="badge weak">虚弱({{ weakStatus.multiplier }}×)</span>
      <span v-if="hasMonsterShield" class="badge shield">护盾</span>
    </div>
    <!-- Stone General shield pressure -->
    <div v-if="monster.archetype?.id === 'stoneGeneral'" class="shield-pressure">
      <span>盾压: 回合 {{ nextShieldTurn }} 触发</span>
    </div>
    <!-- Intent panel -->
    <div v-if="showIntent" class="intent-panel">
      <div class="intent-row">
        <span class="intent-label">怪兽行动:</span>
        <span class="intent-value">{{ intentAttackLabel }}</span>
        <span class="intent-damage">预计 {{ intent?.estimatedDamage }}</span>
        <span v-if="intent && intent.critRate > 0" class="intent-crit">
          | {{ critLabel }}{{ intent.critRate }}%→{{ intent.critDamage }}
        </span>
      </div>
      <div v-if="triggeredSkillLabels.length > 0" class="intent-skills">
        <span v-for="(label, i) in triggeredSkillLabels" :key="i" class="intent-skill-tag">{{ label }}</span>
      </div>
    </div>
    <!-- Boss pressure -->
    <div v-if="monster.isBoss" class="boss-pressure">
      <span v-if="!battleState.isEnraged" class="pressure-warn">
        狂暴倒计时: {{ enrageTurnsLeft }} 回合
      </span>
      <span v-else class="pressure-active">
        狂暴 ×{{ intentEnrageMultiplier.toFixed(1) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BattleState, Element } from '../game/types'
import { ELEMENT_LABELS, SKILL_LABELS } from '../game/constants'

const props = defineProps<{ monster: BattleState['monster']; battleState: BattleState }>()
const hpPercent = computed(() => Math.round(props.monster.currentHp / props.monster.stats.maxHp * 100))

// 谁克制当前怪兽元素（与 ELEMENT_ADVANTAGE 的"X 克 Y"方向相反）
const advantageMap: Record<Element, Element> = { fire: 'water', thunder: 'fire', water: 'thunder' }

const elementLabel = computed(() => ELEMENT_LABELS[props.monster.element])
const advantageElement = computed(() => advantageMap[props.monster.element])
const advantageLabel = computed(() => ELEMENT_LABELS[advantageElement.value])

const monsterSkills = computed(() =>
  props.monster.skills.map(s =>
    SKILL_LABELS[s.type] + (s.immuneElement ? `(${ELEMENT_LABELS[s.immuneElement]})` : '')
  )
)

// Intent display
const showIntent = computed(() =>
  props.battleState.phase === 'playerAction' && !props.battleState.gameOver && props.battleState.monsterIntent
)

const intent = computed(() => props.battleState.monsterIntent)

const attackTypeLabels: Record<string, string> = { physical: '物理攻击', magic: '魔法攻击' }
const intentAttackLabel = computed(() => attackTypeLabels[intent.value?.attackType ?? ''] ?? '')

const critLabel = computed(() => {
  const critBoost = intent.value?.skills.find(s => s.type === 'critBoost' && s.willTrigger)
  return critBoost ? '强化暴击' : '暴击'
})

const triggeredSkillLabels = computed(() => {
  if (!intent.value) return []
  return intent.value.skills
    .filter(s => s.willTrigger)
    .map(s => s.label)
})

const ENRAGE_START_TURN = 15
const enrageTurnsLeft = computed(() => {
  if (!props.monster.isBoss || props.battleState.isEnraged) return 0
  return ENRAGE_START_TURN - props.battleState.currentTurn
})

const intentEnrageMultiplier = computed(() => {
  if (!intent.value) return 1.0
  return intent.value.enrageMultiplier
})

// Monster statuses from battle state
const breakDefenseStatus = computed(() =>
  props.battleState.statusEffects?.find(s => s.type === 'breakDefense' && s.target === 'monster') as
    | { type: 'breakDefense'; target: 'monster'; reductionPercent: number; remainingUses: number }
    | undefined
)
const weakStatus = computed(() =>
  props.battleState.statusEffects?.find(s => s.type === 'weak' && s.target === 'monster') as
    | { type: 'weak'; target: 'monster'; multiplier: number; remainingUses: number }
    | undefined
)
const hasMonsterShield = computed(() =>
  props.battleState.statusEffects?.some(s => s.type === 'shield' && s.target === 'monster') ?? false
)

// Stone General shield pressure
const nextShieldTurn = computed(() => {
  const currentTurn = props.battleState.currentTurn
  const cadence = props.monster.archetype?.shieldPressureCadence ?? 3
  const nextTurn = currentTurn + (cadence - ((currentTurn - 1) % cadence))
  return nextTurn
})
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

// Intent panel
.intent-panel {
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(233, 69, 96, 0.08);
  border-radius: 6px;
  border: 1px solid rgba(233, 69, 96, 0.2);
}

.intent-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.intent-label {
  color: #95a5a6;
  font-size: 12px;
}

.intent-value {
  color: #e94560;
  font-weight: 600;
}

.intent-damage {
  color: #ecf0f1;
  font-weight: 700;
}

.intent-crit {
  color: #f0c040;
  font-size: 12px;
}

.intent-skills {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.intent-skill-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

// Boss pressure
.boss-pressure {
  margin-top: 6px;
  font-size: 12px;
  text-align: center;
}

.pressure-warn {
  color: #f39c12;
  font-weight: 600;
}

.pressure-active {
  color: #e74c3c;
  font-weight: 700;
}

.boss-tag {
  font-size: 10px;
  padding: 1px 6px;
  background: rgba(142, 68, 173, 0.3);
  color: #bb8fce;
  border-radius: 3px;
  vertical-align: middle;
}

.status-badges {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.badge {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;

  &.break-defense {
    background: rgba(231, 76, 60, 0.3);
    color: #e74c3c;
  }

  &.weak {
    background: rgba(142, 68, 173, 0.3);
    color: #bb8fce;
  }

  &.shield {
    background: rgba(52, 152, 219, 0.3);
    color: #5dade2;
  }
}

.shield-pressure {
  margin-top: 4px;
  font-size: 11px;
  text-align: center;
  color: #5dade2;
  font-weight: 600;
}
</style>
