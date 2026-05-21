/**
 * @module engine/util/rng
 * @layer engine
 * @description 可种子化的伪随机数生成器（战斗与遭遇测试用）
 * @inputs seed
 * @outputs Rng.next() in [0, 1)
 * @depends none
 * @forbidden 禁止 import React、禁止访问 store
 */
export interface Rng {
  next(): number
}

export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0
  return {
    next(): number {
      state = (state * 1_664_525 + 1_013_904_223) >>> 0
      return state / 0x1_0000_0000
    },
  }
}
