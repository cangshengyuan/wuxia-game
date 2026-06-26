/**
 * @module character/meditation
 * @layer engine
 * @description 打坐恢复：按 10 秒结算生命与内力，受内功恢复配置与熟练度影响
 * @inputs CharacterState, SkillRuntime, SkillDefinition
 * @outputs MeditationProgressResult
 * @depends types, engine/skillEngine
 * @forbidden 禁止 import React、禁止访问 store、禁止 mutate 入参
 */
import { getSkillById } from '../skillEngine'
import { calculateDerivedCharacterStats } from './attributes'
import type { CharacterState, MeditationState, SkillRuntime } from '../../types/character'
import type { MeditationRecoveryProfile, SkillDefinition } from '../../types/skill'

export const MEDITATION_INTERVAL_MS = 10_000

const DEFAULT_MEDITATION_PROFILE: MeditationRecoveryProfile = {
  baseRecovery: 6,
  proficiencyScale: 0.12,
  hpWeight: 1,
  qiWeight: 1,
}

export interface MeditationProgressResult {
  character: CharacterState
  recoveredHp: number
  recoveredQi: number
  settledCycles: number
}

export function createIdleMeditationState(): MeditationState {
  return {
    isActive: false,
    accumulatedMs: 0,
  }
}

export function getMeditationState(character: CharacterState): MeditationState {
  return character.meditation ?? createIdleMeditationState()
}

function getActiveInternalRuntime(character: CharacterState): SkillRuntime | undefined {
  const equippedInternalId = character.formation?.internal
  if (equippedInternalId) {
    return character.learnedSkills.find((runtime) => runtime.skillId === equippedInternalId)
  }
  return character.learnedSkills.find((runtime) => getSkillById(runtime.skillId)?.category === 'internal')
}

function getMeditationProfile(skillDef: SkillDefinition | undefined): MeditationRecoveryProfile {
  if (!skillDef?.meditationRecovery) {
    return DEFAULT_MEDITATION_PROFILE
  }
  return skillDef.meditationRecovery
}

function allocateRecovery(
  totalRecovery: number,
  hpMissing: number,
  qiMissing: number,
  hpWeight: number,
  qiWeight: number,
): { hp: number; qi: number } {
  if (totalRecovery <= 0 || (hpMissing === 0 && qiMissing === 0)) {
    return { hp: 0, qi: 0 }
  }

  const totalWeight = hpWeight + qiWeight
  if (totalWeight <= 0) {
    return { hp: 0, qi: 0 }
  }

  let hp = Math.min(hpMissing, Math.round((totalRecovery * hpWeight) / totalWeight))
  let qi = Math.min(qiMissing, totalRecovery - hp)
  let remaining = totalRecovery - hp - qi

  if (remaining > 0 && qiMissing > qi) {
    const extraQi = Math.min(remaining, qiMissing - qi)
    qi += extraQi
    remaining -= extraQi
  }

  if (remaining > 0 && hpMissing > hp) {
    hp += Math.min(remaining, hpMissing - hp)
  }

  return { hp, qi }
}

function settleMeditationCycle(character: CharacterState): MeditationProgressResult {
  const runtime = getActiveInternalRuntime(character)
  const skillDef = runtime ? getSkillById(runtime.skillId) : undefined
  const profile = getMeditationProfile(skillDef)
  const derivedStats = calculateDerivedCharacterStats(character)
  const proficiency = runtime?.proficiency ?? 0
  const totalRecovery = Math.max(
    1,
    Math.round(profile.baseRecovery + proficiency * profile.proficiencyScale),
  )

  const { hp: recoveredHp, qi: recoveredQi } = allocateRecovery(
    totalRecovery,
    Math.max(0, derivedStats.maxHp - character.hp),
    Math.max(0, derivedStats.maxQi - character.qi),
    profile.hpWeight,
    profile.qiWeight,
  )

  return {
    character: {
      ...character,
      hp: Math.min(derivedStats.maxHp, character.hp + recoveredHp),
      qi: Math.min(derivedStats.maxQi, character.qi + recoveredQi),
    },
    recoveredHp,
    recoveredQi,
    settledCycles: 1,
  }
}

export function setMeditationActive(
  character: CharacterState,
  isActive: boolean,
): CharacterState {
  return {
    ...character,
    meditation: {
      isActive,
      accumulatedMs: 0,
    },
  }
}

export function advanceMeditation(
  character: CharacterState,
  elapsedMs: number,
): MeditationProgressResult {
  const meditation = getMeditationState(character)
  if (!meditation.isActive || elapsedMs <= 0) {
    return {
      character: {
        ...character,
        meditation,
      },
      recoveredHp: 0,
      recoveredQi: 0,
      settledCycles: 0,
    }
  }

  let nextCharacter: CharacterState = {
    ...character,
    meditation: {
      ...meditation,
      accumulatedMs: meditation.accumulatedMs + elapsedMs,
    },
  }

  let recoveredHp = 0
  let recoveredQi = 0
  let settledCycles = 0

  while ((nextCharacter.meditation?.accumulatedMs ?? 0) >= MEDITATION_INTERVAL_MS) {
    nextCharacter = {
      ...nextCharacter,
      meditation: {
        ...(nextCharacter.meditation ?? meditation),
        accumulatedMs: (nextCharacter.meditation?.accumulatedMs ?? 0) - MEDITATION_INTERVAL_MS,
      },
    }

    const settled = settleMeditationCycle(nextCharacter)
    nextCharacter = settled.character
    recoveredHp += settled.recoveredHp
    recoveredQi += settled.recoveredQi
    settledCycles += settled.settledCycles
  }

  return {
    character: nextCharacter,
    recoveredHp,
    recoveredQi,
    settledCycles,
  }
}
