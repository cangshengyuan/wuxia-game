import { listAllSkills } from '../../engine/skillEngine'
import { useGameStore } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'

export function HomePage() {
  const player = useGameStore((state) => state.player)
  const setPage = useUiStore((state) => state.setPage)
  const skills = listAllSkills()

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
        <button type="button" className="counter" onClick={() => setPage('battle')}>
          进入战斗
        </button>
      </section>

      <section className="panel">
        <h2>技能目录</h2>
        <ul>
          {skills.map((skill) => (
            <li key={skill.id}>
              {skill.name} ({skill.id})
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
