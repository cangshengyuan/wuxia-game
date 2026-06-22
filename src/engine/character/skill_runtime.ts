/**
 * @module character/skill_runtime
 * @layer engine
 * @description 功法运行时状态查询与占位升级
 * @inputs SkillRuntime, SkillDefinition
 * @outputs SkillRuntime / boolean
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store、禁止 mutate 入参
 */
import { checkUnlocks } from '../skill/proficiency'
import type { SkillRuntime } from '../../types/character'
import type { SkillDefinition } from '../../types/skill'
import type { MoveId, SkillId } from '../../types/id'

export function grantSkill(
  skillId: SkillId,
  skillDef: SkillDefinition,
  initialProficiency = 0,
): SkillRuntime {
  const runtime: SkillRuntime = {
    skillId,
    proficiency: Math.min(initialProficiency, skillDef.maxProficiency),
    realmLevel: skillDef.realm.minLevel,
    insight: 0,
    unlockedMoveIds: skillDef.moves
      .filter((move) => move.unlockProficiency === 0)
      .map((move) => move.id),
  }

  const { newlyUnlockedMoveIds } = checkUnlocks(runtime, skillDef)
  return {
    ...runtime,
    unlockedMoveIds: [...runtime.unlockedMoveIds, ...newlyUnlockedMoveIds],
  }
}

export function canUseMove(runtime: SkillRuntime, moveId: MoveId | string): boolean {
  return runtime.unlockedMoveIds.includes(moveId)
}

export function canUpgradeSkill(runtime: SkillRuntime, skillDef: SkillDefinition): boolean {
  return runtime.proficiency < skillDef.maxProficiency
}

export function upgradeSkill(runtime: SkillRuntime, skillDef: SkillDefinition): SkillRuntime {
  if (!canUpgradeSkill(runtime, skillDef)) {
    return runtime
  }

  return {
    ...runtime,
    proficiency: Math.min(runtime.proficiency + 1, skillDef.maxProficiency),
  }
}
