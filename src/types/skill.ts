/**
 * @module types/skill
 * @layer types
 * @description 功法定义、招式定义与功法类别类型契约
 * @forbidden 禁止在 types 层 import engine/store/ui
 */
import type { MoveId, SkillId } from './id'

export type SkillCategory = 'internal' | 'external' | 'hard' | 'qinggong' | 'sword'
export type SkillTier = 'low' | 'mid' | 'high'
export type WeaponRequirement = 'sword' | 'unarmed'

export interface AttributeGrowthEntry {
  perProficiency: number
  perRealm: number
  maxBonus: number
}

export interface SkillAttributeGrowth {
  armStrength?: AttributeGrowthEntry
  agility?: AttributeGrowthEntry
  constitution?: AttributeGrowthEntry
  maxHp?: AttributeGrowthEntry
  maxQi?: AttributeGrowthEntry
  speed?: AttributeGrowthEntry
}

export interface SkillGrowthCurve {
  proficiencyMultiplier: number
  battleGainMultiplier: number
  breakthroughCostMultiplier: number
  insightChanceMultiplier: number
  inheritanceCapRatio: number
}

export interface SkillRealmDefinition {
  minLevel: number
  maxLevel: number
  breakthroughProficiency: number[]
  insightThresholds: number[]
  similarSkillRequired: number[]
}

export interface MeditationRecoveryProfile {
  baseRecovery: number
  proficiencyScale: number
  hpWeight: number
  qiWeight: number
}

export interface SkillBuffModifiers {
  outgoingDamageFlat?: number
  outgoingDamagePercent?: number
  incomingDamageFlat?: number
  incomingDamagePercent?: number
  hitChance?: number
  dodgeChance?: number
  speedFlat?: number
  speedPercent?: number
  qiCostFlat?: number
  qiCostPercent?: number
  stunned?: boolean
}

export interface SkillBuffDefinition {
  id: string
  name: string
  duration: number
  modifiers: SkillBuffModifiers
}

export interface ApplyBuffEffect {
  kind: 'applyBuff'
  target: 'self' | 'target'
  chance?: number
  buff: SkillBuffDefinition
}

export type MoveEffect = ApplyBuffEffect

export interface SkillMove {
  id: MoveId
  name: string
  cd: number
  qiCost: number
  powerRatio: number
  unlockProficiency: number
  element?: string
  tag?: string
  effects?: MoveEffect[]
}

export interface SkillDefinition {
  id: SkillId
  name: string
  category: SkillCategory
  tier: SkillTier
  description: string
  maxProficiency: number
  tags: string[]
  realm: SkillRealmDefinition
  attributeGrowth: SkillAttributeGrowth
  growthCurve: SkillGrowthCurve
  weaponRequirement?: WeaponRequirement
  meditationRecovery?: MeditationRecoveryProfile
  moves: SkillMove[]
}
