/**
 * @module combat/types
 * @layer engine
 * @description 战斗引擎内部队列 payload 类型（不导出到 types 层）
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { SkillId } from '../../types/id'

export interface QueuePayload {
  actorId: string
  targetId: string
  skillId: SkillId
}

export interface QueueNodeInput {
  id: string
  triggerAt: number
  payload: QueuePayload
}
