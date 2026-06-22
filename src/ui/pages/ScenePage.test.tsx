/**
 * @module ui/pages/ScenePage.test
 * @layer ui
 * @description 场景页交互测试：验证场景切换后页面立即刷新
 * @inputs ScenePage, gameStore
 * @outputs 测试断言
 * @depends test, store, ui/pages
 * @forbidden 禁止在测试中绕过 store 直接修改 UI 内部状态
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defaultPlayer, defaultSceneId, useGameStore } from '../../store/gameStore'
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

describe('ScenePage', () => {
  beforeEach(() => {
    resetGameStore()
  })

  afterEach(() => {
    cleanup()
  })

  it('updates the visible scene immediately after switching maps', () => {
    render(<ScenePage />)

    expect(screen.getByRole('heading', { name: '主城新手村' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '探索' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '村外野径' }))

    expect(screen.getByRole('heading', { name: '村外野径' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '探索' })).not.toBeDisabled()
  })

  it('opens the status panel without triggering a render loop', () => {
    render(<ScenePage />)

    fireEvent.click(screen.getByRole('button', { name: '状态' }))

    expect(screen.getByRole('heading', { name: '状态' })).toBeInTheDocument()
    expect(screen.getByText('姓名：无名侠客')).toBeInTheDocument()
    expect(screen.getByText('当前编成')).toBeInTheDocument()
  })

  it('keeps the npc dialog open after accepting the first quest', () => {
    render(<ScenePage />)

    fireEvent.click(screen.getByRole('button', { name: '村口剑客' }))
    fireEvent.click(screen.getByRole('button', { name: '接受任务' }))

    expect(screen.getByRole('heading', { name: '村口剑客' })).toBeInTheDocument()
    expect(screen.getByText('「村外野径常有山贼出没，你去击败一名山贼喽啰，再来找我。」')).toBeInTheDocument()
  })

  it('refreshes the skill management view immediately after unequipping and re-equipping', () => {
    render(<ScenePage />)

    fireEvent.click(screen.getByRole('button', { name: '功法' }))

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
})
