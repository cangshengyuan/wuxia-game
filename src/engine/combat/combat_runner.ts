/**
 * @module combat/combat_runner
 * @layer engine
 * @description 时间轴战斗主循环：优先队列调度 + scoped 事件总线
 * @inputs player, enemy, rng?
 * @outputs BattleResult
 * @depends event_bus, priority_queue, damage_calc, loot, skillEngine, util/rng
 * @forbidden 禁止 import React、禁止访问 store
 */
import { createScopedBus } from '../event_bus'
import { getMoveById, getSkillById } from '../skillEngine'
import { createSeededRng, type Rng } from '../util/rng'
import { calcDamage } from './damage_calc'
import { calcProficiencyGains } from './loot'
import { PriorityQueue } from './priority_queue'
import type { QueuePayload } from './types'
import type { BattleEvent, BattleResult } from '../../types/battle'
import type { CharacterState } from '../../types/character'
import type { SkillMove } from '../../types/skill'
import type { MoveId, SkillId } from '../../types/id'

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

function resolvePrimaryMove(
  character: CharacterState,
): { skillId: SkillId; moveId: MoveId; move: SkillMove } | undefined {
  const skillId = character.equippedSkillIds[0]
  if (!skillId) {
    return undefined
  }

  const skill = getSkillById(skillId)
  if (!skill || skill.moves.length === 0) {
    return undefined
  }

  const runtime = character.learnedSkills.find((entry) => entry.skillId === skillId)
  let move: SkillMove | undefined

  if (runtime && runtime.unlockedMoveIds.length > 0) {
    move = skill.moves.find((entry) => runtime.unlockedMoveIds.includes(entry.id))
  }

  if (!move) {
    move = skill.moves.find((entry) => entry.unlockProficiency === 0) ?? skill.moves[0]
  }

  return { skillId, moveId: move.id, move }
}

function calcTriggerDelay(move: SkillMove, speed: number): number {
  return move.cd * (100 / speed)
}

function getOpponentId(actorId: string, playerId: string, enemyId: string): string {
  return actorId === playerId ? enemyId : playerId
}

export function startBattle({
  player,
  enemy,
  rng = createSeededRng(0),
}: StartBattleInput): BattleResult {
  void rng

  scheduleCounter = 0
  const bus = createScopedBus()
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
      triggerAt: atTime + calcTriggerDelay(move, actor.speed),
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
    const resolved = resolvePrimaryMove(actor.source)
    if (!resolved) {
      return
    }
    const payload: QueuePayload = {
      actorId: actor.id,
      targetId,
      skillId: resolved.skillId,
      moveId: resolved.moveId,
    }
    scheduleSkill(actor, payload, resolved.move, currentTime)
  }

  enqueueInitial(combatants.get(player.id)!, enemy.id)
  enqueueInitial(combatants.get(enemy.id)!, player.id)

  bus.on('SkillReady', (event) => {
    if (battleEnded) {
      return
    }

    const actor = combatants.get(event.actorId)
    const target = combatants.get(getOpponentId(event.actorId, player.id, enemy.id))
    if (!actor || !target) {
      return
    }

    const moveResult = getMoveById(event.moveId)
    const move = moveResult?.move
    if (!move) {
      return
    }

    const payload: QueuePayload = {
      actorId: event.actorId,
      targetId: target.id,
      skillId: event.skillId,
      moveId: event.moveId,
    }

    if (actor.qi < move.qiCost) {
      scheduleSkill(actor, payload, move, currentTime)
      return
    }

    actor.qi -= move.qiCost
    recordEmit({
      type: 'SkillExecuted',
      actorId: event.actorId,
      skillId: event.skillId,
      moveId: event.moveId,
    })

    const damage = calcDamage({
      attacker: actor.source,
      defender: target.source,
      move,
    }).amount

    target.hp = Math.max(0, target.hp - damage)
    recordEmit({
      type: 'DamageDealt',
      sourceId: event.actorId,
      targetId: target.id,
      amount: damage,
      moveId: event.moveId,
    })

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

    currentTime = node.triggerAt
    recordEmit({
      type: 'SkillReady',
      actorId: node.payload.actorId,
      skillId: node.payload.skillId,
      moveId: node.payload.moveId,
      triggerAt: node.triggerAt,
    })
  }

  if (!battleEnded) {
    const playerCombatant = combatants.get(player.id)!
    const enemyCombatant = combatants.get(enemy.id)!
    if (playerCombatant.hp > enemyCombatant.hp) {
      endBattle(player.id)
    } else if (enemyCombatant.hp > playerCombatant.hp) {
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
    finalEnemyHp: finalEnemy.hp,
    proficiencyGains: calcProficiencyGains(events),
  }
}
