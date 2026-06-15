/**
 * @module engine/combat/combat_runner.test
 * @layer engine
 * @description combat_runner 测试：验证固定输入下事件流与结算稳定性
 * @inputs combat_runner
 * @outputs 测试断言
 * @depends test, engine/combat, engine/world, types
 * @forbidden 禁止在测试中访问 store 或 UI
 */
import { describe, expect, it } from 'vitest'
import { startBattle } from './combat_runner'
import { buildEnemyState } from '../world/enemyEngine'
import { createSeededRng } from '../util/rng'
import { asSkillId } from '../../types/id'
import type { CharacterState } from '../../types/character'

const testPlayer: CharacterState = {
  id: 'player_001',
  name: '无名侠客',
  level: 1,
  hp: 120,
  maxHp: 120,
  qi: 60,
  maxQi: 60,
  attributes: {
    armStrength: 14,
    agility: 12,
    constitution: 13,
  },
  learnedSkills: [
    {
      skillId: asSkillId('skill_sword_010_qingmang'),
      proficiency: 0,
      unlockedMoveIds: ['move_qingmang_01'],
    },
    {
      skillId: asSkillId('skill_internal_001_huntuan'),
      proficiency: 0,
      unlockedMoveIds: ['move_huntuan_01'],
    },
  ],
  speed: 12,
  equippedSkillIds: [asSkillId('skill_sword_010_qingmang')],
}

describe('combat_runner', () => {
  it('runs a deterministic battle with fixed seed and player vs bandit grunt', () => {
    const enemy = buildEnemyState('enemy_001_bandit_grunt')
    expect(enemy).toBeDefined()

    const result = startBattle({
      player: testPlayer,
      enemy: enemy!,
      rng: createSeededRng(42),
    })

    expect(result.winnerId).toBe('player_001')
    expect(result.finalPlayerHp).toBeGreaterThan(0)
    expect(result.finalEnemyHp).toBe(0)
    expect(result.events.at(-1)).toEqual({ type: 'BattleEnded', winnerId: 'player_001' })
    expect(result.proficiencyGains).toEqual([
      { skillId: asSkillId('skill_sword_010_qingmang'), amount: 4 },
    ])
    expect(result.events).toMatchSnapshot()
  })

  it('emits SkillReady before SkillExecuted on successful attacks', () => {
    const enemy = buildEnemyState('enemy_001_bandit_grunt')!
    const result = startBattle({
      player: testPlayer,
      enemy,
      rng: createSeededRng(42),
    })

    const firstReadyIndex = result.events.findIndex((event) => event.type === 'SkillReady')
    const firstExecutedIndex = result.events.findIndex((event) => event.type === 'SkillExecuted')
    expect(firstReadyIndex).toBeGreaterThanOrEqual(0)
    expect(firstExecutedIndex).toBeGreaterThan(firstReadyIndex)
  })
})
