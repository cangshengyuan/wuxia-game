/**
 * @module engine/world/questEngine
 * @layer engine
 * @description 任务数据读取与查询（仅从 data JSON 读取）
 * @inputs questId
 * @outputs QuestDefinition | QuestDefinition[]
 * @depends types, data
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import questsData from '../../data/quests/index.json'
import { asNpcId, asQuestId, asSkillId } from '../../types/id'
import type { QuestId } from '../../types/id'
import type { QuestDefinition, QuestObjective, QuestObjectiveType } from '../../types/world'

const QUEST_OBJECTIVE_TYPES: QuestObjectiveType[] = [
  'talk_to_npc',
  'reach_scene',
  'defeat_enemy',
  'return_to_npc',
]

function isQuestObjective(value: unknown): value is QuestObjective {
  if (!value || typeof value !== 'object') {
    return false
  }
  const objective = value as Record<string, unknown>
  if (
    typeof objective.type !== 'string' ||
    !QUEST_OBJECTIVE_TYPES.includes(objective.type as QuestObjectiveType) ||
    typeof objective.targetId !== 'string'
  ) {
    return false
  }
  if (objective.description !== undefined && typeof objective.description !== 'string') {
    return false
  }
  return true
}

function isQuestDefinition(value: unknown): value is QuestDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const quest = value as Record<string, unknown>
  if (
    typeof quest.id !== 'string' ||
    !quest.id.startsWith('quest_') ||
    typeof quest.name !== 'string' ||
    typeof quest.description !== 'string' ||
    !Array.isArray(quest.objectives) ||
    !quest.objectives.every(isQuestObjective)
  ) {
    return false
  }
  if (quest.giverNpcId !== undefined && typeof quest.giverNpcId !== 'string') {
    return false
  }
  if (quest.rewards !== undefined) {
    if (!quest.rewards || typeof quest.rewards !== 'object') {
      return false
    }
    const rewards = quest.rewards as Record<string, unknown>
    if (!Array.isArray(rewards.skillIds) || !rewards.skillIds.every((id) => typeof id === 'string')) {
      return false
    }
  }
  return true
}

function normalizeQuest(raw: Record<string, unknown>): QuestDefinition {
  const rewards = raw.rewards as Record<string, unknown> | undefined
  return {
    id: asQuestId(raw.id as string),
    name: raw.name as string,
    description: raw.description as string,
    objectives: (raw.objectives as QuestObjective[]).map((objective) => ({
      type: objective.type,
      targetId: objective.targetId,
      ...(objective.description !== undefined ? { description: objective.description } : {}),
    })),
    ...(raw.giverNpcId !== undefined ? { giverNpcId: asNpcId(raw.giverNpcId as string) } : {}),
    ...(rewards !== undefined
      ? {
          rewards: {
            skillIds: (rewards.skillIds as string[]).map((skillId) => asSkillId(skillId)),
          },
        }
      : {}),
  }
}

const questCatalog: QuestDefinition[] = (questsData as unknown[])
  .filter(isQuestDefinition)
  .map((quest) => normalizeQuest(quest as unknown as Record<string, unknown>))

export function listQuests(): QuestDefinition[] {
  return questCatalog
}

export function getQuestById(questId: QuestId | string): QuestDefinition | undefined {
  const id = typeof questId === 'string' ? asQuestId(questId) : questId
  return questCatalog.find((quest) => quest.id === id)
}
