/**
 * @module ui/pages/ScenePage
 * @layer ui
 * @description 场景页：按古早 WAP 信息结构整理场景、NPC 与功能栏目
 * @inputs gameStore, ui/panels
 * @outputs 场景与功能切换 UI
 * @depends store, ui/panels
 * @forbidden 禁止 import engine、禁止在组件内计算任务推进规则、禁止直接修改全局状态
 */
import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { FeaturePlaceholderPanel } from '../panels/FeaturePlaceholderPanel'
import { FormationPanel } from '../panels/FormationPanel'
import { NpcList } from '../panels/NpcList'
import { QuestLog } from '../panels/QuestLog'
import { SaveControls } from '../panels/SaveControls'
import { SkillPanel } from '../panels/SkillPanel'
import { StatusPanel } from '../panels/StatusPanel'

type SceneDialogState = 'main' | 'dialog'
type SceneUtilityPanel = 'status' | 'skills' | 'inventory' | 'quests' | 'shop' | 'save'

const MENU_ITEMS: Array<{ id: SceneUtilityPanel; label: string }> = [
  { id: 'status', label: '状态' },
  { id: 'skills', label: '功法' },
  { id: 'inventory', label: '背包' },
  { id: 'quests', label: '任务' },
  { id: 'shop', label: '商城' },
  { id: 'save', label: '存档' },
]

export function ScenePage() {
  const player = useGameStore((state) => state.player)
  const currentSceneId = useGameStore((state) => state.currentSceneId)
  const activeQuests = useGameStore((state) => state.activeQuests)
  const getCurrentQuestName = useGameStore((state) => state.getCurrentQuestName)
  const getCurrentScene = useGameStore((state) => state.getCurrentScene)
  const getSceneNpcs = useGameStore((state) => state.getSceneNpcs)
  const getSceneDestinations = useGameStore((state) => state.getSceneDestinations)
  const getNpcDialogDisplay = useGameStore((state) => state.getNpcDialogDisplay)
  const enterScene = useGameStore((state) => state.enterScene)
  const explore = useGameStore((state) => state.explore)
  const performNpcDialogAction = useGameStore((state) => state.performNpcDialogAction)
  const questName = activeQuests.length > 0 ? getCurrentQuestName() : '暂无'

  const scene = currentSceneId ? getCurrentScene() : undefined
  const npcs = currentSceneId ? getSceneNpcs() : []
  const destinations = currentSceneId ? getSceneDestinations() : []

  const [dialogState, setDialogState] = useState<SceneDialogState>('main')
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<SceneUtilityPanel | null>(null)

  const dialog = selectedNpcId ? getNpcDialogDisplay(selectedNpcId) : undefined

  const handleSelectNpc = (npcId: string) => {
    setSelectedNpcId(npcId)
    setDialogState('dialog')
  }

  const handleBackToMain = () => {
    setDialogState('main')
    setSelectedNpcId(null)
  }

  const handleDialogAction = () => {
    if (!selectedNpcId) {
      return
    }
    const shouldCloseDialog = performNpcDialogAction(selectedNpcId)
    if (shouldCloseDialog) {
      handleBackToMain()
    }
  }

  const renderMenuContent = () => {
    switch (activePanel) {
      case 'status':
        return <StatusPanel />
      case 'skills':
        return (
          <div className="scene-layout__panel-stack">
            <FormationPanel />
            <SkillPanel />
          </div>
        )
      case 'quests':
        return <QuestLog />
      case 'inventory':
        return <FeaturePlaceholderPanel title="背包" />
      case 'shop':
        return <FeaturePlaceholderPanel title="商城" />
      case 'save':
        return <SaveControls />
      default:
        return (
          <section className="panel">
            <h2>功能栏目</h2>
            <p className="scene-layout__placeholder">请选择下方栏目。</p>
          </section>
        )
    }
  }

  return (
    <section className="scene-layout">
      <section className="panel scene-summary">
        <div className="scene-summary__identity">
          <div className="scene-summary__avatar" aria-hidden="true">
            头像
          </div>
          <div className="scene-summary__identity-text">
            <h2>{player.name}</h2>
            <p>当前地点：{scene?.name ?? '未知地带'}</p>
            <p>当前任务：{questName}</p>
          </div>
        </div>

        <div className="scene-summary__meters">
          <div className="scene-summary__meter">
            <div className="scene-summary__meter-label">
              <span>生命</span>
              <span>
                {player.hp}/{player.maxHp}
              </span>
            </div>
            <div className="scene-summary__meter-track" aria-label="生命">
              <div
                className="scene-summary__meter-fill scene-summary__meter-fill--hp"
                style={{ width: `${player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="scene-summary__meter">
            <div className="scene-summary__meter-label">
              <span>内力</span>
              <span>
                {player.qi}/{player.maxQi}
              </span>
            </div>
            <div className="scene-summary__meter-track" aria-label="内力">
              <div
                className="scene-summary__meter-fill scene-summary__meter-fill--qi"
                style={{ width: `${player.maxQi > 0 ? (player.qi / player.maxQi) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel scene-map">
        <h2>{scene?.name ?? '场景'}</h2>
        <p className="scene-layout__description">{scene?.description ?? '未知场景。'}</p>
        {scene ? (
          <button
            type="button"
            className="counter scene-layout__action"
            onClick={() => explore()}
            disabled={!scene.canExplore}
          >
            探索
          </button>
        ) : null}
      </section>

      {dialogState === 'dialog' && dialog ? (
        <section className="panel scene-layout__dialog-panel">
          <h2>{dialog.npcName}</h2>
          <p className="scene-layout__description">{dialog.npcDescription}</p>
          <p className="scene-layout__dialog-copy">{dialog.message}</p>
          <div className="scene-layout__button-row">
            {dialog.primaryActionLabel ? (
              <button type="button" className="counter" onClick={handleDialogAction}>
                {dialog.primaryActionLabel}
              </button>
            ) : null}
            <button type="button" className="counter counter--secondary" onClick={handleBackToMain}>
              返回
            </button>
          </div>
        </section>
      ) : (
        <div className="scene-layout__grid">
          <section className="panel scene-layout__block">
            <h2>可交互 NPC</h2>
            <NpcList npcs={npcs} onSelect={handleSelectNpc} />
          </section>

          <section className="panel scene-layout__block">
            <h2>可移动地图</h2>
            {destinations.length > 0 ? (
              <div className="scene-layout__destinations">
                {destinations.map((destination) => (
                  <button
                    key={destination.sceneId}
                    type="button"
                    className="scene-layout__warp-button"
                    onClick={() => enterScene(destination.sceneId)}
                  >
                    {destination.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="scene-layout__empty">暂无可前往地点。</p>
            )}
          </section>
        </div>
      )}

      <section className="panel scene-menu">
        <h2>功能</h2>
        <div className="scene-menu__list">
          {MENU_ITEMS.map((item) => {
            const isActive = activePanel === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`scene-menu__button${isActive ? ' scene-menu__button--active' : ''}`}
                onClick={() => setActivePanel((current) => (current === item.id ? null : item.id))}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="scene-layout__menu-content">{renderMenuContent()}</div>
    </section>
  )
}
