/**
 * @module engine/combat/priority_queue.test
 * @layer engine
 * @description priority_queue 测试：验证堆序、时间更新与失效逻辑
 * @inputs priority_queue
 * @outputs 测试断言
 * @depends test, engine/combat, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { PriorityQueue } from './priority_queue'
import { asMoveId, asSkillId } from '../../types/id'

const payload = (id: string) => ({
  actorId: id,
  targetId: 'target',
  skillId: asSkillId('skill_sword_010_qingmang'),
  moveId: asMoveId('move_qingmang_01'),
})

describe('PriorityQueue', () => {
  it('pops nodes in triggerAt order with id tie-break', () => {
    const queue = new PriorityQueue()
    queue.push({ id: 'b', triggerAt: 10, payload: payload('b') })
    queue.push({ id: 'a', triggerAt: 10, payload: payload('a') })
    queue.push({ id: 'c', triggerAt: 5, payload: payload('c') })

    expect(queue.pop()?.id).toBe('c')
    expect(queue.pop()?.id).toBe('a')
    expect(queue.pop()?.id).toBe('b')
    expect(queue.pop()).toBeUndefined()
  })

  it('update_time changes pop order', () => {
    const queue = new PriorityQueue()
    queue.push({ id: 'slow', triggerAt: 20, payload: payload('slow') })
    queue.push({ id: 'fast', triggerAt: 15, payload: payload('fast') })

    expect(queue.peek()?.id).toBe('fast')

    queue.update_time('slow', 10)
    expect(queue.pop()?.id).toBe('slow')
    expect(queue.pop()?.id).toBe('fast')
  })

  it('invalidate skips node on pop', () => {
    const queue = new PriorityQueue()
    queue.push({ id: 'first', triggerAt: 1, payload: payload('first') })
    queue.push({ id: 'second', triggerAt: 2, payload: payload('second') })

    queue.invalidate('first')
    expect(queue.pop()?.id).toBe('second')
    expect(queue.pop()).toBeUndefined()
  })
})
