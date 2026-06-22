/**
 * @module engine/character/skill_runtime.test
 * @layer engine
 * @description skill_runtime 测试：验证授予、可用性与升级逻辑
 * @inputs skill_runtime
 * @outputs 测试断言
 * @depends test, engine/character, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { canUpgradeSkill, canUseMove, grantSkill, upgradeSkill } from './skill_runtime'
import { asMoveId, asSkillId } from '../../types/id'
import type { SkillDefinition } from '../../types/skill'

const skillDef: SkillDefinition = {
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

describe('grantSkill', () => {
  it('creates runtime with proficiency 0 and initial moves unlocked', () => {
    const runtime = grantSkill(skillDef.id, skillDef)
    expect(runtime.proficiency).toBe(0)
    expect(runtime.realmLevel).toBe(1)
    expect(runtime.insight).toBe(0)
    expect(runtime.unlockedMoveIds).toEqual(['move_qingmang_01'])
  })
})

describe('canUseMove', () => {
  it('returns true for unlocked move', () => {
    const runtime = grantSkill(skillDef.id, skillDef)
    expect(canUseMove(runtime, 'move_qingmang_01')).toBe(true)
  })

  it('returns false for locked move', () => {
    const runtime = grantSkill(skillDef.id, skillDef)
    expect(canUseMove(runtime, 'move_qingmang_02')).toBe(false)
  })
})

describe('canUpgradeSkill / upgradeSkill', () => {
  it('allows upgrade below max proficiency', () => {
    const runtime = grantSkill(skillDef.id, skillDef)
    expect(canUpgradeSkill(runtime, skillDef)).toBe(true)
  })

  it('increments proficiency on upgrade', () => {
    const runtime = grantSkill(skillDef.id, skillDef)
    const upgraded = upgradeSkill(runtime, skillDef)
    expect(upgraded.proficiency).toBe(1)
  })

  it('does not upgrade at max proficiency', () => {
    const runtime = { ...grantSkill(skillDef.id, skillDef), proficiency: 30 }
    expect(canUpgradeSkill(runtime, skillDef)).toBe(false)
    expect(upgradeSkill(runtime, skillDef).proficiency).toBe(30)
  })
})
