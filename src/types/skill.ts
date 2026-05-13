export type SkillCategory = 'internal' | 'external' | 'hard' | 'qinggong' | 'sword'

export interface SkillMove {
  id: string
  name: string
  cd: number
  qiCost: number
  powerRatio: number
}

export interface SkillDefinition {
  id: `skill_${string}_${string}_${string}`
  name: string
  category: SkillCategory
  tier: 'low' | 'mid' | 'high'
  description: string
  maxProficiency: number
  moves: SkillMove[]
}
