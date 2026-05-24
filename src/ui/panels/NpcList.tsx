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
