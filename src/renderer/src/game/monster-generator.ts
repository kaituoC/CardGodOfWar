import type { Monster, MonsterSkill, MonsterSkillType, Element, MonsterArchetypeId } from './types'
import {
  MONSTER_BASE_STATS,
  MONSTER_PER_LEVEL_GROWTH,
  MONSTER_HP_EXPONENT,
  BOSS_BASE_HP,
  BOSS_INTERVAL,
  BOSS_SKILL_COUNT,
  NORMAL_MONSTER_SKILL_COUNT,
  MONSTER_SKILL_POOL,
  SKILL_TRIGGER_CHANCE,
  MONSTER_ARCHETYPES,
  STONE_GENERAL_SHIELD_CADENCE,
} from './constants'

const ORDINARY_ARCHETYPES: MonsterArchetypeId[] = ['berserker', 'stoneGuard', 'bloodBat', 'thunderBug']

function randomElement(): Element {
  const elements: Element[] = ['fire', 'thunder', 'water']
  return elements[Math.floor(Math.random() * elements.length)]
}

function isBossLevel(level: number): boolean {
  return level % BOSS_INTERVAL === 0
}

export function generateMonster(level: number): Monster {
  const isBoss = isBossLevel(level)

  // Level 5 Boss = Stone General, level 10+ Bosses remain generic
  let archetypeId: MonsterArchetypeId
  if (isBoss && level === 5) {
    archetypeId = 'stoneGeneral'
  } else if (isBoss) {
    archetypeId = 'generic'
  } else {
    archetypeId = ORDINARY_ARCHETYPES[Math.floor(Math.random() * ORDINARY_ARCHETYPES.length)]
  }

  const archetype = MONSTER_ARCHETYPES[archetypeId]
  const statModifiers = archetype.statModifiers || {}

  const baseHp = (isBoss ? BOSS_BASE_HP : MONSTER_BASE_STATS.baseHp) * Math.pow(level, MONSTER_HP_EXPONENT)
  const maxHpBase = Math.floor(baseHp) + (statModifiers.maxHp ? Math.floor(statModifiers.maxHp * Math.pow(level, 0.8)) : 0)

  const stats = {
    physicalAttack: MONSTER_BASE_STATS.physicalAttack + MONSTER_PER_LEVEL_GROWTH.physicalAttack * (level - 1) + (statModifiers.physicalAttack || 0),
    magicAttack: MONSTER_BASE_STATS.magicAttack + MONSTER_PER_LEVEL_GROWTH.magicAttack * (level - 1),
    defense: MONSTER_BASE_STATS.defense + MONSTER_PER_LEVEL_GROWTH.defense * (level - 1) + (statModifiers.defense || 0),
    maxHp: Math.floor(maxHpBase),
    critRate: Math.min(
      MONSTER_BASE_STATS.critRate + MONSTER_PER_LEVEL_GROWTH.critRate * (level - 1) + (statModifiers.critRate || 0),
      100
    ),
  }

  // Apply archetype skill tendencies
  const skillTendencies = archetype.skillTendencies || {}
  const preferredSkills: MonsterSkillType[] = Object.entries(skillTendencies)
    .sort(([, a], [, b]) => b - a)
    .map(([type]) => type as MonsterSkillType)

  const skillCount = isBoss ? BOSS_SKILL_COUNT : NORMAL_MONSTER_SKILL_COUNT
  const skills = generateSkills(skillCount, preferredSkills)

  // Stone General: ensure shield skill exists (cap at BOSS_SKILL_COUNT)
  if (archetypeId === 'stoneGeneral') {
    if (!skills.find(s => s.type === 'shield')) {
      // Replace last skill with shield if at capacity
      if (skills.length >= BOSS_SKILL_COUNT) {
        skills[skills.length - 1] = { type: 'shield', triggerChance: 30 }
      } else {
        skills.push({ type: 'shield', triggerChance: 30 })
      }
    }
  }

  return {
    stats,
    element: archetype.elementTendency || randomElement(),
    skills,
    currentHp: stats.maxHp,
    isBoss,
    archetype: {
      id: archetypeId,
      name: archetype.name,
      shieldPressureCadence: archetype.shieldPressureCadence ?? STONE_GENERAL_SHIELD_CADENCE,
    },
  }
}

function generateSkills(count: number, preferredTypes: MonsterSkillType[] = []): MonsterSkill[] {
  const skills: MonsterSkill[] = []
  const usedTypes = new Set<MonsterSkillType>()

  for (let i = 0; i < count; i++) {
    let type: MonsterSkillType

    // Try preferred types first
    const preferred = preferredTypes.find(t => !usedTypes.has(t))
    if (preferred && Math.random() < 0.7) {
      type = preferred
    } else {
      do {
        type = MONSTER_SKILL_POOL[Math.floor(Math.random() * MONSTER_SKILL_POOL.length)]
      } while (usedTypes.has(type) && usedTypes.size < MONSTER_SKILL_POOL.length)
    }

    usedTypes.add(type)

    const skill: MonsterSkill = {
      type,
      triggerChance: SKILL_TRIGGER_CHANCE,
    }

    if (type === 'elementImmune') {
      const elements: Element[] = ['fire', 'thunder', 'water']
      skill.immuneElement = elements[Math.floor(Math.random() * elements.length)]
    }

    skills.push(skill)
  }

  return skills
}
