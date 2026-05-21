/**
 * @module combat/loot
 * @layer engine
 * @description 战斗结算熟练度增益（玩家招式使用次数 + 胜利加成）
 * @inputs BattleEvent[], playerId, winnerId
 * @outputs ProficiencyGain[]
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { BattleEvent, ProficiencyGain } from '../../types/battle'
import type { SkillId } from '../../types/id'

const VICTORY_BONUS = 1

export function calcProficiencyGains(
  events: BattleEvent[],
  playerId: string,
  winnerId: string,
): ProficiencyGain[] {
  const counts = new Map<SkillId, number>()
  const isVictory = winnerId === playerId

  for (const event of events) {
    if (event.type !== 'SkillExecuted' || event.actorId !== playerId) {
      continue
    }
    const current = counts.get(event.skillId) ?? 0
    counts.set(event.skillId, current + 1)
  }

  return [...counts.entries()]
    .map(([skillId, count]) => ({
      skillId,
      amount: count + (isVictory ? VICTORY_BONUS : 0),
    }))
    .filter((entry) => entry.amount > 0)
}
