import { saveToStorage } from '../../engine/persistence/save_io'
import { SAVE_VERSION } from '../../engine/persistence/save_schema'
import { useGameStore } from '../../store/gameStore'

export function SaveControls() {
  const handleSave = () => {
    const { player, currentSceneId, completedQuests } = useGameStore.getState()
    saveToStorage({
      version: SAVE_VERSION,
      player,
      currentSceneId,
      completedQuests,
    })
  }

  const handleLoad = () => {
    void useGameStore.persist.rehydrate()
  }

  const handleClear = () => {
    useGameStore.getState().clearSave()
  }

  return (
    <section className="panel save-controls">
      <h2>存档</h2>
      <div className="save-controls__actions">
        <button type="button" className="counter" onClick={handleSave}>
          保存
        </button>
        <button type="button" className="counter counter--secondary" onClick={handleLoad}>
          读取
        </button>
        <button type="button" className="counter counter--secondary" onClick={handleClear}>
          清档
        </button>
      </div>
    </section>
  )
}
