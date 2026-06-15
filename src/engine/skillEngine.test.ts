/**
 * @module engine/skillEngine.test
 * @layer engine
 * @description skillEngine 测试：验证功法目录读取、查询与分类过滤
 * @inputs skillEngine
 * @outputs 测试断言
 * @depends test, engine, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import {
  getMoveById,
  getSkillById,
  getSkillsByCategory,
  listAllSkills,
} from './skillEngine'
import { asSkillId } from '../types/id'

describe('skillEngine', () => {
  it('loads and validates skill catalog from JSON', () => {
    const all = listAllSkills()
    expect(all.length).toBeGreaterThanOrEqual(8)
  })

  it('getSkillById finds huntuan gong', () => {
    const skill = getSkillById(asSkillId('skill_internal_001_huntuan'))
    expect(skill?.name).toBe('混元功')
    expect(skill?.moves[0]?.unlockProficiency).toBe(0)
  })

  it('getMoveById finds move across catalog', () => {
    const result = getMoveById('move_qingmang_01')
    expect(result?.move.name).toBe('青蟒出洞')
    expect(result?.skill.id).toBe(asSkillId('skill_sword_010_qingmang'))
  })

  it('getSkillsByCategory filters internal skills', () => {
    const internal = getSkillsByCategory('internal')
    expect(internal.length).toBe(4)
    expect(internal.every((s) => s.category === 'internal')).toBe(true)
  })

  it('rejects moves without valid unlockProficiency', () => {
    const all = listAllSkills()
    for (const skill of all) {
      for (const move of skill.moves) {
        expect(move.unlockProficiency).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
