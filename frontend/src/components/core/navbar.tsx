import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { LanguageSwitcher } from "@/components/core/language-switcher"

export function Navbar() {
  const { t } = useTranslation("common")

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="font-medium text-foreground">
          {t("app_name")}
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            {t("nav.home")}
          </Link>
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("nav.login")}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}
