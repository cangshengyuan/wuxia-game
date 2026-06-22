/**
 * @module types/character
 * @layer types
 * @description 角色基础属性、已学功法运行时与角色状态类型契约
 * @forbidden 禁止在 types 层 import engine/store/ui
 */
import type { SkillId } from './id'

export interface CharacterAttributes {
  armStrength: number
  agility: number
  constitution: number
}

export interface SkillRuntime {
  skillId: SkillId
  proficiency: number
  realmLevel: number
  insight: number
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
