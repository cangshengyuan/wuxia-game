/**
 * @module engine/world/area_map
 * @layer engine
 * @description 基于区域场景与出口方向生成只读地图布局
 * @inputs AreaDefinition, SceneDefinition[], currentSceneId
 * @outputs 只读地图布局节点与连线
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { AreaDefinition, ExitDirection, SceneDefinition } from '../../types/world'
import type { SceneId } from '../../types/id'

export interface AreaMapNodeLayout {
  sceneId: SceneId
  name: string
  kind: SceneDefinition['kind']
  safety: SceneDefinition['safety']
  x: number
  y: number
  isCurrent: boolean
}

export interface AreaMapEdgeLayout {
  fromSceneId: SceneId
  toSceneId: SceneId
  mode: 'walk' | 'gate' | 'station'
}

export interface AreaMapLayout {
  areaId: AreaDefinition['id']
  areaName: string
  areaDescription: string
  currentSceneId: SceneId
  nodes: AreaMapNodeLayout[]
  edges: AreaMapEdgeLayout[]
}

type Point = { x: number; y: number }

const DIRECTION_VECTORS: Record<ExitDirection, Point> = {
  north: { x: 0, y: -1 },
  north_east: { x: 1, y: -1 },
  east: { x: 1, y: 0 },
  south_east: { x: 1, y: 1 },
  south: { x: 0, y: 1 },
  south_west: { x: -1, y: 1 },
  west: { x: -1, y: 0 },
  north_west: { x: -1, y: -1 },
}

function makePairKey(left: SceneId, right: SceneId): string {
  return [left, right].sort().join('::')
}

function findOpenSlot(occupied: Set<string>, preferred: Point): Point {
  let candidate = { ...preferred }
  while (occupied.has(`${candidate.x},${candidate.y}`)) {
    candidate = { x: candidate.x + 1, y: candidate.y + 1 }
  }
  return candidate
}

export function buildAreaMapLayout(
  area: AreaDefinition,
  scenes: SceneDefinition[],
  currentSceneId: SceneId,
): AreaMapLayout {
  const sceneMap = new Map(scenes.map((scene) => [scene.id, scene]))
  const positions = new Map<SceneId, Point>()
  const occupied = new Set<string>()
  const queue: SceneId[] = []

  const hub = sceneMap.get(area.hubSceneId) ?? scenes[0]
  if (!hub) {
    return {
      areaId: area.id,
      areaName: area.name,
      areaDescription: area.description ?? '',
      currentSceneId,
      nodes: [],
      edges: [],
    }
  }

  positions.set(hub.id, { x: 0, y: 0 })
  occupied.add('0,0')
  queue.push(hub.id)

  while (queue.length > 0) {
    const sceneId = queue.shift()
    if (!sceneId) {
      continue
    }
    const scene = sceneMap.get(sceneId)
    const origin = positions.get(sceneId)
    if (!scene || !origin) {
      continue
    }

    for (const exit of scene.exits) {
      const target = sceneMap.get(exit.toSceneId)
      if (!target || positions.has(target.id) || !exit.direction) {
        continue
      }
      const vector = DIRECTION_VECTORS[exit.direction]
      const preferred = { x: origin.x + vector.x, y: origin.y + vector.y }
      const slot = findOpenSlot(occupied, preferred)
      positions.set(target.id, slot)
      occupied.add(`${slot.x},${slot.y}`)
      queue.push(target.id)
    }
  }

  for (const scene of scenes) {
    if (positions.has(scene.id)) {
      continue
    }
    const slot = findOpenSlot(occupied, { x: positions.size, y: 0 })
    positions.set(scene.id, slot)
    occupied.add(`${slot.x},${slot.y}`)
  }

  const edges: AreaMapEdgeLayout[] = []
  const seenPairs = new Set<string>()

  for (const scene of scenes) {
    for (const exit of scene.exits) {
      if (!sceneMap.has(exit.toSceneId)) {
        continue
      }
      const pairKey = makePairKey(scene.id, exit.toSceneId)
      if (seenPairs.has(pairKey)) {
        continue
      }
      seenPairs.add(pairKey)
      edges.push({
        fromSceneId: scene.id,
        toSceneId: exit.toSceneId,
        mode: exit.mode,
      })
    }
  }

  const nodes: AreaMapNodeLayout[] = scenes.map((scene) => {
    const point = positions.get(scene.id) ?? { x: 0, y: 0 }
    return {
      sceneId: scene.id,
      name: scene.name,
      kind: scene.kind,
      safety: scene.safety,
      x: point.x,
      y: point.y,
      isCurrent: scene.id === currentSceneId,
    }
  })

  return {
    areaId: area.id,
    areaName: area.name,
    areaDescription: area.description ?? '',
    currentSceneId,
    nodes,
    edges,
  }
}
