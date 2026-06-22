/**
 * @module ui/pages/BattlePage.test
 * @layer ui
 * @description 战斗页测试：验证时间轴回放与战报渲染顺序
 * @inputs BattlePage, battleStore
 * @outputs 测试断言
 * @depends test, store, ui/pages
 * @forbidden 禁止在测试中绕过 store 直接修改 UI 内部状态
 */
import { render, screen } from '@testing-library/react'
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
  finalPlayerQi: 30,
  finalEnemyHp: 81,
  finalEnemyQi: 10,
  proficiencyGains: [],
}

describe('BattlePage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useBattleStore.getState().prepareBattle('enemy_001_bandit_grunt')
    useBattleStore.setState({
      status: 'running',
      events: mockEvents,
      playbackIndex: -1,
      pendingResult: mockBattleResult,
      result: undefined,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders battle log events in order during playback', async () => {
    render(<BattlePage />)

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
