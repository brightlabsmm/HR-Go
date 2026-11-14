import { ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { buttonVariants } from "@/components/ui/button"

interface RowLinkActionProps {
  to: string
  label?: string
}

export function RowLinkAction({ to, label }: RowLinkActionProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex justify-end">
      <Link
        to={to}
        aria-label={label ?? t("actions.view")}
        title={label ?? t("actions.view")}
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
      >
        <ChevronRightIcon />
      </Link>
    </div>
  )
}
