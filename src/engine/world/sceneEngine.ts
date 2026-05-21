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
import type { EncounterEntry, SceneDefinition } from '../../types/world'

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

function isSceneDefinition(value: unknown): value is SceneDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const s = value as Record<string, unknown>
  if (
    typeof s.id !== 'string' ||
    !s.id.startsWith('scene_') ||
    typeof s.name !== 'string' ||
    !Array.isArray(s.encounters)
  ) {
    return false
  }
  if (s.description !== undefined && typeof s.description !== 'string') {
    return false
  }
  return s.encounters.every(isEncounterEntry)
}

function normalizeScene(raw: Record<string, unknown>): SceneDefinition {
  const encounters = (raw.encounters as Record<string, unknown>[]).map((e) => ({
    enemyId: asEnemyId(e.enemyId as string),
    ...(e.weight !== undefined ? { weight: e.weight as number } : {}),
  }))

  return {
    id: asSceneId(raw.id as string),
    name: raw.name as string,
    ...(raw.description !== undefined ? { description: raw.description as string } : {}),
    encounters,
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
