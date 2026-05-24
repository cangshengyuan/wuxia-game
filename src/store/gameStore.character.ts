/**
 * @module store/gameStore.character
 * @layer store
 * @description 角色功法与技能展示切片
 * @inputs SkillId
 * @outputs canUpgradeSkill, upgradeSkill, getSkillDisplay, learnSkill
 * @depends engine/character, engine/skillEngine
 * @forbidden 禁止 import React、禁止直接操作 localStorage
 */
import {
  canUpgradeSkill as canUpgradeSkillEngine,
  grantSkill,
  upgradeSkill as upgradeSkillEngine,
} from '../engine/character/skill_runtime'
import { getMoveById, getSkillById } from '../engine/skillEngine'
import { asMoveId, asSkillId } from '../types/id'
import type { UnlockNotice } from '../types/notice'
import type { GameStoreSlice, GameStoreState } from './gameStore.types'

type CharacterSliceState = Pick<
  GameStoreState,
  'canUpgradeSkill' | 'upgradeSkill' | 'getSkillDisplay' | 'learnSkill'
>
import { nextUnlockNoticeId } from './gameStore.battle'

export const createCharacterSlice: GameStoreSlice<CharacterSliceState> = (set, get) => ({
  canUpgradeSkill: (skillId) => {
    const runtime = get().player.learnedSkills.find((entry) => entry.skillId === skillId)
    const skillDef = getSkillById(skillId)
    if (!runtime || !skillDef) {
      return false
    }
    return canUpgradeSkillEngine(runtime, skillDef)
  },

  upgradeSkill: (skillId) => {
    const { player } = get()
    const skillDef = getSkillById(skillId)
    if (!skillDef) {
      return
    }

    set({
      player: {
        ...player,
        learnedSkills: player.learnedSkills.map((runtime) =>
          runtime.skillId === skillId ? upgradeSkillEngine(runtime, skillDef) : runtime,
        ),
      },
    })
  },

  getSkillDisplay: (skillId) => {
    const runtime = get().player.learnedSkills.find((entry) => entry.skillId === skillId)
    const skillDef = getSkillById(skillId)
    if (!runtime || !skillDef) {
      return undefined
    }

    const unlockedMoveNames = runtime.unlockedMoveIds.map((moveId) => {
      const moveInfo = getMoveById(moveId)
      return moveInfo?.move.name ?? moveId
    })

    return {
      skillId: runtime.skillId,
      skillName: skillDef.name,
      proficiency: runtime.proficiency,
      maxProficiency: skillDef.maxProficiency,
      unlockedMoveNames,
    }
  },

  learnSkill: (skillId) => {
    const id = typeof skillId === 'string' ? asSkillId(skillId) : skillId
    const skillDef = getSkillById(id)
    if (!skillDef) {
      return
    }

    const { player, recentUnlocks } = get()
    if (player.learnedSkills.some((runtime) => runtime.skillId === id)) {
      return
    }

    const runtime = grantSkill(id, skillDef)
    const firstMoveId = runtime.unlockedMoveIds[0]
    const moveInfo = firstMoveId ? getMoveById(firstMoveId) : undefined
    const newUnlocks: UnlockNotice[] = firstMoveId
      ? [
          {
            id: nextUnlockNoticeId(),
            skillId: id,
            moveId: asMoveId(firstMoveId),
            skillName: skillDef.name,
            moveName: moveInfo?.move.name ?? firstMoveId,
          },
        ]
      : []

    set({
      player: {
        ...player,
        learnedSkills: [...player.learnedSkills, runtime],
      },
      recentUnlocks: [...recentUnlocks, ...newUnlocks],
    })
  },
})
