/**
 * @module engine/event_bus
 * @layer engine
 * @description 引擎事件总线：类型化订阅与广播，战斗内使用 scoped 实例
 * @inputs BattleEvent 等判别联合事件
 * @outputs unsubscribe 函数
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { BattleEvent } from '../types/battle'

const MAX_EMIT_DEPTH = 5

type EventListener<T extends BattleEvent = BattleEvent> = (event: T) => void

export class EventBus {
  #listeners = new Map<string, Set<EventListener>>()
  #depth = 0

  on<T extends BattleEvent['type']>(
    type: T,
    listener: EventListener<Extract<BattleEvent, { type: T }>>,
  ): () => void {
    let set = this.#listeners.get(type)
    if (!set) {
      set = new Set()
      this.#listeners.set(type, set)
    }
    const wrapped = listener as EventListener
    set.add(wrapped)

    return () => {
      set?.delete(wrapped)
      if (set?.size === 0) {
        this.#listeners.delete(type)
      }
    }
  }

  emit(event: BattleEvent): void {
    if (this.#depth >= MAX_EMIT_DEPTH) {
      console.warn(
        `[event_bus] emit depth exceeded ${MAX_EMIT_DEPTH}, event "${event.type}" aborted`,
      )
      return
    }

    const set = this.#listeners.get(event.type)
    if (!set || set.size === 0) {
      return
    }

    this.#depth += 1
    try {
      for (const listener of [...set]) {
        listener(event)
      }
    } finally {
      this.#depth -= 1
    }
  }
}

export function createScopedBus(): EventBus {
  return new EventBus()
}
