/**
 * @module character/formation
 * @layer engine
 * @description 功法编成槽位规则、装备判定与扁平化工具
 * @inputs SkillFormation, SkillRuntime, SkillDefinition
 * @outputs 装备结果与槽位展示
 * @depends types, engine/skillEngine
 * @forbidden 禁止 import React、禁止访问 store、禁止 mutate 入参
 */
import { getSkillById } from '../skillEngine'
import type { SkillFormation, SkillRuntime } from '../../types/character'
import type { SkillCategory, SkillDefinition } from '../../types/skill'
import type { SkillId } from '../../types/id'

export type FormationSlot = 'external' | 'internal' | 'qinggong' | 'hard'

export interface FormationEligibility {
  canEquip: boolean
  slot: FormationSlot
  reason?: string
}

const HIGH_TIER_MIN_REALM = 2

export function createEmptyFormation(): SkillFormation {
  return { external: [] }
}

export function flattenFormation(formation?: SkillFormation): SkillId[] {
  if (!formation) {
    return []
  }
  return [
    ...formation.external,
    ...(formation.internal ? [formation.internal] : []),
    ...(formation.qinggong ? [formation.qinggong] : []),
    ...(formation.hard ? [formation.hard] : []),
  ]
}

export function getFormationSlot(category: SkillCategory): FormationSlot {
  if (category === 'sword' || category === 'external') {
    return 'external'
  }
  return category
}

export function canEquipSkill(
  runtime: SkillRuntime,
  skillDef: SkillDefinition,
  weaponType: SkillDefinition['weaponRequirement'] | undefined,
): FormationEligibility {
  const slot = getFormationSlot(skillDef.category)
  if (skillDef.weaponRequirement && weaponType && skillDef.weaponRequirement !== weaponType) {
    return { canEquip: false, slot, reason: `需要${skillDef.weaponRequirement}武器` }
  }
  if (skillDef.tier === 'high' && runtime.realmLevel < HIGH_TIER_MIN_REALM) {
    return { canEquip: false, slot, reason: '高阶功法需至少二重境界' }
  }
  return { canEquip: true, slot }
}

export function equipSkillInFormation(
  formation: SkillFormation | undefined,
  runtime: SkillRuntime,
  skillDef: SkillDefinition,
  weaponType: SkillDefinition['weaponRequirement'] | undefined,
): SkillFormation {
  const eligibility = canEquipSkill(runtime, skillDef, weaponType)
  if (!eligibility.canEquip) {
    return formation ?? createEmptyFormation()
  }

  const next = { ...(formation ?? createEmptyFormation()), external: [...(formation?.external ?? [])] }

  if (eligibility.slot === 'external') {
    next.external = next.external.filter((id) => id !== runtime.skillId)
    next.external.unshift(runtime.skillId)
    next.external = next.external.slice(0, 2)
    return next
  }

  next[eligibility.slot] = runtime.skillId
  return next
}

export function unequipSkillFromFormation(
  formation: SkillFormation | undefined,
  skillId: SkillId | string,
): SkillFormation {
  const id = typeof skillId === 'string' ? (skillId as SkillId) : skillId
  const next = { ...(formation ?? createEmptyFormation()), external: [...(formation?.external ?? [])] }
  next.external = next.external.filter((entry) => entry !== id)

  if (next.internal === id) {
    delete next.internal
  }
  if (next.qinggong === id) {
    delete next.qinggong
  }
  if (next.hard === id) {
    delete next.hard
  }
  return next
}

export function inferFormationFromEquippedSkills(skillIds: SkillId[]): SkillFormation {
  const formation = createEmptyFormation()
  for (const skillId of skillIds) {
    const skillDef = getSkillById(skillId)
    if (!skillDef) {
      continue
    }
    const slot = getFormationSlot(skillDef.category)
    if (slot === 'external') {
      if (formation.external.length < 2) {
        formation.external.push(skillId)
      }
      continue
    }
    formation[slot] = skillId
  }
  return formation
}
