/**
 * @module ui/pages/SceneSubPage
 * @layer ui
 * @description 场景功能独立页：承载状态、功法、任务与存档等二级页面
 * @inputs uiStore, gameStore, ui/panels
 * @outputs 功能页 UI
 * @depends store, ui/panels
 * @forbidden 禁止 import engine、禁止在组件内计算游戏业务规则、禁止直接修改全局状态
 */
import { useGameStore } from '../../store/gameStore'
import { isSceneSubPage, useUiStore } from '../../store/uiStore'
import { FeaturePlaceholderPanel } from '../panels/FeaturePlaceholderPanel'
import { FormationPanel } from '../panels/FormationPanel'
import { MapPanel } from '../panels/MapPanel'
import { QuestLog } from '../panels/QuestLog'
import { SaveControls } from '../panels/SaveControls'
import { SkillPanel } from '../panels/SkillPanel'
import { StatusPanel } from '../panels/StatusPanel'

const PAGE_META = {
  status: {
    title: '状态总览',
    description: '查看角色数值、属性与当前编成。',
  },
  skills: {
    title: '功法总览',
    description: '管理已学功法与战前编成。',
  },
  map: {
    title: '区域地图',
    description: '查看当前区域的只读节点图与跨区通路。',
  },
  inventory: {
    title: '行囊',
    description: '整理物品与资源。',
  },
  quests: {
    title: '任务记录',
    description: '查看当前任务推进情况。',
  },
  shop: {
    title: '商城服务',
    description: '浏览可购买的内容。',
  },
  save: {
    title: '存档管理',
    description: '手动保存、读取或清档。',
  },
} as const

function renderPageContent(page: keyof typeof PAGE_META) {
  switch (page) {
    case 'status':
      return <StatusPanel />
    case 'skills':
      return (
        <div className="scene-subpage__content-stack">
          <FormationPanel />
          <SkillPanel />
        </div>
      )
    case 'map':
      return <MapPanel />
    case 'inventory':
      return <FeaturePlaceholderPanel title="背包" />
    case 'quests':
      return <QuestLog />
    case 'shop':
      return <FeaturePlaceholderPanel title="商城" />
    case 'save':
      return <SaveControls />
  }
}

export function SceneSubPage() {
  const currentPage = useUiStore((state) => state.currentPage)
  const setPage = useUiStore((state) => state.setPage)
  const currentSceneId = useGameStore((state) => state.currentSceneId)
  const activeQuests = useGameStore((state) => state.activeQuests)
  const getCurrentQuestName = useGameStore((state) => state.getCurrentQuestName)
  const getCurrentScene = useGameStore((state) => state.getCurrentScene)

  if (!isSceneSubPage(currentPage)) {
    return null
  }

  const pageMeta = PAGE_META[currentPage]
  const questName = activeQuests.length > 0 ? getCurrentQuestName() : '暂无'
  const scene = currentSceneId ? getCurrentScene() : undefined

  return (
    <section className="scene-subpage">
      <section className="panel scene-subpage__header">
        <div>
          <h1 className="scene-subpage__title">{pageMeta.title}</h1>
          <p className="scene-layout__description">{pageMeta.description}</p>
          <p className="scene-layout__description">
            当前地点：{scene?.name ?? '未知地带'} / 当前任务：{questName}
          </p>
        </div>
        <button type="button" className="counter counter--secondary" onClick={() => setPage('scene')}>
          返回场景
        </button>
      </section>

      {renderPageContent(currentPage)}
    </section>
  )
}
