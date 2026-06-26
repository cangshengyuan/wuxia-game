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
import { buildBattleReadyCharacter } from '../character/attributes'
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
      realmLevel: 1,
      insight: 0,
      unlockedMoveIds: ['move_qingmang_01'],
    },
    {
      skillId: asSkillId('skill_internal_001_huntuan'),
      proficiency: 0,
      realmLevel: 1,
      insight: 0,
      unlockedMoveIds: ['move_huntuan_01'],
    },
  ],
  speed: 12,
  formation: {
    external: [asSkillId('skill_sword_010_qingmang')],
  },
  weaponType: 'sword',
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

  it('allows two different external skills to appear in the battle log', () => {
    const player: CharacterState = {
      ...testPlayer,
      learnedSkills: [
        ...testPlayer.learnedSkills,
        {
          skillId: asSkillId('skill_sword_011_baihong'),
          proficiency: 12,
          realmLevel: 1,
          insight: 0,
          unlockedMoveIds: ['move_baihong_01', 'move_baihong_02'],
        },
      ],
      formation: {
        external: [
          asSkillId('skill_sword_010_qingmang'),
          asSkillId('skill_sword_011_baihong'),
        ],
      },
      equippedSkillIds: [
        asSkillId('skill_sword_010_qingmang'),
        asSkillId('skill_sword_011_baihong'),
      ],
    }

    const result = startBattle({
      player,
      enemy: buildEnemyState('enemy_001_bandit_grunt')!,
      rng: createSeededRng(7),
    })

    const executedSkills = new Set(
      result.events
        .filter(
          (event): event is Extract<(typeof result.events)[number], { type: 'SkillExecuted' }> =>
            event.type === 'SkillExecuted' && event.actorId === player.id,
        )
        .map((event) => event.skillId),
    )
    expect(executedSkills).toContain(asSkillId('skill_sword_010_qingmang'))
    expect(executedSkills).toContain(asSkillId('skill_sword_011_baihong'))
  })

  it('reduces first action delay when qinggong is equipped', () => {
    const enemy = buildEnemyState('enemy_001_bandit_grunt')!
    const plainPlayer = buildBattleReadyCharacter(testPlayer)
    const swiftPlayer = buildBattleReadyCharacter({
      ...testPlayer,
      learnedSkills: [
        ...testPlayer.learnedSkills,
        {
          skillId: asSkillId('skill_qinggong_040_caoying'),
          proficiency: 20,
          realmLevel: 2,
          insight: 0,
          unlockedMoveIds: ['move_caoying_01', 'move_caoying_02'],
        },
      ],
      formation: {
        external: [asSkillId('skill_sword_010_qingmang')],
        qinggong: asSkillId('skill_qinggong_040_caoying'),
      },
      equippedSkillIds: [
        asSkillId('skill_sword_010_qingmang'),
        asSkillId('skill_qinggong_040_caoying'),
      ],
    })

    const plainResult = startBattle({ player: plainPlayer, enemy, rng: createSeededRng(11) })
    const swiftResult = startBattle({ player: swiftPlayer, enemy, rng: createSeededRng(11) })
    const plainFirstReady = plainResult.events.find(
      (event) => event.type === 'SkillReady' && event.actorId === plainPlayer.id,
    )
    const swiftFirstReady = swiftResult.events.find(
      (event) => event.type === 'SkillReady' && event.actorId === swiftPlayer.id,
    )

    expect(swiftPlayer.speed).toBeGreaterThan(plainPlayer.speed)
    expect(
      swiftFirstReady?.type === 'SkillReady' ? swiftFirstReady.triggerAt : Infinity,
    ).toBeLessThan(plainFirstReady?.type === 'SkillReady' ? plainFirstReady.triggerAt : Infinity)
  })

  it('lets hard skill improve the final combat snapshot', () => {
    const enemy = buildEnemyState('enemy_001_bandit_grunt')!
    const plainResult = startBattle({
      player: buildBattleReadyCharacter(testPlayer),
      enemy,
      rng: createSeededRng(13),
    })
    const sturdyResult = startBattle({
      player: buildBattleReadyCharacter({
        ...testPlayer,
        learnedSkills: [
          ...testPlayer.learnedSkills,
          {
            skillId: asSkillId('skill_hard_050_tiebu'),
            proficiency: 18,
            realmLevel: 2,
            insight: 0,
            unlockedMoveIds: ['move_tiebu_01', 'move_tiebu_02'],
          },
        ],
        formation: {
          external: [asSkillId('skill_sword_010_qingmang')],
          hard: asSkillId('skill_hard_050_tiebu'),
        },
        equippedSkillIds: [
          asSkillId('skill_sword_010_qingmang'),
          asSkillId('skill_hard_050_tiebu'),
        ],
      }),
      enemy,
      rng: createSeededRng(13),
    })

    expect(sturdyResult.finalPlayerHp).toBeGreaterThan(plainResult.finalPlayerHp)
  })

  it('allows internal skill moves to apply self buff before damage skills', () => {
    const player = buildBattleReadyCharacter({
      ...testPlayer,
      formation: {
        external: [asSkillId('skill_sword_010_qingmang')],
        internal: asSkillId('skill_internal_001_huntuan'),
      },
      equippedSkillIds: [
        asSkillId('skill_sword_010_qingmang'),
        asSkillId('skill_internal_001_huntuan'),
      ],
    })
    const result = startBattle({
      player,
      enemy: buildEnemyState('enemy_001_bandit_grunt')!,
      rng: createSeededRng(5),
    })

    const firstBuffIndex = result.events.findIndex(
      (event) =>
        event.type === 'BuffApplied' &&
        event.targetId === player.id &&
        event.buffId === 'buff_huntuan_inner_breath',
    )
    const firstPlayerDamageIndex = result.events.findIndex(
      (event) => event.type === 'DamageDealt' && event.sourceId === player.id,
    )
    const playerDamageAfterBuff = result.events.findIndex(
      (event, index) =>
        index > firstBuffIndex && event.type === 'DamageDealt' && event.sourceId === player.id,
    )

    expect(firstBuffIndex).toBeGreaterThanOrEqual(0)
    expect(firstPlayerDamageIndex).toBeGreaterThanOrEqual(0)
    expect(playerDamageAfterBuff).toBeGreaterThan(firstBuffIndex)
  })

  it('allows hard skill support move to apply guard buff', () => {
    const player = buildBattleReadyCharacter({
      ...testPlayer,
      learnedSkills: [
        ...testPlayer.learnedSkills,
        {
          skillId: asSkillId('skill_hard_050_tiebu'),
          proficiency: 8,
          realmLevel: 1,
          insight: 0,
          unlockedMoveIds: ['move_tiebu_01'],
        },
      ],
      formation: {
        external: [asSkillId('skill_sword_010_qingmang')],
        hard: asSkillId('skill_hard_050_tiebu'),
      },
      equippedSkillIds: [
        asSkillId('skill_sword_010_qingmang'),
        asSkillId('skill_hard_050_tiebu'),
      ],
    })
    const result = startBattle({
      player,
      enemy: buildEnemyState('enemy_001_bandit_grunt')!,
      rng: createSeededRng(9),
    })

    expect(
      result.events.some(
        (event) =>
          event.type === 'BuffApplied' &&
          event.targetId === player.id &&
          event.buffId === 'buff_tiebu_guard',
      ),
    ).toBe(true)
  })

  it('can change battle winner through pre-battle formation choices', () => {
    const enemy = buildEnemyState('enemy_002_bandit_boss')!
    const playerCore: CharacterState = {
      ...testPlayer,
      hp: 90,
      maxHp: 100,
      qi: 36,
      maxQi: 36,
      attributes: {
        armStrength: 12,
        agility: 10,
        constitution: 11,
      },
      learnedSkills: [
        {
          skillId: asSkillId('skill_sword_010_qingmang'),
          proficiency: 24,
          realmLevel: 3,
          insight: 0,
          unlockedMoveIds: ['move_qingmang_01', 'move_qingmang_02', 'move_qingmang_03'],
        },
        {
          skillId: asSkillId('skill_internal_001_huntuan'),
          proficiency: 24,
          realmLevel: 3,
          insight: 0,
          unlockedMoveIds: ['move_huntuan_01'],
        },
        {
          skillId: asSkillId('skill_sword_011_baihong'),
          proficiency: 24,
          realmLevel: 2,
          insight: 0,
          unlockedMoveIds: ['move_baihong_01', 'move_baihong_02'],
        },
        {
          skillId: asSkillId('skill_qinggong_040_caoying'),
          proficiency: 26,
          realmLevel: 3,
          insight: 0,
          unlockedMoveIds: ['move_caoying_01', 'move_caoying_02'],
        },
        {
          skillId: asSkillId('skill_hard_050_tiebu'),
          proficiency: 26,
          realmLevel: 3,
          insight: 0,
          unlockedMoveIds: ['move_tiebu_01', 'move_tiebu_02'],
        },
      ],
    }

    const plainResult = startBattle({
      player: buildBattleReadyCharacter({
        ...playerCore,
        formation: {
          external: [asSkillId('skill_sword_010_qingmang')],
          internal: asSkillId('skill_internal_001_huntuan'),
        },
        equippedSkillIds: [
          asSkillId('skill_sword_010_qingmang'),
          asSkillId('skill_internal_001_huntuan'),
        ],
      }),
      enemy,
      rng: createSeededRng(21),
    })
    const formedResult = startBattle({
      player: buildBattleReadyCharacter({
        ...playerCore,
        formation: {
          external: [
            asSkillId('skill_sword_010_qingmang'),
            asSkillId('skill_sword_011_baihong'),
          ],
          internal: asSkillId('skill_internal_001_huntuan'),
          qinggong: asSkillId('skill_qinggong_040_caoying'),
          hard: asSkillId('skill_hard_050_tiebu'),
        },
        equippedSkillIds: [
          asSkillId('skill_sword_010_qingmang'),
          asSkillId('skill_sword_011_baihong'),
          asSkillId('skill_internal_001_huntuan'),
          asSkillId('skill_qinggong_040_caoying'),
          asSkillId('skill_hard_050_tiebu'),
        ],
      }),
      enemy,
      rng: createSeededRng(21),
    })

    expect(plainResult.winnerId).toBe(enemy.id)
    expect(formedResult.winnerId).toBe(playerCore.id)
  })
})
