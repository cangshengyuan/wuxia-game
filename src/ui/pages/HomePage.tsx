/**
 * @module ui/pages/HomePage
 * @layer ui
 * @description 首页：展示基础角色信息并提供进入世界入口
 * @inputs gameStore, uiStore
 * @outputs 首页 UI
 * @depends store, ui/panels
 * @forbidden 禁止 import engine、禁止在组件内计算角色成长规则、禁止直接修改全局状态
 */
import { useGameStore } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { FormationPanel } from '../panels/FormationPanel'
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
      <FormationPanel />
    </>
  )
}
