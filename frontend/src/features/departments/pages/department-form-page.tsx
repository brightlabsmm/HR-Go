import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormSelectInput } from "@/components/common/form/form-select-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormPageHeader } from "@/components/common/form-page-header"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { NotFoundState } from "@/components/common/not-found-state"
import { StayAfterCreateCheckbox } from "@/components/common/stay-after-create-checkbox"
import { Button } from "@/components/ui/button"
import { useStayAfterCreate } from "@/shared/hooks/use-stay-after-create"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import {
  useCreateDepartmentMutation,
  useDepartmentQuery,
  useUpdateDepartmentMutation,
} from "@/shared/queries/department.query"

export function DepartmentFormPage() {
  const { t } = useTranslation("departments")
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const departmentQuery = useDepartmentQuery(id ?? "")
  const branchesQuery = useBranchesQuery({ status: "active", limit: 100 })
  const createMutation = useCreateDepartmentMutation()
  const updateMutation = useUpdateDepartmentMutation()
  const { stayAfterCreate, setStayAfterCreate, finishCreate } =
    useStayAfterCreate("/departments")
  const isPending = createMutation.isPending || updateMutation.isPending
  const isLoading = isEdit && departmentQuery.isPending
  const schema = useMemo(
    () =>
      z.object({
        departmentName: z.string().trim().min(1, t("form.errors.name")),
        branchId: z.string(),
      }),
    [t]
  )
  type FormValues = z.infer<typeof schema>
  const department = departmentQuery.data
  const { control, handleSubmit, setError, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      departmentName: department?.departmentName ?? "",
      branchId: department?.branchId ?? "none",
    },
  })
  const branchOptions = [
    { value: "none", label: t("form.none") },
    ...(branchesQuery.data?.items ?? []).map((branch) => ({
      value: branch.id,
      label: branch.branchName,
    })),
  ]

  if (isEdit && departmentQuery.isFetched && !department) {
    return <NotFoundState backTo="/departments" backLabel={t("title")} />
  }

  return (
    <section className="flex flex-col gap-8 pb-6">
      <FormPageHeader
        title={isEdit ? t("form.edit_title") : t("form.create_title")}
        subtitle={isEdit ? department?.departmentName : t("subtitle")}
      />
      <form
        className={formStackClassName}
        onSubmit={handleSubmit(async (values) => {
          const branchId = values.branchId === "none" ? null : values.branchId
          try {
            if (isEdit && id) {
              await updateMutation.mutateAsync({
                id,
                input: {
                  departmentName: values.departmentName.trim(),
                  branchId,
                },
              })
            } else {
              await createMutation.mutateAsync({
                departmentName: values.departmentName.trim(),
                branchId,
              })
              finishCreate(() =>
                reset({
                  departmentName: "",
                  branchId: "none",
                })
              )
              return
            }
            void navigate("/departments")
          } catch (error) {
            applyApiFieldErrors(error, setError)
          }
        })}
      >
        <FormSection legend={t("sections.details")}>
          {isLoading ? (
            <FormSkeleton fields={2} columns={2} />
          ) : (
            <FormFieldGrid>
              <FormTextInput
                control={control}
                name="departmentName"
                required
                label={t("form.name")}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="branchId"
                label={t("form.branch")}
                options={branchOptions}
                disabled={isPending}
              />
            </FormFieldGrid>
          )}
        </FormSection>
        <FormActions
          start={
            isEdit ? undefined : (
              <StayAfterCreateCheckbox
                checked={stayAfterCreate}
                onCheckedChange={setStayAfterCreate}
                disabled={isPending}
              />
            )
          }
        >
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => void navigate("/departments")}
          >
            {t("form.cancel")}
          </Button>
          <Button type="submit" loading={isPending} disabled={isLoading}>
            {isEdit ? t("form.save") : t("form.create")}
          </Button>
        </FormActions>
      </form>
    </section>
  )
}
