/**
 * @module ui/panels/SkillPanel
 * @layer ui
 * @description 功法面板：展示玩家已学功法与当前熟练度、已解锁招式
 * @inputs gameStore
 * @outputs 功法列表 UI
 * @depends store
 * @forbidden 禁止 import engine、禁止在组件内计算功法成长规则、禁止直接修改全局状态
 */
import { useGameStore } from '../../store/gameStore'

export function SkillPanel() {
  const learnedSkills = useGameStore((state) => state.player.learnedSkills)
  const getLearnedSkillDisplays = useGameStore((state) => state.getLearnedSkillDisplays)

  const skillDisplays = learnedSkills.length === 0 ? [] : getLearnedSkillDisplays()

  return (
    <section className="panel">
      <h2>已学功法</h2>
      {skillDisplays.length === 0 ? (
        <p>尚未学习任何功法。</p>
      ) : (
        <ul className="skill-panel__list">
          {skillDisplays.map((display) => (
            <li key={display.skillId} className="skill-panel__item">
              <p className="skill-panel__name">{display.skillName}</p>
              <p className="skill-panel__proficiency">
                熟练度：{display.proficiency} / {display.maxProficiency}
              </p>
              <p className="skill-panel__moves">
                已解锁招式：{display.unlockedMoveNames.join('、') || '无'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
