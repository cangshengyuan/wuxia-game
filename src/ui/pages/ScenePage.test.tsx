/**
 * @module ui/pages/ScenePage.test
 * @layer ui
 * @description 场景页交互测试：验证场景切换后页面立即刷新
 * @inputs ScenePage, gameStore
 * @outputs 测试断言
 * @depends test, store, ui/pages
 * @forbidden 禁止在测试中绕过 store 直接修改 UI 内部状态
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultPlayer, defaultSceneId, useGameStore } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import App from '../../App'
import { ScenePage } from './ScenePage'

function resetGameStore(): void {
  localStorage.clear()
  const rng = useGameStore.getState().rng
  useGameStore.setState({
    player: structuredClone(defaultPlayer),
    recentUnlocks: [],
    currentSceneId: defaultSceneId,
    completedQuests: [],
    activeQuests: [],
    rng,
  })
}

function resetUiStore(): void {
  useUiStore.setState({ currentPage: 'scene' })
}

describe('ScenePage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetGameStore()
    resetUiStore()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('updates the visible scene immediately after switching maps', () => {
    render(<ScenePage />)

    expect(screen.getByRole('heading', { name: '杭州城中' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '探索' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '清波城门' }))

    expect(screen.getByRole('heading', { name: '清波城门' })).toBeInTheDocument()
    expect(screen.getByText('区域状态：戒备区')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '探索' })).toBeDisabled()
  })

  it('switches to the status subpage when clicking the menu button', () => {
    render(<ScenePage />)

    fireEvent.click(screen.getByRole('button', { name: '状态' }))

    expect(useUiStore.getState().currentPage).toBe('status')
  })

  it('keeps the npc dialog open after accepting the first quest', () => {
    render(<ScenePage />)

    fireEvent.click(screen.getByRole('button', { name: '城门剑客' }))
    fireEvent.click(screen.getByRole('button', { name: '接受任务' }))

    expect(screen.getByRole('heading', { name: '城门剑客' })).toBeInTheDocument()
    expect(screen.getByText('「清波城门外的官道常有山贼出没，你去击败一名山贼喽啰，再来找我。」')).toBeInTheDocument()
  })

  it('refreshes the skill management subpage immediately after unequipping and re-equipping', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '功法' }))

    expect(screen.getByRole('heading', { name: '功法总览' })).toBeInTheDocument()

    const externalSlot = screen.getByText('外功槽一').closest('li')
    expect(externalSlot).not.toBeNull()

    fireEvent.click(within(externalSlot!).getByRole('button', { name: '卸下' }))
    expect(within(externalSlot!).getByText('未装备')).toBeInTheDocument()

    const qingmangOption = screen.getByText('青蟒剑法 · 外功槽').closest('li')
    expect(qingmangOption).not.toBeNull()

    const equipButton = within(qingmangOption!).getByRole('button', { name: '装备' })
    expect(equipButton).not.toBeDisabled()

    fireEvent.click(equipButton)
    expect(within(externalSlot!).getByText('青蟒剑法')).toBeInTheDocument()
  })

  it('settles meditation recovery on the scene page timer', () => {
    useGameStore.setState({
      player: {
        ...defaultPlayer,
        hp: 110,
        qi: 50,
        learnedSkills: defaultPlayer.learnedSkills.map((skill) =>
          skill.skillId === 'skill_internal_001_huntuan'
            ? { ...skill, proficiency: 20 }
            : skill,
        ),
      },
    })

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '打坐' }))
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByText((content) => content.includes('114') && content.includes('/120'))).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('54') && content.includes('/69'))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '收功' })).toBeInTheDocument()
  })

  it('keeps meditation running after entering a scene subpage', () => {
    useGameStore.setState({
      player: {
        ...defaultPlayer,
        hp: 110,
        qi: 50,
        learnedSkills: defaultPlayer.learnedSkills.map((skill) =>
          skill.skillId === 'skill_internal_001_huntuan'
            ? { ...skill, proficiency: 20 }
            : skill,
        ),
      },
    })

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '打坐' }))
    fireEvent.click(screen.getByRole('button', { name: '状态' }))

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByText('内力：54/69')).toBeInTheDocument()
    expect(screen.getByText('气血：114/120')).toBeInTheDocument()
  })
})
