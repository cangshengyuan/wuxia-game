/**
 * @module engine/world/encounter.test
 * @layer engine
 * @description encounter 测试：验证空场景与带权遭遇判定
 * @inputs encounter
 * @outputs 测试断言
 * @depends test, engine/world, engine/util, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { rollEncounter } from './encounter'
import { getSceneById } from './sceneEngine'
import { createSeededRng } from '../util/rng'
import { asEnemyId, asSceneId } from '../../types/id'
import type { SceneDefinition } from '../../types/world'

describe('rollEncounter', () => {
  it('returns null when encounters table is empty', () => {
    const village = getSceneById(asSceneId('scene_001_village'))
    expect(village).toBeDefined()
    const rng = createSeededRng(1)
    expect(rollEncounter(village!, rng)).toBeNull()
  })

  it('returns a weighted enemy for outskirts with seeded rng', () => {
    const outskirts = getSceneById('scene_002_outskirts')
    expect(outskirts).toBeDefined()
    const rng = createSeededRng(42)
    const enemyId = rollEncounter(outskirts!, rng)
    expect(enemyId).toBe(asEnemyId('enemy_001_bandit_grunt'))
  })

  it('always returns an enemy when encounters are non-empty', () => {
    const outskirts = getSceneById('scene_002_outskirts')
    expect(outskirts).toBeDefined()
    for (let seed = 0; seed < 20; seed += 1) {
      const rng = createSeededRng(seed)
      expect(rollEncounter(outskirts!, rng)).not.toBeNull()
    }
  })

  it('respects weight distribution over many rolls', () => {
    const scene: SceneDefinition = {
      id: asSceneId('scene_test'),
      name: 'Test',
      encounters: [
        { enemyId: asEnemyId('enemy_a'), weight: 5 },
        { enemyId: asEnemyId('enemy_b'), weight: 2 },
        { enemyId: asEnemyId('enemy_c'), weight: 4 },
      ],
      exits: [],
    }

    const counts = { enemy_a: 0, enemy_b: 0, enemy_c: 0 }
    const trials = 11_000

    for (let seed = 0; seed < trials; seed += 1) {
      const rng = createSeededRng(seed)
      const enemyId = rollEncounter(scene, rng)
      if (enemyId === asEnemyId('enemy_a')) counts.enemy_a += 1
      if (enemyId === asEnemyId('enemy_b')) counts.enemy_b += 1
      if (enemyId === asEnemyId('enemy_c')) counts.enemy_c += 1
    }

    const total = counts.enemy_a + counts.enemy_b + counts.enemy_c
    expect(total).toBe(trials)
    expect(counts.enemy_a / total).toBeCloseTo(5 / 11, 1)
    expect(counts.enemy_b / total).toBeCloseTo(2 / 11, 1)
    expect(counts.enemy_c / total).toBeCloseTo(4 / 11, 1)
  })
})
