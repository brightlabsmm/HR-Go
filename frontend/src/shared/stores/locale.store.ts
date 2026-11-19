import { create } from "zustand"
import { persist } from "zustand/middleware"

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  LOCALE_STORAGE_KEY,
  type SupportedLocale,
} from "@/constants/locales"

interface LocaleState {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: LOCALE_STORAGE_KEY,
      merge: (persistedState, currentState) => {
        const persisted =
          persistedState && typeof persistedState === "object"
            ? (persistedState as Partial<LocaleState>)
            : {}

        return {
          ...currentState,
          ...persisted,
          locale: isSupportedLocale(persisted.locale)
            ? persisted.locale
            : DEFAULT_LOCALE,
        }
      },
    }
  )
)
