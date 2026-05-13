import { create } from 'zustand'
import type { CharacterState } from '../types/character'

interface GameStoreState {
  player: CharacterState
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
  equippedSkillIds: ['skill_sword_010_qingmang'],
}

export const useGameStore = create<GameStoreState>(() => ({
  player: defaultPlayer,
}))
