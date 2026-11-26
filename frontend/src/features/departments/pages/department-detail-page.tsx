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
import { useBranchesQuery } from "@/shared/queries/branch.query"
import {
  useDeactivateDepartmentMutation,
  useDepartmentQuery,
} from "@/shared/queries/department.query"
import { useEmployeesQuery } from "@/shared/queries/employee.query"
import { usePositionsQuery } from "@/shared/queries/position.query"
import { toast } from "@/shared/stores/toast.store"
import { formatDateTime } from "@/util/format-date"
import { getInitials } from "@/util/initials"

function DepartmentPositionsSection({
  departmentId,
}: {
  departmentId: string
}) {
  const { t } = useTranslation("departments")
  const positionsQuery = usePositionsQuery({ departmentId, limit: 100 })
  const items = positionsQuery.data?.items ?? []

  return (
    <RelatedRecordsSection
      title={t("sections.positions")}
      count={positionsQuery.data?.meta.totalItems}
      isLoading={positionsQuery.isPending}
      emptyText={t("sections.empty_positions")}
      items={items}
      getRowKey={(p) => p.id}
      viewAllTo="/positions"
      viewAllLabel={t("sections.view_all")}
      columns={[
        {
          key: "code",
          header: t("columns.code"),
          className: "font-mono text-muted-foreground",
          render: (p) => p.positionCode,
        },
        {
          key: "name",
          header: t("columns.name"),
          render: (p) => (
            <Link
              to={`/positions/${p.id}`}
              className="font-medium text-primary hover:underline"
            >
              {p.positionName}
            </Link>
          ),
        },
        {
          key: "status",
          header: t("columns.status"),
          render: (p) => <StatusBadge status={p.status} />,
        },
      ]}
    />
  )
}

function DepartmentEmployeesSection({
  departmentId,
}: {
  departmentId: string
}) {
  const { t } = useTranslation("departments")
  const employeesQuery = useEmployeesQuery({ departmentId, limit: 100 })
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
          key: "position",
          header: t("sections.position"),
          className: "text-muted-foreground",
          render: (e) => e.positionTitle || "—",
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

export function DepartmentDetailPage() {
  const { t, i18n } = useTranslation("departments")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const departmentQuery = useDepartmentQuery(id)
  const department = departmentQuery.data
  const branchesQuery = useBranchesQuery({ limit: 100 })
  const { can } = usePermissions()
  const canUpdate = can("org.department.update")
  const canDeactivate = can("org.department.deactivate")
  const canReadPositions = can("org.position.read")
  const canReadEmployees = can("org.employee.read")
  const deactivateMutation = useDeactivateDepartmentMutation()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const branchName =
    (branchesQuery.data?.items ?? []).find(
      (b) => b.id === department?.branchId
    )?.branchName ?? (department?.branchId ? department.branchId : "—")

  if (!department && departmentQuery.isFetched) {
    return (
      <NotFoundState
        backTo="/departments"
        backLabel={t("title")}
        description={t("not_found", "Department not found.")}
      />
    )
  }

  const name = department?.departmentName ?? ""
  const identityItems = [
    { label: t("columns.code"), value: department?.departmentCode, mono: true },
    { label: t("columns.name"), value: department?.departmentName },
    {
      label: t("form.branch", "Branch"),
      value: department?.branchId ? (
        <Link
          to={`/branches/${department.branchId}`}
          className="text-primary hover:underline"
        >
          {branchName}
        </Link>
      ) : (
        "—"
      ),
    },
    {
      label: tCommon("created_at", "Created"),
      value: department
        ? formatDateTime(department.createdAt, i18n.language)
        : null,
    },
    {
      label: tCommon("updated_at", "Updated"),
      value: department
        ? formatDateTime(department.updatedAt, i18n.language)
        : null,
    },
  ]

  const actions = (
    <>
      {canUpdate && department ? (
        <DetailActionButton
          onClick={() => void navigate(`/departments/${id}/edit`)}
        >
          <PencilIcon />
          {tCommon("actions.edit")}
        </DetailActionButton>
      ) : null}
      {canDeactivate && department && department.status === "ACTIVE" ? (
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
        backTo="/departments"
        backLabel={t("title")}
        title={name || t("title")}
        description={department?.departmentCode}
        actions={actions}
      />
      <div className="grid items-start gap-12 lg:grid-cols-[18.75rem_minmax(0,1fr)]">
        <ProfileSummaryCard
          isLoading={departmentQuery.isPending}
          avatarSize="xl"
          title={name}
          subtitle={department?.departmentCode}
          initials={getInitials(...name.split(" "))}
          badges={department ? <StatusBadge status={department.status} /> : null}
        />
        <div className="flex min-w-0 flex-col gap-8">
          {departmentQuery.isPending ? (
            <FormSkeleton fields={4} columns={2} />
          ) : (
            <section className="border-t border-hair pt-6">
              <h2 className="mb-6 text-body-2 font-semibold text-foreground">
                {tCommon("sections.overview", "Overview")}
              </h2>
              <DetailList columns={2} items={identityItems} />
            </section>
          )}
          {department && canReadPositions && (
            <DepartmentPositionsSection departmentId={department.id} />
          )}
          {department && canReadEmployees && (
            <DepartmentEmployeesSection departmentId={department.id} />
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
          if (!department) return
          deactivateMutation.mutate(department.id, {
            onSuccess: () => {
              setShowDeleteDialog(false)
              toast.success(t("delete.success"))
              void navigate("/departments")
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
