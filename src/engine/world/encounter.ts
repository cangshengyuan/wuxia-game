/**
 * @module engine/world/encounter
 * @layer engine
 * @description 场景遭遇战加权随机抽取
 * @inputs SceneDefinition, Rng
 * @outputs EnemyId | null
 * @depends types, engine/util/rng
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { Rng } from '../util/rng'
import type { EnemyId } from '../../types/id'
import type { SceneDefinition } from '../../types/world'

export function rollEncounter(scene: SceneDefinition, rng: Rng): EnemyId | null {
  if (scene.encounters.length === 0) {
    return null
  }

  const totalWeight = scene.encounters.reduce(
    (sum, entry) => sum + (entry.weight ?? 1),
    0,
  )
  let roll = rng.next() * totalWeight

  for (const entry of scene.encounters) {
    roll -= entry.weight ?? 1
    if (roll < 0) {
      return entry.enemyId
    }
  }

  return scene.encounters[scene.encounters.length - 1]?.enemyId ?? null
}
