/**
 * @module App.test
 * @layer ui
 * @description 根组件测试：验证默认入口页渲染正确
 * @inputs App
 * @outputs 测试断言
 * @depends test, ui
 * @forbidden 禁止在测试中绕过 store 直接修改 UI 内部状态
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { defaultPlayer, defaultSceneId, useGameStore } from './store/gameStore'
import { useUiStore } from './store/uiStore'

function resetStores(): void {
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
  useUiStore.setState({ currentPage: 'scene' })
}

describe('App skeleton', () => {
  beforeEach(() => {
    resetStores()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders scene page as default entry', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '杭州城中' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '城门剑客' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '探索' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '清波城门' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '杭州驿站' })).toBeInTheDocument()
  })

  it('navigates to a scene subpage and back', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '状态' }))

    expect(screen.getByRole('heading', { name: '状态总览' })).toBeInTheDocument()
    expect(screen.getByText('姓名：无名侠客')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '返回场景' }))

    expect(screen.getByRole('heading', { name: '杭州城中' })).toBeInTheDocument()
  })
})
