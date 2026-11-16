import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { PageHeader } from "@/components/common/page-header"
import { StatusBadge } from "@/components/common/status-badge"
import { useUserQuery } from "@/shared/queries/user.query"

interface UserDetailHeaderProps {
  userId: string
  backTo?: string
  backLabel?: string
  description?: ReactNode
  actions?: ReactNode
}

export function UserDetailHeader({
  userId,
  backTo = "/users",
  backLabel,
  description,
  actions,
}: UserDetailHeaderProps) {
  const { t } = useTranslation("users")
  const { data: user } = useUserQuery(userId)

  return (
    <PageHeader
      backTo={backTo}
      backLabel={backLabel ?? t("title")}
      title={user?.fullName ?? t("detail.title")}
      description={description}
      actions={actions}
      meta={user ? <StatusBadge status={user.status} /> : null}
    />
  )
}
