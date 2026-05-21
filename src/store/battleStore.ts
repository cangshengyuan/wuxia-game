import { create } from 'zustand'
import { createInitialBattleState, simulateOneTurn } from '../engine/battleEngine'
import { buildEnemyState } from '../engine/world/enemyEngine'
import type { BattleSnapshot } from '../types/battle'
import type { CharacterState } from '../types/character'
import { defaultPlayer } from './gameStore'

interface BattleStoreState {
  enemy: CharacterState
  snapshot: BattleSnapshot
  runOneTurn: (player: CharacterState) => void
}

const initialEnemy =
  buildEnemyState('enemy_001_bandit_grunt') ?? {
    id: 'enemy_001_bandit_grunt',
    name: '山贼喽啰',
    level: 1,
    hp: 96,
    maxHp: 96,
    qi: 30,
    maxQi: 30,
    attributes: {
      armStrength: 10,
      agility: 9,
      constitution: 10,
    },
    learnedSkills: [],
    speed: 9,
    equippedSkillIds: [],
  }

export const useBattleStore = create<BattleStoreState>((set) => ({
  enemy: initialEnemy,
  snapshot: createInitialBattleState(defaultPlayer, initialEnemy),
  runOneTurn: (player) =>
    set((state) => ({
      snapshot: simulateOneTurn(state.snapshot, player, state.enemy),
    })),
}))
