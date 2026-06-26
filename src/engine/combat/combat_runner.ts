/**
 * @module combat/combat_runner
 * @layer engine
 * @description 时间轴战斗主循环：多功法入队 + scoped 事件总线 + 优先队列
 * @inputs player, enemy, rng?
 * @outputs BattleResult
 * @depends event_bus, priority_queue, damage_calc, loot, skillEngine, skill_relation_engine, util/rng
 * @forbidden 禁止 import React、禁止访问 store
 */
import { createScopedBus } from '../event_bus'
import { getSynergySources } from '../skill_relation_engine'
import { getMoveById, getSkillById } from '../skillEngine'
import { createSeededRng, type Rng } from '../util/rng'
import {
  applyBuff,
  createBuffState,
  expireBuffsAtTime,
  getLatestStunExpireAt,
  getModifiersAtTime,
} from './buffs'
import { calcDamage } from './damage_calc'
import { calcProficiencyGains } from './loot'
import { PriorityQueue } from './priority_queue'
import type { QueuePayload } from './types'
import type { BattleEvent, BattleResult } from '../../types/battle'
import type { CharacterState, SkillRuntime } from '../../types/character'
import type { ApplyBuffEffect, SkillMove } from '../../types/skill'
import type { SkillId } from '../../types/id'

const MAX_TICKS = 10_000

interface CombatantState {
  id: string
  hp: number
  qi: number
  speed: number
  source: CharacterState
}

export interface StartBattleInput {
  player: CharacterState
  enemy: CharacterState
  rng?: Rng
}

let scheduleCounter = 0

function nextScheduleId(actorId: string): string {
  scheduleCounter += 1
  return `${actorId}-${scheduleCounter}`
}

function cloneCombatant(character: CharacterState): CombatantState {
  return {
    id: character.id,
    hp: character.hp,
    qi: character.qi,
    speed: character.speed,
    source: character,
  }
}

function getEquippedSkillIds(character: CharacterState): SkillId[] {
  if (character.formation) {
    return [
      ...character.formation.external,
      ...(character.formation.internal ? [character.formation.internal] : []),
      ...(character.formation.qinggong ? [character.formation.qinggong] : []),
      ...(character.formation.hard ? [character.formation.hard] : []),
    ]
  }
  return character.equippedSkillIds
}

function getRuntime(character: CharacterState, skillId: SkillId): SkillRuntime | undefined {
  return character.learnedSkills.find((entry) => entry.skillId === skillId)
}

function resolveUnlockedMoves(character: CharacterState, skillId: SkillId): SkillMove[] {
  const skill = getSkillById(skillId)
  if (!skill) {
    return []
  }
  const runtime = getRuntime(character, skillId)
  if (!runtime) {
    return skill.moves.filter((move) => move.unlockProficiency === 0)
  }
  return skill.moves.filter(
    (move) => runtime.unlockedMoveIds.includes(move.id) || move.unlockProficiency === 0,
  )
}

function resolveSkillChoice(
  character: CharacterState,
  skillId: SkillId,
  currentQi: number,
  rng: Rng,
  currentTime: number,
  buffState: ReturnType<typeof createBuffState>,
): SkillMove | undefined {
  const moves = resolveUnlockedMoves(character, skillId)
  if (moves.length === 0) {
    return undefined
  }

  const moveCosts = moves.map((move) => ({
    move,
    cost: getModifiedQiCost(move, character.id, currentTime, buffState),
  }))
  const affordable = moveCosts
    .filter((entry) => entry.cost <= currentQi)
    .map((entry) => entry.move)
  const cheapestMove = [...moveCosts].sort((left, right) => left.cost - right.cost)[0]?.move
  if (affordable.length === 0) {
    return cheapestMove
  }

  const strongestMove = [...affordable].sort((left, right) => right.powerRatio - left.powerRatio)[0]
  const runtime = getRuntime(character, skillId)
  const finisherChance = Math.min(0.25 + ((runtime?.realmLevel ?? 1) - 1) * 0.08, 0.6)

  if (strongestMove && strongestMove !== cheapestMove && rng.next() < finisherChance) {
    return strongestMove
  }
  return cheapestMove
}

