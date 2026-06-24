/**
 * @module engine/world/npcInteractionEngine
 * @layer engine
 * @description NPC 交互脚本读取、校验与条件解析（仅从 data JSON 读取）
 * @inputs NpcId, ProgressState
 * @outputs ResolvedNpcInteraction | undefined
 * @depends types, data, engine/world/progress_condition
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import interactionsData from '../../data/npc_interactions/index.json'
import { matchesProgressCondition } from './progress_condition'
import { asNpcId, asQuestId, asSkillId } from '../../types/id'
import type { NpcId } from '../../types/id'
import type {
  NpcInteractionAction,
  NpcInteractionDefinition,
  NpcInteractionState,
  ProgressCondition,
  ProgressState,
  QuestObjectiveType,
} from '../../types/world'

const QUEST_OBJECTIVE_TYPES: QuestObjectiveType[] = [
  'talk_to_npc',
  'reach_scene',
  'defeat_enemy',
  'return_to_npc',
]

export interface ResolvedNpcInteraction {
  message: string
  primaryActionLabel?: string
  actions: NpcInteractionAction[]
  closeDialogOnAction: boolean
}

function isProgressCondition(value: unknown): value is ProgressCondition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const condition = value as Record<string, unknown>
  switch (condition.type) {
    case 'quest_active':
    case 'quest_completed':
    case 'quest_inactive':
      return typeof condition.questId === 'string'
    case 'has_skill':
    case 'missing_skill':
      return typeof condition.skillId === 'string'
    case 'skill_proficiency_at_least':
      return typeof condition.skillId === 'string' && typeof condition.proficiency === 'number'
    case 'current_quest_objective_type':
      return (
        typeof condition.questId === 'string' &&
        typeof condition.objectiveType === 'string' &&
        QUEST_OBJECTIVE_TYPES.includes(condition.objectiveType as QuestObjectiveType)
      )
    default:
      return false
  }
}

function isNpcInteractionAction(value: unknown): value is NpcInteractionAction {
  if (!value || typeof value !== 'object') {
    return false
  }
  const action = value as Record<string, unknown>
  switch (action.type) {
    case 'learn_skill':
      return typeof action.skillId === 'string'
    case 'accept_quest':
      return typeof action.questId === 'string'
    case 'emit_dialog_closed':
      return true
    default:
      return false
  }
}

function isNpcInteractionState(value: unknown): value is NpcInteractionState {
  if (!value || typeof value !== 'object') {
    return false
  }
  const state = value as Record<string, unknown>
  if (typeof state.message !== 'string') {
    return false
  }
  if (state.primaryActionLabel !== undefined && typeof state.primaryActionLabel !== 'string') {
    return false
  }
  if (state.closeDialogOnAction !== undefined && typeof state.closeDialogOnAction !== 'boolean') {
    return false
  }
  if (state.conditions !== undefined) {
    if (!Array.isArray(state.conditions) || !state.conditions.every(isProgressCondition)) {
      return false
    }
  }
  if (state.actions !== undefined) {
    if (!Array.isArray(state.actions) || !state.actions.every(isNpcInteractionAction)) {
      return false
    }
  }
  return true
}

function isNpcInteractionDefinition(value: unknown): value is NpcInteractionDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const definition = value as Record<string, unknown>
  return (
    typeof definition.npcId === 'string' &&
    definition.npcId.startsWith('npc_') &&
    Array.isArray(definition.states) &&
    definition.states.every(isNpcInteractionState)
  )
}

function normalizeCondition(condition: ProgressCondition): ProgressCondition {
  switch (condition.type) {
    case 'quest_active':
    case 'quest_completed':
    case 'quest_inactive':
      return { ...condition, questId: asQuestId(condition.questId) }
    case 'has_skill':
    case 'missing_skill':
      return { ...condition, skillId: asSkillId(condition.skillId) }
    case 'skill_proficiency_at_least':
      return {
        ...condition,
        skillId: asSkillId(condition.skillId),
      }
    case 'current_quest_objective_type':
      return {
        ...condition,
        questId: asQuestId(condition.questId),
      }
    default:
      return condition
  }
}

function normalizeAction(action: NpcInteractionAction): NpcInteractionAction {
  switch (action.type) {
    case 'learn_skill':
      return { ...action, skillId: asSkillId(action.skillId) }
    case 'accept_quest':
      return { ...action, questId: asQuestId(action.questId) }
    default:
      return action
  }
}

function normalizeState(state: NpcInteractionState): NpcInteractionState {
  return {
    ...state,
    ...(state.conditions
      ? { conditions: state.conditions.map((condition) => normalizeCondition(condition)) }
      : {}),
    ...(state.actions ? { actions: state.actions.map((action) => normalizeAction(action)) } : {}),
  }
}

const interactionCatalog: NpcInteractionDefinition[] = (interactionsData as unknown[])
  .filter(isNpcInteractionDefinition)
  .map((definition) => ({
    npcId: asNpcId(definition.npcId),
    states: definition.states.map((state) => normalizeState(state)),
  }))

export function resolveNpcInteraction(
  npcId: NpcId | string,
  progress: ProgressState,
): ResolvedNpcInteraction | undefined {
  const id = typeof npcId === 'string' ? asNpcId(npcId) : npcId
  const definition = interactionCatalog.find((entry) => entry.npcId === id)
  if (!definition) {
    return undefined
  }

  const state = definition.states.find((entry) =>
    (entry.conditions ?? []).every((condition) => matchesProgressCondition(condition, progress)),
  )
  if (!state) {
    return undefined
  }

  return {
    message: state.message,
    ...(state.primaryActionLabel ? { primaryActionLabel: state.primaryActionLabel } : {}),
    actions: state.actions ?? [],
    closeDialogOnAction: state.closeDialogOnAction ?? true,
  }
}
