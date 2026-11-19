import { create } from "zustand"
import { persist } from "zustand/middleware"

import { APP_CONFIG } from "@/app/config/app.config"

interface AuthState {
  accessToken: string | null
  setSession: (session: { accessToken: string }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setSession: ({ accessToken }) => set({ accessToken }),
      clearAuth: () => set({ accessToken: null }),
    }),
    { name: `hr-go-auth-${APP_CONFIG.portal}` }
  )
)
