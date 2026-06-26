/**
 * @module combat/playback
 * @layer engine
 * @description 战斗事件回放：从 BattleEvent 推导展示用 HP/Qi 快照
 * @inputs BattleEvent, CombatantSnapshot
 * @outputs 更新后的 CombatantSnapshot
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { BattleEvent, CombatBuffSnapshot, CombatantSnapshot } from '../../types/battle'
import type { CharacterState } from '../../types/character'

function applyBuffSnapshot(
  activeBuffs: CombatBuffSnapshot[],
  buff: CombatBuffSnapshot,
): CombatBuffSnapshot[] {
  return [...activeBuffs.filter((entry) => entry.buffId !== buff.buffId), buff]
}

function removeBuffSnapshot(
  activeBuffs: CombatBuffSnapshot[],
  buffId: string,
): CombatBuffSnapshot[] {
  return activeBuffs.filter((entry) => entry.buffId !== buffId)
}

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
      activeBuffs: [],
    },
    enemy: {
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      qi: enemy.qi,
      maxQi: enemy.maxQi,
      activeBuffs: [],
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
  const nextHp = (snapshot: CombatantSnapshot, amount: number): CombatantSnapshot => ({
    ...snapshot,
    hp: Math.max(0, snapshot.hp - amount),
  })

  const nextWithBuff = (
    snapshot: CombatantSnapshot,
    buff: CombatBuffSnapshot,
  ): CombatantSnapshot => ({
    ...snapshot,
    activeBuffs: applyBuffSnapshot(snapshot.activeBuffs, buff),
  })

  const nextWithoutBuff = (snapshot: CombatantSnapshot, buffId: string): CombatantSnapshot => ({
    ...snapshot,
    activeBuffs: removeBuffSnapshot(snapshot.activeBuffs, buffId),
  })

  if (event.type === 'DamageDealt') {
    if (event.targetId === playerId) {
      return { player: nextHp(player, event.amount), enemy }
    }

    if (event.targetId === enemyId) {
      return { player, enemy: nextHp(enemy, event.amount) }
    }

    return { player, enemy }
  }

  if (event.type === 'BuffApplied') {
    const buff = {
      buffId: event.buffId,
      buffName: event.buffName,
    }

    if (event.targetId === playerId) {
      return { player: nextWithBuff(player, buff), enemy }
    }

    if (event.targetId === enemyId) {
      return { player, enemy: nextWithBuff(enemy, buff) }
    }

    return { player, enemy }
  }

  if (event.type === 'BuffExpired') {
    if (event.targetId === playerId) {
      return { player: nextWithoutBuff(player, event.buffId), enemy }
    }

    if (event.targetId === enemyId) {
      return { player, enemy: nextWithoutBuff(enemy, event.buffId) }
    }
  }

  return { player, enemy }
}
