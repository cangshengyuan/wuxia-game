/**
 * @module store/gameStore
 * @layer store
 * @description 游戏主状态容器：合并角色/战斗/场景/任务切片与持久化适配器
 * @inputs 各切片 action、localStorage
 * @outputs useGameStore
 * @depends engine/persistence, store 切片
 * @forbidden 禁止 import React、禁止在 ui 层之外直接 mutate 状态
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { clearStorage, loadFromStorage, saveToStorage, STORAGE_KEY } from '../engine/persistence/save_io'
import { SAVE_VERSION } from '../engine/persistence/save_schema'
import { createSeededRng } from '../engine/util/rng'
import { createBattleSlice } from './gameStore.battle'
import { createCharacterSlice } from './gameStore.character'
import { defaultPlayer, defaultSceneId } from './gameStore.defaults'
import { createQuestSlice, registerQuestEventHandlers } from './gameStore.quest'
import { createSceneSlice } from './gameStore.scene'
import type { GameStoreState, PersistedGameState } from './gameStore.types'

export type {
  NpcDialogDisplay,
  NpcDisplay,
  QuestDisplay,
  SceneDestination,
  SceneDisplay,
  SkillDisplay,
} from './gameStore.types'
export { defaultPlayer, defaultSceneId } from './gameStore.defaults'

const gameStorage = {
  getItem: (): string | null => {
    const save = loadFromStorage()
    if (!save) {
      return null
    }
    return JSON.stringify({
      state: {
        player: save.player,
        currentSceneId: save.currentSceneId,
        completedQuests: save.completedQuests,
        activeQuests: save.activeQuests,
      },
      version: save.version,
    })
  },
  setItem: (_key: string, value: string): void => {
    const parsed = JSON.parse(value) as {
      state: PersistedGameState
    }
    saveToStorage({
      version: SAVE_VERSION,
      player: parsed.state.player,
      currentSceneId: parsed.state.currentSceneId,
      completedQuests: parsed.state.completedQuests ?? [],
      activeQuests: parsed.state.activeQuests ?? [],
    })
  },
  removeItem: (): void => {
    clearStorage()
  },
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get, api) => ({
      player: structuredClone(defaultPlayer),
      currentSceneId: defaultSceneId,
      completedQuests: [],
      activeQuests: [],
      rng: createSeededRng(42),

      ...createBattleSlice(set, get, api),
      ...createCharacterSlice(set, get, api),
      ...createSceneSlice(set, get, api),
      ...createQuestSlice(set, get, api),

      saveGame: () => {
        const { player, currentSceneId, completedQuests, activeQuests } = get()
        saveToStorage({
          version: SAVE_VERSION,
          player,
          currentSceneId,
          completedQuests,
          activeQuests,
        })
      },

      loadGame: () => {
        const save = loadFromStorage()
        if (!save) {
          return
        }
        set({
          player: save.player,
          currentSceneId: save.currentSceneId,
          completedQuests: save.completedQuests,
          activeQuests: save.activeQuests,
          recentUnlocks: [],
        })
      },

      clearSave: () => {
        clearStorage()
        set({
          player: structuredClone(defaultPlayer),
          currentSceneId: defaultSceneId,
          completedQuests: [],
          activeQuests: [],
          recentUnlocks: [],
          rng: createSeededRng(42),
        })
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        player: state.player,
        currentSceneId: state.currentSceneId,
        completedQuests: state.completedQuests,
        activeQuests: state.activeQuests,
      }),
      storage: createJSONStorage(() => gameStorage),
      version: SAVE_VERSION,
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<PersistedGameState>),
        activeQuests: (persisted as Partial<PersistedGameState>).activeQuests ?? [],
      }),
    },
  ),
)

registerQuestEventHandlers((event) => {
  useGameStore.getState().handleGameEvent(event)
})
