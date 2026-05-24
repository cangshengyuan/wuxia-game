/**
 * @module engine/game_event_bus
 * @layer engine
 * @description 世界层事件总线：场景、对话、战斗结算等 GameEvent
 * @inputs GameEvent 判别联合
 * @outputs unsubscribe 函数
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store
 */
import type { GameEvent } from '../types/event'

const MAX_EMIT_DEPTH = 5

type EventListener<T extends GameEvent = GameEvent> = (event: T) => void

export class GameEventBus {
  #listeners = new Map<string, Set<EventListener>>()
  #depth = 0

  on<T extends GameEvent['type']>(
    type: T,
    listener: EventListener<Extract<GameEvent, { type: T }>>,
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

  emit(event: GameEvent): void {
    if (this.#depth >= MAX_EMIT_DEPTH) {
      console.warn(
        `[game_event_bus] emit depth exceeded ${MAX_EMIT_DEPTH}, event "${event.type}" aborted`,
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

export const gameEventBus = new GameEventBus()
