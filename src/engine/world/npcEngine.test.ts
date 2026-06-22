/**
 * @module engine/world/npcEngine.test
 * @layer engine
 * @description npcEngine 测试：验证 NPC 按场景查询
 * @inputs npcEngine
 * @outputs 测试断言
 * @depends test, engine/world, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { listNpcsByScene } from './npcEngine'
import { asSceneId } from '../../types/id'

describe('npcEngine', () => {
  it('lists village swordsman in newbie village', () => {
    const npcs = listNpcsByScene(asSceneId('scene_001_village'))
    expect(npcs).toHaveLength(3)
    expect(npcs[0]?.name).toBe('村口剑客')
  })

  it('returns empty list for outskirts', () => {
    expect(listNpcsByScene('scene_002_outskirts')).toEqual([])
  })
})
