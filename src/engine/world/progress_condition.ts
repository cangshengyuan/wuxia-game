/**
 * @module engine/world/progress_condition
 * @layer engine
 * @description 玩家进度条件匹配：供场景门禁与 NPC 交互脚本复用
 * @inputs ProgressCondition, ProgressState
 * @outputs boolean
 * @depends types, engine/world/questEngine
 * @forbidden 禁止 import React、禁止访问 store
 */
import { getQuestById } from './questEngine'
import type { ProgressCondition, ProgressState } from '../../types/world'

function hasSkill(progress: ProgressState, skillId: string): boolean {
  return progress.learnedSkills.some((runtime) => runtime.skillId === skillId)
}

export function matchesProgressCondition(
  condition: ProgressCondition,
  progress: ProgressState,
): boolean {
  switch (condition.type) {
    case 'quest_active':
      return progress.activeQuests.some((quest) => quest.questId === condition.questId)
    case 'quest_completed':
      return progress.completedQuests.includes(condition.questId)
    case 'quest_inactive':
      return (
        !progress.completedQuests.includes(condition.questId) &&
        !progress.activeQuests.some((quest) => quest.questId === condition.questId)
      )
    case 'has_skill':
      return hasSkill(progress, condition.skillId)
    case 'missing_skill':
      return !hasSkill(progress, condition.skillId)
    case 'skill_proficiency_at_least':
      return (
        (progress.learnedSkills.find((runtime) => runtime.skillId === condition.skillId)?.proficiency ?? 0) >=
        condition.proficiency
      )
    case 'current_quest_objective_type': {
      const active = progress.activeQuests.find((quest) => quest.questId === condition.questId)
      if (!active) {
        return false
      }
      const definition = getQuestById(condition.questId)
      return definition?.objectives[active.currentStepIndex]?.type === condition.objectiveType
    }
    default:
      return false
  }
}
