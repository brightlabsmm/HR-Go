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
import { BranchOperatingHoursSection } from "@/features/branches/components/branch-operating-hours-section"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useBranchQuery,
  useBranchesQuery,
  useDeactivateBranchMutation,
} from "@/shared/queries/branch.query"
import { useDepartmentsQuery } from "@/shared/queries/department.query"
import { useEmployeesQuery } from "@/shared/queries/employee.query"
import { useShiftsQuery } from "@/shared/queries/shift.query"
import { toast } from "@/shared/stores/toast.store"
import { formatDateTime } from "@/util/format-date"
import { getInitials } from "@/util/initials"

function BranchSubBranchesSection({ branchId }: { branchId: string }) {
  const { t } = useTranslation("branches")
  const branchesQuery = useBranchesQuery({ limit: 100 })
  const childBranches = (branchesQuery.data?.items ?? []).filter(
    (b) => b.parentId === branchId
  )
  if (!branchesQuery.isPending && childBranches.length === 0) return null

  return (
    <RelatedRecordsSection
      title={t("sections.sub_branches")}
      count={childBranches.length}
      isLoading={branchesQuery.isPending}
      emptyText={t("sections.empty_sub_branches")}
      items={childBranches}
      getRowKey={(b) => b.id}
      columns={[
        {
          key: "code",
          header: t("columns.code"),
          className: "font-mono text-muted-foreground",
          render: (b) => b.branchCode,
        },
        {
          key: "name",
          header: t("columns.name"),
          render: (b) => (
            <Link
              to={`/branches/${b.id}`}
              className="font-medium text-primary hover:underline"
            >
              {b.branchName}
            </Link>
          ),
        },
        {
          key: "status",
          header: t("columns.status"),
          render: (b) => <StatusBadge status={b.status} />,
        },
      ]}
    />
  )
}

function BranchDepartmentsSection({ branchId }: { branchId: string }) {
  const { t } = useTranslation("branches")
  const departmentsQuery = useDepartmentsQuery({ branchId, limit: 100 })
  const items = departmentsQuery.data?.items ?? []

  return (
    <RelatedRecordsSection
      title={t("sections.departments")}
      count={departmentsQuery.data?.meta.totalItems}
      isLoading={departmentsQuery.isPending}
      emptyText={t("sections.empty_departments")}
      items={items}
      getRowKey={(d) => d.id}
      viewAllTo="/departments"
      viewAllLabel={t("sections.view_all")}
      columns={[
        {
          key: "code",
          header: t("columns.code"),
          className: "font-mono text-muted-foreground",
          render: (d) => d.departmentCode,
        },
        {
          key: "name",
          header: t("sections.department_name"),
          render: (d) => (
            <Link
              to={`/departments/${d.id}`}
              className="font-medium text-primary hover:underline"
            >
              {d.departmentName}
            </Link>
          ),
        },
        {
          key: "status",
          header: t("columns.status"),
          render: (d) => <StatusBadge status={d.status} />,
        },
      ]}
    />
  )
}

function BranchShiftsSection({ branchId }: { branchId: string }) {
  const { t } = useTranslation("branches")
  const shiftsQuery = useShiftsQuery({ branchId, limit: 100 })
  const items = shiftsQuery.data?.items ?? []

  return (
    <RelatedRecordsSection
      title={t("sections.shifts")}
      count={shiftsQuery.data?.meta.totalItems}
      isLoading={shiftsQuery.isPending}
      emptyText={t("sections.empty_shifts")}
      items={items}
      getRowKey={(s) => s.id}
      viewAllTo="/shifts"
      viewAllLabel={t("sections.view_all")}
      columns={[
        {
          key: "name",
          header: t("sections.shift_name"),
          render: (s) => (
            <Link
              to={`/shifts/${s.id}/edit`}
              className="font-medium text-primary hover:underline"
            >
              {s.shiftName}
            </Link>
          ),
        },
        {
          key: "schedule",
          header: t("sections.schedule"),
          className: "text-muted-foreground",
          render: (s) => `${s.startTime} - ${s.endTime}`,
        },
        {
          key: "status",
          header: t("columns.status"),
          render: (s) => <StatusBadge status={s.status} />,
        },
      ]}
    />
  )
}

