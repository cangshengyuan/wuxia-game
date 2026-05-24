/**
 * @module engine/persistence/save_schema
 * @layer engine
 * @description 版本化存档契约与迁移占位
 * @inputs raw JSON
 * @outputs SaveV1 | null
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store、禁止访问 ui
 */
import { asSceneId, asSkillId } from '../../types/id'
import type { QuestId, SceneId } from '../../types/id'
import type { CharacterAttributes, CharacterState, SkillRuntime } from '../../types/character'

export const SAVE_VERSION = 1 as const

export interface SaveV1 {
  version: typeof SAVE_VERSION
  player: CharacterState
  currentSceneId: SceneId
  completedQuests: QuestId[]
}

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

export function createDefaultSave(): SaveV1 {
  return {
    version: SAVE_VERSION,
    player: structuredClone(defaultPlayer),
    currentSceneId: defaultSceneId,
    completedQuests: [],
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

export function isSaveV1(value: unknown): value is SaveV1 {
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
  return isCharacterState(save.player)
}

/** 迁移占位：未来 V2 在此扩展 */
export function migrateSave(raw: unknown): SaveV1 | null {
  if (isSaveV1(raw)) {
    return raw
  }
  return null
}
