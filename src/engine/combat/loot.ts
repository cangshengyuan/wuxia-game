/**
 * @module combat/loot
 * @layer engine
 * @description 战斗结算熟练度增益（M2 占位：按招式执行次数 × 1）
 * @inputs BattleEvent[]
 * @outputs ProficiencyGain[]
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { BattleEvent, ProficiencyGain } from '../../types/battle'
import type { SkillId } from '../../types/id'

export function calcProficiencyGains(events: BattleEvent[]): ProficiencyGain[] {
  const counts = new Map<SkillId, number>()

  for (const event of events) {
    if (event.type !== 'SkillExecuted') {
      continue
    }
    const current = counts.get(event.skillId) ?? 0
    counts.set(event.skillId, current + 1)
  }

  return [...counts.entries()].map(([skillId, count]) => ({
    skillId,
    amount: count,
  }))
}
