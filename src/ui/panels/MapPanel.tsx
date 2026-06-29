/**
 * @module ui/panels/MapPanel
 * @layer ui
 * @description 区域地图只读面板：展示当前区域节点图与跨区通路
 * @inputs gameStore
 * @outputs 区域地图 SVG 与说明列表
 * @depends store
 * @forbidden 禁止 import engine、禁止直接修改全局状态
 */
import { useMemo } from 'react'
import { useGameStore } from '../../store/gameStore'

const NODE_WIDTH = 116
const NODE_HEIGHT = 42
const STEP_X = 156
const STEP_Y = 94
const PADDING_X = 28
const PADDING_Y = 28

const SAFETY_LABELS = {
  safe: '安全区',
  guarded: '戒备区',
  dangerous: '非安全区',
} as const

const MODE_LABELS = {
  walk: '步行',
  gate: '城门',
  station: '驿站',
} as const

export function MapPanel() {
  const getCurrentAreaMap = useGameStore((state) => state.getCurrentAreaMap)
  const map = getCurrentAreaMap()

  const geometry = useMemo(() => {
    if (!map || map.nodes.length === 0) {
      return undefined
    }

    const minX = Math.min(...map.nodes.map((node) => node.x))
    const maxX = Math.max(...map.nodes.map((node) => node.x))
    const minY = Math.min(...map.nodes.map((node) => node.y))
    const maxY = Math.max(...map.nodes.map((node) => node.y))

    const nodes = map.nodes.map((node) => ({
      ...node,
      left: PADDING_X + (node.x - minX) * STEP_X,
      top: PADDING_Y + (node.y - minY) * STEP_Y,
    }))
    const nodeMap = new Map(nodes.map((node) => [node.sceneId, node]))
    const edges = map.edges
      .map((edge) => {
        const from = nodeMap.get(edge.fromSceneId)
        const to = nodeMap.get(edge.toSceneId)
        if (!from || !to) {
          return undefined
        }
        return {
          ...edge,
          x1: from.left + NODE_WIDTH / 2,
          y1: from.top + NODE_HEIGHT / 2,
          x2: to.left + NODE_WIDTH / 2,
          y2: to.top + NODE_HEIGHT / 2,
        }
      })
      .filter((edge) => edge !== undefined)

    return {
      width: PADDING_X * 2 + (maxX - minX) * STEP_X + NODE_WIDTH,
      height: PADDING_Y * 2 + (maxY - minY) * STEP_Y + NODE_HEIGHT,
      nodes,
      edges,
    }
  }, [map])

  if (!map || !geometry) {
    return (
      <section className="panel">
        <h2>区域地图</h2>
        <p className="scene-layout__empty">当前地点尚未配置可展示的区域地图。</p>
      </section>
    )
  }

  return (
    <section className="panel map-panel">
      <h2>{map.areaName}</h2>
      <p className="scene-layout__description">{map.areaDescription}</p>
      <p className="scene-layout__description">当前区域共 {map.nodes.length} 处地点，当前所在节点已高亮显示。</p>

      <div className="map-panel__legend">
        <span className="map-panel__legend-item">步行</span>
        <span className="map-panel__legend-item map-panel__legend-item--gate">城门</span>
        <span className="map-panel__legend-item map-panel__legend-item--station">驿站</span>
      </div>

      <div className="map-panel__canvas">
        <svg
          className="map-panel__svg"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          role="img"
          aria-label={`${map.areaName}区域地图`}
        >
          {geometry.edges.map((edge) => (
            <line
              key={`${edge.fromSceneId}-${edge.toSceneId}-${edge.mode}`}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              className={`area-map__edge area-map__edge--${edge.mode}`}
            />
          ))}

          {geometry.nodes.map((node) => (
            <g key={node.sceneId} transform={`translate(${node.left}, ${node.top})`}>
              <rect
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="4"
                className={`area-map__node-box area-map__node-box--${node.safety}${
                  node.isCurrent ? ' area-map__node-box--current' : ''
                }`}
              />
              <text x={NODE_WIDTH / 2} y={18} textAnchor="middle" className="area-map__node-name">
                {node.name}
              </text>
              <text x={NODE_WIDTH / 2} y={32} textAnchor="middle" className="area-map__node-meta">
                {node.isCurrent ? '当前所在' : SAFETY_LABELS[node.safety]}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <section className="map-panel__routes">
        <h3>跨区域通路</h3>
        {map.externalExits.length > 0 ? (
          <ul className="map-panel__route-list">
            {map.externalExits.map((exit) => (
              <li key={`${exit.fromSceneId}-${exit.toSceneId}`} className="map-panel__route-item">
                <p>
                  {exit.fromSceneName} → {exit.toSceneName}
                  {exit.toAreaName ? `（${exit.toAreaName}）` : ''} · {MODE_LABELS[exit.mode]}
                </p>
                <p className="scene-layout__description">
                  {[
                    exit.label,
                    exit.travelTimeMinutes !== undefined ? `约 ${exit.travelTimeMinutes} 分钟` : undefined,
                    exit.silverCost !== undefined ? `花费 ${exit.silverCost} 两` : undefined,
                    exit.enabled ? '已满足条件' : exit.disabledReason,
                  ]
                    .filter((part) => part !== undefined)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="scene-layout__empty">当前区域没有跨区域通路。</p>
        )}
      </section>
    </section>
  )
}
