import { useState } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DetailList } from "@/components/common/detail-list"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { MotionStack } from "@/components/common/motion-stack"
import { NotFoundState } from "@/components/common/not-found-state"
import { PageHeader } from "@/components/common/page-header"
import { ProfileSummaryCard } from "@/components/common/profile-summary-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import {
  useDeactivateDepartmentMutation,
  useDepartmentQuery,
} from "@/shared/queries/department.query"
import { formatDate } from "@/util/format-date"
import { getInitials } from "@/util/initials"

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
  const deactivateMutation = useDeactivateDepartmentMutation()
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)

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
    { label: t("form.branch", "Branch"), value: branchName },
    {
      label: tCommon("created_at", "Created"),
      value: department ? formatDate(department.createdAt, i18n.language) : null,
    },
    {
      label: tCommon("updated_at", "Updated"),
      value: department ? formatDate(department.updatedAt, i18n.language) : null,
    },
  ]

  const actions = (
    <div className="flex items-center gap-2">
      {canUpdate && department ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => void navigate(`/departments/${id}/edit`)}
        >
          <PencilIcon className="size-4" />
          {tCommon("actions.edit")}
        </Button>
      ) : null}
      {canDeactivate && department && department.status === "ACTIVE" ? (
        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:bg-destructive-muted hover:text-destructive"
          onClick={() => setShowDeactivateDialog(true)}
        >
          <Trash2Icon className="size-4" />
          {tCommon("actions.deactivate", "Deactivate")}
        </Button>
      ) : null}
    </div>
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
        </div>
      </div>
      <ConfirmDialog
        open={showDeactivateDialog}
        title={t("deactivate.title")}
        description={t("deactivate.description", { name })}
        confirmLabel={t("deactivate.confirm")}
        confirmVariant="destructive"
        isPending={deactivateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setShowDeactivateDialog(false)
        }}
        onConfirm={() => {
          if (!department) return
          deactivateMutation.mutate(department.id, {
            onSuccess: () => {
              setShowDeactivateDialog(false)
              void navigate("/departments")
            },
          })
        }}
      />
    </MotionStack>
  )
}
