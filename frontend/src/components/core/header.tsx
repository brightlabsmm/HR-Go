import { BellIcon, MenuIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HeaderBreadcrumbs } from "@/components/core/header-breadcrumbs"
import { HeaderUserMenu } from "@/components/core/header-user-menu"
import { ThemeToggle } from "@/components/core/theme-toggle"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onOpenSidebar: () => void
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { t } = useTranslation("common")

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-hair bg-surface px-4 md:px-12">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-2 shrink-0 text-muted-foreground md:hidden"
          aria-label={t("header.open_menu")}
          onClick={onOpenSidebar}
        >
          <MenuIcon />
        </Button>
        <HeaderBreadcrumbs />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-primary"
          aria-label={t("header.notifications")}
        >
          <BellIcon className="size-5" />
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-destructive ring-2 ring-card" />
        </Button>
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
        <HeaderUserMenu />
      </div>
    </header>
  )
}
