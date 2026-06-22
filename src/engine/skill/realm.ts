/**
 * @module skill/realm
 * @layer engine
 * @description 功法境界、感悟与突破判定
 * @inputs SkillRuntime, SkillDefinition, learnedSkills, rng
 * @outputs 新 SkillRuntime 与突破结果
 * @depends types, engine/skill_relation_engine, engine/skillEngine, engine/util/rng
 * @forbidden 禁止 import React、禁止访问 store、禁止 mutate 入参
 */
import { getSimilaritySources } from '../skill_relation_engine'
import type { SkillRuntime } from '../../types/character'
import type { SkillDefinition } from '../../types/skill'
import type { Rng } from '../util/rng'

export interface RealmProgressResult {
  runtime: SkillRuntime
  insightGained: number
  similarSkillCount: number
  brokeThrough: boolean
}

function getHighRealmSkillCount(learnedSkills: SkillRuntime[]): number {
  return learnedSkills.filter((skill) => skill.realmLevel >= 3).length
}

export function countSimilarSkills(
  targetSkillId: string,
  learnedSkills: SkillRuntime[],
): number {
  const sources = getSimilaritySources(targetSkillId)
  return sources.filter((relation) =>
    learnedSkills.some(
      (runtime) =>
        runtime.skillId === relation.sourceSkillId &&
        runtime.proficiency >= 10 &&
        relation.similarity >= 0.75,
    ),
  ).length
}

export function rollInsightGain(
  skillDef: SkillDefinition,
  learnedSkills: SkillRuntime[],
  rng: Rng,
): number {
  const highRealmCount = getHighRealmSkillCount(learnedSkills)
  const chance = Math.min(
    0.18 * skillDef.growthCurve.insightChanceMultiplier + highRealmCount * 0.08,
    0.85,
  )
  return rng.next() < chance ? 1 : 0
}

export function canBreakthrough(
  runtime: SkillRuntime,
  skillDef: SkillDefinition,
  similarSkillCount: number,
): boolean {
  if (runtime.realmLevel >= skillDef.realm.maxLevel) {
    return false
  }

  const realmIndex = runtime.realmLevel - skillDef.realm.minLevel
  const requiredProficiency = skillDef.realm.breakthroughProficiency[realmIndex] ?? Number.MAX_SAFE_INTEGER
  const requiredInsight = skillDef.realm.insightThresholds[realmIndex] ?? Number.MAX_SAFE_INTEGER
  const requiredSimilarSkills = skillDef.realm.similarSkillRequired[realmIndex] ?? Number.MAX_SAFE_INTEGER

  if (runtime.proficiency < requiredProficiency) {
    return false
  }

  return similarSkillCount >= requiredSimilarSkills || runtime.insight >= requiredInsight
}

export function applyRealmProgress(
  runtime: SkillRuntime,
  skillDef: SkillDefinition,
  learnedSkills: SkillRuntime[],
  rng: Rng,
): RealmProgressResult {
  const insightGained = rollInsightGain(skillDef, learnedSkills, rng)
  const withInsight: SkillRuntime = {
    ...runtime,
    insight: runtime.insight + insightGained,
  }
  const similarSkillCount = countSimilarSkills(runtime.skillId, learnedSkills)

  if (!canBreakthrough(withInsight, skillDef, similarSkillCount)) {
    return {
      runtime: withInsight,
      insightGained,
      similarSkillCount,
      brokeThrough: false,
    }
  }

  const realmIndex = withInsight.realmLevel - skillDef.realm.minLevel
  const insightCost = skillDef.realm.insightThresholds[realmIndex] ?? 0

  return {
    runtime: {
      ...withInsight,
      realmLevel: withInsight.realmLevel + 1,
      insight: Math.max(0, withInsight.insight - insightCost),
    },
    insightGained,
    similarSkillCount,
    brokeThrough: true,
  }
}
