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
import { getProgressConditionFailureReasons, matchesProgressCondition } from './progress_condition'
import { asSceneId } from '../../types/id'
import type { SceneId } from '../../types/id'
import type { ProgressState, SceneExit } from '../../types/world'

export function getSceneExits(fromSceneId: SceneId): SceneExit[] {
  const scene = getSceneById(fromSceneId)
  return scene?.exits ?? []
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

export function getEnterFailureReasons(
  fromSceneId: SceneId,
  toSceneId: SceneId,
  progress?: ProgressState,
): string[] {
  const scene = getSceneById(fromSceneId)
  if (!scene) {
    return ['当前场景不存在']
  }
  const targetId = typeof toSceneId === 'string' ? asSceneId(toSceneId) : toSceneId
  const exit = scene.exits.find((entry) => entry.toSceneId === targetId)
  if (!exit) {
    return ['当前地点无法直接前往目标地点']
  }
  if (!progress) {
    return []
  }
  return getProgressConditionFailureReasons(exit.requirements, progress)
}
