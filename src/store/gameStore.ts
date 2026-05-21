import { create } from 'zustand'
import {
  canUpgradeSkill as canUpgradeSkillEngine,
  upgradeSkill as upgradeSkillEngine,
} from '../engine/character/skill_runtime'
import { applyProficiencyGain, checkUnlocks } from '../engine/skill/proficiency'
import { getMoveById, getSkillById } from '../engine/skillEngine'
import { asMoveId, asSkillId } from '../types/id'
import type { BattleResult } from '../types/battle'
import type { CharacterState } from '../types/character'
import type { UnlockNotice } from '../types/notice'
import type { SkillId } from '../types/id'

export interface SkillDisplay {
  skillId: SkillId
  skillName: string
  proficiency: number
  maxProficiency: number
  unlockedMoveNames: string[]
}

interface GameStoreState {
  player: CharacterState
  recentUnlocks: UnlockNotice[]
  applyBattleResult: (result: BattleResult) => void
  canUpgradeSkill: (skillId: SkillId | string) => boolean
  upgradeSkill: (skillId: SkillId | string) => void
  dismissUnlockNotice: (id: string) => void
  getSkillDisplay: (skillId: SkillId | string) => SkillDisplay | undefined
}

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

let unlockNoticeCounter = 0

function nextUnlockNoticeId(): string {
  unlockNoticeCounter += 1
  return `unlock_${unlockNoticeCounter}`
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  player: defaultPlayer,
  recentUnlocks: [],

  applyBattleResult: (result) => {
    const { player } = get()
    const newUnlocks: UnlockNotice[] = []

    const updatedLearnedSkills = player.learnedSkills.map((runtime) => {
      const gain = result.proficiencyGains.find((entry) => entry.skillId === runtime.skillId)
      if (!gain) {
        return runtime
      }

      const skillDef = getSkillById(runtime.skillId)
      if (!skillDef) {
        return runtime
      }

      const withGain = applyProficiencyGain(runtime, gain, skillDef.maxProficiency)
      const { newlyUnlockedMoveIds } = checkUnlocks(withGain, skillDef)

      for (const moveId of newlyUnlockedMoveIds) {
        const moveInfo = getMoveById(moveId)
        newUnlocks.push({
          id: nextUnlockNoticeId(),
          skillId: runtime.skillId,
          moveId: asMoveId(moveId),
          skillName: skillDef.name,
          moveName: moveInfo?.move.name ?? moveId,
        })
      }

      if (newlyUnlockedMoveIds.length === 0) {
        return withGain
      }

      return {
        ...withGain,
        unlockedMoveIds: [...withGain.unlockedMoveIds, ...newlyUnlockedMoveIds],
      }
    })

    set({
      player: {
        ...player,
        hp: result.finalPlayerHp,
        qi: result.finalPlayerQi,
        learnedSkills: updatedLearnedSkills,
      },
      recentUnlocks: [...get().recentUnlocks, ...newUnlocks],
    })
  },

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

  dismissUnlockNotice: (id) => {
    set({ recentUnlocks: get().recentUnlocks.filter((notice) => notice.id !== id) })
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
}))
