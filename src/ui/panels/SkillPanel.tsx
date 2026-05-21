import { useGameStore } from '../../store/gameStore'

export function SkillPanel() {
  const learnedSkills = useGameStore((state) => state.player.learnedSkills)
  const getSkillDisplay = useGameStore((state) => state.getSkillDisplay)

  return (
    <section className="panel">
      <h2>已学功法</h2>
      {learnedSkills.length === 0 ? (
        <p>尚未学习任何功法。</p>
      ) : (
        <ul className="skill-panel__list">
          {learnedSkills.map((runtime) => {
            const display = getSkillDisplay(runtime.skillId)
            if (!display) {
              return null
            }

            return (
              <li key={runtime.skillId} className="skill-panel__item">
                <p className="skill-panel__name">{display.skillName}</p>
                <p className="skill-panel__proficiency">
                  熟练度：{display.proficiency} / {display.maxProficiency}
                </p>
                <p className="skill-panel__moves">
                  已解锁招式：{display.unlockedMoveNames.join('、') || '无'}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
