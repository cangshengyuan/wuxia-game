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
  })

  it('outskirts scene references enemies', () => {
    const scene = getSceneById('scene_002_outskirts')
    expect(scene?.encounters.length).toBe(3)
    expect(scene?.encounters[0]?.enemyId).toBeDefined()
  })
})
