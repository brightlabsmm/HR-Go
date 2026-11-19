import { useState } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DetailActionButton } from "@/components/common/detail-action-button"
import { DetailList } from "@/components/common/detail-list"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { MotionStack } from "@/components/common/motion-stack"
import { NotFoundState } from "@/components/common/not-found-state"
import { PageHeader } from "@/components/common/page-header"
import { ProfileSummaryCard } from "@/components/common/profile-summary-card"
import { StatusBadge } from "@/components/common/status-badge"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useDepartmentsQuery } from "@/shared/queries/department.query"
import {
  useDeactivatePositionMutation,
  usePositionQuery,
} from "@/shared/queries/position.query"
import { formatDate } from "@/util/format-date"
import { getInitials } from "@/util/initials"

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
  const deactivateMutation = useDeactivatePositionMutation()
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)

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
    { label: t("form.department", "Department"), value: departmentName },
    {
      label: tCommon("created_at", "Created"),
      value: position ? formatDate(position.createdAt, i18n.language) : null,
    },
    {
      label: tCommon("updated_at", "Updated"),
      value: position ? formatDate(position.updatedAt, i18n.language) : null,
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
          onClick={() => setShowDeactivateDialog(true)}
        >
          <Trash2Icon />
          {tCommon("actions.deactivate", "Deactivate")}
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
          if (!position) return
          deactivateMutation.mutate(position.id, {
            onSuccess: () => {
              setShowDeactivateDialog(false)
              void navigate("/positions")
            },
          })
        }}
      />
    </MotionStack>
  )
}
