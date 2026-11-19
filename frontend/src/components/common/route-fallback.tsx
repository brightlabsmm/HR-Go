import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"

export function RouteFallback() {
  const { t } = useTranslation("common")

  return (
    <div
      className="flex min-h-64 flex-1 items-center justify-center"
      role="status"
      aria-label={t("states.loading")}
    >
      <Loader2Icon className="size-6 animate-spin text-muted-foreground motion-reduce:animate-none" />
    </div>
  )
}
