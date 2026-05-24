import { useMemo } from 'react'
import { getCurrentObjectiveDescription } from '../../engine/quest/quest_engine'
import { getQuestById } from '../../engine/world/questEngine'
import { useGameStore } from '../../store/gameStore'

export function QuestLog() {
  const activeQuests = useGameStore((state) => state.activeQuests)

  const quests = useMemo(() => {
    return activeQuests.flatMap((active) => {
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
  }, [activeQuests])

  return (
    <section className="panel quest-log">
      <h2>任务</h2>
      {quests.length === 0 ? (
        <p className="quest-log__empty">暂无进行中的任务</p>
      ) : (
        <ul className="quest-log__list">
          {quests.map((quest) => (
            <li key={quest.questId} className="quest-log__item">
              <strong>{quest.questName}</strong>
              <p>{quest.stepDescription}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
