/**
 * @module engine/skill/realm.test
 * @layer engine
 * @description 境界与感悟测试：验证相似功法突破与高境界悟性概率加成
 * @inputs realm
 * @outputs 测试断言
 * @depends test, engine, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { getSkillById } from '../skillEngine'
import { applyRealmProgress, canBreakthrough, countSimilarSkills, rollInsightGain } from './realm'
import { asSkillId } from '../../types/id'
import type { SkillRuntime } from '../../types/character'
import type { Rng } from '../util/rng'

function fixedRng(value: number): Rng {
  return { next: () => value }
}

const sheyingRuntime: SkillRuntime = {
  skillId: asSkillId('skill_sword_020_sheying'),
  proficiency: 18,
  realmLevel: 1,
  insight: 0,
  unlockedMoveIds: ['move_sheying_01'],
}

const similarSkills: SkillRuntime[] = [
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
]

describe('realm', () => {
  it('counts similar skills and allows breakthrough when requirements are met', () => {
    const skillDef = getSkillById('skill_sword_020_sheying')!
    const similarCount = countSimilarSkills(skillDef.id, similarSkills)

    expect(similarCount).toBe(2)
    expect(canBreakthrough(sheyingRuntime, skillDef, similarCount)).toBe(true)
  })

  it('increases random insight chance when player owns more high-realm skills', () => {
    const skillDef = getSkillById('skill_sword_020_sheying')!
    const lowRealmSkills = [{ ...similarSkills[0], realmLevel: 1 }]
    const highRealmSkills = similarSkills

    expect(rollInsightGain(skillDef, lowRealmSkills, fixedRng(0.25))).toBe(0)
    expect(rollInsightGain(skillDef, highRealmSkills, fixedRng(0.25))).toBe(1)
  })

  it('applies breakthrough with deterministic rng', () => {
    const skillDef = getSkillById('skill_sword_020_sheying')!
    const result = applyRealmProgress(sheyingRuntime, skillDef, [...similarSkills, sheyingRuntime], fixedRng(0.9))

    expect(result.brokeThrough).toBe(true)
    expect(result.runtime.realmLevel).toBe(2)
  })
})
