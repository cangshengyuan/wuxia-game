import { describe, expect, it } from 'vitest'
import { listNpcsByScene } from './npcEngine'
import { asSceneId } from '../../types/id'

describe('npcEngine', () => {
  it('lists village swordsman in newbie village', () => {
    const npcs = listNpcsByScene(asSceneId('scene_001_village'))
    expect(npcs).toHaveLength(1)
    expect(npcs[0]?.name).toBe('村口剑客')
  })

  it('returns empty list for outskirts', () => {
    expect(listNpcsByScene('scene_002_outskirts')).toEqual([])
  })
})
