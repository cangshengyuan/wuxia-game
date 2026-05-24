/**
 * @module engine/persistence/save_schema
 * @layer engine
 * @description 版本化存档契约与迁移占位
 * @inputs raw JSON
 * @outputs SaveV2 | null
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store、禁止访问 ui
 */
import { asQuestId, asSceneId, asSkillId } from '../../types/id'
import type { QuestId, SceneId } from '../../types/id'
import type { CharacterAttributes, CharacterState, SkillRuntime } from '../../types/character'
import type { ActiveQuest } from '../../types/world'

export const SAVE_VERSION = 2 as const

export interface SaveV1 {
  version: 1
  player: CharacterState
  currentSceneId: SceneId
  completedQuests: QuestId[]
}

export interface SaveV2 {
  version: typeof SAVE_VERSION
  player: CharacterState
  currentSceneId: SceneId
  completedQuests: QuestId[]
  activeQuests: ActiveQuest[]
}

export type SaveData = SaveV2

const defaultSceneId = asSceneId('scene_001_village')

const defaultPlayer: CharacterState = {
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

export function createDefaultSave(): SaveV2 {
  return {
    version: SAVE_VERSION,
    player: structuredClone(defaultPlayer),
    currentSceneId: defaultSceneId,
    completedQuests: [],
    activeQuests: [],
  }
}

function isCharacterAttributes(value: unknown): value is CharacterAttributes {
  if (!value || typeof value !== 'object') {
    return false
  }
  const attrs = value as Record<string, unknown>
  return (
    typeof attrs.armStrength === 'number' &&
    typeof attrs.agility === 'number' &&
    typeof attrs.constitution === 'number'
  )
}

function isSkillRuntime(value: unknown): value is SkillRuntime {
  if (!value || typeof value !== 'object') {
    return false
  }
  const runtime = value as Record<string, unknown>
  if (typeof runtime.skillId !== 'string' || typeof runtime.proficiency !== 'number') {
    return false
  }
  if (!Array.isArray(runtime.unlockedMoveIds)) {
    return false
  }
  return runtime.unlockedMoveIds.every((moveId) => typeof moveId === 'string')
}

function isCharacterState(value: unknown): value is CharacterState {
  if (!value || typeof value !== 'object') {
    return false
  }
  const player = value as Record<string, unknown>
  if (
    typeof player.id !== 'string' ||
    typeof player.name !== 'string' ||
    typeof player.level !== 'number' ||
    typeof player.hp !== 'number' ||
    typeof player.maxHp !== 'number' ||
    typeof player.qi !== 'number' ||
    typeof player.maxQi !== 'number' ||
    typeof player.speed !== 'number'
  ) {
    return false
  }
  if (!isCharacterAttributes(player.attributes)) {
    return false
  }
  if (!Array.isArray(player.learnedSkills) || !player.learnedSkills.every(isSkillRuntime)) {
    return false
  }
  if (!Array.isArray(player.equippedSkillIds)) {
    return false
  }
  return player.equippedSkillIds.every((skillId) => typeof skillId === 'string')
}

function isActiveQuest(value: unknown): value is ActiveQuest {
  if (!value || typeof value !== 'object') {
    return false
  }
  const quest = value as Record<string, unknown>
  return (
    typeof quest.questId === 'string' &&
    typeof quest.currentStepIndex === 'number' &&
    (quest.status === 'active' || quest.status === 'ready_to_complete')
  )
}

export function isSaveV1(value: unknown): value is SaveV1 {
  if (!value || typeof value !== 'object') {
    return false
  }
  const save = value as Record<string, unknown>
  if (save.version !== 1) {
    return false
  }
  if (typeof save.currentSceneId !== 'string') {
    return false
  }
  if (!Array.isArray(save.completedQuests)) {
    return false
  }
  if (!save.completedQuests.every((questId) => typeof questId === 'string')) {
    return false
  }
  return isCharacterState(save.player)
}

export function isSaveV2(value: unknown): value is SaveV2 {
  if (!value || typeof value !== 'object') {
    return false
  }
  const save = value as Record<string, unknown>
  if (save.version !== SAVE_VERSION) {
    return false
  }
  if (typeof save.currentSceneId !== 'string') {
    return false
  }
  if (!Array.isArray(save.completedQuests)) {
    return false
  }
  if (!save.completedQuests.every((questId) => typeof questId === 'string')) {
    return false
  }
  if (!Array.isArray(save.activeQuests) || !save.activeQuests.every(isActiveQuest)) {
    return false
  }
  return isCharacterState(save.player)
}

function migrateV1ToV2(save: SaveV1): SaveV2 {
  return {
    version: SAVE_VERSION,
    player: save.player,
    currentSceneId: save.currentSceneId,
    completedQuests: save.completedQuests.map((questId) => asQuestId(questId)),
    activeQuests: [],
  }
}

export function migrateSave(raw: unknown): SaveV2 | null {
  if (isSaveV2(raw)) {
    return raw
  }
  if (isSaveV1(raw)) {
    return migrateV1ToV2(raw)
  }
  return null
}
