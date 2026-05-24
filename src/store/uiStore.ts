import { create } from 'zustand'

export type Page = 'home' | 'battle' | 'scene'

interface UiStoreState {
  currentPage: Page
  setPage: (page: Page) => void
}

export const useUiStore = create<UiStoreState>((set) => ({
  currentPage: 'scene',
  setPage: (page) => set({ currentPage: page }),
}))
