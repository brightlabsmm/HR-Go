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
import {
  useBranchQuery,
  useDeactivateBranchMutation,
} from "@/shared/queries/branch.query"
import { formatDate } from "@/util/format-date"
import { getInitials } from "@/util/initials"

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
  const deactivateMutation = useDeactivateBranchMutation()
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)

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
    { label: t("columns.parent"), value: parentName },
    { label: t("columns.address"), value: branch?.address || "—" },
    {
      label: tCommon("created_at", "Created"),
      value: branch ? formatDate(branch.createdAt, i18n.language) : null,
    },
    {
      label: tCommon("updated_at", "Updated"),
      value: branch ? formatDate(branch.updatedAt, i18n.language) : null,
    },
  ]

  const actions = (
    <div className="flex items-center gap-2">
      {canUpdate && branch ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => void navigate(`/branches/${id}/edit`)}
        >
          <PencilIcon className="size-4" />
          {tCommon("actions.edit")}
        </Button>
      ) : null}
      {canDeactivate && branch && branch.status === "ACTIVE" ? (
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
        </div>
      </div>
      <ConfirmDialog
        open={showDeactivateDialog}
        title={t("deactivate.title", "Deactivate branch?")}
        description={t(
          "deactivate.description",
          "This will deactivate {{name}}. You can keep using other branches.",
          { name }
        )}
        confirmLabel={t("deactivate.confirm", "Deactivate")}
        confirmVariant="destructive"
        isPending={deactivateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setShowDeactivateDialog(false)
        }}
        onConfirm={() => {
          if (!branch) return
          deactivateMutation.mutate(branch.id, {
            onSuccess: () => {
              setShowDeactivateDialog(false)
              void navigate("/branches")
            },
          })
        }}
      />
    </MotionStack>
  )
}
