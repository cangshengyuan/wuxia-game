import { describe, expect, it, vi } from 'vitest'
import { createScopedBus } from './event_bus'
import type { BattleEvent } from '../types/battle'
import { asMoveId, asSkillId } from '../types/id'

describe('event_bus', () => {
  it('unsubscribe stops listener from firing', () => {
    const bus = createScopedBus()
    const listener = vi.fn()
    const unsubscribe = bus.on('BattleEnded', listener)

    bus.emit({ type: 'BattleEnded', winnerId: 'player_001' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    bus.emit({ type: 'BattleEnded', winnerId: 'player_001' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('aborts emit when recursive depth exceeds 5', () => {
    const bus = createScopedBus()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let depth = 0
    const deepListener = vi.fn(() => {
      depth += 1
      if (depth <= 6) {
        bus.emit({ type: 'BattleEnded', winnerId: 'player_001' })
      }
    })

    bus.on('BattleEnded', deepListener)
    bus.emit({ type: 'BattleEnded', winnerId: 'player_001' })

    expect(deepListener).toHaveBeenCalledTimes(5)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('scoped buses are isolated from each other', () => {
    const busA = createScopedBus()
    const busB = createScopedBus()
    const listenerA = vi.fn()
    const listenerB = vi.fn()

    busA.on('SkillExecuted', listenerA)
    busB.on('SkillExecuted', listenerB)

    const event: BattleEvent = {
      type: 'SkillExecuted',
      actorId: 'player_001',
      skillId: asSkillId('skill_sword_010_qingmang'),
      moveId: asMoveId('move_qingmang_01'),
    }

    busA.emit(event)
    expect(listenerA).toHaveBeenCalledTimes(1)
    expect(listenerB).toHaveBeenCalledTimes(0)
  })
})
