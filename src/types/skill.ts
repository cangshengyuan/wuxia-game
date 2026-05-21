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
