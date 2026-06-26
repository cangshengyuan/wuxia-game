import { describe, expect, it } from 'vitest'
import { advanceMeditation, MEDITATION_INTERVAL_MS, setMeditationActive } from './meditation'
import { asSkillId } from '../../types/id'
import type { CharacterState } from '../../types/character'

const player: CharacterState = {
  id: 'player_001',
  name: '无名侠客',
  level: 1,
  hp: 100,
  maxHp: 120,
  qi: 40,
  maxQi: 60,
  attributes: {
    armStrength: 12,
    agility: 12,
    constitution: 12,
  },
  learnedSkills: [
    {
      skillId: asSkillId('skill_internal_001_huntuan'),
      proficiency: 20,
      realmLevel: 1,
      insight: 0,
      unlockedMoveIds: ['move_huntuan_01'],
    },
  ],
  speed: 12,
  formation: {
    external: [],
    internal: asSkillId('skill_internal_001_huntuan'),
  },
  weaponType: 'unarmed',
  equippedSkillIds: [],
}

describe('meditation', () => {
  it('does not recover before one full settlement interval', () => {
    const activePlayer = setMeditationActive(player, true)
    const result = advanceMeditation(activePlayer, MEDITATION_INTERVAL_MS - 1)

    expect(result.recoveredHp).toBe(0)
    expect(result.recoveredQi).toBe(0)
    expect(result.settledCycles).toBe(0)
    expect(result.character.hp).toBe(100)
    expect(result.character.qi).toBe(40)
  })

  it('recovers hp and qi after ten seconds based on proficiency', () => {
    const activePlayer = setMeditationActive(player, true)
    const result = advanceMeditation(activePlayer, MEDITATION_INTERVAL_MS)

    expect(result.recoveredHp).toBe(4)
    expect(result.recoveredQi).toBe(4)
    expect(result.settledCycles).toBe(1)
    expect(result.character.hp).toBe(104)
    expect(result.character.qi).toBe(44)
  })

  it('caps recovery at max hp and max qi across multiple cycles', () => {
    const activePlayer = setMeditationActive(
      {
        ...player,
        hp: 118,
        qi: 58,
      },
      true,
    )
    const result = advanceMeditation(activePlayer, MEDITATION_INTERVAL_MS * 2)

    expect(result.character.hp).toBe(120)
    expect(result.character.qi).toBe(69)
    expect(result.settledCycles).toBe(2)
    expect(result.character.meditation?.accumulatedMs).toBe(0)
  })
})
