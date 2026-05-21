/**
 * @module types/event
 * @layer types
 * @description 引擎事件类型统一导出（判别联合）
 * @forbidden 禁止在 types 层 import engine/store/ui
 */

export type {
  BattleEndedEvent,
  BattleEvent,
  DamageDealtEvent,
  SkillExecutedEvent,
  SkillReadyEvent,
} from './battle'

// 后续引擎事件（如 BuffApplied、ItemUsed）在此扩展并 re-export
