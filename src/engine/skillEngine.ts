import { skillCatalog } from '../data/skills'
import type { SkillDefinition } from '../types/skill'

export function getSkillById(skillId: string): SkillDefinition | undefined {
  return skillCatalog.find((skill) => skill.id === skillId)
}

export function listAllSkills(): SkillDefinition[] {
  return skillCatalog
}
