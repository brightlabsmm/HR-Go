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
import { POSITION_CODE_PREFIX } from "@/constants/codes"
import { joinCodePrefix, stripCodePrefix } from "@/util/code-prefix"
import { useDepartmentsQuery } from "@/shared/queries/department.query"
import {
  useCreatePositionMutation,
  usePositionQuery,
  useUpdatePositionMutation,
} from "@/shared/queries/position.query"

export function PositionFormPage() {
  const { t } = useTranslation("positions")
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const positionQuery = usePositionQuery(id ?? "")
  const departmentsQuery = useDepartmentsQuery({ status: "active", limit: 100 })
  const createMutation = useCreatePositionMutation()
  const updateMutation = useUpdatePositionMutation()
  const isPending = createMutation.isPending || updateMutation.isPending
  const isLoading = isEdit && positionQuery.isPending
  const schema = useMemo(
    () =>
      z.object({
        positionCode: z.string().trim().min(1, t("form.errors.code")),
        positionName: z.string().trim().min(1, t("form.errors.name")),
        departmentId: z.string(),
      }),
    [t]
  )
  type FormValues = z.infer<typeof schema>
  const position = positionQuery.data
  const { control, handleSubmit, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      positionCode: stripCodePrefix(
        POSITION_CODE_PREFIX,
        position?.positionCode ?? ""
      ),
      positionName: position?.positionName ?? "",
      departmentId: position?.departmentId ?? "none",
    },
  })
  const departmentOptions = [
    { value: "none", label: t("form.none") },
    ...(departmentsQuery.data?.items ?? []).map((department) => ({
      value: department.id,
      label: department.departmentName,
    })),
  ]

  if (isEdit && positionQuery.isFetched && !position) {
    return <NotFoundState backTo="/positions" backLabel={t("title")} />
  }

  return (
    <section className="flex flex-col gap-8 pb-6">
      <FormPageHeader
        title={isEdit ? t("form.edit_title") : t("form.create_title")}
        subtitle={isEdit ? position?.positionName : t("subtitle")}
      />
      <form
        className={formStackClassName}
        onSubmit={handleSubmit(async (values) => {
          const departmentId =
            values.departmentId === "none" ? null : values.departmentId
          try {
            if (isEdit && id) {
              await updateMutation.mutateAsync({
                id,
                input: {
                  positionName: values.positionName.trim(),
                  departmentId,
                },
              })
            } else {
              await createMutation.mutateAsync({
                positionCode: joinCodePrefix(POSITION_CODE_PREFIX, values.positionCode),
                positionName: values.positionName.trim(),
                departmentId,
              })
            }
            void navigate("/positions")
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
                name="positionCode"
                prefix={POSITION_CODE_PREFIX}
                required
                label={t("form.code")}
                placeholder={t("form.code_placeholder")}
                disabled={isEdit || isPending}
              />
              <FormTextInput
                control={control}
                name="positionName"
                required
                label={t("form.name")}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="departmentId"
                label={t("form.department")}
                className="md:col-span-2"
                options={departmentOptions}
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
            onClick={() => void navigate("/positions")}
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
