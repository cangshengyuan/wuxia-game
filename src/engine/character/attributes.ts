/**
 * @module character/attributes
 * @layer engine
 * @description 根据角色基础属性与功法成长配置计算聚合后的战斗属性
 * @inputs CharacterState, SkillDefinition[]
 * @outputs 技能属性加成与最终战斗属性
 * @depends types, engine/skillEngine
 * @forbidden 禁止 import React、禁止访问 store、禁止 mutate 入参
 */
import { getSkillById } from '../skillEngine'
import type { CharacterAttributes, CharacterState, SkillRuntime } from '../../types/character'
import type { SkillDefinition, SkillTier } from '../../types/skill'

type BonusKey = keyof CharacterAttributes | 'maxHp' | 'maxQi' | 'speed'

export interface SkillAttributeBonusBreakdown {
  armStrength: number
  agility: number
  constitution: number
  maxHp: number
  maxQi: number
  speed: number
}

export interface DerivedCharacterStats {
  attributes: CharacterAttributes
  maxHp: number
  maxQi: number
  speed: number
  totalBonuses: SkillAttributeBonusBreakdown
}

const BONUS_KEYS: BonusKey[] = ['armStrength', 'agility', 'constitution', 'maxHp', 'maxQi', 'speed']
const TIER_CAPS: Record<SkillTier, SkillAttributeBonusBreakdown> = {
  low: { armStrength: 6, agility: 6, constitution: 6, maxHp: 20, maxQi: 20, speed: 4 },
  mid: { armStrength: 12, agility: 12, constitution: 12, maxHp: 32, maxQi: 32, speed: 7 },
  high: { armStrength: 18, agility: 18, constitution: 18, maxHp: 48, maxQi: 48, speed: 10 },
}

function createEmptyBreakdown(): SkillAttributeBonusBreakdown {
  return {
    armStrength: 0,
    agility: 0,
    constitution: 0,
    maxHp: 0,
    maxQi: 0,
    speed: 0,
  }
}

function roundBonus(value: number): number {
  return Math.round(value * 100) / 100
}

function getBaseValue(runtime: SkillRuntime, perProficiency: number, perRealm: number): number {
  return runtime.proficiency * perProficiency + (runtime.realmLevel - 1) * perRealm
}

export function calculateSkillAttributeBonuses(
  runtime: SkillRuntime,
  skillDef: SkillDefinition,
): SkillAttributeBonusBreakdown {
  const bonuses = createEmptyBreakdown()

  for (const key of BONUS_KEYS) {
    const entry = skillDef.attributeGrowth[key]
    if (!entry) {
      continue
    }
    bonuses[key] = roundBonus(
      Math.min(getBaseValue(runtime, entry.perProficiency, entry.perRealm), entry.maxBonus),
    )
  }

  return bonuses
}

export function calculateDerivedCharacterStats(character: CharacterState): DerivedCharacterStats {
  const totalBonuses = createEmptyBreakdown()
  const tierBuckets: Record<SkillTier, SkillAttributeBonusBreakdown> = {
    low: createEmptyBreakdown(),
    mid: createEmptyBreakdown(),
    high: createEmptyBreakdown(),
  }

  for (const runtime of character.learnedSkills) {
    const skillDef = getSkillById(runtime.skillId)
    if (!skillDef) {
      continue
    }
    const bonuses = calculateSkillAttributeBonuses(runtime, skillDef)
    const tierBucket = tierBuckets[skillDef.tier]

    for (const key of BONUS_KEYS) {
      tierBucket[key] = Math.min(tierBucket[key] + bonuses[key], TIER_CAPS[skillDef.tier][key])
    }
  }

  for (const key of BONUS_KEYS) {
    totalBonuses[key] = roundBonus(
      tierBuckets.low[key] + tierBuckets.mid[key] + tierBuckets.high[key],
    )
  }

  return {
    attributes: {
      armStrength: Math.round(character.attributes.armStrength + totalBonuses.armStrength),
      agility: Math.round(character.attributes.agility + totalBonuses.agility),
      constitution: Math.round(character.attributes.constitution + totalBonuses.constitution),
    },
    maxHp: Math.round(character.maxHp + totalBonuses.maxHp),
    maxQi: Math.round(character.maxQi + totalBonuses.maxQi),
    speed: Math.round(character.speed + totalBonuses.speed),
    totalBonuses,
  }
}
