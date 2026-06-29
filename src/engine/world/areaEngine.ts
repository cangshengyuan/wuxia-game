/**
 * @module engine/world/areaEngine
 * @layer engine
 * @description 区域数据读取与按区域查询场景
 * @inputs areaId
 * @outputs AreaDefinition | AreaDefinition[] | SceneDefinition[]
 * @depends types, data, engine/world/sceneEngine
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import areasData from '../../data/areas/index.json'
import { asAreaId, asSceneId } from '../../types/id'
import type { AreaId, SceneId } from '../../types/id'
import type { AreaDefinition, AreaKind, SceneDefinition } from '../../types/world'
import { listScenes } from './sceneEngine'

const AREA_KINDS: AreaKind[] = ['city', 'outskirts', 'travel_hub']

function isAreaDefinition(value: unknown): value is AreaDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const area = value as Record<string, unknown>
  if (
    typeof area.id !== 'string' ||
    !area.id.startsWith('area_') ||
    typeof area.name !== 'string' ||
    !AREA_KINDS.includes(area.kind as AreaKind) ||
    typeof area.hubSceneId !== 'string' ||
    !area.hubSceneId.startsWith('scene_')
  ) {
    return false
  }
  if (area.description !== undefined && typeof area.description !== 'string') {
    return false
  }
  return true
}

function normalizeArea(raw: Record<string, unknown>): AreaDefinition {
  return {
    id: asAreaId(raw.id as string),
    name: raw.name as string,
    kind: raw.kind as AreaKind,
    ...(raw.description !== undefined ? { description: raw.description as string } : {}),
    hubSceneId: asSceneId(raw.hubSceneId as string),
  }
}

const areaCatalog: AreaDefinition[] = (areasData as unknown[])
  .filter(isAreaDefinition)
  .map((area) => normalizeArea(area as unknown as Record<string, unknown>))

export function listAreas(): AreaDefinition[] {
  return areaCatalog
}

export function getAreaById(areaId: AreaId | string): AreaDefinition | undefined {
  const id = typeof areaId === 'string' ? asAreaId(areaId) : areaId
  return areaCatalog.find((area) => area.id === id)
}

export function listScenesByArea(areaId: AreaId | string): SceneDefinition[] {
  const id = typeof areaId === 'string' ? asAreaId(areaId) : areaId
  return listScenes().filter((scene) => scene.areaId === id)
}

export function getAreaBySceneId(sceneId: SceneId | string): AreaDefinition | undefined {
  const id = typeof sceneId === 'string' ? asSceneId(sceneId) : sceneId
  const scene = listScenes().find((entry) => entry.id === id)
  if (!scene?.areaId) {
    return undefined
  }
  return getAreaById(scene.areaId)
}