function BranchEmployeesSection({ branchId }: { branchId: string }) {
  const { t } = useTranslation("branches")
  const employeesQuery = useEmployeesQuery({ branchId, limit: 100 })
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
          header: t("sections.employee_name"),
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

export function BranchDetailPage() {
  const { t, i18n } = useTranslation("branches")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const branchQuery = useBranchQuery(id)
  const branch = branchQuery.data
  const { can } = usePermissions()
  const canUpdate = can("org.branch.update")
  const canDeactivate = can("org.branch.deactivate")
  const canReadDepts = can("org.department.read")
  const canReadShifts = can("org.shift.read")
  const canReadEmployees = can("org.employee.read")
  const deactivateMutation = useDeactivateBranchMutation()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const parentBranchQuery = useBranchQuery(branch?.parentId ?? "")
  const parentName =
    parentBranchQuery.data?.branchName ??
    (branch?.parentId ? branch.parentId : "—")

  if (!branch && branchQuery.isFetched) {
    return (
      <NotFoundState
        backTo="/branches"
        backLabel={t("title")}
        description={t("not_found", "Branch not found.")}
      />
    )
  }

  const name = branch?.branchName ?? ""
  const identityItems = [
    { label: t("columns.code"), value: branch?.branchCode, mono: true },
    { label: t("columns.name"), value: branch?.branchName },
    {
      label: t("columns.parent"),
      value: branch?.parentId ? (
        <Link
          to={`/branches/${branch.parentId}`}
          className="text-primary hover:underline"
        >
          {parentName}
        </Link>
      ) : (
        "—"
      ),
    },
    { label: t("columns.address"), value: branch?.address || "—" },
    {
      label: tCommon("created_at", "Created"),
      value: branch ? formatDateTime(branch.createdAt, i18n.language) : null,
    },
    {
      label: tCommon("updated_at", "Updated"),
      value: branch ? formatDateTime(branch.updatedAt, i18n.language) : null,
    },
  ]

  const actions = (
    <>
      {canUpdate && branch ? (
        <DetailActionButton onClick={() => void navigate(`/branches/${id}/edit`)}>
          <PencilIcon />
          {tCommon("actions.edit")}
        </DetailActionButton>
      ) : null}
      {canDeactivate && branch && branch.status === "ACTIVE" ? (
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
        backTo="/branches"
        backLabel={t("title")}
        title={name || t("title")}
        description={branch?.branchCode}
        actions={actions}
      />
      <div className="grid items-start gap-12 lg:grid-cols-[18.75rem_minmax(0,1fr)]">
        <ProfileSummaryCard
          isLoading={branchQuery.isPending}
          avatarSize="xl"
          title={name}
          subtitle={branch?.branchCode}
          initials={getInitials(...name.split(" "))}
          badges={branch ? <StatusBadge status={branch.status} /> : null}
        />
        <div className="flex min-w-0 flex-col gap-8">
          {branchQuery.isPending ? (
            <FormSkeleton fields={4} columns={2} />
          ) : (
            <section className="border-t border-hair pt-6">
              <h2 className="mb-6 text-body-2 font-semibold text-foreground">
                {tCommon("sections.overview", "Overview")}
              </h2>
              <DetailList columns={2} items={identityItems} />
            </section>
          )}
          {branch && <BranchOperatingHoursSection branchId={branch.id} />}
          {branch && <BranchSubBranchesSection branchId={branch.id} />}
          {branch && canReadDepts && (
            <BranchDepartmentsSection branchId={branch.id} />
          )}
          {branch && canReadShifts && (
            <BranchShiftsSection branchId={branch.id} />
          )}
          {branch && canReadEmployees && (
            <BranchEmployeesSection branchId={branch.id} />
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
          if (!branch) return
          deactivateMutation.mutate(branch.id, {
            onSuccess: () => {
              setShowDeleteDialog(false)
              toast.success(t("delete.success"))
              void navigate("/branches")
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
