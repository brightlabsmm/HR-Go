import { useState } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router"

import { notifyApiError } from "@/app/api/feedback"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DetailActionButton } from "@/components/common/detail-action-button"
import { DetailList } from "@/components/common/detail-list"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { MotionStack } from "@/components/common/motion-stack"
import { NotFoundState } from "@/components/common/not-found-state"
import { PageHeader } from "@/components/common/page-header"
import { ProfileSummaryCard } from "@/components/common/profile-summary-card"
import { RelatedRecordsSection } from "@/components/common/related-records-section"
import { StatusBadge } from "@/components/common/status-badge"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useDepartmentsQuery } from "@/shared/queries/department.query"
import { useEmployeesQuery } from "@/shared/queries/employee.query"
import {
  useDeactivatePositionMutation,
  usePositionQuery,
} from "@/shared/queries/position.query"
import { toast } from "@/shared/stores/toast.store"
import { formatDateTime } from "@/util/format-date"
import { getInitials } from "@/util/initials"

function PositionEmployeesSection({ positionId }: { positionId: string }) {
  const { t } = useTranslation("positions")
  const employeesQuery = useEmployeesQuery({ positionId, limit: 100 })
  const items = employeesQuery.data?.items ?? []

  return (
    <RelatedRecordsSection
      title={t("sections.employees")}
      count={employeesQuery.data?.meta.totalItems}
      isLoading={employeesQuery.isPending}
      emptyText={t("sections.empty_employees")}
      items={items}
      getRowKey={(e) => e.id}
      viewAllTo="/employees"
      viewAllLabel={t("sections.view_all")}
      columns={[
        {
          key: "code",
          header: t("columns.code"),
          className: "font-mono text-muted-foreground",
          render: (e) => e.employeeCode,
        },
        {
          key: "name",
          header: t("columns.name"),
          render: (e) => (
            <Link
              to={`/employees/${e.id}`}
              className="font-medium text-primary hover:underline"
            >
              {e.fullName}
            </Link>
          ),
        },
        {
          key: "branch",
          header: t("sections.branch"),
          className: "text-muted-foreground",
          render: (e) => e.branchName || "—",
        },
        {
          key: "status",
          header: t("columns.status"),
          render: (e) => <StatusBadge status={e.employmentStatus} />,
        },
      ]}
    />
  )
}

export function PositionDetailPage() {
  const { t, i18n } = useTranslation("positions")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const positionQuery = usePositionQuery(id)
  const position = positionQuery.data
  const departmentsQuery = useDepartmentsQuery({ limit: 100 })
  const { can } = usePermissions()
  const canUpdate = can("org.position.update")
  const canDeactivate = can("org.position.deactivate")
  const canReadEmployees = can("org.employee.read")
  const deactivateMutation = useDeactivatePositionMutation()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const departmentName =
    (departmentsQuery.data?.items ?? []).find(
      (d) => d.id === position?.departmentId
    )?.departmentName ?? (position?.departmentId ? position.departmentId : "—")

  if (!position && positionQuery.isFetched) {
    return (
      <NotFoundState
        backTo="/positions"
        backLabel={t("title")}
        description={t("not_found", "Position not found.")}
      />
    )
  }

  const name = position?.positionName ?? ""
  const identityItems = [
    { label: t("columns.code"), value: position?.positionCode, mono: true },
    { label: t("columns.name"), value: position?.positionName },
    {
      label: t("form.department", "Department"),
      value: position?.departmentId ? (
        <Link
          to={`/departments/${position.departmentId}`}
          className="text-primary hover:underline"
        >
          {departmentName}
        </Link>
      ) : (
        "—"
      ),
    },
    {
      label: tCommon("created_at", "Created"),
      value: position
        ? formatDateTime(position.createdAt, i18n.language)
        : null,
    },
    {
      label: tCommon("updated_at", "Updated"),
      value: position
        ? formatDateTime(position.updatedAt, i18n.language)
        : null,
    },
  ]

  const actions = (
    <>
      {canUpdate && position ? (
        <DetailActionButton
          onClick={() => void navigate(`/positions/${id}/edit`)}
        >
          <PencilIcon />
          {tCommon("actions.edit")}
        </DetailActionButton>
      ) : null}
      {canDeactivate && position && position.status === "ACTIVE" ? (
        <DetailActionButton
          tone="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2Icon />
          {tCommon("actions.delete")}
        </DetailActionButton>
      ) : null}
    </>
  )

  return (
    <MotionStack className="flex flex-col gap-8 pb-2">
      <PageHeader
        backTo="/positions"
        backLabel={t("title")}
        title={name || t("title")}
        description={position?.positionCode}
        actions={actions}
      />
      <div className="grid items-start gap-12 lg:grid-cols-[18.75rem_minmax(0,1fr)]">
        <ProfileSummaryCard
          isLoading={positionQuery.isPending}
          avatarSize="xl"
          title={name}
          subtitle={position?.positionCode}
          initials={getInitials(...name.split(" "))}
          badges={position ? <StatusBadge status={position.status} /> : null}
        />
        <div className="flex min-w-0 flex-col gap-8">
          {positionQuery.isPending ? (
            <FormSkeleton fields={4} columns={2} />
          ) : (
            <section className="border-t border-hair pt-6">
              <h2 className="mb-6 text-body-2 font-semibold text-foreground">
                {tCommon("sections.overview", "Overview")}
              </h2>
              <DetailList columns={2} items={identityItems} />
            </section>
          )}
          {position && canReadEmployees && (
            <PositionEmployeesSection positionId={position.id} />
          )}
        </div>
      </div>
      <ConfirmDialog
        open={showDeleteDialog}
        title={t("delete.title", { name })}
        description={t("delete.description", { name })}
        confirmLabel={t("delete.confirm")}
        confirmVariant="destructive"
        isPending={deactivateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setShowDeleteDialog(false)
        }}
        onConfirm={() => {
          if (!position) return
          deactivateMutation.mutate(position.id, {
            onSuccess: () => {
              setShowDeleteDialog(false)
              toast.success(t("delete.success"))
              void navigate("/positions")
            },
            onError: (err) => {
              setShowDeleteDialog(false)
              notifyApiError(err)
            },
          })
        }}
      />
    </MotionStack>
  )
}
