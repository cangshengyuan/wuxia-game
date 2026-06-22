/**
 * @module skill/proficiency
 * @layer engine
 * @description 功法熟练度增益与招式解锁判定
 * @inputs SkillRuntime, ProficiencyGain, SkillDefinition
 * @outputs 新 SkillRuntime / 新解锁招式 ID 列表
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store、禁止 mutate 入参
 */
import type { SkillRuntime } from '../../types/character'
import type { ProficiencyGain } from '../../types/battle'
import type { SkillDefinition } from '../../types/skill'
import type { MoveId } from '../../types/id'

export function applyProficiencyGain(
  runtime: SkillRuntime,
  gain: ProficiencyGain,
  skillDef: SkillDefinition,
): SkillRuntime {
  const adjustedGain = Math.max(
    1,
    Math.round(gain.amount * skillDef.growthCurve.proficiencyMultiplier),
  )
  return {
    ...runtime,
    proficiency: Math.min(runtime.proficiency + adjustedGain, skillDef.maxProficiency),
  }
}

export function checkUnlocks(
  runtime: SkillRuntime,
  skillDef: SkillDefinition,
): { newlyUnlockedMoveIds: MoveId[] } {
  const newlyUnlockedMoveIds = skillDef.moves
    .filter(
      (move) =>
        runtime.proficiency >= move.unlockProficiency &&
        !runtime.unlockedMoveIds.includes(move.id),
    )
    .map((move) => move.id)

  return { newlyUnlockedMoveIds }
}
