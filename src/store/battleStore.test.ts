import { beforeEach, describe, expect, it, vi } from 'vitest'
import { asMoveId, asSkillId } from '../types/id'
import type { BattleResult } from '../types/battle'
import { useBattleStore } from './battleStore'

const mockEvents: BattleResult['events'] = [
  {
    type: 'SkillReady',
    actorId: 'player_001',
    skillId: asSkillId('skill_sword_010_qingmang'),
    moveId: asMoveId('move_qingmang_01'),
    triggerAt: 10,
  },
  {
    type: 'SkillExecuted',
    actorId: 'player_001',
    skillId: asSkillId('skill_sword_010_qingmang'),
    moveId: asMoveId('move_qingmang_01'),
  },
  {
    type: 'DamageDealt',
    sourceId: 'player_001',
    targetId: 'enemy_001_bandit_grunt',
    amount: 20,
  },
  {
    type: 'BattleEnded',
    winnerId: 'player_001',
  },
]

const mockBattleResult: BattleResult = {
  winnerId: 'player_001',
  events: mockEvents,
  finalPlayerHp: 120,
  finalEnemyHp: 76,
  proficiencyGains: [{ skillId: asSkillId('skill_sword_010_qingmang'), amount: 1 }],
}

vi.mock('../engine/combat/combat_runner', () => ({
  startBattle: vi.fn(() => mockBattleResult),
}))

describe('battleStore', () => {
  beforeEach(() => {
    useBattleStore.getState().prepareBattle('enemy_001_bandit_grunt')
  })

  it('prepareBattle resets playback state', () => {
    const state = useBattleStore.getState()
    expect(state.status).toBe('idle')
    expect(state.events).toEqual([])
    expect(state.playbackIndex).toBe(-1)
    expect(state.enemy.id).toBe('enemy_001_bandit_grunt')
  })

  it('startBattle stores events and enters running state', () => {
    useBattleStore.getState().startBattle()
    const state = useBattleStore.getState()

    expect(state.status).toBe('running')
    expect(state.events).toHaveLength(4)
    expect(state.playbackIndex).toBe(-1)
    expect(state.pendingResult).toEqual(mockBattleResult)
  })

  it('tickPlayback reveals events and updates enemy hp', () => {
    useBattleStore.getState().startBattle()

    useBattleStore.getState().tickPlayback()
    expect(useBattleStore.getState().playbackIndex).toBe(0)

    useBattleStore.getState().tickPlayback()
    useBattleStore.getState().tickPlayback()

    const state = useBattleStore.getState()
    expect(state.playbackIndex).toBe(2)
    expect(state.enemySnapshot.hp).toBe(76)
  })

  it('endBattle marks finished with result', () => {
    useBattleStore.getState().startBattle()

    for (let index = 0; index < mockEvents.length; index += 1) {
      useBattleStore.getState().tickPlayback()
    }

    const state = useBattleStore.getState()
    expect(state.status).toBe('finished')
    expect(state.result?.winnerId).toBe('player_001')
    expect(state.result?.proficiencyGains).toEqual(mockBattleResult.proficiencyGains)
  })
})
