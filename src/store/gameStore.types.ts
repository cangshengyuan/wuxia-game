/**
 * @module store/gameStore.types
 * @layer store
 * @description gameStore 共享类型与 StateCreator 切片签名
 * @inputs 无
 * @outputs 展示 DTO、PersistedGameState、GameStoreState、GameStoreSlice
 * @depends types
 * @forbidden 禁止 import engine 或 UI
 */
import type { StateCreator } from 'zustand'
import type { BattleResult } from '../types/battle'
import type { CharacterState } from '../types/character'
import type { GameEvent } from '../types/event'
import type { UnlockNotice } from '../types/notice'
import type { NpcId, QuestId, SceneId, SkillId } from '../types/id'
import type { ActiveQuest } from '../types/world'
import type { Rng } from '../engine/util/rng'

export interface SkillDisplay {
  skillId: SkillId
  skillName: string
  proficiency: number
  maxProficiency: number
  realmLevel: number
  realmMaxLevel: number
  insight: number
  unlockedMoveNames: string[]
  attributeBonusSummaries: string[]
  nextBreakthroughSummary: string
  activeSynergySummaries: string[]
}

export interface SceneDisplay {
  sceneId: SceneId
  name: string
  description: string
  canExplore: boolean
}

export interface NpcDisplay {
  id: string
  name: string
  description?: string
}

export interface SceneDestination {
  sceneId: SceneId
  name: string
}

export interface QuestDisplay {
  questId: QuestId
  questName: string
  stepDescription: string
}

export interface NpcDialogDisplay {
  npcId: NpcId
  npcName: string
  npcDescription: string
  message: string
  primaryActionLabel?: string
}

export interface FormationSlotDisplay {
  slotId: string
  slotLabel: string
  skillId?: SkillId
  skillName?: string
}

export interface FormationSkillOptionDisplay {
  skillId: SkillId
  skillName: string
  slotLabel: string
  isEquipped: boolean
  canEquip: boolean
  reason?: string
}

export interface PersistedGameState {
  player: CharacterState
  currentSceneId: SceneId
  completedQuests: QuestId[]
  activeQuests: ActiveQuest[]
}

export interface GameStoreState extends PersistedGameState {
  recentUnlocks: UnlockNotice[]
  rng: Rng
  applyBattleResult: (result: BattleResult) => void
  canUpgradeSkill: (skillId: SkillId | string) => boolean
  upgradeSkill: (skillId: SkillId | string) => void
  dismissUnlockNotice: (id: string) => void
  getSkillDisplay: (skillId: SkillId | string) => SkillDisplay | undefined
  getLearnedSkillDisplays: () => SkillDisplay[]
  getCurrentScene: () => SceneDisplay | undefined
  getSceneNpcs: () => NpcDisplay[]
  getSceneDestinations: () => SceneDestination[]
  getActiveQuestDisplays: () => QuestDisplay[]
  getNpcDialogDisplay: (npcId: NpcId | string) => NpcDialogDisplay | undefined
  getFormationSlots: () => FormationSlotDisplay[]
  getFormationSkillOptions: () => FormationSkillOptionDisplay[]
  equipSkill: (skillId: SkillId | string) => void
  unequipSkill: (skillId: SkillId | string) => void
  acceptQuest: (questId: QuestId | string) => void
  performNpcDialogAction: (npcId: NpcId | string) => void
  handleGameEvent: (event: GameEvent) => void
  completeQuest: (questId: QuestId | string) => void
  learnSkill: (skillId: SkillId | string) => void
  enterScene: (sceneId: SceneId | string) => void
  explore: () => void
  saveGame: () => void
  loadGame: () => void
  clearSave: () => void
}

export type GameStoreSlice<T extends Partial<GameStoreState>> = StateCreator<
  GameStoreState,
  [],
  [],
  T
>
