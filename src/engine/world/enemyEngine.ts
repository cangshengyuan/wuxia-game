/**
 * @module engine/world/enemyEngine
 * @layer engine
 * @description 敌人数据读取与 CharacterState 构建（仅从 data JSON 读取）
 * @inputs enemyId
 * @outputs EnemyDefinition | CharacterState
 * @depends types, data
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import enemiesData from '../../data/enemies/index.json'
import { inferFormationFromEquippedSkills } from '../character/formation'
import { grantSkill } from '../character/skill_runtime'
import { getSkillById } from '../skillEngine'
import { asEnemyId, asSkillId } from '../../types/id'
import type { EnemyId } from '../../types/id'
import type { CharacterState } from '../../types/character'
import type { EnemyDefinition } from '../../types/world'
import type { WeaponRequirement } from '../../types/skill'

function isWeaponRequirement(value: unknown): value is WeaponRequirement {
  return value === 'sword' || value === 'unarmed'
}

function isCharacterAttributes(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }
  const a = value as Record<string, unknown>
  return (
    typeof a.armStrength === 'number' &&
    typeof a.agility === 'number' &&
    typeof a.constitution === 'number'
  )
}

function isEnemyDefinition(value: unknown): value is EnemyDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const e = value as Record<string, unknown>
  if (
    typeof e.id !== 'string' ||
    !e.id.startsWith('enemy_') ||
    typeof e.name !== 'string' ||
    typeof e.level !== 'number' ||
    typeof e.hp !== 'number' ||
    typeof e.maxHp !== 'number' ||
    typeof e.qi !== 'number' ||
    typeof e.maxQi !== 'number' ||
    typeof e.speed !== 'number' ||
    !isCharacterAttributes(e.attributes) ||
    !Array.isArray(e.equippedSkillIds) ||
    !isWeaponRequirement(e.weaponType)
  ) {
    return false
  }
  return e.equippedSkillIds.every(
    (sid) => typeof sid === 'string' && sid.startsWith('skill_'),
  )
    && (e.skillRewards === undefined || (Array.isArray(e.skillRewards) && e.skillRewards.every(
      (sid) => typeof sid === 'string' && sid.startsWith('skill_'),
    )))
}

function normalizeEnemy(raw: Record<string, unknown>): EnemyDefinition {
  return {
    id: asEnemyId(raw.id as string),
    name: raw.name as string,
    level: raw.level as number,
    hp: raw.hp as number,
    maxHp: raw.maxHp as number,
    qi: raw.qi as number,
    maxQi: raw.maxQi as number,
    attributes: raw.attributes as EnemyDefinition['attributes'],
    equippedSkillIds: (raw.equippedSkillIds as string[]).map(asSkillId),
    ...(raw.skillRewards !== undefined
      ? { skillRewards: (raw.skillRewards as string[]).map(asSkillId) }
      : {}),
    speed: raw.speed as number,
    weaponType: raw.weaponType as WeaponRequirement,
  }
}

const enemyCatalog: EnemyDefinition[] = (enemiesData as unknown[])
  .filter(isEnemyDefinition)
  .map((enemy) => normalizeEnemy(enemy as unknown as Record<string, unknown>))

export function getEnemyById(enemyId: EnemyId | string): EnemyDefinition | undefined {
  const id = typeof enemyId === 'string' ? asEnemyId(enemyId) : enemyId
  return enemyCatalog.find((enemy) => enemy.id === id)
}

export function buildEnemyState(enemyId: EnemyId | string): CharacterState | undefined {
  const def = getEnemyById(enemyId)
  if (!def) {
    return undefined
  }

  return {
    id: def.id,
    name: def.name,
    level: def.level,
    hp: def.hp,
    maxHp: def.maxHp,
    qi: def.qi,
    maxQi: def.maxQi,
    attributes: { ...def.attributes },
    learnedSkills: def.equippedSkillIds.flatMap((skillId) => {
      const skillDef = getSkillById(skillId)
      return skillDef ? [grantSkill(skillId, skillDef)] : []
    }),
    speed: def.speed,
    formation: inferFormationFromEquippedSkills(def.equippedSkillIds),
    weaponType: def.weaponType,
    equippedSkillIds: [...def.equippedSkillIds],
  }
}
