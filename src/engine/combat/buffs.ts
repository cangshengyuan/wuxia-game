/**
 * @module combat/buffs
 * @layer engine
 * @description 战斗内临时状态：负责 buff/debuff 的挂载、过期与数值聚合
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { BuffAppliedEvent, BuffExpiredEvent } from '../../types/battle'
import type { MoveId, SkillId } from '../../types/id'
import type { SkillBuffDefinition, SkillBuffModifiers } from '../../types/skill'

export interface ActiveBuff {
  instanceId: string
  ownerId: string
  sourceId: string
  skillId: SkillId
  moveId: MoveId
  buffId: string
  buffName: string
  appliedAt: number
  expireAt: number
  modifiers: SkillBuffModifiers
}

interface BuffState {
  activeByOwner: Map<string, ActiveBuff[]>
  nextInstanceId: number
}

export interface BuffContext {
  ownerId: string
  sourceId: string
  skillId: SkillId
  moveId: MoveId
  currentTime: number
}

export interface AggregatedBuffModifiers {
  outgoingDamageFlat: number
  outgoingDamagePercent: number
  incomingDamageFlat: number
  incomingDamagePercent: number
  hitChance: number
  dodgeChance: number
  speedFlat: number
  speedPercent: number
  qiCostFlat: number
  qiCostPercent: number
  stunned: boolean
}

function createEmptyModifiers(): AggregatedBuffModifiers {
  return {
    outgoingDamageFlat: 0,
    outgoingDamagePercent: 0,
    incomingDamageFlat: 0,
    incomingDamagePercent: 0,
    hitChance: 0,
    dodgeChance: 0,
    speedFlat: 0,
    speedPercent: 0,
    qiCostFlat: 0,
    qiCostPercent: 0,
    stunned: false,
  }
}

function cloneModifiers(modifiers: SkillBuffModifiers): SkillBuffModifiers {
  return { ...modifiers }
}

function nextInstanceId(state: BuffState): string {
  state.nextInstanceId += 1
  return `buff_${state.nextInstanceId}`
}

function getBuffs(state: BuffState, ownerId: string): ActiveBuff[] {
  return state.activeByOwner.get(ownerId) ?? []
}

function setBuffs(state: BuffState, ownerId: string, buffs: ActiveBuff[]): void {
  if (buffs.length === 0) {
    state.activeByOwner.delete(ownerId)
    return
  }
  state.activeByOwner.set(ownerId, buffs)
}

function upsertBuff(state: BuffState, ownerId: string, buff: ActiveBuff): void {
  const current = getBuffs(state, ownerId)
  const next = current.filter((entry) => entry.buffId !== buff.buffId)
  next.push(buff)
  setBuffs(state, ownerId, next)
}

export function createBuffState(): BuffState {
  return {
    activeByOwner: new Map(),
    nextInstanceId: 0,
  }
}

export function applyBuff(
  state: BuffState,
  context: BuffContext,
  buff: SkillBuffDefinition,
): BuffAppliedEvent {
  const expireAt = context.currentTime + buff.duration
  const activeBuff: ActiveBuff = {
    instanceId: nextInstanceId(state),
    ownerId: context.ownerId,
    sourceId: context.sourceId,
    skillId: context.skillId,
    moveId: context.moveId,
    buffId: buff.id,
    buffName: buff.name,
    appliedAt: context.currentTime,
    expireAt,
    modifiers: cloneModifiers(buff.modifiers),
  }

  upsertBuff(state, context.ownerId, activeBuff)

  return {
    type: 'BuffApplied',
    sourceId: context.sourceId,
    targetId: context.ownerId,
    buffId: buff.id,
    buffName: buff.name,
    duration: buff.duration,
    modifiers: cloneModifiers(buff.modifiers),
    moveId: context.moveId,
  }
}

export function expireBuffsAtTime(
  state: BuffState,
  currentTime: number,
): BuffExpiredEvent[] {
  const events: BuffExpiredEvent[] = []

  for (const [ownerId, buffs] of state.activeByOwner.entries()) {
    const active = buffs.filter((buff) => buff.expireAt > currentTime)
    const expired = buffs.filter((buff) => buff.expireAt <= currentTime)

    for (const buff of expired) {
      events.push({
        type: 'BuffExpired',
        targetId: ownerId,
        buffId: buff.buffId,
        buffName: buff.buffName,
      })
    }

    setBuffs(state, ownerId, active)
  }

  return events
}

export function getModifiersAtTime(
  state: BuffState,
  ownerId: string,
  currentTime: number,
): AggregatedBuffModifiers {
  const buffs = getBuffs(state, ownerId).filter((buff) => buff.expireAt > currentTime)
  const totals = createEmptyModifiers()

  for (const buff of buffs) {
    totals.outgoingDamageFlat += buff.modifiers.outgoingDamageFlat ?? 0
    totals.outgoingDamagePercent += buff.modifiers.outgoingDamagePercent ?? 0
    totals.incomingDamageFlat += buff.modifiers.incomingDamageFlat ?? 0
    totals.incomingDamagePercent += buff.modifiers.incomingDamagePercent ?? 0
    totals.hitChance += buff.modifiers.hitChance ?? 0
    totals.dodgeChance += buff.modifiers.dodgeChance ?? 0
    totals.speedFlat += buff.modifiers.speedFlat ?? 0
    totals.speedPercent += buff.modifiers.speedPercent ?? 0
    totals.qiCostFlat += buff.modifiers.qiCostFlat ?? 0
    totals.qiCostPercent += buff.modifiers.qiCostPercent ?? 0
    totals.stunned = totals.stunned || buff.modifiers.stunned === true
  }

  return totals
}

export function getLatestStunExpireAt(
  state: BuffState,
  ownerId: string,
  currentTime: number,
): number | undefined {
  const stunBuffs = getBuffs(state, ownerId).filter(
    (buff) => buff.expireAt > currentTime && buff.modifiers.stunned === true,
  )
  if (stunBuffs.length === 0) {
    return undefined
  }

  return Math.max(...stunBuffs.map((buff) => buff.expireAt))
}
