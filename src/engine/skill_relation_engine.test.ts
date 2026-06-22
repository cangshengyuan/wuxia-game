/**
 * @module engine/skill_relation_engine.test
 * @layer engine
 * @description 功法关系引擎测试：验证合法关系、非法 ID 过滤与空关系查询
 * @inputs skill_relation_engine
 * @outputs 测试断言
 * @depends test, engine, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import {
  getInheritanceSources,
  listAllSkillRelations,
  listRelationsForSource,
  listRelationsForTarget,
} from './skill_relation_engine'

describe('skill_relation_engine', () => {
  it('loads valid snake-style relations for qingmang', () => {
    const relations = listRelationsForSource('skill_sword_010_qingmang')
    expect(relations.some((relation) => relation.type === 'synergy')).toBe(true)
    expect(relations.some((relation) => relation.type === 'inheritance')).toBe(true)
  })

  it('filters out invalid or unknown target ids and returns empty for missing skill', () => {
    expect(listRelationsForTarget('skill_nonexistent_fake')).toEqual([])
    expect(getInheritanceSources('skill_nonexistent_fake')).toEqual([])
  })

  it('finds inheritance sources for sheying and keeps catalog non-empty', () => {
    expect(listAllSkillRelations().length).toBeGreaterThanOrEqual(18)
    const sources = getInheritanceSources('skill_sword_020_sheying')
    expect(sources).toHaveLength(2)
    expect(sources.every((relation) => relation.targetSkillId === 'skill_sword_020_sheying')).toBe(
      true,
    )
  })
})
