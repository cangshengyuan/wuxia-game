/**
 * @module engine/config/gameConfig
 * @layer engine
 * @description 读取默认开局与平衡配置（仅从 data JSON 读取）
 * @inputs config key
 * @outputs GameConfigDefinition
 * @depends types, data
 * @forbidden 禁止 import React、禁止访问 store、禁止修改 data 原始对象
 */
import configData from '../../data/config/index.json'
import { asEnemyId, asSceneId, asSkillId } from '../../types/id'
import type {
  CharacterAttributes,
  CharacterState,
  MeditationState,
  SkillRuntime,
} from '../../types/character'
import type {
  FormationBalanceConfig,
  GameBalanceConfig,
  GameBootstrapConfig,
  GameConfigDefinition,
} from '../../types/config'
import type { WeaponRequirement } from '../../types/skill'

function isWeaponRequirement(value: unknown): value is WeaponRequirement {
  return value === 'sword' || value === 'unarmed'
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
    !runtime.skillId.startsWith('skill_') ||
    typeof runtime.proficiency !== 'number' ||
    typeof runtime.realmLevel !== 'number' ||
    typeof runtime.insight !== 'number' ||
    !Array.isArray(runtime.unlockedMoveIds)
  ) {
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
    typeof player.speed !== 'number' ||
    !isCharacterAttributes(player.attributes) ||
    !Array.isArray(player.learnedSkills) ||
    !player.learnedSkills.every(isSkillRuntime) ||
    !Array.isArray(player.equippedSkillIds) ||
    !player.equippedSkillIds.every((skillId) => typeof skillId === 'string')
  ) {
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
    if (formation.internal !== undefined && typeof formation.internal !== 'string') {
      return false
    }
    if (formation.qinggong !== undefined && typeof formation.qinggong !== 'string') {
      return false
    }
    if (formation.hard !== undefined && typeof formation.hard !== 'string') {
      return false
    }
  }
  if (player.meditation !== undefined && !isMeditationState(player.meditation)) {
    return false
  }
  return player.weaponType === undefined || isWeaponRequirement(player.weaponType)
}

function isFormationBalanceConfig(value: unknown): value is FormationBalanceConfig {
  if (!value || typeof value !== 'object') {
    return false
  }
  const formation = value as Record<string, unknown>
  return (
    typeof formation.highTierMinRealm === 'number' &&
    typeof formation.maxExternalSkills === 'number'
  )
}

function isGameBalanceConfig(value: unknown): value is GameBalanceConfig {
  if (!value || typeof value !== 'object') {
    return false
  }
  const balance = value as Record<string, unknown>
  return isFormationBalanceConfig(balance.formation)
}

function isGameBootstrapConfig(value: unknown): value is GameBootstrapConfig {
  if (!value || typeof value !== 'object') {
    return false
  }
  const bootstrap = value as Record<string, unknown>
  return (
    typeof bootstrap.startSceneId === 'string' &&
    bootstrap.startSceneId.startsWith('scene_') &&
    typeof bootstrap.defaultBattleEnemyId === 'string' &&
    bootstrap.defaultBattleEnemyId.startsWith('enemy_') &&
    isCharacterState(bootstrap.player)
  )
}

function isGameConfigDefinition(value: unknown): value is GameConfigDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }
  const config = value as Record<string, unknown>
  return isGameBootstrapConfig(config.bootstrap) && isGameBalanceConfig(config.balance)
}

function normalizePlayer(raw: CharacterState): CharacterState {
  return {
    ...raw,
    learnedSkills: raw.learnedSkills.map((runtime) => ({
      ...runtime,
      skillId: asSkillId(runtime.skillId),
      unlockedMoveIds: [...runtime.unlockedMoveIds],
    })),
    formation: raw.formation
      ? {
          external: raw.formation.external.map((skillId) => asSkillId(skillId)),
          ...(raw.formation.internal ? { internal: asSkillId(raw.formation.internal) } : {}),
          ...(raw.formation.qinggong ? { qinggong: asSkillId(raw.formation.qinggong) } : {}),
          ...(raw.formation.hard ? { hard: asSkillId(raw.formation.hard) } : {}),
        }
      : undefined,
    equippedSkillIds: raw.equippedSkillIds.map((skillId) => asSkillId(skillId)),
    meditation: raw.meditation
      ? {
          isActive: raw.meditation.isActive,
          accumulatedMs: raw.meditation.accumulatedMs,
        }
      : {
          isActive: false,
          accumulatedMs: 0,
        },
  }
}

function normalizeConfig(raw: GameConfigDefinition): GameConfigDefinition {
  return {
    bootstrap: {
      startSceneId: asSceneId(raw.bootstrap.startSceneId),
      defaultBattleEnemyId: asEnemyId(raw.bootstrap.defaultBattleEnemyId),
      player: normalizePlayer(raw.bootstrap.player),
    },
    balance: {
      formation: {
        highTierMinRealm: raw.balance.formation.highTierMinRealm,
        maxExternalSkills: raw.balance.formation.maxExternalSkills,
      },
    },
  }
}

const gameConfig = isGameConfigDefinition(configData)
  ? normalizeConfig(configData)
  : (() => {
      throw new Error('Invalid game config data')
    })()

export function getDefaultSceneId() {
  return gameConfig.bootstrap.startSceneId
}

export function getDefaultBattleEnemyId() {
  return gameConfig.bootstrap.defaultBattleEnemyId
}

export function createDefaultPlayerState(): CharacterState {
  return structuredClone(gameConfig.bootstrap.player)
}

export function getGameBalanceConfig(): GameBalanceConfig {
  return structuredClone(gameConfig.balance)
}
