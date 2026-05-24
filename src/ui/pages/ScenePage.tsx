import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { NpcList } from '../panels/NpcList'

type ScenePanel = 'main' | 'dialog'

export function ScenePage() {
  const getCurrentScene = useGameStore((state) => state.getCurrentScene)
  const getSceneNpcs = useGameStore((state) => state.getSceneNpcs)
  const getSceneDestinations = useGameStore((state) => state.getSceneDestinations)
  const enterScene = useGameStore((state) => state.enterScene)
  const explore = useGameStore((state) => state.explore)

  const scene = getCurrentScene()
  const npcs = getSceneNpcs()
  const destinations = getSceneDestinations()

  const [panel, setPanel] = useState<ScenePanel>('main')
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null)

  const selectedNpc = npcs.find((npc) => npc.id === selectedNpcId)

  const handleSelectNpc = (npcId: string) => {
    setSelectedNpcId(npcId)
    setPanel('dialog')
  }

  const handleBackToMain = () => {
    setPanel('main')
    setSelectedNpcId(null)
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
        <p className="scene-layout__placeholder">（对话内容待实现）</p>
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
