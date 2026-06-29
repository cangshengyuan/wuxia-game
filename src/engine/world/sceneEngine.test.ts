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
    expect(listScenes().length).toBe(9)
  })

  it('getSceneById finds hangzhou city hub', () => {
    const scene = getSceneById(asSceneId('scene_001_village'))
    expect(scene?.name).toBe('杭州城中')
    expect(scene?.areaId).toBe('area_hangzhou')
    expect(scene?.kind).toBe('city_hub')
    expect(scene?.safety).toBe('safe')
    expect(scene?.encounters).toEqual([])
    expect(scene?.exits).toHaveLength(5)
    expect(scene?.exits[0]).toEqual({
      toSceneId: asSceneId('scene_003_market'),
      mode: 'walk',
      direction: 'west',
      label: '步行前往东市',
      travelTimeMinutes: 5,
    })
  })

  it('outskirts scene references enemies and gate return', () => {
    const scene = getSceneById('scene_002_outskirts')
    expect(scene?.encounters.length).toBe(3)
    expect(scene?.safety).toBe('dangerous')
    expect(scene?.encounters[0]?.enemyId).toBeDefined()
    expect(scene?.exits[0]?.toSceneId).toBe(asSceneId('scene_007_gate'))
    expect(scene?.exits[0]?.mode).toBe('gate')
    expect(scene?.exits[0]?.direction).toBe('north')
  })
})
