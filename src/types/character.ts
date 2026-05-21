import type { SkillId } from './id'

export interface CharacterAttributes {
  armStrength: number
  agility: number
  constitution: number
}

export interface SkillRuntime {
  skillId: SkillId
  proficiency: number
  unlockedMoveIds: string[]
}

export interface CharacterState {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  qi: number
  maxQi: number
  attributes: CharacterAttributes
  learnedSkills: SkillRuntime[]
  speed: number
  equippedSkillIds: SkillId[]
}
