import type { SkillDefinition } from '../types/skill'

export const skillCatalog: SkillDefinition[] = [
  {
    id: 'skill_sword_010_qingmang',
    name: '青蟒剑法',
    category: 'sword',
    tier: 'low',
    description: '华山入门剑法，重在基础身法与连刺。',
    maxProficiency: 30,
    moves: [
      {
        id: 'move_qingmang_01',
        name: '青蟒出洞',
        cd: 3,
        qiCost: 10,
        powerRatio: 1.35,
      },
    ],
  },
  {
    id: 'skill_internal_001_huntuan',
    name: '混元功',
    category: 'internal',
    tier: 'low',
    description: '平稳运气，提升续战能力。',
    maxProficiency: 30,
    moves: [
      {
        id: 'move_huntuan_01',
        name: '混元运气',
        cd: 5,
        qiCost: 8,
        powerRatio: 0.8,
      },
    ],
  },
]
