import { ShieldOffIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"

interface NoPermissionCardProps {
  backTo: string
  backLabel?: string
}

export function NoPermissionCard({ backTo, backLabel }: NoPermissionCardProps) {
  const { t } = useTranslation("common")
  const actionLabel = backLabel
    ? t("states.forbidden_action", { page: backLabel })
    : t("actions.back_home")

  return (
    <div className="flex h-full min-h-96 items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center rounded-[10px] border border-border bg-surface px-8 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <ShieldOffIcon className="size-5" aria-hidden />
        </span>
        <h2 className="mt-5 text-subtitle-2 font-semibold text-secondary">
          {t("states.forbidden_title")}
        </h2>
        <p className="mt-2 text-small-1 text-muted-foreground">
          {t("states.forbidden_description")}
        </p>
        <Link
          to={backTo}
          className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  )
}
