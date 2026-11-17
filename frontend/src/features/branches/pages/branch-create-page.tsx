import { useNavigate } from "react-router"

import {
  BranchForm,
  type BranchFormValues,
} from "@/features/branches/components/branch-form"
import {
  useBranchesQuery,
  useCreateBranchMutation,
} from "@/shared/queries/branch.query"

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}

export function BranchCreatePage() {
  const navigate = useNavigate()
  const branchesQuery = useBranchesQuery({ limit: 100, status: "active" })
  const createMutation = useCreateBranchMutation()
  const parentOptions = (branchesQuery.data?.items ?? []).map((branch) => ({
    value: branch.id,
    label: `${branch.branchCode} — ${branch.branchName}`,
  }))

  async function handleCreate(values: BranchFormValues) {
    await createMutation.mutateAsync({
      branchName: values.branchName.trim(),
      parentId: values.parentId === "none" ? null : values.parentId,
      address: optionalText(values.address),
    })
  }

  return (
    <section className="pb-6">
      <BranchForm
        isPending={createMutation.isPending}
        parentOptions={parentOptions}
        onCancel={() => {
          void navigate("/")
        }}
        onSubmit={handleCreate}
      />
    </section>
  )
}
