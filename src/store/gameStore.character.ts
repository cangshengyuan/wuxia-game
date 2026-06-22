/**
 * @module store/gameStore.character
 * @layer store
 * @description 角色功法展示、学习与战前编成切片
 * @inputs SkillId
 * @outputs canUpgradeSkill, upgradeSkill, getSkillDisplay, getLearnedSkillDisplays, learnSkill
 * @depends engine/character, engine/skillEngine
 * @forbidden 禁止 import React、禁止直接操作 localStorage
 */
import {
  canUpgradeSkill as canUpgradeSkillEngine,
  canUseMove,
  grantSkill,
  upgradeSkill as upgradeSkillEngine,
} from '../engine/character/skill_runtime'
import { calculateSkillAttributeBonuses } from '../engine/character/attributes'
import {
  canEquipSkill,
  createEmptyFormation,
  equipSkillInFormation,
  flattenFormation,
  getFormationSlot,
  inferFormationFromEquippedSkills,
  unequipSkillFromFormation,
} from '../engine/character/formation'
import { getSynergySources } from '../engine/skill_relation_engine'
import { calculateInheritedProficiency } from '../engine/skill/inheritance'
import { countSimilarSkills } from '../engine/skill/realm'
import { getMoveById, getSkillById } from '../engine/skillEngine'
import { asMoveId, asSkillId } from '../types/id'
import type { UnlockNotice } from '../types/notice'
import type {
  FormationSkillOptionDisplay,
  FormationSlotDisplay,
  GameStoreSlice,
  GameStoreState,
  SkillDisplay,
} from './gameStore.types'

type CharacterSliceState = Pick<
  GameStoreState,
  | 'canUpgradeSkill'
  | 'upgradeSkill'
  | 'getSkillDisplay'
  | 'getLearnedSkillDisplays'
  | 'getFormationSlots'
  | 'getFormationSkillOptions'
  | 'equipSkill'
  | 'unequipSkill'
  | 'learnSkill'
>
import { nextUnlockNoticeId } from './gameStore.battle'

const ATTRIBUTE_LABELS = {
  armStrength: '臂力',
  agility: '身法',
  constitution: '体魄',
  maxHp: '气血',
  maxQi: '内力',
  speed: '速度',
} as const

