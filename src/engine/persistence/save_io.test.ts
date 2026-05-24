import { beforeEach, describe, expect, it } from 'vitest'
import { asQuestId, asSceneId, asSkillId } from '../../types/id'
import { clearStorage, loadFromStorage, saveToStorage, STORAGE_KEY } from './save_io'
import { createDefaultSave, SAVE_VERSION, type SaveV1 } from './save_schema'

function buildSampleSave(): SaveV1 {
  const base = createDefaultSave()
  return {
    version: SAVE_VERSION,
    currentSceneId: asSceneId('scene_002_outskirts'),
    completedQuests: [asQuestId('quest_main_001_first_blood')],
    player: {
      ...base.player,
      hp: 88,
      qi: 22,
      learnedSkills: [
        {
          skillId: asSkillId('skill_sword_010_qingmang'),
          proficiency: 12,
          unlockedMoveIds: ['move_qingmang_01', 'move_qingmang_02'],
        },
        ...base.player.learnedSkills.slice(1),
      ],
    },
  }
}

describe('save_io', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('roundtrips save data with field equality', () => {
    const sample = buildSampleSave()
    saveToStorage(sample)

    expect(loadFromStorage()).toEqual(sample)
  })

  it('returns null when version is missing', () => {
    const sample = buildSampleSave()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        player: sample.player,
        currentSceneId: sample.currentSceneId,
        completedQuests: sample.completedQuests,
      }),
    )

    expect(loadFromStorage()).toBeNull()
  })

  it('returns null after clearStorage', () => {
    saveToStorage(buildSampleSave())
    clearStorage()
    expect(loadFromStorage()).toBeNull()
  })

  it('returns null for corrupted JSON without throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    expect(loadFromStorage()).toBeNull()
  })
})
