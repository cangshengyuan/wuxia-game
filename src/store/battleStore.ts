import { create } from 'zustand'
import { startBattle as runCombat } from '../engine/combat/combat_runner'
import { formatBattleEvent } from '../engine/combat/event_format'
import {
  applyEventToSnapshots,
  createSnapshotsFromCombatants,
} from '../engine/combat/playback'
import { gameEventBus } from '../engine/game_event_bus'
import { buildEnemyState } from '../engine/world/enemyEngine'
import { asEnemyId } from '../types/id'
import type { BattleEvent, BattleResult, CombatantSnapshot } from '../types/battle'
import type { CharacterState } from '../types/character'
import { defaultPlayer } from './gameStore.defaults'
import { useGameStore } from './gameStore'

export type BattleStatus = 'idle' | 'running' | 'finished'

interface BattleStoreState {
  status: BattleStatus
  events: BattleEvent[]
  playbackIndex: number
  enemy: CharacterState
  playerSnapshot: CombatantSnapshot
  enemySnapshot: CombatantSnapshot
  result?: BattleResult
  pendingResult?: BattleResult
  prepareBattle: (enemyId: string) => void
  startBattle: () => void
  tickPlayback: () => void
  endBattle: () => void
  reset: () => void
  formatEvent: (event: BattleEvent) => string
}

const fallbackEnemy: CharacterState = {
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

const defaultEnemy = buildEnemyState('enemy_001_bandit_grunt') ?? fallbackEnemy
const initialSnapshots = createSnapshotsFromCombatants(defaultPlayer, defaultEnemy)

export const useBattleStore = create<BattleStoreState>((set, get) => ({
  status: 'idle',
  events: [],
  playbackIndex: -1,
  enemy: defaultEnemy,
  playerSnapshot: initialSnapshots.player,
  enemySnapshot: initialSnapshots.enemy,
  result: undefined,
  pendingResult: undefined,

  prepareBattle: (enemyId) => {
    const player = useGameStore.getState().player
    const enemy = buildEnemyState(enemyId) ?? fallbackEnemy
    const snapshots = createSnapshotsFromCombatants(player, enemy)

    set({
      status: 'idle',
      events: [],
      playbackIndex: -1,
      enemy,
      playerSnapshot: snapshots.player,
      enemySnapshot: snapshots.enemy,
      result: undefined,
      pendingResult: undefined,
    })
  },

  startBattle: () => {
    const { enemy } = get()
    const player = useGameStore.getState().player
    const battleResult = runCombat({ player, enemy })

    set({
      status: 'running',
      events: battleResult.events,
      playbackIndex: -1,
      result: undefined,
      pendingResult: battleResult,
    })
  },

  tickPlayback: () => {
    const state = get()
    if (state.status !== 'running' || state.events.length === 0) {
      return
    }

    const nextIndex = state.playbackIndex + 1
    if (nextIndex >= state.events.length) {
      return
    }

    const event = state.events[nextIndex]
    const player = useGameStore.getState().player
    const snapshots = applyEventToSnapshots(
      event,
      player.id,
      state.enemy.id,
      state.playerSnapshot,
      state.enemySnapshot,
    )

    set({
      playbackIndex: nextIndex,
      playerSnapshot: snapshots.player,
      enemySnapshot: snapshots.enemy,
    })

    if (event.type === 'BattleEnded') {
      get().endBattle()
    }
  },

  endBattle: () => {
    const { pendingResult, playerSnapshot, enemySnapshot, enemy } = get()

    if (!pendingResult) {
      return
    }

    const result: BattleResult = {
      ...pendingResult,
      finalPlayerHp: playerSnapshot.hp,
      finalPlayerQi: pendingResult.finalPlayerQi,
      finalEnemyHp: enemySnapshot.hp,
      finalEnemyQi: pendingResult.finalEnemyQi,
    }

    set({
      status: 'finished',
      result,
    })

    gameEventBus.emit({
      type: 'BattleEnded',
      winnerId: result.winnerId,
      enemyId: asEnemyId(enemy.id),
    })
    useGameStore.getState().applyBattleResult(result)
  },

  reset: () => {
    get().prepareBattle(get().enemy.id)
  },

  formatEvent: (event) => formatBattleEvent(event),
}))
