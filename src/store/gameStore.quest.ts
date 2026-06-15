/**
 * @module store/gameStore.quest
 * @layer store
 * @description 任务接取、推进与展示切片
 * @inputs GameEvent, QuestId
 * @outputs getActiveQuestDisplays, getNpcDialogDisplay, acceptQuest, performNpcDialogAction, handleGameEvent, completeQuest
 * @depends engine/quest, engine/world/questEngine, game_event_bus
 * @forbidden 禁止 import React、禁止直接操作 localStorage
 */
import { gameEventBus } from '../engine/game_event_bus'
import { advanceQuest, getCurrentObjectiveDescription } from '../engine/quest/quest_engine'
import { getNpcById } from '../engine/world/npcEngine'
import { getQuestById } from '../engine/world/questEngine'
import { asNpcId, asQuestId } from '../types/id'
import type { QuestId } from '../types/id'
import type { GameEvent } from '../types/event'
import type { GameStoreSlice, GameStoreState } from './gameStore.types'

const FIRST_BLOOD_QUEST_ID = asQuestId('quest_main_001_first_blood')
const SWORDSMAN_NPC_ID = asNpcId('npc_001_village_swordsman')

type QuestSliceState = Pick<
  GameStoreState,
  | 'getActiveQuestDisplays'
  | 'getNpcDialogDisplay'
  | 'acceptQuest'
  | 'performNpcDialogAction'
  | 'handleGameEvent'
  | 'completeQuest'
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

  getNpcDialogDisplay: (npcId) => {
    const id = typeof npcId === 'string' ? asNpcId(npcId) : npcId
    const npc = getNpcById(id)
    if (!npc) {
      return undefined
    }

    const quest = getQuestById(FIRST_BLOOD_QUEST_ID)
    const activeFirstBlood = get().activeQuests.find(
      (activeQuest) => activeQuest.questId === FIRST_BLOOD_QUEST_ID,
    )
    const isFirstBloodCompleted = get().completedQuests.includes(FIRST_BLOOD_QUEST_ID)

    if (!quest || id !== SWORDSMAN_NPC_ID) {
      return {
        npcId: npc.id,
        npcName: npc.name,
        npcDescription: npc.description ?? '（暂无描述）',
        message: '「……」',
      }
    }

    if (!isFirstBloodCompleted && !activeFirstBlood) {
      return {
        npcId: npc.id,
        npcName: npc.name,
        npcDescription: npc.description ?? '（暂无描述）',
        message: quest.description,
        primaryActionLabel: '接受任务',
      }
    }

    if (activeFirstBlood) {
      const currentObjective = quest.objectives[activeFirstBlood.currentStepIndex]
      if (currentObjective?.type === 'talk_to_npc') {
        return {
          npcId: npc.id,
          npcName: npc.name,
          npcDescription: npc.description ?? '（暂无描述）',
          message: '「村外野径常有山贼出没，你去击败一名山贼喽啰，再来找我。」',
          primaryActionLabel: '继续',
        }
      }

      if (currentObjective?.type === 'return_to_npc') {
        return {
          npcId: npc.id,
          npcName: npc.name,
          npcDescription: npc.description ?? '（暂无描述）',
          message: '「不错，你已经有了行走江湖的底气。这套白虹剑法，你且收下。」',
          primaryActionLabel: '交付任务',
        }
      }
    }

    if (isFirstBloodCompleted) {
      return {
        npcId: npc.id,
        npcName: npc.name,
        npcDescription: npc.description ?? '（暂无描述）',
        message: '「江湖路远，多加小心。」',
      }
    }

    return {
      npcId: npc.id,
      npcName: npc.name,
      npcDescription: npc.description ?? '（暂无描述）',
      message: '「……」',
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
    if (id === SWORDSMAN_NPC_ID) {
      const activeFirstBlood = get().activeQuests.find(
        (activeQuest) => activeQuest.questId === FIRST_BLOOD_QUEST_ID,
      )
      const isFirstBloodCompleted = get().completedQuests.includes(FIRST_BLOOD_QUEST_ID)

      if (!isFirstBloodCompleted && !activeFirstBlood) {
        get().acceptQuest(FIRST_BLOOD_QUEST_ID)
        return
      }
    }

    gameEventBus.emit({ type: 'DialogClosed', npcId: id })
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
