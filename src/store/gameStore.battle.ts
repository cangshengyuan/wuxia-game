/**
 * @module store/gameStore.battle
 * @layer store
 * @description 战斗结果写入与解锁通知切片
 * @inputs BattleResult
 * @outputs applyBattleResult, dismissUnlockNotice
 * @depends engine/skill, types
 * @forbidden 禁止 import React、禁止直接操作 localStorage
 */
import { applyProficiencyGain, checkUnlocks } from '../engine/skill/proficiency'
import { applyRealmProgress } from '../engine/skill/realm'
import { getMoveById, getSkillById } from '../engine/skillEngine'
import { asMoveId } from '../types/id'
import type { GameStoreSlice, GameStoreState } from './gameStore.types'

type BattleSliceState = Pick<
  GameStoreState,
  'recentUnlocks' | 'applyBattleResult' | 'dismissUnlockNotice'
>

let unlockNoticeCounter = 0

export function nextUnlockNoticeId(): string {
  unlockNoticeCounter += 1
  return `unlock_${unlockNoticeCounter}`
}

export const createBattleSlice: GameStoreSlice<BattleSliceState> = (set, get) => ({
  recentUnlocks: [],

  applyBattleResult: (result) => {
    const { player, rng } = get()
    const newUnlocks: ReturnType<typeof get>['recentUnlocks'] = []

    const profUpdatedSkills = player.learnedSkills.map((runtime) => {
      const gain = result.proficiencyGains.find((entry) => entry.skillId === runtime.skillId)
      if (!gain) {
        return runtime
      }

      const skillDef = getSkillById(runtime.skillId)
      if (!skillDef) {
        return runtime
      }

      const withGain = applyProficiencyGain(runtime, gain, skillDef)
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

    const updatedLearnedSkills = profUpdatedSkills.map((runtime) => {
      const skillDef = getSkillById(runtime.skillId)
      if (!skillDef) {
        return runtime
      }
      return applyRealmProgress(runtime, skillDef, profUpdatedSkills, rng).runtime
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

  dismissUnlockNotice: (id) => {
    set({ recentUnlocks: get().recentUnlocks.filter((notice) => notice.id !== id) })
  },
})
