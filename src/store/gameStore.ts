import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  canUpgradeSkill as canUpgradeSkillEngine,
  grantSkill,
  upgradeSkill as upgradeSkillEngine,
} from '../engine/character/skill_runtime'
import { gameEventBus } from '../engine/game_event_bus'
import { clearStorage, loadFromStorage, saveToStorage, STORAGE_KEY } from '../engine/persistence/save_io'
import { SAVE_VERSION } from '../engine/persistence/save_schema'
import { advanceQuest, getCurrentObjectiveDescription } from '../engine/quest/quest_engine'
import { applyProficiencyGain, checkUnlocks } from '../engine/skill/proficiency'
import { getMoveById, getSkillById } from '../engine/skillEngine'
import { createSeededRng, type Rng } from '../engine/util/rng'
import { rollEncounter } from '../engine/world/encounter'
import { listNpcsByScene } from '../engine/world/npcEngine'
import { getQuestById } from '../engine/world/questEngine'
import { getSceneById } from '../engine/world/sceneEngine'
import { canEnter, getSceneExits } from '../engine/world/scene_transition'
import { asMoveId, asQuestId, asSceneId, asSkillId } from '../types/id'
import type { QuestId, SceneId, SkillId } from '../types/id'
import type { BattleResult } from '../types/battle'
import type { CharacterState } from '../types/character'
import type { GameEvent } from '../types/event'
import type { UnlockNotice } from '../types/notice'
import type { ActiveQuest } from '../types/world'
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

export interface QuestDisplay {
  questId: QuestId
  questName: string
  stepDescription: string
}

export const defaultSceneId = asSceneId('scene_001_village')

interface PersistedGameState {
  player: CharacterState
  currentSceneId: SceneId
  completedQuests: QuestId[]
  activeQuests: ActiveQuest[]
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
  getActiveQuestDisplays: () => QuestDisplay[]
  acceptQuest: (questId: QuestId | string) => void
  handleGameEvent: (event: GameEvent) => void
  completeQuest: (questId: QuestId | string) => void
  learnSkill: (skillId: SkillId | string) => void
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
    (set, get) => ({
      player: defaultPlayer,
      recentUnlocks: [],
      currentSceneId: defaultSceneId,
      completedQuests: [],
      activeQuests: [],
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

      getActiveQuestDisplays: () => {
        return get().activeQuests.flatMap((active) => {
          const definition = getQuestById(active.questId)
          if (!definition) {
            return []
          }
          const stepDescription = getCurrentObjectiveDescription(active, definition)
          return [
            {
              questId: active.questId,
              questName: definition.name,
              stepDescription: stepDescription ?? definition.description,
            },
          ]
        })
      },

      acceptQuest: (questId) => {
        const id = typeof questId === 'string' ? asQuestId(questId) : questId
        const definition = getQuestById(id)
        if (!definition) {
          return
        }

        const { activeQuests, completedQuests } = get()
        if (completedQuests.includes(id)) {
          return
        }
        if (activeQuests.some((quest) => quest.questId === id)) {
          return
        }

        set({
          activeQuests: [
            ...activeQuests,
            {
              questId: id,
              currentStepIndex: 0,
              status: 'active',
            },
          ],
        })
      },

      handleGameEvent: (event) => {
        const { activeQuests } = get()
        if (activeQuests.length === 0) {
          return
        }

        let changed = false
        let nextActiveQuests = [...activeQuests]
        const completedQuestIds: QuestId[] = []

        for (const active of activeQuests) {
          const definition = getQuestById(active.questId)
          if (!definition) {
            continue
          }

          const result = advanceQuest(active, definition, event)
          if (result === null) {
            continue
          }

          changed = true

          if (result === 'completed') {
            completedQuestIds.push(active.questId)
            nextActiveQuests = nextActiveQuests.filter((quest) => quest.questId !== active.questId)
            continue
          }

          nextActiveQuests = nextActiveQuests.map((quest) =>
            quest.questId === active.questId ? result : quest,
          )
        }

        if (changed) {
          set({ activeQuests: nextActiveQuests })
        }

        for (const questId of completedQuestIds) {
          get().completeQuest(questId)
        }
      },

      completeQuest: (questId) => {
        const id = typeof questId === 'string' ? asQuestId(questId) : questId
        const definition = getQuestById(id)
        if (!definition) {
          return
        }

        const { completedQuests, activeQuests } = get()
        if (completedQuests.includes(id)) {
          return
        }

        for (const skillId of definition.rewards?.skillIds ?? []) {
          get().learnSkill(skillId)
        }

        set({
          completedQuests: [...completedQuests, id],
          activeQuests: activeQuests.filter((quest) => quest.questId !== id),
        })
      },

      learnSkill: (skillId) => {
        const id = typeof skillId === 'string' ? asSkillId(skillId) : skillId
        const skillDef = getSkillById(id)
        if (!skillDef) {
          return
        }

        const { player, recentUnlocks } = get()
        if (player.learnedSkills.some((runtime) => runtime.skillId === id)) {
          return
        }

        const runtime = grantSkill(id, skillDef)
        const firstMoveId = runtime.unlockedMoveIds[0]
        const moveInfo = firstMoveId ? getMoveById(firstMoveId) : undefined
        const newUnlocks: UnlockNotice[] = firstMoveId
          ? [
              {
                id: nextUnlockNoticeId(),
                skillId: id,
                moveId: asMoveId(firstMoveId),
                skillName: skillDef.name,
                moveName: moveInfo?.move.name ?? firstMoveId,
              },
            ]
          : []

        set({
          player: {
            ...player,
            learnedSkills: [...player.learnedSkills, runtime],
          },
          recentUnlocks: [...recentUnlocks, ...newUnlocks],
        })
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

function registerQuestEventHandlers(): void {
  const dispatch = (event: GameEvent): void => {
    useGameStore.getState().handleGameEvent(event)
  }

  gameEventBus.on('SceneEntered', dispatch)
  gameEventBus.on('DialogClosed', dispatch)
  gameEventBus.on('BattleEnded', dispatch)
}

registerQuestEventHandlers()
