/**
 * @module types/world
 * @layer types
 * @description 场景、敌人、NPC、任务等世界实体类型契约
 * @forbidden 禁止在 types 层 import engine/store/ui
 */

import type { CharacterAttributes } from './character'
import type { EnemyId, NpcId, QuestId, SceneId, SkillId } from './id'

export interface EncounterEntry {
  enemyId: EnemyId
  weight?: number
}

export interface SceneDefinition {
  id: SceneId
  name: string
  description?: string
  encounters: EncounterEntry[]
}

export interface EnemyDefinition {
  id: EnemyId
  name: string
  level: number
  hp: number
  maxHp: number
  qi: number
  maxQi: number
  attributes: CharacterAttributes
  equippedSkillIds: SkillId[]
  skillRewards?: SkillId[]
  speed: number
}

export interface NpcDefinition {
  id: NpcId
  name: string
  sceneId: SceneId
  description?: string
}

export type QuestObjectiveType =
  | 'talk_to_npc'
  | 'reach_scene'
  | 'defeat_enemy'
  | 'return_to_npc'

export interface QuestObjective {
  type: QuestObjectiveType
  targetId: string
  description?: string
}

export interface QuestRewards {
  skillIds: SkillId[]
}

export interface QuestDefinition {
  id: QuestId
  name: string
  description: string
  objectives: QuestObjective[]
  giverNpcId?: NpcId
  rewards?: QuestRewards
}

export interface ActiveQuest {
  questId: QuestId
  currentStepIndex: number
  status: 'active' | 'ready_to_complete'
}
