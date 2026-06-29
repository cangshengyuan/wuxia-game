/**
 * @module types/world
 * @layer types
 * @description 场景、敌人、NPC、任务等世界实体类型契约
 * @forbidden 禁止在 types 层 import engine/store/ui
 */

import type { CharacterAttributes, SkillRuntime } from './character'
import type { AreaId, EnemyId, NpcId, QuestId, SceneId, SkillId } from './id'
import type { WeaponRequirement } from './skill'

export interface EncounterEntry {
  enemyId: EnemyId
  weight?: number
}

export type SceneKind = 'city_hub' | 'city_poi' | 'gate' | 'station' | 'road' | 'wilderness' | 'dungeon'

export type SafetyLevel = 'safe' | 'guarded' | 'dangerous'

export type TravelMode = 'walk' | 'gate' | 'station'

export type ExitDirection =
  | 'north'
  | 'north_east'
  | 'east'
  | 'south_east'
  | 'south'
  | 'south_west'
  | 'west'
  | 'north_west'

export type AreaKind = 'city' | 'outskirts' | 'travel_hub'

export type ProgressCondition =
  | { type: 'quest_active'; questId: QuestId }
  | { type: 'quest_completed'; questId: QuestId }
  | { type: 'quest_inactive'; questId: QuestId }
  | { type: 'has_skill'; skillId: SkillId }
  | { type: 'missing_skill'; skillId: SkillId }
  | { type: 'skill_proficiency_at_least'; skillId: SkillId; proficiency: number }
  | {
      type: 'current_quest_objective_type'
      questId: QuestId
      objectiveType: QuestObjectiveType
    }

export interface ProgressState {
  activeQuests: ActiveQuest[]
  completedQuests: QuestId[]
  learnedSkills: SkillRuntime[]
}

export interface SceneExit {
  toSceneId: SceneId
  mode: TravelMode
  direction?: ExitDirection
  label?: string
  travelTimeMinutes?: number
  silverCost?: number
  requirements?: ProgressCondition[]
}

export interface SceneDefinition {
  id: SceneId
  name: string
  areaId?: AreaId
  kind: SceneKind
  safety: SafetyLevel
  description?: string
  encounters: EncounterEntry[]
  exits: SceneExit[]
}

export interface AreaDefinition {
  id: AreaId
  name: string
  kind: AreaKind
  description?: string
  hubSceneId: SceneId
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
  weaponType: WeaponRequirement
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

export type NpcInteractionAction =
  | { type: 'learn_skill'; skillId: SkillId }
  | { type: 'accept_quest'; questId: QuestId }
  | { type: 'emit_dialog_closed' }

export interface NpcInteractionState {
  conditions?: ProgressCondition[]
  message: string
  primaryActionLabel?: string
  actions?: NpcInteractionAction[]
  closeDialogOnAction?: boolean
}

export interface NpcInteractionDefinition {
  npcId: NpcId
  states: NpcInteractionState[]
}
