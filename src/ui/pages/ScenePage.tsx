import { useState } from 'react'
import { gameEventBus } from '../../engine/game_event_bus'
import { getQuestById } from '../../engine/world/questEngine'
import { useGameStore } from '../../store/gameStore'
import { asNpcId, asQuestId } from '../../types/id'
import { NpcList } from '../panels/NpcList'

const FIRST_BLOOD_QUEST_ID = asQuestId('quest_main_001_first_blood')
const SWORDSMAN_NPC_ID = asNpcId('npc_001_village_swordsman')

type ScenePanel = 'main' | 'dialog'

export function ScenePage() {
  const getCurrentScene = useGameStore((state) => state.getCurrentScene)
  const getSceneNpcs = useGameStore((state) => state.getSceneNpcs)
  const getSceneDestinations = useGameStore((state) => state.getSceneDestinations)
  const enterScene = useGameStore((state) => state.enterScene)
  const explore = useGameStore((state) => state.explore)
  const acceptQuest = useGameStore((state) => state.acceptQuest)
  const activeQuests = useGameStore((state) => state.activeQuests)
  const completedQuests = useGameStore((state) => state.completedQuests)

  const scene = getCurrentScene()
  const npcs = getSceneNpcs()
  const destinations = getSceneDestinations()

  const [panel, setPanel] = useState<ScenePanel>('main')
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null)

  const selectedNpc = npcs.find((npc) => npc.id === selectedNpcId)
  const firstBloodQuest = getQuestById(FIRST_BLOOD_QUEST_ID)
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

  const handleDialogProgress = () => {
    if (!selectedNpc) {
      return
    }
    gameEventBus.emit({ type: 'DialogClosed', npcId: asNpcId(selectedNpc.id) })
    handleBackToMain()
  }

  const renderDialogContent = () => {
    if (!selectedNpc || !firstBloodQuest) {
      return <p className="scene-layout__placeholder">（对话内容待实现）</p>
    }

    const isSwordsman = selectedNpc.id === SWORDSMAN_NPC_ID

    if (isSwordsman && !isFirstBloodCompleted && !activeFirstBlood) {
      return (
        <>
          <p>{firstBloodQuest.description}</p>
          <button type="button" className="counter" onClick={() => acceptQuest(FIRST_BLOOD_QUEST_ID)}>
            接受任务
          </button>
        </>
      )
    }

    if (isSwordsman && activeFirstBlood) {
      const currentObjective = firstBloodQuest.objectives[activeFirstBlood.currentStepIndex]

      if (currentObjective?.type === 'talk_to_npc') {
        return (
          <>
            <p>「村外野径常有山贼出没，你去击败一名山贼喽啰，再来找我。」</p>
            <button type="button" className="counter" onClick={handleDialogProgress}>
              继续
            </button>
          </>
        )
      }

      if (currentObjective?.type === 'return_to_npc') {
        return (
          <>
            <p>「不错，你已经有了行走江湖的底气。这套白虹剑法，你且收下。」</p>
            <button type="button" className="counter" onClick={handleDialogProgress}>
              交付任务
            </button>
          </>
        )
      }
    }

    if (isSwordsman && isFirstBloodCompleted) {
      return <p>「江湖路远，多加小心。」</p>
    }

    return <p className="scene-layout__placeholder">「……」</p>
  }

  if (!scene) {
    return (
      <section className="scene-layout panel">
        <h2>场景</h2>
        <p>未知场景。</p>
      </section>
    )
  }

  if (panel === 'dialog' && selectedNpc) {
    return (
      <section className="scene-layout panel">
        <h2>{selectedNpc.name}</h2>
        <p className="scene-layout__description">{selectedNpc.description ?? '（暂无描述）'}</p>
        {renderDialogContent()}
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
