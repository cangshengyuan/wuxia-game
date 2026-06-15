/**
 * @module engine/world/enemyEngine.test
 * @layer engine
 * @description enemyEngine 测试：验证敌人目录读取与运行时构建
 * @inputs enemyEngine
 * @outputs 测试断言
 * @depends test, engine/world, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { buildEnemyState, getEnemyById } from './enemyEngine'
import { asEnemyId } from '../../types/id'

describe('enemyEngine', () => {
  it('loads three enemies from JSON', () => {
    expect(getEnemyById(asEnemyId('enemy_001_bandit_grunt'))?.name).toBe('山贼喽啰')
    expect(getEnemyById('enemy_002_bandit_boss')?.name).toBe('山贼头目')
    expect(getEnemyById('enemy_003_wild_wolf')?.name).toBe('野狼')
  })

  it('buildEnemyState returns valid CharacterState with speed', () => {
    const state = buildEnemyState('enemy_001_bandit_grunt')
    expect(state).toBeDefined()
    expect(state?.speed).toBeGreaterThan(0)
    expect(state?.learnedSkills).toEqual([])
    expect(state?.hp).toBe(state?.maxHp)
    expect(state?.equippedSkillIds.length).toBeGreaterThan(0)
  })
})
