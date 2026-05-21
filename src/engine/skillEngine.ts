/**
 * @module engine/skillEngine
 * @layer engine
 * @description 技能数据读取与查询（仅从 data JSON 读取）
 * @inputs skillId, moveId, category
 * @outputs SkillDefinition | undefined
 * @depends types, data
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import internalSkills from '../data/skills/internal/index.json'
import swordSkills from '../data/skills/sword/index.json'
import { asMoveId, asSkillId } from '../types/id'
import type { MoveId, SkillId } from '../types/id'
import type { SkillCategory, SkillDefinition, SkillMove } from '../types/skill'

function isSkillMove(value: unknown): value is SkillMove {
  if (!value || typeof value !== 'object') {
    return false
  }
  const m = value as Record<string, unknown>
  if (
    typeof m.id !== 'string' ||
    !m.id.startsWith('move_') ||
    typeof m.name !== 'string' ||
    typeof m.cd !== 'number' ||
    typeof m.qiCost !== 'number' ||
    typeof m.powerRatio !== 'number' ||
    typeof m.unlockProficiency !== 'number' ||
    m.unlockProficiency < 0
  ) {
    return false
  }
  if (m.element !== undefined && typeof m.element !== 'string') {
    return false
  }
  if (m.tag !== undefined && typeof m.tag !== 'string') {
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
    typeof skill.category !== 'string' ||
    typeof skill.tier !== 'string' ||
    typeof skill.description !== 'string' ||
    typeof skill.maxProficiency !== 'number' ||
    !Array.isArray(skill.moves)
  ) {
    return false
  }

  return skill.moves.every(isSkillMove)
}

function normalizeSkill(raw: Record<string, unknown>): SkillDefinition {
  const moves = (raw.moves as Record<string, unknown>[]).map((move) => ({
    ...move,
    id: asMoveId(move.id as string),
  })) as SkillMove[]

  return {
    id: asSkillId(raw.id as string),
    name: raw.name as string,
    category: raw.category as SkillCategory,
    tier: raw.tier as SkillDefinition['tier'],
    description: raw.description as string,
    maxProficiency: raw.maxProficiency as number,
    moves,
  }
}

const rawSkills: unknown[] = [...internalSkills, ...swordSkills]
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
    const move = skill.moves.find((m) => m.id === id)
    if (move) {
      return { skill, move }
    }
  }
  return undefined
}
