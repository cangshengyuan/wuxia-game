/**
 * @module engine/persistence/save_schema
 * @layer engine
 * @description 版本化存档契约与迁移占位
 * @inputs raw JSON
 * @outputs SaveV2 | null
 * @depends types
 * @forbidden 禁止 import React、禁止访问 store、禁止访问 ui
 */
import { asQuestId } from '../../types/id'
import { inferFormationFromEquippedSkills } from '../character/formation'
import { createDefaultPlayerState, getDefaultSceneId } from '../config/gameConfig'
import type { QuestId, SceneId } from '../../types/id'
import type {
  CharacterAttributes,
  CharacterState,
  MeditationState,
  SkillRuntime,
} from '../../types/character'
import type { ActiveQuest } from '../../types/world'

export const SAVE_VERSION = 4 as const

export interface SaveV1 {
  version: 1
  player: CharacterState
  currentSceneId: SceneId
  completedQuests: QuestId[]
}

export interface SaveV2 {
  version: 2
  player: CharacterState
  currentSceneId: SceneId
  completedQuests: QuestId[]
  activeQuests: ActiveQuest[]
}

export interface SaveV3 {
  version: 3
  player: CharacterState
  currentSceneId: SceneId
  completedQuests: QuestId[]
  activeQuests: ActiveQuest[]
}

export interface SaveV4 {
  version: typeof SAVE_VERSION
  player: CharacterState
  currentSceneId: SceneId
  completedQuests: QuestId[]
  activeQuests: ActiveQuest[]
}

export type SaveData = SaveV4

const defaultSceneId = getDefaultSceneId()

export function createDefaultSave(): SaveV4 {
  return {
    version: SAVE_VERSION,
    player: createDefaultPlayerState(),
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
  if (
    typeof runtime.skillId !== 'string' ||
    typeof runtime.proficiency !== 'number' ||
    typeof runtime.realmLevel !== 'number' ||
    typeof runtime.insight !== 'number'
  ) {
    return false
  }
  if (!Array.isArray(runtime.unlockedMoveIds)) {
    return false
  }
  return runtime.unlockedMoveIds.every((moveId) => typeof moveId === 'string')
}

function isMeditationState(value: unknown): value is MeditationState {
  if (!value || typeof value !== 'object') {
    return false
  }
  const meditation = value as Record<string, unknown>
  return (
    typeof meditation.isActive === 'boolean' &&
    typeof meditation.accumulatedMs === 'number'
  )
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
  if (!player.equippedSkillIds.every((skillId) => typeof skillId === 'string')) {
    return false
  }
  if (player.formation !== undefined) {
    if (!player.formation || typeof player.formation !== 'object') {
      return false
    }
    const formation = player.formation as Record<string, unknown>
    if (!Array.isArray(formation.external) || !formation.external.every((skillId) => typeof skillId === 'string')) {
      return false
    }
  }
  if (player.weaponType !== undefined && player.weaponType !== 'sword' && player.weaponType !== 'unarmed') {
    return false
  }
  if (player.meditation !== undefined && !isMeditationState(player.meditation)) {
    return false
  }
  return true
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
  if (save.version !== 2) {
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

export function isSaveV3(value: unknown): value is SaveV3 {
  if (!value || typeof value !== 'object') {
    return false
  }
  const save = value as Record<string, unknown>
  if (save.version !== 3) {
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

export function isSaveV4(value: unknown): value is SaveV4 {
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

function enrichPlayerRuntime(player: CharacterState): CharacterState {
  return {
    ...player,
    learnedSkills: player.learnedSkills.map((runtime) => ({
      ...runtime,
      realmLevel: runtime.realmLevel ?? 1,
      insight: runtime.insight ?? 0,
    })),
    formation: player.formation ?? inferFormationFromEquippedSkills(player.equippedSkillIds),
    weaponType: player.weaponType ?? 'sword',
    meditation: player.meditation ?? {
      isActive: false,
      accumulatedMs: 0,
    },
  }
}

function migrateV1ToV4(save: SaveV1): SaveV4 {
  return {
    version: SAVE_VERSION,
    player: enrichPlayerRuntime(save.player),
    currentSceneId: save.currentSceneId,
    completedQuests: save.completedQuests.map((questId) => asQuestId(questId)),
    activeQuests: [],
  }
}

function migrateV2ToV4(save: SaveV2): SaveV4 {
  return {
    version: SAVE_VERSION,
    player: enrichPlayerRuntime(save.player),
    currentSceneId: save.currentSceneId,
    completedQuests: save.completedQuests.map((questId) => asQuestId(questId)),
    activeQuests: save.activeQuests,
  }
}

function migrateV3ToV4(save: SaveV3): SaveV4 {
  return {
    version: SAVE_VERSION,
    player: enrichPlayerRuntime(save.player),
    currentSceneId: save.currentSceneId,
    completedQuests: save.completedQuests.map((questId) => asQuestId(questId)),
    activeQuests: save.activeQuests,
  }
}

export function migrateSave(raw: unknown): SaveV4 | null {
  if (isSaveV4(raw)) {
    return raw
  }
  if (isSaveV3(raw)) {
    return migrateV3ToV4(raw)
  }
  if (isSaveV2(raw)) {
    return migrateV2ToV4(raw)
  }
  if (isSaveV1(raw)) {
    return migrateV1ToV4(raw)
  }
  return null
}
