import { useState } from "react"
import { PencilIcon, UserPlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DetailList } from "@/components/common/detail-list"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { MotionStack } from "@/components/common/motion-stack"
import { NotFoundState } from "@/components/common/not-found-state"
import { ProfileSummaryCard } from "@/components/common/profile-summary-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { OrganizationDetailHeader } from "@/features/organizations/components/organization-detail-header"
import { OrganizationStatusButtons } from "@/features/organizations/components/organization-status-buttons"
import { isHighImpactOrganizationStatus } from "@/features/organizations/components/organization-status-menu"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useOrganizationAdminAccountsQuery,
  useOrganizationQuery,
  useUpdateOrganizationStatusMutation,
} from "@/shared/queries/organization.query"
import { formatDate } from "@/util/format-date"
import { getInitials } from "@/util/initials"

import type { OrganizationStatus } from "@/shared/services/organization.service"

export function OrganizationDetailPage() {
  const { t, i18n } = useTranslation("organizations")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const organizationQuery = useOrganizationQuery(id)
  const organization = organizationQuery.data
  const adminAccountsQuery = useOrganizationAdminAccountsQuery(id)
  const adminAccounts = adminAccountsQuery.data ?? []
  const { can } = usePermissions()
  const canChangeStatus = can("platform.organization.status.update")
  const statusMutation = useUpdateOrganizationStatusMutation()
  const [statusTarget, setStatusTarget] = useState<OrganizationStatus | null>(null)

  if (!organization && organizationQuery.isFetched) {
    return <NotFoundState backTo="/" backLabel={t("title")} description={t("not_found")} />
  }

  const name = organization?.displayName ?? ""
  const statusLabel = statusTarget
    ? tCommon(`status.${statusTarget.toLowerCase()}`)
    : ""
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigate(`/organizations/${id}/create-admin`)}
            >
              <UserPlusIcon className="size-4" />
              {t("actions.create_admin", "Create Admin Account")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigate(`/organizations/${id}/edit`)}
            >
              <PencilIcon className="size-4" />
              {tCommon("actions.edit")}
            </Button>
            {canChangeStatus && organization ? (
              <OrganizationStatusButtons
                organization={organization}
                onSelect={(status) => setStatusTarget(status)}
              />
            ) : null}
          </div>
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
              <section className="border-t border-hair pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-body-2 font-semibold text-foreground">
                    {t("create_admin.title", "Organization Administrators")}
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void navigate(`/organizations/${id}/create-admin`)}
                  >
                    <UserPlusIcon className="size-4" />
                    {t("actions.create_admin", "Create Admin Account")}
                  </Button>
                </div>
                {adminAccountsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">{tCommon("loading", "Loading...")}</p>
                ) : adminAccounts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-hair p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t("create_admin.no_admins", "No administrator accounts created yet.")}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      className="mt-2"
                      onClick={() => void navigate(`/organizations/${id}/create-admin`)}
                    >
                      {t("actions.create_admin", "Create Admin Account")}
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-hair rounded-lg border border-hair">
                    {adminAccounts.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{admin.fullName}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                              {admin.employeeCode}
                            </span>
                            <span className="text-xs font-semibold text-primary">
                              {admin.roleName || admin.roleCode}
                            </span>
                          </div>
                          {admin.email ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">{admin.email}</p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <StatusBadge status={admin.status} />
                          {admin.lastLoginAt ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(admin.lastLoginAt, i18n.language)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={statusTarget !== null}
        title={t("status_change.title", { status: statusLabel })}
        description={t("status_change.description", {
          name: organization?.displayName ?? "",
          status: statusLabel,
        })}
        confirmLabel={t("status_change.confirm")}
        confirmVariant={
          statusTarget && isHighImpactOrganizationStatus(statusTarget)
            ? "destructive"
            : "default"
        }
        isPending={statusMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setStatusTarget(null)
          }
        }}
        onConfirm={() => {
          if (!statusTarget || !organization) {
            return
          }

          statusMutation.mutate(
            {
              id: organization.id,
              input: {
                status: statusTarget,
                confirmation: true,
              },
            },
            {
              onSuccess: () => setStatusTarget(null),
            }
          )
        }}
      />
    </MotionStack>
  )
}
