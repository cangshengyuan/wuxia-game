/**
 * @module engine/world/scene_transition
 * @layer engine
 * @description 场景切换邻接与进入条件（M5 静态邻接表）
 * @inputs SceneId
 * @outputs boolean | SceneId[]
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import { asSceneId } from '../../types/id'
import type { SceneId } from '../../types/id'

const SCENE_EXITS: Record<string, SceneId[]> = {
  scene_001_village: [asSceneId('scene_002_outskirts')],
  scene_002_outskirts: [asSceneId('scene_001_village')],
}

export function getSceneExits(fromSceneId: SceneId): SceneId[] {
  return SCENE_EXITS[fromSceneId] ?? []
}

export function canEnter(fromSceneId: SceneId, toSceneId: SceneId): boolean {
  void fromSceneId
  void toSceneId
  return true
}
