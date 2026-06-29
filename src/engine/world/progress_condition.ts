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
import { getSkillById } from '../skillEngine'
import type { ProgressCondition, ProgressState } from '../../types/world'

const OBJECTIVE_TYPE_LABELS = {
  talk_to_npc: '与 NPC 交谈',
  reach_scene: '抵达指定地点',
  defeat_enemy: '击败指定敌人',
  return_to_npc: '返回交付任务',
} as const

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

export function getProgressConditionFailureReason(
  condition: ProgressCondition,
  progress: ProgressState,
): string | undefined {
  if (matchesProgressCondition(condition, progress)) {
    return undefined
  }

  switch (condition.type) {
    case 'quest_active': {
      const questName = getQuestById(condition.questId)?.name ?? condition.questId
      return `需要已接取任务《${questName}》`
    }
    case 'quest_completed': {
      const questName = getQuestById(condition.questId)?.name ?? condition.questId
      return `需要完成任务《${questName}》`
    }
    case 'quest_inactive': {
      const questName = getQuestById(condition.questId)?.name ?? condition.questId
      return `需要未接取任务《${questName}》`
    }
    case 'has_skill': {
      const skillName = getSkillById(condition.skillId)?.name ?? condition.skillId
      return `需要掌握功法《${skillName}》`
    }
    case 'missing_skill': {
      const skillName = getSkillById(condition.skillId)?.name ?? condition.skillId
      return `需要尚未掌握功法《${skillName}》`
    }
    case 'skill_proficiency_at_least': {
      const skillName = getSkillById(condition.skillId)?.name ?? condition.skillId
      return `需要《${skillName}》熟练度达到 ${condition.proficiency}`
    }
    case 'current_quest_objective_type': {
      const questName = getQuestById(condition.questId)?.name ?? condition.questId
      return `需要任务《${questName}》推进至“${OBJECTIVE_TYPE_LABELS[condition.objectiveType]}”阶段`
    }
    default:
      return undefined
  }
}

export function getProgressConditionFailureReasons(
  conditions: ProgressCondition[] | undefined,
  progress: ProgressState,
): string[] {
  if (!conditions || conditions.length === 0) {
    return []
  }
  return conditions
    .map((condition) => getProgressConditionFailureReason(condition, progress))
    .filter((reason): reason is string => reason !== undefined)
}
