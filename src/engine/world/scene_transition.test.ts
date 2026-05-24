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

  it('canEnter always returns true in M5', () => {
    const a = asSceneId('scene_001_village')
    const b = asSceneId('scene_002_outskirts')
    const c = asSceneId('scene_999_unknown')

    expect(canEnter(a, b)).toBe(true)
    expect(canEnter(b, a)).toBe(true)
    expect(canEnter(c, a)).toBe(true)
  })
})
