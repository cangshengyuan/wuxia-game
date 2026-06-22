/**
 * @module engine/character/attributes.test
 * @layer engine
 * @description 属性聚合测试：验证分类加成方向与同阶上限
 * @inputs attributes
 * @outputs 测试断言
 * @depends test, engine, store defaults
 * @forbidden 禁止在测试中访问 UI
 */
import { describe, expect, it } from 'vitest'
import { defaultPlayer } from '../../store/gameStore.defaults'
import { calculateDerivedCharacterStats } from './attributes'
import { asSkillId } from '../../types/id'

describe('attributes', () => {
  it('applies sword and internal bonuses to final stats', () => {
    const player = {
      ...defaultPlayer,
      learnedSkills: [
        {
          skillId: asSkillId('skill_sword_010_qingmang'),
          proficiency: 20,
          realmLevel: 2,
          insight: 0,
          unlockedMoveIds: ['move_qingmang_01', 'move_qingmang_02'],
        },
        {
          skillId: asSkillId('skill_internal_001_huntuan'),
          proficiency: 20,
          realmLevel: 2,
          insight: 0,
          unlockedMoveIds: ['move_huntuan_01'],
        },
      ],
    }

    const derived = calculateDerivedCharacterStats(player)
    expect(derived.attributes.armStrength).toBeGreaterThan(player.attributes.armStrength)
    expect(derived.maxQi).toBeGreaterThan(player.maxQi)
    expect(derived.speed).toBeGreaterThan(player.speed)
  })

  it('caps low-tier stacking bonuses', () => {
    const player = {
      ...defaultPlayer,
      learnedSkills: [
        {
          skillId: asSkillId('skill_sword_010_qingmang'),
          proficiency: 30,
          realmLevel: 3,
          insight: 0,
          unlockedMoveIds: ['move_qingmang_01', 'move_qingmang_02', 'move_qingmang_03'],
        },
        {
          skillId: asSkillId('skill_sword_011_baihong'),
          proficiency: 30,
          realmLevel: 3,
          insight: 0,
          unlockedMoveIds: ['move_baihong_01', 'move_baihong_02'],
        },
        {
          skillId: asSkillId('skill_sword_012_liushui'),
          proficiency: 30,
          realmLevel: 3,
          insight: 0,
          unlockedMoveIds: ['move_liushui_01', 'move_liushui_02', 'move_liushui_03'],
        },
      ],
    }

    const derived = calculateDerivedCharacterStats(player)
    expect(derived.totalBonuses.armStrength).toBeLessThanOrEqual(6)
  })
})
