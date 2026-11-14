import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormCodeInput } from "@/components/common/form/form-code-input"
import { FormSelectInput } from "@/components/common/form/form-select-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormPageHeader } from "@/components/common/form-page-header"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { NotFoundState } from "@/components/common/not-found-state"
import { Button } from "@/components/ui/button"
import { DEPARTMENT_CODE_PREFIX } from "@/constants/codes"
import { joinCodePrefix, stripCodePrefix } from "@/util/code-prefix"
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
  const isPending = createMutation.isPending || updateMutation.isPending
  const isLoading = isEdit && departmentQuery.isPending
  const schema = useMemo(
    () =>
      z.object({
        departmentCode: z.string().trim().min(1, t("form.errors.code")),
        departmentName: z.string().trim().min(1, t("form.errors.name")),
        branchId: z.string(),
      }),
    [t]
  )
  type FormValues = z.infer<typeof schema>
  const department = departmentQuery.data
  const { control, handleSubmit, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      departmentCode: stripCodePrefix(
        DEPARTMENT_CODE_PREFIX,
        department?.departmentCode ?? ""
      ),
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
                departmentCode: joinCodePrefix(
                  DEPARTMENT_CODE_PREFIX,
                  values.departmentCode
                ),
                departmentName: values.departmentName.trim(),
                branchId,
              })
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
              <FormCodeInput
                control={control}
                name="departmentCode"
                prefix={DEPARTMENT_CODE_PREFIX}
                required
                label={t("form.code")}
                placeholder={t("form.code_placeholder")}
                disabled={isEdit || isPending}
              />
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
                className="md:col-span-2"
                options={branchOptions}
                disabled={isPending}
              />
            </FormFieldGrid>
          )}
        </FormSection>
        <FormActions>
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
