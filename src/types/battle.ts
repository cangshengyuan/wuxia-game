/**
 * @module types/battle
 * @layer types
 * @description 战斗快照、事件流与结算结果类型契约
 * @forbidden 禁止在 types 层 import engine/store/ui
 */
import type { MoveId, SkillId } from './id'

export interface BattleAction {
  actorId: string
  targetId: string
  skillId: string
  moveId: string
  damage: number
}

export interface BattleSnapshot {
  turn: number
  playerHp: number
  enemyHp: number
  lastAction?: BattleAction
}

export interface CombatantSnapshot {
  hp: number
  maxHp: number
  qi: number
  maxQi: number
}

export interface SkillReadyEvent {
  type: 'SkillReady'
  actorId: string
  skillId: SkillId
  moveId: MoveId
  triggerAt: number
}

export interface SkillExecutedEvent {
  type: 'SkillExecuted'
  actorId: string
  skillId: SkillId
  moveId: MoveId
}

export interface DamageDealtEvent {
  type: 'DamageDealt'
  sourceId: string
  targetId: string
  amount: number
  moveId?: MoveId
}

export interface BattleEndedEvent {
  type: 'BattleEnded'
  winnerId: string
}

export type BattleEvent =
  | SkillReadyEvent
  | SkillExecutedEvent
  | DamageDealtEvent
  | BattleEndedEvent

export interface DamageResult {
  amount: number
  isCritical?: boolean
}

export interface ProficiencyGain {
  skillId: SkillId
  amount: number
}

export interface BattleResult {
  winnerId: string
  events: BattleEvent[]
  finalPlayerHp: number
  finalPlayerQi: number
  finalEnemyHp: number
  finalEnemyQi: number
  proficiencyGains: ProficiencyGain[]
}
