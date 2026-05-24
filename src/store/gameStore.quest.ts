/**
 * @module store/gameStore.quest
 * @layer store
 * @description 任务接取、推进与展示切片
 * @inputs GameEvent, QuestId
 * @outputs getActiveQuestDisplays, acceptQuest, handleGameEvent, completeQuest
 * @depends engine/quest, engine/world/questEngine, game_event_bus
 * @forbidden 禁止 import React、禁止直接操作 localStorage
 */
import { gameEventBus } from '../engine/game_event_bus'
import { advanceQuest, getCurrentObjectiveDescription } from '../engine/quest/quest_engine'
import { getQuestById } from '../engine/world/questEngine'
import { asQuestId } from '../types/id'
import type { QuestId } from '../types/id'
import type { GameEvent } from '../types/event'
import type { GameStoreSlice, GameStoreState } from './gameStore.types'

type QuestSliceState = Pick<
  GameStoreState,
  'getActiveQuestDisplays' | 'acceptQuest' | 'handleGameEvent' | 'completeQuest'
>

export const createQuestSlice: GameStoreSlice<QuestSliceState> = (set, get) => ({
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
})

export function registerQuestEventHandlers(
  handleGameEvent: (event: GameEvent) => void,
): void {
  gameEventBus.on('SceneEntered', handleGameEvent)
  gameEventBus.on('DialogClosed', handleGameEvent)
  gameEventBus.on('BattleEnded', handleGameEvent)
}
