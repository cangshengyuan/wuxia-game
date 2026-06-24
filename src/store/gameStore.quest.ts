/**
 * @module store/gameStore.quest
 * @layer store
 * @description 任务接取、推进与展示切片
 * @inputs GameEvent, QuestId
 * @outputs getActiveQuestDisplays, getNpcDialogDisplay, acceptQuest, performNpcDialogAction, handleGameEvent, completeQuest
 * @depends engine/quest, engine/world/questEngine, engine/world/npcInteractionEngine, game_event_bus
 * @forbidden 禁止 import React、禁止直接操作 localStorage
 */
import { gameEventBus } from '../engine/game_event_bus'
import { advanceQuest, getCurrentObjectiveDescription } from '../engine/quest/quest_engine'
import { resolveNpcInteraction } from '../engine/world/npcInteractionEngine'
import { getNpcById } from '../engine/world/npcEngine'
import { getQuestById } from '../engine/world/questEngine'
import { asNpcId, asQuestId } from '../types/id'
import type { QuestId } from '../types/id'
import type { GameEvent } from '../types/event'
import type { ProgressState } from '../types/world'
import type { GameStoreSlice, GameStoreState } from './gameStore.types'

type QuestSliceState = Pick<
  GameStoreState,
  | 'getActiveQuestDisplays'
  | 'getCurrentQuestName'
  | 'getNpcDialogDisplay'
  | 'acceptQuest'
  | 'performNpcDialogAction'
  | 'handleGameEvent'
  | 'completeQuest'
>

function buildProgressState(state: GameStoreState): ProgressState {
  return {
    activeQuests: state.activeQuests,
    completedQuests: state.completedQuests,
    learnedSkills: state.player.learnedSkills,
  }
}

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

  getCurrentQuestName: () => {
    return get().getActiveQuestDisplays()[0]?.questName ?? '暂无'
  },

  getNpcDialogDisplay: (npcId) => {
    const id = typeof npcId === 'string' ? asNpcId(npcId) : npcId
    const npc = getNpcById(id)
    if (!npc) {
      return undefined
    }

    const interaction = resolveNpcInteraction(id, buildProgressState(get()))
    return {
      npcId: npc.id,
      npcName: npc.name,
      npcDescription: npc.description ?? '（暂无描述）',
      message: interaction?.message ?? '「……」',
      ...(interaction?.primaryActionLabel
        ? { primaryActionLabel: interaction.primaryActionLabel }
        : {}),
    }
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

  performNpcDialogAction: (npcId) => {
    const id = typeof npcId === 'string' ? asNpcId(npcId) : npcId
    const interaction = resolveNpcInteraction(id, buildProgressState(get()))
    if (!interaction) {
      gameEventBus.emit({ type: 'DialogClosed', npcId: id })
      return true
    }

    let shouldEmitDialogClosed = false
    for (const action of interaction.actions) {
      switch (action.type) {
        case 'learn_skill':
          get().learnSkill(action.skillId)
          break
        case 'accept_quest':
          get().acceptQuest(action.questId)
          break
        case 'emit_dialog_closed':
          shouldEmitDialogClosed = true
          break
        default:
          break
      }
    }

    if (shouldEmitDialogClosed) {
      gameEventBus.emit({ type: 'DialogClosed', npcId: id })
    }

    return interaction.closeDialogOnAction
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
