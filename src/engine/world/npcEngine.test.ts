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
  it('lists the city swordsman in hangzhou city hub', () => {
    const npcs = listNpcsByScene(asSceneId('scene_001_village'))
    expect(npcs).toHaveLength(1)
    expect(npcs[0]?.name).toBe('城门剑客')
  })

  it('finds trainer and hermit in their dedicated poi scenes', () => {
    expect(listNpcsByScene('scene_005_dojo')[0]?.name).toBe('武馆教头')
    expect(listNpcsByScene('scene_004_clinic')[0]?.name).toBe('隐居异士')
  })
})
