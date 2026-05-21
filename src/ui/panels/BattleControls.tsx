import { useBattleStore } from '../../store/battleStore'
import { useUiStore } from '../../store/uiStore'
import type { BattleStatus } from '../../store/battleStore'

function getPrimaryActionLabel(status: BattleStatus): string {
  if (status === 'finished') {
    return '重来'
  }
  return '开战'
}

export function BattleControls() {
  const status = useBattleStore((state) => state.status)
  const startBattle = useBattleStore((state) => state.startBattle)
  const reset = useBattleStore((state) => state.reset)
  const setPage = useUiStore((state) => state.setPage)

  const handlePrimaryAction = () => {
    if (status === 'finished') {
      reset()
      return
    }
    startBattle()
  }

  return (
    <div className="battle-controls">
      <button
        type="button"
        className="counter"
        onClick={handlePrimaryAction}
        disabled={status === 'running'}
      >
        {getPrimaryActionLabel(status)}
      </button>
      <button type="button" className="counter counter--secondary" onClick={() => setPage('home')}>
        返回主城
      </button>
    </div>
  )
}
