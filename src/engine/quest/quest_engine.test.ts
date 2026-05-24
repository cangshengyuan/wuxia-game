import { describe, expect, it } from 'vitest'
import { advanceQuest } from './quest_engine'
import { getQuestById } from '../world/questEngine'
import { asEnemyId, asNpcId, asQuestId, asSceneId } from '../../types/id'
import type { ActiveQuest } from '../../types/world'

const questDef = getQuestById(asQuestId('quest_main_001_first_blood'))!

function createActive(stepIndex = 0): ActiveQuest {
  return {
    questId: questDef.id,
    currentStepIndex: stepIndex,
    status: 'active',
  }
}

describe('advanceQuest', () => {
  it('advances through all four steps', () => {
    let active = createActive(0)

    const afterTalk = advanceQuest(active, questDef, {
      type: 'DialogClosed',
      npcId: asNpcId('npc_001_village_swordsman'),
    })
    expect(afterTalk).toEqual({ ...active, currentStepIndex: 1, status: 'active' })
    active = afterTalk as ActiveQuest

    const afterReach = advanceQuest(active, questDef, {
      type: 'SceneEntered',
      sceneId: asSceneId('scene_002_outskirts'),
    })
    expect(afterReach).toEqual({ ...active, currentStepIndex: 2, status: 'active' })
    active = afterReach as ActiveQuest

    const afterDefeat = advanceQuest(active, questDef, {
      type: 'BattleEnded',
      winnerId: 'player_001',
      enemyId: asEnemyId('enemy_001_bandit_grunt'),
    })
    expect(afterDefeat).toEqual({ ...active, currentStepIndex: 3, status: 'active' })
    active = afterDefeat as ActiveQuest

    const afterReturn = advanceQuest(active, questDef, {
      type: 'DialogClosed',
      npcId: asNpcId('npc_001_village_swordsman'),
    })
    expect(afterReturn).toBe('completed')
  })

  it('does not advance on wrong enemy defeat', () => {
    const active = createActive(2)
    const result = advanceQuest(active, questDef, {
      type: 'BattleEnded',
      winnerId: 'player_001',
      enemyId: asEnemyId('enemy_003_wild_wolf'),
    })
    expect(result).toBeNull()
  })

  it('does not advance on unrelated dialog', () => {
    const active = createActive(0)
    const result = advanceQuest(active, questDef, {
      type: 'DialogClosed',
      npcId: asNpcId('npc_999_unknown'),
    })
    expect(result).toBeNull()
  })

  it('does not advance on player defeat', () => {
    const active = createActive(2)
    const result = advanceQuest(active, questDef, {
      type: 'BattleEnded',
      winnerId: 'enemy_001_bandit_grunt',
      enemyId: asEnemyId('enemy_001_bandit_grunt'),
    })
    expect(result).toBeNull()
  })
})
