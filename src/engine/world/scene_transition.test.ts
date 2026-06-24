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
import { canEnter, getSceneExits } from './scene_transition'
import { asSceneId } from '../../types/id'

describe('scene_transition', () => {
  it('returns bidirectional exits between village and outskirts', () => {
    const village = asSceneId('scene_001_village')
    const outskirts = asSceneId('scene_002_outskirts')

    expect(getSceneExits(village)).toEqual([outskirts])
    expect(getSceneExits(outskirts)).toEqual([village])
  })

  it('returns empty exits for unknown scenes', () => {
    expect(getSceneExits(asSceneId('scene_999_unknown'))).toEqual([])
  })

  it('canEnter only allows declared adjacent scenes', () => {
    const a = asSceneId('scene_001_village')
    const b = asSceneId('scene_002_outskirts')
    const c = asSceneId('scene_999_unknown')

    expect(canEnter(a, b)).toBe(true)
    expect(canEnter(b, a)).toBe(true)
    expect(canEnter(c, a)).toBe(false)
    expect(canEnter(a, c)).toBe(false)
  })
})
