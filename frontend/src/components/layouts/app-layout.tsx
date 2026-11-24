import { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { TriangleAlertIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Navigate, Outlet, useLocation } from "react-router"

import { NoPermissionCard } from "@/components/common/no-permission-card"
import { Header } from "@/components/core/header"
import { Sidebar } from "@/components/core/sidebar"
import {
  canAccessNavItem,
  findActiveNavItem,
  visiblePortalNav,
} from "@/portals/nav"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"
import { useScrollToTop } from "@/shared/hooks/use-scroll-to-top"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useAuthStore } from "@/shared/stores/auth.store"
import { formatDateTime } from "@/util/format-date"

export function AppLayout() {
  const { t, i18n } = useTranslation("common")
  const location = useLocation()
  const { fadeIn, pageTransition } = useMotionVariants()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  useScrollToTop(mainRef)
  const accessToken = useAuthStore((state) => state.accessToken)
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword)
  const { can, user, isPending } = usePermissions()

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (mustChangePassword || user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  const activeItem = findActiveNavItem(location.pathname)
  const allowedItems = visiblePortalNav(can, Boolean(user))
  const fallbackItem = allowedItems[0]
  const isModuleBlocked =
    !isPending &&
    Boolean(user) &&
    activeItem !== undefined &&
    !canAccessNavItem(activeItem, can, true)

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <AnimatePresence>
        {isSidebarOpen ? (
          <motion.button
            key="sidebar-backdrop"
            type="button"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
            aria-label={t("header.close_menu")}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeIn}
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}
      </AnimatePresence>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
        {user?.suspensionNotice ? (
          <div
            role="alert"
            className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 md:px-12"
          >
            <TriangleAlertIcon className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <span className="font-semibold">
                {t("suspension_warning.title", "Important Notice: Organization Suspension Scheduled")}
              </span>
              <span className="ml-1 opacity-90">
                — {t("suspension_warning.message", "Scheduled for suspension on {{date}}.", {
                  date: formatDateTime(user.suspensionNotice.scheduledSuspendAt, i18n.language),
                })}
                {user.suspensionNotice.reason ? ` ${t("suspension_warning.reason_prefix", "Reason:")} ${user.suspensionNotice.reason}` : ""}
              </span>
            </div>
          </div>
        ) : null}
        <main
          ref={mainRef}
          className="min-h-0 flex-1 overflow-auto px-4 py-10 pb-14 md:px-12"
        >
          <div className="w-full md:h-full">
            <motion.div
              key={location.pathname}
              className="md:h-full"
              initial="hidden"
              animate="visible"
              variants={pageTransition}
            >
              {isModuleBlocked ? (
                <NoPermissionCard
                  backTo={fallbackItem?.to ?? "/account"}
                  backLabel={
                    fallbackItem ? t(fallbackItem.labelKey) : t("nav.account")
                  }
                />
              ) : (
                <Outlet />
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
