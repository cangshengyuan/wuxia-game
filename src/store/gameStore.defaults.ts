/**
 * @module store/gameStore.defaults
 * @layer store
 * @description 游戏默认状态常量，供 store 切片与 battleStore 共享
 * @inputs 无
 * @outputs defaultPlayer, defaultSceneId
 * @depends types
 * @forbidden 禁止 import 其他 store 模块（避免循环依赖）
 */
import { asSceneId, asSkillId } from '../types/id'
import type { CharacterState } from '../types/character'

export const defaultSceneId = asSceneId('scene_001_village')

export const defaultPlayer: CharacterState = {
  id: 'player_001',
  name: '无名侠客',
  level: 1,
  hp: 120,
  maxHp: 120,
  qi: 60,
  maxQi: 60,
  attributes: {
    armStrength: 14,
    agility: 12,
    constitution: 13,
  },
  learnedSkills: [
    {
      skillId: asSkillId('skill_sword_010_qingmang'),
      proficiency: 0,
      unlockedMoveIds: ['move_qingmang_01'],
    },
    {
      skillId: asSkillId('skill_internal_001_huntuan'),
      proficiency: 0,
      unlockedMoveIds: ['move_huntuan_01'],
    },
  ],
  speed: 12,
  equippedSkillIds: [asSkillId('skill_sword_010_qingmang')],
}
