import type { BattleSnapshot } from '../types/battle'
import type { CharacterState } from '../types/character'
import { getSkillById } from './skillEngine'

export function createInitialBattleState(
  player: CharacterState,
  enemy: CharacterState,
): BattleSnapshot {
  return {
    turn: 1,
    playerHp: player.hp,
    enemyHp: enemy.hp,
  }
}

export function simulateOneTurn(
  snapshot: BattleSnapshot,
  player: CharacterState,
  enemy: CharacterState,
): BattleSnapshot {
  const primarySkillId = player.equippedSkillIds[0]
  const skill = primarySkillId ? getSkillById(primarySkillId) : undefined
  const move = skill?.moves[0]

  const baseDamage = player.attributes.armStrength * 2
  const skillDamage = move ? Math.round(baseDamage * move.powerRatio) : baseDamage
  const nextEnemyHp = Math.max(0, snapshot.enemyHp - skillDamage)

  return {
    turn: snapshot.turn + 1,
    playerHp: snapshot.playerHp,
    enemyHp: nextEnemyHp,
    lastAction: {
      actorId: player.id,
      targetId: enemy.id,
      skillId: skill?.id ?? 'skill_basic_000_unarmed',
      moveId: move?.id ?? 'move_basic_000_punch',
      damage: skillDamage,
    },
  }
}
