import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { PageHeader } from "@/components/common/page-header"
import { StatusBadge } from "@/components/common/status-badge"
import { useOrganizationQuery } from "@/shared/queries/organization.query"

interface OrganizationDetailHeaderProps {
  organizationId: string
  actions?: ReactNode
}

export function OrganizationDetailHeader({
  organizationId,
  actions,
}: OrganizationDetailHeaderProps) {
  const { t } = useTranslation("organizations")
  const { data: organization } = useOrganizationQuery(organizationId)

  return (
    <PageHeader
      backTo="/"
      backLabel={t("title")}
      title={organization?.displayName ?? t("detail.title")}
      actions={actions}
      meta={organization ? <StatusBadge status={organization.status} /> : null}
    />
  )
}
