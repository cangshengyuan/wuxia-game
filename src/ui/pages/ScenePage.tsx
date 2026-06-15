/**
 * @module ui/pages/ScenePage
 * @layer ui
 * @description 场景页：展示当前场景、NPC、探索与场景切换入口
 * @inputs gameStore, NpcList
 * @outputs 场景与对话 UI
 * @depends store, ui/panels
 * @forbidden 禁止 import engine、禁止在组件内计算任务推进规则、禁止直接修改全局状态
 */
import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { asQuestId } from '../../types/id'
import { NpcList } from '../panels/NpcList'

const FIRST_BLOOD_QUEST_ID = asQuestId('quest_main_001_first_blood')

type ScenePanel = 'main' | 'dialog'

export function ScenePage() {
  const currentSceneId = useGameStore((state) => state.currentSceneId)
  const activeQuests = useGameStore((state) => state.activeQuests)
  const completedQuests = useGameStore((state) => state.completedQuests)
  const getCurrentScene = useGameStore((state) => state.getCurrentScene)
  const getSceneNpcs = useGameStore((state) => state.getSceneNpcs)
  const getSceneDestinations = useGameStore((state) => state.getSceneDestinations)
  const getNpcDialogDisplay = useGameStore((state) => state.getNpcDialogDisplay)
  const enterScene = useGameStore((state) => state.enterScene)
  const explore = useGameStore((state) => state.explore)
  const performNpcDialogAction = useGameStore((state) => state.performNpcDialogAction)

  const scene = currentSceneId ? getCurrentScene() : undefined
  const npcs = currentSceneId ? getSceneNpcs() : []
  const destinations = currentSceneId ? getSceneDestinations() : []

  const [panel, setPanel] = useState<ScenePanel>('main')
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null)

  const dialog = selectedNpcId ? getNpcDialogDisplay(selectedNpcId) : undefined
  const activeFirstBlood = activeQuests.find((quest) => quest.questId === FIRST_BLOOD_QUEST_ID)
  const isFirstBloodCompleted = completedQuests.includes(FIRST_BLOOD_QUEST_ID)

  const handleSelectNpc = (npcId: string) => {
    setSelectedNpcId(npcId)
    setPanel('dialog')
  }

  const handleBackToMain = () => {
    setPanel('main')
    setSelectedNpcId(null)
  }

  const handleDialogAction = () => {
    if (!selectedNpcId) {
      return
    }
    const hadQuestAction = !activeFirstBlood && !isFirstBloodCompleted

    performNpcDialogAction(selectedNpcId)

    if (!hadQuestAction) {
      handleBackToMain()
    }
  }

  if (!scene) {
    return (
      <section className="scene-layout panel">
        <h2>场景</h2>
        <p>未知场景。</p>
      </section>
    )
  }

  if (panel === 'dialog' && dialog) {
    return (
      <section className="scene-layout panel">
        <h2>{dialog.npcName}</h2>
        <p className="scene-layout__description">{dialog.npcDescription}</p>
        <p>{dialog.message}</p>
        {dialog.primaryActionLabel ? (
          <button type="button" className="counter" onClick={handleDialogAction}>
            {dialog.primaryActionLabel}
          </button>
        ) : null}
        <button type="button" className="counter counter--secondary" onClick={handleBackToMain}>
          返回
        </button>
      </section>
    )
  }

  return (
    <section className="scene-layout panel">
      <h2>{scene.name}</h2>
      <p className="scene-layout__description">{scene.description}</p>

      <section className="scene-layout__section">
        <h3>NPC</h3>
        <NpcList npcs={npcs} onSelect={handleSelectNpc} />
      </section>

      <section className="scene-layout__section">
        <h3>行动</h3>
        <button
          type="button"
          className="counter"
          onClick={() => explore()}
          disabled={!scene.canExplore}
        >
          探索
        </button>
      </section>

      {destinations.length > 0 ? (
        <section className="scene-layout__section">
          <h3>前往</h3>
          <div className="scene-layout__destinations">
            {destinations.map((destination) => (
              <button
                key={destination.sceneId}
                type="button"
                className="counter counter--secondary"
                onClick={() => enterScene(destination.sceneId)}
              >
                前往{destination.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
