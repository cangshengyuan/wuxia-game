/**
 * @module engine/combat/event_format.test
 * @layer engine
 * @description event_format 测试：验证战斗事件文案格式化输出
 * @inputs event_format
 * @outputs 测试断言
 * @depends test, engine/combat, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { asMoveId, asSkillId } from '../../types/id'
import { formatBattleEvent } from './event_format'

describe('event_format', () => {
  it('formats SkillReady with move name', () => {
    const message = formatBattleEvent({
      type: 'SkillReady',
      actorId: 'player_001',
      skillId: asSkillId('skill_sword_010_qingmang'),
      moveId: asMoveId('move_qingmang_01'),
      triggerAt: 12,
    })

    expect(message).toContain('玩家')
    expect(message).toContain('t=12')
  })

  it('formats DamageDealt', () => {
    const message = formatBattleEvent({
      type: 'DamageDealt',
      sourceId: 'player_001',
      targetId: 'enemy_001_bandit_grunt',
      amount: 18,
    })

    expect(message).toBe('玩家 对 敌人 造成 18 点伤害')
  })

  it('formats BattleEnded', () => {
    const message = formatBattleEvent({
      type: 'BattleEnded',
      winnerId: 'player_001',
    })

    expect(message).toBe('战斗结束，玩家 获胜')
  })

  it('formats BuffApplied', () => {
    const message = formatBattleEvent({
      type: 'BuffApplied',
      sourceId: 'player_001',
      targetId: 'player_001',
      buffId: 'buff_huntuan_inner_breath',
      buffName: '混元内息',
      duration: 150,
      modifiers: {
        outgoingDamagePercent: 0.25,
        qiCostPercent: -0.4,
      },
      moveId: asMoveId('move_huntuan_01'),
    })

    expect(message).toContain('混元内息')
    expect(message).toContain('伤害+25%')
    expect(message).toContain('耗气-40%')
  })
})
