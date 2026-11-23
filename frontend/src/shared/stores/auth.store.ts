import { create } from "zustand"
import { persist } from "zustand/middleware"

import { APP_CONFIG } from "@/app/config/app.config"

interface AuthState {
  accessToken: string | null
  mustChangePassword: boolean
  setSession: (session: { accessToken: string; mustChangePassword?: boolean }) => void
  setMustChangePassword: (mustChange: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      mustChangePassword: false,
      setSession: ({ accessToken, mustChangePassword = false }) =>
        set({ accessToken, mustChangePassword }),
      setMustChangePassword: (mustChangePassword) => set({ mustChangePassword }),
      clearAuth: () => set({ accessToken: null, mustChangePassword: false }),
    }),
    { name: `hr-go-auth-${APP_CONFIG.portal}` }
  )
)
