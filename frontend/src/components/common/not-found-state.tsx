import { ArrowLeftIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { PageEmptyState } from "@/components/common/page-empty-state"
import { buttonVariants } from "@/components/ui/button"

interface NotFoundStateProps {
  backTo: string
  backLabel?: string
  description?: string
}

export function NotFoundState({ backTo, backLabel, description }: NotFoundStateProps) {
  const { t } = useTranslation("common")

  return (
    <section className="flex h-full min-h-96 flex-col">
      <PageEmptyState
        variant="not-found"
        title={t("states.not_found_title")}
        description={description ?? t("states.not_found_description")}
        action={
          <Link to={backTo} className={buttonVariants({ variant: "outline" })}>
            <ArrowLeftIcon className="size-4" />
            {backLabel ?? t("actions.back")}
          </Link>
        }
      />
    </section>
  )
}
