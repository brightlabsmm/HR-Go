import { useMemo } from "react"
import { useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"

import { NotFoundState } from "@/components/common/not-found-state"
import {
  BranchForm,
  type BranchFormValues,
} from "@/features/branches/components/branch-form"
import { getDescendantBranchIds } from "@/features/branches/util/branch-hierarchy"
import {
  useBranchQuery,
  useBranchesQuery,
  useUpdateBranchMutation,
} from "@/shared/queries/branch.query"

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}

export function BranchEditPage() {
  const { t } = useTranslation("branches")
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const branchQuery = useBranchQuery(id)
  const branchesQuery = useBranchesQuery({ limit: 100 })
  const updateMutation = useUpdateBranchMutation()
  const branch = branchQuery.data
  const allBranches = branchesQuery.data?.items ?? []

  const descendantIds = useMemo(
    () => getDescendantBranchIds(id, allBranches),
    [id, allBranches]
  )

  const parentOptions = allBranches
    .filter((item) => item.id !== id && !descendantIds.has(item.id))
    .map((item) => ({
      value: item.id,
      label: `${item.branchCode} — ${item.branchName}`,
    }))

  if (!branch && branchQuery.isFetched) {
    return (
      <NotFoundState
        backTo="/branches"
        backLabel={t("title")}
        description={t("not_found", "Branch not found.")}
      />
    )
  }

  if (!branch) {
    return null
  }

  async function handleSubmit(values: BranchFormValues) {
    await updateMutation.mutateAsync({
      id,
      input: {
        branchName: values.branchName.trim(),
        parentId: values.parentId === "none" ? null : values.parentId,
        address: optionalText(values.address),
      },
    })
    void navigate("/branches")
  }

  return (
    <section className="pb-6">
      <BranchForm
        isEdit
        isPending={updateMutation.isPending}
        title={t("form.edit_title")}
        subtitle={t("form.edit_subtitle")}
        submitLabel={t("form.save")}
        parentOptions={parentOptions}
        defaultValues={{
          branchName: branch.branchName,
          parentId: branch.parentId ?? "none",
          address: branch.address ?? "",
        }}
        onCancel={() => {
          void navigate("/branches")
        }}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
