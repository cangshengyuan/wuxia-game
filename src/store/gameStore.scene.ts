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
import { rollEncounter } from '../engine/world/encounter'
import { listNpcsByScene } from '../engine/world/npcEngine'
import { getSceneById } from '../engine/world/sceneEngine'
import { canEnter, getSceneExits } from '../engine/world/scene_transition'
import { asSceneId } from '../types/id'
import type { SceneDestination, GameStoreSlice, GameStoreState } from './gameStore.types'
import type { ProgressState } from '../types/world'

type SceneSliceState = Pick<
  GameStoreState,
  'getCurrentScene' | 'getSceneNpcs' | 'getSceneDestinations' | 'enterScene' | 'explore'
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

export const createSceneSlice: GameStoreSlice<SceneSliceState> = (set, get) => ({
  getCurrentScene: () => {
    const scene = getSceneById(get().currentSceneId)
    if (!scene) {
      return undefined
    }
    return {
      sceneId: scene.id,
      name: scene.name,
      description: scene.description ?? '',
      canExplore: scene.encounters.length > 0,
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
      .filter((sceneId) => canEnter(state.currentSceneId, sceneId, progress))
      .map((sceneId) => {
        const scene = getSceneById(sceneId)
        if (!scene) {
          return undefined
        }
        return { sceneId: scene.id, name: scene.name }
      })
      .filter((entry): entry is SceneDestination => entry !== undefined)
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
    if (!scene) {
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
