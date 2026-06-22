/**
 * @module engine/character/formation.test
 * @layer engine
 * @description 编成引擎测试：验证双外功槽、境界限制与卸下逻辑
 * @inputs formation
 * @outputs 测试断言
 * @depends test, engine, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import {
  canEquipSkill,
  createEmptyFormation,
  equipSkillInFormation,
  flattenFormation,
  getFormationSlot,
  inferFormationFromEquippedSkills,
  unequipSkillFromFormation,
} from './formation'
import { getSkillById } from '../skillEngine'
import { asSkillId } from '../../types/id'
import type { SkillRuntime } from '../../types/character'

const lowSwordRuntime: SkillRuntime = {
  skillId: asSkillId('skill_sword_010_qingmang'),
  proficiency: 12,
  realmLevel: 1,
  insight: 0,
  unlockedMoveIds: ['move_qingmang_01', 'move_qingmang_02'],
}

const secondSwordRuntime: SkillRuntime = {
  skillId: asSkillId('skill_sword_011_baihong'),
  proficiency: 10,
  realmLevel: 1,
  insight: 0,
  unlockedMoveIds: ['move_baihong_01'],
}

const highSwordRuntime: SkillRuntime = {
  skillId: asSkillId('skill_sword_030_tianmang'),
  proficiency: 20,
  realmLevel: 1,
  insight: 0,
  unlockedMoveIds: ['move_tianmang_01'],
}

describe('formation', () => {
  it('maps sword skills to the external slot group', () => {
    expect(getFormationSlot('sword')).toBe('external')
  })

  it('keeps up to two external skills equipped', () => {
    const qingmang = getSkillById(lowSwordRuntime.skillId)!
    const baihong = getSkillById(secondSwordRuntime.skillId)!
    const withFirst = equipSkillInFormation(createEmptyFormation(), lowSwordRuntime, qingmang, 'sword')
    const withSecond = equipSkillInFormation(withFirst, secondSwordRuntime, baihong, 'sword')

    expect(flattenFormation(withSecond)).toEqual([
      asSkillId('skill_sword_011_baihong'),
      asSkillId('skill_sword_010_qingmang'),
    ])
  })

  it('blocks high-tier skills before the required realm is reached', () => {
    const tianmang = getSkillById(highSwordRuntime.skillId)!
    expect(canEquipSkill(highSwordRuntime, tianmang, 'sword')).toEqual({
      canEquip: false,
      slot: 'external',
      reason: '高阶功法需至少二重境界',
    })
  })

  it('supports unequip and infers formation from flat equipped ids', () => {
    const inferred = inferFormationFromEquippedSkills([
      asSkillId('skill_sword_010_qingmang'),
      asSkillId('skill_internal_001_huntuan'),
    ])
    const unequipped = unequipSkillFromFormation(inferred, asSkillId('skill_sword_010_qingmang'))

    expect(inferred.internal).toBe(asSkillId('skill_internal_001_huntuan'))
    expect(unequipped.external).toEqual([])
  })
})
