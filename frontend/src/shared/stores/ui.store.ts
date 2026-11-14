import { create } from "zustand"
import { persist } from "zustand/middleware"

const SIDEBAR_STORAGE_KEY = "hr-go-sidebar"

interface UiState {
  isSidebarCollapsed: boolean
  toggleSidebarCollapsed: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      toggleSidebarCollapsed: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    }),
    { name: SIDEBAR_STORAGE_KEY }
  )
)
