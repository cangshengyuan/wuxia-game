/**
 * @module ui/pages/ScenePage
 * @layer ui
 * @description 场景页：按古早 WAP 信息结构整理场景、NPC 与功能栏目
 * @inputs gameStore, ui/panels
 * @outputs 场景与功能切换 UI
 * @depends store, ui/panels
 * @forbidden 禁止 import engine、禁止在组件内计算任务推进规则、禁止直接修改全局状态
 */
import { useMemo, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useUiStore, type SceneSubPage } from '../../store/uiStore'
import { NpcList } from '../panels/NpcList'

type SceneDialogState = 'main' | 'dialog'

const MENU_ITEMS: Array<{ id: SceneSubPage; label: string }> = [
  { id: 'status', label: '状态' },
  { id: 'skills', label: '功法' },
  { id: 'map', label: '地图' },
  { id: 'inventory', label: '背包' },
  { id: 'quests', label: '任务' },
  { id: 'shop', label: '商城' },
  { id: 'save', label: '存档' },
]

const SAFETY_LABELS = {
  safe: '安全区',
  guarded: '戒备区',
  dangerous: '非安全区',
} as const

const DESTINATION_GROUPS = [
  { mode: 'walk', title: '城内步行' },
  { mode: 'gate', title: '城门通路' },
  { mode: 'station', title: '驿站远行' },
] as const

export function ScenePage() {
  const rawPlayer = useGameStore((state) => state.player)
  const getDisplayPlayer = useGameStore((state) => state.getDisplayPlayer)
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
  const setMeditationActive = useGameStore((state) => state.setMeditationActive)
  const setPage = useUiStore((state) => state.setPage)
  const questName = activeQuests.length > 0 ? getCurrentQuestName() : '暂无'
  void rawPlayer
  const player = getDisplayPlayer()
  const meditation = player.meditation ?? { isActive: false, accumulatedMs: 0 }

  const scene = currentSceneId ? getCurrentScene() : undefined
  const npcs = currentSceneId ? getSceneNpcs() : []
  const destinations = currentSceneId ? getSceneDestinations() : []
  const groupedDestinations = useMemo(
    () =>
      DESTINATION_GROUPS.map((group) => ({
        ...group,
        destinations: destinations.filter((destination) => destination.mode === group.mode),
      })).filter((group) => group.destinations.length > 0),
    [destinations],
  )
  const nextSettleSeconds = useMemo(() => {
    if (!meditation.isActive) {
      return 10
    }
    return Math.max(1, Math.ceil((10_000 - meditation.accumulatedMs) / 1000))
  }, [meditation.accumulatedMs, meditation.isActive])

  const [dialogState, setDialogState] = useState<SceneDialogState>('main')
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null)

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

  const renderDestinationHint = (
    destination: ReturnType<typeof getSceneDestinations>[number],
  ): string => {
    const parts: string[] = [SAFETY_LABELS[destination.safety]]
    if (destination.travelTimeMinutes !== undefined) {
      parts.push(`约 ${destination.travelTimeMinutes} 分钟`)
    }
    if (destination.silverCost !== undefined) {
      parts.push(`花费 ${destination.silverCost} 两`)
    }
    if (destination.label) {
      parts.unshift(destination.label)
    }
    if (!destination.enabled && destination.disabledReason) {
      parts.push(destination.disabledReason)
    }
    return parts.join(' · ')
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
            <p>所在区域：{scene?.areaName ?? '未知区域'}</p>
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
        <p className="scene-layout__description">
          区域状态：{scene ? SAFETY_LABELS[scene.safety] : '未知'}
        </p>
        {scene ? (
          <div className="scene-layout__button-row">
            <button
              type="button"
              className="counter scene-layout__action-button"
              onClick={() => explore()}
              disabled={!scene.canExplore}
            >
              探索
            </button>
            <button
              type="button"
              className="counter scene-layout__action-button"
              onClick={() => setMeditationActive(!meditation.isActive)}
            >
              {meditation.isActive ? '收功' : '打坐'}
            </button>
          </div>
        ) : null}
        <p className="scene-layout__description">
          调息状态：
          {meditation.isActive ? `打坐中，每 10 秒结算一次，下次结算约 ${nextSettleSeconds} 秒后。` : '未在打坐。'}
        </p>
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
            {groupedDestinations.length > 0 ? (
              <div className="scene-layout__destinations">
                {groupedDestinations.map((group) => (
                  <section key={group.mode}>
                    <h3>{group.title}</h3>
                    {group.destinations.map((destination) => (
                      <div key={destination.sceneId}>
                        <button
                          type="button"
                          className="scene-layout__warp-button"
                          onClick={() => enterScene(destination.sceneId)}
                          disabled={!destination.enabled}
                        >
                          {destination.name}
                        </button>
                        <p className="scene-layout__description">{renderDestinationHint(destination)}</p>
                      </div>
                    ))}
                  </section>
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
            return (
              <button
                key={item.id}
                type="button"
                className="scene-menu__button"
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </section>
    </section>
  )
}
