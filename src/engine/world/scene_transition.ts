/**
 * @module engine/world/scene_transition
 * @layer engine
 * @description 场景切换邻接与进入条件（从场景数据读取）
 * @inputs SceneId
 * @outputs boolean | SceneId[]
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import { getSceneById } from './sceneEngine'
import { matchesProgressCondition } from './progress_condition'
import { asSceneId } from '../../types/id'
import type { SceneId } from '../../types/id'
import type { ProgressState } from '../../types/world'

export function getSceneExits(fromSceneId: SceneId): SceneId[] {
  const scene = getSceneById(fromSceneId)
  return scene?.exits.map((entry) => entry.toSceneId) ?? []
}

export function canEnter(
  fromSceneId: SceneId,
  toSceneId: SceneId,
  progress?: ProgressState,
): boolean {
  const scene = getSceneById(fromSceneId)
  if (!scene) {
    return false
  }
  const targetId = typeof toSceneId === 'string' ? asSceneId(toSceneId) : toSceneId
  const exit = scene.exits.find((entry) => entry.toSceneId === targetId)
  if (!exit) {
    return false
  }
  if (!progress || !exit.requirements || exit.requirements.length === 0) {
    return true
  }
  return exit.requirements.every((condition) => matchesProgressCondition(condition, progress))
}
