export interface BattleAction {
  actorId: string
  targetId: string
  skillId: string
  moveId: string
  damage: number
}

export interface BattleSnapshot {
  turn: number
  playerHp: number
  enemyHp: number
  lastAction?: BattleAction
}
