import { motion } from "framer-motion"
import { GitBranchIcon, HistoryIcon, ShieldCheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Navigate, Outlet, useLocation } from "react-router"

import { isPlatformPortal } from "@/app/portal"
import { Logo } from "@/assets/icons/logo"
import { LanguageSwitcher } from "@/components/core/language-switcher"
import { useMotionVariants } from "@/shared/hooks/use-motion-variants"
import { useCurrentPatchVersionQuery } from "@/shared/queries/patch-version.query"
import { useAuthStore } from "@/shared/stores/auth.store"

const FEATURES = [
  { icon: GitBranchIcon, key: "brand.feature_structure" },
  { icon: ShieldCheckIcon, key: "brand.feature_access" },
  { icon: HistoryIcon, key: "brand.feature_audit" },
] as const

function BrandPanel() {
  const { t } = useTranslation("common")
  const { staggerContainer, staggerItem } = useMotionVariants()
  const isPlatform = isPlatformPortal()
  const { data: patchVersion } = useCurrentPatchVersionQuery()

  return (
    <aside className="relative hidden overflow-hidden bg-secondary text-secondary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
      <span
        className="pointer-events-none absolute -right-[180px] -bottom-[180px] size-[520px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--primary)_70%,transparent),transparent)]"
        aria-hidden
      />

      <Logo className="relative z-1 h-10 w-auto self-start text-white" />

      <motion.div
        className="relative z-1 flex max-w-[420px] flex-col"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.span
          variants={staggerItem}
          className="text-small-2 font-medium tracking-[0.06em] text-white/70 uppercase"
        >
          {t(isPlatform ? "portal.platform" : "portal.organization")}
        </motion.span>
        <motion.h2
          variants={staggerItem}
          className="mt-4 mb-9 text-title-1 leading-tight font-semibold tracking-[-0.01em]"
        >
          {t(isPlatform ? "brand.headline_platform" : "brand.headline_organization")}
        </motion.h2>
        <ul className="flex flex-col gap-[18px]">
          {FEATURES.map(({ icon: Icon, key }) => (
            <motion.li key={key} variants={staggerItem} className="flex items-center gap-3.5">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10"
                aria-hidden
              >
                <Icon className="size-[18px]" />
              </span>
              <span className="text-[15px] text-white/90">{t(key)}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <div className="relative z-1 flex items-center justify-between gap-6 text-small-2 text-white/60">
        <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
        {patchVersion?.patchVersion ? (
          <p aria-label={t("footer.patch_version", { version: patchVersion.patchVersion })}>
            {patchVersion.patchVersion}
          </p>
        ) : null}
      </div>
    </aside>
  )
}

export function AuthLayout() {
  const location = useLocation()
  const accessToken = useAuthStore((state) => state.accessToken)
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword)

  if (accessToken && location.pathname === "/login") {
    return <Navigate to={mustChangePassword ? "/change-password" : "/"} replace />
  }

  if (location.pathname === "/change-password") {
    if (!accessToken) {
      return <Navigate to="/login" replace />
    }
    if (!mustChangePassword) {
      return <Navigate to="/" replace />
    }
  }

  return (
    <div className="grid min-h-svh w-full bg-surface lg:h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:overflow-hidden">
      <BrandPanel />
      <div className="flex min-h-svh flex-col px-6 py-7 lg:h-svh lg:min-h-0 lg:overflow-y-auto lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Logo className="h-9 w-auto lg:invisible" />
          <LanguageSwitcher appearance="plain" />
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
