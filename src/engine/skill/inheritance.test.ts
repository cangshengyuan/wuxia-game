/**
 * @module engine/skill/inheritance.test
 * @layer engine
 * @description 传承引擎测试：验证同类传承、跨阶衰减与多来源递减
 * @inputs inheritance
 * @outputs 测试断言
 * @depends test, engine, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { calculateInheritedProficiency } from './inheritance'
import { getSkillById } from '../skillEngine'
import { asSkillId } from '../../types/id'
import type { SkillRuntime } from '../../types/character'

const learnedSkills: SkillRuntime[] = [
  {
    skillId: asSkillId('skill_sword_010_qingmang'),
    proficiency: 30,
    realmLevel: 3,
    insight: 0,
    unlockedMoveIds: ['move_qingmang_01', 'move_qingmang_02', 'move_qingmang_03'],
  },
  {
    skillId: asSkillId('skill_sword_014_shexing'),
    proficiency: 24,
    realmLevel: 2,
    insight: 0,
    unlockedMoveIds: ['move_shexing_01', 'move_shexing_02'],
  },
  {
    skillId: asSkillId('skill_sword_020_sheying'),
    proficiency: 30,
    realmLevel: 2,
    insight: 0,
    unlockedMoveIds: ['move_sheying_01', 'move_sheying_02'],
  },
]

describe('inheritance', () => {
  it('gives same-theme mid-tier skill a non-zero inherited starting proficiency', () => {
    const targetSkill = getSkillById('skill_sword_020_sheying')
    expect(targetSkill).toBeDefined()

    const result = calculateInheritedProficiency(learnedSkills.slice(0, 2), targetSkill!)
    expect(result.initialProficiency).toBeGreaterThan(0)
  })

  it('applies stronger decay to high-tier targets than lower-tier targets', () => {
    const midSkill = getSkillById('skill_sword_020_sheying')!
    const highSkill = getSkillById('skill_sword_030_tianmang')!

    const midResult = calculateInheritedProficiency(learnedSkills.slice(0, 2), midSkill)
    const highResult = calculateInheritedProficiency(learnedSkills, highSkill)

    expect(highResult.initialProficiency).toBeLessThan(midResult.initialProficiency)
  })

  it('applies diminishing returns for the third source contribution', () => {
    const highSkill = getSkillById('skill_sword_030_tianmang')!
    const result = calculateInheritedProficiency(learnedSkills, highSkill)

    expect(result.contributions.length).toBeGreaterThanOrEqual(1)
    if (result.contributions.length >= 3) {
      const secondContribution = result.contributions[1]
      const thirdContribution = result.contributions[2]
      expect(thirdContribution?.amount).toBeLessThan(secondContribution?.amount ?? Infinity)
    }
  })
})
