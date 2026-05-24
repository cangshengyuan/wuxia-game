import { useGameStore } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { SkillPanel } from '../panels/SkillPanel'

export function HomePage() {
  const player = useGameStore((state) => state.player)
  const setPage = useUiStore((state) => state.setPage)

  return (
    <>
      <h1>Wuxia Game Skeleton</h1>
      <p className="subtitle">Data -&gt; Engine -&gt; Store -&gt; UI</p>

      <section className="panel">
        <h2>玩家信息</h2>
        <p>姓名：{player.name}</p>
        <p>
          气血：{player.hp}/{player.maxHp}
        </p>
        <p>
          内力：{player.qi}/{player.maxQi}
        </p>
        <button type="button" className="counter" onClick={() => setPage('scene')}>
          进入世界
        </button>
      </section>

      <SkillPanel />
    </>
  )
}
