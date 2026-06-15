/**
 * @module ui/panels/NpcList
 * @layer ui
 * @description NPC 列表：展示当前场景可交互 NPC
 * @inputs npcs, onSelect
 * @outputs NPC 按钮列表 UI
 * @depends ui
 * @forbidden 禁止 import engine、禁止在组件内计算对话或任务规则、禁止直接修改全局状态
 */
export interface NpcListItem {
  id: string
  name: string
  description?: string
}

interface NpcListProps {
  npcs: NpcListItem[]
  onSelect: (npcId: string) => void
}

export function NpcList({ npcs, onSelect }: NpcListProps) {
  if (npcs.length === 0) {
    return <p className="scene-layout__empty">此处暂无 NPC。</p>
  }

  return (
    <ul className="scene-layout__npc-list" aria-label="NPC 列表">
      {npcs.map((npc) => (
        <li key={npc.id}>
          <button type="button" className="scene-layout__npc-button" onClick={() => onSelect(npc.id)}>
            {npc.name}
          </button>
        </li>
      ))}
    </ul>
  )
}
