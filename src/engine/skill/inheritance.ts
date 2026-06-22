/**
 * @module skill/inheritance
 * @layer engine
 * @description 根据已学功法与关系表计算新功法的初始熟练度
 * @inputs learnedSkills, targetSkillId
 * @outputs 初始熟练度与来源明细
 * @depends types, engine/skillEngine, engine/skill_relation_engine
 * @forbidden 禁止 import React、禁止访问 store、禁止 mutate 入参
 */
import { getInheritanceSources } from '../skill_relation_engine'
import { getSkillById } from '../skillEngine'
import type { SkillRuntime } from '../../types/character'
import type { SkillDefinition } from '../../types/skill'

export interface InheritanceContribution {
  sourceSkillId: string
  amount: number
}

export interface InheritanceResult {
  initialProficiency: number
  contributions: InheritanceContribution[]
}

function getTierMultiplier(source: SkillDefinition, target: SkillDefinition, sameTierBonus: number, crossTierPenalty: number): number {
  if (source.tier === target.tier) {
    return 1 + sameTierBonus
  }
  return Math.max(0.1, 1 - crossTierPenalty)
}

export function calculateInheritedProficiency(
  learnedSkills: SkillRuntime[],
  targetSkill: SkillDefinition,
): InheritanceResult {
  const relations = getInheritanceSources(targetSkill.id)
  const contributions = relations
    .flatMap((relation) => {
      const runtime = learnedSkills.find((entry) => entry.skillId === relation.sourceSkillId)
      const sourceSkill = getSkillById(relation.sourceSkillId)
      if (!runtime || !sourceSkill || runtime.proficiency < relation.minSourceProficiency) {
        return []
      }

      const tierMultiplier = getTierMultiplier(
        sourceSkill,
        targetSkill,
        relation.sameTierBonus,
        relation.crossTierPenalty,
      )
      const realmMultiplier = 1 + (runtime.realmLevel - 1) * 0.08
      const baseAmount = runtime.proficiency * relation.transferRatio * tierMultiplier * realmMultiplier

      return [{ sourceSkillId: relation.sourceSkillId, amount: baseAmount }]
    })
    .sort((left, right) => right.amount - left.amount)
    .map((entry, index) => ({
      sourceSkillId: entry.sourceSkillId,
      amount: Math.max(0, Math.round(entry.amount * Math.pow(0.55, index))),
    }))
    .filter((entry) => entry.amount > 0)

  const hardCap = Math.round(targetSkill.maxProficiency * targetSkill.growthCurve.inheritanceCapRatio)
  const relationCap = Math.round(
    targetSkill.maxProficiency *
      Math.max(0, ...relations.map((relation) => relation.maxInitialRatio)),
  )
  const initialProficiency = Math.min(
    hardCap,
    relationCap,
    contributions.reduce((sum, entry) => sum + entry.amount, 0),
  )

  return { initialProficiency, contributions }
}
