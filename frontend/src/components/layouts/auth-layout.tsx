import { useTranslation } from "react-i18next"
import { Navigate, Outlet, useLocation } from "react-router"

import { Logo } from "@/assets/icons/logo"
import changePasswordBanner from "@/assets/images/change-password.svg"
import loginBanner from "@/assets/images/login.svg"
import { LanguageSwitcher } from "@/components/core/language-switcher"
import { useAuthStore } from "@/shared/stores/auth.store"

interface BrandPanelProps {
  pathname: string
}

function resolveBanner(pathname: string) {
  if (pathname === "/change-password") {
    return {
      src: changePasswordBanner,
      altKey: "brand.banner_change_password",
    } as const
  }

  return {
    src: loginBanner,
    altKey: "brand.banner_login",
  } as const
}

function BrandPanel({ pathname }: BrandPanelProps) {
  const { t } = useTranslation("common")
  const banner = resolveBanner(pathname)

  return (
    <aside className="relative hidden h-svh shrink-0 overflow-hidden rounded-none bg-auth-banner lg:block">
      <img
        src={banner.src}
        alt={t(banner.altKey)}
        width={585}
        height={860}
        draggable={false}
        className="block h-full w-auto max-w-none"
      />
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
    <div className="grid min-h-svh w-full bg-surface lg:h-svh lg:grid-cols-[auto_minmax(0,1fr)] lg:overflow-hidden">
      <BrandPanel pathname={location.pathname} />
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
