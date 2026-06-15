/**
 * @module ui/components/HpBar
 * @layer ui
 * @description 血量与内力条：展示角色当前战斗快照
 * @inputs label, hp, maxHp, qi, maxQi
 * @outputs 状态条 UI
 * @depends ui
 * @forbidden 禁止 import engine、禁止在组件内计算战斗业务规则、禁止直接修改全局状态
 */
interface HpBarProps {
  label: string
  hp: number
  maxHp: number
  qi: number
  maxQi: number
}

export function HpBar({ label, hp, maxHp, qi, maxQi }: HpBarProps) {
  const hpPercent = maxHp > 0 ? (hp / maxHp) * 100 : 0
  const qiPercent = maxQi > 0 ? (qi / maxQi) * 100 : 0

  return (
    <div className="hp-bar">
      <div className="hp-bar__header">
        <span className="hp-bar__label">{label}</span>
        <span className="hp-bar__values">
          气血 {hp}/{maxHp} · 内力 {qi}/{maxQi}
        </span>
      </div>
      <div className="hp-bar__track" aria-label={`${label} 气血`}>
        <div className="hp-bar__fill hp-bar__fill--hp" style={{ width: `${hpPercent}%` }} />
      </div>
      <div className="hp-bar__track hp-bar__track--qi" aria-label={`${label} 内力`}>
        <div className="hp-bar__fill hp-bar__fill--qi" style={{ width: `${qiPercent}%` }} />
      </div>
    </div>
  )
}
