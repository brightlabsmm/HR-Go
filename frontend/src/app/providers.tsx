import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { queryClient } from "@/app/query-client"
import { Toaster } from "@/components/common/toaster"
import { ThemeProvider } from "@/components/core/theme-provider"

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
