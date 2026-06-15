/**
 * @module ui/components/EventLogItem
 * @layer ui
 * @description 战报条目：展示单条战斗事件文本
 * @inputs index, message
 * @outputs 战报列表项 UI
 * @depends ui
 * @forbidden 禁止 import engine、禁止在组件内格式化战斗业务逻辑、禁止直接修改全局状态
 */
interface EventLogItemProps {
  index: number
  message: string
}

export function EventLogItem({ index, message }: EventLogItemProps) {
  return (
    <li className="event-log__item" data-index={index}>
      {message}
    </li>
  )
}
