/**
 * @module ui/panels/SaveControls
 * @layer ui
 * @description 手动存档、读档、清档控制面板
 * @inputs gameStore
 * @outputs 存档操作按钮
 * @depends store
 * @forbidden 禁止 import engine、禁止直接操作 localStorage、禁止直接修改全局状态
 */
import { useGameStore } from '../../store/gameStore'

export function SaveControls() {
  const saveGame = useGameStore((state) => state.saveGame)
  const loadGame = useGameStore((state) => state.loadGame)
  const clearSave = useGameStore((state) => state.clearSave)

  return (
    <section className="panel save-controls">
      <h2>存档</h2>
      <div className="save-controls__actions">
        <button type="button" className="counter" onClick={() => saveGame()}>
          保存
        </button>
        <button type="button" className="counter counter--secondary" onClick={() => loadGame()}>
          读取
        </button>
        <button type="button" className="counter counter--secondary" onClick={() => clearSave()}>
          清档
        </button>
      </div>
    </section>
  )
}
