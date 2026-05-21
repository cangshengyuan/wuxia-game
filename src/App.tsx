import './App.css'
import { useUiStore } from './store/uiStore'
import { UnlockToast } from './ui/components/UnlockToast'
import { BattlePage } from './ui/pages/BattlePage'
import { HomePage } from './ui/pages/HomePage'

function App() {
  const currentPage = useUiStore((state) => state.currentPage)

  return (
    <main className="app-shell">
      {currentPage === 'home' ? <HomePage /> : null}
      {currentPage === 'battle' ? <BattlePage /> : null}
      <UnlockToast />
    </main>
  )
}

export default App
