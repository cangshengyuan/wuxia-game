/**
 * @module engine/quest/quest_engine
 * @layer engine
 * @description 任务推进纯函数：根据 GameEvent 判断是否完成当前步骤
 * @inputs ActiveQuest, QuestDefinition, GameEvent
 * @outputs ActiveQuest | 'completed' | null
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { GameEvent } from '../../types/event'
import type { ActiveQuest, QuestDefinition } from '../../types/world'

function matchesObjective(
  objective: QuestDefinition['objectives'][number],
  event: GameEvent,
): boolean {
  switch (objective.type) {
    case 'talk_to_npc':
    case 'return_to_npc':
      return event.type === 'DialogClosed' && event.npcId === objective.targetId
    case 'reach_scene':
      return event.type === 'SceneEntered' && event.sceneId === objective.targetId
    case 'defeat_enemy':
      return (
        event.type === 'BattleEnded' &&
        event.winnerId.startsWith('player_') &&
        event.enemyId === objective.targetId
      )
    default:
      return false
  }
}

export function advanceQuest(
  active: ActiveQuest,
  definition: QuestDefinition,
  event: GameEvent,
): ActiveQuest | 'completed' | null {
  const currentObjective = definition.objectives[active.currentStepIndex]
  if (!currentObjective) {
    return null
  }

  if (!matchesObjective(currentObjective, event)) {
    return null
  }

  const nextStepIndex = active.currentStepIndex + 1
  if (nextStepIndex >= definition.objectives.length) {
    return 'completed'
  }

  return {
    ...active,
    currentStepIndex: nextStepIndex,
    status: 'active',
  }
}

export function getCurrentObjectiveDescription(
  active: ActiveQuest,
  definition: QuestDefinition,
): string | undefined {
  return definition.objectives[active.currentStepIndex]?.description
}
