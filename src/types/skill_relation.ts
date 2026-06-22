/**
 * @module types/skill_relation
 * @layer types
 * @description 功法传承、连携、相似度关系类型契约
 * @forbidden 禁止在 types 层 import engine/store/ui
 */
import type { SkillId } from './id'

export interface SkillRelationBase {
  id: string
  sourceSkillId: SkillId
  targetSkillId: SkillId
  description: string
}

export interface SkillInheritanceRelation extends SkillRelationBase {
  type: 'inheritance'
  transferRatio: number
  sameTierBonus: number
  crossTierPenalty: number
  maxInitialRatio: number
  minSourceProficiency: number
}

export interface SkillSynergyRelation extends SkillRelationBase {
  type: 'synergy'
  requiredProficiency: number
  damageMultiplier: number
  battleGainMultiplier: number
}

export interface SkillSimilarityRelation extends SkillRelationBase {
  type: 'similarity'
  similarity: number
}

export type SkillRelation =
  | SkillInheritanceRelation
  | SkillSynergyRelation
  | SkillSimilarityRelation
