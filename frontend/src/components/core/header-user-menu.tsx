import { ChevronDownIcon, LogOutIcon, UserRoundIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/constants/locales"
import { useCurrentUserQuery, useLogoutMutation } from "@/shared/queries/auth.query"
import { useAuthStore } from "@/shared/stores/auth.store"
import { useLocaleStore } from "@/shared/stores/locale.store"
import { getInitials } from "@/util/initials"

export function HeaderUserMenu() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const accessToken = useAuthStore((state) => state.accessToken)
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  const { data: user } = useCurrentUserQuery()
  const logoutMutation = useLogoutMutation()

  if (!accessToken) {
    return (
      <Link
        to="/login"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        {t("nav.login")}
      </Link>
    )
  }

  const displayName = user?.fullName ?? t("header.account")
  const contact = user?.email ?? user?.employeeCode

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-accent">
        <Avatar size="lg">
          <AvatarFallback className="bg-secondary text-small-2 font-semibold text-secondary-foreground">
            {user ? getInitials(...user.fullName.split(" ")) : "?"}
          </AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
          <span className="max-w-40 truncate text-small-1 font-semibold">
            {displayName}
          </span>
          {user?.email ? (
            <span className="max-w-40 truncate text-small-2 text-muted-foreground">
              {user.email}
            </span>
          ) : null}
        </span>
        <ChevronDownIcon
          className="size-4 text-muted-foreground transition-transform group-data-popup-open:rotate-180"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
            <span className="truncate text-small-1 font-semibold text-foreground">
              {displayName}
            </span>
            {contact ? (
              <span className="truncate text-small-2 font-normal text-muted-foreground">
                {contact}
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(value) => {
              if (value) {
                setLocale(value as SupportedLocale)
              }
            }}
          >
            {SUPPORTED_LOCALES.map((item) => (
              <DropdownMenuRadioItem key={item} value={item}>
                {t(`locale.${item}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void navigate("/account")
          }}
        >
          <UserRoundIcon />
          {t("nav.account")}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={logoutMutation.isPending}
          onClick={() => {
            logoutMutation.mutate(undefined, {
              onSettled: () => {
                navigate("/login")
              },
            })
          }}
        >
          <LogOutIcon />
          {t("header.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
