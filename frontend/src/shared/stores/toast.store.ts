import { create } from "zustand"

export type ToastVariant = "success" | "error" | "warning" | "info"

export interface ToastInput {
  title: string
  variant?: ToastVariant
  durationMs?: number
}

export interface ToastItem {
  id: string
  title: string
  variant: ToastVariant
}

const DEFAULT_DURATION_MS = 5000
const timers = new Map<string, number>()

interface ToastState {
  toasts: ToastItem[]
  show: (input: ToastInput) => string
  dismiss: (id: string) => void
}

function createToastStore() {
  return create<ToastState>((set, get) => ({
    toasts: [],
    show: (input) => {
      const id = crypto.randomUUID()
      const nextToast: ToastItem = {
        id,
        title: input.title,
        variant: input.variant ?? "success",
      }

      set((state) => ({ toasts: [...state.toasts, nextToast] }))

      const durationMs = input.durationMs ?? DEFAULT_DURATION_MS
      if (durationMs > 0) {
        const timer = window.setTimeout(() => {
          get().dismiss(id)
        }, durationMs)
        timers.set(id, timer)
      }

      return id
    },
    dismiss: (id) => {
      const timer = timers.get(id)
      if (timer) {
        window.clearTimeout(timer)
        timers.delete(id)
      }

      set((state) => ({
        toasts: state.toasts.filter((item) => item.id !== id),
      }))
    },
  }))
}

const hotData = import.meta.hot?.data as { store?: ReturnType<typeof createToastStore> }
export const useToastStore = hotData?.store ?? createToastStore()

if (import.meta.hot) {
  import.meta.hot.data.store = useToastStore
}

export const toast = {
  show: (input: ToastInput) => useToastStore.getState().show(input),
  success: (title: string) =>
    useToastStore.getState().show({ title, variant: "success" }),
  error: (title: string) =>
    useToastStore.getState().show({ title, variant: "error" }),
  warning: (title: string) =>
    useToastStore.getState().show({ title, variant: "warning" }),
  info: (title: string) =>
    useToastStore.getState().show({ title, variant: "info" }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
}
