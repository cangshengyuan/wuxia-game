import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { asMoveId, asSkillId } from '../../types/id'
import type { BattleResult } from '../../types/battle'
import { useBattleStore } from '../../store/battleStore'
import { BattlePage } from './BattlePage'

const mockEvents: BattleResult['events'] = [
  {
    type: 'SkillReady',
    actorId: 'player_001',
    skillId: asSkillId('skill_sword_010_qingmang'),
    moveId: asMoveId('move_qingmang_01'),
    triggerAt: 5,
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
    amount: 15,
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
  finalEnemyHp: 81,
  proficiencyGains: [],
}

vi.mock('../../engine/combat/combat_runner', () => ({
  startBattle: vi.fn(() => mockBattleResult),
}))

describe('BattlePage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useBattleStore.getState().prepareBattle('enemy_001_bandit_grunt')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders battle log events in order after starting playback', async () => {
    render(<BattlePage />)

    fireEvent.click(screen.getByRole('button', { name: '开战' }))

    await vi.advanceTimersByTimeAsync(400)
    expect(screen.getByText(/准备/)).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(400)
    expect(screen.getByText(/施展/)).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(400)
    expect(screen.getByText(/造成 15 点伤害/)).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(400)
    expect(screen.getByText(/战斗结束/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('胜利')
  })
})
