import { useTranslation } from "react-i18next"

import { NotFoundState } from "@/components/common/not-found-state"

export function NotFoundPage() {
  const { t } = useTranslation("common")

  return <NotFoundState backTo="/" backLabel={t("actions.back_home")} />
}
