/**
 * @module ui/panels/BattleControls
 * @layer ui
 * @description 战斗控制面板：提供开战、重来与返回场景操作
 * @inputs battleStore, uiStore
 * @outputs 控制按钮 UI
 * @depends store
 * @forbidden 禁止 import engine、禁止在组件内计算战斗结算规则、禁止直接修改全局状态
 */
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
      <button type="button" className="counter counter--secondary" onClick={() => setPage('scene')}>
        返回场景
      </button>
    </div>
  )
}
