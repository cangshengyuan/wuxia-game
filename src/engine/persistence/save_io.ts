/**
 * @module engine/persistence/save_io
 * @layer engine
 * @description 存档读写 localStorage
 * @inputs SaveV1
 * @outputs SaveV1 | null
 * @depends engine/persistence/save_schema
 * @forbidden 禁止 import React、禁止访问 store、禁止访问 ui
 */
import { migrateSave, SAVE_VERSION, type SaveV1 } from './save_schema'

export const STORAGE_KEY = 'wuxia-game-save'

export function saveToStorage(save: SaveV1): void {
  if (save.version !== SAVE_VERSION) {
    throw new Error(`Unsupported save version: ${String(save.version)}`)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
}

export function loadFromStorage(): SaveV1 | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return migrateSave(parsed)
  } catch {
    return null
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}
