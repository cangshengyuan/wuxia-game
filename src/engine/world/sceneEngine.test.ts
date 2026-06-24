/**
 * @module engine/world/sceneEngine.test
 * @layer engine
 * @description sceneEngine 测试：验证场景目录读取与遭遇表内容
 * @inputs sceneEngine
 * @outputs 测试断言
 * @depends test, engine/world, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { getSceneById, listScenes } from './sceneEngine'
import { asSceneId } from '../../types/id'

describe('sceneEngine', () => {
  it('loads and validates scene catalog from JSON', () => {
    expect(listScenes().length).toBe(2)
  })

  it('getSceneById finds village scene', () => {
    const scene = getSceneById(asSceneId('scene_001_village'))
    expect(scene?.name).toBe('主城新手村')
    expect(scene?.encounters).toEqual([])
    expect(scene?.exits).toEqual([{ toSceneId: asSceneId('scene_002_outskirts') }])
  })

  it('outskirts scene references enemies', () => {
    const scene = getSceneById('scene_002_outskirts')
    expect(scene?.encounters.length).toBe(3)
    expect(scene?.encounters[0]?.enemyId).toBeDefined()
    expect(scene?.exits[0]?.toSceneId).toBe(asSceneId('scene_001_village'))
  })
})
