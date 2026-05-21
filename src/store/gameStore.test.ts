import { beforeEach, describe, expect, it } from 'vitest'
import { defaultPlayer, useGameStore } from './gameStore'
import { asMoveId, asSkillId } from '../types/id'
import type { BattleResult } from '../types/battle'

function resetGameStore(): void {
  useGameStore.setState({
    player: structuredClone(defaultPlayer),
    recentUnlocks: [],
  })
}

describe('gameStore', () => {
  beforeEach(() => {
    resetGameStore()
  })

  it('applyBattleResult updates hp, qi, and proficiency on victory', () => {
    const result: BattleResult = {
      winnerId: 'player_001',
      events: [],
      finalPlayerHp: 95,
      finalPlayerQi: 30,
      finalEnemyHp: 0,
      finalEnemyQi: 0,
      proficiencyGains: [{ skillId: asSkillId('skill_sword_010_qingmang'), amount: 3 }],
    }

    useGameStore.getState().applyBattleResult(result)

    const { player } = useGameStore.getState()
    expect(player.hp).toBe(95)
    expect(player.qi).toBe(30)
    expect(player.learnedSkills[0]?.proficiency).toBe(3)
  })

  it('unlocks new move when proficiency reaches threshold', () => {
    useGameStore.setState({
      player: {
        ...defaultPlayer,
        learnedSkills: [
          {
            skillId: asSkillId('skill_sword_010_qingmang'),
            proficiency: 9,
            unlockedMoveIds: ['move_qingmang_01'],
          },
          ...defaultPlayer.learnedSkills.slice(1),
        ],
      },
    })

    const result: BattleResult = {
      winnerId: 'player_001',
      events: [],
      finalPlayerHp: 100,
      finalPlayerQi: 40,
      finalEnemyHp: 0,
      finalEnemyQi: 0,
      proficiencyGains: [{ skillId: asSkillId('skill_sword_010_qingmang'), amount: 1 }],
    }

    useGameStore.getState().applyBattleResult(result)

    const { player, recentUnlocks } = useGameStore.getState()
    expect(player.learnedSkills[0]?.proficiency).toBe(10)
    expect(player.learnedSkills[0]?.unlockedMoveIds).toContain('move_qingmang_02')
    expect(recentUnlocks).toHaveLength(1)
    expect(recentUnlocks[0]?.moveId).toBe('move_qingmang_02')
  })

  it('grants base proficiency without victory bonus on defeat', () => {
    const result: BattleResult = {
      winnerId: 'enemy_001_bandit_grunt',
      events: [],
      finalPlayerHp: 0,
      finalPlayerQi: 10,
      finalEnemyHp: 50,
      finalEnemyQi: 20,
      proficiencyGains: [{ skillId: asSkillId('skill_sword_010_qingmang'), amount: 2 }],
    }

    useGameStore.getState().applyBattleResult(result)

    expect(useGameStore.getState().player.learnedSkills[0]?.proficiency).toBe(2)
    expect(useGameStore.getState().recentUnlocks).toHaveLength(0)
  })

  it('canUpgradeSkill and upgradeSkill work as placeholders', () => {
    expect(useGameStore.getState().canUpgradeSkill('skill_sword_010_qingmang')).toBe(true)
    useGameStore.getState().upgradeSkill('skill_sword_010_qingmang')
    expect(useGameStore.getState().player.learnedSkills[0]?.proficiency).toBe(1)
  })

  it('getSkillDisplay returns merged view for SkillPanel', () => {
    const display = useGameStore.getState().getSkillDisplay('skill_sword_010_qingmang')
    expect(display).toEqual({
      skillId: asSkillId('skill_sword_010_qingmang'),
      skillName: '青蟒剑法',
      proficiency: 0,
      maxProficiency: 30,
      unlockedMoveNames: ['青蟒出洞'],
    })
  })

  it('dismissUnlockNotice removes notice by id', () => {
    useGameStore.setState({
      recentUnlocks: [
        {
          id: 'unlock_test',
          skillId: asSkillId('skill_sword_010_qingmang'),
          moveId: asMoveId('move_qingmang_02'),
          skillName: '青蟒剑法',
          moveName: '蟒尾横扫',
        },
      ],
    })

    useGameStore.getState().dismissUnlockNotice('unlock_test')
    expect(useGameStore.getState().recentUnlocks).toHaveLength(0)
  })
})
