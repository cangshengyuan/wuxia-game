/**
 * @module store/gameStore.defaults
 * @layer store
 * @description 游戏默认状态常量，供 store 切片与 battleStore 共享
 * @inputs 无
 * @outputs defaultPlayer, defaultSceneId
 * @depends engine/config, types
 * @forbidden 禁止 import 其他 store 模块（避免循环依赖）
 */
import { createDefaultPlayerState, getDefaultSceneId } from '../engine/config/gameConfig'
import type { CharacterState } from '../types/character'

export const defaultSceneId = getDefaultSceneId()

export const defaultPlayer: CharacterState = createDefaultPlayerState()
