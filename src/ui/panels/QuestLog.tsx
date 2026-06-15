/**
 * @module ui/panels/QuestLog
 * @layer ui
 * @description 任务日志：展示活动任务与当前目标描述
 * @inputs gameStore
 * @outputs 任务列表 UI
 * @depends store
 * @forbidden 禁止 import engine、禁止在组件内计算任务推进规则、禁止直接修改全局状态
 */
import { useGameStore } from '../../store/gameStore'

export function QuestLog() {
  const activeQuests = useGameStore((state) => state.activeQuests)
  const getActiveQuestDisplays = useGameStore((state) => state.getActiveQuestDisplays)

  const quests = activeQuests.length === 0 ? [] : getActiveQuestDisplays()

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
