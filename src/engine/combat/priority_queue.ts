/**
 * @module combat/priority_queue
 * @layer engine
 * @description 战斗时间轴优先队列（最小堆，支持 update_time / invalidate）
 * @inputs QueueNodeInput
 * @outputs 按 triggerAt 排序的节点
 * @depends combat/types
 * @forbidden 禁止暴露堆数组、禁止 import React、禁止访问 store
 */
import type { QueueNodeInput, QueuePayload } from './types'

interface QueueNode {
  id: string
  triggerAt: number
  payload: QueuePayload
  valid: boolean
}

function compareNodes(a: QueueNode, b: QueueNode): number {
  if (a.triggerAt !== b.triggerAt) {
    return a.triggerAt - b.triggerAt
  }
  return a.id.localeCompare(b.id)
}

export class PriorityQueue {
  #heap: QueueNode[] = []
  #indexById = new Map<string, number>()

  push(input: QueueNodeInput): void {
    const node: QueueNode = { ...input, valid: true }
    this.#heap.push(node)
    const index = this.#heap.length - 1
    this.#indexById.set(node.id, index)
    this.#bubbleUp(index)
  }

  pop(): QueueNodeInput | undefined {
    while (this.#heap.length > 0) {
      const top = this.#extractTop()
      if (top.valid) {
        return { id: top.id, triggerAt: top.triggerAt, payload: top.payload }
      }
    }
    return undefined
  }

  peek(): QueueNodeInput | undefined {
    let best: QueueNode | undefined
    for (const node of this.#heap) {
      if (!node.valid) {
        continue
      }
      if (!best || compareNodes(node, best) < 0) {
        best = node
      }
    }
    if (!best) {
      return undefined
    }
    return { id: best.id, triggerAt: best.triggerAt, payload: best.payload }
  }

  update_time(id: string, newTime: number): boolean {
    const index = this.#indexById.get(id)
    if (index === undefined) {
      return false
    }
    const node = this.#heap[index]
    if (!node.valid) {
      return false
    }
    const oldTime = node.triggerAt
    node.triggerAt = newTime
    if (newTime < oldTime) {
      this.#bubbleUp(index)
    } else if (newTime > oldTime) {
      this.#bubbleDown(index)
    }
    return true
  }

  invalidate(id: string): boolean {
    const index = this.#indexById.get(id)
    if (index === undefined) {
      return false
    }
    this.#heap[index].valid = false
    return true
  }

  #extractTop(): QueueNode {
    const top = this.#heap[0]
    const last = this.#heap.pop()
    this.#indexById.delete(top.id)

    if (this.#heap.length > 0 && last) {
      this.#heap[0] = last
      this.#indexById.set(last.id, 0)
      this.#bubbleDown(0)
    }

    return top
  }

  #bubbleUp(index: number): void {
    let current = index
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2)
      if (compareNodes(this.#heap[current], this.#heap[parent]) >= 0) {
        break
      }
      this.#swap(current, parent)
      current = parent
    }
  }

  #bubbleDown(index: number): void {
    let current = index
    const length = this.#heap.length

    while (true) {
      const left = current * 2 + 1
      const right = current * 2 + 2
      let smallest = current

      if (left < length && compareNodes(this.#heap[left], this.#heap[smallest]) < 0) {
        smallest = left
      }
      if (right < length && compareNodes(this.#heap[right], this.#heap[smallest]) < 0) {
        smallest = right
      }
      if (smallest === current) {
        break
      }
      this.#swap(current, smallest)
      current = smallest
    }
  }

  #swap(a: number, b: number): void {
    const temp = this.#heap[a]
    this.#heap[a] = this.#heap[b]
    this.#heap[b] = temp
    this.#indexById.set(this.#heap[a].id, a)
    this.#indexById.set(this.#heap[b].id, b)
  }
}
