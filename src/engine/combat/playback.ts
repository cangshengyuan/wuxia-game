/**
 * @module combat/playback
 * @layer engine
 * @description 战斗事件回放：从 BattleEvent 推导展示用 HP/Qi 快照
 * @inputs BattleEvent, CombatantSnapshot
 * @outputs 更新后的 CombatantSnapshot
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { BattleEvent, CombatantSnapshot } from '../../types/battle'
import type { CharacterState } from '../../types/character'

export function createSnapshotsFromCombatants(
  player: CharacterState,
  enemy: CharacterState,
): { player: CombatantSnapshot; enemy: CombatantSnapshot } {
  return {
    player: {
      hp: player.hp,
      maxHp: player.maxHp,
      qi: player.qi,
      maxQi: player.maxQi,
    },
    enemy: {
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      qi: enemy.qi,
      maxQi: enemy.maxQi,
    },
  }
}

export function applyEventToSnapshots(
  event: BattleEvent,
  playerId: string,
  enemyId: string,
  player: CombatantSnapshot,
  enemy: CombatantSnapshot,
): { player: CombatantSnapshot; enemy: CombatantSnapshot } {
  if (event.type !== 'DamageDealt') {
    return { player, enemy }
  }

  const nextHp = (snapshot: CombatantSnapshot, amount: number): CombatantSnapshot => ({
    ...snapshot,
    hp: Math.max(0, snapshot.hp - amount),
  })

  if (event.targetId === playerId) {
    return { player: nextHp(player, event.amount), enemy }
  }

  if (event.targetId === enemyId) {
    return { player, enemy: nextHp(enemy, event.amount) }
  }

  return { player, enemy }
}
