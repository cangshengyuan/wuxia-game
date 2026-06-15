/**
 * @module ui/components/UnlockToast
 * @layer ui
 * @description 解锁提示：短暂展示新招式解锁通知
 * @inputs gameStore
 * @outputs toast UI
 * @depends store
 * @forbidden 禁止 import engine、禁止在组件内计算解锁规则、禁止直接修改全局状态
 */
import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

const TOAST_DURATION_MS = 3000

export function UnlockToast() {
  const recentUnlocks = useGameStore((state) => state.recentUnlocks)
  const dismissUnlockNotice = useGameStore((state) => state.dismissUnlockNotice)

  useEffect(() => {
    if (recentUnlocks.length === 0) {
      return
    }

    const timers = recentUnlocks.map((notice) =>
      window.setTimeout(() => {
        dismissUnlockNotice(notice.id)
      }, TOAST_DURATION_MS),
    )

    return () => {
      for (const timerId of timers) {
        window.clearTimeout(timerId)
      }
    }
  }, [recentUnlocks, dismissUnlockNotice])

  if (recentUnlocks.length === 0) {
    return null
  }

  return (
    <div className="unlock-toast-container" aria-live="polite">
      {recentUnlocks.map((notice) => (
        <div key={notice.id} className="unlock-toast" role="status">
          解锁新招式：{notice.moveName}（{notice.skillName}）
        </div>
      ))}
    </div>
  )
}
