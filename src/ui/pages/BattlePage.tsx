/**
 * @module ui/pages/BattlePage
 * @layer ui
 * @description 战斗页：展示回放中的战斗快照、战报与控制按钮
 * @inputs battleStore, gameStore
 * @outputs 战斗 UI
 * @depends store, ui/components, ui/panels
 * @forbidden 禁止 import engine、禁止在组件内计算伤害/CD/概率、禁止直接修改全局状态
 */
import { useEffect } from 'react'
import { useBattleStore } from '../../store/battleStore'
import { useGameStore } from '../../store/gameStore'
import { EventLogItem } from '../components/EventLogItem'
import { HpBar } from '../components/HpBar'
import { BattleControls } from '../panels/BattleControls'

const PLAYBACK_INTERVAL_MS = 400

export function BattlePage() {
  const player = useGameStore((state) => state.player)
  const status = useBattleStore((state) => state.status)
  const events = useBattleStore((state) => state.events)
  const playbackIndex = useBattleStore((state) => state.playbackIndex)
  const enemy = useBattleStore((state) => state.enemy)
  const playerSnapshot = useBattleStore((state) => state.playerSnapshot)
  const enemySnapshot = useBattleStore((state) => state.enemySnapshot)
  const result = useBattleStore((state) => state.result)
  const tickPlayback = useBattleStore((state) => state.tickPlayback)
  const formatEvent = useBattleStore((state) => state.formatEvent)

  useEffect(() => {
    if (status !== 'running') {
      return
    }

    const timerId = window.setInterval(() => {
      tickPlayback()
    }, PLAYBACK_INTERVAL_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [status, tickPlayback])

  const visibleEvents = playbackIndex >= 0 ? events.slice(0, playbackIndex + 1) : []
  const isVictory = result?.winnerId === player.id

  return (
    <section className="battle-layout panel">
      <h2>战斗</h2>
      <p className="battle-layout__subtitle">对手：{enemy.name}</p>

      <div className="battle-layout__combatants">
        <HpBar
          label={player.name}
          hp={playerSnapshot.hp}
          maxHp={playerSnapshot.maxHp}
          qi={playerSnapshot.qi}
          maxQi={playerSnapshot.maxQi}
        />
        <HpBar
          label={enemy.name}
          hp={enemySnapshot.hp}
          maxHp={enemySnapshot.maxHp}
          qi={enemySnapshot.qi}
          maxQi={enemySnapshot.maxQi}
        />
      </div>

      {status === 'finished' && result ? (
        <p className="battle-layout__outcome" role="status">
          {isVictory ? '胜利' : '失败'}
        </p>
      ) : null}

      <ul className="event-log" aria-label="战报">
        {visibleEvents.map((event, index) => (
          <EventLogItem key={index} index={index} message={formatEvent(event)} />
        ))}
      </ul>

      <BattleControls />
    </section>
  )
}
