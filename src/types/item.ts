/**
 * @module types/item
 * @layer types
 * @description 物品定义占位类型（M1 不实现数据）
 * @forbidden 禁止在 types 层 import engine/store/ui
 */

import type { ItemId } from './id'

export interface ItemDefinition {
  id: ItemId
  name: string
}
