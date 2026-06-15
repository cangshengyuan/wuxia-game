/**
 * @module ui/pages/ScenePage.test
 * @layer ui
 * @description 场景页交互测试：验证场景切换后页面立即刷新
 * @inputs ScenePage, gameStore
 * @outputs 测试断言
 * @depends test, store, ui/pages
 * @forbidden 禁止在测试中绕过 store 直接修改 UI 内部状态
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
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

  it('updates the visible scene immediately after switching maps', () => {
    render(<ScenePage />)

    expect(screen.getByRole('heading', { name: '主城新手村' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '探索' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '前往村外野径' }))

    expect(screen.getByRole('heading', { name: '村外野径' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '探索' })).not.toBeDisabled()
  })
})
