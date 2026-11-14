import { useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"

import {
  BranchForm,
  type BranchFormValues,
} from "@/features/branches/components/branch-form"
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
  const parentOptions = (branchesQuery.data?.items ?? [])
    .filter((item) => item.id !== id)
    .map((item) => ({
      value: item.id,
      label: `${item.branchCode} — ${item.branchName}`,
    }))

  if (!branch && branchQuery.isFetched) {
    return <p className="text-small-1 text-muted-foreground">{t("not_found")}</p>
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
    void navigate("/")
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
          branchCode: branch.branchCode,
          branchName: branch.branchName,
          parentId: branch.parentId ?? "none",
          address: branch.address ?? "",
        }}
        onCancel={() => {
          void navigate("/")
        }}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
