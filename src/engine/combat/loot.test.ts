/**
 * @module engine/combat/loot.test
 * @layer engine
 * @description loot 测试：验证熟练度奖励按技能使用次数与胜负计算
 * @inputs loot
 * @outputs 测试断言
 * @depends test, engine/combat, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { calcProficiencyGains } from './loot'
import { asMoveId, asSkillId } from '../../types/id'
import type { BattleEvent } from '../../types/battle'

const playerId = 'player_001'
const enemyId = 'enemy_001'

describe('calcProficiencyGains', () => {
  const events: BattleEvent[] = [
    {
      type: 'SkillExecuted',
      actorId: playerId,
      skillId: asSkillId('skill_sword_010_qingmang'),
      moveId: asMoveId('move_qingmang_01'),
    },
    {
      type: 'SkillExecuted',
      actorId: playerId,
      skillId: asSkillId('skill_sword_010_qingmang'),
      moveId: asMoveId('move_qingmang_01'),
    },
    {
      type: 'SkillExecuted',
      actorId: enemyId,
      skillId: asSkillId('skill_sword_013_songfeng'),
      moveId: asMoveId('move_songfeng_01'),
    },
  ]

  it('counts only player SkillExecuted events', () => {
    const gains = calcProficiencyGains(events, playerId, enemyId)
    expect(gains).toEqual([
      { skillId: asSkillId('skill_sword_010_qingmang'), amount: 2 },
    ])
  })

  it('adds victory bonus when player wins', () => {
    const gains = calcProficiencyGains(events, playerId, playerId)
    expect(gains).toEqual([
      { skillId: asSkillId('skill_sword_010_qingmang'), amount: 3 },
    ])
  })

  it('returns empty array when no player SkillExecuted events', () => {
    const gains = calcProficiencyGains(
      [{ type: 'BattleEnded', winnerId: playerId }],
      playerId,
      playerId,
    )
    expect(gains).toEqual([])
  })
})
