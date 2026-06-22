/**
 * @module ui/panels/FeaturePlaceholderPanel
 * @layer ui
 * @description 占位面板：用于未实现的栏目点击反馈
 * @inputs title
 * @outputs 占位 UI
 * @depends ui
 * @forbidden 禁止引入业务逻辑
 */
interface FeaturePlaceholderPanelProps {
  title: string
}

export function FeaturePlaceholderPanel({ title }: FeaturePlaceholderPanelProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="scene-layout__placeholder">暂未开放。</p>
    </section>
  )
}
