/**
 * @module engine/world/areaEngine.test
 * @layer engine
 * @description areaEngine 测试：验证区域目录读取与按区域聚合场景
 * @inputs areaEngine
 * @outputs 测试断言
 * @depends test, engine/world, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { getAreaById, getAreaBySceneId, listAreas, listScenesByArea } from './areaEngine'
import { asAreaId, asSceneId } from '../../types/id'

describe('areaEngine', () => {
  it('loads area catalog from JSON', () => {
    expect(listAreas()).toHaveLength(3)
  })

  it('finds hangzhou area and its hub scene', () => {
    const area = getAreaById(asAreaId('area_hangzhou'))
    expect(area?.name).toBe('杭州城')
    expect(area?.hubSceneId).toBe(asSceneId('scene_001_village'))
  })

  it('lists scenes grouped under an area', () => {
    const scenes = listScenesByArea('area_hangzhou')
    expect(scenes.map((scene) => scene.id)).toEqual([
      asSceneId('scene_001_village'),
      asSceneId('scene_003_market'),
      asSceneId('scene_004_clinic'),
      asSceneId('scene_005_dojo'),
      asSceneId('scene_006_station'),
      asSceneId('scene_007_gate'),
    ])
  })

  it('resolves area by scene id', () => {
    expect(getAreaBySceneId('scene_002_outskirts')?.id).toBe(asAreaId('area_hangzhou_outskirts'))
  })
})
