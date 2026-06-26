/**
 * @module engine/skillEngine
 * @layer engine
 * @description 技能数据读取、运行时校验与查询（仅从 data JSON 读取）
 * @inputs skillId, moveId, category
 * @outputs SkillDefinition | undefined
 * @depends types, data
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import externalSkills from '../data/skills/external/index.json'
import internalSkills from '../data/skills/internal/index.json'
import hardSkills from '../data/skills/hard/index.json'
import qinggongSkills from '../data/skills/qinggong/index.json'
import swordSkills from '../data/skills/sword/index.json'
import { asMoveId, asSkillId } from '../types/id'
import type { MoveId, SkillId } from '../types/id'
import type {
  ApplyBuffEffect,
  AttributeGrowthEntry,
  MeditationRecoveryProfile,
  MoveEffect,
  SkillAttributeGrowth,
  SkillBuffDefinition,
  SkillBuffModifiers,
  SkillCategory,
  SkillDefinition,
  SkillGrowthCurve,
  SkillMove,
  SkillRealmDefinition,
  WeaponRequirement,
} from '../types/skill'

const SKILL_CATEGORIES: SkillCategory[] = ['internal', 'external', 'hard', 'qinggong', 'sword']
const SKILL_TIERS: SkillDefinition['tier'][] = ['low', 'mid', 'high']
const WEAPON_REQUIREMENTS: WeaponRequirement[] = ['sword', 'unarmed']
const ATTRIBUTE_GROWTH_KEYS: (keyof SkillAttributeGrowth)[] = [
  'armStrength',
  'agility',
  'constitution',
  'maxHp',
  'maxQi',
  'speed',
]

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && value >= 0
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isAttributeGrowthEntry(value: unknown): value is AttributeGrowthEntry {
  if (!value || typeof value !== 'object') {
    return false
  }
  const entry = value as Record<string, unknown>
  return (
    isNonNegativeNumber(entry.perProficiency) &&
    isNonNegativeNumber(entry.perRealm) &&
    isNonNegativeNumber(entry.maxBonus)
  )
}

function isSkillAttributeGrowth(value: unknown): value is SkillAttributeGrowth {
  if (!value || typeof value !== 'object') {
    return false
  }
  const growth = value as Record<string, unknown>
  return ATTRIBUTE_GROWTH_KEYS.every((key) => {
    const entry = growth[key]
    return entry === undefined || isAttributeGrowthEntry(entry)
  })
}

function isSkillGrowthCurve(value: unknown): value is SkillGrowthCurve {
  if (!value || typeof value !== 'object') {
    return false
  }
  const curve = value as Record<string, unknown>
  return (
    isNonNegativeNumber(curve.proficiencyMultiplier) &&
    isNonNegativeNumber(curve.battleGainMultiplier) &&
    isNonNegativeNumber(curve.breakthroughCostMultiplier) &&
    isNonNegativeNumber(curve.insightChanceMultiplier) &&
    isNonNegativeNumber(curve.inheritanceCapRatio)
  )
}

function isSkillRealmDefinition(value: unknown): value is SkillRealmDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const realm = value as Record<string, unknown>
  if (
    !isNonNegativeNumber(realm.minLevel) ||
    !isNonNegativeNumber(realm.maxLevel) ||
    !Array.isArray(realm.breakthroughProficiency) ||
    !Array.isArray(realm.insightThresholds) ||
    !Array.isArray(realm.similarSkillRequired)
  ) {
    return false
  }

  const expectedSteps = realm.maxLevel - realm.minLevel
  return (
    expectedSteps >= 0 &&
    realm.breakthroughProficiency.length === expectedSteps &&
    realm.insightThresholds.length === expectedSteps &&
    realm.similarSkillRequired.length === expectedSteps &&
    realm.breakthroughProficiency.every(isNonNegativeNumber) &&
    realm.insightThresholds.every(isNonNegativeNumber) &&
    realm.similarSkillRequired.every(isNonNegativeNumber)
  )
}

function isMeditationRecoveryProfile(value: unknown): value is MeditationRecoveryProfile {
  if (!value || typeof value !== 'object') {
    return false
  }
  const profile = value as Record<string, unknown>
  return (
    isNonNegativeNumber(profile.baseRecovery) &&
    isNonNegativeNumber(profile.proficiencyScale) &&
    isNonNegativeNumber(profile.hpWeight) &&
    isNonNegativeNumber(profile.qiWeight)
  )
}

function isSkillBuffModifiers(value: unknown): value is SkillBuffModifiers {
  if (!value || typeof value !== 'object') {
    return false
  }
  const modifiers = value as Record<string, unknown>
  const numericKeys: (keyof Omit<SkillBuffModifiers, 'stunned'>)[] = [
    'outgoingDamageFlat',
    'outgoingDamagePercent',
    'incomingDamageFlat',
    'incomingDamagePercent',
    'hitChance',
    'dodgeChance',
    'speedFlat',
    'speedPercent',
    'qiCostFlat',
    'qiCostPercent',
  ]

  return (
    numericKeys.every((key) => modifiers[key] === undefined || isNumber(modifiers[key])) &&
    (modifiers.stunned === undefined || typeof modifiers.stunned === 'boolean')
  )
}

function isSkillBuffDefinition(value: unknown): value is SkillBuffDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const buff = value as Record<string, unknown>
  return (
    typeof buff.id === 'string' &&
    buff.id.length > 0 &&
    typeof buff.name === 'string' &&
    buff.name.length > 0 &&
    isNonNegativeNumber(buff.duration) &&
    isSkillBuffModifiers(buff.modifiers)
  )
}

function isApplyBuffEffect(value: unknown): value is ApplyBuffEffect {
  if (!value || typeof value !== 'object') {
    return false
  }
  const effect = value as Record<string, unknown>
  return (
    effect.kind === 'applyBuff' &&
    (effect.target === 'self' || effect.target === 'target') &&
    (effect.chance === undefined || (isNumber(effect.chance) && effect.chance >= 0 && effect.chance <= 1)) &&
    isSkillBuffDefinition(effect.buff)
  )
}

function isMoveEffect(value: unknown): value is MoveEffect {
  return isApplyBuffEffect(value)
}

function isSkillMove(value: unknown): value is SkillMove {
  if (!value || typeof value !== 'object') {
    return false
  }
  const move = value as Record<string, unknown>
  if (
    typeof move.id !== 'string' ||
    !move.id.startsWith('move_') ||
    typeof move.name !== 'string' ||
    !isNonNegativeNumber(move.cd) ||
    !isNonNegativeNumber(move.qiCost) ||
    !isNonNegativeNumber(move.powerRatio) ||
    !isNonNegativeNumber(move.unlockProficiency)
  ) {
    return false
  }
  if (move.element !== undefined && typeof move.element !== 'string') {
    return false
  }
  if (move.tag !== undefined && typeof move.tag !== 'string') {
    return false
  }
  if (
    move.effects !== undefined &&
    (!Array.isArray(move.effects) || !move.effects.every(isMoveEffect))
  ) {
    return false
  }
  return true
}

function isSkillDefinition(value: unknown): value is SkillDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const skill = value as Record<string, unknown>
  if (
    typeof skill.id !== 'string' ||
    !skill.id.startsWith('skill_') ||
    typeof skill.name !== 'string' ||
    !SKILL_CATEGORIES.includes(skill.category as SkillCategory) ||
    !SKILL_TIERS.includes(skill.tier as SkillDefinition['tier']) ||
    typeof skill.description !== 'string' ||
    !isNonNegativeNumber(skill.maxProficiency) ||
    !Array.isArray(skill.tags) ||
    !skill.tags.every((tag) => typeof tag === 'string') ||
    !isSkillRealmDefinition(skill.realm) ||
    !isSkillAttributeGrowth(skill.attributeGrowth) ||
    !isSkillGrowthCurve(skill.growthCurve) ||
    !Array.isArray(skill.moves)
  ) {
    return false
  }
  if (skill.meditationRecovery !== undefined && !isMeditationRecoveryProfile(skill.meditationRecovery)) {
    return false
  }
  if (
    skill.weaponRequirement !== undefined &&
    !WEAPON_REQUIREMENTS.includes(skill.weaponRequirement as WeaponRequirement)
  ) {
    return false
  }
  return skill.moves.every(isSkillMove)
}

function normalizeSkill(raw: Record<string, unknown>): SkillDefinition {
  const moves = (raw.moves as Record<string, unknown>[]).map((move) => ({
    ...move,
    id: asMoveId(move.id as string),
    ...(move.effects !== undefined
      ? {
          effects: (move.effects as MoveEffect[]).map((effect) => ({
            ...effect,
            buff: {
              ...effect.buff,
              modifiers: { ...effect.buff.modifiers },
            },
          })),
        }
      : {}),
  })) as SkillMove[]

  return {
    id: asSkillId(raw.id as string),
    name: raw.name as string,
    category: raw.category as SkillCategory,
    tier: raw.tier as SkillDefinition['tier'],
    description: raw.description as string,
    maxProficiency: raw.maxProficiency as number,
    tags: [...(raw.tags as string[])],
    realm: raw.realm as SkillRealmDefinition,
    attributeGrowth: raw.attributeGrowth as SkillAttributeGrowth,
    growthCurve: raw.growthCurve as SkillGrowthCurve,
    ...(raw.meditationRecovery !== undefined
      ? { meditationRecovery: raw.meditationRecovery as MeditationRecoveryProfile }
      : {}),
    ...(raw.weaponRequirement !== undefined
      ? { weaponRequirement: raw.weaponRequirement as WeaponRequirement }
      : {}),
    moves,
  }
}

const rawSkills: unknown[] = [
  ...externalSkills,
  ...internalSkills,
  ...hardSkills,
  ...qinggongSkills,
  ...swordSkills,
]
const skillCatalog: SkillDefinition[] = rawSkills
  .filter(isSkillDefinition)
  .map((skill) => normalizeSkill(skill as unknown as Record<string, unknown>))

export function getSkillById(skillId: SkillId | string): SkillDefinition | undefined {
  const id = typeof skillId === 'string' ? asSkillId(skillId) : skillId
  return skillCatalog.find((skill) => skill.id === id)
}

export function listAllSkills(): SkillDefinition[] {
  return skillCatalog
}

export function getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
  return skillCatalog.filter((skill) => skill.category === category)
}

export function getMoveById(
  moveId: MoveId | string,
): { skill: SkillDefinition; move: SkillMove } | undefined {
  const id = typeof moveId === 'string' ? asMoveId(moveId) : moveId
  for (const skill of skillCatalog) {
    const move = skill.moves.find((entry) => entry.id === id)
    if (move) {
      return { skill, move }
    }
  }
  return undefined
}
