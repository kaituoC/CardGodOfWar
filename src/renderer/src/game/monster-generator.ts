import type { Monster, MonsterSkill, MonsterSkillType, Element } from './types'
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
} from './constants'

function randomElement(): Element {
  const elements: Element[] = ['fire', 'thunder', 'water']
  return elements[Math.floor(Math.random() * elements.length)]
}

function isBossLevel(level: number): boolean {
  return level % BOSS_INTERVAL === 0
}

export function generateMonster(level: number): Monster {
  const isBoss = isBossLevel(level)
  const baseHp = (isBoss ? BOSS_BASE_HP : MONSTER_BASE_STATS.baseHp) * Math.pow(level, MONSTER_HP_EXPONENT)
  const maxHp = Math.floor(baseHp)

  const stats = {
    physicalAttack: MONSTER_BASE_STATS.physicalAttack + MONSTER_PER_LEVEL_GROWTH.physicalAttack * (level - 1),
    magicAttack: MONSTER_BASE_STATS.magicAttack + MONSTER_PER_LEVEL_GROWTH.magicAttack * (level - 1),
    defense: MONSTER_BASE_STATS.defense + MONSTER_PER_LEVEL_GROWTH.defense * (level - 1),
    maxHp: Math.floor(maxHp),
    critRate: Math.min(
      MONSTER_BASE_STATS.critRate + MONSTER_PER_LEVEL_GROWTH.critRate * (level - 1),
      100
    ),
  }

  const skillCount = isBoss ? BOSS_SKILL_COUNT : NORMAL_MONSTER_SKILL_COUNT
  const skills = generateSkills(skillCount)

  return {
    stats,
    element: randomElement(),
    skills,
    currentHp: stats.maxHp,
    isBoss,
  }
}

function generateSkills(count: number): MonsterSkill[] {
  const skills: MonsterSkill[] = []
  const usedTypes = new Set<MonsterSkillType>()

  for (let i = 0; i < count; i++) {
    let type: MonsterSkillType
    do {
      type = MONSTER_SKILL_POOL[Math.floor(Math.random() * MONSTER_SKILL_POOL.length)]
    } while (usedTypes.has(type) && usedTypes.size < MONSTER_SKILL_POOL.length)

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
