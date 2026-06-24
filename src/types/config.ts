/**
 * @module types/config
 * @layer types
 * @description 游戏配置、默认开局与平衡参数类型契约
 * @forbidden 禁止在 types 层 import engine/store/ui
 */
import type { CharacterState } from './character'
import type { EnemyId, SceneId } from './id'

export interface FormationBalanceConfig {
  highTierMinRealm: number
  maxExternalSkills: number
}

export interface GameBalanceConfig {
  formation: FormationBalanceConfig
}

export interface GameBootstrapConfig {
  startSceneId: SceneId
  defaultBattleEnemyId: EnemyId
  player: CharacterState
}

export interface GameConfigDefinition {
  bootstrap: GameBootstrapConfig
  balance: GameBalanceConfig
}
