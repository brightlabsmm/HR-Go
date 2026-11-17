import { cn } from "cn"
import { motion, useReducedMotion } from "framer-motion"
import {
  Building2Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  ShieldCheckIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, NavLink, useLocation } from "react-router"

import { isPlatformPortal } from "@/app/portal"
import { Logo } from "@/assets/icons/logo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isNavItemActive, visiblePortalNav } from "@/portals/nav"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useCurrentUserQuery } from "@/shared/queries/auth.query"
import { useUiStore } from "@/shared/stores/ui.store"

import type { PortalNavItem } from "@/portals/types"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavGroup {
  key: string
  items: PortalNavItem[]
}

interface SidebarNavIconProps {
  icon: LucideIcon
  isCurrent: boolean
}

function groupNavItems(items: PortalNavItem[]) {
  const groups: NavGroup[] = []

  for (const item of items) {
    const last = groups.at(-1)
    if (last && last.key === item.groupKey) {
      last.items.push(item)
    } else {
      groups.push({ key: item.groupKey, items: [item] })
    }
  }

  return groups
}

function SidebarNavIcon({ icon: Icon, isCurrent }: SidebarNavIconProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.span
      key={isCurrent ? "selected" : "idle"}
      className="relative flex items-center justify-center"
      initial={
        isCurrent && !shouldReduceMotion ? { scale: 0.55, rotate: -18 } : false
      }
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 520, damping: 16 }}
    >
      <Icon
        className={cn(
          "size-4.5 shrink-0",
          isCurrent ? "text-primary-foreground" : "text-icon group-hover:text-primary"
        )}
        aria-hidden
      />
    </motion.span>
  )
}

function SidebarWorkspaceCard({ isCollapsed }: { isCollapsed: boolean }) {
  const { t } = useTranslation("common")
  const { data: user, isPending } = useCurrentUserQuery()
  const isPlatform = isPlatformPortal()
  const Icon = isPlatform ? ShieldCheckIcon : Building2Icon

  if (isPending) {
    return (
      <div
        className={cn(
          "flex items-center pt-4",
          isCollapsed ? "justify-center px-0 md:pt-3" : "gap-3 px-2"
        )}
      >
        <Skeleton className="size-9 rounded-lg" />
        <div className={cn("flex flex-1 flex-col gap-1.5", isCollapsed && "md:hidden")}>
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    )
  }

  const title = isPlatform
    ? t("sidebar.platform_admin")
    : (user?.fullName ?? t("app_name"))
  const subtitle = isPlatform
    ? t("portal.platform")
    : user?.organizationName

  return (
    <div
      className={cn(
        "flex items-center pt-4",
        isCollapsed ? "justify-center px-0 md:pt-3" : "gap-3 px-2"
      )}
      title={isCollapsed ? title : undefined}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
        aria-hidden
      >
        <Icon className="size-4.5" />
      </span>
      <div className={cn("flex min-w-0 flex-col", isCollapsed && "md:hidden")}>
        <span className="truncate text-small-1 font-semibold text-foreground">
          {title}
        </span>
        {subtitle ? (
          <span className="truncate text-small-2 text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
    </div>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation("common")
  const location = useLocation()
  const { can, user } = usePermissions()
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed)
  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed)
  const items = visiblePortalNav(can, Boolean(user))
  const groups = groupNavItems(items)

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar pt-5 pb-4 text-sidebar-foreground transition-[width,padding,transform] duration-200 ease-out md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "px-4 md:w-[4.5rem] md:px-2" : "px-4 md:w-64"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1",
          isCollapsed ? "justify-between px-2 md:flex-col md:gap-2 md:px-0" : "justify-between px-2"
        )}
      >
        <Link
          to="/"
          className={cn(
            "flex min-w-0 items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            isCollapsed && "md:justify-center"
          )}
          onClick={onClose}
          aria-label={t("app_name")}
        >
          <span
            className={cn(
              "flex h-8 items-center overflow-hidden",
              isCollapsed ? "w-auto md:w-8" : "w-auto"
            )}
          >
            <Logo className="h-8 w-auto max-w-none shrink-0" />
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground md:hidden"
          aria-label={t("header.close_menu")}
          onClick={onClose}
        >
          <XIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
          aria-label={t(isCollapsed ? "sidebar.expand" : "sidebar.collapse")}
          onClick={toggleSidebarCollapsed}
        >
          {isCollapsed ? (
            <PanelLeftOpenIcon className="size-4.5" />
          ) : (
            <PanelLeftCloseIcon className="size-4.5" />
          )}
        </Button>
      </div>

      <nav
        aria-label={t("sidebar.navigation")}
        className={cn(
          "mt-7 flex min-h-0 flex-1 flex-col overflow-y-auto",
          isCollapsed ? "gap-6 md:gap-2" : "gap-6"
        )}
      >
        {groups.map((group) => (
          <div key={group.key} className="flex flex-col">
            <p
              className={cn(
                "px-3 pb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/85 uppercase",
                isCollapsed && "md:hidden"
              )}
            >
              {t(group.key)}
            </p>
            {group.items.map((item) => {
              const isCurrent = isNavItemActive(item, location.pathname)
              const label = t(item.labelKey)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  title={label}
                  aria-label={label}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "group relative flex h-10 items-center rounded-lg text-small-1 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    isCollapsed
                      ? "gap-3 px-3 md:mx-auto md:w-10 md:justify-center md:gap-0 md:px-0"
                      : "gap-3 px-3",
                    isCurrent
                      ? "font-semibold text-primary-foreground"
                      : "text-muted-foreground hover:bg-surface/70 hover:text-foreground"
                  )}
                >
                  {isCurrent ? (
                    <motion.span
                      layoutId="sidebar-active-item"
                      className="absolute inset-0 rounded-lg bg-primary"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      aria-hidden
                    />
                  ) : null}
                  <SidebarNavIcon icon={item.icon} isCurrent={isCurrent} />
                  <span className={cn("relative truncate", isCollapsed && "md:sr-only")}>
                    {label}
                  </span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="mt-2 shrink-0 border-t border-border">
        <SidebarWorkspaceCard isCollapsed={isCollapsed} />
      </div>
    </aside>
  )
}
