import { FileQuestionIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"

export function NotFoundPage() {
  const { t } = useTranslation("common")

  return (
    <div className="flex h-full min-h-96 items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center rounded-[10px] border border-border bg-surface px-8 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <FileQuestionIcon className="size-5" aria-hidden />
        </span>
        <p className="mt-5 text-title-1 font-semibold tracking-tight text-primary">
          {t("states.page_not_found_code")}
        </p>
        <h1 className="mt-2 text-subtitle-2 font-semibold text-secondary">
          {t("states.page_not_found_title")}
        </h1>
        <p className="mt-2 text-small-1 text-muted-foreground">
          {t("states.page_not_found_description")}
        </p>
        <Link to="/" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
          {t("actions.back_home")}
        </Link>
      </div>
    </div>
  )
}
