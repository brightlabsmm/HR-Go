import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors, notifyApiError } from "@/app/api/feedback"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormSelectInput } from "@/components/common/form/form-select-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormSwitchInput } from "@/components/common/form/form-switch-input"
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
  useCreateHolidayMutation,
  useHolidayQuery,
  useUpdateHolidayMutation,
} from "@/shared/queries/holiday.query"
import { toast } from "@/shared/stores/toast.store"

export function HolidayFormPage() {
  const { t } = useTranslation("holidays")
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const prefillDateRaw = searchParams.get("date") ?? ""
  const prefillDate = /^\d{4}-\d{2}-\d{2}$/.test(prefillDateRaw)
    ? prefillDateRaw
    : ""

  const holidayQuery = useHolidayQuery(id ?? "")
  const branchesQuery = useBranchesQuery({ status: "active", limit: 100 })
  const createMutation = useCreateHolidayMutation()
  const updateMutation = useUpdateHolidayMutation()

  const { stayAfterCreate, setStayAfterCreate, finishCreate } =
    useStayAfterCreate("/holidays")
  const isPending = createMutation.isPending || updateMutation.isPending
  const isLoading = isEdit && holidayQuery.isPending

  const schema = useMemo(
    () =>
      z
        .object({
          holidayName: z
            .string()
            .trim()
            .min(1, t("form.errors.name"))
            .max(150, t("form.errors.name_max")),
          startDate: z
            .string()
            .trim()
            .min(1, t("form.errors.start_date")),
          endDate: z
            .string()
            .trim()
            .min(1, t("form.errors.end_date")),
          branchId: z.string(),
          holidayType: z.string(),
          isPaid: z.boolean(),
        })
        .refine(
          (data) =>
            !data.startDate || !data.endDate || data.endDate >= data.startDate,
          {
            message: t("form.errors.end_before_start"),
            path: ["endDate"],
          }
        ),
    [t]
  )

  type FormValues = z.infer<typeof schema>
  const holiday = holidayQuery.data

  const { control, handleSubmit, setError, reset } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      values: {
        holidayName: holiday?.holidayName ?? "",
        startDate: holiday?.startDate
          ? holiday.startDate.slice(0, 10)
          : prefillDate,
        endDate: holiday?.endDate
          ? holiday.endDate.slice(0, 10)
          : prefillDate,
        branchId: holiday?.branchId ?? "none",
        holidayType: holiday?.holidayType ?? "PUBLIC",
        isPaid: holiday?.isPaid ?? true,
      },
    })

  const branchOptions = [
    { value: "none", label: t("all_branches_option") },
    ...(branchesQuery.data?.items ?? []).map((b) => ({
      value: b.id,
      label: b.branchName,
    })),
  ]

  const typeOptions = [
    { value: "PUBLIC", label: t("types.PUBLIC") },
    { value: "COMPANY", label: t("types.COMPANY") },
    { value: "OPTIONAL", label: t("types.OPTIONAL") },
  ]

  if (isEdit && holidayQuery.isFetched && !holiday) {
    return <NotFoundState backTo="/holidays" backLabel={t("title")} />
  }

  return (
    <section className="flex flex-col gap-8 pb-6">
      <FormPageHeader
        title={isEdit ? t("form.edit_title") : t("form.create_title")}
        subtitle={isEdit ? holiday?.holidayName : t("subtitle")}
      />
      <form
        noValidate
        className={formStackClassName}
        onSubmit={handleSubmit(async (values) => {
          const branchId = values.branchId === "none" ? null : values.branchId
          try {
            if (isEdit && id) {
              await updateMutation.mutateAsync({
                id,
                input: {
                  holidayName: values.holidayName.trim(),
                  startDate: values.startDate,
                  endDate: values.endDate,
                  branchId,
                  holidayType: values.holidayType,
                  isPaid: values.isPaid,
                },
              })
              toast.success(t("form.save"))
            } else {
              await createMutation.mutateAsync({
                holidayName: values.holidayName.trim(),
                startDate: values.startDate,
                endDate: values.endDate,
                branchId,
                holidayType: values.holidayType,
                isPaid: values.isPaid,
              })
              toast.success(t("form.create"))
              finishCreate(() =>
                reset({
                  holidayName: "",
                  startDate: "",
                  endDate: "",
                  branchId: "none",
                  holidayType: "PUBLIC",
                  isPaid: true,
                })
              )
              return
            }
            void navigate("/holidays")
          } catch (error) {
            if (!applyApiFieldErrors(error, setError)) {
              notifyApiError(error)
            }
          }
        })}
      >
        <FormSection legend={t("sections.details")}>
          {isLoading ? (
            <FormSkeleton fields={4} columns={2} />
          ) : (
            <FormFieldGrid>
              <FormTextInput
                control={control}
                name="holidayName"
                required
                label={t("form.name")}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="holidayType"
                label={t("form.type")}
                options={typeOptions}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="startDate"
                type="date"
                required
                label={t("form.start_date")}
                disabled={isPending}
              />
              <FormTextInput
                control={control}
                name="endDate"
                type="date"
                required
                label={t("form.end_date")}
                disabled={isPending}
              />
              <FormSelectInput
                control={control}
                name="branchId"
                label={t("form.branch")}
                options={branchOptions}
                disabled={isPending}
              />
              <div className="pt-2">
                <FormSwitchInput
                  control={control}
                  name="isPaid"
                  label={t("form.is_paid")}
                  disabled={isPending}
                />
              </div>
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
            onClick={() => void navigate("/holidays")}
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
