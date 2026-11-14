import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/components/core/theme-provider"
import { Button } from "@/components/ui/button"

function resolveTheme(theme: "dark" | "light" | "system") {
  if (theme !== "system") {
    return theme
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeToggle() {
  const { t } = useTranslation("common")
  const { theme, setTheme } = useTheme()
  const shouldReduceMotion = useReducedMotion()
  const resolved = resolveTheme(theme)
  const Icon = resolved === "dark" ? MoonIcon : SunIcon

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative overflow-hidden text-muted-foreground hover:text-primary"
      aria-label={t("theme.toggle")}
      title={t(resolved === "dark" ? "theme.dark" : "theme.light")}
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={resolved}
          className="flex"
          initial={shouldReduceMotion ? false : { opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.18 }}
        >
          <Icon className="size-5" />
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
