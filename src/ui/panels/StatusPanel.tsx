/**
 * @module ui/panels/StatusPanel
 * @layer ui
 * @description 状态面板：展示角色基础数值、属性与当前编成概览
 * @inputs gameStore
 * @outputs 状态 UI
 * @depends store
 * @forbidden 禁止 import engine、禁止直接修改全局状态
 */
import { useGameStore } from '../../store/gameStore'

export function StatusPanel() {
  const player = useGameStore((state) => state.player)
  const getFormationSlots = useGameStore((state) => state.getFormationSlots)

  const slots = getFormationSlots()

  return (
    <section className="panel">
      <h2>状态</h2>

      <div className="status-panel__grid">
        <p>姓名：{player.name}</p>
        <p>等级：{player.level}</p>
        <p>
          气血：{player.hp}/{player.maxHp}
        </p>
        <p>
          内力：{player.qi}/{player.maxQi}
        </p>
        <p>速度：{player.speed}</p>
        <p>兵器：{player.weaponType ?? '空手'}</p>
      </div>

      <section className="status-panel__section">
        <h3>基础属性</h3>
        <ul className="status-panel__list">
          <li>臂力：{player.attributes.armStrength}</li>
          <li>身法：{player.attributes.agility}</li>
          <li>体魄：{player.attributes.constitution}</li>
        </ul>
      </section>

      <section className="status-panel__section">
        <h3>当前编成</h3>
        <ul className="status-panel__list">
          {slots.map((slot) => (
            <li key={slot.slotId}>
              {slot.slotLabel}：{slot.skillName ?? '未装备'}
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
