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
