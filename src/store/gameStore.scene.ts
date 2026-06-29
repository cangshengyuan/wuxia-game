/**
 * @module store/gameStore.scene
 * @layer store
 * @description 场景导航、探索与展示切片
 * @inputs SceneId
 * @outputs getCurrentScene, getSceneNpcs, getSceneDestinations, enterScene, explore
 * @depends engine/world, battleStore, uiStore
 * @forbidden 禁止 import React、禁止直接操作 localStorage
 */
import { gameEventBus } from '../engine/game_event_bus'
import { getAreaById, getAreaBySceneId, listScenesByArea } from '../engine/world/areaEngine'
import { buildAreaMapLayout } from '../engine/world/area_map'
import { rollEncounter } from '../engine/world/encounter'
import { listNpcsByScene } from '../engine/world/npcEngine'
import { getSceneById } from '../engine/world/sceneEngine'
import { canEnter, getEnterFailureReasons, getSceneExits } from '../engine/world/scene_transition'
import { asSceneId } from '../types/id'
import type { SceneDestination, GameStoreSlice, GameStoreState } from './gameStore.types'
import type { ProgressState } from '../types/world'

type SceneSliceState = Pick<
  GameStoreState,
  'getCurrentScene' | 'getSceneNpcs' | 'getSceneDestinations' | 'getCurrentAreaMap' | 'enterScene' | 'explore'
>
import { useBattleStore } from './battleStore'
import { useUiStore } from './uiStore'

function buildProgressState(state: GameStoreState): ProgressState {
  return {
    activeQuests: state.activeQuests,
    completedQuests: state.completedQuests,
    learnedSkills: state.player.learnedSkills,
  }
}

function canExploreScene(scene: NonNullable<ReturnType<typeof getSceneById>>): boolean {
  return scene.safety === 'dangerous' && scene.encounters.length > 0
}

export const createSceneSlice: GameStoreSlice<SceneSliceState> = (set, get) => ({
  getCurrentScene: () => {
    const scene = getSceneById(get().currentSceneId)
    if (!scene) {
      return undefined
    }
    return {
      sceneId: scene.id,
      name: scene.name,
      ...(scene.areaId !== undefined ? { areaId: scene.areaId } : {}),
      ...(scene.areaId !== undefined
        ? { areaName: getAreaById(scene.areaId)?.name ?? scene.areaId }
        : {}),
      kind: scene.kind,
      safety: scene.safety,
      description: scene.description ?? '',
      canExplore: canExploreScene(scene),
    }
  },

  getSceneNpcs: () => {
    return listNpcsByScene(get().currentSceneId).map((npc) => ({
      id: npc.id,
      name: npc.name,
      ...(npc.description !== undefined ? { description: npc.description } : {}),
    }))
  },

  getSceneDestinations: () => {
    const state = get()
    const progress = buildProgressState(state)
    return getSceneExits(state.currentSceneId)
      .map((exit) => {
        const scene = getSceneById(exit.toSceneId)
        if (!scene) {
          return undefined
        }
        const enabled = canEnter(state.currentSceneId, scene.id, progress)
        const blockedReasons = enabled
          ? []
          : getEnterFailureReasons(state.currentSceneId, scene.id, progress)
        return {
          sceneId: scene.id,
          name: scene.name,
          ...(scene.areaId !== undefined ? { areaId: scene.areaId } : {}),
          ...(scene.areaId !== undefined
            ? { areaName: getAreaById(scene.areaId)?.name ?? scene.areaId }
            : {}),
          kind: scene.kind,
          safety: scene.safety,
          mode: exit.mode,
          ...(exit.direction !== undefined ? { direction: exit.direction } : {}),
          ...(exit.label !== undefined ? { label: exit.label } : {}),
          ...(exit.travelTimeMinutes !== undefined ? { travelTimeMinutes: exit.travelTimeMinutes } : {}),
          ...(exit.silverCost !== undefined ? { silverCost: exit.silverCost } : {}),
          enabled,
          ...(!enabled && blockedReasons.length > 0
            ? { disabledReason: blockedReasons.join('；') }
            : {}),
        }
      })
      .filter((entry): entry is SceneDestination => entry !== undefined)
  },

  getCurrentAreaMap: () => {
    const state = get()
    const scene = getSceneById(state.currentSceneId)
    if (!scene?.areaId) {
      return undefined
    }

    const area = getAreaById(scene.areaId)
    if (!area) {
      return undefined
    }

    const progress = buildProgressState(state)
    const areaScenes = listScenesByArea(area.id)
    const layout = buildAreaMapLayout(area, areaScenes, state.currentSceneId)
    const currentAreaId = area.id

    const externalExits = areaScenes.flatMap((areaScene) => {
      return areaScene.exits
        .map((exit) => {
          const targetScene = getSceneById(exit.toSceneId)
          if (!targetScene || targetScene.areaId === currentAreaId) {
            return undefined
          }
          const enabled = canEnter(areaScene.id, targetScene.id, progress)
          const blockedReasons = enabled ? [] : getEnterFailureReasons(areaScene.id, targetScene.id, progress)
          const targetArea = targetScene.areaId ? getAreaById(targetScene.areaId) : getAreaBySceneId(targetScene.id)

          return {
            fromSceneId: areaScene.id,
            fromSceneName: areaScene.name,
            toSceneId: targetScene.id,
            toSceneName: targetScene.name,
            ...(targetArea ? { toAreaName: targetArea.name } : {}),
            mode: exit.mode,
            ...(exit.label !== undefined ? { label: exit.label } : {}),
            ...(exit.travelTimeMinutes !== undefined ? { travelTimeMinutes: exit.travelTimeMinutes } : {}),
            ...(exit.silverCost !== undefined ? { silverCost: exit.silverCost } : {}),
            enabled,
            ...(!enabled && blockedReasons.length > 0
              ? { disabledReason: blockedReasons.join('；') }
              : {}),
          }
        })
        .filter((entry) => entry !== undefined)
    })

    return {
      areaId: area.id,
      areaName: area.name,
      areaDescription: area.description ?? '',
      currentSceneId: state.currentSceneId,
      nodes: layout.nodes,
      edges: layout.edges,
      externalExits,
    }
  },

  enterScene: (sceneId) => {
    const state = get()
    const targetId = typeof sceneId === 'string' ? asSceneId(sceneId) : sceneId
    if (!canEnter(state.currentSceneId, targetId, buildProgressState(state))) {
      return
    }
    if (!getSceneById(targetId)) {
      return
    }
    set({
      currentSceneId: targetId,
      player: {
        ...state.player,
        meditation: {
          isActive: false,
          accumulatedMs: 0,
        },
      },
    })
    gameEventBus.emit({ type: 'SceneEntered', sceneId: targetId })
  },

  explore: () => {
    const scene = getSceneById(get().currentSceneId)
    if (!scene || !canExploreScene(scene)) {
      return
    }
    const enemyId = rollEncounter(scene, get().rng)
    if (!enemyId) {
      return
    }
    set({
      player: {
        ...get().player,
        meditation: {
          isActive: false,
          accumulatedMs: 0,
        },
      },
    })
    useBattleStore.getState().prepareBattle(enemyId)
    useUiStore.getState().setPage('battle')
  },
})
