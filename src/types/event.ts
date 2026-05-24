/**
 * @module types/event
 * @layer types
 * @description 引擎事件类型统一导出（判别联合）
 * @forbidden 禁止在 types 层 import engine/store/ui
 */

export type {
  BattleEndedEvent,
  BattleEvent,
  BattleResult,
  DamageDealtEvent,
  ProficiencyGain,
  SkillExecutedEvent,
  SkillReadyEvent,
} from './battle'

import type { EnemyId, NpcId, SceneId } from './id'

export interface SceneEnteredEvent {
  type: 'SceneEntered'
  sceneId: SceneId
}

export interface DialogClosedEvent {
  type: 'DialogClosed'
  npcId: NpcId
}

export interface BattleEndedWorldEvent {
  type: 'BattleEnded'
  winnerId: string
  enemyId: EnemyId
}

export type GameEvent = SceneEnteredEvent | DialogClosedEvent | BattleEndedWorldEvent
