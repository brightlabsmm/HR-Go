import { PencilIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"

import { DetailList } from "@/components/common/detail-list"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { MotionStack } from "@/components/common/motion-stack"
import { NotFoundState } from "@/components/common/not-found-state"
import { ProfileSummaryCard } from "@/components/common/profile-summary-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { OrganizationDetailHeader } from "@/features/organizations/components/organization-detail-header"
import { useOrganizationQuery } from "@/shared/queries/organization.query"
import { formatDate } from "@/util/format-date"
import { getInitials } from "@/util/initials"

export function OrganizationDetailPage() {
  const { t, i18n } = useTranslation("organizations")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const organizationQuery = useOrganizationQuery(id)
  const organization = organizationQuery.data

  if (!organization && organizationQuery.isFetched) {
    return <NotFoundState backTo="/" backLabel={t("title")} description={t("not_found")} />
  }

  const name = organization?.displayName ?? ""
  const identityItems = [
    { label: t("form.code"), value: organization?.organizationCode, mono: true },
    { label: t("form.legal_name"), value: organization?.legalName },
    { label: t("form.display_name"), value: organization?.displayName },
    { label: t("created_at"), value: organization ? formatDate(organization.createdAt, i18n.language) : null },
    { label: t("updated_at"), value: organization ? formatDate(organization.updatedAt, i18n.language) : null },
  ]
  const contactItems = [
    { label: t("form.email"), value: organization?.contactEmail },
    { label: t("form.phone"), value: organization?.contactPhone },
    { label: t("form.country"), value: organization?.country },
    { label: t("form.address"), value: organization?.address },
  ]

  return (
    <MotionStack className="flex flex-col gap-8 pb-2">
      <OrganizationDetailHeader
        organizationId={id}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate(`/organizations/${id}/edit`)}
          >
            <PencilIcon className="size-4" />
            {tCommon("actions.edit")}
          </Button>
        }
      />
      <div className="grid items-start gap-12 lg:grid-cols-[18.75rem_minmax(0,1fr)]">
        <ProfileSummaryCard
          isLoading={organizationQuery.isPending}
          avatarSize="xl"
          title={name}
          subtitle={organization?.organizationCode}
          initials={getInitials(...name.split(" "))}
          badges={organization ? <StatusBadge status={organization.status} /> : null}
        />
        <div className="flex min-w-0 flex-col gap-8">
          {organizationQuery.isPending ? (
            <FormSkeleton fields={4} columns={2} />
          ) : (
            <>
              <section className="border-t border-hair pt-6">
                <h2 className="mb-6 text-body-2 font-semibold text-foreground">
                  {t("sections.identity")}
                </h2>
                <DetailList columns={2} items={identityItems} />
              </section>
              <section className="border-t border-hair pt-6">
                <h2 className="mb-6 text-body-2 font-semibold text-foreground">
                  {t("sections.contact")}
                </h2>
                <DetailList columns={2} items={contactItems} />
              </section>
            </>
          )}
        </div>
      </div>
    </MotionStack>
  )
}
