import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { FilterBar } from "@/components/common/filter-bar"
import { FilterSelect } from "@/components/common/filter-select"
import { ListCard } from "@/components/common/list-card"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Pagination } from "@/components/common/pagination"
import { SearchBox } from "@/components/common/search-box"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { Button } from "@/components/ui/button"
import {
  getStatusDialogContent,
  isHighImpactOrganizationStatus,
} from "@/features/organizations/components/organization-status-menu"
import { OrganizationTable } from "@/features/organizations/components/organization-table"
import { useOrganizationListParams } from "@/features/organizations/hooks/use-organization-list-params"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useDeleteOrganizationMutation,
  useOrganizationsQuery,
  useUpdateOrganizationStatusMutation,
} from "@/shared/queries/organization.query"
import { toast } from "@/shared/stores/toast.store"

import type {
  Organization,
  OrganizationStatus,
} from "@/shared/services/organization.service"

export function OrganizationListPage() {
  const { t } = useTranslation("organizations")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const params = useOrganizationListParams()
  const organizationsQuery = useOrganizationsQuery(params.listParams)
  const { can } = usePermissions()
  const canCreate = can("platform.organization.create")
  const canDelete = can("platform.organization.delete")
  const statusMutation = useUpdateOrganizationStatusMutation()
  const deleteMutation = useDeleteOrganizationMutation()
  const [statusTarget, setStatusTarget] = useState<{
    organization: Organization
    status: OrganizationStatus
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null)
  const items = organizationsQuery.data?.items ?? []
  const isUnfilteredEmpty =
    organizationsQuery.isSuccess &&
    !params.hasFilters &&
    (organizationsQuery.data?.meta.totalItems ?? 0) === 0
  const statusItems = [
    { value: "all", label: t("all_status") },
    { value: "pending", label: tCommon("status.pending") },
    { value: "active", label: tCommon("status.active") },
    { value: "suspended", label: tCommon("status.suspended") },
  ]

  const addButton = canCreate ? (
    <Button type="button" onClick={() => void navigate("/organizations/new")}>
      <PlusIcon className="size-4" />
      {t("add")}
    </Button>
  ) : null

  function renderBody() {
    if (organizationsQuery.isPending) {
      return <TableSkeleton columns={7} />
    }

    if (isUnfilteredEmpty) {
      return (
        <PageEmptyState
          title={t("empty.title")}
          description={t("empty.description")}
          action={addButton}
        />
      )
    }

    if (items.length === 0) {
      return (
        <PageEmptyState
          variant="no-results"
          title={tCommon("states.no_results_title")}
          description={tCommon("states.no_results_description")}
          action={
            <Button type="button" variant="outline" onClick={params.resetFilters}>
              {tCommon("actions.reset_filters")}
            </Button>
          }
        />
      )
    }

    return (
      <OrganizationTable
        data={items}
        sorting={params.sorting}
        onSortingChange={params.setSorting}
        onChangeStatus={(organization, status) =>
          setStatusTarget({ organization, status })
        }
        onDelete={canDelete ? setDeleteTarget : undefined}
      />
    )
  }

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} actions={addButton} />
      <ListCard
        toolbar={
          <FilterBar hasFilters={params.hasFilters} onReset={params.resetFilters}>
            <SearchBox
              value={params.search}
              onValueChange={params.setSearch}
              placeholder={t("search_placeholder")}
              className="w-80 max-w-full shrink-0"
            />
            <FilterSelect
              items={statusItems}
              value={params.status ?? "all"}
              label={t("all_status")}
              onValueChange={params.setStatus}
            />
          </FilterBar>
        }
        footer={
          isUnfilteredEmpty ? null : (
            <Pagination
              meta={organizationsQuery.data?.meta}
              isDisabled={organizationsQuery.isPending && !organizationsQuery.data}
            />
          )
        }
      >
        {renderBody()}
      </ListCard>
      {(() => {
        const dialogContent =
          statusTarget
            ? getStatusDialogContent(
                statusTarget.organization.status,
                statusTarget.status,
                statusTarget.organization.displayName,
                t
              )
            : null

        return (
          <ConfirmDialog
            open={statusTarget !== null}
            title={dialogContent?.title ?? ""}
            description={dialogContent?.description ?? ""}
            confirmLabel={dialogContent?.confirmLabel ?? t("status_change.confirm")}
            confirmVariant={
              statusTarget && isHighImpactOrganizationStatus(statusTarget.status)
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
              if (!statusTarget) {
                return
              }

              statusMutation.mutate(
                {
                  id: statusTarget.organization.id,
                  input: {
                    status: statusTarget.status,
                    confirmation: true,
                  },
                },
                {
                  onSuccess: () => {
                    setStatusTarget(null)
                    void organizationsQuery.refetch()
                  },
                }
              )
            }}
          />
        )
      })()}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("delete.title", { name: deleteTarget?.displayName ?? "" })}
        description={t("delete.description", {
          name: deleteTarget?.displayName ?? "",
        })}
        confirmLabel={t("delete.confirm")}
        confirmVariant="destructive"
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => {
          if (!deleteTarget) {
            return
          }

          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null)
              toast.success(t("delete.success"))
            },
          })
        }}
      />
    </MotionStack>
  )
}
