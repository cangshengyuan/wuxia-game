/**
 * @module App
 * @layer ui
 * @description 应用根组件：根据 UI 页面状态挂载主页面与常驻面板
 * @inputs uiStore, 各页面与面板组件
 * @outputs 根布局 UI
 * @depends store, ui
 * @forbidden 禁止 import engine、禁止在组件内编排游戏业务规则、禁止直接修改全局状态
 */
import './App.css'
import { useUiStore } from './store/uiStore'
import { UnlockToast } from './ui/components/UnlockToast'
import { BattlePage } from './ui/pages/BattlePage'
import { HomePage } from './ui/pages/HomePage'
import { ScenePage } from './ui/pages/ScenePage'
import { SceneSubPage } from './ui/pages/SceneSubPage'
import { GameLoop } from './ui/system/GameLoop'
import { isSceneSubPage } from './store/uiStore'

function App() {
  const currentPage = useUiStore((state) => state.currentPage)

  return (
    <main className="app-shell">
      <GameLoop />
      {currentPage === 'home' ? <HomePage /> : null}
      {currentPage === 'scene' ? <ScenePage /> : null}
      {currentPage === 'battle' ? <BattlePage /> : null}
      {isSceneSubPage(currentPage) ? <SceneSubPage /> : null}
      <UnlockToast />
    </main>
  )
}

export default App
