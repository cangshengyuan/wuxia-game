/**
 * @module ui/system/GameLoop
 * @layer ui
 * @description 根组件常驻循环：统一推进打坐恢复与战斗回放
 * @inputs gameStore, battleStore
 * @outputs 无可见 UI
 * @depends React, store
 * @forbidden 禁止 import engine、禁止在页面组件内重复创建同类定时器
 */
import { useEffect } from 'react'
import { useBattleStore } from '../../store/battleStore'
import { useGameStore } from '../../store/gameStore'

const MEDITATION_TICK_MS = 1_000
const BATTLE_PLAYBACK_TICK_MS = 400

export function GameLoop() {
  const meditationActive = useGameStore((state) => state.player.meditation?.isActive ?? false)
  const advanceMeditation = useGameStore((state) => state.advanceMeditation)
  const battleStatus = useBattleStore((state) => state.status)
  const tickPlayback = useBattleStore((state) => state.tickPlayback)

  useEffect(() => {
    if (!meditationActive) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      advanceMeditation(MEDITATION_TICK_MS)
    }, MEDITATION_TICK_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [advanceMeditation, meditationActive])

  useEffect(() => {
    if (battleStatus !== 'running') {
      return undefined
    }

    const timerId = window.setInterval(() => {
      tickPlayback()
    }, BATTLE_PLAYBACK_TICK_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [battleStatus, tickPlayback])

  return null
}
