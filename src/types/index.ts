/**
 * @module types/index
 * @layer types
 * @description 类型契约统一 barrel 导出
 * @forbidden 禁止在 types 层 import engine/store/ui
 */

export type {
  BattleAction,
  AttackMissedEvent,
  BattleEndedEvent,
  BattleEvent,
  BattleResult,
  BattleSnapshot,
  CombatBuffSnapshot,
  BuffAppliedEvent,
  BuffExpiredEvent,
  CombatantSnapshot,
  DamageDealtEvent,
  DamageResult,
  ProficiencyGain,
  SkillExecutedEvent,
  SkillReadyEvent,
} from './battle'
export type {
  CharacterAttributes,
  CharacterState,
  SkillFormation,
  SkillRuntime,
} from './character'
export type {
  asEnemyId,
  asItemId,
  asMoveId,
  asNpcId,
  asQuestId,
  asSceneId,
  asSkillId,
} from './id'
export type {
  EnemyId,
  ItemId,
  MoveId,
  NpcId,
  QuestId,
  SceneId,
  SkillId,
} from './id'
export type { ItemDefinition } from './item'
export type { UnlockNotice } from './notice'
export type {
  AttributeGrowthEntry,
  ApplyBuffEffect,
  MoveEffect,
  SkillAttributeGrowth,
  SkillBuffDefinition,
  SkillBuffModifiers,
  SkillCategory,
  SkillDefinition,
  SkillGrowthCurve,
  SkillMove,
  SkillRealmDefinition,
  SkillTier,
  WeaponRequirement,
} from './skill'
export type {
  SkillInheritanceRelation,
  SkillRelation,
  SkillSimilarityRelation,
  SkillSynergyRelation,
} from './skill_relation'
export type {
  DialogClosedEvent,
  BattleEndedWorldEvent,
  GameEvent,
  SceneEnteredEvent,
} from './event'
export type {
  ActiveQuest,
  EncounterEntry,
  EnemyDefinition,
  NpcDefinition,
  QuestDefinition,
  QuestObjective,
  QuestObjectiveType,
  QuestRewards,
  SceneDefinition,
} from './world'
