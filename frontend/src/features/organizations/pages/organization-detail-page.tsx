import { useState } from "react"
import { ClockIcon, PencilIcon, Trash2Icon, UserPlusIcon, XCircleIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DetailActionButton } from "@/components/common/detail-action-button"
import { DetailList } from "@/components/common/detail-list"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { MotionStack } from "@/components/common/motion-stack"
import { NotFoundState } from "@/components/common/not-found-state"
import { ProfileSummaryCard } from "@/components/common/profile-summary-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { getCountryLabel } from "@/constants/countries"
import { OrganizationDetailHeader } from "@/features/organizations/components/organization-detail-header"
import { OrganizationStatusButtons } from "@/features/organizations/components/organization-status-buttons"
import { OrganizationSuspendDialog } from "@/features/organizations/components/organization-suspend-dialog"
import {
  getStatusDialogContent,
  isHighImpactOrganizationStatus,
} from "@/features/organizations/components/organization-status-menu"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useCancelOrganizationSuspendScheduleMutation,
  useDeleteOrganizationMutation,
  useOrganizationAdminAccountsQuery,
  useOrganizationQuery,
  useUpdateOrganizationStatusMutation,
} from "@/shared/queries/organization.query"
import { toast } from "@/shared/stores/toast.store"
import { formatDate, formatDateTime } from "@/util/format-date"
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
  const canUpdate = can("platform.organization.update")
  const canChangeStatus = can("platform.organization.status.update")
  const canDelete = can("platform.organization.delete")
  const statusMutation = useUpdateOrganizationStatusMutation()
  const cancelScheduleMutation = useCancelOrganizationSuspendScheduleMutation()
  const deleteMutation = useDeleteOrganizationMutation()
  const [statusTarget, setStatusTarget] = useState<OrganizationStatus | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
    { label: t("form.country"), value: getCountryLabel(organization?.country) },
    { label: t("form.address"), value: organization?.address },
  ]

  const statusDialogContent =
    statusTarget && organization
      ? getStatusDialogContent(organization.status, statusTarget, organization.displayName, t)
      : null

  return (
    <MotionStack className="flex flex-col gap-8 pb-2">
      <OrganizationDetailHeader
        organizationId={id}
        actions={
          <>
            {canUpdate ? (
              <DetailActionButton
                tone="primary"
                onClick={() => void navigate(`/organizations/${id}/create-admin`)}
              >
                <UserPlusIcon />
                {t("actions.create_admin", "Create Admin Account")}
              </DetailActionButton>
            ) : null}
            {canUpdate ? (
              <DetailActionButton
                onClick={() => void navigate(`/organizations/${id}/edit`)}
              >
                <PencilIcon />
                {tCommon("actions.edit")}
              </DetailActionButton>
            ) : null}
            {canChangeStatus && organization ? (
              <OrganizationStatusButtons
                organization={organization}
                onSelect={(status) => setStatusTarget(status)}
              />
            ) : null}
            {canChangeStatus && organization?.scheduledSuspendAt ? (
              <DetailActionButton
                tone="warning"
                disabled={cancelScheduleMutation.isPending}
                onClick={() => {
                  cancelScheduleMutation.mutate(id, {
                    onSuccess: () => {
                      toast.success(t("suspend_dialog.cancel_success", "Scheduled suspension cancelled successfully."))
                    },
                  })
                }}
              >
                <XCircleIcon />
                {t("suspend_dialog.cancel_schedule_button", "Cancel Schedule")}
              </DetailActionButton>
            ) : null}
            {canDelete && organization ? (
              <DetailActionButton
                tone="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2Icon />
                {tCommon("actions.delete")}
              </DetailActionButton>
            ) : null}
          </>
        }
      />
      {organization?.scheduledSuspendAt ? (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:text-amber-200">
          <div className="flex items-center gap-3">
            <ClockIcon className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-foreground">
                {t("suspend_dialog.scheduled_alert_title", "Suspension Scheduled")}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {t("suspend_dialog.scheduled_alert_desc", "This organization is scheduled to be suspended on {{date}}.", {
                  date: formatDateTime(organization.scheduledSuspendAt, i18n.language),
                })}
                {organization.suspendReason ? ` (${organization.suspendReason})` : ""}
              </p>
            </div>
          </div>
          {canChangeStatus ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={cancelScheduleMutation.isPending}
              onClick={() => {
                cancelScheduleMutation.mutate(id, {
                  onSuccess: () => {
                    toast.success(t("suspend_dialog.cancel_success", "Scheduled suspension cancelled successfully."))
                  },
                })
              }}
            >
              {t("suspend_dialog.cancel_schedule_button", "Cancel Schedule")}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="grid items-start gap-8 lg:grid-cols-[18.75rem_minmax(0,1fr)] lg:gap-12">
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
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-body-2 font-semibold text-foreground">
                    {t("create_admin.title", "Organization Administrators")}
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
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
                      <div
                        key={admin.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium break-words text-foreground">
                              {admin.fullName}
                            </span>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                              {admin.employeeCode}
                            </span>
                            <span className="text-xs font-semibold text-primary">
                              {admin.roleName || admin.roleCode}
                            </span>
                          </div>
                          {admin.email ? (
                            <p className="mt-0.5 text-xs break-all text-muted-foreground">
                              {admin.email}
                            </p>
                          ) : null}
                        </div>
                        <div className="sm:text-right">
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
      <OrganizationSuspendDialog
        open={statusTarget === "SUSPENDED"}
        organization={organization ?? null}
        isPending={statusMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null)
        }}
        onConfirm={(payload) => {
          if (!organization) return
          statusMutation.mutate(
            {
              id: organization.id,
              input: {
                status: "SUSPENDED",
                confirmation: true,
                immediate: payload.immediate,
                notifyFrom: payload.notifyFrom,
                notifyTo: payload.notifyTo,
                suspendAt: payload.suspendAt,
                reason: payload.reason,
              },
            },
            {
              onSuccess: () => {
                setStatusTarget(null)
                void organizationQuery.refetch()
              },
              onError: () => {
                setStatusTarget(null)
              },
            }
          )
        }}
      />
      <ConfirmDialog
        open={statusTarget !== null && statusTarget !== "SUSPENDED"}
        title={statusDialogContent?.title ?? ""}
        description={statusDialogContent?.description ?? ""}
        confirmLabel={statusDialogContent?.confirmLabel ?? t("status_change.confirm")}
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
              onSuccess: () => {
                setStatusTarget(null)
                void organizationQuery.refetch()
              },
              onError: () => {
                setStatusTarget(null)
              },
            }
          )
        }}
      />
      <ConfirmDialog
        open={showDeleteDialog}
        title={t("delete.title", { name })}
        description={t("delete.description", { name })}
        confirmLabel={t("delete.confirm")}
        confirmVariant="destructive"
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false)
          }
        }}
        onConfirm={() => {
          if (!organization) {
            return
          }

          deleteMutation.mutate(organization.id, {
            onSuccess: () => {
              setShowDeleteDialog(false)
              toast.success(t("delete.success"))
              void navigate("/")
            },
            onError: () => {
              setShowDeleteDialog(false)
            },
          })
        }}
      />
    </MotionStack>
  )
}
