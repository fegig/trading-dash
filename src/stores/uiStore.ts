import { create } from 'zustand'

type UiState = {
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}))