function buildAttributeBonusSummaries(display: ReturnType<typeof calculateSkillAttributeBonuses>): string[] {
  return Object.entries(display)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${ATTRIBUTE_LABELS[key as keyof typeof ATTRIBUTE_LABELS]} +${value}`)
}

function buildNextBreakthroughSummary(state: GameStoreState, skillId: string): string {
  const runtime = state.player.learnedSkills.find((entry) => entry.skillId === skillId)
  const skillDef = getSkillById(skillId)
  if (!runtime || !skillDef) {
    return '未知'
  }
  if (runtime.realmLevel >= skillDef.realm.maxLevel) {
    return '已至最高境界'
  }

  const realmIndex = runtime.realmLevel - skillDef.realm.minLevel
  const requiredProficiency = skillDef.realm.breakthroughProficiency[realmIndex] ?? 0
  const requiredInsight = skillDef.realm.insightThresholds[realmIndex] ?? 0
  const requiredSimilar = skillDef.realm.similarSkillRequired[realmIndex] ?? 0
  const similarCount = countSimilarSkills(skillId, state.player.learnedSkills)

  return `突破条件：熟练度 ${runtime.proficiency}/${requiredProficiency}，感悟 ${runtime.insight}/${requiredInsight}，相似功法 ${similarCount}/${requiredSimilar}`
}

function buildActiveSynergySummaries(state: GameStoreState, skillId: string): string[] {
  return getSynergySources(skillId)
    .flatMap((relation) => {
      const runtime = state.player.learnedSkills.find((entry) => entry.skillId === relation.sourceSkillId)
      const sourceSkill = getSkillById(relation.sourceSkillId)
      if (!runtime || !sourceSkill || runtime.proficiency < relation.requiredProficiency) {
        return []
      }
      return [
        `${sourceSkill.name}：伤害 x${relation.damageMultiplier.toFixed(2)}，收益 x${relation.battleGainMultiplier.toFixed(2)}`,
      ]
    })
}

function buildSkillDisplay(
  state: GameStoreState,
  skillId: string,
): SkillDisplay | undefined {
  const runtime = state.player.learnedSkills.find((entry) => entry.skillId === skillId)
  const skillDef = getSkillById(skillId)
  if (!runtime || !skillDef) {
    return undefined
  }

  const unlockedMoveNames = runtime.unlockedMoveIds.map((moveId) => {
    const moveInfo = getMoveById(moveId)
    return moveInfo?.move.name ?? moveId
  })
  const attributeBonusSummaries = buildAttributeBonusSummaries(
    calculateSkillAttributeBonuses(runtime, skillDef),
  )

  return {
    skillId: runtime.skillId,
    skillName: skillDef.name,
    proficiency: runtime.proficiency,
    maxProficiency: skillDef.maxProficiency,
    realmLevel: runtime.realmLevel,
    realmMaxLevel: skillDef.realm.maxLevel,
    insight: runtime.insight,
    unlockedMoveNames,
    attributeBonusSummaries,
    nextBreakthroughSummary: buildNextBreakthroughSummary(state, skillId),
    activeSynergySummaries: buildActiveSynergySummaries(state, skillId),
  }
}

function getResolvedFormation(state: GameStoreState): ReturnType<typeof createEmptyFormation> {
  return state.player.formation ?? inferFormationFromEquippedSkills(state.player.equippedSkillIds)
}

function buildFormationSlots(state: GameStoreState): FormationSlotDisplay[] {
  const formation = getResolvedFormation(state)
  const skillNameOf = (skillId: string | undefined): string | undefined => {
    if (!skillId) {
      return undefined
    }
    return getSkillById(skillId)?.name
  }

  return [
    {
      slotId: 'external_1',
      slotLabel: '外功槽一',
      skillId: formation.external[0],
      skillName: skillNameOf(formation.external[0]),
    },
    {
      slotId: 'external_2',
      slotLabel: '外功槽二',
      skillId: formation.external[1],
      skillName: skillNameOf(formation.external[1]),
    },
    {
      slotId: 'internal',
      slotLabel: '内功槽',
      skillId: formation.internal,
      skillName: skillNameOf(formation.internal),
    },
    {
      slotId: 'qinggong',
      slotLabel: '轻功槽',
      skillId: formation.qinggong,
      skillName: skillNameOf(formation.qinggong),
    },
    {
      slotId: 'hard',
      slotLabel: '硬功槽',
      skillId: formation.hard,
      skillName: skillNameOf(formation.hard),
    },
  ]
}

function buildFormationSkillOptions(state: GameStoreState): FormationSkillOptionDisplay[] {
  const formation = getResolvedFormation(state)
  const equippedIds = new Set(flattenFormation(formation))

  return state.player.learnedSkills.flatMap((runtime) => {
    const skillDef = getSkillById(runtime.skillId)
    if (!skillDef) {
      return []
    }
    const eligibility = canEquipSkill(runtime, skillDef, state.player.weaponType)
    const slot = getFormationSlot(skillDef.category)
    const slotLabel = slot === 'external' ? '外功槽' : `${slot}槽`

    return [
      {
        skillId: runtime.skillId,
        skillName: skillDef.name,
        slotLabel,
        isEquipped: equippedIds.has(runtime.skillId),
        canEquip: eligibility.canEquip,
        ...(eligibility.reason ? { reason: eligibility.reason } : {}),
      },
    ]
  })
}

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
    return buildSkillDisplay(get(), skillId)
  },

  getLearnedSkillDisplays: () => {
    return get().player.learnedSkills.flatMap((runtime) => {
      const display = buildSkillDisplay(get(), runtime.skillId)
      return display ? [display] : []
    })
  },

  getFormationSlots: () => {
    return buildFormationSlots(get())
  },

  getFormationSkillOptions: () => {
    return buildFormationSkillOptions(get())
  },

  equipSkill: (skillId) => {
    const id = typeof skillId === 'string' ? asSkillId(skillId) : skillId
    const { player } = get()
    const runtime = player.learnedSkills.find((entry) => entry.skillId === id)
    const skillDef = getSkillById(id)
    if (!runtime || !skillDef) {
      return
    }

    const nextFormation = equipSkillInFormation(
      getResolvedFormation(get()),
      runtime,
      skillDef,
      player.weaponType,
    )

    set({
      player: {
        ...player,
        formation: nextFormation,
        equippedSkillIds: flattenFormation(nextFormation).filter((entry) => {
          const equippedRuntime = player.learnedSkills.find((skill) => skill.skillId === entry)
          return equippedRuntime ? canUseMove(equippedRuntime, equippedRuntime.unlockedMoveIds[0] ?? '') : false
        }),
      },
    })
  },

  unequipSkill: (skillId) => {
    const id = typeof skillId === 'string' ? asSkillId(skillId) : skillId
    const { player } = get()
    const nextFormation = unequipSkillFromFormation(getResolvedFormation(get()), id)
    set({
      player: {
        ...player,
        formation: nextFormation,
        equippedSkillIds: flattenFormation(nextFormation),
      },
    })
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

    const inheritance = calculateInheritedProficiency(player.learnedSkills, skillDef)
    const runtime = grantSkill(id, skillDef, inheritance.initialProficiency)
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
