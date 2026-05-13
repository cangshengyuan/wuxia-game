import './App.css'
import { listAllSkills } from './engine/skillEngine'
import { useBattleStore } from './store/battleStore'
import { useGameStore } from './store/gameStore'

function App() {
  const player = useGameStore((state) => state.player)
  const enemy = useBattleStore((state) => state.enemy)
  const snapshot = useBattleStore((state) => state.snapshot)
  const runOneTurn = useBattleStore((state) => state.runOneTurn)
  const skills = listAllSkills()

  return (
    <main className="app-shell">
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

      <section className="panel">
        <h2>战斗快照</h2>
        <p>回合：{snapshot.turn}</p>
        <p>
          玩家气血：{snapshot.playerHp} / 敌人气血：{snapshot.enemyHp}
        </p>
        {snapshot.lastAction ? (
          <p>
            最近动作：{snapshot.lastAction.skillId} 造成 {snapshot.lastAction.damage} 点伤害
          </p>
        ) : (
          <p>尚未开始战斗</p>
        )}
        <button type="button" className="counter" onClick={() => runOneTurn(player)}>
          执行一回合
        </button>
        <p>敌人：{enemy.name}</p>
      </section>
    </main>
  )
}

export default App
