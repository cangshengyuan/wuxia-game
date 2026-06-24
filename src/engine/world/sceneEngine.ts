/**
 * @module engine/world/sceneEngine
 * @layer engine
 * @description 场景数据读取与查询（仅从 data JSON 读取）
 * @inputs sceneId
 * @outputs SceneDefinition | undefined
 * @depends types, data
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import scenesData from '../../data/scenes/index.json'
import { asEnemyId, asSceneId } from '../../types/id'
import type { SceneId } from '../../types/id'
import type { EncounterEntry, ProgressCondition, SceneDefinition, SceneExit } from '../../types/world'

function isEncounterEntry(value: unknown): value is EncounterEntry {
  if (!value || typeof value !== 'object') {
    return false
  }
  const e = value as Record<string, unknown>
  if (typeof e.enemyId !== 'string' || !e.enemyId.startsWith('enemy_')) {
    return false
  }
  if (e.weight !== undefined && typeof e.weight !== 'number') {
    return false
  }
  return true
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
      return typeof condition.questId === 'string' && condition.questId.startsWith('quest_')
    case 'has_skill':
    case 'missing_skill':
      return typeof condition.skillId === 'string' && condition.skillId.startsWith('skill_')
    case 'skill_proficiency_at_least':
      return (
        typeof condition.skillId === 'string' &&
        condition.skillId.startsWith('skill_') &&
        typeof condition.proficiency === 'number'
      )
    case 'current_quest_objective_type':
      return (
        typeof condition.questId === 'string' &&
        condition.questId.startsWith('quest_') &&
        typeof condition.objectiveType === 'string'
      )
    default:
      return false
  }
}

function isSceneExit(value: unknown): value is SceneExit {
  if (!value || typeof value !== 'object') {
    return false
  }
  const exit = value as Record<string, unknown>
  if (typeof exit.toSceneId !== 'string' || !exit.toSceneId.startsWith('scene_')) {
    return false
  }
  if (exit.requirements !== undefined) {
    if (!Array.isArray(exit.requirements) || !exit.requirements.every(isProgressCondition)) {
      return false
    }
  }
  return true
}

function isSceneDefinition(value: unknown): value is SceneDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const s = value as Record<string, unknown>
  if (
    typeof s.id !== 'string' ||
    !s.id.startsWith('scene_') ||
    typeof s.name !== 'string' ||
    !Array.isArray(s.encounters) ||
    !Array.isArray(s.exits)
  ) {
    return false
  }
  if (s.description !== undefined && typeof s.description !== 'string') {
    return false
  }
  return s.encounters.every(isEncounterEntry) && s.exits.every(isSceneExit)
}

function normalizeScene(raw: Record<string, unknown>): SceneDefinition {
  const encounters = (raw.encounters as Record<string, unknown>[]).map((e) => ({
    enemyId: asEnemyId(e.enemyId as string),
    ...(e.weight !== undefined ? { weight: e.weight as number } : {}),
  }))
  const exits = (raw.exits as Record<string, unknown>[]).map((exit) => ({
    toSceneId: asSceneId(exit.toSceneId as string),
    ...(exit.requirements !== undefined
      ? { requirements: exit.requirements as ProgressCondition[] }
      : {}),
  }))

  return {
    id: asSceneId(raw.id as string),
    name: raw.name as string,
    ...(raw.description !== undefined ? { description: raw.description as string } : {}),
    encounters,
    exits,
  }
}

const sceneCatalog: SceneDefinition[] = (scenesData as unknown[])
  .filter(isSceneDefinition)
  .map((scene) => normalizeScene(scene as unknown as Record<string, unknown>))

export function getSceneById(sceneId: SceneId | string): SceneDefinition | undefined {
  const id = typeof sceneId === 'string' ? asSceneId(sceneId) : sceneId
  return sceneCatalog.find((scene) => scene.id === id)
}

export function listScenes(): SceneDefinition[] {
  return sceneCatalog
}
