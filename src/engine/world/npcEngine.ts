/**
 * @module engine/world/npcEngine
 * @layer engine
 * @description NPC 数据读取与按场景查询（仅从 data JSON 读取）
 * @inputs sceneId
 * @outputs NpcDefinition[]
 * @depends types, data
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import npcsData from '../../data/npcs/index.json'
import { asNpcId, asSceneId } from '../../types/id'
import type { NpcId, SceneId } from '../../types/id'
import type { NpcDefinition } from '../../types/world'

function isNpcDefinition(value: unknown): value is NpcDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const n = value as Record<string, unknown>
  if (
    typeof n.id !== 'string' ||
    !n.id.startsWith('npc_') ||
    typeof n.name !== 'string' ||
    typeof n.sceneId !== 'string' ||
    !n.sceneId.startsWith('scene_')
  ) {
    return false
  }
  if (n.description !== undefined && typeof n.description !== 'string') {
    return false
  }
  return true
}

function normalizeNpc(raw: Record<string, unknown>): NpcDefinition {
  return {
    id: asNpcId(raw.id as string),
    name: raw.name as string,
    sceneId: asSceneId(raw.sceneId as string),
    ...(raw.description !== undefined ? { description: raw.description as string } : {}),
  }
}

const npcCatalog: NpcDefinition[] = (npcsData as unknown[])
  .filter(isNpcDefinition)
  .map((npc) => normalizeNpc(npc as unknown as Record<string, unknown>))

export function listNpcsByScene(sceneId: SceneId | string): NpcDefinition[] {
  const id = typeof sceneId === 'string' ? asSceneId(sceneId) : sceneId
  return npcCatalog.filter((npc) => npc.sceneId === id)
}

export function getNpcById(npcId: NpcId | string): NpcDefinition | undefined {
  const id = typeof npcId === 'string' ? asNpcId(npcId) : npcId
  return npcCatalog.find((npc) => npc.id === id)
}
