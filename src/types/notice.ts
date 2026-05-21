/**
 * @module types/notice
 * @layer types
 * @description 游戏内通知类型（解锁提示等）
 * @forbidden 禁止在 types 层 import engine/store/ui
 */
import type { MoveId, SkillId } from './id'

export interface UnlockNotice {
  id: string
  skillId: SkillId
  moveId: MoveId
  skillName: string
  moveName: string
}
