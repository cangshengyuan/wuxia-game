/**
 * @module engine/skillEngine
 * @layer engine
 * @description 技能数据读取与查询（仅从 data JSON 读取）
 * @inputs skillId
 * @outputs SkillDefinition | undefined
 * @depends types, data
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import internalSkills from '../data/skills/internal/index.json'
import swordSkills from '../data/skills/sword/index.json'
import type { SkillDefinition } from '../types/skill'

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

  return skill.moves.every((move) => {
    if (!move || typeof move !== 'object') {
      return false
    }
    const m = move as Record<string, unknown>
    return (
      typeof m.id === 'string' &&
      typeof m.name === 'string' &&
      typeof m.cd === 'number' &&
      typeof m.qiCost === 'number' &&
      typeof m.powerRatio === 'number'
    )
  })
}

const rawSkills: unknown[] = [...internalSkills, ...swordSkills]
const skillCatalog: SkillDefinition[] = rawSkills.filter(isSkillDefinition)

export function getSkillById(skillId: string): SkillDefinition | undefined {
  return skillCatalog.find((skill) => skill.id === skillId)
}

export function listAllSkills(): SkillDefinition[] {
  return skillCatalog
}
