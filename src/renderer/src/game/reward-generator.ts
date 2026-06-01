import type { Reward, RewardType, AttributeReward, RelicReward, CardBiasReward, CardBiasState, Hero } from './types'
import {
  ATTRIBUTE_REWARD_AMOUNTS,
  ATTRIBUTE_REWARD_CRIT_AMOUNTS,
  RELIC_REGISTRY,
} from './constants'

let rewardIdCounter = 0

function nextRewardId(): string {
  rewardIdCounter += 1
  return `reward-${rewardIdCounter}`
}

// 奖励档位：低/中/高三档等概率（各约 1/3）
function pickRewardTier(): 0 | 1 | 2 {
  const roll = Math.random()
  if (roll < 1 / 3) return 0
  if (roll < 2 / 3) return 1
  return 2
}

const STAT_KEYS: Array<keyof typeof ATTRIBUTE_REWARD_AMOUNTS> = ['physicalAttack', 'magicAttack', 'defense', 'maxHp']

function generateAttributeReward(): AttributeReward {
  const stat = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)]
  const tier = pickRewardTier()
  const amount = ATTRIBUTE_REWARD_AMOUNTS[stat][tier]
  const statLabels: Record<string, string> = {
    physicalAttack: '物攻',
    magicAttack: '魔攻',
    defense: '防御',
    maxHp: '最大HP',
  }
  return {
    id: nextRewardId(),
    type: 'attribute',
    stat: stat as keyof typeof ATTRIBUTE_REWARD_AMOUNTS,
    amount,
    label: `${statLabels[stat]} +${amount}`,
    description: `永久提升${statLabels[stat]} ${amount}点`,
  }
}

function generateCritRateReward(): AttributeReward {
  const tier = pickRewardTier()
  const amount = ATTRIBUTE_REWARD_CRIT_AMOUNTS[tier]
  return {
    id: nextRewardId(),
    type: 'attribute',
    stat: 'critRate',
    amount,
    label: `暴击率 +${amount}%`,
    description: `永久提升暴击率 ${amount}%`,
  }
}

function generateRelicReward(ownedRelics: string[]): RelicReward | null {
  const available = RELIC_REGISTRY.filter(r => !ownedRelics.includes(r.id))
  if (available.length === 0) return null
  const relic = available[Math.floor(Math.random() * available.length)]
  return {
    id: nextRewardId(),
    type: 'relic',
    relicId: relic.id,
    label: relic.name,
    description: relic.shortDescription,
  }
}

const TYPE_BIAS_KEYS: Array<{ key: string; label: string; description: string }> = [
  { key: 'physical', label: '物理专精', description: '物理攻击卡出现率提升' },
  { key: 'magic', label: '魔法专精', description: '魔法攻击卡出现率提升' },
  { key: 'heal', label: '生命补给', description: '生命恢复卡出现率提升' },
  { key: 'tactical', label: '战术训练', description: '防御/状态卡出现率提升' },
]

const ELEMENT_BIAS_KEYS: Array<{ key: string; label: string; description: string }> = [
  { key: 'fire', label: '火炎亲和', description: '火属性攻击卡出现率提升' },
  { key: 'thunder', label: '雷霆亲和', description: '雷属性攻击卡出现率提升' },
  { key: 'water', label: '流水亲和', description: '水属性攻击卡出现率提升' },
]

function generateCardBiasReward(): CardBiasReward | null {
  const roll = Math.random()
  if (roll < 0.4) {
    const bias = TYPE_BIAS_KEYS[Math.floor(Math.random() * TYPE_BIAS_KEYS.length)]
    return {
      id: nextRewardId(),
      type: 'cardBias',
      biasCategory: 'type',
      biasKey: bias.key,
      level: 1,
      label: bias.label,
      description: bias.description,
    }
  }
  if (roll < 0.8) {
    const bias = ELEMENT_BIAS_KEYS[Math.floor(Math.random() * ELEMENT_BIAS_KEYS.length)]
    return {
      id: nextRewardId(),
      type: 'cardBias',
      biasCategory: 'element',
      biasKey: bias.key,
      level: 1,
      label: bias.label,
      description: bias.description,
    }
  }
  // Rare instinct for star bias
  const star = Math.random() < 0.5 ? 2 : 3
  return {
    id: nextRewardId(),
    type: 'cardBias',
    biasCategory: 'star',
    biasKey: String(star),
    level: 1,
    label: `${star}星直觉`,
    description: `${star}星卡出现率提升`,
  }
}

export function generateRewards(hero: Hero, _cardBias?: CardBiasState): Reward[] {
  const rewards: Reward[] = []
  const rewardTypes: RewardType[] = ['attribute', 'attribute', 'relic', 'cardBias']
  // Shuffle and pick 3 unique types where possible
  for (let i = rewardTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rewardTypes[i], rewardTypes[j]] = [rewardTypes[j], rewardTypes[i]]
  }

  const seenIds = new Set<string>()

  for (const rt of rewardTypes) {
    if (rewards.length >= 3) break

    let reward: Reward | null = null

    if (rt === 'attribute') {
      // Mix of stat and crit rate rewards
      reward = Math.random() < 0.7 ? generateAttributeReward() : generateCritRateReward()
    } else if (rt === 'relic') {
      reward = generateRelicReward(hero.relics)
    } else if (rt === 'cardBias') {
      reward = generateCardBiasReward()
    }

    if (reward && !seenIds.has(getRewardUniqueId(reward))) {
      seenIds.add(getRewardUniqueId(reward))
      rewards.push(reward)
    }
  }

  // Fill remaining slots with attribute rewards, ensuring uniqueness
  while (rewards.length < 3) {
    const fillReward = rewards.some(r => r.type === 'attribute' && r.stat === 'critRate')
      ? generateCritRateReward()
      : (Math.random() < 0.5 ? generateAttributeReward() : generateCritRateReward())
    const id = getRewardUniqueId(fillReward)
    if (!seenIds.has(id)) {
      seenIds.add(id)
      rewards.push(fillReward)
    } else {
      // Safety: if all IDs are taken, just break to avoid infinite loop
      if (rewards.length >= 2) break
    }
  }

  return rewards.slice(0, 3)
}

function getRewardUniqueId(reward: Reward): string {
  if (reward.type === 'attribute') return `attr-${reward.stat}`
  if (reward.type === 'relic') return `relic-${reward.relicId}`
  return `bias-${reward.biasCategory}-${reward.biasKey}`
}
