import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Navigate, Outlet, useLocation } from "react-router"

import { Header } from "@/components/core/header"
import { Sidebar } from "@/components/core/sidebar"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"
import { useAuthStore } from "@/shared/stores/auth.store"

export function AppLayout() {
  const { t } = useTranslation("common")
  const location = useLocation()
  const { fadeIn, pageTransition } = useMotionVariants()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const accessToken = useAuthStore((state) => state.accessToken)

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

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
        <main className="min-h-0 flex-1 overflow-auto px-4 py-10 pb-14 md:px-12">
          <div className="h-full w-full">
            <motion.div
              key={location.pathname}
              className="h-full"
              initial="hidden"
              animate="visible"
              variants={pageTransition}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
