/**
 * @module engine/config/gameConfig.test
 * @layer engine
 * @description gameConfig 测试：验证默认开局与平衡配置来自 data
 * @inputs gameConfig, sceneEngine, enemyEngine, skillEngine
 * @outputs 测试断言
 * @depends test, engine/config, engine/world, engine/skillEngine
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import {
  createDefaultPlayerState,
  getDefaultBattleEnemyId,
  getDefaultSceneId,
  getGameBalanceConfig,
} from './gameConfig'
import { getSkillById } from '../skillEngine'
import { getEnemyById } from '../world/enemyEngine'
import { getSceneById } from '../world/sceneEngine'

describe('gameConfig', () => {
  it('loads default start scene and battle enemy from config data', () => {
    expect(getSceneById(getDefaultSceneId())?.name).toBe('主城新手村')
    expect(getEnemyById(getDefaultBattleEnemyId())?.name).toBe('山贼喽啰')
  })

  it('builds a default player whose skills exist in the catalog', () => {
    const player = createDefaultPlayerState()

    expect(player.name).toBe('无名侠客')
    expect(player.learnedSkills).toHaveLength(2)
    expect(player.learnedSkills.every((runtime) => getSkillById(runtime.skillId))).toBe(true)
  })

  it('exposes formation balance from config data', () => {
    expect(getGameBalanceConfig().formation).toEqual({
      highTierMinRealm: 2,
      maxExternalSkills: 2,
    })
  })
})
