import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  canUpgradeSkill as canUpgradeSkillEngine,
  upgradeSkill as upgradeSkillEngine,
} from '../engine/character/skill_runtime'
import { clearStorage, loadFromStorage, saveToStorage, STORAGE_KEY } from '../engine/persistence/save_io'
import { SAVE_VERSION } from '../engine/persistence/save_schema'
import { applyProficiencyGain, checkUnlocks } from '../engine/skill/proficiency'
import { getMoveById, getSkillById } from '../engine/skillEngine'
import { createSeededRng, type Rng } from '../engine/util/rng'
import { rollEncounter } from '../engine/world/encounter'
import { listNpcsByScene } from '../engine/world/npcEngine'
import { getSceneById } from '../engine/world/sceneEngine'
import { canEnter, getSceneExits } from '../engine/world/scene_transition'
import { asMoveId, asSceneId, asSkillId } from '../types/id'
import type { QuestId, SceneId, SkillId } from '../types/id'
import type { BattleResult } from '../types/battle'
import type { CharacterState } from '../types/character'
import type { UnlockNotice } from '../types/notice'
import { useUiStore } from './uiStore'

export interface SkillDisplay {
  skillId: SkillId
  skillName: string
  proficiency: number
  maxProficiency: number
  unlockedMoveNames: string[]
}

export interface SceneDisplay {
  sceneId: SceneId
  name: string
  description: string
  canExplore: boolean
}

export interface NpcDisplay {
  id: string
  name: string
  description?: string
}

export interface SceneDestination {
  sceneId: SceneId
  name: string
}

export const defaultSceneId = asSceneId('scene_001_village')

interface PersistedGameState {
  player: CharacterState
  currentSceneId: SceneId
  completedQuests: QuestId[]
}

interface GameStoreState extends PersistedGameState {
  recentUnlocks: UnlockNotice[]
  rng: Rng
  applyBattleResult: (result: BattleResult) => void
  canUpgradeSkill: (skillId: SkillId | string) => boolean
  upgradeSkill: (skillId: SkillId | string) => void
  dismissUnlockNotice: (id: string) => void
  getSkillDisplay: (skillId: SkillId | string) => SkillDisplay | undefined
  getCurrentScene: () => SceneDisplay | undefined
  getSceneNpcs: () => NpcDisplay[]
  getSceneDestinations: () => SceneDestination[]
  enterScene: (sceneId: SceneId | string) => void
  explore: () => void
  clearSave: () => void
}

export const defaultPlayer: CharacterState = {
  id: 'player_001',
  name: '无名侠客',
  level: 1,
  hp: 120,
  maxHp: 120,
  qi: 60,
  maxQi: 60,
  attributes: {
    armStrength: 14,
    agility: 12,
    constitution: 13,
  },
  learnedSkills: [
    {
      skillId: asSkillId('skill_sword_010_qingmang'),
      proficiency: 0,
      unlockedMoveIds: ['move_qingmang_01'],
    },
    {
      skillId: asSkillId('skill_internal_001_huntuan'),
      proficiency: 0,
      unlockedMoveIds: ['move_huntuan_01'],
    },
  ],
  speed: 12,
  equippedSkillIds: [asSkillId('skill_sword_010_qingmang')],
}

let unlockNoticeCounter = 0

function nextUnlockNoticeId(): string {
  unlockNoticeCounter += 1
  return `unlock_${unlockNoticeCounter}`
}

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
    })
  },
  removeItem: (): void => {
    clearStorage()
  },
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      player: defaultPlayer,
      recentUnlocks: [],
      currentSceneId: defaultSceneId,
      completedQuests: [],
      rng: createSeededRng(42),

      applyBattleResult: (result) => {
        const { player } = get()
        const newUnlocks: UnlockNotice[] = []

        const updatedLearnedSkills = player.learnedSkills.map((runtime) => {
          const gain = result.proficiencyGains.find((entry) => entry.skillId === runtime.skillId)
          if (!gain) {
            return runtime
          }

          const skillDef = getSkillById(runtime.skillId)
          if (!skillDef) {
            return runtime
          }

          const withGain = applyProficiencyGain(runtime, gain, skillDef.maxProficiency)
          const { newlyUnlockedMoveIds } = checkUnlocks(withGain, skillDef)

          for (const moveId of newlyUnlockedMoveIds) {
            const moveInfo = getMoveById(moveId)
            newUnlocks.push({
              id: nextUnlockNoticeId(),
              skillId: runtime.skillId,
              moveId: asMoveId(moveId),
              skillName: skillDef.name,
              moveName: moveInfo?.move.name ?? moveId,
            })
          }

          if (newlyUnlockedMoveIds.length === 0) {
            return withGain
          }

          return {
            ...withGain,
            unlockedMoveIds: [...withGain.unlockedMoveIds, ...newlyUnlockedMoveIds],
          }
        })

        set({
          player: {
            ...player,
            hp: result.finalPlayerHp,
            qi: result.finalPlayerQi,
            learnedSkills: updatedLearnedSkills,
          },
          recentUnlocks: [...get().recentUnlocks, ...newUnlocks],
        })
      },

      canUpgradeSkill: (skillId) => {
        const runtime = get().player.learnedSkills.find((entry) => entry.skillId === skillId)
        const skillDef = getSkillById(skillId)
        if (!runtime || !skillDef) {
          return false
        }
        return canUpgradeSkillEngine(runtime, skillDef)
      },

      upgradeSkill: (skillId) => {
        const { player } = get()
        const skillDef = getSkillById(skillId)
        if (!skillDef) {
          return
        }

        set({
          player: {
            ...player,
            learnedSkills: player.learnedSkills.map((runtime) =>
              runtime.skillId === skillId ? upgradeSkillEngine(runtime, skillDef) : runtime,
            ),
          },
        })
      },

      dismissUnlockNotice: (id) => {
        set({ recentUnlocks: get().recentUnlocks.filter((notice) => notice.id !== id) })
      },

      getSkillDisplay: (skillId) => {
        const runtime = get().player.learnedSkills.find((entry) => entry.skillId === skillId)
        const skillDef = getSkillById(skillId)
        if (!runtime || !skillDef) {
          return undefined
        }

        const unlockedMoveNames = runtime.unlockedMoveIds.map((moveId) => {
          const moveInfo = getMoveById(moveId)
          return moveInfo?.move.name ?? moveId
        })

        return {
          skillId: runtime.skillId,
          skillName: skillDef.name,
          proficiency: runtime.proficiency,
          maxProficiency: skillDef.maxProficiency,
          unlockedMoveNames,
        }
      },

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
        return getSceneExits(get().currentSceneId)
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
        const targetId = typeof sceneId === 'string' ? asSceneId(sceneId) : sceneId
        if (!canEnter(get().currentSceneId, targetId)) {
          return
        }
        if (!getSceneById(targetId)) {
          return
        }
        set({ currentSceneId: targetId })
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
        void import('./battleStore').then(({ useBattleStore }) => {
          useBattleStore.getState().prepareBattle(enemyId)
          useUiStore.getState().setPage('battle')
        })
      },

      clearSave: () => {
        clearStorage()
        set({
          player: structuredClone(defaultPlayer),
          currentSceneId: defaultSceneId,
          completedQuests: [],
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
      }),
      storage: createJSONStorage(() => gameStorage),
      version: SAVE_VERSION,
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<PersistedGameState>),
      }),
    },
  ),
)
