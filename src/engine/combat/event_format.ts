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
import type { SkillBuffModifiers } from '../../types/skill'

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

function describeBuffModifiers(modifiers: SkillBuffModifiers): string {
  const labels: string[] = []

  if (typeof modifiers.outgoingDamagePercent === 'number' && modifiers.outgoingDamagePercent !== 0) {
    labels.push(`伤害${modifiers.outgoingDamagePercent > 0 ? '+' : ''}${Math.round(modifiers.outgoingDamagePercent * 100)}%`)
  }
  if (typeof modifiers.incomingDamagePercent === 'number' && modifiers.incomingDamagePercent !== 0) {
    labels.push(`承伤${modifiers.incomingDamagePercent > 0 ? '+' : ''}${Math.round(modifiers.incomingDamagePercent * 100)}%`)
  }
  if (typeof modifiers.speedPercent === 'number' && modifiers.speedPercent !== 0) {
    labels.push(`速度${modifiers.speedPercent > 0 ? '+' : ''}${Math.round(modifiers.speedPercent * 100)}%`)
  }
  if (typeof modifiers.qiCostPercent === 'number' && modifiers.qiCostPercent !== 0) {
    labels.push(`耗气${modifiers.qiCostPercent > 0 ? '+' : ''}${Math.round(modifiers.qiCostPercent * 100)}%`)
  }
  if (typeof modifiers.hitChance === 'number' && modifiers.hitChance !== 0) {
    labels.push(`命中${modifiers.hitChance > 0 ? '+' : ''}${Math.round(modifiers.hitChance * 100)}%`)
  }
  if (typeof modifiers.dodgeChance === 'number' && modifiers.dodgeChance !== 0) {
    labels.push(`闪避${modifiers.dodgeChance > 0 ? '+' : ''}${Math.round(modifiers.dodgeChance * 100)}%`)
  }
  if (modifiers.stunned === true) {
    labels.push('眩晕')
  }

  return labels.join('，')
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
    case 'AttackMissed':
      return `${resolveActorName(event.sourceId)} 的攻击被 ${resolveActorName(event.targetId)} 闪开`
    case 'BuffApplied': {
      const modifierText = describeBuffModifiers(event.modifiers)
      return `${resolveActorName(event.sourceId)} 令 ${resolveActorName(event.targetId)} 获得【${event.buffName}】${modifierText ? `（${modifierText}，持续 ${event.duration}）` : `（持续 ${event.duration}）`}`
    }
    case 'BuffExpired':
      return `${resolveActorName(event.targetId)} 的【${event.buffName}】结束`
    case 'BattleEnded':
      return `战斗结束，${resolveActorName(event.winnerId)} 获胜`
    default:
      return '未知事件'
  }
}
