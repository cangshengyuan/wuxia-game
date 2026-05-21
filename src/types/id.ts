/**
 * @module types/id
 * @layer types
 * @description Branded ID 类型，防止不同实体 ID 串用
 * @forbidden 禁止在 types 层 import engine/store/ui
 */

export type SkillId = string & { readonly __brand: 'SkillId' }
export type MoveId = string & { readonly __brand: 'MoveId' }
export type SceneId = string & { readonly __brand: 'SceneId' }
export type EnemyId = string & { readonly __brand: 'EnemyId' }
export type ItemId = string & { readonly __brand: 'ItemId' }
export type NpcId = string & { readonly __brand: 'NpcId' }
export type QuestId = string & { readonly __brand: 'QuestId' }

export function asSkillId(id: string): SkillId {
  return id as SkillId
}

export function asMoveId(id: string): MoveId {
  return id as MoveId
}

export function asSceneId(id: string): SceneId {
  return id as SceneId
}

export function asEnemyId(id: string): EnemyId {
  return id as EnemyId
}

export function asItemId(id: string): ItemId {
  return id as ItemId
}

export function asNpcId(id: string): NpcId {
  return id as NpcId
}

export function asQuestId(id: string): QuestId {
  return id as QuestId
}
