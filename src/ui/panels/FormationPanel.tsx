/**
 * @module ui/panels/FormationPanel
 * @layer ui
 * @description 战前编成面板：展示槽位并提供装备/卸下入口
 * @inputs gameStore
 * @outputs 编成配置 UI
 * @depends store
 * @forbidden 禁止 import engine、禁止在组件内计算槽位规则、禁止直接修改全局状态
 */
import { useGameStore } from '../../store/gameStore'

export function FormationPanel() {
  const getFormationSlots = useGameStore((state) => state.getFormationSlots)
  const getFormationSkillOptions = useGameStore((state) => state.getFormationSkillOptions)
  const equipSkill = useGameStore((state) => state.equipSkill)
  const unequipSkill = useGameStore((state) => state.unequipSkill)

  const slots = getFormationSlots()
  const options = getFormationSkillOptions()

  return (
    <section className="panel">
      <h2>战前编成</h2>
      <ul className="skill-panel__list">
        {slots.map((slot) => (
          <li key={slot.slotId} className="skill-panel__item">
            <p className="skill-panel__name">{slot.slotLabel}</p>
            <p>{slot.skillName ?? '未装备'}</p>
            {slot.skillId ? (
              <button
                type="button"
                className="counter counter--secondary"
                onClick={() => unequipSkill(slot.skillId!)}
              >
                卸下
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <ul className="skill-panel__list">
        {options.map((option) => (
          <li key={option.skillId} className="skill-panel__item">
            <p className="skill-panel__name">
              {option.skillName} · {option.slotLabel}
            </p>
            <p>{option.isEquipped ? '已装备' : option.reason ?? '可装备'}</p>
            <button
              type="button"
              className="counter"
              onClick={() => equipSkill(option.skillId)}
              disabled={!option.canEquip || option.isEquipped}
            >
              装备
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
