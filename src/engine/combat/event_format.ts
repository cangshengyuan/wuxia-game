/**
 * @module combat/event_format
 * @layer engine
 * @description 将 BattleEvent 格式化为战报文案
 * @inputs BattleEvent
 * @outputs string
 * @depends skillEngine, types
 * @forbidden 禁止 import React、禁止访问 store
 */
import { getMoveById, getSkillById } from '../skillEngine'
import type { BattleEvent } from '../../types/battle'

function resolveActorName(actorId: string): string {
  if (actorId.startsWith('player')) {
    return '玩家'
  }
  if (actorId.startsWith('enemy')) {
    return '敌人'
  }
  return actorId
}

function resolveMoveName(skillId: string, moveId: string): string {
  const found = getMoveById(moveId)
  if (found) {
    return found.move.name
  }
  const skill = getSkillById(skillId)
  return skill?.name ?? moveId
}

export function formatBattleEvent(event: BattleEvent): string {
  switch (event.type) {
    case 'SkillReady': {
      const moveName = resolveMoveName(event.skillId, event.moveId)
      return `${resolveActorName(event.actorId)} 准备 ${moveName}（t=${event.triggerAt}）`
    }
    case 'SkillExecuted': {
      const moveName = resolveMoveName(event.skillId, event.moveId)
      return `${resolveActorName(event.actorId)} 施展 ${moveName}`
    }
    case 'DamageDealt':
      return `${resolveActorName(event.sourceId)} 对 ${resolveActorName(event.targetId)} 造成 ${event.amount} 点伤害`
    case 'BattleEnded':
      return `战斗结束，${resolveActorName(event.winnerId)} 获胜`
    default:
      return '未知事件'
  }
}
