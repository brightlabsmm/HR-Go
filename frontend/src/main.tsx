import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@fontsource-variable/dm-sans"
import "@fontsource/noto-sans-myanmar/400.css"
import "@fontsource/noto-sans-myanmar/500.css"
import "@fontsource/noto-sans-myanmar/600.css"
import "@/app/i18n"
import "@/styles/globals.css"

import { App } from "@/app/app"
import { APP_CONFIG } from "@/app/config/app.config"
import { AppProviders } from "@/app/providers"

document.title = APP_CONFIG.name

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
)
