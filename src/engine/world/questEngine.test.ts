import { describe, expect, it } from 'vitest'
import { getQuestById, listQuests } from './questEngine'
import { asQuestId } from '../../types/id'

describe('questEngine', () => {
  it('loads first blood quest with four objectives', () => {
    const quest = getQuestById(asQuestId('quest_main_001_first_blood'))
    expect(quest).toBeDefined()
    expect(quest?.name).toBe('初战告捷')
    expect(quest?.objectives).toHaveLength(4)
    expect(quest?.giverNpcId).toBe('npc_001_village_swordsman')
    expect(quest?.rewards?.skillIds).toEqual(['skill_sword_011_baihong'])
  })

  it('lists all quests', () => {
    expect(listQuests().length).toBeGreaterThanOrEqual(1)
  })
})
