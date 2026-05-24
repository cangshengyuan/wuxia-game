import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSeededRng } from '../../engine/util/rng'
import { defaultPlayer, defaultSceneId, useGameStore } from '../../store/gameStore'
import { asSkillId } from '../../types/id'
import { SkillPanel } from './SkillPanel'

function resetGameStore(): void {
  localStorage.clear()
  useGameStore.setState({
    player: structuredClone(defaultPlayer),
    recentUnlocks: [],
    currentSceneId: defaultSceneId,
    completedQuests: [],
    activeQuests: [],
    rng: createSeededRng(42),
  })
}

describe('SkillPanel', () => {
  beforeEach(() => {
    resetGameStore()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders panel heading', () => {
    render(<SkillPanel />)

    expect(screen.getByRole('heading', { name: '已学功法' })).toBeInTheDocument()
  })

  it('shows empty state when player has no learned skills', () => {
    useGameStore.setState({
      player: { ...defaultPlayer, learnedSkills: [] },
    })

    render(<SkillPanel />)

    expect(screen.getByText('尚未学习任何功法。')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('lists learned skills with proficiency and unlocked moves', () => {
    render(<SkillPanel />)

    expect(screen.getByRole('list')).toHaveClass('skill-panel__list')
    expect(screen.getByText('青蟒剑法')).toBeInTheDocument()
    expect(screen.getByText('混元功')).toBeInTheDocument()
    expect(screen.getAllByText('熟练度：0 / 30')).toHaveLength(2)
    expect(screen.getByText('已解锁招式：青蟒出洞')).toBeInTheDocument()
    expect(screen.getByText('已解锁招式：混元运气')).toBeInTheDocument()
  })

  it('reflects updated proficiency and multiple unlocked moves', () => {
    useGameStore.setState({
      player: {
        ...defaultPlayer,
        learnedSkills: [
          {
            skillId: asSkillId('skill_sword_010_qingmang'),
            proficiency: 7,
            unlockedMoveIds: ['move_qingmang_01', 'move_qingmang_02'],
          },
        ],
      },
    })

    render(<SkillPanel />)

    expect(screen.getByText('熟练度：7 / 30')).toBeInTheDocument()
    expect(screen.getByText('已解锁招式：青蟒出洞、蟒尾横扫')).toBeInTheDocument()
  })

  it('shows 无 when skill has no unlocked moves', () => {
    useGameStore.setState({
      player: {
        ...defaultPlayer,
        learnedSkills: [
          {
            skillId: asSkillId('skill_sword_010_qingmang'),
            proficiency: 0,
            unlockedMoveIds: [],
          },
        ],
      },
    })

    render(<SkillPanel />)

    expect(screen.getByText('已解锁招式：无')).toBeInTheDocument()
  })

  it('skips skills that cannot be displayed', () => {
    useGameStore.setState({
      player: {
        ...defaultPlayer,
        learnedSkills: [
          {
            skillId: asSkillId('skill_nonexistent_fake'),
            proficiency: 0,
            unlockedMoveIds: [],
          },
          ...defaultPlayer.learnedSkills,
        ],
      },
    })

    render(<SkillPanel />)

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByText('skill_nonexistent_fake')).not.toBeInTheDocument()
  })
})
