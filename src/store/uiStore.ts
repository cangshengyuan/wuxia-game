/**
 * @module store/uiStore
 * @layer store
 * @description 纯 UI 状态容器：管理当前主页面切换
 * @inputs Page
 * @outputs useUiStore
 * @depends typescript, zustand
 * @forbidden 禁止 import React、禁止写入游戏业务状态
 */
import { create } from 'zustand'

export const sceneSubPages = ['status', 'skills', 'inventory', 'quests', 'shop', 'save'] as const

export type SceneSubPage = (typeof sceneSubPages)[number]
export type Page = 'home' | 'battle' | 'scene' | SceneSubPage

interface UiStoreState {
  currentPage: Page
  setPage: (page: Page) => void
}

export const useUiStore = create<UiStoreState>((set) => ({
  currentPage: 'scene',
  setPage: (page) => set({ currentPage: page }),
}))

export function isSceneSubPage(page: Page): page is SceneSubPage {
  return sceneSubPages.includes(page as SceneSubPage)
}
