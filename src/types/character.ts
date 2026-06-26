/**
 * @module types/character
 * @layer types
 * @description 角色基础属性、已学功法运行时与角色状态类型契约
 * @forbidden 禁止在 types 层 import engine/store/ui
 */
import type { SkillId } from './id'
import type { WeaponRequirement } from './skill'

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

export interface SkillFormation {
  external: SkillId[]
  internal?: SkillId
  qinggong?: SkillId
  hard?: SkillId
}

export interface MeditationState {
  isActive: boolean
  accumulatedMs: number
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
  formation?: SkillFormation
  weaponType?: WeaponRequirement
  equippedSkillIds: SkillId[]
  meditation?: MeditationState
}
