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
import { BranchTable } from "@/features/branches/components/branch-table"
import { useBranchListParams } from "@/features/branches/hooks/use-branch-list-params"
import {
  useBranchesQuery,
  useDeactivateBranchMutation,
} from "@/shared/queries/branch.query"

import type { Branch } from "@/shared/services/branch.service"

export function BranchListPage() {
  const { t } = useTranslation("branches")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const params = useBranchListParams()
  const branchesQuery = useBranchesQuery(params.listParams)
  const deactivateMutation = useDeactivateBranchMutation()
  const [branchToDeactivate, setBranchToDeactivate] = useState<Branch | null>(
    null
  )
  const items = branchesQuery.data?.items ?? []
  const parentNames = new Map(items.map((branch) => [branch.id, branch.branchName]))
  const isUnfilteredEmpty =
    branchesQuery.isSuccess &&
    !params.hasFilters &&
    (branchesQuery.data?.meta.totalItems ?? 0) === 0

  const addButton = (
    <Button type="button" onClick={() => void navigate("/branches/new")}>
      <PlusIcon className="size-4" />
      {t("add")}
    </Button>
  )

  const statusItems = [
    { value: "all", label: t("all_status") },
    { value: "active", label: tCommon("status.active") },
    { value: "inactive", label: tCommon("status.inactive") },
  ]

  function renderBody() {
    if (branchesQuery.isPending) {
      return <TableSkeleton columns={6} />
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
      <BranchTable
        data={items}
        parentNames={parentNames}
        onRowClick={(branch) => {
          void navigate(`/branches/${branch.id}`)
        }}
        onEdit={(branch) => {
          void navigate(`/branches/${branch.id}/edit`)
        }}
        onDelete={setBranchToDeactivate}
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
              className="w-[22rem] max-w-full shrink-0"
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
              meta={branchesQuery.data?.meta}
              isDisabled={branchesQuery.isPending && !branchesQuery.data}
            />
          )
        }
      >
        {renderBody()}
      </ListCard>
      <ConfirmDialog
        open={branchToDeactivate !== null}
        title={t("deactivate.title")}
        description={t("deactivate.description", {
          name: branchToDeactivate?.branchName ?? "",
        })}
        confirmLabel={t("deactivate.confirm")}
        isPending={deactivateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setBranchToDeactivate(null)
          }
        }}
        onConfirm={() => {
          if (!branchToDeactivate) {
            return
          }

          deactivateMutation.mutate(branchToDeactivate.id, {
            onSuccess: () => {
              setBranchToDeactivate(null)
            },
          })
        }}
      />
    </MotionStack>
  )
}