function calcTriggerDelay(move: SkillMove, speed: number): number {
  return Math.max(1, move.cd * (100 / speed))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getModifiedQiCost(move: SkillMove, actorId: string, currentTime: number, buffState: ReturnType<typeof createBuffState>): number {
  const modifiers = getModifiersAtTime(buffState, actorId, currentTime)
  return Math.max(
    0,
    Math.round(move.qiCost * (1 + modifiers.qiCostPercent) + modifiers.qiCostFlat),
  )
}

function getModifiedSpeed(
  baseSpeed: number,
  actorId: string,
  currentTime: number,
  buffState: ReturnType<typeof createBuffState>,
): number {
  const modifiers = getModifiersAtTime(buffState, actorId, currentTime)
  return Math.max(1, Math.round(baseSpeed * (1 + modifiers.speedPercent) + modifiers.speedFlat))
}

function getDamageMultiplier(character: CharacterState, skillId: SkillId): number {
  return getSynergySources(skillId).reduce((multiplier, relation) => {
    const sourceRuntime = getRuntime(character, relation.sourceSkillId)
    if (!sourceRuntime || sourceRuntime.proficiency < relation.requiredProficiency) {
      return multiplier
    }
    return multiplier * relation.damageMultiplier
  }, 1)
}

function getBuffEffects(move: SkillMove, target: 'self' | 'target'): ApplyBuffEffect[] {
  return (move.effects ?? []).filter(
    (effect): effect is ApplyBuffEffect => effect.kind === 'applyBuff' && effect.target === target,
  )
}

function applyDamageModifiers(
  baseDamage: number,
  attackerId: string,
  defenderId: string,
  currentTime: number,
  buffState: ReturnType<typeof createBuffState>,
): number {
  if (baseDamage <= 0) {
    return 0
  }

  const attackerModifiers = getModifiersAtTime(buffState, attackerId, currentTime)
  const defenderModifiers = getModifiersAtTime(buffState, defenderId, currentTime)
  const withFlatBonuses =
    baseDamage + attackerModifiers.outgoingDamageFlat + defenderModifiers.incomingDamageFlat
  const withOutgoingPercent = withFlatBonuses * (1 + attackerModifiers.outgoingDamagePercent)
  const withIncomingPercent = withOutgoingPercent * (1 + defenderModifiers.incomingDamagePercent)

  return Math.max(1, Math.round(withIncomingPercent))
}

function calcHitChance(
  attacker: CombatantState,
  defender: CombatantState,
  currentTime: number,
  buffState: ReturnType<typeof createBuffState>,
): number {
  const attackerModifiers = getModifiersAtTime(buffState, attacker.id, currentTime)
  const defenderModifiers = getModifiersAtTime(buffState, defender.id, currentTime)
  const baseHitChance =
    0.9 + (attacker.source.attributes.agility - defender.source.attributes.agility) * 0.015

  return clamp(
    baseHitChance + attackerModifiers.hitChance - defenderModifiers.dodgeChance,
    0.05,
    0.98,
  )
}

export function startBattle({
  player,
  enemy,
  rng = createSeededRng(0),
}: StartBattleInput): BattleResult {
  scheduleCounter = 0
  const bus = createScopedBus()
  const buffState = createBuffState()
  const queue = new PriorityQueue()
  const events: BattleEvent[] = []
  const combatants = new Map<string, CombatantState>([
    [player.id, cloneCombatant(player)],
    [enemy.id, cloneCombatant(enemy)],
  ])

  let currentTime = 0
  let battleEnded = false
  let winnerId = ''

  const recordEmit = (event: BattleEvent): void => {
    events.push(event)
    bus.emit(event)
  }

  const scheduleSkill = (
    actor: CombatantState,
    payload: QueuePayload,
    move: SkillMove,
    atTime: number,
  ): void => {
    queue.push({
      id: nextScheduleId(actor.id),
      triggerAt:
        atTime +
        calcTriggerDelay(move, getModifiedSpeed(actor.speed, actor.id, atTime, buffState)),
      payload,
    })
  }

  const schedulePayloadAt = (payload: QueuePayload, triggerAt: number): void => {
    queue.push({
      id: nextScheduleId(payload.actorId),
      triggerAt,
      payload,
    })
  }

  const endBattle = (winner: string): void => {
    if (battleEnded) {
      return
    }
    battleEnded = true
    winnerId = winner
    recordEmit({ type: 'BattleEnded', winnerId: winner })
  }

  const enqueueInitial = (actor: CombatantState, targetId: string): void => {
    for (const skillId of getEquippedSkillIds(actor.source)) {
      const move = resolveSkillChoice(actor.source, skillId, actor.qi, rng, currentTime, buffState)
      if (!move) {
        continue
      }
      scheduleSkill(actor, { actorId: actor.id, targetId, skillId }, move, currentTime)
    }
  }

  enqueueInitial(combatants.get(player.id)!, enemy.id)
  enqueueInitial(combatants.get(enemy.id)!, player.id)

  bus.on('SkillReady', (event) => {
    if (battleEnded) {
      return
    }

    const actor = combatants.get(event.actorId)
    const target = combatants.get(
      event.actorId === player.id ? enemy.id : player.id,
    )
    const move = getMoveById(event.moveId)?.move
    if (!actor || !target || !move) {
      return
    }

    const payload: QueuePayload = {
      actorId: event.actorId,
      targetId: target.id,
      skillId: event.skillId,
    }

    const qiCost = getModifiedQiCost(move, actor.id, currentTime, buffState)
    if (actor.qi < qiCost) {
      scheduleSkill(actor, payload, move, currentTime)
      return
    }

    actor.qi -= qiCost
    recordEmit({
      type: 'SkillExecuted',
      actorId: event.actorId,
      skillId: event.skillId,
      moveId: event.moveId,
    })

    for (const effect of getBuffEffects(move, 'self')) {
      if (effect.chance !== undefined && rng.next() > effect.chance) {
        continue
      }
      recordEmit(
        applyBuff(
          buffState,
          {
            ownerId: actor.id,
            sourceId: actor.id,
            skillId: event.skillId,
            moveId: event.moveId,
            currentTime,
          },
          effect.buff,
        ),
      )
    }

    const baseDamage = calcDamage({
      attacker: actor.source,
      defender: target.source,
      move,
      damageMultiplier: getDamageMultiplier(actor.source, event.skillId),
    }).amount
    const hasTargetEffects = getBuffEffects(move, 'target').length > 0
    const requiresHitCheck = baseDamage > 0 || hasTargetEffects
    const hitSucceeded =
      !requiresHitCheck || rng.next() <= calcHitChance(actor, target, currentTime, buffState)

    if (!hitSucceeded) {
      recordEmit({
        type: 'AttackMissed',
        sourceId: event.actorId,
        targetId: target.id,
        moveId: event.moveId,
      })
      scheduleSkill(actor, payload, move, currentTime)
      return
    }

    for (const effect of getBuffEffects(move, 'target')) {
      if (effect.chance !== undefined && rng.next() > effect.chance) {
        continue
      }
      recordEmit(
        applyBuff(
          buffState,
          {
            ownerId: target.id,
            sourceId: actor.id,
            skillId: event.skillId,
            moveId: event.moveId,
            currentTime,
          },
          effect.buff,
        ),
      )
    }

    const damage = applyDamageModifiers(baseDamage, actor.id, target.id, currentTime, buffState)
    if (damage > 0) {
      target.hp = Math.max(0, target.hp - damage)
      recordEmit({
        type: 'DamageDealt',
        sourceId: event.actorId,
        targetId: target.id,
        amount: damage,
        moveId: event.moveId,
      })
    }

    if (target.hp <= 0) {
      endBattle(actor.id)
      return
    }

    scheduleSkill(actor, payload, move, currentTime)
  })

  let ticks = 0
  while (!battleEnded && queue.peek() && ticks < MAX_TICKS) {
    ticks += 1
    const node = queue.pop()
    if (!node) {
      break
    }

    const actor = combatants.get(node.payload.actorId)
    if (!actor) {
      continue
    }

    currentTime = node.triggerAt
    for (const event of expireBuffsAtTime(buffState, currentTime)) {
      recordEmit(event)
    }

    const stunExpireAt = getLatestStunExpireAt(buffState, actor.id, currentTime)
    if (stunExpireAt !== undefined) {
      schedulePayloadAt(node.payload, stunExpireAt)
      continue
    }

    const move = resolveSkillChoice(
      actor.source,
      node.payload.skillId,
      actor.qi,
      rng,
      currentTime,
      buffState,
    )
    if (!move) {
      continue
    }

    recordEmit({
      type: 'SkillReady',
      actorId: node.payload.actorId,
      skillId: node.payload.skillId,
      moveId: move.id,
      triggerAt: node.triggerAt,
    })
  }

  if (!battleEnded) {
    const finalPlayer = combatants.get(player.id)!
    const finalEnemy = combatants.get(enemy.id)!
    if (finalPlayer.hp > finalEnemy.hp) {
      endBattle(player.id)
    } else if (finalEnemy.hp > finalPlayer.hp) {
      endBattle(enemy.id)
    } else {
      endBattle(player.id)
    }
  }

  const finalPlayer = combatants.get(player.id)!
  const finalEnemy = combatants.get(enemy.id)!

  return {
    winnerId,
    events,
    finalPlayerHp: finalPlayer.hp,
    finalPlayerQi: finalPlayer.qi,
    finalEnemyHp: finalEnemy.hp,
    finalEnemyQi: finalEnemy.qi,
    proficiencyGains: calcProficiencyGains(events, player.id, winnerId),
  }
}
