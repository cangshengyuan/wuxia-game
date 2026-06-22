/**
 * @module combat/damage_calc
 * @layer engine
 * @description 伤害计算：根据攻击方属性与招式倍率计算最终伤害
 * @inputs attacker, defender, move, rng?
 * @outputs DamageResult
 * @depends types
 * @forbidden 禁止直接修改角色状态、禁止 import React、禁止访问 store
 */
import type { DamageResult } from '../../types/battle'
import type { CharacterState } from '../../types/character'
import type { SkillMove } from '../../types/skill'
import type { Rng } from '../util/rng'

export interface CalcDamageInput {
  attacker: CharacterState
  defender: CharacterState
  move: SkillMove
  damageMultiplier?: number
  rng?: Rng
}

export function calcDamage({
  attacker,
  defender,
  move,
  damageMultiplier = 1,
}: CalcDamageInput): DamageResult {
  const attackPower = attacker.attributes.armStrength * 2 + attacker.speed * 0.6
  const defenseReduction = defender.attributes.constitution * 0.7
  const amount = Math.max(
    1,
    Math.round((attackPower * move.powerRatio - defenseReduction) * damageMultiplier),
  )
  return { amount, isCritical: false }
}
