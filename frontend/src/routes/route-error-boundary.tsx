import { TriangleAlertIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { isRouteErrorResponse, useRouteError } from "react-router"

import { Button } from "@/components/ui/button"

export function RouteErrorBoundary() {
  const { t } = useTranslation("common")
  const error = useRouteError()
  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : t("errors.page_title")

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive-muted text-destructive">
        <TriangleAlertIcon className="size-7" aria-hidden />
      </span>
      <h1 className="text-title-2 font-semibold text-secondary">{title}</h1>
      <p className="max-w-md text-small-1 text-muted-foreground">
        {t("errors.page_description")}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          {t("errors.reload")}
        </Button>
        <Button type="button" onClick={() => window.location.assign("/")}>
          {t("actions.back_home")}
        </Button>
      </div>
    </div>
  )
}
