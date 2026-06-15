/**
 * @module types/skill
 * @layer types
 * @description 功法定义、招式定义与功法类别类型契约
 * @forbidden 禁止在 types 层 import engine/store/ui
 */
import type { MoveId, SkillId } from './id'

export type SkillCategory = 'internal' | 'external' | 'hard' | 'qinggong' | 'sword'

export interface SkillMove {
  id: MoveId
  name: string
  cd: number
  qiCost: number
  powerRatio: number
  unlockProficiency: number
  element?: string
  tag?: string
}

export interface SkillDefinition {
  id: SkillId
  name: string
  category: SkillCategory
  tier: 'low' | 'mid' | 'high'
  description: string
  maxProficiency: number
  moves: SkillMove[]
}
