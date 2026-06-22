/**
 * @module engine/skill_relation_engine
 * @layer engine
 * @description 功法关系表读取、校验与纯查询
 * @inputs sourceSkillId, targetSkillId
 * @outputs SkillRelation[]
 * @depends types, data, engine/skillEngine
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import relationData from '../data/skill_relations/index.json'
import { listAllSkills } from './skillEngine'
import { asSkillId } from '../types/id'
import type { SkillId } from '../types/id'
import type {
  SkillInheritanceRelation,
  SkillRelation,
  SkillSimilarityRelation,
  SkillSynergyRelation,
} from '../types/skill_relation'

function isRelationBase(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false
  }
  const relation = value as Record<string, unknown>
  return (
    typeof relation.id === 'string' &&
    typeof relation.sourceSkillId === 'string' &&
    relation.sourceSkillId.startsWith('skill_') &&
    typeof relation.targetSkillId === 'string' &&
    relation.targetSkillId.startsWith('skill_') &&
    typeof relation.description === 'string'
  )
}

function isInheritanceRelation(value: unknown): value is SkillInheritanceRelation {
  if (!isRelationBase(value)) {
    return false
  }
  const relation = value
  return (
    relation.type === 'inheritance' &&
    typeof relation.transferRatio === 'number' &&
    typeof relation.sameTierBonus === 'number' &&
    typeof relation.crossTierPenalty === 'number' &&
    typeof relation.maxInitialRatio === 'number' &&
    typeof relation.minSourceProficiency === 'number'
  )
}

function isSynergyRelation(value: unknown): value is SkillSynergyRelation {
  if (!isRelationBase(value)) {
    return false
  }
  const relation = value
  return (
    relation.type === 'synergy' &&
    typeof relation.requiredProficiency === 'number' &&
    typeof relation.damageMultiplier === 'number' &&
    typeof relation.battleGainMultiplier === 'number'
  )
}

function isSimilarityRelation(value: unknown): value is SkillSimilarityRelation {
  if (!isRelationBase(value)) {
    return false
  }
  const relation = value
  return relation.type === 'similarity' && typeof relation.similarity === 'number'
}

function normalizeRelation(value: SkillRelation): SkillRelation {
  return {
    ...value,
    sourceSkillId: asSkillId(value.sourceSkillId),
    targetSkillId: asSkillId(value.targetSkillId),
  }
}

const knownSkillIds = new Set(listAllSkills().map((skill) => skill.id))
const relationCatalog = (relationData as unknown[])
  .filter(
    (relation): relation is SkillRelation =>
      isInheritanceRelation(relation) ||
      isSynergyRelation(relation) ||
      isSimilarityRelation(relation),
  )
  .map((relation) => normalizeRelation(relation))
  .filter(
    (relation) =>
      knownSkillIds.has(relation.sourceSkillId) && knownSkillIds.has(relation.targetSkillId),
  )

export function listAllSkillRelations(): SkillRelation[] {
  return relationCatalog
}

export function listRelationsForSource(skillId: SkillId | string): SkillRelation[] {
  const id = typeof skillId === 'string' ? asSkillId(skillId) : skillId
  return relationCatalog.filter((relation) => relation.sourceSkillId === id)
}

export function listRelationsForTarget(skillId: SkillId | string): SkillRelation[] {
  const id = typeof skillId === 'string' ? asSkillId(skillId) : skillId
  return relationCatalog.filter((relation) => relation.targetSkillId === id)
}

export function getInheritanceSources(
  skillId: SkillId | string,
): SkillInheritanceRelation[] {
  return listRelationsForTarget(skillId).filter(
    (relation): relation is SkillInheritanceRelation => relation.type === 'inheritance',
  )
}

export function getSynergySources(skillId: SkillId | string): SkillSynergyRelation[] {
  return listRelationsForTarget(skillId).filter(
    (relation): relation is SkillSynergyRelation => relation.type === 'synergy',
  )
}

export function getSimilaritySources(
  skillId: SkillId | string,
): SkillSimilarityRelation[] {
  return listRelationsForTarget(skillId).filter(
    (relation): relation is SkillSimilarityRelation => relation.type === 'similarity',
  )
}
