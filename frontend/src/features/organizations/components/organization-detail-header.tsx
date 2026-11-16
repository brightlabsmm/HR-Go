import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { PageHeader } from "@/components/common/page-header"
import { StatusBadge } from "@/components/common/status-badge"
import { useOrganizationQuery } from "@/shared/queries/organization.query"

interface OrganizationDetailHeaderProps {
  organizationId: string
  backTo?: string
  backLabel?: string
  description?: ReactNode
  actions?: ReactNode
}

export function OrganizationDetailHeader({
  organizationId,
  backTo = "/",
  backLabel,
  description,
  actions,
}: OrganizationDetailHeaderProps) {
  const { t } = useTranslation("organizations")
  const { data: organization } = useOrganizationQuery(organizationId)

  return (
    <PageHeader
      backTo={backTo}
      backLabel={backLabel ?? t("title")}
      title={organization?.displayName ?? t("detail.title")}
      description={description}
      actions={actions}
      meta={organization ? <StatusBadge status={organization.status} /> : null}
    />
  )
}
