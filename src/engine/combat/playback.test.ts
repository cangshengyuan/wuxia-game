/**
 * @module engine/combat/playback.test
 * @layer engine
 * @description playback 测试：验证战斗事件对快照的回放效果
 * @inputs playback
 * @outputs 测试断言
 * @depends test, engine/combat, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { asMoveId, asSkillId } from '../../types/id'
import { applyEventToSnapshots, createSnapshotsFromCombatants } from './playback'
import type { CharacterState } from '../../types/character'

const player: CharacterState = {
  id: 'player_001',
  name: '无名侠客',
  level: 1,
  hp: 120,
  maxHp: 120,
  qi: 60,
  maxQi: 60,
  attributes: { armStrength: 14, agility: 12, constitution: 13 },
  learnedSkills: [],
  speed: 12,
  equippedSkillIds: [asSkillId('skill_sword_010_qingmang')],
}

const enemy: CharacterState = {
  id: 'enemy_001_bandit_grunt',
  name: '山贼喽啰',
  level: 1,
  hp: 96,
  maxHp: 96,
  qi: 30,
  maxQi: 30,
  attributes: { armStrength: 10, agility: 9, constitution: 10 },
  learnedSkills: [],
  speed: 9,
  equippedSkillIds: [],
}

describe('playback', () => {
  it('creates snapshots from combatants', () => {
    const snapshots = createSnapshotsFromCombatants(player, enemy)
    expect(snapshots.player).toEqual({
      hp: 120,
      maxHp: 120,
      qi: 60,
      maxQi: 60,
      activeBuffs: [],
    })
    expect(snapshots.enemy).toEqual({
      hp: 96,
      maxHp: 96,
      qi: 30,
      maxQi: 30,
      activeBuffs: [],
    })
  })

  it('applies DamageDealt to target snapshot', () => {
    const { player: playerSnapshot, enemy: enemySnapshot } = createSnapshotsFromCombatants(
      player,
      enemy,
    )

    const next = applyEventToSnapshots(
      {
        type: 'DamageDealt',
        sourceId: player.id,
        targetId: enemy.id,
        amount: 20,
      },
      player.id,
      enemy.id,
      playerSnapshot,
      enemySnapshot,
    )

    expect(next.enemy.hp).toBe(76)
    expect(next.player.hp).toBe(120)
  })

  it('ignores non-damage events', () => {
    const { player: playerSnapshot, enemy: enemySnapshot } = createSnapshotsFromCombatants(
      player,
      enemy,
    )

    const next = applyEventToSnapshots(
      {
        type: 'SkillReady',
        actorId: player.id,
        skillId: asSkillId('skill_sword_010_qingmang'),
        moveId: asMoveId('move_qingmang_01'),
        triggerAt: 10,
      },
      player.id,
      enemy.id,
      playerSnapshot,
      enemySnapshot,
    )

    expect(next).toEqual({ player: playerSnapshot, enemy: enemySnapshot })
  })

  it('tracks buff apply and expire on snapshots', () => {
    const { player: playerSnapshot, enemy: enemySnapshot } = createSnapshotsFromCombatants(
      player,
      enemy,
    )

    const withBuff = applyEventToSnapshots(
      {
        type: 'BuffApplied',
        sourceId: player.id,
        targetId: enemy.id,
        buffId: 'buff_armor_break',
        buffName: '裂甲',
        duration: 120,
        modifiers: { incomingDamagePercent: 0.15 },
      },
      player.id,
      enemy.id,
      playerSnapshot,
      enemySnapshot,
    )

    expect(withBuff.enemy.activeBuffs).toEqual([
      {
        buffId: 'buff_armor_break',
        buffName: '裂甲',
        modifiers: { incomingDamagePercent: 0.15 },
      },
    ])

    const expired = applyEventToSnapshots(
      {
        type: 'BuffExpired',
        targetId: enemy.id,
        buffId: 'buff_armor_break',
        buffName: '裂甲',
      },
      player.id,
      enemy.id,
      withBuff.player,
      withBuff.enemy,
    )

    expect(expired.enemy.activeBuffs).toEqual([])
  })

  it('deducts qi immediately on SkillExecuted with active buff modifiers', () => {
    const { player: playerSnapshot, enemy: enemySnapshot } = createSnapshotsFromCombatants(
      player,
      enemy,
    )

    const withDiscountBuff = applyEventToSnapshots(
      {
        type: 'BuffApplied',
        sourceId: player.id,
        targetId: player.id,
        buffId: 'buff_huntuan_inner_breath',
        buffName: '混元内息',
        duration: 120,
        modifiers: { qiCostPercent: -0.4 },
        moveId: asMoveId('move_huntuan_01'),
      },
      player.id,
      enemy.id,
      playerSnapshot,
      enemySnapshot,
    )

    const next = applyEventToSnapshots(
      {
        type: 'SkillExecuted',
        actorId: player.id,
        skillId: asSkillId('skill_sword_010_qingmang'),
        moveId: asMoveId('move_qingmang_01'),
      },
      player.id,
      enemy.id,
      withDiscountBuff.player,
      withDiscountBuff.enemy,
    )

    expect(next.player.qi).toBe(54)
  })
})
