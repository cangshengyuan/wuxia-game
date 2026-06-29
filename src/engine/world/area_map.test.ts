/**
 * @module engine/world/area_map.test
 * @layer engine
 * @description area_map 测试：验证区域地图布局使用出口方向生成节点关系
 * @inputs area_map, areaEngine, sceneEngine
 * @outputs 测试断言
 * @depends test, engine/world, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { getAreaById, listScenesByArea } from './areaEngine'
import { buildAreaMapLayout } from './area_map'
import { asAreaId, asSceneId } from '../../types/id'

describe('area_map', () => {
  it('builds hangzhou area layout around the hub scene', () => {
    const area = getAreaById(asAreaId('area_hangzhou'))
    expect(area).toBeDefined()

    const layout = buildAreaMapLayout(
      area!,
      listScenesByArea(area!.id),
      asSceneId('scene_001_village'),
    )

    const city = layout.nodes.find((node) => node.sceneId === asSceneId('scene_001_village'))
    const clinic = layout.nodes.find((node) => node.sceneId === asSceneId('scene_004_clinic'))
    const gate = layout.nodes.find((node) => node.sceneId === asSceneId('scene_007_gate'))

    expect(city).toMatchObject({ x: 0, y: 0, isCurrent: true })
    expect(clinic).toMatchObject({ x: 0, y: -1 })
    expect(gate).toMatchObject({ x: 0, y: 1 })
    expect(layout.edges).toContainEqual({
      fromSceneId: asSceneId('scene_001_village'),
      toSceneId: asSceneId('scene_007_gate'),
      mode: 'walk',
    })
  })

  it('deduplicates intra-area edges', () => {
    const area = getAreaById(asAreaId('area_suzhou'))
    expect(area).toBeDefined()

    const layout = buildAreaMapLayout(
      area!,
      listScenesByArea(area!.id),
      asSceneId('scene_009_suzhou_city'),
    )

    expect(layout.edges).toHaveLength(1)
  })
})
