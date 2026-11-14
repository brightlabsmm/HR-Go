import { ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router"

import { isPlatformPortal } from "@/app/portal"
import { findActiveNavItem } from "@/portals/nav"

export function HeaderBreadcrumbs() {
  const { t } = useTranslation("common")
  const location = useLocation()
  const active = findActiveNavItem(location.pathname)
  const isAccount = location.pathname.startsWith("/account")
  const sectionLabel = active
    ? t(active.labelKey)
    : isAccount
      ? t("nav.account")
      : null
  const sectionTo = active?.to ?? "/account"
  const isSectionRoot =
    location.pathname === sectionTo || location.pathname === active?.matchPrefix

  return (
    <nav aria-label={t("breadcrumb.label")} className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-small-1">
        <li className="hidden shrink-0 sm:block">
          <Link
            to="/"
            className="rounded-sm text-muted-foreground transition-colors outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t(isPlatformPortal() ? "portal.platform" : "portal.organization")}
          </Link>
        </li>
        {sectionLabel ? (
          <>
            <li className="hidden shrink-0 text-icon sm:block" aria-hidden>
              <ChevronRightIcon className="size-4" />
            </li>
            <li className="min-w-0">
              {isSectionRoot ? (
                <span aria-current="page" className="block truncate font-semibold text-foreground">
                  {sectionLabel}
                </span>
              ) : (
                <Link
                  to={sectionTo}
                  className="block truncate rounded-sm font-semibold text-foreground transition-colors outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {sectionLabel}
                </Link>
              )}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  )
}
