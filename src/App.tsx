import './App.css'
import { useUiStore } from './store/uiStore'
import { UnlockToast } from './ui/components/UnlockToast'
import { QuestLog } from './ui/panels/QuestLog'
import { SaveControls } from './ui/panels/SaveControls'
import { BattlePage } from './ui/pages/BattlePage'
import { HomePage } from './ui/pages/HomePage'
import { ScenePage } from './ui/pages/ScenePage'

function App() {
  const currentPage = useUiStore((state) => state.currentPage)

  return (
    <main className="app-shell">
      {currentPage === 'home' ? <HomePage /> : null}
      {currentPage === 'scene' ? <ScenePage /> : null}
      {currentPage === 'battle' ? <BattlePage /> : null}
      <QuestLog />
      <SaveControls />
      <UnlockToast />
    </main>
  )
}

export default App
