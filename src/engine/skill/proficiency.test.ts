/**
 * @module engine/skill/proficiency.test
 * @layer engine
 * @description proficiency 测试：验证熟练度增长与招式解锁判定
 * @inputs proficiency
 * @outputs 测试断言
 * @depends test, engine/skill, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { applyProficiencyGain, checkUnlocks } from './proficiency'
import { asMoveId, asSkillId } from '../../types/id'
import type { SkillRuntime } from '../../types/character'
import type { SkillDefinition } from '../../types/skill'

const qingmangDef: SkillDefinition = {
  id: asSkillId('skill_sword_010_qingmang'),
  name: '青蟒剑法',
  category: 'sword',
  tier: 'low',
  description: 'test',
  maxProficiency: 30,
  tags: ['sword', 'basic'],
  realm: {
    minLevel: 1,
    maxLevel: 3,
    breakthroughProficiency: [10, 20],
    insightThresholds: [2, 4],
    similarSkillRequired: [1, 2],
  },
  attributeGrowth: {
    armStrength: { perProficiency: 0.08, perRealm: 1, maxBonus: 4 },
  },
  growthCurve: {
    proficiencyMultiplier: 1,
    battleGainMultiplier: 1,
    breakthroughCostMultiplier: 1,
    insightChanceMultiplier: 1,
    inheritanceCapRatio: 0.4,
  },
  weaponRequirement: 'sword',
  moves: [
    {
      id: asMoveId('move_qingmang_01'),
      name: '青蟒出洞',
      cd: 3,
      qiCost: 10,
      powerRatio: 1.35,
      unlockProficiency: 0,
    },
    {
      id: asMoveId('move_qingmang_02'),
      name: '蟒尾横扫',
      cd: 5,
      qiCost: 12,
      powerRatio: 1.1,
      unlockProficiency: 10,
    },
  ],
}

const baseRuntime: SkillRuntime = {
  skillId: asSkillId('skill_sword_010_qingmang'),
  proficiency: 0,
  realmLevel: 1,
  insight: 0,
  unlockedMoveIds: [asMoveId('move_qingmang_01')],
}

describe('applyProficiencyGain', () => {
  it('increases proficiency by gain amount', () => {
    const result = applyProficiencyGain(baseRuntime, { skillId: baseRuntime.skillId, amount: 3 }, 30)
    expect(result.proficiency).toBe(3)
    expect(baseRuntime.proficiency).toBe(0)
  })

  it('caps proficiency at maxProficiency', () => {
    const runtime: SkillRuntime = { ...baseRuntime, proficiency: 28 }
    const result = applyProficiencyGain(runtime, { skillId: runtime.skillId, amount: 5 }, 30)
    expect(result.proficiency).toBe(30)
  })
})

describe('checkUnlocks', () => {
  it('returns empty when threshold not reached', () => {
    const runtime: SkillRuntime = { ...baseRuntime, proficiency: 9 }
    expect(checkUnlocks(runtime, qingmangDef)).toEqual({ newlyUnlockedMoveIds: [] })
  })

  it('unlocks move when threshold is reached', () => {
    const runtime: SkillRuntime = { ...baseRuntime, proficiency: 10 }
    expect(checkUnlocks(runtime, qingmangDef)).toEqual({
      newlyUnlockedMoveIds: ['move_qingmang_02'],
    })
  })

  it('does not re-unlock already unlocked moves', () => {
    const runtime: SkillRuntime = {
      ...baseRuntime,
      proficiency: 10,
      unlockedMoveIds: [asMoveId('move_qingmang_01'), asMoveId('move_qingmang_02')],
    }
    expect(checkUnlocks(runtime, qingmangDef)).toEqual({ newlyUnlockedMoveIds: [] })
  })
})
