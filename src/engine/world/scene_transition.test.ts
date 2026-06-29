/**
 * @module engine/world/scene_transition.test
 * @layer engine
 * @description scene_transition 测试：验证场景邻接与可进入判定
 * @inputs scene_transition
 * @outputs 测试断言
 * @depends test, engine/world, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { canEnter, getEnterFailureReasons, getSceneExits } from './scene_transition'
import { asQuestId, asSceneId } from '../../types/id'
import type { ProgressState } from '../../types/world'

const emptyProgress: ProgressState = {
  activeQuests: [],
  completedQuests: [],
  learnedSkills: [],
}

describe('scene_transition', () => {
  it('returns typed exits for city hub, gate, and station scenes', () => {
    const city = asSceneId('scene_001_village')
    const gate = asSceneId('scene_007_gate')
    const station = asSceneId('scene_006_station')

    expect(getSceneExits(city)).toHaveLength(5)
    expect(getSceneExits(city)[0]?.mode).toBe('walk')
    expect(getSceneExits(gate)).toEqual([
      {
        toSceneId: city,
        mode: 'walk',
        direction: 'north',
        label: '回杭州城中',
        travelTimeMinutes: 8,
      },
      {
        toSceneId: asSceneId('scene_002_outskirts'),
        mode: 'gate',
        direction: 'south',
        label: '出城前往官道',
        travelTimeMinutes: 8,
      },
    ])
    expect(getSceneExits(station)[1]).toMatchObject({
      mode: 'station',
      direction: 'east',
      silverCost: 25,
    })
  })

  it('returns empty exits for unknown scenes', () => {
    expect(getSceneExits(asSceneId('scene_999_unknown'))).toEqual([])
  })

  it('canEnter only allows declared adjacent scenes', () => {
    const city = asSceneId('scene_001_village')
    const gate = asSceneId('scene_007_gate')
    const outskirts = asSceneId('scene_002_outskirts')
    const station = asSceneId('scene_006_station')
    const suzhouStation = asSceneId('scene_008_suzhou_station')
    const unknown = asSceneId('scene_999_unknown')

    expect(canEnter(city, gate)).toBe(true)
    expect(canEnter(city, outskirts)).toBe(false)
    expect(canEnter(gate, outskirts)).toBe(true)
    expect(canEnter(station, suzhouStation, emptyProgress)).toBe(false)
    expect(
      canEnter(station, suzhouStation, {
        ...emptyProgress,
        completedQuests: [asQuestId('quest_main_001_first_blood')],
      }),
    ).toBe(true)
    expect(canEnter(city, suzhouStation)).toBe(false)
    expect(canEnter(unknown, city)).toBe(false)
    expect(canEnter(city, unknown)).toBe(false)
  })

  it('returns detailed failure reasons for blocked exits', () => {
    const station = asSceneId('scene_006_station')
    const suzhouStation = asSceneId('scene_008_suzhou_station')

    expect(getEnterFailureReasons(station, suzhouStation, emptyProgress)).toEqual([
      '需要完成任务《初战告捷》',
    ])
    expect(getEnterFailureReasons(station, suzhouStation)).toEqual([])
  })
})
