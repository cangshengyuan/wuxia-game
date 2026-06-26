/**
 * @module store/gameStore.test
 * @layer store
 * @description gameStore 测试：验证成长、场景、任务、存档与展示 selector
 * @inputs gameStore, battleStore, uiStore
 * @outputs 测试断言
 * @depends test, store, engine/persistence
 * @forbidden 禁止在测试中绕过 store 直接修改 UI 内部状态
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSeededRng } from '../engine/util/rng'
import { loadFromStorage, saveToStorage } from '../engine/persistence/save_io'
import { SAVE_VERSION } from '../engine/persistence/save_schema'
import { defaultPlayer, defaultSceneId, useGameStore } from './gameStore'
import { useBattleStore } from './battleStore'
import { useUiStore } from './uiStore'
import { asEnemyId, asMoveId, asNpcId, asQuestId, asSceneId, asSkillId } from '../types/id'
import type { BattleResult } from '../types/battle'

function resetGameStore(): void {
  localStorage.clear()
  useGameStore.setState({
    player: structuredClone(defaultPlayer),
    recentUnlocks: [],
    currentSceneId: defaultSceneId,
    completedQuests: [],
    activeQuests: [],
    rng: createSeededRng(42),
  })
}

function resetUiStore(): void {
  useUiStore.setState({ currentPage: 'scene' })
}

describe('gameStore', () => {
  beforeEach(() => {
    resetGameStore()
    resetUiStore()
  })

  it('applyBattleResult updates hp, qi, and proficiency on victory', () => {
    const result: BattleResult = {
      winnerId: 'player_001',
      events: [],
      finalPlayerHp: 95,
      finalPlayerQi: 30,
      finalEnemyHp: 0,
      finalEnemyQi: 0,
      proficiencyGains: [{ skillId: asSkillId('skill_sword_010_qingmang'), amount: 3 }],
    }

    useGameStore.getState().applyBattleResult(result)

    const { player } = useGameStore.getState()
    expect(player.hp).toBe(95)
    expect(player.qi).toBe(30)
    expect(player.learnedSkills[0]?.proficiency).toBe(3)
  })

  it('applyBattleResult grants dropped skills through learnSkill flow', () => {
    const result: BattleResult = {
      winnerId: 'player_001',
      events: [],
      finalPlayerHp: 100,
      finalPlayerQi: 40,
      finalEnemyHp: 0,
      finalEnemyQi: 0,
      proficiencyGains: [],
      skillRewards: [asSkillId('skill_qinggong_040_caoying')],
    }

    useGameStore.getState().applyBattleResult(result)

    expect(
      useGameStore.getState().player.learnedSkills.some(
        (skill) => skill.skillId === asSkillId('skill_qinggong_040_caoying'),
      ),
    ).toBe(true)
  })

  it('unlocks new move when proficiency reaches threshold', () => {
    useGameStore.setState({
      player: {
        ...defaultPlayer,
        learnedSkills: [
          {
            skillId: asSkillId('skill_sword_010_qingmang'),
            proficiency: 9,
            realmLevel: 1,
            insight: 0,
            unlockedMoveIds: ['move_qingmang_01'],
          },
          ...defaultPlayer.learnedSkills.slice(1),
        ],
      },
    })

    const result: BattleResult = {
      winnerId: 'player_001',
      events: [],
      finalPlayerHp: 100,
      finalPlayerQi: 40,
      finalEnemyHp: 0,
      finalEnemyQi: 0,
      proficiencyGains: [{ skillId: asSkillId('skill_sword_010_qingmang'), amount: 1 }],
    }

    useGameStore.getState().applyBattleResult(result)

    const { player, recentUnlocks } = useGameStore.getState()
    expect(player.learnedSkills[0]?.proficiency).toBe(10)
    expect(player.learnedSkills[0]?.unlockedMoveIds).toContain('move_qingmang_02')
    expect(recentUnlocks).toHaveLength(1)
    expect(recentUnlocks[0]?.moveId).toBe('move_qingmang_02')
  })

  it('grants base proficiency without victory bonus on defeat', () => {
    const result: BattleResult = {
      winnerId: 'enemy_001_bandit_grunt',
      events: [],
      finalPlayerHp: 0,
      finalPlayerQi: 10,
      finalEnemyHp: 50,
      finalEnemyQi: 20,
      proficiencyGains: [{ skillId: asSkillId('skill_sword_010_qingmang'), amount: 2 }],
    }

    useGameStore.getState().applyBattleResult(result)

    expect(useGameStore.getState().player.learnedSkills[0]?.proficiency).toBe(2)
    expect(useGameStore.getState().recentUnlocks).toHaveLength(0)
  })

  it('canUpgradeSkill and upgradeSkill work as placeholders', () => {
    expect(useGameStore.getState().canUpgradeSkill('skill_sword_010_qingmang')).toBe(true)
    useGameStore.getState().upgradeSkill('skill_sword_010_qingmang')
    expect(useGameStore.getState().player.learnedSkills[0]?.proficiency).toBe(1)
  })

  it('getSkillDisplay returns merged view for SkillPanel', () => {
    const display = useGameStore.getState().getSkillDisplay('skill_sword_010_qingmang')
    expect(display).toMatchObject({
      skillId: asSkillId('skill_sword_010_qingmang'),
      skillName: '青蟒剑法',
      proficiency: 0,
      maxProficiency: 30,
      realmLevel: 1,
      realmMaxLevel: 3,
      insight: 0,
      unlockedMoveNames: ['青蟒出洞'],
    })
    expect(display?.attributeBonusSummaries).toEqual([])
    expect(display?.nextBreakthroughSummary).toContain('突破条件')
  })

  it('getDisplayPlayer returns derived max qi from internal skill bonuses', () => {
    useGameStore.setState({
      player: {
        ...defaultPlayer,
        learnedSkills: defaultPlayer.learnedSkills.map((skill) =>
          skill.skillId === asSkillId('skill_internal_001_huntuan')
            ? { ...skill, proficiency: 20 }
            : skill,
        ),
      },
    })

    const displayPlayer = useGameStore.getState().getDisplayPlayer()
    expect(displayPlayer.maxQi).toBe(69)
    expect(displayPlayer.qi).toBe(60)
  })

  it('equipSkill and unequipSkill update formation slots through store actions', () => {
    useGameStore.setState({
      player: {
        ...defaultPlayer,
        learnedSkills: [
          ...defaultPlayer.learnedSkills,
          {
            skillId: asSkillId('skill_sword_011_baihong'),
            proficiency: 12,
            realmLevel: 1,
            insight: 0,
            unlockedMoveIds: ['move_baihong_01', 'move_baihong_02'],
          },
        ],
      },
    })

    useGameStore.getState().equipSkill('skill_sword_011_baihong')

    expect(useGameStore.getState().player.formation?.external).toEqual([
      asSkillId('skill_sword_011_baihong'),
      asSkillId('skill_sword_010_qingmang'),
    ])

    useGameStore.getState().unequipSkill('skill_sword_011_baihong')
    expect(useGameStore.getState().player.formation?.external).toEqual([
      asSkillId('skill_sword_010_qingmang'),
    ])
  })

  it('dismissUnlockNotice removes notice by id', () => {
    useGameStore.setState({
      recentUnlocks: [
        {
          id: 'unlock_test',
          skillId: asSkillId('skill_sword_010_qingmang'),
          moveId: asMoveId('move_qingmang_02'),
          skillName: '青蟒剑法',
          moveName: '蟒尾横扫',
        },
      ],
    })

    useGameStore.getState().dismissUnlockNotice('unlock_test')
    expect(useGameStore.getState().recentUnlocks).toHaveLength(0)
  })

  it('getCurrentScene returns village with explore disabled', () => {
    const scene = useGameStore.getState().getCurrentScene()
    expect(scene).toEqual({
      sceneId: asSceneId('scene_001_village'),
      name: '主城新手村',
      description: '宁静的村落，江湖传闻的起点。',
      canExplore: false,
    })
  })

  it('getSceneNpcs lists village npcs', () => {
    const npcs = useGameStore.getState().getSceneNpcs()
    expect(npcs).toHaveLength(3)
    expect(npcs[0]?.name).toBe('村口剑客')
  })

  it('getSceneDestinations lists outskirts from village', () => {
    const destinations = useGameStore.getState().getSceneDestinations()
    expect(destinations).toEqual([
      { sceneId: asSceneId('scene_002_outskirts'), name: '村外野径' },
    ])
  })

  it('getActiveQuestDisplays returns current objective text', () => {
    useGameStore.getState().acceptQuest('quest_main_001_first_blood')

    expect(useGameStore.getState().getActiveQuestDisplays()).toEqual([
      {
        questId: asQuestId('quest_main_001_first_blood'),
        questName: '初战告捷',
        stepDescription: '与村口剑客交谈',
      },
    ])
  })

  it('enterScene switches currentSceneId', () => {
    useGameStore.getState().enterScene('scene_002_outskirts')
    expect(useGameStore.getState().currentSceneId).toBe(asSceneId('scene_002_outskirts'))
  })

  it('enterScene rejects undeclared destinations', () => {
    useGameStore.getState().enterScene('scene_999_unknown')
    expect(useGameStore.getState().currentSceneId).toBe(defaultSceneId)
  })

  it('getNpcDialogDisplay reflects quest dialog state for the village swordsman', () => {
    expect(
      useGameStore.getState().getNpcDialogDisplay('npc_001_village_swordsman'),
    ).toMatchObject({
      npcName: '村口剑客',
      primaryActionLabel: '接受任务',
    })

    useGameStore.getState().performNpcDialogAction('npc_001_village_swordsman')

    expect(
      useGameStore.getState().getNpcDialogDisplay('npc_001_village_swordsman'),
    ).toMatchObject({
      primaryActionLabel: '继续',
      message: '「村外野径常有山贼出没，你去击败一名山贼喽啰，再来找我。」',
    })
  })

  it('npc teaching flow grants trainer skill and inherited sheying after qingmang is maxed', () => {
    expect(
      useGameStore.getState().getNpcDialogDisplay('npc_002_village_trainer'),
    ).toMatchObject({
      primaryActionLabel: '请教掌法',
    })

    useGameStore.getState().performNpcDialogAction('npc_002_village_trainer')
    expect(
      useGameStore.getState().player.learnedSkills.some(
        (skill) => skill.skillId === asSkillId('skill_external_060_kaishan'),
      ),
    ).toBe(true)

    useGameStore.setState({
      player: {
        ...useGameStore.getState().player,
        learnedSkills: useGameStore.getState().player.learnedSkills.map((skill) =>
          skill.skillId === asSkillId('skill_sword_010_qingmang')
            ? { ...skill, proficiency: 30, unlockedMoveIds: ['move_qingmang_01', 'move_qingmang_02', 'move_qingmang_03'] }
            : skill,
        ),
      },
    })

    expect(
      useGameStore.getState().getNpcDialogDisplay('npc_003_village_hermit'),
    ).toMatchObject({
      primaryActionLabel: '请教剑谱',
    })

    useGameStore.getState().performNpcDialogAction('npc_003_village_hermit')

    const sheying = useGameStore
      .getState()
      .player.learnedSkills.find((skill) => skill.skillId === asSkillId('skill_sword_020_sheying'))
    expect(sheying?.proficiency).toBeGreaterThan(0)
  })

  it('explore in village does not trigger battle', () => {
    const prepareBattle = vi.spyOn(useBattleStore.getState(), 'prepareBattle')
    const setPage = vi.spyOn(useUiStore.getState(), 'setPage')

    useGameStore.getState().explore()

    expect(prepareBattle).not.toHaveBeenCalled()
    expect(setPage).not.toHaveBeenCalled()
    prepareBattle.mockRestore()
    setPage.mockRestore()
  })

  it('explore in outskirts triggers battle and switches to battle page', () => {
    useGameStore.getState().enterScene('scene_002_outskirts')
    const prepareBattle = vi.spyOn(useBattleStore.getState(), 'prepareBattle')
    const setPage = vi.spyOn(useUiStore.getState(), 'setPage')

    useGameStore.getState().explore()

    expect(prepareBattle).toHaveBeenCalledWith('enemy_001_bandit_grunt')
    expect(setPage).toHaveBeenCalledWith('battle')
    prepareBattle.mockRestore()
    setPage.mockRestore()
  })

  it('rehydrates persisted progress from storage', async () => {
    saveToStorage({
      version: SAVE_VERSION,
      currentSceneId: asSceneId('scene_002_outskirts'),
      completedQuests: [],
      activeQuests: [
        {
          questId: asQuestId('quest_main_001_first_blood'),
          currentStepIndex: 1,
          status: 'active',
        },
      ],
      player: {
        ...defaultPlayer,
        learnedSkills: [
          {
            skillId: asSkillId('skill_sword_010_qingmang'),
            proficiency: 7,
            realmLevel: 1,
            insight: 0,
            unlockedMoveIds: ['move_qingmang_01'],
          },
          ...defaultPlayer.learnedSkills.slice(1),
        ],
      },
    })

    await useGameStore.persist.rehydrate()

    expect(useGameStore.getState().currentSceneId).toBe(asSceneId('scene_002_outskirts'))
    expect(useGameStore.getState().player.learnedSkills[0]?.proficiency).toBe(7)
    expect(useGameStore.getState().activeQuests).toHaveLength(1)
  })

  it('saveGame writes the current progress to storage', () => {
    useGameStore.getState().enterScene('scene_002_outskirts')
    useGameStore.getState().upgradeSkill('skill_sword_010_qingmang')
    useGameStore.getState().acceptQuest('quest_main_001_first_blood')
    useGameStore.getState().saveGame()

    expect(loadFromStorage()).toEqual({
      version: SAVE_VERSION,
      player: useGameStore.getState().player,
      currentSceneId: asSceneId('scene_002_outskirts'),
      completedQuests: [],
      activeQuests: [
        {
          questId: asQuestId('quest_main_001_first_blood'),
          currentStepIndex: 0,
          status: 'active',
        },
      ],
    })
  })

  it('loadGame restores progress from storage into the current store state', () => {
    saveToStorage({
      version: SAVE_VERSION,
      currentSceneId: asSceneId('scene_002_outskirts'),
      completedQuests: [],
      activeQuests: [
        {
          questId: asQuestId('quest_main_001_first_blood'),
          currentStepIndex: 0,
          status: 'active',
        },
      ],
      player: {
        ...defaultPlayer,
        learnedSkills: [
          {
            skillId: asSkillId('skill_sword_010_qingmang'),
            proficiency: 1,
            realmLevel: 1,
            insight: 0,
            unlockedMoveIds: ['move_qingmang_01'],
          },
          ...defaultPlayer.learnedSkills.slice(1),
        ],
      },
    })

    useGameStore.getState().loadGame()

    expect(useGameStore.getState().currentSceneId).toBe(asSceneId('scene_002_outskirts'))
    expect(useGameStore.getState().player.learnedSkills[0]?.proficiency).toBe(1)
    expect(useGameStore.getState().activeQuests).toEqual([
      {
        questId: asQuestId('quest_main_001_first_blood'),
        currentStepIndex: 0,
        status: 'active',
      },
    ])
  })

  it('clearSave resets to default player and learned skills', () => {
    useGameStore.getState().enterScene('scene_002_outskirts')
    useGameStore.getState().upgradeSkill('skill_sword_010_qingmang')
    useGameStore.getState().acceptQuest('quest_main_001_first_blood')

    useGameStore.getState().clearSave()

    expect(useGameStore.getState().currentSceneId).toBe(defaultSceneId)
    expect(useGameStore.getState().player.learnedSkills).toHaveLength(2)
    expect(useGameStore.getState().player.learnedSkills[0]?.proficiency).toBe(0)
    expect(useGameStore.getState().player.learnedSkills[1]?.skillId).toBe(
      asSkillId('skill_internal_001_huntuan'),
    )
    expect(useGameStore.getState().activeQuests).toEqual([])
  })

  it('progresses first blood quest through full chain', () => {
    useGameStore.getState().acceptQuest('quest_main_001_first_blood')

    useGameStore.getState().handleGameEvent({
      type: 'DialogClosed',
      npcId: asNpcId('npc_001_village_swordsman'),
    })
    expect(useGameStore.getState().activeQuests[0]?.currentStepIndex).toBe(1)

    useGameStore.getState().enterScene('scene_002_outskirts')
    expect(useGameStore.getState().activeQuests[0]?.currentStepIndex).toBe(2)

    useGameStore.getState().handleGameEvent({
      type: 'BattleEnded',
      winnerId: 'player_001',
      enemyId: asEnemyId('enemy_001_bandit_grunt'),
    })
    expect(useGameStore.getState().activeQuests[0]?.currentStepIndex).toBe(3)

    useGameStore.getState().handleGameEvent({
      type: 'DialogClosed',
      npcId: asNpcId('npc_001_village_swordsman'),
    })

    expect(useGameStore.getState().completedQuests).toContain(asQuestId('quest_main_001_first_blood'))
    expect(useGameStore.getState().activeQuests).toHaveLength(0)
    expect(
      useGameStore.getState().player.learnedSkills.some(
        (skill) => skill.skillId === asSkillId('skill_sword_011_baihong'),
      ),
    ).toBe(true)
  })

  it('learnSkill does not duplicate existing skill', () => {
    useGameStore.getState().learnSkill('skill_sword_010_qingmang')
    expect(useGameStore.getState().player.learnedSkills).toHaveLength(2)
  })

  it('advanceMeditation restores hp and qi every ten seconds', () => {
    useGameStore.setState({
      player: {
        ...defaultPlayer,
        hp: 110,
        qi: 50,
        learnedSkills: defaultPlayer.learnedSkills.map((skill) =>
          skill.skillId === asSkillId('skill_internal_001_huntuan')
            ? { ...skill, proficiency: 20 }
            : skill,
        ),
      },
    })

    useGameStore.getState().setMeditationActive(true)
    useGameStore.getState().advanceMeditation(10_000)

    const { player } = useGameStore.getState()
    expect(player.hp).toBe(114)
    expect(player.qi).toBe(54)
    expect(player.meditation).toEqual({
      isActive: true,
      accumulatedMs: 0,
    })
  })

  it('enterScene stops active meditation', () => {
    useGameStore.getState().setMeditationActive(true)
    useGameStore.getState().advanceMeditation(3_000)

    useGameStore.getState().enterScene('scene_002_outskirts')

    expect(useGameStore.getState().player.meditation).toEqual({
      isActive: false,
      accumulatedMs: 0,
    })
  })
})
