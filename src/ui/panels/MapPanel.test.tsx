/**
 * @module ui/panels/MapPanel.test
 * @layer ui
 * @description 地图面板测试：验证区域地图页与跨区通路展示
 * @inputs App, MapPanel, gameStore, uiStore
 * @outputs 测试断言
 * @depends test, store, ui
 * @forbidden 禁止在测试中绕过 store 直接修改 UI 内部状态
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { defaultPlayer, defaultSceneId, useGameStore } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { asQuestId } from '../../types/id'

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

describe('MapPanel', () => {
  beforeEach(() => {
    resetStores()
  })

  afterEach(() => {
    cleanup()
  })

  it('opens the area map subpage from the scene menu', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '地图' }))

    expect(screen.getByRole('heading', { name: '区域地图' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '杭州城区域地图' })).toBeInTheDocument()
    expect(screen.getByText('当前区域共 6 处地点，当前所在节点已高亮显示。')).toBeInTheDocument()
  })

  it('shows blocked station route before quest completion', () => {
    useGameStore.getState().enterScene('scene_006_station')

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '地图' }))

    expect(screen.getByText('杭州驿站 → 苏州驿站（苏州） · 驿站')).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('需要完成任务《初战告捷》'))).toBeInTheDocument()
  })

  it('shows unlocked station route after quest completion', () => {
    useGameStore.getState().enterScene('scene_006_station')
    useGameStore.setState({
      completedQuests: [asQuestId('quest_main_001_first_blood')],
    })

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '地图' }))

    expect(
      screen.getByText((content) => content.includes('乘驿车前往苏州') && content.includes('已满足条件')),
    ).toBeInTheDocument()
  })
})
