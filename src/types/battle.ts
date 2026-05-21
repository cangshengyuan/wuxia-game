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
