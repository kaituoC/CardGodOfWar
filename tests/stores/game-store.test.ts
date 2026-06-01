import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '@/stores/game-store'
import type { BattleState, Reward, SaveData } from '@/game/types'

// Store 层集成测试：覆盖胜利奖励的应用、关卡推进门禁、以及存档恢复 pending reward。
// 这些是 tasks 11.3 / 11.4 手动冒烟流程的自动化替代，无需 GUI。

const savePayloads: Record<string, SaveData> = {}

beforeEach(() => {
  setActivePinia(createPinia())
  for (const k of Object.keys(savePayloads)) delete savePayloads[k]
  // mock Electron 存档桥接
  ;(globalThis as unknown as { window: unknown }).window = {
    electronAPI: {
      saveGame: vi.fn((slot: string | number, data: SaveData) => {
        savePayloads[String(slot)] = data
        return Promise.resolve(true)
      }),
      loadGame: vi.fn((slot: string | number) => Promise.resolve(savePayloads[String(slot)] ?? null)),
      hasAutoSave: vi.fn(() => Promise.resolve(false)),
      listSaves: vi.fn(() => Promise.resolve([])),
    },
  }
})

/** 把当前战斗强制置为"英雄胜利 + 待选奖励"状态，并注入指定奖励。 */
function forceRewardSelection(store: ReturnType<typeof useGameStore>, rewards: Reward[]) {
  const battle = store.currentBattle as BattleState
  store.currentBattle = {
    ...battle,
    gameOver: true,
    winner: 'hero',
    phase: 'rewardSelection',
    pendingRewards: { rewards },
  }
}

describe('胜利奖励流程 (11.3)', () => {
  it('选择属性奖励后永久提升英雄属性并解除待选状态', () => {
    const store = useGameStore()
    store.startNewGame()
    const before = store.hero.stats.physicalAttack

    const reward: Reward = { id: 'r-atk', type: 'attribute', stat: 'physicalAttack', amount: 5, label: '物攻 +5', description: '' }
    forceRewardSelection(store, [reward])
    expect(store.isRewardSelection).toBe(true)

    store.selectReward(reward)

    expect(store.hero.stats.physicalAttack).toBe(before + 5)
    expect(store.currentBattle?.pendingRewards).toBeNull()
    expect(store.currentBattle?.phase).toBe('playerAction')
    expect(store.isRewardSelection).toBe(false)
  })

  it('选择 maxHp 奖励同时提升当前 HP', () => {
    const store = useGameStore()
    store.startNewGame()
    const beforeMax = store.hero.stats.maxHp
    const beforeCur = store.hero.currentHp

    const reward: Reward = { id: 'r-hp', type: 'attribute', stat: 'maxHp', amount: 20, label: '最大HP +20', description: '' }
    forceRewardSelection(store, [reward])
    store.selectReward(reward)

    expect(store.hero.stats.maxHp).toBe(beforeMax + 20)
    expect(store.hero.currentHp).toBe(beforeCur + 20)
  })

  it('选择遗物奖励后英雄获得该遗物（不重复）', () => {
    const store = useGameStore()
    store.startNewGame()

    const reward: Reward = { id: 'r-relic', type: 'relic', relicId: 'flame-emblem', label: '火炎纹章', description: '' }
    forceRewardSelection(store, [reward])
    store.selectReward(reward)

    expect(store.hero.relics).toContain('flame-emblem')
    expect(store.hero.relics.filter(r => r === 'flame-emblem')).toHaveLength(1)
  })

  it('选择卡牌偏向奖励后累加对应权重', () => {
    const store = useGameStore()
    store.startNewGame()
    const before = store.cardBias.typeWeights.physical

    const reward: Reward = {
      id: 'r-bias', type: 'cardBias', biasCategory: 'type', biasKey: 'physical', level: 1, label: '物理专精', description: '',
    }
    forceRewardSelection(store, [reward])
    store.selectReward(reward)

    expect(store.cardBias.typeWeights.physical).toBe(before + 1)
  })

  it('未选奖励前阻止进入下一关', () => {
    const store = useGameStore()
    store.startNewGame()
    const levelBefore = store.level

    const reward: Reward = { id: 'r-atk', type: 'attribute', stat: 'defense', amount: 3, label: '', description: '' }
    forceRewardSelection(store, [reward])

    store.nextLevel() // 应被门禁拦截
    expect(store.level).toBe(levelBefore)
    expect(store.isRewardSelection).toBe(true)
  })
})

describe('存档恢复 pending reward (11.4)', () => {
  it('读档后保留相同的待选奖励 id 与描述', async () => {
    const store = useGameStore()
    store.startNewGame()

    const reward: Reward = { id: 'r-keep', type: 'attribute', stat: 'magicAttack', amount: 4, label: '魔攻 +4', description: '永久提升魔攻 4点' }
    forceRewardSelection(store, [reward])
    await store.saveManual(1) // 落盘带 pendingRewards 的存档

    // 重置后从槽位 1 读档
    store.goToMenu()
    await store.loadManualSave(1)

    expect(store.currentBattle?.pendingRewards?.rewards).toHaveLength(1)
    expect(store.currentBattle?.pendingRewards?.rewards[0].id).toBe('r-keep')
    expect(store.currentBattle?.pendingRewards?.rewards[0].description).toBe('永久提升魔攻 4点')
  })
})
